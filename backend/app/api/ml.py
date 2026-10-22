from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date
from typing import Dict, Any
from app.core.database import get_db
from app.models.models import User, Transaction, Category, Budget
from app.schemas.schemas import (
    SpendingForecastRequest, SpendingForecastResponse,
    BudgetRiskRequest, BudgetRiskResponse, SpendingClusterResponse,
    AnomalyCheckRequest, AnomalyCheckResponse
)
from app.services.ml_service import ml_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/ml", tags=["Machine Learning Intelligence"])

@router.get("/insights")
def get_user_ml_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Computes personalized ML intelligence for the logged-in user using all 4 models:
    - Regression (Next month's expense prediction)
    - Classification (Current month budget risk)
    - Clustering (User financial persona)
    - Anomaly status
    """
    today = date.today()
    current_month = today.month
    current_year = today.year

    # 1. Gather this month's stats
    this_month_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).scalar() or 0.0

    prev_month = 12 if current_month == 1 else current_month - 1
    prev_year = current_year - 1 if current_month == 1 else current_year
    prev_month_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        extract('month', Transaction.date) == prev_month,
        extract('year', Transaction.date) == prev_year
    ).scalar() or float(this_month_expense) or 15000.0

    txn_count = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).scalar() or 1

    # Total historical transaction count (for cold start detection)
    total_txn_count = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit"
    ).scalar() or 0

    income = float(current_user.monthly_income) if current_user.monthly_income > 0 else 50000.0

    # COLD START CHECK: if user has very few transactions, return insufficient data
    if total_txn_count < 3:
        return {
            "spending_forecast": {
                "predicted_expense": 0.0,
                "insufficient_data": True,
                "message": "Add more transactions to unlock spending forecasts. At least a few weeks of expense data is needed.",
                "insights": [],
                "input_data": {},
                "explanation": ""
            },
            "budget_risk": {
                "risk_level": "Unknown",
                "insufficient_data": True,
                "message": "Add more transactions to assess budget risk.",
                "risk_probability": 0.0,
                "projected_month_end_spending": 0.0,
                "budget_usage_percentage": 0.0,
                "advice": "",
                "input_data": {},
                "explanation": ""
            },
            "persona_segment": {
                "cluster_id": -1,
                "persona": "New User",
                "insufficient_data": True,
                "message": "Add more transactions to reveal your spending persona.",
                "description": "",
                "recommendations": [],
                "input_data": {},
                "explanation": ""
            },
            "recent_anomalies": []
        }

    # Category breakdowns — same time window as tot_exp (current month only)
    cat_expenses = db.query(
        Category.name,
        func.sum(Transaction.amount)
    ).join(Transaction, Transaction.category_id == Category.id).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).group_by(Category.name).all()

    cat_map = {name.lower(): float(amt) for name, amt in cat_expenses}
    food_exp  = cat_map.get("food", cat_map.get("food & dining", 0.0))
    shop_exp  = cat_map.get("shopping", 0.0)
    trav_exp  = cat_map.get("travel", cat_map.get("travel & commute", 0.0))
    ent_exp   = cat_map.get("entertainment", 0.0)
    others_exp = sum(
        v for k, v in cat_map.items()
        if k not in ["food", "food & dining", "shopping", "travel", "travel & commute", "entertainment"]
    )

    # Compute real monthly expense history for last 6 months (matching feature engineering)
    monthly_expenses = []
    for i in range(1, 7):
        m = (current_month - i) % 12
        if m == 0:
            m = 12
        y = current_year if (current_month - i) > 0 else current_year - 1

        m_exp = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.direction == "debit",
            extract('month', Transaction.date) == m,
            extract('year', Transaction.date) == y
        ).scalar()
        monthly_expenses.append(float(m_exp) if m_exp else 0.0)

    # monthly_expenses[0] = 1 month ago, [1] = 2 months ago, ... [5] = 6 months ago
    # previous_month_expense = monthly_expenses[0] (already computed above, but use this for consistency)
    prev_exp = monthly_expenses[0] if monthly_expenses[0] > 0 else float(prev_month_expense)

    # 3-month average: mean of lag 1, 2, 3
    three_month_values = [v for v in monthly_expenses[:3] if v > 0]
    three_month_avg = sum(three_month_values) / len(three_month_values) if three_month_values else prev_exp

    # 6-month average: mean of lag 1-6
    six_month_values = [v for v in monthly_expenses if v > 0]
    six_month_avg = sum(six_month_values) / len(six_month_values) if six_month_values else prev_exp

    # expense_trend = previous_month_expense - 3_month_avg_expense (same as feature engineering)
    expense_trend = prev_exp - three_month_avg

    # 1. Run Regression (Spending Forecast)
    reg_features = {
        'previous_month_expense': prev_exp,
        '3_month_avg_expense': three_month_avg,
        '6_month_avg_expense': six_month_avg,
        'monthly_income': income,
        'monthly_savings': max(0.0, income - float(this_month_expense)),
        'transaction_count': int(txn_count),
        'avg_transaction_amount': float(this_month_expense) / max(1, txn_count),
        'food_expense': food_exp,
        'shopping_expense': shop_exp,
        'travel_expense': trav_exp,
        'entertainment_expense': ent_exp,
        'others_expense': others_exp,
        'expense_trend': expense_trend
    }
    spending_forecast = ml_service.predict_spending(reg_features)

    # 2. Run Classification (Budget Risk)
    budget_record = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id.is_(None),
        Budget.month == current_month,
        Budget.year == current_year
    ).first()
    monthly_budget = budget_record.amount if budget_record else (income * 0.7)

    clf_features = {
        "current_spending": float(this_month_expense),
        "monthly_budget": monthly_budget,
        "income": income,
        "previous_month_expense": float(prev_month_expense),
        "category_spending": food_exp
    }
    budget_risk = ml_service.predict_budget_risk(clf_features)

    # 3. Run Clustering (User Persona)
    tot_exp = max(1.0, float(this_month_expense))

    # avg_transaction_amount: use historical overall avg if current month is sparse
    historical_avg_query = db.query(func.avg(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit"
    ).scalar()
    historical_avg = float(historical_avg_query) if historical_avg_query else (tot_exp / max(1, txn_count))

    # Compute ratios — clamp each between 0 and 1, ensure they sum to ~1
    total_categorised = food_exp + shop_exp + trav_exp + ent_exp + others_exp
    # If no category data at all, use equal distribution as neutral fallback
    if total_categorised == 0:
        food_r = shop_r = trav_r = ent_r = other_r = 0.2
    else:
        denom = max(total_categorised, 1.0)
        food_r  = min(1.0, food_exp  / denom)
        shop_r  = min(1.0, shop_exp  / denom)
        trav_r  = min(1.0, trav_exp  / denom)
        ent_r   = min(1.0, ent_exp   / denom)
        other_r = min(1.0, others_exp / denom)

    clu_features = {
        "monthly_income": income,
        "monthly_expense": tot_exp,
        "avg_transaction_amount": historical_avg,
        "transaction_frequency": float(txn_count),
        "food_ratio": food_r,
        "shopping_ratio": shop_r,
        "travel_ratio": trav_r,
        "entertainment_ratio": ent_r,
        "other_ratio": other_r
    }
    user_cluster = ml_service.segment_user(clu_features)

    # 4. Check Recent Anomalies
    anomalous_txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.is_anomaly == True
    ).order_by(Transaction.date.desc()).limit(3).all()

    anomaly_alerts = []
    for a in anomalous_txns:
        cat_name = a.category.name if a.category else "General"

        # Recompute user and category averages for this transaction (for input_data display)
        u_avg = db.query(func.avg(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.direction == "debit"
        ).scalar() or float(a.amount)

        c_avg = db.query(func.avg(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category_id == a.category_id
        ).scalar() if a.category_id else u_avg
        c_avg = float(c_avg) if c_avg else float(u_avg)

        ratio_user = round(float(a.amount) / u_avg, 2) if u_avg > 0 else 1.0

        anomaly_alerts.append({
            "id": a.id,
            "amount": a.amount,
            "date": a.date.isoformat(),
            "category": cat_name,
            "note": a.note,
            "anomaly_score": a.anomaly_score,
            "input_data": {
                "amount": float(a.amount),
                "category": cat_name.lower(),
                "your_average_transaction": round(float(u_avg), 2),
                "your_average_in_this_category": round(c_avg, 2),
                "this_transaction_vs_your_average": f"{ratio_user}x",
            }
        })

    return {
        "spending_forecast": spending_forecast,
        "budget_risk": budget_risk,
        "persona_segment": user_cluster,
        "recent_anomalies": anomaly_alerts
    }

@router.post("/predict-spending", response_model=SpendingForecastResponse)
def custom_spending_forecast(req: SpendingForecastRequest):
    return ml_service.predict_spending(req.model_dump())

@router.post("/predict-budget-risk", response_model=BudgetRiskResponse)
def custom_budget_risk(req: BudgetRiskRequest):
    return ml_service.predict_budget_risk(req.model_dump(exclude_unset=True))

@router.post("/check-anomaly", response_model=AnomalyCheckResponse)
def check_transaction_anomaly(
    req: AnomalyCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get real user average and category average from DB
    user_avg_query = db.query(func.avg(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit"
    ).scalar()
    user_avg = float(user_avg_query) if user_avg_query else None

    total_debit_count = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit"
    ).scalar() or 0

    # Try to find category by name to get category-specific average
    cat_avg = user_avg
    if req.category:
        category = db.query(Category).filter(
            Category.name.ilike(req.category),
            (Category.user_id == current_user.id) | (Category.user_id.is_(None))
        ).first()
        if category:
            cat_avg_query = db.query(func.avg(Transaction.amount)).filter(
                Transaction.user_id == current_user.id,
                Transaction.category_id == category.id
            ).scalar()
            if cat_avg_query:
                cat_avg = float(cat_avg_query)

    user_history = {}
    if user_avg is not None:
        user_history["avg_amount"] = user_avg
    if cat_avg is not None:
        user_history["cat_avg"] = cat_avg
    user_history["total_txn_count"] = total_debit_count

    result = ml_service.check_anomaly(
        {
            "amount": req.amount,
            "category": req.category,
            "payment_method": req.payment_method,
            "balance": req.balance
        },
        user_history=user_history if user_history else None
    )
    return result

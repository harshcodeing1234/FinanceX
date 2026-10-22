from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.models import User, Transaction, Category, Budget, SavingsGoal
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

@router.get("/dashboard")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    current_month = today.month
    current_year = today.year

    # 1. Total income & expense this month
    this_month_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "credit",
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).scalar() or 0.0

    this_month_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).scalar() or 0.0

    # If user has configured monthly_income and no salary transaction logged yet, show configured income
    display_income = max(float(this_month_income), float(current_user.monthly_income))
    net_savings = display_income - float(this_month_expense)
    savings_rate = (net_savings / display_income * 100.0) if display_income > 0 else 0.0

    # 2. Overall budget
    overall_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id.is_(None),
        Budget.month == current_month,
        Budget.year == current_year
    ).first()
    budget_limit = overall_budget.amount if overall_budget else (display_income * 0.7 if display_income > 0 else 30000.0)
    budget_used_pct = (float(this_month_expense) / budget_limit * 100.0) if budget_limit > 0 else 0.0

    # 3. Category Breakdown (Expenses this month)
    category_rows = db.query(
        Category.name,
        Category.color,
        Category.icon,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction, Transaction.category_id == Category.id).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).group_by(Category.name, Category.color, Category.icon).all()

    category_breakdown = [
        {"name": r[0], "color": r[1], "icon": r[2], "amount": round(float(r[3]), 2)}
        for r in category_rows
    ]

    # 4. Monthly Trend (Last 6 months)
    monthly_trends = []
    for i in range(5, -1, -1):
        # Calculate target month and year
        m = (current_month - i - 1) % 12 + 1
        y = current_year if current_month - i > 0 else current_year - 1
        month_name = date(y, m, 1).strftime("%b")

        m_expense = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.direction == "debit",
            extract('month', Transaction.date) == m,
            extract('year', Transaction.date) == y
        ).scalar() or 0.0

        m_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.direction == "credit",
            extract('month', Transaction.date) == m,
            extract('year', Transaction.date) == y
        ).scalar() or 0.0

        monthly_trends.append({
            "month": month_name,
            "expense": round(float(m_expense), 2),
            "income": round(float(m_income) if float(m_income) > 0 else display_income, 2)
        })

    # 5. Recent Transactions
    recent_txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc(), Transaction.id.desc()).limit(5).all()

    recent_list = [
        {
            "id": t.id,
            "amount": t.amount,
            "direction": t.direction,
            "category": t.category.name if t.category else "General",
            "date": t.date.isoformat(),
            "note": t.note,
            "payment_method": t.payment_method,
            "is_anomaly": t.is_anomaly
        }
        for t in recent_txns
    ]

    # 6. Savings Goals summary
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()
    total_goal_target = sum(g.target_amount for g in goals)
    total_goal_saved = sum(g.current_amount for g in goals)

    return {
        "summary": {
            "monthly_income": round(display_income, 2),
            "monthly_expense": round(float(this_month_expense), 2),
            "net_savings": round(net_savings, 2),
            "savings_rate": round(savings_rate, 1),
            "budget_limit": round(budget_limit, 2),
            "budget_used_pct": round(budget_used_pct, 1),
            "budget_remaining": round(max(0.0, budget_limit - float(this_month_expense)), 2)
        },
        "category_breakdown": category_breakdown,
        "monthly_trends": monthly_trends,
        "recent_transactions": recent_list,
        "goals_overview": {
            "total_goals": len(goals),
            "total_target": round(total_goal_target, 2),
            "total_saved": round(total_goal_saved, 2),
            "overall_progress": round((total_goal_saved / total_goal_target * 100.0) if total_goal_target > 0 else 0.0, 1)
        }
    }

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.models import User, Budget, Transaction, Category
from app.schemas.schemas import BudgetCreate, BudgetResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_date = date.today()
    target_month = month or current_date.month
    target_year = year or current_date.year

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == target_month,
        Budget.year == target_year
    ).all()

    results = []
    for b in budgets:
        # Calculate spending in this month/year for this budget
        spending_query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.direction == "debit",
            extract('month', Transaction.date) == target_month,
            extract('year', Transaction.date) == target_year
        )
        if b.category_id:
            spending_query = spending_query.filter(Transaction.category_id == b.category_id)

        spent = float(spending_query.scalar() or 0.0)
        remaining = max(0.0, b.amount - spent)
        usage_pct = (spent / b.amount * 100.0) if b.amount > 0 else 0.0

        results.append({
            "id": b.id,
            "category_id": b.category_id,
            "category_name": b.category.name if b.category else "Total Overall Budget",
            "amount": b.amount,
            "spent": round(spent, 2),
            "remaining": round(remaining, 2),
            "usage_percentage": round(usage_pct, 1),
            "month": b.month,
            "year": b.year
        })
    return results

@router.post("", response_model=BudgetResponse)
def set_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if budget already exists for this category/month/year
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_in.category_id,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()

    if existing:
        existing.amount = budget_in.amount
        budget = existing
    else:
        budget = Budget(
            user_id=current_user.id,
            category_id=budget_in.category_id,
            amount=budget_in.amount,
            month=budget_in.month,
            year=budget_in.year
        )
        db.add(budget)
    
    db.commit()
    db.refresh(budget)

    # Calculate current spent
    spending_query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        extract('month', Transaction.date) == budget.month,
        extract('year', Transaction.date) == budget.year
    )
    if budget.category_id:
        spending_query = spending_query.filter(Transaction.category_id == budget.category_id)

    spent = float(spending_query.scalar() or 0.0)
    remaining = max(0.0, budget.amount - spent)
    usage_pct = (spent / budget.amount * 100.0) if budget.amount > 0 else 0.0

    return {
        "id": budget.id,
        "category_id": budget.category_id,
        "category_name": budget.category.name if budget.category else "Total Overall Budget",
        "amount": budget.amount,
        "spent": round(spent, 2),
        "remaining": round(remaining, 2),
        "usage_percentage": round(usage_pct, 1),
        "month": budget.month,
        "year": budget.year
    }

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(b)
    db.commit()
    return {"message": "Budget deleted successfully"}

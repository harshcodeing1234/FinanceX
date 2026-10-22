from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.models.models import User, Transaction, Category
from app.schemas.schemas import TransactionCreate, TransactionResponse
from app.services.ml_service import ml_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    direction: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if direction:
        query = query.filter(Transaction.direction == direction)
        
    transactions = query.order_by(Transaction.date.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()

    result = []
    for t in transactions:
        t_dict = {
            "id": t.id,
            "user_id": t.user_id,
            "category_id": t.category_id,
            "category_name": t.category.name if t.category else "General",
            "amount": t.amount,
            "direction": t.direction,
            "date": t.date,
            "time": t.time,
            "note": t.note,
            "payment_method": t.payment_method,
            "is_anomaly": t.is_anomaly,
            "anomaly_score": t.anomaly_score,
            "created_at": t.created_at
        }
        result.append(t_dict)
    return result

@router.post("", response_model=TransactionResponse)
def create_transaction(
    txn_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = None
    if txn_in.category_id:
        category = db.query(Category).filter(Category.id == txn_in.category_id).first()
    elif txn_in.category_name:
        category = db.query(Category).filter(
            Category.name.ilike(txn_in.category_name),
            (Category.user_id == current_user.id) | (Category.user_id.is_(None))
        ).first()

    # Calculate user average transaction metrics for ML Anomaly Detection
    user_avg_query = db.query(func.avg(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == txn_in.direction
    ).scalar()
    user_avg = float(user_avg_query) if user_avg_query else txn_in.amount

    # Count total historical debit transactions for reliability check
    total_debit_count = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit"
    ).scalar() or 0

    cat_avg = user_avg
    if category:
        cat_avg_query = db.query(func.avg(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category_id == category.id
        ).scalar()
        if cat_avg_query:
            cat_avg = float(cat_avg_query)

    user_history = {
        "avg_amount": user_avg,
        "cat_avg": cat_avg,
        "total_txn_count": total_debit_count
    }

    # Compute real transaction_frequency (this month's debit count)
    today = date.today()
    txn_frequency = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        extract('month', Transaction.date) == today.month,
        extract('year', Transaction.date) == today.year
    ).scalar() or 1

    # Compute recent_transaction_count (last 7 days)
    seven_days_ago = today - timedelta(days=7)
    recent_count = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == current_user.id,
        Transaction.direction == "debit",
        Transaction.date >= seven_days_ago
    ).scalar() or 0

    # Evaluate ML Anomaly detection for debit transactions
    is_anomaly = False
    anomaly_score = 0.0
    if txn_in.direction == "debit":
        check_result = ml_service.check_anomaly(
            {
                "amount": txn_in.amount,
                "category": category.name if category else "General",
                "payment_method": txn_in.payment_method,
                "transaction_frequency": float(txn_frequency),
                "recent_transaction_count": float(recent_count)
            },
            user_history=user_history
        )
        is_anomaly = check_result["is_anomaly"]
        anomaly_score = check_result["anomaly_score"]

    txn_date = txn_in.date
    if txn_date:
        if isinstance(txn_date, str):
            try:
                txn_date = date.fromisoformat(txn_date)
            except Exception:
                txn_date = date.today()
    else:
        txn_date = date.today()

    transaction = Transaction(
        user_id=current_user.id,
        category_id=category.id if category else None,
        amount=txn_in.amount,
        direction=txn_in.direction,
        date=txn_date,
        time=txn_in.time or datetime.now().strftime("%H:%M"),
        note=txn_in.note or "",
        payment_method=txn_in.payment_method or "UPI",
        is_anomaly=is_anomaly,
        anomaly_score=anomaly_score
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "category_id": transaction.category_id,
        "category_name": category.name if category else "General",
        "amount": transaction.amount,
        "direction": transaction.direction,
        "date": transaction.date,
        "time": transaction.time,
        "note": transaction.note,
        "payment_method": transaction.payment_method,
        "is_anomaly": transaction.is_anomaly,
        "anomaly_score": transaction.anomaly_score,
        "created_at": transaction.created_at
    }

@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(txn)
    db.commit()
    return {"message": "Transaction deleted successfully"}

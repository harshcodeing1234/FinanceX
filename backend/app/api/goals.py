from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.core.database import get_db
from app.models.models import User, SavingsGoal
from app.schemas.schemas import GoalCreate, GoalUpdate, GoalResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/goals", tags=["Savings Goals"])

@router.get("", response_model=List[GoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at.desc()).all()
    results = []
    for g in goals:
        progress = (g.current_amount / g.target_amount * 100.0) if g.target_amount > 0 else 0.0
        results.append({
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "progress_percentage": round(min(100.0, progress), 1),
            "target_date": g.target_date,
            "status": "completed" if g.current_amount >= g.target_amount else g.status,
            "created_at": g.created_at
        })
    return results

@router.post("", response_model=GoalResponse)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_date = goal_in.target_date
    if isinstance(target_date, str):
        try:
            target_date = date.fromisoformat(target_date)
        except Exception:
            target_date = None

    goal = SavingsGoal(
        user_id=current_user.id,
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount or 0.0,
        target_date=target_date,
        status="completed" if (goal_in.current_amount or 0.0) >= goal_in.target_amount else "in_progress"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    progress = (goal.current_amount / goal.target_amount * 100.0) if goal.target_amount > 0 else 0.0
    return {
        "id": goal.id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "progress_percentage": round(min(100.0, progress), 1),
        "target_date": goal.target_date,
        "status": goal.status,
        "created_at": goal.created_at
    }

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_up: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if goal_up.name is not None:
        goal.name = goal_up.name
    if goal_up.target_amount is not None:
        goal.target_amount = goal_up.target_amount
    if goal_up.current_amount is not None:
        goal.current_amount = goal_up.current_amount
    if goal_up.target_date is not None:
        t_date = goal_up.target_date
        if isinstance(t_date, str):
            try:
                t_date = date.fromisoformat(t_date)
            except Exception:
                t_date = None
        goal.target_date = t_date
    if goal_up.status is not None:
        goal.status = goal_up.status
    
    if goal.current_amount >= goal.target_amount:
        goal.status = "completed"

    db.commit()
    db.refresh(goal)

    progress = (goal.current_amount / goal.target_amount * 100.0) if goal.target_amount > 0 else 0.0
    return {
        "id": goal.id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "progress_percentage": round(min(100.0, progress), 1),
        "target_date": goal.target_date,
        "status": goal.status,
        "created_at": goal.created_at
    }

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}

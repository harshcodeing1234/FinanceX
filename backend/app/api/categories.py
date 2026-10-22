from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User, Category
from app.schemas.schemas import CategoryCreate, CategoryResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    categories = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.user_id.is_(None))
    ).all()
    return categories

@router.post("", response_model=CategoryResponse)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = Category(
        user_id=current_user.id,
        name=cat_in.name,
        type=cat_in.type,
        icon=cat_in.icon or "Tag",
        color=cat_in.color or "#6366F1"
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

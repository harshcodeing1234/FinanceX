from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.models import User, Category
from app.schemas.schemas import UserRegister, UserLogin, UserResponse, Token, UserUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

DEFAULT_CATEGORIES = [
    {"name": "Food", "type": "all", "icon": "Utensils", "color": "#EF4444"},
    {"name": "Shopping", "type": "all", "icon": "ShoppingBag", "color": "#F59E0B"},
    {"name": "Travel", "type": "all", "icon": "Car", "color": "#3B82F6"},
    {"name": "Entertainment", "type": "all", "icon": "Film", "color": "#8B5CF6"},
    {"name": "Others", "type": "all", "icon": "MoreHorizontal", "color": "#6B7280"},
]

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    hashed_pwd = hash_password(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pwd,
        currency=user_in.currency or "INR",
        monthly_income=user_in.monthly_income or 0.0
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default categories for user
    for cat_data in DEFAULT_CATEGORIES:
        category = Category(
            user_id=user.id,
            name=cat_data["name"],
            type=cat_data["type"],
            icon=cat_data["icon"],
            color=cat_data["color"]
        )
        db.add(category)
    db.commit()

    token = create_access_token(user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = create_access_token(user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.currency is not None:
        current_user.currency = user_update.currency
    if user_update.monthly_income is not None:
        current_user.monthly_income = user_update.monthly_income
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

from pydantic import BaseModel, Field
from datetime import date as dt_date, datetime as dt_datetime
from typing import Optional, List, Union

# ----------------- Auth & User Schemas -----------------
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    password: str = Field(..., min_length=6)
    currency: Optional[str] = "INR"
    monthly_income: Optional[float] = 0.0

class UserLogin(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    currency: str
    monthly_income: float
    avatar: Optional[str] = None
    created_at: dt_datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    monthly_income: Optional[float] = None
    avatar: Optional[str] = None


# ----------------- Category Schemas -----------------
class CategoryCreate(BaseModel):
    name: str
    type: str = "expense"
    icon: Optional[str] = "Tag"
    color: Optional[str] = "#6366F1"

class CategoryResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    type: str
    icon: str
    color: str

    class Config:
        from_attributes = True


# ----------------- Transaction Schemas -----------------
class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    direction: str = Field("debit", pattern="^(debit|credit)$")
    category_id: Optional[int] = None
    category_name: Optional[str] = None  # Friendly category fallback
    date: Optional[Union[dt_date, str]] = None
    time: Optional[str] = "12:00"
    note: Optional[str] = ""
    payment_method: Optional[str] = "UPI"

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    category_id: Optional[int]
    category_name: Optional[str] = None
    amount: float
    direction: str
    date: dt_date
    time: Optional[str]
    note: Optional[str]
    payment_method: Optional[str]
    is_anomaly: bool
    anomaly_score: Optional[float]
    created_at: dt_datetime

    class Config:
        from_attributes = True


# ----------------- Budget Schemas -----------------
class BudgetCreate(BaseModel):
    category_id: Optional[int] = None
    amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)

class BudgetResponse(BaseModel):
    id: int
    category_id: Optional[int]
    category_name: Optional[str] = None
    amount: float
    spent: float = 0.0
    remaining: float = 0.0
    usage_percentage: float = 0.0
    month: int
    year: int

    class Config:
        from_attributes = True


# ----------------- Savings Goal Schemas -----------------
class GoalCreate(BaseModel):
    name: str
    target_amount: float = Field(..., gt=0)
    current_amount: Optional[float] = 0.0
    target_date: Optional[Union[dt_date, str]] = None

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[Union[dt_date, str]] = None
    status: Optional[str] = None

class GoalResponse(BaseModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    progress_percentage: float = 0.0
    target_date: Optional[dt_date]
    status: str
    created_at: dt_datetime

    class Config:
        from_attributes = True


# ----------------- ML Schemas -----------------
class SpendingForecastRequest(BaseModel):
    previous_month_expense: Optional[float] = None
    three_month_avg_expense: Optional[float] = None
    six_month_avg_expense: Optional[float] = None
    monthly_income: Optional[float] = None
    monthly_savings: Optional[float] = None
    transaction_count: Optional[int] = None
    avg_transaction_amount: Optional[float] = None
    food_expense: Optional[float] = 0.0
    shopping_expense: Optional[float] = 0.0
    travel_expense: Optional[float] = 0.0
    entertainment_expense: Optional[float] = 0.0
    others_expense: Optional[float] = 0.0
    expense_trend: Optional[float] = 0.0

class SpendingForecastResponse(BaseModel):
    predicted_expense: float
    insights: List[str] = []
    input_data: Optional[dict] = None
    explanation: Optional[str] = None
    insufficient_data: Optional[bool] = False
    message: Optional[str] = None

class BudgetRiskRequest(BaseModel):
    current_spending: Optional[float] = None
    monthly_budget: Optional[float] = None
    income: Optional[float] = None
    previous_month_expense: Optional[float] = None
    category_spending: Optional[float] = None

class BudgetRiskResponse(BaseModel):
    risk_level: str  # "High Risk", "Moderate Risk", "Safe", "Unknown"
    risk_probability: float
    projected_month_end_spending: float
    budget_usage_percentage: float
    advice: str
    input_data: Optional[dict] = None
    explanation: Optional[str] = None
    insufficient_data: Optional[bool] = False
    message: Optional[str] = None

class SpendingClusterResponse(BaseModel):
    cluster_id: int
    persona: str
    description: str
    recommendations: List[str]
    input_data: Optional[dict] = None
    explanation: Optional[str] = None
    insufficient_data: Optional[bool] = False
    message: Optional[str] = None

class AnomalyCheckRequest(BaseModel):
    amount: float
    category: str
    payment_method: Optional[str] = "UPI"
    balance: Optional[float] = 50000.0

class AnomalyCheckResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    message: str
    severity: str  # "Normal", "Warning", "Critical"
    input_data: Optional[dict] = None
    explanation: Optional[str] = None

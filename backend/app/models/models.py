from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    currency = Column(String(10), default="INR")
    monthly_income = Column(Float, default=0.0)
    avatar = Column(Text, nullable=True)  # base64 encoded profile photo
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    custom_categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null if system category
    name = Column(String(50), nullable=False)
    type = Column(String(20), default="expense")  # 'expense' or 'income'
    icon = Column(String(50), default="Tag")
    color = Column(String(20), default="#6366F1")

    user = relationship("User", back_populates="custom_categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    amount = Column(Float, nullable=False)
    direction = Column(String(10), default="debit")  # 'debit' (expense) or 'credit' (income)
    date = Column(Date, default=date.today, nullable=False, index=True)
    time = Column(String(10), default="12:00")
    note = Column(String(255), default="")
    payment_method = Column(String(50), default="UPI")  # UPI, Card, Cash, NetBanking
    
    # ML flag: is marked as an unusual / anomaly transaction
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)  # Null for monthly overall
    amount = Column(Float, nullable=False)
    month = Column(Integer, nullable=False)  # 1 to 12
    year = Column(Integer, nullable=False)   # e.g., 2026
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(Date, nullable=True)
    status = Column(String(20), default="in_progress")  # 'in_progress', 'completed', 'paused'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")

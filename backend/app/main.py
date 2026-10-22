from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, categories, transactions, budgets, goals, analytics, ml

# Create tables in SQLite / DB
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="FinanceX API — Intelligent Personal Finance Management with Integrated ML Intelligence",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup for Frontend (e.g. Vite React on 5173 / 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(categories.router, prefix=api_prefix)
app.include_router(transactions.router, prefix=api_prefix)
app.include_router(budgets.router, prefix=api_prefix)
app.include_router(goals.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(ml.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "message": "Welcome to FinanceX API",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # .../backend
PROJECT_ROOT = BASE_DIR.parent                          # .../FinanceX
load_dotenv(BASE_DIR / ".env")

def _resolve_ml_dir() -> Path:
    env_val = os.getenv("ML_MODELS_DIR")
    if env_val:
        p = Path(env_val)
        if p.is_absolute() and p.exists():
            return p
        # Check relative to BASE_DIR (e.g. backend/../ML/model)
        if (BASE_DIR / p).exists():
            return (BASE_DIR / p).resolve()
        # Check relative to PROJECT_ROOT
        if (PROJECT_ROOT / p).exists():
            return (PROJECT_ROOT / p).resolve()
    # Default fallback
    default_path = (PROJECT_ROOT / "ML" / "model").resolve()
    if default_path.exists():
        return default_path
    return (BASE_DIR / "ML" / "model").resolve()

def _resolve_db_url() -> str:
    db_url = os.getenv("DATABASE_URL")
    if not db_url or db_url == "sqlite:///./financex.db":
        # Anchor to a stable absolute path at project root so cwd does not cause dual DBs
        db_path = (PROJECT_ROOT / "financex.db").resolve()
        return f"sqlite:///{db_path}"
    return db_url

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "FinanceX API")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "financex-super-secret-jwt-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))
    
    # SQLite default, or PostgreSQL if provided
    DATABASE_URL: str = _resolve_db_url()
    
    # Path to trained models
    ML_MODELS_DIR: Path = _resolve_ml_dir()

settings = Settings()

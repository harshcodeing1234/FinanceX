# FinanceX

> **Intelligent Personal Finance Management — All in One Place**

FinanceX is a full-stack personal finance web app that helps users track income, expenses, budgets, and savings goals — powered by an integrated ML intelligence layer that predicts future spending, assesses budget risk, segments spending behavior, and detects unusual transactions in real time.

---

## Screenshots

![FinanceX Dashboard Collage](./img/FinanceX%20Personal%20Finance%20Dashboard%20Collage.png)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Pages & Navigation](#pages--navigation)
- [API Reference](#api-reference)
- [ML Models](#ml-models)
- [Spending Personas](#spending-personas)
- [Authentication](#authentication)
- [Notifications](#notifications)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [License](#license)

---

## Features

### Core Finance Management

- **Dashboard** — Monthly income, expenses, net savings, budget usage percentage, 6-month area chart, category donut chart, and recent transactions. Includes an AI banner showing the latest ML insight.
- **Transactions** — Log income (credit) and expenses (debit) with category, payment method, date, time, and notes. Filter by direction, category, and time period (This Month / Last Month / Last 30 Days / Last 90 Days / This Year / All Time). Delete with confirmation. Anomalous transactions are visually flagged.
- **Budgets** — Set an overall monthly budget or per-category limits. View live usage progress bars, amount spent, and amount remaining. Budgets are month/year scoped. Creating a budget for an existing month/category updates it in place.
- **Savings Goals** — Create goals with a name, target amount, and optional deadline. Deposit funds incrementally. Track completion percentage and status (in progress / completed). Smart icons based on goal name keywords (laptop, travel, bike, etc.).
- **Analytics** — Tabbed view with Overview, Income vs Expense, Category Analysis, and Trends tabs. Paired bar chart for 6-month income vs expense. Donut chart with category breakdown and percentage list.
- **Categories** — 5 system default categories (Food, Shopping, Travel, Entertainment, Others) created on registration. Create custom categories with a name, type (expense / income), icon, and color.

### ML Intelligence (`/ai-insights`)

| Model | Algorithm | What it does |
|---|---|---|
| **Spending Forecast** | XGBoost Regressor | Predicts next month's total expense from 13 features: historical lag expenses, category breakdowns, income, savings, and expense trend |
| **Budget Risk** | Classifier (XGBoost/RF) | Classifies current month as Safe / Moderate Risk / High Risk based on daily spending pace and projected month-end total |
| **Spending Persona** | K-Means (k=3) | Segments the user into one of three spending profiles with tailored recommendations |
| **Anomaly Detection** | Isolation Forest | Flags unusual debit transactions at creation time; `is_anomaly` and `anomaly_score` stored per transaction |

All four models are loaded once at server startup. If a model file is missing, the service falls back to rule-based heuristics automatically so the app stays functional.

**Cold-start guards:**
- Fewer than 3 total transactions → all ML insights return an "insufficient data" message
- Fewer than 10 debit transactions → anomaly detection is disabled (always returns `is_anomaly: false`)
- Anomaly sanity guard: transactions under ₹500 or less than 2× the user's own average are never flagged

### Smart Notifications

Auto-generated from real user data on every app load. Deduplicated per user per month using localStorage so the same alert is never shown twice. Types:

| Trigger | Notification |
|---|---|
| ML budget risk = High Risk | Budget overrun warning |
| ML budget risk = Moderate Risk | Budget usage check |
| Transaction flagged as anomaly | Unusual transaction alert |
| Savings goal ≥ 80% complete | Goal milestone celebration |
| Savings goal = 100% complete | Goal achievement alert |
| ML spending forecast available | Forecast summary insight |

### UX & Responsiveness

- Desktop: fixed sidebar + scrollable content area
- Mobile: hamburger drawer sidebar + bottom navigation bar (WhatsApp/Instagram style)
- Avatar upload with in-browser canvas crop (no external library)
- Currency symbol renders throughout the UI based on user setting
- Protected routes — unauthenticated users are redirected to `/login`
- All modals use a shared `DialogContext` for consistent confirm dialogs and toast messages

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v7, Vite 5 |
| Styling | TailwindCSS v3, Plus Jakarta Sans |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP | Axios with JWT request/response interceptors |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database | SQLite (`financex.db`) |
| Auth | bcrypt (password hashing) + PyJWT HS256 (7-day tokens) |
| ML | scikit-learn, XGBoost, joblib, pandas, numpy |
| Dev runner | concurrently (runs both servers from root) |

---

## Project Structure

```
FinanceX/
├── package.json              # Root — concurrently dev runner
├── frontend/                 # React + Vite app
│   ├── vite.config.js        # Vite config — proxies /api to :8000
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx           # Routes, global data fetch, notification generation
│       ├── main.jsx          # App entry — wraps with AuthProvider, NotificationProvider
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── AuthPage.jsx          # Login + Register (shared)
│       │   ├── Dashboard.jsx
│       │   ├── TransactionsPage.jsx
│       │   ├── BudgetsPage.jsx
│       │   ├── GoalsPage.jsx
│       │   ├── AnalyticsPage.jsx
│       │   ├── MLIntelligencePage.jsx
│       │   ├── ProfilePage.jsx
│       │   └── SettingsPage.jsx
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── Sidebar.jsx
│       │   ├── BottomNav.jsx
│       │   ├── Logo.jsx
│       │   ├── AddTransactionModal.jsx
│       │   ├── AddBudgetModal.jsx
│       │   ├── AddGoalModal.jsx
│       │   ├── DepositGoalModal.jsx
│       │   ├── NotificationDropdown.jsx
│       │   └── MLInsightsCard.jsx
│       ├── context/
│       │   ├── AuthContext.jsx         # JWT auth state, login/register/logout/refreshUser
│       │   ├── NotificationContext.jsx # Notification state, localStorage persistence
│       │   └── DialogContext.jsx       # Global confirm dialog + toast system
│       ├── services/
│       │   └── api.js                  # Axios instance + all service modules
│       └── utils/
│           └── currency.js             # getCurrencySymbol(code) helper
├── backend/
│   ├── .env                  # Environment config
│   └── app/
│       ├── main.py           # FastAPI app, CORS, router registration
│       ├── api/
│       │   ├── auth.py
│       │   ├── transactions.py
│       │   ├── categories.py
│       │   ├── budgets.py
│       │   ├── goals.py
│       │   ├── analytics.py
│       │   ├── ml.py
│       │   └── deps.py       # get_current_user dependency
│       ├── models/
│       │   └── models.py     # User, Category, Transaction, Budget, SavingsGoal
│       ├── schemas/
│       │   └── schemas.py    # Pydantic request/response models
│       ├── services/
│       │   └── ml_service.py # MLService singleton — loads and wraps all 4 models
│       └── core/
│           ├── config.py     # Settings (reads from .env)
│           ├── database.py   # SQLAlchemy engine + session
│           └── security.py   # hash_password, verify_password, create/decode JWT
└── ML/
    ├── model/                # Trained .pkl model files
    ├── data/                 # Training datasets (CSV — excluded from git)
    ├── notebook/
    │   ├── Regression/
    │   ├── Classification/
    │   ├── Clustring/
    │   └── Anomaly/
    └── docs/
        ├── FinanceX.documentation.md
        ├── FinanceX.feature_engineering.md
        └── FinanceX.ml_implementation.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+

### 1. Clone the repository

```bash
git clone https://github.com/harshcodeing1234/FinanceX.git
cd FinanceX
```

### 2. Install dependencies

```bash
# Root runner
npm install

# Frontend
npm install --prefix frontend

# Backend
pip install -r backend/requirements.txt
```

### 3. Configure environment

The backend reads from `backend/.env`. A working default is already included:

```env
PROJECT_NAME="FinanceX API"
API_V1_STR="/api/v1"
SECRET_KEY="your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DATABASE_URL="sqlite:///./financex.db"
ML_MODELS_DIR="../ML/model"
```

> **Important:** Change `SECRET_KEY` to a long random string before any public deployment.

### 4. Run

```bash
# Both servers together (recommended)
npm run dev
```

This starts:
- **Backend** — FastAPI on `http://localhost:8000` (with hot reload)
- **Frontend** — Vite on `http://localhost:5173` (proxies `/api` to backend)

Or separately:

```bash
npm run dev:backend
npm run dev:frontend
```

### 5. Open the app

Visit `http://localhost:5173` — register an account and start adding transactions.

Swagger UI (interactive API docs) is available at `http://localhost:8000/docs`.

---

## Pages & Navigation

| Route | Page | Access |
|---|---|---|
| `/` | Landing Page | Public |
| `/login` | Login | Public (redirects to `/dashboard` if logged in) |
| `/register` | Register | Public (redirects to `/dashboard` if logged in) |
| `/dashboard` | Dashboard | Protected |
| `/transactions` | Transactions | Protected |
| `/budgets` | Budgets | Protected |
| `/goals` | Savings Goals | Protected |
| `/analytics` | Analytics | Protected |
| `/ai-insights` | ML Intelligence | Protected |
| `/profile` | Profile | Protected |
| `/settings` | Settings | Protected |

All protected routes share an `AuthenticatedLayout` with a persistent header, sidebar, and mobile bottom nav. Any unknown route redirects to `/dashboard` (logged in) or `/` (not logged in).

---

## API Reference

All endpoints are prefixed with `/api/v1`. All protected endpoints require `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user, returns JWT + user object. Creates 5 default categories. |
| `POST` | `/auth/login` | Login, returns JWT + user object |
| `GET` | `/auth/me` | Get current user profile |
| `PUT` | `/auth/profile` | Update name, currency, monthly_income, avatar (base64) |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/transactions` | List transactions. Query params: `start_date`, `end_date`, `category_id`, `direction`, `limit` (max 200), `offset` |
| `POST` | `/transactions` | Create transaction. Anomaly detection runs automatically for debit transactions. |
| `DELETE` | `/transactions/{id}` | Delete a transaction |

### Categories

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/categories` | List all categories (system + user's custom) |
| `POST` | `/categories` | Create a custom category |

### Budgets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/budgets` | List budgets for a month/year. Query params: `month`, `year` (defaults to current) |
| `POST` | `/budgets` | Set a budget. If one already exists for that category/month/year, it is updated. |
| `DELETE` | `/budgets/{id}` | Delete a budget |

### Savings Goals

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/goals` | List all savings goals with computed `progress_percentage` |
| `POST` | `/goals` | Create a goal |
| `PUT` | `/goals/{id}` | Update a goal (name, target amount, current amount, target date, status). Auto-marks as `completed` when `current_amount >= target_amount`. |
| `DELETE` | `/goals/{id}` | Delete a goal |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/dashboard` | Returns summary stats, category breakdown, 6-month trends, recent 5 transactions, and goals overview |

### ML Intelligence

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/ml/insights` | Runs all 4 models against the current user's real data. Returns spending forecast, budget risk, persona segment, and recent anomalies. |
| `POST` | `/ml/predict-spending` | Custom spending forecast with manually provided feature values |
| `POST` | `/ml/predict-budget-risk` | Custom budget risk prediction |
| `POST` | `/ml/check-anomaly` | Check if a specific transaction is anomalous given user context |

---

## ML Models

| File | Algorithm | Size | Purpose |
|---|---|---|---|
| `FinanceX_regression_model.pkl` | XGBoost Regressor | ~14 MB | Predicts next month's total expense |
| `FinanceX_claassification_model.pkl` | XGBoost / Random Forest | ~400 KB | Monthly budget risk classification |
| `FinanceX_clustering_model.pkl` | K-Means (k=3) + StandardScaler | ~200 KB | User spending persona segmentation |
| `FinanceX_anomaly_model.pkl` | Isolation Forest | ~2.7 MB | Unusual transaction detection |

### Regression Features (13)

`previous_month_expense`, `3_month_avg_expense`, `6_month_avg_expense`, `monthly_income`, `monthly_savings`, `transaction_count`, `avg_transaction_amount`, `food_expense`, `shopping_expense`, `travel_expense`, `entertainment_expense`, `others_expense`, `expense_trend`

### Classification Features (13)

`current_spending`, `days_elapsed`, `avg_daily_spending`, `income`, `previous_month_expense`, `days_remaining`, `projected_month_end_spending`, `monthly_budget`, `budget_usage_percentage`, `budget_remaining`, `category_spending`, `year`, `month`

### Clustering Features (10)

`monthly_income`, `monthly_expense`, `savings_rate`, `avg_transaction_amount`, `transaction_frequency`, `food_ratio`, `shopping_ratio`, `travel_ratio`, `entertainment_ratio`, `other_ratio`

### Anomaly Detection Features (12)

`amount`, `category`, `user_average_amount`, `category_average_amount`, `transaction_frequency`, `balance`, `day_of_week`, `transaction_hour`, `is_weekend`, `amount_vs_user_avg`, `amount_vs_category_avg`, `recent_transaction_count`

---

## Spending Personas

| Cluster | Persona | Profile | Recommendations |
|---|---|---|---|
| 0 | **Disciplined Saver** | High savings rate, low discretionary spend | Automate recurring investments; set ambitious savings milestones |
| 1 | **Balanced Lifestyle Spender** | Moderate savings, healthy distribution across essentials and recreation | Bump savings rate by 5% next quarter; review dining and subscriptions |
| 2 | **High-Velocity Spender** | High transaction frequency, high discretionary ratio | Activate daily transaction limits; apply 48-hour cooling rule for purchases over ₹2,000 |

---

## Authentication

- Passwords hashed with **bcrypt** before storage
- JWT tokens signed with **HS256**, valid for **7 days** (10,080 minutes)
- Token stored in `localStorage` under key `financex_token`
- Axios request interceptor attaches `Authorization: Bearer <token>` to every request automatically
- Axios response interceptor clears localStorage and triggers redirect on any `401` response
- On app load, `AuthContext` re-validates the stored token via `GET /auth/me` to confirm it is still valid

---

## Notifications

Notifications are stored in `localStorage` per user (`financex_notifications_<user_id>`), max 50 entries. Each notification has:

```
id, title, message, type, timestamp, read (bool), link
```

Types: `budget`, `transaction`, `goal`, `ml`, `info`

Deduplication is handled by a separate seen-keys map (`financex_notif_seen_<user_id>`) so the same event never generates a duplicate notification within the same calendar month.

---

## Environment Variables

`backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `PROJECT_NAME` | `FinanceX API` | API title shown in Swagger |
| `API_V1_STR` | `/api/v1` | API route prefix |
| `SECRET_KEY` | *(hardcoded dev key)* | JWT signing secret — **change before deploying** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token lifetime (7 days) |
| `DATABASE_URL` | `sqlite:///./financex.db` | SQLAlchemy database URL |
| `ML_MODELS_DIR` | `../ML/model` | Path to directory containing `.pkl` model files |

`frontend/.env`:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | *(falls back to `/api/v1`)* | Base URL for API calls — override for production deployment |

---

## Scripts

From the project root:

| Command | Description |
|---|---|
| `npm run dev` | Start both backend and frontend concurrently |
| `npm run dev:backend` | Start FastAPI backend only (port 8000) |
| `npm run dev:frontend` | Start Vite frontend only (port 5173) |
| `npm run build` | Build frontend for production |

---

## License

ISC

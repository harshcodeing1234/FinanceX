import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, date
from app.core.config import settings

class MLService:
    def __init__(self):
        self.models_dir = settings.ML_MODELS_DIR
        self.regression_model = None
        self.classification_model = None
        self.clustering_model = None
        self.anomaly_model = None
        self._load_models()

    def _load_models(self):
        # 1. Regression Model
        reg_path = self.models_dir / "FinanceX_regression_model.pkl"
        if reg_path.exists():
            try:
                self.regression_model = joblib.load(reg_path)
                print(f"[MLService] Loaded Regression model from {reg_path}")
            except Exception as e:
                print(f"[MLService] Error loading regression model: {e}")

        # 2. Classification Model
        clf_path = self.models_dir / "FinanceX_claassification_model.pkl"
        if not clf_path.exists():
            clf_path = self.models_dir / "FinanceX_classification_model.pkl"
        if clf_path.exists():
            try:
                self.classification_model = joblib.load(clf_path)
                print(f"[MLService] Loaded Classification model from {clf_path}")
            except Exception as e:
                print(f"[MLService] Error loading classification model: {e}")

        # 3. Clustering Model
        clu_path = self.models_dir / "FinanceX_clustering_model.pkl"
        if clu_path.exists():
            try:
                self.clustering_model = joblib.load(clu_path)
                print(f"[MLService] Loaded Clustering model from {clu_path}")
            except Exception as e:
                print(f"[MLService] Error loading clustering model: {e}")

        # 4. Anomaly Model
        anom_path = self.models_dir / "FinanceX_anomaly_model.pkl"
        if anom_path.exists():
            try:
                self.anomaly_model = joblib.load(anom_path)
                print(f"[MLService] Loaded Anomaly model from {anom_path}")
            except Exception as e:
                print(f"[MLService] Error loading anomaly model: {e}")

    # ==========================
    # 1. SPENDING FORECAST (REGRESSION)
    # ==========================
    def predict_spending(self, features_dict: dict) -> dict:
        """
        Features expected:
        previous_month_expense, 3_month_avg_expense, 6_month_avg_expense,
        monthly_income, monthly_savings, transaction_count, avg_transaction_amount,
        food_expense, shopping_expense, travel_expense, entertainment_expense, others_expense, expense_trend
        """
        # Model was trained with these exact column names (numeric prefix)
        # Input may come as three_month_avg_expense / six_month_avg_expense (schema names)
        # so we map both forms to the model's expected names
        defaults = {
            'previous_month_expense': 25000.0,
            '3_month_avg_expense': 24500.0,
            '6_month_avg_expense': 24000.0,
            'monthly_income': 60000.0,
            'monthly_savings': 15000.0,
            'transaction_count': 35,
            'avg_transaction_amount': 700.0,
            'food_expense': 7500.0,
            'shopping_expense': 5000.0,
            'travel_expense': 3000.0,
            'entertainment_expense': 2500.0,
            'others_expense': 7000.0,
            'expense_trend': 0.05
        }
        
        # Merge given features with defaults
        # Accept both schema names (three_month...) and model names (3_month...)
        payload = {}
        for k, v in defaults.items():
            val = features_dict.get(k)
            if val is None:
                # Try schema-style name
                if k == '3_month_avg_expense':
                    val = features_dict.get('three_month_avg_expense')
                elif k == '6_month_avg_expense':
                    val = features_dict.get('six_month_avg_expense')
            payload[k] = val if val is not None else v

        input_df = pd.DataFrame([payload])

        if self.regression_model:
            try:
                pred = self.regression_model.predict(input_df)[0]
                predicted_val = round(float(pred), 2)
            except Exception as e:
                print(f"[MLService] Regression error: {e}")
                predicted_val = round(payload['previous_month_expense'] * 1.03, 2)
        else:
            predicted_val = round(payload['previous_month_expense'] * 1.03, 2)

        # Generate insights in simple human language
        insights = []
        if payload['monthly_income'] > 0:
            spend_ratio = (predicted_val / payload['monthly_income']) * 100
            if spend_ratio > 80:
                insights.append(f"Next month you might spend around {spend_ratio:.0f}% of your income — that's quite high. Try cutting back on non-essentials.")
            elif spend_ratio < 50:
                insights.append(f"Looks like next month should be a good one — you're likely to spend only around {spend_ratio:.0f}% of your income.")
            else:
                insights.append(f"Next month spending looks normal — roughly {spend_ratio:.0f}% of your income.")

        if payload['food_expense'] > 0.3 * predicted_val:
            insights.append("You're spending a lot on food — it's taking up over 30% of your total expenses.")
        if payload['shopping_expense'] > 0.25 * predicted_val:
            insights.append("Shopping is adding up. It's a bigger chunk of your spending than usual.")

        return {
            "predicted_expense": max(0.0, predicted_val),
            "insights": insights,
            "input_data": payload,
            "explanation": self._spending_explanation(payload, predicted_val, insights)
        }

    # ==========================
    # 2. BUDGET RISK PREDICTION (CLASSIFICATION)
    # ==========================
    def predict_budget_risk(self, data: dict) -> dict:
        """
        Features expected:
        current_spending, days_elapsed, avg_daily_spending, income,
        previous_month_expense, days_remaining, projected_month_end_spending,
        monthly_budget, budget_usage_percentage, budget_remaining,
        category_spending, year, month
        """
        today = date.today()
        day = today.day
        # Days in month roughly 30
        days_in_month = 30
        days_elapsed = max(1, day)
        days_remaining = max(1, days_in_month - days_elapsed)

        current_spending = float(data.get("current_spending", 12000.0))
        monthly_budget = float(data.get("monthly_budget", 25000.0))
        income = float(data.get("income", 50000.0))
        prev_month_expense = float(data.get("previous_month_expense", current_spending))

        avg_daily = current_spending / days_elapsed
        projected = current_spending + (avg_daily * days_remaining)
        budget_remaining = monthly_budget - current_spending
        usage_pct = (current_spending / monthly_budget * 100) if monthly_budget > 0 else 100.0

        payload = {
            "current_spending": current_spending,
            "days_elapsed": days_elapsed,
            "avg_daily_spending": round(avg_daily, 2),
            "income": income,
            "previous_month_expense": prev_month_expense,
            "days_remaining": days_remaining,
            "projected_month_end_spending": round(projected, 2),
            "monthly_budget": monthly_budget,
            "budget_usage_percentage": round(usage_pct, 2),
            "budget_remaining": round(budget_remaining, 2),
            "category_spending": float(data.get("category_spending", current_spending * 0.4)),
            "year": today.year,
            "month": today.month
        }

        input_df = pd.DataFrame([payload])

        risk_level = "Safe"
        risk_probability = 0.15
        
        if self.classification_model:
            try:
                pred = self.classification_model.predict(input_df)[0]
                if hasattr(self.classification_model, "predict_proba"):
                    probs = self.classification_model.predict_proba(input_df)[0]
                    risk_probability = float(probs[1]) if len(probs) > 1 else float(probs[0])
                else:
                    risk_probability = 0.85 if pred == 1 else 0.15

                risk_level = "High Risk" if pred == 1 or risk_probability > 0.6 else ("Moderate Risk" if risk_probability > 0.4 else "Safe")
            except Exception as e:
                print(f"[MLService] Classification error: {e}")
                # Fallback heuristic
                if projected > monthly_budget:
                    risk_level = "High Risk"
                    risk_probability = 0.82
                elif usage_pct > 75:
                    risk_level = "Moderate Risk"
                    risk_probability = 0.55
        else:
            if projected > monthly_budget:
                risk_level = "High Risk"
                risk_probability = 0.80
            elif usage_pct > 75:
                risk_level = "Moderate Risk"
                risk_probability = 0.50

        if risk_level == "High Risk":
            advice = f"You're spending ₹{avg_daily:.0f}/day on average. At this pace, you'll go over your budget by about ₹{projected - monthly_budget:.0f} — try to slow down for the rest of the month."
        elif risk_level == "Moderate Risk":
            advice = f"You've used {usage_pct:.0f}% of your budget with {days_remaining} days left. Still manageable, but worth watching."
        else:
            advice = f"You're doing great! On track to finish the month about ₹{monthly_budget - projected:.0f} under your budget."

        return {
            "risk_level": risk_level,
            "risk_probability": round(risk_probability, 2),
            "projected_month_end_spending": round(projected, 2),
            "budget_usage_percentage": round(usage_pct, 2),
            "advice": advice,
            "input_data": payload,
            "explanation": self._budget_risk_explanation(payload, risk_level, projected, monthly_budget, usage_pct, days_remaining)
        }

    # ==========================
    # 3. SPENDING BEHAVIOUR SEGMENTATION (CLUSTERING)
    # ==========================
    def segment_user(self, data: dict) -> dict:
        """
        Features expected:
        monthly_income, monthly_expense, savings_rate, avg_transaction_amount,
        transaction_frequency, food_ratio, shopping_ratio, travel_ratio, entertainment_ratio, other_ratio
        """
        income = float(data.get("monthly_income", 50000.0))
        expense = float(data.get("monthly_expense", 32000.0))
        savings_rate = ((income - expense) / income) if income > 0 else 0.1

        payload = {
            "monthly_income": income,
            "monthly_expense": expense,
            "savings_rate": savings_rate,
            "avg_transaction_amount": float(data.get("avg_transaction_amount", 850.0)),
            "transaction_frequency": float(data.get("transaction_frequency", 35)),
            "food_ratio": float(data.get("food_ratio", 0.3)),
            "shopping_ratio": float(data.get("shopping_ratio", 0.25)),
            "travel_ratio": float(data.get("travel_ratio", 0.15)),
            "entertainment_ratio": float(data.get("entertainment_ratio", 0.1)),
            "other_ratio": float(data.get("other_ratio", 0.2))
        }

        cluster_id = 1
        if self.clustering_model:
            try:
                # Clustering model was trained with StandardScaler fitted on DataFrame
                # Must pass as 2D array (list of lists) in exact training column order
                # to avoid feature name mismatch warnings
                feature_values = [[
                    payload["monthly_income"],
                    payload["monthly_expense"],
                    payload["savings_rate"],
                    payload["avg_transaction_amount"],
                    payload["transaction_frequency"],
                    payload["food_ratio"],
                    payload["shopping_ratio"],
                    payload["travel_ratio"],
                    payload["entertainment_ratio"],
                    payload["other_ratio"]
                ]]
                cluster_id = int(self.clustering_model.predict(feature_values)[0])
            except Exception as ex:
                print(f"[MLService] Clustering error: {ex}")
                cluster_id = 0 if savings_rate > 0.35 else (2 if savings_rate < 0.15 else 1)

        # Persona interpretations for k=3
        personas = {
            0: {
                "persona": "Disciplined Saver (Value Focused)",
                "description": "High savings rate, prudent discretionary spending, consistent balance retention.",
                "recommendations": [
                    "Consider automated recurring investments into index funds or mutual funds.",
                    "Set ambitious medium-term savings milestones (e.g. emergency fund or down payment)."
                ]
            },
            1: {
                "persona": "Balanced Lifestyle Spender",
                "description": "Moderate savings, well-distributed expenses across essentials and recreation.",
                "recommendations": [
                    "Aim to gradually bump savings rate by 5% over the next quarter.",
                    "Review dining and impulse subscriptions to unlock extra monthly capital."
                ]
            },
            2: {
                "persona": "High-Velocity Spender",
                "description": "High transaction frequency and discretionary ratio relative to monthly income.",
                "recommendations": [
                    "Activate daily transaction limits on digital wallets.",
                    "Implement a 48-hour cooling rule for shopping purchases over ₹2,000."
                ]
            }
        }

        info = personas.get(cluster_id, personas[1])
        return {
            "cluster_id": cluster_id,
            "persona": info["persona"],
            "description": info["description"],
            "recommendations": info["recommendations"],
            "input_data": payload,
            "explanation": self._persona_explanation(payload, cluster_id, info)
        }

    # ==========================
    # 4. ANOMALY DETECTION (ISOLATION FOREST)
    # ==========================
    def check_anomaly(self, txn: dict, user_history: dict = None) -> dict:
        """
        Features expected:
        amount, category, user_average_amount, category_average_amount,
        transaction_frequency, balance, day_of_week, transaction_hour, is_weekend,
        amount_vs_user_avg, amount_vs_category_avg, recent_transaction_count
        """
        amount = float(txn.get("amount", 0.0))
        category = str(txn.get("category", "General")).lower()
        now = datetime.now()
        day_of_week = now.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0
        hour = now.hour

        user_avg = float(user_history.get("avg_amount", 800.0) if user_history else 800.0)
        cat_avg = float(user_history.get("cat_avg", 1000.0) if user_history else 1000.0)
        user_balance = float(txn.get("balance", 45000.0))
        total_txn_count = int(user_history.get("total_txn_count", 0) if user_history else 0)

        # Not enough history — don't flag anything
        # Model needs at least 10 transactions to have a reliable baseline
        if total_txn_count < 10:
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "severity": "Normal",
                "message": f"This ₹{amount:,.0f} transaction looks normal for you.",
                "input_data": {},
                "explanation": ""
            }

        ratio_user = amount / user_avg if user_avg > 0 else 1.0
        ratio_cat = amount / cat_avg if cat_avg > 0 else 1.0

        payload = {
            "amount": amount,
            "category": category,
            "user_average_amount": user_avg,
            "category_average_amount": cat_avg,
            "transaction_frequency": float(txn.get("transaction_frequency", 25.0)),
            "balance": user_balance,
            "day_of_week": day_of_week,
            "transaction_hour": hour,
            "is_weekend": is_weekend,
            "amount_vs_user_avg": ratio_user,
            "amount_vs_category_avg": ratio_cat,
            "recent_transaction_count": float(txn.get("recent_transaction_count", 3.0))
        }

        input_df = pd.DataFrame([payload])

        is_anomaly = False
        anomaly_score = 0.05

        if self.anomaly_model:
            try:
                pred = self.anomaly_model.predict(input_df)[0]
                # IsolationForest: -1 is anomaly, 1 is normal
                is_anomaly = bool(pred == -1)
                if hasattr(self.anomaly_model, "decision_function"):
                    anomaly_score = float(self.anomaly_model.decision_function(input_df)[0])
            except Exception as e:
                print(f"[MLService] Anomaly error: {e}")
                # Fallback: only flag if 5x above user average AND amount > 10000
                if ratio_user > 5.0 and amount > 10000:
                    is_anomaly = True
                    anomaly_score = -0.15
        else:
            if ratio_user > 5.0 and amount > 10000:
                is_anomaly = True
                anomaly_score = -0.15

        # Sanity guard: never flag as anomaly if:
        # - amount is less than ₹500 (too small to be genuinely unusual)
        # - amount is less than 2x the user's own average (not meaningfully different)
        if amount < 500 or amount < (user_avg * 2):
            is_anomaly = False
            anomaly_score = max(0.0, anomaly_score)

        severity = "Critical" if anomaly_score < -0.1 else ("Warning" if is_anomaly else "Normal")
        message = (
            f"This ₹{amount:,.0f} transaction is {ratio_user:.1f}x your usual amount — flagged for a quick review."
            if is_anomaly else f"This ₹{amount:,.0f} transaction looks normal for you."
        )

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": round(anomaly_score, 4),
            "severity": severity,
            "message": message,
            "input_data": payload,
            "explanation": self._anomaly_explanation(payload, is_anomaly, ratio_user, ratio_cat, amount)
        }

    # ==========================
    # HELPER: Explanation generators (user-friendly, no model jargon)
    # ==========================
    def _spending_explanation(self, payload: dict, predicted_val: float, insights: list) -> str:
        prev = payload['previous_month_expense']
        avg3 = payload['3_month_avg_expense']
        income = payload['monthly_income']
        diff = predicted_val - prev
        direction = "more" if diff > 0 else "less"
        parts = [
            f"Last month: ₹{prev:,.0f}. Your 3-month average: ₹{avg3:,.0f}.",
            f"Looking at your food, shopping, travel, and entertainment spending, next month is likely ₹{abs(diff):,.0f} {direction} than last month — around ₹{predicted_val:,.0f}."
        ]
        if income > 0:
            ratio = (predicted_val / income) * 100
            if ratio > 80:
                parts.append(f"That's {ratio:.0f}% of your income — quite high.")
            elif ratio < 50:
                parts.append(f"That's only {ratio:.0f}% of your income — good.")
        return " ".join(parts)

    def _budget_risk_explanation(self, payload: dict, risk_level: str, projected: float, budget: float, usage_pct: float, days_remaining: int) -> str:
        spent = payload['current_spending']
        daily = payload['avg_daily_spending']
        parts = [
            f"Spent ₹{spent:,.0f} so far ({usage_pct:.0f}% of ₹{budget:,.0f} budget). Avg daily spend: ₹{daily:,.0f}."
        ]
        if risk_level == "High Risk":
            parts.append(f"At this pace, you'll go over by ₹{projected - budget:,.0f}.")
        elif risk_level == "Moderate Risk":
            parts.append(f"Getting close to the limit with {days_remaining} days left.")
        else:
            parts.append(f"On track to finish ₹{budget - projected:,.0f} under budget.")
        return " ".join(parts)

    def _persona_explanation(self, payload: dict, cluster_id: int, info: dict) -> str:
        income = payload['monthly_income']
        expense = payload['monthly_expense']
        savings_pct = payload['savings_rate'] * 100
        food_pct = payload['food_ratio'] * 100
        shop_pct = payload['shopping_ratio'] * 100
        return (
            f"Income ₹{income:,.0f}, expenses ₹{expense:,.0f}, saving {savings_pct:.0f}%. "
            f"Food takes {food_pct:.0f}% and shopping {shop_pct:.0f}% of your spending."
        )

    def _anomaly_explanation(self, payload: dict, is_anomaly: bool, ratio_user: float, ratio_cat: float, amount: float) -> str:
        avg = payload['user_average_amount']
        if is_anomaly:
            return (
                f"₹{amount:,.0f} is {ratio_user:.1f}x your usual transaction amount of ₹{avg:,.0f}. "
                f"Worth a quick check — but it could just be a one-time big purchase."
            )
        return f"₹{amount:,.0f} is close to your usual amount of ₹{avg:,.0f}. Nothing unusual here."

ml_service = MLService()

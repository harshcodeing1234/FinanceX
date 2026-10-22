import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import AddTransactionModal from './components/AddTransactionModal';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MLIntelligencePage from './pages/MLIntelligencePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

import {
  analyticsService,
  transactionService,
  categoryService,
  budgetService,
  goalService,
  mlService
} from './services/api';

// Protected Layout for Authorized Pages
function AuthenticatedLayout({
  categories,
  loadAllData,
  isAddTxnOpen,
  setIsAddTxnOpen
}) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar: Permanent on desktop, Slide-out drawer on phone */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Right Area - locked height with fixed header */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header - with mobile hamburger menu toggle */}
        <Header
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Page Content View - extra bottom padding on phone for bottom navigation */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto scroll-smooth">
          <Outlet />
        </main>

        {/* Modern WhatsApp/IG style Bottom Navigation Bar for Mobile */}
        <BottomNav />
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxnOpen}
        onClose={() => setIsAddTxnOpen(false)}
        categories={categories}
        onSuccess={loadAllData}
      />
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { addNotification, notifications } = useNotifications();
  const [isAddTxnOpen, setIsAddTxnOpen] = useState(false);

  // Application Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [mlInsights, setMlInsights] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadAllData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [dash, ml, txns, cats, bds, gls] = await Promise.all([
        analyticsService.getDashboard(),
        mlService.getInsights(),
        transactionService.getAll({ limit: 100 }),
        categoryService.getAll(),
        budgetService.getAll(),
        goalService.getAll()
      ]);
      setDashboardData(dash);
      setMlInsights(ml);
      setTransactions(txns);
      setCategories(cats);
      setBudgets(bds);
      setGoals(gls);

      // Generate real notifications from actual data
      generateNotifications(dash, ml, txns, gls);
    } catch (err) {
      console.error("Error loading application state:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Generates notifications based on real data — deduplicated by key stored in localStorage
  const generateNotifications = (dash, ml, txns, gls) => {
    const seenKey = `financex_notif_seen_${user?.id}`;
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem(seenKey) || '{}'); } catch { seen = {}; }

    const maybeAdd = (key, notif) => {
      if (!seen[key]) {
        addNotification(notif);
        seen[key] = true;
      }
    };

    // 1. Budget Risk — High Risk
    if (ml?.budget_risk?.risk_level === 'High Risk' && !ml?.budget_risk?.insufficient_data) {
      const key = `budget_risk_high_${new Date().getMonth()}_${new Date().getFullYear()}`;
      maybeAdd(key, {
        title: 'Budget Alert',
        message: ml.budget_risk.advice || 'You are likely to exceed your budget this month.',
        type: 'budget',
        link: '/budgets'
      });
    }

    // 2. Budget Risk — Moderate
    if (ml?.budget_risk?.risk_level === 'Moderate Risk' && !ml?.budget_risk?.insufficient_data) {
      const key = `budget_risk_moderate_${new Date().getMonth()}_${new Date().getFullYear()}`;
      maybeAdd(key, {
        title: 'Budget Check',
        message: ml.budget_risk.advice || 'Getting close to your budget limit.',
        type: 'budget',
        link: '/budgets'
      });
    }

    // 3. Anomaly detected in recent transactions
    const anomalyTxns = (txns || []).filter(t => t.is_anomaly && t.direction === 'debit');
    if (anomalyTxns.length > 0) {
      const latest = anomalyTxns[0];
      const key = `anomaly_txn_${latest.id}`;
      maybeAdd(key, {
        title: 'Unusual Transaction',
        message: `A ₹${latest.amount?.toLocaleString('en-IN')} transaction in ${latest.category_name || 'Others'} looks bigger than usual.`,
        type: 'transaction',
        link: '/transactions'
      });
    }

    // 4. Savings goal nearly complete (>= 80%)
    if (gls?.length > 0) {
      gls.forEach(g => {
        if (g.progress_percentage >= 80 && g.progress_percentage < 100 && g.status === 'in_progress') {
          const key = `goal_near_${g.id}`;
          maybeAdd(key, {
            title: `Goal Almost There: ${g.name}`,
            message: `You're ${g.progress_percentage.toFixed(0)}% of the way to your "${g.name}" goal. Keep it up!`,
            type: 'goal',
            link: '/goals'
          });
        }
        if (g.progress_percentage >= 100 && g.status !== 'completed') {
          const key = `goal_done_${g.id}`;
          maybeAdd(key, {
            title: `Goal Achieved: ${g.name}! 🎉`,
            message: `You've hit your target for "${g.name}". Time to celebrate or set a new goal!`,
            type: 'goal',
            link: '/goals'
          });
        }
      });
    }

    // 5. AI forecast insight
    if (ml?.spending_forecast?.insights?.length > 0 && !ml?.spending_forecast?.insufficient_data) {
      const key = `ml_forecast_${new Date().getMonth()}_${new Date().getFullYear()}`;
      maybeAdd(key, {
        title: 'Spending Forecast Ready',
        message: ml.spending_forecast.insights[0],
        type: 'ml',
        link: '/ai-insights'
      });
    }

    // Save seen keys
    try { localStorage.setItem(seenKey, JSON.stringify(seen)); } catch { /* silent */ }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage initialMode="login" />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage initialMode="register" />}
      />

      {/* 2. Protected Routes (Requires Auth) */}
      <Route
        element={
          <AuthenticatedLayout
            categories={categories}
            loadAllData={loadAllData}
            isAddTxnOpen={isAddTxnOpen}
            setIsAddTxnOpen={setIsAddTxnOpen}
          />
        }
      >
        <Route
          path="/dashboard"
          element={
            <Dashboard
              dashboardData={dashboardData}
              mlInsights={mlInsights}
            />
          }
        />
        <Route
          path="/transactions"
          element={
            <TransactionsPage
              transactions={transactions}
              categories={categories}
              onRefresh={loadAllData}
              onOpenAddTxn={() => setIsAddTxnOpen(true)}
            />
          }
        />
        <Route
          path="/budgets"
          element={
            <BudgetsPage
              budgets={budgets}
              categories={categories}
              dashboardData={dashboardData}
              onRefresh={loadAllData}
            />
          }
        />
        <Route
          path="/goals"
          element={
            <GoalsPage
              goals={goals}
              onRefresh={loadAllData}
            />
          }
        />
        <Route
          path="/analytics"
          element={
            <AnalyticsPage
              dashboardData={dashboardData}
            />
          }
        />
        <Route
          path="/ai-insights"
          element={
            <MLIntelligencePage
              mlInsights={mlInsights}
            />
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 3. Fallback Route */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}

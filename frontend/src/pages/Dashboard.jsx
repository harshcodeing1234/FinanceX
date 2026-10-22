import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';
import {
  TrendingUp, TrendingDown, PiggyBank, Target, ArrowUpRight,
  MoreVertical, Sparkles, ChevronRight, Plus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard({ dashboardData, mlInsights, onNavigate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sym = getCurrencySymbol(user?.currency);

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-72 sm:h-96">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { summary, category_breakdown, monthly_trends } = dashboardData;
  const { spending_forecast, budget_risk, persona_segment } = mlInsights || {};

  // Calculate real % changes from monthly_trends (last 2 months)
  const trends = monthly_trends || [];
  const currentMonth = trends[trends.length - 1] || {};
  const prevMonth = trends[trends.length - 2] || {};

  const calcPctChange = (curr, prev) => {
    if (!prev || prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const incomeChange = calcPctChange(currentMonth.income, prevMonth.income);
  const expenseChange = calcPctChange(currentMonth.expense, prevMonth.expense);
  const prevSavings = (prevMonth.income || 0) - (prevMonth.expense || 0);
  const currSavings = summary.net_savings || 0;
  const savingsChange = calcPctChange(currSavings, prevSavings);

  // Color palette matching the design
  const CATEGORY_COLORS = {
    'Food': '#EF4444',         // Red
    'Shopping': '#F59E0B',     // Amber
    'Travel': '#3B82F6',       // Blue
    'Entertainment': '#8B5CF6',// Purple
    'Others': '#10B981',       // Emerald
  };

  const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

  // Calculate percentages for donut
  const totalExpense = summary.monthly_expense || 1;
  const categoriesWithPercent = (category_breakdown && category_breakdown.length > 0)
    ? category_breakdown.map((c) => ({
        ...c,
        percent: Math.round((c.amount / totalExpense) * 100) || 0
      }))
    : [];

  const handleNavigateAI = () => {
    if (onNavigate) onNavigate('ai-insights');
    navigate('/ai-insights');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Dynamic AI Banner (Tap to navigate to AI Insights) */}
      {spending_forecast && (
        <div
          onClick={handleNavigateAI}
          className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-soft hover:shadow-card transition-all cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30 shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-950">
                  AI Intelligence Insight
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  {persona_segment?.persona?.split('(')[0] || 'Balanced Saver'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 sm:line-clamp-1 leading-snug">
                {spending_forecast.insights?.[0] || `Projected next month spending is ${sym}${spending_forecast.predicted_expense?.toLocaleString('en-IN')}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span className="hidden sm:inline">View Insights</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* 2. 4 Stat Cards: 2 Columns on Mobile, 4 Columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Income */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">Total Income</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {sym}{summary.monthly_income?.toLocaleString('en-IN')}
            </div>
          </div>
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold mt-2 ${incomeChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <span>{incomeChange >= 0 ? '+' : ''}{incomeChange}%</span>
            <span className="text-slate-400 font-normal truncate">vs last mo</span>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">Total Expenses</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {sym}{summary.monthly_expense?.toLocaleString('en-IN')}
            </div>
          </div>
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold mt-2 ${expenseChange >= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            <span>{expenseChange >= 0 ? '↑' : '↓'} {Math.abs(expenseChange)}%</span>
            <span className="text-slate-400 font-normal truncate">vs last mo</span>
          </div>
        </div>

        {/* Card 3: Savings */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">Net Savings</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {sym}{summary.net_savings?.toLocaleString('en-IN')}
            </div>
          </div>
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold mt-2 ${savingsChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <span>{savingsChange >= 0 ? '+' : ''}{savingsChange}%</span>
            <span className="text-slate-400 font-normal truncate">vs last mo</span>
          </div>
        </div>

        {/* Card 4: Budget Usage */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">Budget Usage</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {summary.budget_used_pct}%
            </div>
          </div>
          <div className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-2 truncate">
            {summary.budget_used_pct > 80 ? (
              <span className="text-amber-600">Exceeding pace</span>
            ) : (
              <span className="text-emerald-600">On track</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Charts Section (Stacked on Mobile, 8:4 Grid on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Spending Overview AreaChart (8 columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Spending Overview</h3>
              <p className="text-[11px] text-slate-400 sm:hidden">Income vs. Expense 6-month trend</p>
            </div>

            {/* Income vs Expense Legend Pills */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                <span>Expense</span>
              </div>
            </div>
          </div>

          <div className="h-56 sm:h-72 w-full -ml-2 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dashboardExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB923C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FB923C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${sym}${val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  formatter={(val) => `${sym}${val.toLocaleString('en-IN')}`}
                />
                <Area type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#dashboardIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#FB923C" strokeWidth={2.5} fillOpacity={1} fill="url(#dashboardExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories Donut Chart (4 columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Top Categories</h3>
            <span className="text-[11px] font-semibold text-slate-400">This Month</span>
          </div>

          {/* Donut Chart with Total Spending in center */}
          {categoriesWithPercent.length > 0 ? (
            <div className="h-48 sm:h-52 w-full relative flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesWithPercent}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {categoriesWithPercent.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '12px' }}
                    formatter={(val) => `${sym}${val.toLocaleString('en-IN')}`}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {sym}{summary.monthly_expense?.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Total Spent</span>
              </div>
            </div>
          ) : (
            <div className="h-44 sm:h-52 w-full flex items-center justify-center">
              <p className="text-xs text-slate-400">No expense data yet this month</p>
            </div>
          )}

          {/* Legend list: 2 Columns on Mobile, Single Column on Desktop */}
          {categoriesWithPercent.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 pt-3 border-t border-slate-100">
              {categoriesWithPercent.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-1 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 truncate pr-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                    ></span>
                    <span className="text-slate-600 font-medium truncate">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">{cat.percent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

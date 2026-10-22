import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';

export default function AnalyticsPage({ dashboardData }) {
  const { user } = useAuth();
  const sym = getCurrencySymbol(user?.currency);
  const [activeTab, setActiveTab] = useState('overview');

  const { summary, category_breakdown, monthly_trends } = dashboardData || {
    summary: {},
    category_breakdown: [],
    monthly_trends: []
  };

  const CATEGORY_COLORS = {
    'Food': '#EF4444',         // Red
    'Shopping': '#F59E0B',     // Amber
    'Travel': '#3B82F6',       // Blue
    'Entertainment': '#8B5CF6',// Purple
    'Others': '#10B981',       // Emerald
  };

  const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

  const totalExpense = summary?.monthly_expense || 1;
  const categoriesWithPercent = (category_breakdown && category_breakdown.length > 0)
    ? category_breakdown.map((c) => ({
        ...c,
        percent: Math.round((c.amount / totalExpense) * 100) || 0
      }))
    : [];

  const tabOptions = [
    { id: 'overview', label: 'Overview' },
    { id: 'income-vs-expense', label: 'Income vs Expense' },
    { id: 'category-analysis', label: 'Category Analysis' },
    { id: 'trends', label: 'Trends' }
  ];

  const showIncomeVsExpense = activeTab === 'overview' || activeTab === 'income-vs-expense' || activeTab === 'trends';
  const showCategoryAnalysis = activeTab === 'overview' || activeTab === 'category-analysis';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Analytics</h2>
        <p className="text-[11px] sm:text-xs text-slate-500">Understand your financial patterns and habits</p>
      </div>

      {/* 2. Responsive Tabs: Horizontally scrollable on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
        {tabOptions.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 sm:px-4 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Monthly Income vs Expense Paired Bar Chart (Improved: Thicker, Gradient Bars) */}
      {showIncomeVsExpense && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5 sm:mb-6">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Monthly Income vs Expense</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Past 6 months side-by-side comparison</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-md bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/20"></span>
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-md bg-gradient-to-b from-amber-400 to-orange-500 shadow-sm shadow-orange-500/20"></span>
                <span>Expense</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-80 w-full -ml-1 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthly_trends}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                barGap={6}
                barCategoryGap="10%"
              >
                <defs>
                  {/* Modern gradient for Income bars */}
                  <linearGradient id="analyticsIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>

                  {/* Modern gradient for Expense bars */}
                  <linearGradient id="analyticsExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#f1f5f9' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${sym}${val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.65)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    padding: '10px 14px'
                  }}
                  formatter={(val, name) => [
                    `${sym}${val.toLocaleString('en-IN')}`,
                    name === 'income' ? 'Income' : 'Expense'
                  ]}
                />
                {/* Noticeably wider, bold bars (chaura) with smooth rounded caps */}
                <Bar
                  dataKey="income"
                  name="income"
                  fill="url(#analyticsIncome)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={68}
                />
                <Bar
                  dataKey="expense"
                  name="expense"
                  fill="url(#analyticsExpense)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={68}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Category-wise Spending Donut Chart & Breakdown */}
      {showCategoryAnalysis && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft animate-in fade-in duration-200">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Category-wise Spending</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">Expense distribution across categories</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* Donut Chart with center total */}
            {categoriesWithPercent.length > 0 ? (
              <div className="md:col-span-6 h-52 sm:h-64 w-full relative flex items-center justify-center my-1 sm:my-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoriesWithPercent}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={78}
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

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {sym}{summary?.monthly_expense?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Total Expenses</span>
                </div>
              </div>
            ) : (
              <div className="md:col-span-6 h-52 sm:h-64 flex items-center justify-center">
                <p className="text-xs text-slate-400">No expense data yet this month</p>
              </div>
            )}

            {/* Legend Grid with percent */}
            {categoriesWithPercent.length > 0 ? (
              <div className="md:col-span-6 space-y-2 sm:space-y-2.5">
                {categoriesWithPercent.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                      ></span>
                      <span className="text-xs font-bold text-slate-800 truncate">{cat.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900">{sym}{cat.amount?.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 ml-1.5">({cat.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="md:col-span-6 flex items-center justify-center py-6 text-center">
                <p className="text-xs text-slate-400">Add transactions to see category breakdown</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

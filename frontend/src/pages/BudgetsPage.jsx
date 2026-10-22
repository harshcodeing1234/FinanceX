import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { getCurrencySymbol } from '../utils/currency';
import { budgetService } from '../services/api';
import AddBudgetModal from '../components/AddBudgetModal';
import {
  Plus, Target, Trash2, Utensils, ShoppingBag, Car, Film, MoreHorizontal
} from 'lucide-react';

export default function BudgetsPage({ budgets, categories, dashboardData, onRefresh }) {
  const { user } = useAuth();
  const { confirm, toast } = useDialog();
  const sym = getCurrencySymbol(user?.currency);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);

  const summary = dashboardData?.summary || {};
  const totalSpent = summary.monthly_expense || 0;
  const overallLimit = summary.budget_limit || 80000;
  const overallUsagePct = summary.budget_used_pct || Math.round((totalSpent / overallLimit) * 100);
  const overallRemaining = Math.max(0, overallLimit - totalSpent);

  const getCategoryTheme = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('food')) {
      return { icon: Utensils, bg: 'bg-red-50', text: 'text-red-500', bar: 'bg-red-500' };
    }
    if (n.includes('shop')) {
      return { icon: ShoppingBag, bg: 'bg-amber-50', text: 'text-amber-500', bar: 'bg-amber-500' };
    }
    if (n.includes('trav')) {
      return { icon: Car, bg: 'bg-blue-50', text: 'text-blue-500', bar: 'bg-blue-500' };
    }
    if (n.includes('entert')) {
      return { icon: Film, bg: 'bg-purple-50', text: 'text-purple-500', bar: 'bg-purple-500' };
    }
    return { icon: MoreHorizontal, bg: 'bg-emerald-50', text: 'text-emerald-500', bar: 'bg-emerald-500' };
  };

  const handleDelete = async (id, categoryName) => {
    const name = categoryName || 'this';
    const confirmed = await confirm({
      title: 'Delete Budget',
      message: `Are you sure you want to delete the budget limit for ${name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete Budget',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      await budgetService.delete(id);
      toast.success('Budget limit deleted successfully');
      onRefresh();
    } catch (err) {
      console.error('Error deleting budget:', err);
      toast.error('Error deleting budget. Please try again.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Top Header with + Create Budget */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Budgets</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">Set and manage your spending limits</p>
        </div>

        <button
          onClick={() => setIsAddBudgetOpen(true)}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">Create Budget</span>
          <span className="xs:hidden sm:hidden">Add</span>
        </button>
      </div>

      {/* 2. Overall Budget Card (Responsive) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Overall Budget</h3>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">
                {sym}{totalSpent?.toLocaleString('en-IN')}{' '}
                <span className="text-slate-400 font-normal text-xs sm:text-sm">
                  / {sym}{overallLimit?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-bold">
            <span className="sm:hidden text-slate-400 font-medium text-[11px]">Usage</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              overallUsagePct > 85 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {overallUsagePct}% used
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              overallUsagePct > 85 ? 'bg-red-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, overallUsagePct)}%` }}
          ></div>
        </div>

        {/* Bottom stats row */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-2.5">
          <span>Remaining: {sym}{overallRemaining.toLocaleString('en-IN')}</span>
          <span>Max Limit: {sym}{overallLimit.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* 3. Category Budgets Grid (1 column on mobile, 2 on tablet, 3 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {budgets && budgets.length > 0 ? (
          budgets.map((b) => {
            const theme = getCategoryTheme(b.category_name);
            const Icon = theme.icon;
            return (
              <div
                key={b.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-soft hover:shadow-card transition-all relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {b.category_name || 'General Budget'}
                        </h4>
                        <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">
                          {sym}{b.spent?.toLocaleString('en-IN')}{' '}
                          <span className="text-slate-400 font-normal text-[11px] sm:text-xs">
                            / {sym}{b.amount?.toLocaleString('en-IN')}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Delete button: always visible on mobile, hover on desktop */}
                    <button
                      onClick={() => handleDelete(b.id, b.category_name)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        b.usage_percentage > 90 ? 'bg-red-500' : theme.bar
                      }`}
                      style={{ width: `${Math.min(100, b.usage_percentage)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-1">
                  <span className={b.usage_percentage > 90 ? 'text-red-500 font-bold' : ''}>
                    {b.usage_percentage}% used
                  </span>
                  <span>Remaining: {sym}{b.remaining?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No category budgets created yet. Click &ldquo;+ Create Budget&rdquo; to set limits.
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      <AddBudgetModal
        isOpen={isAddBudgetOpen}
        onClose={() => setIsAddBudgetOpen(false)}
        categories={categories}
        onSuccess={onRefresh}
      />
    </div>
  );
}

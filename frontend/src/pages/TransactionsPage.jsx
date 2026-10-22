import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { getCurrencySymbol } from '../utils/currency';
import {
  Search, Plus, MoreHorizontal, Calendar, Trash2,
  Utensils, ShoppingBag, Car, Film, MoreVertical,
  ArrowDownRight, ArrowUpRight, AlertTriangle, Wallet,
  ChevronDown, Check
} from 'lucide-react';
import { transactionService } from '../services/api';

export default function TransactionsPage({ transactions, categories, onRefresh, onOpenAddTxn }) {
  const { user } = useAuth();
  const { confirm, toast } = useDialog();
  const sym = getCurrencySymbol(user?.currency);
  const [directionFilter, setDirectionFilter] = useState('all'); // 'all', 'credit', 'debit'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  // Timeframe filter state
  const [periodFilter, setPeriodFilter] = useState('this_month');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const periodRef = useRef(null);

  const periodOptions = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  // Close timeframe dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (periodRef.current && !periodRef.current.contains(event.target)) {
        setIsPeriodOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterByPeriod = (t, period) => {
    if (period === 'all') return true;
    if (!t.date) return true;
    const txnDate = new Date(t.date);
    const now = new Date();

    if (period === 'this_month') {
      return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
    }
    if (period === 'last_month') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return txnDate.getMonth() === prevMonth && txnDate.getFullYear() === prevYear;
    }
    if (period === 'last_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return txnDate >= thirtyDaysAgo && txnDate <= now;
    }
    if (period === 'last_90_days') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);
      return txnDate >= ninetyDaysAgo && txnDate <= now;
    }
    if (period === 'this_year') {
      return txnDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const getCategoryIcon = (catName, direction) => {
    if (direction === 'credit') {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4" />
        </div>
      );
    }
    const name = (catName || '').toLowerCase();
    if (name.includes('food')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
          <Utensils className="w-4 h-4" />
        </div>
      );
    }
    if (name.includes('shop')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4 h-4" />
        </div>
      );
    }
    if (name.includes('trav')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
          <Car className="w-4 h-4" />
        </div>
      );
    }
    if (name.includes('entert')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
          <Film className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        <ArrowUpRight className="w-4 h-4" />
      </div>
    );
  };

  const handleDelete = async (t) => {
    const id = typeof t === 'object' ? t.id : t;
    const note = typeof t === 'object' && t.note ? ` ("${t.note}")` : '';
    const confirmed = await confirm({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete this transaction${note}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete Transaction',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;
    setDeletingId(id);
    try {
      await transactionService.delete(id);
      toast.success('Transaction deleted successfully');
      onRefresh();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast.error('Error deleting transaction. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchesDirection = directionFilter === 'all' || t.direction === directionFilter;
    const matchesCategory = selectedCategory === 'all' || String(t.category_id) === String(selectedCategory);
    const matchesSearch = (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.category_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = filterByPeriod(t, periodFilter);
    return matchesDirection && matchesCategory && matchesSearch && matchesPeriod;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Top Header with + Add Transaction Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Transactions</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">Manage your income and expenses</p>
        </div>

        <button
          onClick={onOpenAddTxn}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">Add Transaction</span>
          <span className="xs:hidden sm:hidden">Add</span>
        </button>
      </div>

      {/* 2. Filter Tabs (Segmented Control style on Mobile) */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto max-w-sm">
        <button
          onClick={() => setDirectionFilter('all')}
          className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
            directionFilter === 'all'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setDirectionFilter('credit')}
          className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
            directionFilter === 'credit'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setDirectionFilter('debit')}
          className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
            directionFilter === 'debit'
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Expense
        </button>
      </div>

      {/* 3. Filter Controls Bar (Search + Date Dropdown + Category) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-soft flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Timeframe Dropdown */}
          <div className="relative flex-1 sm:flex-initial" ref={periodRef}>
            <button
              type="button"
              onClick={() => setIsPeriodOpen(!isPeriodOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-sm select-none"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{periodOptions.find(p => p.id === periodFilter)?.label || 'This Month'}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isPeriodOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>

            {isPeriodOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Filter by Date
                </div>
                {periodOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPeriodFilter(opt.id);
                      setIsPeriodOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-left transition-colors ${
                      periodFilter === opt.id
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {periodFilter === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all truncate font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Mobile View: Native App-style Transaction Cards (md:hidden) */}
      <div className="md:hidden space-y-2.5">
        {filtered.length > 0 ? (
          filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-soft flex items-center justify-between gap-3 transition-all hover:shadow-card active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getCategoryIcon(t.category_name, t.direction)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {t.note || t.category_name || 'Transaction'}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-600 truncate">{t.category_name || 'General'}</span>
                    <span>•</span>
                    <span className="shrink-0">
                      {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  {t.is_anomaly && t.direction === 'debit' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded mt-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                      AI Anomaly
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="text-right">
                  <div className={`text-sm font-black whitespace-nowrap ${
                    t.direction === 'credit' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {t.direction === 'credit' ? '+' : '-'}{sym}{t.amount?.toLocaleString('en-IN')}
                  </div>
                  <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${
                    t.direction === 'credit'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-500'
                  }`}>
                    {t.direction === 'credit' ? 'Income' : 'Expense'}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(t)}
                  disabled={deletingId === t.id}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl py-12 text-center text-slate-400 text-xs shadow-soft">
            No transactions found.
          </div>
        )}
      </div>

      {/* 5. Desktop View: Full Data Table (hidden on phone, visible on md+) */}
      <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Date */}
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Description with icon */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(t.category_name, t.direction)}
                        <div>
                          <p className="font-bold text-slate-900">{t.note || t.category_name || 'Transaction'}</p>
                          {t.is_anomaly && t.direction === 'debit' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              AI Anomaly
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6 text-slate-600 font-semibold">
                      {t.category_name || 'General'}
                    </td>

                    {/* Type pill: Expense in red, Income in green */}
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.direction === 'credit'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-500'
                      }`}>
                        {t.direction === 'credit' ? 'Income' : 'Expense'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className={`py-4 px-6 text-right font-black text-sm whitespace-nowrap ${
                      t.direction === 'credit' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {t.direction === 'credit' ? '+' : '-'}{sym}{t.amount?.toLocaleString('en-IN')}
                    </td>

                    {/* Actions menu */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={deletingId === t.id}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

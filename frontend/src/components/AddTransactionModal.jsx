import React, { useState } from 'react';
import { transactionService, mlService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { useNotifications } from '../context/NotificationContext';
import { getCurrencySymbol } from '../utils/currency';
import { X, Calendar, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function AddTransactionModal({ isOpen, onClose, categories, onSuccess }) {
  const { user } = useAuth();
  const { toast } = useDialog();
  const { addNotification } = useNotifications();
  const currencySymbol = getCurrencySymbol(user?.currency);
  const [formData, setFormData] = useState({
    amount: '',
    direction: 'debit', // 'debit' = Expense, 'credit' = Income
    category_id: '',
    payment_method: 'UPI',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [anomalyWarning, setAnomalyWarning] = useState(null);

  if (!isOpen) return null;

  // Real-time anomaly screening when high amount is typed for expense
  const handleAmountChange = async (val) => {
    setFormData(prev => ({ ...prev, amount: val }));
    const num = parseFloat(val);
    const realtimeEnabled = localStorage.getItem('fx_anomaly_realtime') !== 'false';
    const minAmount = parseInt(localStorage.getItem('fx_anomaly_min_amount') || '15000');
    if (!isNaN(num) && num > minAmount && formData.direction === 'debit' && realtimeEnabled) {
      try {
        const cat = categories.find(c => c.id === parseInt(formData.category_id))?.name || 'Shopping';
        const res = await mlService.checkAnomaly({
          amount: num,
          category: cat,
          payment_method: formData.payment_method
        });
        if (res.is_anomaly) {
          setAnomalyWarning(res.message);
        } else {
          setAnomalyWarning(null);
        }
      } catch (err) {
        setAnomalyWarning(null);
      }
    } else {
      setAnomalyWarning(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;

    setLoading(true);
    try {
      const result = await transactionService.create({
        amount: parseFloat(formData.amount),
        direction: formData.direction,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        payment_method: formData.payment_method,
        date: formData.date,
        note: formData.note
      });
      // If the saved transaction is flagged as anomaly, add a notification
      if (result?.is_anomaly && formData.direction === 'debit') {
        const catName = categories.find(c => c.id === parseInt(formData.category_id))?.name || 'Others';
        addNotification({
          title: 'Unusual Transaction Saved',
          message: `Your ${currencySymbol}${parseFloat(formData.amount).toLocaleString('en-IN')} ${catName} expense looks bigger than your usual spending.`,
          type: 'transaction',
          link: '/transactions'
        });
      }
      toast.success(
        formData.direction === 'credit'
          ? 'Income recorded successfully!'
          : 'Expense transaction recorded!'
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save transaction:", err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(d => d.msg || d).join(', ') : "Error saving transaction. Please try again.");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 className="text-base font-bold text-slate-900">Add Transaction</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Label and Row with Income/Expense toggle matching image */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Income / Expense toggle buttons */}
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'credit' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                    formData.direction === 'credit'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Income</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'debit' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                    formData.direction === 'debit'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Anomaly screening indicator */}
          {anomalyWarning && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">AI Anomaly Notice:</span>
                <span>{anomalyWarning}</span>
              </div>
            </div>
          )}

          {/* Category Dropdown (5 categories strictly) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="UPI">UPI / GPay / Paytm</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="NetBanking">Net Banking</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
            <input
              type="text"
              placeholder="Enter description (optional)"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Modal Buttons matching reference */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

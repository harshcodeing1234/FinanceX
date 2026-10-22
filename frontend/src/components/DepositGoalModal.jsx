import React, { useState, useEffect } from 'react';
import { X, PiggyBank, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';
import { goalService } from '../services/api';
import { useDialog } from '../context/DialogContext';

export default function DepositGoalModal({ isOpen, onClose, goal, onSuccess }) {
  const { user } = useAuth();
  const { toast } = useDialog();
  const sym = getCurrencySymbol(user?.currency);

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
    }
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  const currentSaved = goal.current_amount || 0;
  const target = goal.target_amount || 1;
  const parsedAmt = parseFloat(amount) || 0;
  const newTotal = currentSaved + parsedAmt;
  const newPct = Math.min(100, Math.round((newTotal / target) * 100));

  const quickPills = [500, 1000, 2000, 5000, 10000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedAmt <= 0) {
      toast.warning('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setLoading(true);
    try {
      await goalService.update(goal.id, {
        current_amount: newTotal
      });
      toast.success(`Deposited ${sym}${parsedAmt.toLocaleString('en-IN')} to "${goal.name}"!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add savings to goal:', err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : 'Error adding savings to goal.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Deposit Savings</h3>
              <p className="text-[11px] text-slate-400">Add funds towards &ldquo;{goal.name}&rdquo;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Goal Status preview */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
            <span>{goal.name}</span>
            <span className="text-emerald-600">{newPct}% Complete</span>
          </div>

          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${newPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Now: <span className="font-semibold text-slate-700">{sym}{newTotal.toLocaleString('en-IN')}</span>
            </span>
            <span>
              Target: <span className="font-semibold text-slate-700">{sym}{target.toLocaleString('en-IN')}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deposit Amount ({sym})</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{sym}</span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="e.g. 5000"
                autoFocus
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Quick pill increments */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">Quick Add</span>
            <div className="flex flex-wrap gap-1.5">
              {quickPills.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String((parseFloat(amount) || 0) + val))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+{sym}{val.toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || parsedAmt <= 0}
              className="px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Depositing...</span>
                </>
              ) : (
                <span>Deposit {parsedAmt > 0 ? `${sym}${parsedAmt.toLocaleString('en-IN')}` : ''}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

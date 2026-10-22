import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { getCurrencySymbol } from '../utils/currency';
import { goalService } from '../services/api';
import AddGoalModal from '../components/AddGoalModal';
import DepositGoalModal from '../components/DepositGoalModal';
import {
  Plus, Trophy, Laptop, Plane, Shield, Bike, Trash2, Calendar
} from 'lucide-react';

export default function GoalsPage({ goals, onRefresh }) {
  const { user } = useAuth();
  const { confirm, toast } = useDialog();
  const sym = getCurrencySymbol(user?.currency);

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState(null);

  const getGoalIcon = (goalName) => {
    const n = (goalName || '').toLowerCase();
    if (n.includes('laptop') || n.includes('pc') || n.includes('phone') || n.includes('tech')) {
      return { icon: Laptop, bg: 'bg-purple-50', text: 'text-purple-600' };
    }
    if (n.includes('trip') || n.includes('vacation') || n.includes('travel') || n.includes('europe') || n.includes('goa')) {
      return { icon: Plane, bg: 'bg-blue-50', text: 'text-blue-600' };
    }
    if (n.includes('bike') || n.includes('car') || n.includes('vehicle')) {
      return { icon: Bike, bg: 'bg-red-50', text: 'text-red-500' };
    }
    return { icon: Shield, bg: 'bg-emerald-50', text: 'text-emerald-600' };
  };

  const handleDelete = async (g) => {
    const confirmed = await confirm({
      title: 'Delete Savings Goal',
      message: `Are you sure you want to delete "${g.name}"? Tracked savings of ${sym}${(g.current_amount || 0).toLocaleString('en-IN')} will no longer be tracked.`,
      variant: 'danger',
      confirmText: 'Delete Goal',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      await goalService.delete(g.id);
      toast.success(`Goal "${g.name}" deleted successfully.`);
      onRefresh();
    } catch (err) {
      console.error('Error deleting goal:', err);
      toast.error('Error deleting savings goal.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Top Header with + Create Goal */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Savings Goals</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">Turn your dreams into reality</p>
        </div>

        <button
          onClick={() => setIsAddGoalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">Create Goal</span>
          <span className="xs:hidden sm:hidden">Add</span>
        </button>
      </div>

      {/* 2. Grid of Goals (1 col on mobile, 2 on tablet, 3-4 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {goals && goals.length > 0 ? (
          goals.map((g) => {
            const { icon: Icon, bg, text } = getGoalIcon(g.name);
            return (
              <div
                key={g.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-soft hover:shadow-card transition-all flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bg} ${text} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={g.name}>
                          {g.name}
                        </h4>
                        <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">
                          {sym}{g.current_amount?.toLocaleString('en-IN')}{' '}
                          <span className="text-slate-400 font-normal text-[11px] sm:text-xs">
                            / {sym}{g.target_amount?.toLocaleString('en-IN')}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Delete button: visible on mobile, hover on desktop */}
                    <button
                      onClick={() => handleDelete(g)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 mb-2">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, g.progress_percentage || 0)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span className="text-emerald-600 font-bold">{g.progress_percentage || 0}%</span>
                    <span className="truncate">
                      Target: {g.target_date ? new Date(g.target_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '31 Dec 2026'}
                    </span>
                  </div>
                </div>

                {/* Deposit action button: touch optimized for mobile */}
                <button
                  onClick={() => setSelectedGoalForDeposit(g)}
                  className="mt-3.5 sm:mt-4 w-full py-2.5 sm:py-2 bg-emerald-50 sm:bg-slate-50 hover:bg-emerald-100 sm:hover:bg-emerald-50 text-emerald-700 sm:text-slate-700 sm:hover:text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/60 sm:border-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Deposit Savings</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No savings goals created yet. Click &ldquo;+ Create Goal&rdquo; to start saving.
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Deposit Savings Modal */}
      <DepositGoalModal
        isOpen={!!selectedGoalForDeposit}
        goal={selectedGoalForDeposit}
        onClose={() => setSelectedGoalForDeposit(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
}

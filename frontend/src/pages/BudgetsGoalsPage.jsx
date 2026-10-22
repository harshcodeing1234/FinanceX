import React, { useState } from 'react';
import { budgetService, goalService } from '../services/api';
import { useDialog } from '../context/DialogContext';
import { Target, PiggyBank, Plus, CheckCircle, AlertCircle, Trash2, ArrowUpRight } from 'lucide-react';

export default function BudgetsGoalsPage({ budgets, goals, categories, onRefresh }) {
  const { confirm, prompt, toast } = useDialog();
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  // New budget state
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCatId, setBudgetCatId] = useState('');

  // New goal state
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) return;
    try {
      const now = new Date();
      await budgetService.set({
        amount: parseFloat(budgetAmount),
        category_id: budgetCatId ? parseInt(budgetCatId) : null,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      setShowAddBudget(false);
      setBudgetAmount('');
      setBudgetCatId('');
      toast.success('Budget limit set successfully');
      onRefresh();
    } catch (err) {
      toast.error("Error setting budget");
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !goalTarget) return;
    try {
      await goalService.create({
        name: goalName,
        target_amount: parseFloat(goalTarget),
        current_amount: goalSaved ? parseFloat(goalSaved) : 0,
        target_date: goalDate || null
      });
      setShowAddGoal(false);
      setGoalName('');
      setGoalTarget('');
      setGoalSaved('');
      setGoalDate('');
      toast.success(`Goal "${goalName}" created successfully`);
      onRefresh();
    } catch (err) {
      toast.error("Error creating goal");
    }
  };

  const handleAddGoalFunds = async (goal) => {
    const amtStr = await prompt({
      title: 'Deposit Savings',
      message: `How much would you like to add to "${goal.name}"? (₹)`,
      inputType: 'number',
      placeholder: 'e.g. 5000',
      confirmText: 'Deposit'
    });
    if (!amtStr) return;
    const addAmt = parseFloat(amtStr);
    if (isNaN(addAmt) || addAmt <= 0) return;

    try {
      await goalService.update(goal.id, {
        current_amount: goal.current_amount + addAmt
      });
      toast.success(`Deposited ₹${addAmt} to "${goal.name}"`);
      onRefresh();
    } catch (err) {
      toast.error("Error updating goal savings");
    }
  };

  const handleDeleteBudget = async (id) => {
    const ok = await confirm({
      title: 'Delete Budget',
      message: 'Are you sure you want to delete this budget?',
      variant: 'danger',
      confirmText: 'Delete'
    });
    if (!ok) return;
    try {
      await budgetService.delete(id);
      toast.success('Budget deleted successfully');
      onRefresh();
    } catch (err) {
      toast.error("Error deleting budget");
    }
  };

  const handleDeleteGoal = async (id) => {
    const ok = await confirm({
      title: 'Delete Savings Goal',
      message: 'Are you sure you want to delete this goal?',
      variant: 'danger',
      confirmText: 'Delete'
    });
    if (!ok) return;
    try {
      await goalService.delete(id);
      toast.success('Goal deleted successfully');
      onRefresh();
    } catch (err) {
      toast.error("Error deleting goal");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Budgets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Monthly Budgets
            </h2>
            <p className="text-xs text-slate-400">Set spending guardrails to stay on track this month</p>
          </div>
          <button
            onClick={() => setShowAddBudget(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>

        {/* Add Budget Inline Modal */}
        {showAddBudget && (
          <form onSubmit={handleCreateBudget} className="mb-6 p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-lg flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Category</label>
              <select
                value={budgetCatId}
                onChange={(e) => setBudgetCatId(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                <option value="">Total Overall Monthly Budget</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Budget Limit (₹)</label>
              <input
                type="number"
                placeholder="25000"
                required
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none w-36"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
            >
              Save Budget
            </button>
            <button
              type="button"
              onClick={() => setShowAddBudget(false)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.length > 0 ? (
            budgets.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative group hover:border-slate-700 transition-all">
                <button
                  onClick={() => handleDeleteBudget(b.id)}
                  className="absolute top-4 right-4 p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Budget"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{b.category_name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    b.usage_percentage > 90
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {b.usage_percentage}% used
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xl font-black text-white">₹{b.spent?.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400">of ₹{b.amount?.toLocaleString('en-IN')}</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      b.usage_percentage > 90 ? 'bg-rose-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, b.usage_percentage)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-3">
                  <span>Remaining: <strong>₹{b.remaining?.toLocaleString('en-IN')}</strong></span>
                  <span className="text-indigo-400">Active</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              No budgets set for this month. Click "Set Budget" to create one.
            </div>
          )}
        </div>
      </div>

      {/* 2. Savings Goals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-indigo-400" />
              Savings Milestones
            </h2>
            <p className="text-xs text-slate-400">Save for dream purchases, emergency reserve, or vacations</p>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>

        {/* Add Goal Inline Modal */}
        {showAddGoal && (
          <form onSubmit={handleCreateGoal} className="mb-6 p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-lg flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Goal Name</label>
              <input
                type="text"
                placeholder="e.g. New Laptop"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none w-44"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Amount (₹)</label>
              <input
                type="number"
                placeholder="50000"
                required
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none w-32"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Already Saved (₹)</label>
              <input
                type="number"
                placeholder="10000"
                value={goalSaved}
                onChange={(e) => setGoalSaved(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none w-32"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Date</label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
            >
              Add Goal
            </button>
            <button
              type="button"
              onClick={() => setShowAddGoal(false)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.length > 0 ? (
            goals.map((g) => (
              <div key={g.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative group hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{g.name}</span>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xl font-black text-indigo-400">₹{g.current_amount?.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-400">Target: ₹{g.target_amount?.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>{g.progress_percentage}% completed</span>
                    <span>{g.target_date ? `Due ${g.target_date}` : 'Ongoing'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddGoalFunds(g)}
                  className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Deposit Savings</span>
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              No savings goals created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

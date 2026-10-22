import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ShieldAlert, UserCheck, ArrowUpRight } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import { useAuth } from '../context/AuthContext';

export default function MLInsightsCard({ insights, onOpenDeepDive }) {
  const { user } = useAuth();
  const sym = getCurrencySymbol(user?.currency);

  if (!insights) return null;

  const { spending_forecast, budget_risk, persona_segment, recent_anomalies } = insights;

  // Cold start: don't show card if insufficient data
  if (spending_forecast?.insufficient_data || budget_risk?.insufficient_data || persona_segment?.insufficient_data) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI-Powered Insights</h3>
            <p className="text-xs text-slate-400">Add more transactions to unlock personalized predictions</p>
          </div>
        </div>
      </div>
    );
  }

  const riskBadgeColor = {
    'Safe': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Moderate Risk': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'High Risk': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  }[budget_risk?.risk_level] || 'bg-slate-800 text-slate-300';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              AI-Powered Insights
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">Personalized predictions from your financial data</p>
          </div>
        </div>

        {onOpenDeepDive && (
          <button
            onClick={onOpenDeepDive}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Spending Forecast */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-indigo-400">Next Month</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {sym}{spending_forecast?.predicted_expense?.toLocaleString('en-IN') || '0'}
          </div>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
            {spending_forecast?.insights?.[0] || 'Based on your recent spending history.'}
          </p>
        </div>

        {/* 2. Budget Risk */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-indigo-400">Budget</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBadgeColor}`}>
              {budget_risk?.risk_level === 'High Risk' ? 'Likely to exceed' : budget_risk?.risk_level === 'Moderate Risk' ? 'Getting close' : 'On track'}
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {budget_risk?.budget_usage_percentage}%
            <span className="text-xs font-normal text-slate-400 ml-1.5">used</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
            {budget_risk?.advice || 'Looking good.'}
          </p>
        </div>

        {/* 3. Persona / Behaviour */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-indigo-400">You spend like</span>
          </div>
          <div className="text-base font-bold text-white truncate">
            {persona_segment?.persona || 'Balanced Spender'}
          </div>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
            {persona_segment?.recommendations?.[0] || 'Prudent allocation observed.'}
          </p>
        </div>
      </div>

      {/* Anomalies alert bar if any exist */}
      {recent_anomalies && recent_anomalies.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Alert:</strong> {recent_anomalies.length} unusual high-value transaction(s) flagged for review.
            </span>
          </div>
          <span className="text-[11px] font-semibold underline cursor-pointer hover:text-white" onClick={onOpenDeepDive}>
            View Details
          </span>
        </div>
      )}
    </div>
  );
}

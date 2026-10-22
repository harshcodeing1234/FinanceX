import React, { useState } from 'react';
import {
  Sparkles, TrendingUp, AlertTriangle, Users, ShieldAlert,
  ArrowRight, X, Info
} from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import { useAuth } from '../context/AuthContext';

export default function MLIntelligencePage({ mlInsights }) {
  const { user } = useAuth();
  const sym = getCurrencySymbol(user?.currency);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDetail, setSelectedDetail] = useState(null);

  const { spending_forecast, budget_risk, persona_segment, recent_anomalies } = mlInsights || {};

  const isInsufficientData = spending_forecast?.insufficient_data || budget_risk?.insufficient_data || persona_segment?.insufficient_data;

  const openDetail = (type) => setSelectedDetail(type);
  const closeDetail = () => setSelectedDetail(null);

  // Builds a short, highlighted summary for "Why this result" section
  const renderShortReason = (type) => {
    if (type === 'forecast' && spending_forecast) {
      const prev = spending_forecast.input_data?.previous_month_expense;
      const avg3 = spending_forecast.input_data?.['3_month_avg_expense'];
      const predicted = spending_forecast.predicted_expense;
      if (!prev) return null;
      const diff = predicted - prev;
      const diffText = diff > 0
        ? <span className="text-red-500 font-semibold">{sym}{Math.abs(diff).toLocaleString('en-IN')} more than last month</span>
        : <span className="text-emerald-500 font-semibold">{sym}{Math.abs(diff).toLocaleString('en-IN')} less than last month</span>;
      return (
        <p className="text-xs text-slate-500 leading-relaxed mt-2">
          Last month: <span className="font-semibold text-slate-700">{sym}{prev?.toLocaleString('en-IN')}</span>
          {avg3 && <> · 3-mo avg: <span className="font-semibold text-slate-700">{sym}{avg3?.toLocaleString('en-IN')}</span></>}
          {' '}· Predicted: {diffText}
        </p>
      );
    }
    if (type === 'risk' && budget_risk) {
      const used = budget_risk.budget_usage_percentage;
      const projected = budget_risk.projected_month_end_spending;
      const budget = budget_risk.input_data?.monthly_budget;
      return (
        <p className="text-xs text-slate-500 leading-relaxed mt-2">
          Used <span className="font-semibold text-slate-700">{used}%</span> of budget
          {budget && <> · On track to reach <span className={`font-semibold ${projected > budget ? 'text-red-500' : 'text-emerald-500'}`}>{sym}{projected?.toLocaleString('en-IN')}</span> by month end</>}
        </p>
      );
    }
    if (type === 'persona' && persona_segment) {
      const savings = persona_segment.input_data?.savings_rate;
      return (
        <p className="text-xs text-slate-500 leading-relaxed mt-2">
          Savings rate: <span className="font-semibold text-slate-700">{savings ? (savings * 100).toFixed(0) : '—'}%</span>
          {' '}· Top spend: <span className="font-semibold text-slate-700">Shopping & Food</span>
        </p>
      );
    }
    if (type === 'anomaly') {
      if (recent_anomalies?.length > 0) {
        return (
          <p className="text-xs text-slate-500 leading-relaxed mt-2">
            Latest flagged: <span className="font-semibold text-red-500">{sym}{recent_anomalies[0].amount?.toLocaleString('en-IN')}</span> in <span className="font-semibold text-slate-700">{recent_anomalies[0].category}</span>
          </p>
        );
      }
      return <p className="text-xs text-emerald-600 font-medium mt-2">All clear — no unusual activity</p>;
    }
    return null;
  };

  // Renders the View Details modal
  const renderDetailModal = () => {
    if (!selectedDetail) return null;

    let title = '';
    let input_data = {};
    let prediction = {};
    let explanation = '';
    let icon = null;

    if (selectedDetail === 'forecast' && spending_forecast) {
      title = 'Next Month Spending Forecast';
      icon = <TrendingUp className="w-5 h-5 text-blue-600" />;
      input_data = spending_forecast.input_data || {};
      prediction = {
        'Expected spending next month': `${sym}${(spending_forecast.predicted_expense || 0).toLocaleString('en-IN')}`
      };
      explanation = spending_forecast.explanation || '';
    } else if (selectedDetail === 'risk' && budget_risk) {
      title = 'Will You Exceed Your Budget?';
      icon = <AlertTriangle className="w-5 h-5 text-amber-600" />;
      input_data = budget_risk.input_data || {};
      prediction = {
        'Verdict': budget_risk.risk_level || 'Unknown',
        'Budget used so far': `${budget_risk.budget_usage_percentage || 0}%`,
        'Expected month-end total': `${sym}${(budget_risk.projected_month_end_spending || 0).toLocaleString('en-IN')}`,
      };
      explanation = budget_risk.explanation || '';
    } else if (selectedDetail === 'persona' && persona_segment) {
      title = 'How You Spend';
      icon = <Users className="w-5 h-5 text-emerald-600" />;
      input_data = persona_segment.input_data || {};
      prediction = {
        'Your spending type': persona_segment.persona || 'Unknown',
        'What this means': persona_segment.description || '',
        'Tips for you': persona_segment.recommendations || []
      };
      explanation = persona_segment.explanation || '';
    } else if (selectedDetail === 'anomaly') {
      title = 'Unusual Transactions';
      icon = <ShieldAlert className="w-5 h-5 text-red-600" />;
      if (recent_anomalies && recent_anomalies.length > 0) {
        const latest = recent_anomalies[0];
        input_data = latest.input_data || {
          'Amount': latest.amount,
          'Category': latest.category || 'General',
          'Date': latest.date || '',
        };
        prediction = recent_anomalies.map(a => ({
          'Amount': `${sym}${a.amount?.toLocaleString('en-IN')}`,
          'Category': a.category || 'General',
          'Date': a.date || '',
          'Note': a.note || '—',
        }));
        explanation = 'These transactions were much larger than your usual spending, so they were flagged for a quick review. It doesn\'t necessarily mean something is wrong.';
      } else {
        input_data = {};
        prediction = {};
        explanation = 'All your recent transactions look completely normal. Nothing to worry about here.';
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 sm:mb-5">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {icon}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h3>
            </div>
            <button
              onClick={closeDetail}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Input Data Section */}
          {Object.keys(input_data).length > 0 && (
            <div className="mb-4 sm:mb-5">
              <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                What we looked at
              </h4>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 space-y-2">
                {Object.entries(input_data).map(([key, value]) => {
                  const formatKey = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  let displayVal = value;
                  if (typeof value === 'number') {
                    if (key.includes('ratio') && value >= 0 && value <= 1) {
                      displayVal = `${(value * 100).toFixed(1)}%`;
                    } else if (key.includes('rate') && value >= 0 && value <= 1) {
                      displayVal = `${(value * 100).toFixed(1)}%`;
                    } else if (
                      key.includes('expense') || key.includes('income') || key.includes('spending') ||
                      key.includes('savings') || key.includes('budget') || key.includes('amount') ||
                      key.includes('avg') || key.includes('average') || key.includes('remaining') ||
                      key.includes('projected') || key.includes('category')
                    ) {
                      displayVal = `${sym}${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
                    } else {
                      displayVal = value.toLocaleString('en-IN', { maximumFractionDigits: 1 });
                    }
                  }
                  return (
                    <div key={key} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-slate-500 truncate">{formatKey(key)}</span>
                      <span className="text-slate-900 font-semibold shrink-0">{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result Section */}
          {Object.keys(prediction).length > 0 && (
            <div className="mb-4 sm:mb-5">
              <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Result
              </h4>
              {selectedDetail === 'anomaly' && Array.isArray(prediction) ? (
                <div className="space-y-2.5">
                  {prediction.map((txn, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-100 rounded-xl p-3 sm:p-4 space-y-1.5">
                      {Object.entries(txn).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-xs gap-2">
                          <span className="text-slate-500">{key}</span>
                          <span className="text-slate-900 font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4 space-y-2">
                  {Object.entries(prediction).map(([key, value]) => {
                    if (key === 'Tips for you' && Array.isArray(value)) {
                      return (
                        <div key={key} className="text-xs">
                          <span className="text-slate-500 block mb-1.5 font-medium">Tips for you:</span>
                          <ul className="space-y-1.5">
                            {value.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                                <span className="text-emerald-500 mt-0.5 shrink-0">→</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    const isMainResult = key === 'Expected spending next month' || key === 'Verdict' || key === 'Your spending type';
                    return (
                      <div key={key} className="flex items-start justify-between text-xs gap-3">
                        <span className="text-slate-500 shrink-0">{key}</span>
                        <span className={`text-right font-bold ${isMainResult ? 'text-slate-900 text-sm' : 'text-slate-700 font-semibold'}`}>
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Short Reason Section */}
          {explanation && (
            <div className="mb-1">
              <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Why this result
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4">
                {explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Cold start state
  if (isInsufficientData) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">AI-Powered Insights</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">Personalized insights from your financial data</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-soft text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Info className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Not enough data yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {spending_forecast?.message || budget_risk?.message || persona_segment?.message || "Add a few more transactions and we'll start giving you personalized insights."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">AI-Powered Insights</h2>
        <p className="text-[11px] sm:text-xs text-slate-500">Personalized insights powered by 4 machine learning pipelines</p>
      </div>

      {/* 2. Filter Tabs: Horizontally scrollable on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
        {[
          { key: 'all', label: 'All Insights' },
          { key: 'forecast', label: 'Spending Forecast' },
          { key: 'risk', label: 'Budget Risk' },
          { key: 'pattern', label: 'Spending Pattern' },
          { key: 'anomaly', label: 'Anomalies' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3.5 sm:px-4 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all active:scale-95 shrink-0 ${
              activeFilter === tab.key
                ? 'bg-emerald-500 text-white shadow-sm font-bold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. 4 Insight Cards (1 Col on mobile, 2 Cols on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

        {/* Card 1: Spending Forecast */}
        {(activeFilter === 'all' || activeFilter === 'forecast') && spending_forecast && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">Next Month Spending</h3>
                  <span className="text-[10px] text-slate-400">Predicted based on your history</span>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                {sym}{(spending_forecast.predicted_expense || 0).toLocaleString('en-IN')}
              </div>
              {spending_forecast.insights?.length > 0 && (
                <p className="text-xs text-slate-500">{spending_forecast.insights[0]}</p>
              )}
              {renderShortReason('forecast')}
            </div>
            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100">
              <span
                onClick={() => openDetail('forecast')}
                className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 cursor-pointer hover:underline w-fit active:scale-95 transition-transform"
              >
                See full breakdown <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* Card 2: Budget Risk */}
        {(activeFilter === 'all' || activeFilter === 'risk') && budget_risk && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Will you exceed budget?</h3>
                    <span className="text-[10px] text-slate-400">This month's projection</span>
                  </div>
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  budget_risk.risk_level === 'High Risk'
                    ? 'bg-red-50 text-red-600'
                    : budget_risk.risk_level === 'Moderate Risk'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {budget_risk.risk_level === 'High Risk' ? 'Likely yes' : budget_risk.risk_level === 'Moderate Risk' ? 'Maybe' : 'No, you\'re fine'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{budget_risk.advice}</p>
              {renderShortReason('risk')}
            </div>
            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100">
              <span
                onClick={() => openDetail('risk')}
                className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 cursor-pointer hover:underline w-fit active:scale-95 transition-transform"
              >
                See full breakdown <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* Card 3: Spending Pattern */}
        {(activeFilter === 'all' || activeFilter === 'pattern') && persona_segment && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">How you spend</h3>
                  <span className="text-[10px] text-slate-400">Based on your spending habits</span>
                </div>
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900 mb-1">{persona_segment.persona}</div>
              <p className="text-xs text-slate-500 leading-relaxed">{persona_segment.description}</p>
              {renderShortReason('persona')}
            </div>
            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100">
              <span
                onClick={() => openDetail('persona')}
                className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 cursor-pointer hover:underline w-fit active:scale-95 transition-transform"
              >
                See tips for you <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* Card 4: Anomaly */}
        {(activeFilter === 'all' || activeFilter === 'anomaly') && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${recent_anomalies?.length > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Unusual Transactions</h3>
                    <span className="text-[10px] text-slate-400 truncate">Screened in real-time</span>
                  </div>
                </div>
                {recent_anomalies?.length > 0 && (
                  <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 shrink-0">
                    {recent_anomalies.length} flagged
                  </span>
                )}
              </div>
              {recent_anomalies?.length > 0 ? (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {recent_anomalies.length} of your recent transactions look bigger than usual.
                </p>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">Everything looks normal — no unusual transactions found.</p>
              )}
              {renderShortReason('anomaly')}
            </div>
            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100">
              <span
                onClick={() => openDetail('anomaly')}
                className="text-[11px] font-semibold text-red-600 flex items-center gap-1 cursor-pointer hover:underline w-fit active:scale-95 transition-transform"
              >
                {recent_anomalies?.length > 0 ? 'Review flagged transactions' : 'View details'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Responsive View Details Modal */}
      {renderDetailModal()}
    </div>
  );
}

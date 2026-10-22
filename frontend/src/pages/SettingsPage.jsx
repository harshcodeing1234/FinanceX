import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { authService } from '../services/api';
import { getCurrencySymbol } from '../utils/currency';
import {
  Settings, Bell, Shield, Info, ChevronRight,
  Wallet, Sparkles, AlertTriangle, TrendingUp, Users, CheckCircle2
} from 'lucide-react';

// ── Toggle Switch Component ────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
      style={{ minWidth: 40, height: 22 }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}
        style={{ width: 18, height: 18 }}
      />
    </button>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-soft">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Row item ──────────────────────────────────────────────────────────────────
function SettingRow({ label, description, right }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        {description && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-bold ${valueColor || 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useDialog();
  const sym = getCurrencySymbol(user?.currency);

  // ── Anomaly Settings (stored in localStorage — no backend model param yet)
  const [anomalyRealtime, setAnomalyRealtime] = useState(
    () => localStorage.getItem('fx_anomaly_realtime') !== 'false'
  );
  const [anomalyMinAmount, setAnomalyMinAmount] = useState(
    () => parseInt(localStorage.getItem('fx_anomaly_min_amount') || '15000')
  );

  // ── Currency (from user profile)
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [savingCurrency, setSavingCurrency] = useState(false);

  const handleToggleAnomaly = (val) => {
    setAnomalyRealtime(val);
    localStorage.setItem('fx_anomaly_realtime', val);
    toast.info(val ? 'Real-time anomaly screening enabled.' : 'Real-time anomaly screening disabled.');
  };

  const handleMinAmountChange = (val) => {
    const num = parseInt(val);
    setAnomalyMinAmount(num);
    localStorage.setItem('fx_anomaly_min_amount', num);
  };

  const handleCurrencySave = async () => {
    if (currency === user?.currency) return;
    setSavingCurrency(true);
    try {
      await authService.updateProfile({ currency });
      await refreshUser();
      toast.success(`Currency updated to ${currency}`);
    } catch (err) {
      toast.error('Could not update currency.');
    } finally {
      setSavingCurrency(false);
    }
  };

  const currencies = [
    { value: 'INR', label: 'INR (₹) — Indian Rupee' },
    { value: 'USD', label: 'USD ($) — US Dollar' },
    { value: 'EUR', label: 'EUR (€) — Euro' },
    { value: 'GBP', label: 'GBP (£) — British Pound' },
    { value: 'AED', label: 'AED — UAE Dirham' },
    { value: 'SGD', label: 'SGD — Singapore Dollar' },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-xs text-slate-500">Configure how FinanceX works for you</p>
      </div>

      {/* ── 1. Display & Currency ── */}
      <Section icon={Wallet} iconColor="text-emerald-600" title="Display & Currency">
        <SettingRow
          label="Base Currency"
          description="All amounts across the app will use this currency symbol."
          right={
            <div className="flex items-center gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                {currencies.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {currency !== user?.currency && (
                <button
                  onClick={handleCurrencySave}
                  disabled={savingCurrency}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {savingCurrency ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          }
        />
        <SettingRow
          label="Current Symbol"
          description="Symbol shown next to all monetary values."
          right={
            <span className="text-lg font-black text-slate-900">{getCurrencySymbol(currency)}</span>
          }
        />
      </Section>

      {/* ── 2. AI & Anomaly Detection ── */}
      <Section icon={Shield} iconColor="text-blue-600" title="AI & Anomaly Detection">
        <SettingRow
          label="Real-time Anomaly Warning"
          description={`When you type an expense amount above ${sym}${anomalyMinAmount.toLocaleString('en-IN')}, it gets screened instantly before you save.`}
          right={<Toggle checked={anomalyRealtime} onChange={handleToggleAnomaly} />}
        />
        <SettingRow
          label={`Screening Threshold: ${sym}${anomalyMinAmount.toLocaleString('en-IN')}`}
          description="Transactions below this amount skip real-time screening."
          right={
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={anomalyMinAmount}
              onChange={(e) => handleMinAmountChange(e.target.value)}
              className="w-32 accent-emerald-500"
            />
          }
        />
        <SettingRow
          label="Anomaly Badge on Transactions"
          description='Expense transactions flagged by the AI model show an "AI Anomaly" badge in the transactions list.'
          right={
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle className="w-3 h-3" /> Always On
            </span>
          }
        />
        <SettingRow
          label="Minimum History for Detection"
          description="The model needs at least 10 expense transactions before it starts flagging anomalies. New accounts won't get false alerts."
          right={
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">10 transactions</span>
          }
        />
      </Section>

      {/* ── 3. AI Insights ── */}
      <Section icon={Sparkles} iconColor="text-indigo-500" title="AI Insights">
        <SettingRow
          label="Spending Forecast"
          description="Predicts your next month's total expenses based on last 6 months of data."
          right={
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          }
        />
        <SettingRow
          label="Budget Risk Check"
          description="Checks mid-month if you're on track to exceed your budget by month end."
          right={
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          }
        />
        <SettingRow
          label="Spending Persona"
          description="Groups your spending behavior into one of 3 types: Disciplined Saver, Balanced Spender, or High-Velocity Spender."
          right={
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          }
        />
        <SettingRow
          label="Insights Data Window"
          description="AI insights are computed using your current month data and up to 6 months of history."
          right={
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">6 months</span>
          }
        />
      </Section>

      {/* ── 4. Account Summary ── */}
      <Section icon={Info} iconColor="text-slate-500" title="Account Summary">
        <InfoRow label="Name" value={user?.name || '—'} />
        <InfoRow label="Email" value={user?.email || '—'} />
        <InfoRow
          label="Monthly Income"
          value={user?.monthly_income > 0 ? `${sym}${Number(user.monthly_income).toLocaleString('en-IN')}` : 'Not set'}
          valueColor={user?.monthly_income > 0 ? 'text-emerald-600' : 'text-slate-400'}
        />
        <InfoRow label="Currency" value={user?.currency || 'INR'} />
        <InfoRow
          label="Member Since"
          value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
        />
        <InfoRow label="App Version" value="FinanceX v1.0" />
      </Section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import {
  CheckCircle2, Eye, EyeOff, ArrowLeft, Lock, Mail,
  User, AlertCircle
} from 'lucide-react';

export default function AuthPage({ initialMode, onBackToLanding }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterRoute = location.pathname === '/register' || initialMode === 'register';
  const [isRegister, setIsRegister] = useState(isRegisterRoute);

  useEffect(() => {
    setIsRegister(location.pathname === '/register' || initialMode === 'register');
  }, [location.pathname, initialMode]);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [rememberMe, setRememberMe] = useState(true);

  const [touched, setTouched] = useState({
    name: false, email: false, password: false, confirmPassword: false
  });

  useEffect(() => {
    const remembered = localStorage.getItem('financex_remembered_email');
    if (remembered) { setEmail(remembered); setRememberMe(true); }
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());
  const isNameValid = name.trim().length >= 2;
  const isPasswordValid = password.length >= 6;
  const isConfirmPasswordValid = !isRegister || (password === confirmPassword && confirmPassword.length > 0);

  const errors = {
    name: touched.name && !isNameValid ? 'Name must be at least 2 characters.' : null,
    email: touched.email && !isEmailValid ? 'Please enter a valid email.' : null,
    password: touched.password && !isPasswordValid ? 'Password must be at least 6 characters.' : null,
    confirmPassword: touched.confirmPassword && !isConfirmPasswordValid ? 'Passwords do not match.' : null,
  };

  const isFormValid = isRegister
    ? (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid)
    : (isEmailValid && password.length > 0);

  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!isFormValid) return;
    setLoading(true);
    try {
      if (isRegister) {
        await register({ name: name.trim(), email: email.trim(), password, currency, monthly_income: 0.0 });
      } else {
        await login(email.trim(), password);
        if (rememberMe) localStorage.setItem('financex_remembered_email', email.trim());
        else localStorage.removeItem('financex_remembered_email');
      }
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (toRegister) => {
    setIsRegister(toRegister);
    setServerError('');
    setTouched({ name: false, email: false, password: false, confirmPassword: false });
    navigate(toRegister ? '/register' : '/login');
  };

  const inputClass = (error) =>
    `w-full pl-10 pr-3.5 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
      error
        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
        : 'border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
    }`;

  const checklistItems = isRegister ? [
    'Secure & private — your data stays yours',
    'Simple, clean interface with zero clutter',
    'AI-powered spending insights built in',
    'Start your financial freedom journey'
  ] : [
    'Track expenses across 5 focused categories',
    'Set smart monthly & category budgets',
    'Achieve your savings goals on time',
    'Predictive forecast & anomaly detection'
  ];

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row font-['Plus_Jakarta_Sans',sans-serif]">

      {/* ── Left Branding Panel ── */}
      <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 sm:p-10 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Logo + Back */}
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <Link to="/" className="hover:opacity-90 transition-opacity">
              <Logo size="default" light={true} />
            </Link>
            <button
              onClick={() => { if (onBackToLanding) onBackToLanding(); else navigate('/'); }}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight mb-6 sm:mb-8">
            {isRegister ? 'A Smarter Way to Manage Money' : 'Manage Today, Build Tomorrow'}
          </h2>

          <ul className="space-y-3.5 sm:space-y-4 text-sm text-slate-300">
            {checklistItems.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom bars — hidden on mobile to save space */}
        <div className="relative z-10 pt-8 mt-auto hidden sm:flex items-end gap-2.5 h-20 opacity-60">
          {[8, 14, 18, 24, 28, 20].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-lg ${i === 4 ? 'bg-emerald-500' : 'bg-emerald-800/60'}`}
              style={{ height: `${h * 3}px` }}
            />
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="w-full md:w-7/12 flex flex-col justify-center p-6 sm:p-10 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <div className="md:hidden mb-5">
            <Logo size="default" />
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isRegister ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isRegister
                ? 'Join FinanceX and take control of your finances'
                : 'Sign in to your account'}
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" required placeholder="Your full name"
                    value={name} onChange={e => setName(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={inputClass(errors.name)}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.name}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email" required placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={inputClass(errors.email)}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'} required placeholder="Min 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`${inputClass(errors.password)} pr-10`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} required placeholder="Re-enter password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`${inputClass(errors.confirmPassword)} pr-10`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Currency */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500">
                  <option value="INR">INR (₹) — Indian Rupee</option>
                  <option value="USD">USD ($) — US Dollar</option>
                  <option value="EUR">EUR (€) — Euro</option>
                  <option value="GBP">GBP (£) — British Pound</option>
                  <option value="AED">AED — UAE Dirham</option>
                  <option value="SGD">SGD — Singapore Dollar</option>
                </select>
              </div>
            )}

            {/* Remember me */}
            {!isRegister && (
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="remember" checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-emerald-500 cursor-pointer" />
                <label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2">
              {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-xs text-slate-500 mt-6">
            {isRegister ? (
              <>Already have an account?{' '}
                <button type="button" onClick={() => switchMode(false)}
                  className="text-emerald-600 font-bold hover:underline">Sign in</button>
              </>
            ) : (
              <>Don't have an account?{' '}
                <button type="button" onClick={() => switchMode(true)}
                  className="text-emerald-600 font-bold hover:underline">Create one free</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

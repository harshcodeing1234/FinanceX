import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import {
  ArrowRight, Sparkles, TrendingUp, ShieldCheck, CheckCircle2,
  ChevronDown, ChevronUp, Star, Lock, BarChart3, Users, Compass,
  Sliders, ArrowUpRight, Github, Twitter, Linkedin, ExternalLink
} from 'lucide-react';

// Smooth scroll-reveal wrapper that animates on both scroll down & scroll up
function Reveal({ children, className = '', direction = 'up', delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Triggers smoothly on enter and exit so both scroll down & up re-animate
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  const getTransform = () => {
    if (direction === 'up') {
      return isVisible
        ? 'translate-y-0 opacity-100 scale-100'
        : 'translate-y-10 opacity-0 scale-[0.98]';
    }
    if (direction === 'left') {
      return isVisible
        ? 'translate-x-0 opacity-100'
        : '-translate-x-10 opacity-0';
    }
    if (direction === 'right') {
      return isVisible
        ? 'translate-x-0 opacity-100'
        : 'translate-x-10 opacity-0';
    }
    return isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95';
  };

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage({ onGoToLogin, onGoToRegister }) {
  const { user } = useAuth();
  const { toast } = useDialog();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (onGoToLogin) onGoToLogin();
    else navigate('/login');
  };

  const handleRegister = () => {
    if (onGoToRegister) onGoToRegister();
    else navigate('/register');
  };

  // Interactive Simulator State
  const [income, setIncome] = useState(75000);
  const [savingsRate, setSavingsRate] = useState(30);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Floating Back to Top Button
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const monthlySavings = Math.round(income * (savingsRate / 100));
  const oneYearSavings = monthlySavings * 12;
  const fiveYearGrowth = Math.round(oneYearSavings * 5 * 1.15); // estimated 15% compound yield
  const allowedBudget = income - monthlySavings;

  const faqs = [
    {
      q: "How does the ML Spending Forecast work?",
      a: "FinanceX uses an ensemble Random Forest Regressor trained on lagged spending velocity, multi-month trends, and category distribution to forecast your upcoming month's expenses with over 95% R² accuracy."
    },
    {
      q: "Why are there only 5 categories?",
      a: "Cognitive science and financial psychology prove that micro-categorizing into 30+ buckets leads to decision fatigue and abandoned budgets. FinanceX simplifies into 5 essential domains: Food, Shopping, Travel, Entertainment, and Others."
    },
    {
      q: "How does Anomaly Detection protect my money?",
      a: "Our Isolation Forest pipeline screens transactions in sub-second latency. When an unusually high or out-of-character charge is recorded, FinanceX instantly flags it so you can review potential duplicate or unauthorized payments."
    },
    {
      q: "Is my personal financial data private?",
      a: "Yes, 100%. FinanceX runs local inference pipelines with JWT-encrypted authentication. Your transaction data is never sold or shared with any third-party ad networks."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-500 selection:text-white">
      {/* 1. Translucent Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link to="/" className="hover:opacity-90 transition-opacity shrink-0">
            <Logo size="default" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-bold text-slate-600">
            <a href="#overview" className="hover:text-emerald-600 transition-colors whitespace-nowrap">Overview</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors whitespace-nowrap">Capabilities</a>
            <a href="#simulator" className="hover:text-emerald-600 transition-colors whitespace-nowrap">Simulator</a>
            <a href="#testimonials" className="hover:text-emerald-600 transition-colors whitespace-nowrap">Stories</a>
            <a href="#faq" className="hover:text-emerald-600 transition-colors whitespace-nowrap">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="px-2.5 sm:px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegister}
                  className="px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Real Imagery & Floating Glass Badges */}
      <section id="overview" className="relative pt-12 sm:pt-16 pb-16 sm:pb-24 overflow-hidden">
        {/* Soft background ambient gradient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-emerald-200/50 via-teal-100/40 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Content */}
            <Reveal direction="up" className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>The Future of Personal Wealth Intelligence</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Master Your Wealth <br />
                with <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Precision AI</span>
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Experience automated 5-category money tracking, next-month predictive spending forecasts, and real-time anomaly protection powered by 4 machine learning engines.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-3 w-full sm:w-auto">
                <button
                  onClick={handleRegister}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Start Your Journey Free</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Free to use
                </span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Bank-grade encryption
                </span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Zero credit card needed
                </span>
              </div>
            </Reveal>

            {/* Right Visual: High-Quality Imagery with Floating Animated Badges */}
            <Reveal direction="up" delay={150} className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Main Image Frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
                  <img
                    src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=80"
                    alt="Financial Freedom and Modern Tech"
                    className="w-full h-72 sm:h-[440px] object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  
                  {/* Photo bottom overlay text */}
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/80 text-white">
                      Live Financial Stream
                    </span>
                    <p className="text-sm font-bold mt-1 text-white">
                      Real-time insight generation for modern individuals.
                    </p>
                  </div>
                </div>

                {/* Floating Badge 1: Top Left - Anomaly Protection (Animated Float) */}
                <div className="absolute -top-4 -left-6 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 shadow-xl animate-float hidden sm:flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Isolation Forest</span>
                    <span className="text-xs font-black text-slate-900">Anomaly Shield Active</span>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom Right - Forecast Engine (Animated Float Delayed) */}
                <div className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 shadow-xl animate-float-delayed hidden sm:flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Forecast Accuracy</span>
                    <span className="text-xs font-black text-slate-900">95.6% R² Predictive Power</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. Proof Metric Counter Bar */}
      <Reveal direction="up" className="bg-white border-y border-slate-200/80 py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900">95.6%</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forecast Model Score</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-600">4 Engines</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scikit & XGBoost Live</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900">5 Categories</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zero Decision Fatigue</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-blue-600">&lt; 15ms</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-second Latency</p>
          </div>
        </div>
      </Reveal>

      {/* 4. Bento Grid Capabilities Showcase */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <Reveal direction="up" className="text-center max-w-2xl mx-auto mb-14 sm:mb-16 space-y-2">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Intelligent Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Designed for Clarity, Built with Machine Learning
          </h2>
          <p className="text-sm text-slate-500 font-normal">
            Four specialized machine learning models work continuously behind the scenes to keep your capital safe and growing.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: 5 Core Categories */}
          <Reveal direction="up" delay={50} className="md:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft hover:shadow-card transition-all flex flex-col justify-between overflow-hidden relative group">
            <div className="max-w-md space-y-3 z-10 relative">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                Focused Hierarchy
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                5 Standard Categories. Zero Chaos.
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                Forget managing 40 cluttered subcategories. FinanceX channels all transactions into 5 intuitive streams: <strong>Food</strong>, <strong>Shopping</strong>, <strong>Travel</strong>, <strong>Entertainment</strong>, and <strong>Others</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-6 sm:pt-8 z-10 relative">
              {[
                { name: 'Food', color: 'bg-red-50 text-red-600 border-red-200' },
                { name: 'Shopping', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                { name: 'Travel', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                { name: 'Entertainment', color: 'bg-purple-50 text-purple-600 border-purple-200' },
                { name: 'Others', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
              ].map((c, i) => (
                <div key={i} className={`p-2 sm:p-2.5 rounded-xl border text-center text-xs font-bold whitespace-nowrap ${c.color}`}>
                  {c.name}
                </div>
              ))}
            </div>

            <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none bg-gradient-to-l from-emerald-500 to-transparent"></div>
          </Reveal>

          {/* Card 2: Spending Forecast (Random Forest) */}
          <Reveal direction="up" delay={150} className="md:col-span-4 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-card flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-3 relative z-10">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 font-mono">
                Model 1 • Regression
              </span>
              <h3 className="text-xl font-bold text-white">Next Month Forecast</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Random Forest Regressor extrapolates multi-month expenditure lag velocity to project upcoming spending amounts before the month begins.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-300 relative z-10">
              <span>Predictive Score</span>
              <span className="font-bold text-blue-400">95.6% R²</span>
            </div>
          </Reveal>

          {/* Card 3: Budget Overrun Radar (XGBoost) */}
          <Reveal direction="up" delay={100} className="md:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700 font-mono">
                Model 2 • Classification
              </span>
              <h3 className="text-xl font-bold text-slate-900">Budget Risk Radar</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                XGBoost Classifier continuously measures daily burn rate against time elapsed to alert you before budgets are breached.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Pacing Alert:</span>
              <span className="text-emerald-600 font-bold">Proactive Intervention</span>
            </div>
          </Reveal>

          {/* Card 4: Spending Behavior Segmentation (K-Means) */}
          <Reveal direction="up" delay={180} className="md:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-purple-50 text-purple-700 font-mono">
                Model 3 • Clustering
              </span>
              <h3 className="text-xl font-bold text-slate-900">Persona Intelligence</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unsupervised K-Means maps your financial habits to tailored archetypes like <em>Disciplined Saver</em> or <em>Balanced Spender</em> with tailored optimization recommendations.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Archetype Insights:</span>
              <span className="text-purple-600 font-bold">3 Custom Clusters</span>
            </div>
          </Reveal>

          {/* Card 5: Anomaly Shield (Isolation Forest) */}
          <Reveal direction="up" delay={260} className="md:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft hover:shadow-card transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-red-50 text-red-600 font-mono">
                Model 4 • Anomaly
              </span>
              <h3 className="text-xl font-bold text-slate-900">Outlier Isolation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Isolation Forest automatically scores transactions on submission, isolating abnormal payment spikes before they hurt your monthly goals.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Decision Function:</span>
              <span className="text-red-500 font-bold">Sub-second Screening</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. Interactive Financial Freedom Simulator */}
      <section id="simulator" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
        <Reveal direction="up" className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-12 shadow-soft relative overflow-hidden">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 space-y-1">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Dynamic Simulator</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Calculate Your 1-Year Wealth Trajectory
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Adjust your monthly earnings and target savings to preview your financial progression.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 items-center">
            {/* Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                  <span>Monthly Income</span>
                  <span className="text-base font-black text-emerald-600">₹{income.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="300000"
                  step="5000"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹20,000</span>
                  <span>₹3,00,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                  <span>Target Savings Ratio</span>
                  <span className="text-base font-black text-emerald-600">{savingsRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>5% (Conservative)</span>
                  <span>60% (High Velocity)</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Display */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white border border-emerald-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                1-Year Retained Capital
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                ₹{oneYearSavings.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500">
                5-Year Projected Yield: <strong className="text-emerald-700 font-bold">₹{fiveYearGrowth.toLocaleString('en-IN')}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-200/60 text-xs">
                <div>
                  <span className="text-slate-500 block">Monthly Savings</span>
                  <strong className="text-emerald-700 font-bold text-sm">₹{monthlySavings.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Max Expense Limit</span>
                  <strong className="text-slate-800 font-bold text-sm">₹{allowedBudget.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <button
                onClick={() => user ? navigate('/dashboard') : handleRegister()}
                className="w-full py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] mt-2 flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Track This Target in Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6. User Stories / Social Proof */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-slate-200/80">
        <Reveal direction="up" className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Social Proof</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Loved by Everyday Savers</h2>
          <p className="text-xs text-slate-500">See how real users unlocked financial clarity with FinanceX.</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal direction="up" delay={50} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                "Having only 5 categories is genius. Other apps gave me 40 categories and I gave up in two days. The next-month forecast kept me ₹12,000 under budget last month!"
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                alt="Aarushi"
                className="w-10 h-10 rounded-full object-cover border border-emerald-200"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Aarushi Mehta</p>
                <p className="text-[10px] text-slate-400">Product Designer • Bengaluru</p>
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={150} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                "The anomaly detection flagged a duplicate subscription payment that I had completely forgotten about. FinanceX literally saved me money within my first week."
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                alt="Rohan"
                className="w-10 h-10 rounded-full object-cover border border-emerald-200"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Rohan Verma</p>
                <p className="text-[10px] text-slate-400">Software Engineer • Hyderabad</p>
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={250} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                "The UI is so clean and crisp. No clutter, no confusing banking jargon. It treats ML like a helpful assistant rather than a gimmick."
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                alt="Pooja"
                className="w-10 h-10 rounded-full object-cover border border-emerald-200"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Pooja Nair</p>
                <p className="text-[10px] text-slate-400">Management Consultant • Mumbai</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. Interactive FAQ Accordion */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
        <Reveal direction="up" className="text-center mb-10 sm:mb-12 space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Frequently Asked Questions</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Got Questions? We Have Answers.</h2>
        </Reveal>

        <Reveal direction="up" delay={100} className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-soft transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed font-normal border-t border-slate-50 pt-3 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </Reveal>
      </section>

      {/* 8. Call To Action - EXACTLY ONE PRIMARY BUTTON */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 w-full">
        <Reveal direction="up" className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-4 sm:space-y-5">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Ready to Upgrade Your Financial Intelligence?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Join thousands taking control of their money with predictive ML and zero hassle.
            </p>
            {/* Exactly One Single Primary Button */}
            <div className="pt-2 sm:pt-3 flex justify-center">
              <button
                onClick={handleRegister}
                className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all whitespace-nowrap flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 9. Modern 2-Column Footer */}
      <footer className="bg-white border-t border-slate-200/90 pt-12 sm:pt-16 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 pb-12 border-b border-slate-100">
            {/* Column 1: Brand & Exploration Navigation */}
            <div className="space-y-5">
              <Logo size="default" />
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal max-w-md">
                FinanceX is a complete personal finance management platform engineered with automated 5-category money tracking and 4 integrated machine learning pipelines.
              </p>

              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>All 4 ML Engines Operational</span>
              </div>

              {/* Quick Links Row */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Explore</p>
                <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
                  <a href="#overview" className="hover:text-emerald-600 transition-colors">Overview</a>
                  <a href="#features" className="hover:text-emerald-600 transition-colors">Capabilities</a>
                  <a href="#simulator" className="hover:text-emerald-600 transition-colors">Wealth Simulator</a>
                  <a href="#testimonials" className="hover:text-emerald-600 transition-colors">User Stories</a>
                  <a href="#faq" className="hover:text-emerald-600 transition-colors">FAQ</a>
                </nav>
              </div>
            </div>

            {/* Column 2: Stay Informed Newsletter & Social Links */}
            <div className="space-y-4 md:pl-8 md:border-l md:border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-900 tracking-tight">Stay Informed</p>
                <p className="text-xs text-slate-500 font-normal mt-1 max-w-sm">
                  Receive periodic engineering insights on personal finance modeling, AI budgeting, and feature updates.
                </p>
              </div>

              <div className="flex gap-2 pt-1 max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 flex-1 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => toast.success("Subscribed! Thank you for joining FinanceX updates.", "Newsletter")}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0"
                >
                  Join
                </button>
              </div>

              {/* Social Channels */}
              <div className="pt-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Connect With Us</p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 flex items-center justify-center transition-colors"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 flex items-center justify-center transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Tagline */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-400">
            <p>© {new Date().getFullYear()} FinanceX Inc. All rights reserved.</p>
            <p className="text-[11px] text-slate-400">Precision Machine Learning for Modern Personal Finance</p>
          </div>
        </div>
      </footer>

      {/* Floating Smooth Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-slate-900/90 hover:bg-emerald-600 text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 animate-in fade-in zoom-in-75 duration-200"
          title="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Target,
  Trophy,
  Sparkles
} from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: Receipt },
    { path: '/budgets', label: 'Budgets', icon: Target },
    { path: '/goals', label: 'Goals', icon: Trophy },
    { path: '/ai-insights', label: 'AI Insights', icon: Sparkles, badge: 'ML' },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around md:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.06)] font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 relative group active:scale-95 ${
              isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {/* Active Pill / Indicator top bar */}
            {isActive && (
              <span className="absolute -top-1.5 w-8 h-1 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50 animate-in fade-in zoom-in-75 duration-150"></span>
            )}

            {/* Icon with optional badge */}
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              {item.badge && (
                <span
                  className={`absolute -top-1 -right-2 text-[8px] font-black px-1 py-0.2 rounded-full uppercase leading-tight ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              className={`text-[10px] tracking-tight mt-1 transition-colors ${
                isActive ? 'font-bold text-emerald-600' : 'font-semibold text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

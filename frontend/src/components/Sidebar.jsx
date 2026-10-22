import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Logo from './Logo';
import {
  LayoutDashboard,
  Receipt,
  Target,
  Trophy,
  BarChart2,
  Sparkles,
  User,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', path: '/transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', path: '/budgets', label: 'Budgets', icon: Target },
    { id: 'goals', path: '/goals', label: 'Goals', icon: Trophy },
    { id: 'analytics', path: '/analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'ai-insights', path: '/ai-insights', label: 'AI Insights', icon: Sparkles},
    { id: 'profile', path: '/profile', label: 'Profile', icon: User },
    { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Close mobile sidebar on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNav = (item) => {
    navigate(item.path);
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  const renderNavLinks = () => (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (Permanent left column) */}
      <aside className="hidden md:flex w-60 h-screen bg-white border-r border-slate-200/80 p-5 flex-col justify-between shrink-0 select-none overflow-y-auto sticky top-0">
        <div>
          <Link to="/dashboard" className="block px-2 mb-8 hover:opacity-90 transition-opacity">
            <Logo size="default" />
          </Link>
          {renderNavLinks()}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer (Slide-out on phone) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-out Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200 select-none overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]"
          >
            <div>
              {/* Drawer Header with Logo and Close X */}
              <div className="flex items-center justify-between px-2 mb-6 pb-4 border-b border-slate-100">
                <Link to="/dashboard" onClick={onClose} className="hover:opacity-90 transition-opacity">
                  <Logo size="default" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavLinks()}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

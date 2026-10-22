import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import {
  Bell, User, Settings, LogOut, Sparkles, Receipt, Menu
} from 'lucide-react';

export default function Header({ title, subtitle, onNavigate, onToggleMobileMenu }) {
  const { user, logout } = useAuth();
  const { toast } = useDialog();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'User';
  const initial = user?.name ? user.name[0].toUpperCase() : 'U';
  const avatarSrc = user?.avatar || null;

  const routeMeta = {
    '/dashboard': { title: null, subtitle: null },
    '/transactions': { title: 'Transactions', subtitle: 'Manage your income and expenses' },
    '/budgets': { title: 'Budgets', subtitle: 'Set and manage your spending limits' },
    '/goals': { title: 'Savings Goals', subtitle: 'Turn your dreams into reality' },
    '/analytics': { title: 'Analytics', subtitle: 'Understand your financial patterns' },
    '/ai-insights': { title: 'AI-Powered Insights', subtitle: 'Personalized insights from your financial data' },
    '/profile': { title: 'User Profile', subtitle: 'Manage your personal credentials and preferences' },
    '/settings': { title: 'Settings', subtitle: 'System configuration and alert rules' },
  };

  const currentMeta = routeMeta[location.pathname] || { title: null, subtitle: null };
  const effectiveTitle = title !== undefined ? title : currentMeta.title;
  const effectiveSubtitle = subtitle !== undefined ? subtitle : currentMeta.subtitle;

  const handleMenuClick = (routeKey) => {
    setIsProfileOpen(false);
    navigate(`/${routeKey}`);
    if (onNavigate) {
      onNavigate(routeKey);
    }
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="px-4 sm:px-6 md:px-8 py-3.5 sm:py-5 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0 relative z-30">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate flex items-center gap-1.5">
            {effectiveTitle || `${getGreeting()}, ${displayName} 👋`}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate hidden sm:block">
            {effectiveSubtitle || "Here's your financial overview"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* 1. Notification Bell & Dropdown */}
        <div className="relative">
          <button
            type="button"
            className={`relative p-2 rounded-xl border transition-all shadow-sm ${
              isNotificationOpen
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
            title="Notifications"
            onClick={() => {
              setIsProfileOpen(false);
              setIsNotificationOpen(!isNotificationOpen);
            }}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        {/* 2. Interactive Profile Icon ONLY with Dropdown */}
        <div className="relative pl-1 sm:pl-2 border-l border-slate-200" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-emerald-500/25 border-2 border-white hover:scale-105 transition-all select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            title="User Profile Menu"
          >
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              : initial
            }
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 w-60 sm:w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Header Details */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                    : initial
                  }
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
                  <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Currency: {user?.currency || 'INR'}
                  </span>
                </div>
              </div>

              {/* Functional Menu Items */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handleMenuClick('profile')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuClick('settings')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>System Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuClick('ai-insights')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>AI Insights Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuClick('transactions')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span>All Transactions</span>
                </button>
              </div>

              {/* Logout Item */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

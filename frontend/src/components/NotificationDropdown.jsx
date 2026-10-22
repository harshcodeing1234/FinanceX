import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useDialog } from '../context/DialogContext';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  PiggyBank,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BellOff,
  Clock,
  ExternalLink,
} from 'lucide-react';

function formatRelativeTime(dateString) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

export default function NotificationDropdown({ isOpen, onClose }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();
  const { confirm, toast } = useDialog();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      onClose();
      navigate(notif.link);
    }
  };

  const handleClearAll = async () => {
    const ok = await confirm(
      'Are you sure you want to delete all notifications?',
      'Clear All Notifications'
    );
    if (ok) {
      clearAllNotifications();
      toast.success('All notifications cleared');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'budget':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'goal':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <PiggyBank className="w-4 h-4" />
          </div>
        );
      case 'ml':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'transaction':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
            <ArrowRight className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
            <ShieldAlert className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="
        fixed sm:absolute
        inset-x-3 sm:inset-x-auto
        top-16 sm:top-full sm:right-0 sm:mt-2
        w-auto sm:w-96
        bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50
        overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150
      "
      style={{ filter: 'drop-shadow(0 10px 25px rgba(15, 23, 42, 0.12))' }}
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-white">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                markAllAsRead();
                toast.success('Marked all as read');
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'unread'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <BellOff className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No notifications</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              {activeTab === 'unread'
                ? "You've read all your notifications!"
                : "You don't have any notifications right now."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 sm:p-4 transition-colors flex items-start gap-3 group relative ${
                notif.read ? 'bg-white hover:bg-slate-50/80' : 'bg-emerald-50/30 hover:bg-emerald-50/50'
              }`}
            >
              {/* Icon */}
              {getNotificationIcon(notif.type)}

              {/* Content */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4
                    className={`text-xs font-semibold truncate ${
                      notif.read ? 'text-slate-700' : 'text-slate-900 font-bold'
                    }`}
                  >
                    {notif.title}
                  </h4>
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(notif.timestamp)}</span>
                  {notif.link && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold hover:underline">
                      View <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons (toggle read + delete) */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReadStatus(notif.id);
                  }}
                  className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                    notif.read ? 'text-slate-300 hover:text-emerald-600' : 'text-emerald-600'
                  }`}
                  title={notif.read ? 'Mark as unread' : 'Mark as read'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {notifications.length} total • {unreadCount} unread
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-slate-500 hover:text-red-600 px-2 py-1 rounded transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

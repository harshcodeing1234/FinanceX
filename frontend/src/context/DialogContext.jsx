import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  X,
  HelpCircle
} from 'lucide-react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  // Modal Dialog State (Alert / Confirm / Prompt)
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    variant: 'info', // 'info' | 'success' | 'warning' | 'danger'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    defaultValue: '',
    placeholder: '',
    inputType: 'text',
  });

  const [promptValue, setPromptValue] = useState('');
  const resolverRef = useRef(null);

  // Toasts State
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = {
      id,
      type: toast.type || 'info', // 'success' | 'error' | 'info' | 'warning'
      title: toast.title,
      message: toast.message || (typeof toast === 'string' ? toast : ''),
      duration: toast.duration || 3500
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, title = 'Success') => addToast({ type: 'success', message: msg, title }),
    error: (msg, title = 'Error') => addToast({ type: 'error', message: msg, title, duration: 4500 }),
    info: (msg, title = 'Information') => addToast({ type: 'info', message: msg, title }),
    warning: (msg, title = 'Warning') => addToast({ type: 'warning', message: msg, title, duration: 4000 }),
  };

  // Custom Confirm Promise
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      setDialog({
        isOpen: true,
        type: 'confirm',
        variant: opts.variant || 'danger',
        title: opts.title || 'Are you sure?',
        message: opts.message || '',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
      });
    });
  }, []);

  // Custom Alert Promise
  const alert = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      setDialog({
        isOpen: true,
        type: 'alert',
        variant: opts.variant || 'info',
        title: opts.title || (opts.variant === 'danger' ? 'Notice' : opts.variant === 'success' ? 'Success' : 'Notice'),
        message: opts.message || (typeof options === 'string' ? options : ''),
        confirmText: opts.confirmText || 'OK',
        cancelText: 'Cancel',
      });
    });
  }, []);

  // Custom Prompt Promise
  const prompt = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      setPromptValue(opts.defaultValue || '');
      setDialog({
        isOpen: true,
        type: 'prompt',
        variant: opts.variant || 'info',
        title: opts.title || 'Input Required',
        message: opts.message || '',
        confirmText: opts.confirmText || 'Submit',
        cancelText: opts.cancelText || 'Cancel',
        placeholder: opts.placeholder || 'Enter value...',
        inputType: opts.inputType || 'text',
      });
    });
  }, []);

  const handleConfirm = () => {
    if (resolverRef.current) {
      if (dialog.type === 'prompt') {
        resolverRef.current(promptValue);
      } else {
        resolverRef.current(true);
      }
      resolverRef.current = null;
    }
    setDialog((prev) => ({ ...prev, isOpen: false }));
    setPromptValue('');
  };

  const handleCancel = () => {
    if (resolverRef.current) {
      if (dialog.type === 'prompt') {
        resolverRef.current(null);
      } else {
        resolverRef.current(false);
      }
      resolverRef.current = null;
    }
    setDialog((prev) => ({ ...prev, isOpen: false }));
    setPromptValue('');
  };

  // Keyboard accessibility: Escape cancels, Enter submits prompt or confirm
  useEffect(() => {
    if (!dialog.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && dialog.type !== 'prompt') {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog.isOpen, dialog.type, promptValue]);

  // Variant styling helpers
  const getVariantStyles = () => {
    switch (dialog.variant) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-50 text-red-600 border border-red-200/70',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 shadow-md',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/70',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 shadow-md',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/70',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md',
        };
      case 'info':
      default:
        return {
          icon: dialog.type === 'prompt' ? HelpCircle : Info,
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/70',
          btnBg: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 shadow-md',
        };
    }
  };

  const currentVariant = getVariantStyles();
  const IconComponent = currentVariant.icon;

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt, toast }}>
      {children}

      {/* Floating Custom Toast Notifications */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm pointer-events-none font-['Plus_Jakarta_Sans',sans-serif]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white border rounded-2xl shadow-xl transition-all duration-300 animate-in slide-in-from-top-3 ${
              t.type === 'error'
                ? 'border-red-200 shadow-red-500/5'
                : t.type === 'success'
                ? 'border-emerald-200 shadow-emerald-500/5'
                : t.type === 'warning'
                ? 'border-amber-200 shadow-amber-500/5'
                : 'border-slate-200 shadow-slate-500/5'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                t.type === 'error'
                  ? 'bg-red-50 text-red-600'
                  : t.type === 'success'
                  ? 'bg-emerald-50 text-emerald-600'
                  : t.type === 'warning'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {t.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {t.type === 'warning' && <AlertCircle className="w-4 h-4" />}
              {t.type === 'info' && <Info className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {t.title && <h5 className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{t.title}</h5>}
              <p className="text-xs text-slate-600 leading-snug break-words">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Custom Modal Dialog (Confirm / Alert / Prompt) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Close X Button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header: Icon & Title */}
            <div className="flex items-start gap-4 mb-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${currentVariant.iconBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="pt-0.5 pr-6">
                <h3 className="text-base font-bold text-slate-900 leading-snug">{dialog.title}</h3>
                {dialog.message && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-1 whitespace-pre-line">
                    {dialog.message}
                  </p>
                )}
              </div>
            </div>

            {/* Prompt Input Field */}
            {dialog.type === 'prompt' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConfirm();
                }}
                className="mt-4 mb-2"
              >
                <input
                  type={dialog.inputType || 'text'}
                  autoFocus
                  value={promptValue}
                  placeholder={dialog.placeholder}
                  onChange={(e) => setPromptValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                />
              </form>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
              {dialog.type !== 'alert' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all ${currentVariant.btnBg}`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

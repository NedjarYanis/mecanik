import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const isError = toast.type === 'error';
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${
                  isError 
                    ? 'bg-red-950/90 border-red-500/30 text-white' 
                    : 'bg-zinc-900/90 border-zinc-800 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isError ? (
                    <AlertCircle size={18} className="text-red-500 shrink-0" />
                  ) : (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  )}
                  <p className="text-xs font-bold leading-tight">{toast.message}</p>
                </div>
                <button onClick={() => removeToast(toast.id)} className="text-zinc-500 hover:text-white p-1">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
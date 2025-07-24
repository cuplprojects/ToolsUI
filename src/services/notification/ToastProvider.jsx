import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children, position = 'top-right' }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const positionClasses = {
    'top-right': 'top-14 right-4',
    'top-left': 'top-14 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`fixed z-50 space-y-4 ${positionClasses[position] || 'top-4 right-4'} transition-all`}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              w-80 max-w-sm p-4 pl-5 rounded-lg shadow-lg ring-1 ring-white/20 relative text-white animate-slide-in border-l-4
              ${toast.type === 'success' ? 'bg-green-500 border-green-300' :
                toast.type === 'error' ? 'bg-red-500 border-red-300' :
                toast.type === 'warning' ? 'bg-yellow-400 text-black border-yellow-300' :
                'bg-blue-500 border-blue-300'}
            `}
          >
            <div className="text-base font-medium">{toast.message}</div>

            {/* Progress bar */}
            <div
              className="absolute bottom-0 left-0 h-1 bg-white opacity-70 animate-progress"
              style={{ animationDuration: `${toast.duration}ms` }}
            ></div>
          </div>
        ))}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes slide-in {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }

          @keyframes progress {
            from { width: 100%; }
            to { width: 0%; }
          }
          .animate-progress {
            animation: progress linear forwards;
          }
        `}
      </style>
    </ToastContext.Provider>
  );
};

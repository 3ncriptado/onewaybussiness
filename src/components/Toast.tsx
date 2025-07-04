import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Toast as ToastType } from '../types';

const Toast: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const { removeToast } = useToast();

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
  };

  const Icon = icons[toast.type];

  return (
    <div className={`mb-3 p-4 border rounded-xl shadow-lg backdrop-blur-xl ${colors[toast.type]} animate-in slide-in-from-right-full`}>
      <div className="flex items-start">
        <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium">{toast.title}</h4>
          <p className="text-sm opacity-90">{toast.message}</p>
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="ml-4 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
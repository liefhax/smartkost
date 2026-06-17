import { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, XCircle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';


const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .animate-slide-up {
    animation: slideInRight 0.3s ease-out;
  }
`;
document.head.appendChild(style);

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-200 dark:border-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500',
  },
};

function ToastItem({ notification, onClose }) {
  const Icon = iconMap[notification.type] || Info;
  const colors = colorMap[notification.type] || colorMap.info;

  // Auto close after 3 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div
      className={`
        animate-slide-up bg-white dark:bg-slate-800 
        border rounded-xl shadow-lg p-4 flex items-start gap-3
        transition-all duration-300 hover:shadow-xl
        ${colors.bg} ${colors.border}
      `}
      style={{
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      {/* Icon */}
      <div className={`p-1.5 rounded-lg ${colors.bg}`}>
        <Icon className={`w-4 h-4 ${colors.icon}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${colors.text}`}>
            {notification.title}
          </p>
          <span className="text-[10px] text-slate-400">
            {new Date(notification.timestamp).toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        {notification.message && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(notification.id)}
        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
      </button>
    </div>
  );
}

export default function Toast() {
  const { state, actions } = useDashboard();

  if (state.notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <div className="pointer-events-auto space-y-2 max-h-[80vh] overflow-y-auto">
        {state.notifications.slice(0, 5).map((notification) => (
          <ToastItem
            key={notification.id}
            notification={notification}
            onClose={actions.removeNotification}
          />
        ))}
      </div>
      
      {/* Show more indicator */}
      {state.notifications.length > 5 && (
        <div className="text-center text-xs text-slate-500 bg-white dark:bg-slate-800 rounded-lg p-2 shadow-lg pointer-events-auto">
          +{state.notifications.length - 5} more notifications
        </div>
      )}
    </div>
  );
}
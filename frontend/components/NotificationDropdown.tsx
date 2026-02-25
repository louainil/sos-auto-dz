
import React from 'react';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Notification } from '../types';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onMarkAsRead, onClearAll, onClose }) => {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={16} className="text-green-500" />;
      case 'WARNING': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'ERROR': return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute top-12 right-0 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fade-in origin-top-right">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h3>
          {notifications.length > 0 && (
            <button 
              onClick={onClearAll}
              className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} /> Clear all
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative group ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {notif.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                  {!notif.isRead && (
                    <button 
                      onClick={() => onMarkAsRead(notif.id)}
                      className="absolute bottom-2 right-2 p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;

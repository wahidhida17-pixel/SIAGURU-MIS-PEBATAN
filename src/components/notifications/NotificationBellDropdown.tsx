import React, { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, Info, Check, CheckCheck, X } from 'lucide-react';
import { reminderService } from '../../services/reminderService';
import type { AppNotification } from '../../types/calendar';
import { useAuth } from '../../hooks/useAuth';

export const NotificationBellDropdown: React.FC = () => {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    if (!userProfile) return;
    try {
      const list = await reminderService.getNotifications(userProfile.uid);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.isRead).length);
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [userProfile?.uid]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await reminderService.markNotificationRead(id);
    fetchNotifs();
  };

  const handleMarkAllRead = async () => {
    await reminderService.markAllNotificationsRead(userProfile?.uid);
    fetchNotifs();
  };

  const getIcon = (type: AppNotification['type']) => {
    if (type === 'deadline') return <Clock className="w-4 h-4 text-red-500" />;
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    if (type === 'reminder') return <Clock className="w-4 h-4 text-indigo-500" />;
    return <Info className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden"
        title="Pemberitahuan & Pengingat"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                  Notifikasi & Pengingat
                </span>
                {unreadCount > 0 && (
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Tandai Semua Dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada notifikasi saat ini
                </div>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors flex items-start gap-3 ${
                      !n.isRead
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={e => handleMarkAsRead(n.id!, e)}
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded-md"
                        title="Tandai dibaca"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

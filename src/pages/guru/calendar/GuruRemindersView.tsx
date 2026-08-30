import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Trash2,
  Bell,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { reminderService } from '../../../services/reminderService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ReminderModal } from '../../../components/calendar/ReminderModal';
import type { ReminderItem } from '../../../types/calendar';

export const GuruRemindersView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, [userProfile?.uid]);

  const fetchReminders = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const list = await reminderService.getReminders(userProfile.uid);
      setReminders(list);
    } catch (e) {
      console.error('Error loading reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    await reminderService.dismissReminder(id, { uid: userProfile!.uid, name: userProfile!.name });
    fetchReminders();
  };

  const getPriorityBadge = (priority: ReminderItem['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px]">
            Mendesak
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold text-[10px]">
            Sedang
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
            Biasa
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat daftar pengingat & deadline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Pengingat & Batas Waktu (Deadlines)
          </h1>
          <p className="text-xs text-slate-500">
            Notifikasi otomatis batas pengumpulan nilai, modul ajar, pembagian rapor, dan pengingat tugas pribadi
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Buat Pengingat Baru
        </button>
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          Tidak ada pengingat aktif saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map(rem => (
            <div
              key={rem.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                rem.isDismissed
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                  : rem.priority === 'high'
                  ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(rem.priority)}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {rem.deadlineType}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {rem.time} WIB
                  </span>
                </div>

                <div>
                  <h3
                    className={`font-bold text-sm text-slate-900 dark:text-slate-100 ${
                      rem.isDismissed ? 'line-through' : ''
                    }`}
                  >
                    {rem.title}
                  </h3>
                  {rem.notes && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rem.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Jatuh tempo: <strong>{new Date(rem.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Dibuat oleh: {rem.createdByName}
                </span>

                {!rem.isDismissed ? (
                  <button
                    onClick={() => handleDismiss(rem.id!)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selesai / Tutup
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Selesai</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => fetchReminders()}
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name }}
      />
    </div>
  );
};

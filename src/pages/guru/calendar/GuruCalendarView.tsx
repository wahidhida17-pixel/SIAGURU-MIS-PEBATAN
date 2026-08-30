import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Layers,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { calendarService } from '../../../services/calendarService';
import { scheduleService } from '../../../services/scheduleService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { CalendarGrid } from '../../../components/calendar/CalendarGrid';
import { EventDetailModal } from '../../../components/calendar/EventDetailModal';
import { ReminderModal } from '../../../components/calendar/ReminderModal';
import type { CalendarEvent, CalendarEventType } from '../../../types/calendar';
import type { Schedule } from '../../../types/schedule';

export const GuruCalendarView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [userProfile?.uid]);

  const fetchCalendarData = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const [evts, schs] = await Promise.all([
        calendarService.getEvents({
          academicYear: '2026/2027'
        }),
        scheduleService.getAll()
      ]);
      setEvents(evts);
      setSchedules(schs.filter(s => s.teacherId === userProfile.uid));
    } catch (e) {
      console.error('Error loading calendar data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const filteredEvents = events.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    return true;
  });

  const eventTypes = [
    'Semua',
    'Kegiatan Madrasah',
    'Rapat',
    'Ujian',
    'PTS',
    'PAS',
    'PAT',
    'Pramuka',
    'Keagamaan',
    'Libur'
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat Kalender Akademik & Agenda Madrasah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Kalender Akademik & Agenda Kegiatan
          </h1>
          <p className="text-xs text-slate-500">
            Jadwal kegiatan madrasah, rapat dewan guru, masa ujian PTS/PAS, peringatan hari besar, dan libur akademik
          </p>
        </div>

        <button
          onClick={() => setIsReminderOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Clock className="w-4 h-4" /> + Buat Pengingat Pribadi
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {eventTypes.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t === 'Semua' ? 'all' : t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              (t === 'Semua' && typeFilter === 'all') || typeFilter === t
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Calendar Grid Component */}
      <CalendarGrid
        events={filteredEvents}
        onSelectEvent={handleSelectEvent}
        userRole="guru"
      />

      {/* Modals */}
      <EventDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        event={selectedEvent}
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name, role: 'guru' }}
        onUpdated={() => fetchCalendarData()}
      />

      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        onSaved={() => fetchCalendarData()}
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name }}
      />
    </div>
  );
};

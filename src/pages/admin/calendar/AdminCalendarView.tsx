import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Layers,
  Clock,
  MapPin,
  Users,
  Filter,
  FileText,
  Trash2,
  Edit2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { calendarService } from '../../../services/calendarService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { CalendarGrid } from '../../../components/calendar/CalendarGrid';
import { EventFormModal } from '../../../components/calendar/EventFormModal';
import { EventDetailModal } from '../../../components/calendar/EventDetailModal';
import type { CalendarEvent } from '../../../types/calendar';

export const AdminCalendarView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const list = await calendarService.getEvents({
        academicYear: '2026/2027'
      });
      setEvents(list);
    } catch (e) {
      console.error('Error loading admin calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsFormOpen(true);
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
        <p className="text-xs text-slate-500 mt-2">Memuat Master Kalender Akademik Madrasah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Master Kalender Akademik & Agenda Madrasah
          </h1>
          <p className="text-xs text-slate-500">
            Pengaturan jadwal tahunan MI Syuriyah Pebatan: PTS, PAS, PAT, Masa Libur, Rapat Guru, Jamran, Hari Santri, dan Peringatan Hari Besar Islam
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Tambah Kegiatan / Agenda Baru
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
        userRole="admin"
        onAddEvent={handleCreateNew}
      />

      {/* Modals */}
      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        eventToEdit={editingEvent}
        currentUser={userProfile ? { uid: userProfile.uid, name: userProfile.name || userProfile.displayName || 'Admin', role: 'admin' } : undefined}
        onSaved={() => fetchEvents()}
      />

      <EventDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        event={selectedEvent}
        currentUser={userProfile ? { uid: userProfile.uid, name: userProfile.name || userProfile.displayName || 'Admin', role: 'admin' } : undefined}
        onUpdated={() => fetchEvents()}
        onEdit={e => handleEdit(e)}
      />
    </div>
  );
};

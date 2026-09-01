import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react';
import type { CalendarEvent, CalendarEventType } from '../../types/calendar';

interface CalendarGridProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEvent?: (dateStr?: string) => void;
  userRole?: 'admin' | 'guru';
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  onSelectEvent,
  onAddEvent,
  userRole = 'guru'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const todayDate = new Date();
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahad'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month calculation
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Previous month overflow days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
      isPrevMonth: true
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true
    });
  }

  // Next month overflow days
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
      isNextMonth: true
    });
  }

  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => {
      return dateStr >= e.startDate && dateStr <= e.endDate;
    });
  };

  const getEventTypeColor = (type: CalendarEventType, color?: string) => {
    if (color) return color;
    switch (type) {
      case 'Libur':
        return '#ef4444';
      case 'PTS':
      case 'PAS':
      case 'PAT':
      case 'Ujian':
        return '#8b5cf6';
      case 'Pramuka':
        return '#854d0e';
      case 'Keagamaan':
        return '#059669';
      case 'Rapat':
        return '#2563eb';
      case 'Olahraga':
      case 'Seni':
        return '#0284c7';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-slate-500">
              Kalender Akademik & Agenda Madrasah MI Syuriyah Pebatan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Hari Ini
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Daftar Agenda
            </button>
          </div>

          {onAddEvent && userRole === 'admin' && (
            <button
              onClick={() => onAddEvent()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Agenda
            </button>
          )}
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div className="p-3 sm:p-5">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {dayNames.map((name, i) => (
              <div
                key={name}
                className={`py-1.5 text-xs font-bold uppercase tracking-wider ${
                  i === 6 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              const isSunday = (idx % 7) === 6;

              return (
                <div
                  key={idx}
                  onClick={() => onAddEvent && cell.isCurrentMonth && onAddEvent(cell.dateStr)}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                      : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/40 opacity-40'
                  } ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-50/20 dark:bg-emerald-950/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : isSunday
                          ? 'text-red-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-16">
                    {dayEvents.slice(0, 3).map(evt => {
                      const color = getEventTypeColor(evt.type, evt.color);
                      return (
                        <div
                          key={evt.id}
                          onClick={e => {
                            e.stopPropagation();
                            onSelectEvent(evt);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer text-white transition-transform hover:scale-[1.02]"
                          style={{ backgroundColor: color }}
                          title={`${evt.title} (${evt.startTime || 'Sepanjang Hari'})`}
                        >
                          {evt.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda List View */}
      {viewMode === 'agenda' && (
        <div className="p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Belum ada agenda kegiatan yang terdaftar.
            </div>
          ) : (
            events.map(evt => {
              const color = getEventTypeColor(evt.type, evt.color);
              const startFormatted = new Date(evt.startDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
              const isMultiDay = evt.startDate !== evt.endDate;

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-3 -mx-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold text-white rounded-full"
                          style={{ backgroundColor: color }}
                        >
                          {evt.type}
                        </span>
                        <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {evt.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {evt.description || 'Tidak ada keterangan tambahan.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {startFormatted} {isMultiDay ? `s.d. ${evt.endDate}` : ''}
                        </span>
                        {evt.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {evt.startTime} {evt.endTime ? `- ${evt.endTime}` : 'WIB'}
                          </span>
                        )}
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {evt.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Peserta: {evt.targetAudience}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {evt.reportData && (
                      <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Notulen / Laporan Ada
                      </span>
                    )}
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Lihat Detail →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

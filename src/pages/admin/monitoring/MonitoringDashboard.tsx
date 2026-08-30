import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock, AlertCircle, Calendar, BookOpen, User, Users } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { scheduleService } from '../../../services/scheduleService';
import { attendanceService } from '../../../services/attendanceService';
import { journalService } from '../../../services/journalService';
import { teacherService } from '../../../services/teacherService';
import { subjectService } from '../../../services/subjectService';
import type { Schedule, DayOfWeek } from '../../../types/schedule';
import type { AttendanceSession } from '../../../types/attendance';
import type { Journal } from '../../../types/journal';
import type { Teacher } from '../../../types/teacher';
import type { Subject } from '../../../types/academic';

const DAYS_ID: Record<number, DayOfWeek> = {
  0: 'Senin', // Default to Senin if Sunday
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu'
};

export const MonitoringDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin');

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Determine day from selected date
    const d = new Date(selectedDate);
    const dayIndex = d.getDay();
    const dayName = DAYS_ID[dayIndex] || 'Senin';
    setSelectedDay(dayName);
  }, [selectedDate]);

  useEffect(() => {
    fetchMonitoringData();
  }, [selectedDate, selectedDay]);

  const fetchMonitoringData = async () => {
    setIsLoading(true);
    try {
      const [sData, aData, jData, tData, subData] = await Promise.all([
        scheduleService.getByDay(selectedDay),
        attendanceService.getByDate(selectedDate),
        journalService.getByDate(selectedDate),
        teacherService.getAll(),
        subjectService.getAll()
      ]);
      setSchedules(sData.filter(s => s.status === 'active'));
      setAttendanceSessions(aData);
      setJournals(jData);
      setTeachers(tData);
      setSubjects(subData);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTeacherName = (tCode: string) => {
    const t = teachers.find(item => item.teacherCode === tCode || item.id === tCode);
    return t ? t.name : tCode;
  };

  const getSubjectName = (sCode: string) => {
    const s = subjects.find(item => item.code === sCode || item.id === sCode);
    return s ? s.name : sCode;
  };

  // Metrics
  const totalTodaySchedules = schedules.length;
  const completedAttendanceCount = schedules.filter(s => 
    attendanceSessions.some(a => a.scheduleId === s.id || (a.classId === s.classId && a.teacherId === s.teacherId && a.subjectId === s.subjectId))
  ).length;

  const completedJournalCount = schedules.filter(s => 
    journals.some(j => j.scheduleId === s.id || (j.classId === s.classId && j.teacherId === s.teacherId && j.subjectId === s.subjectId))
  ).length;

  const attendanceRate = totalTodaySchedules > 0 ? Math.round((completedAttendanceCount / totalTodaySchedules) * 100) : 0;
  const journalRate = totalTodaySchedules > 0 ? Math.round((completedJournalCount / totalTodaySchedules) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Monitoring Realtime</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">Pantau keterlaksanaan KBM, absensi siswa, dan jurnal mengajar harian</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 outline-none"
            />
          </div>
          <span className="text-xs font-bold px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            Hari {selectedDay}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jadwal KBM Hari Ini</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalTodaySchedules} <span className="text-xs font-medium text-slate-400">Sesi</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absensi Masuk</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-blue-700">{completedAttendanceCount} <span className="text-xs font-medium text-slate-400">/ {totalTodaySchedules}</span></p>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{attendanceRate}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jurnal Terisi</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-emerald-700">{completedJournalCount} <span className="text-xs font-medium text-slate-400">/ {totalTodaySchedules}</span></p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{journalRate}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Kelengkapan</p>
          <p className={`text-sm font-bold mt-2 ${
            completedAttendanceCount === totalTodaySchedules && totalTodaySchedules > 0 ? 'text-emerald-700' : 'text-amber-600'
          }`}>
            {totalTodaySchedules === 0 ? 'Tidak ada KBM' : completedAttendanceCount === totalTodaySchedules ? 'Semua Sesi Selesai' : 'Sedang Berlangsung'}
          </p>
        </div>
      </div>

      {/* Realtime Schedule Monitoring Table */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Memuat data monitoring KBM...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Keterlaksanaan Pembelajaran Hari Ini ({selectedDate})</h3>
            <span className="text-xs text-slate-500 font-medium">Diurutkan berdasarkan jam pembelajaran</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Jam & Waktu</th>
                  <th className="px-6 py-3.5">Kelas & Mapel</th>
                  <th className="px-6 py-3.5">Guru Pengampu</th>
                  <th className="px-6 py-3.5 text-center">Status Presensi</th>
                  <th className="px-6 py-3.5 text-center">Status Jurnal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada jadwal mengajar terdaftar pada hari {selectedDay}.
                    </td>
                  </tr>
                ) : (
                  schedules
                    .sort((a, b) => a.lessonHour - b.lessonHour)
                    .map(s => {
                      const att = attendanceSessions.find(a => a.scheduleId === s.id || (a.classId === s.classId && a.teacherId === s.teacherId && a.subjectId === s.subjectId));
                      const jrn = journals.find(j => j.scheduleId === s.id || (j.classId === s.classId && j.teacherId === s.teacherId && j.subjectId === s.subjectId));

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">Jam ke-{s.lessonHour}</div>
                            <div className="text-xs text-slate-400 font-mono">{s.startTime} - {s.endTime}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                                Kelas {s.classId}
                              </span>
                              <span className="font-bold text-slate-800">{getSubjectName(s.subjectId)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{getTeacherName(s.teacherId)}</div>
                            <div className="text-xs text-slate-400">Kode: {s.teacherId}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {att ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Diisi
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                  {att.presentCount} H / {att.sickCount} S / {att.permissionCount} I / {att.absentCount} A
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3.5 h-3.5" /> Belum Diisi
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {jrn ? (
                              <div className="inline-flex flex-col items-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  jrn.status === 'Lengkap' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  <BookOpen className="w-3.5 h-3.5" /> {jrn.status}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                                  {jrn.material}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                <AlertCircle className="w-3.5 h-3.5" /> Belum Diisi
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

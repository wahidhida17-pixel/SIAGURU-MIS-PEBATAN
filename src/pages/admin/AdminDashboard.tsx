import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { settingsService } from '../../services/settingsService';
import { teacherService } from '../../services/teacherService';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { subjectService } from '../../services/subjectService';
import { scheduleService } from '../../services/scheduleService';
import { attendanceService } from '../../services/attendanceService';
import { journalService } from '../../services/journalService';
import { StatCard } from '../../components/ui/StatCard';
import { Users, UserSquare2, BookOpen, Database, Calendar, CheckCircle2, Clock, Activity, ArrowRight } from 'lucide-react';
import type { GeneralSettings, ClassData, Subject } from '../../types/academic';
import type { Schedule, DayOfWeek } from '../../types/schedule';
import type { AttendanceSession } from '../../types/attendance';
import type { Journal } from '../../types/journal';

const DAYS_ID: Record<number, DayOfWeek> = {
  0: 'Senin',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu'
};

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);

  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    subjects: 0,
    todaySchedules: 0,
    todayAttendance: 0,
    todayJournals: 0
  });

  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceSession[]>([]);
  const [todayJournals, setTodayJournals] = useState<Journal[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayIndex = new Date().getDay();
  const todayDayName = DAYS_ID[dayIndex] || 'Senin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [generalSettings, t, s, c, sub, allDaySchedules, attData, jrnData] = await Promise.all([
          settingsService.getGeneralSettings(),
          teacherService.getAll(),
          studentService.getAll(),
          classService.getAll(),
          subjectService.getAll(),
          scheduleService.getByDay(todayDayName),
          attendanceService.getByDate(todayStr),
          journalService.getByDate(todayStr)
        ]);

        setSettings(generalSettings);
        setSubjects(sub);

        const activeSchedules = allDaySchedules.filter(item => item.status === 'active');
        setTodaySchedules(activeSchedules);
        setTodayAttendance(attData);
        setTodayJournals(jrnData);

        setStats({
          teachers: t.length,
          students: s.length,
          classes: c.length,
          subjects: sub.length,
          todaySchedules: activeSchedules.length,
          todayAttendance: attData.length,
          todayJournals: jrnData.length
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    };
    fetchDashboardData();
  }, []);

  const getSubjectName = (code: string) => {
    const s = subjects.find(sub => sub.code === code || sub.id === code);
    return s ? s.name : code;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Selamat Datang, {userProfile?.displayName}</h2>
          <p className="text-slate-500 text-sm mt-1">Panel Administrasi & Monitoring SIAGURU MI Syuriyah Pebatan</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100 text-xs font-bold text-emerald-800">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Hari {todayDayName}, {todayStr}</span>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Guru"
          value={stats.teachers.toString()}
          icon={<UserSquare2 className="text-[20px]" />}
          description="Pendidik Aktif"
        />
        <StatCard
          title="Total Siswa"
          value={stats.students.toString()}
          icon={<Users className="text-[20px]" />}
          description="Terdaftar di Madrasah"
        />
        <StatCard
          title="Total Kelas"
          value={stats.classes.toString()}
          icon={<BookOpen className="text-[20px]" />}
          description="Rombongan Belajar"
        />
        <StatCard
          title="Mata Pelajaran"
          value={stats.subjects.toString()}
          icon={<Database className="text-[20px]" />}
          description="Kurikulum Madrasah"
        />
      </div>

      {/* Phase 3 Daily Activity Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jadwal Hari Ini</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.todaySchedules} <span className="text-xs font-normal text-slate-400">Sesi</span></p>
            <Link to="/admin/jadwal" className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 mt-2">
              Kelola Jadwal <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presensi Masuk</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.todayAttendance} <span className="text-xs font-normal text-slate-400">/ {stats.todaySchedules}</span></p>
            <Link to="/admin/absensi" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 mt-2">
              Lihat Rekap Presensi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jurnal Terisi</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{stats.todayJournals} <span className="text-xs font-normal text-slate-400">/ {stats.todaySchedules}</span></p>
            <Link to="/admin/jurnal" className="text-xs font-bold text-purple-600 hover:underline inline-flex items-center gap-1 mt-2">
              Arsip Jurnal <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Monitoring & Academic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">KBM Hari Ini ({todayDayName})</h3>
            <Link to="/admin/monitoring" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
              Monitoring Lengkap
            </Link>
          </div>
          <div className="p-0 divide-y divide-slate-100">
            {todaySchedules.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada jadwal mengajar pada hari ini.
              </div>
            ) : (
              todaySchedules.slice(0, 5).map(s => {
                const hasAtt = todayAttendance.some(a => a.scheduleId === s.id || (a.classId === s.classId && a.teacherId === s.teacherId && a.subjectId === s.subjectId));
                const hasJrn = todayJournals.some(j => j.scheduleId === s.id || (j.classId === s.classId && j.teacherId === s.teacherId && j.subjectId === s.subjectId));

                return (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-xs">
                          Kelas {s.classId}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{getSubjectName(s.subjectId)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Jam ke-{s.lessonHour} ({s.startTime} - {s.endTime}) • Kode Guru: {s.teacherId}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-md font-bold ${
                        hasAtt ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {hasAtt ? '✓ Absensi' : '○ Absensi'}
                      </span>
                      <span className={`px-2 py-1 rounded-md font-bold ${
                        hasJrn ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {hasJrn ? '✓ Jurnal' : '○ Jurnal'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Informasi Lembaga</h3>
          </div>
          <div className="p-5 flex flex-col gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Madrasah</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{settings?.schoolName || 'MI Syuriyah Pebatan'}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Tahun Pelajaran & Semester</span>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">{settings?.academicYear || '2026/2027'} • {settings?.semester || 'Ganjil'}</p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Status Integrasi</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-bold text-slate-700">Firestore & Auth Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

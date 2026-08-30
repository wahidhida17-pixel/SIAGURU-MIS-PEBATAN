import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, Calendar, Activity, ClipboardList, Bot, 
  Clock, CheckCircle2, AlertCircle, ArrowRight, BookOpen, Sparkles, Check
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { teacherService } from '../../services/teacherService';
import { scheduleService } from '../../services/scheduleService';
import { attendanceService } from '../../services/attendanceService';
import { journalService } from '../../services/journalService';
import { subjectService } from '../../services/subjectService';
import type { Schedule, DayOfWeek } from '../../types/schedule';
import type { AttendanceSession } from '../../types/attendance';
import type { Journal } from '../../types/journal';
import type { Teacher } from '../../types/teacher';
import type { Subject } from '../../types/academic';

const DAYS_ID: Record<number, DayOfWeek> = {
  0: 'Senin',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu'
};

export const GuruDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceSession[]>([]);
  const [todayJournals, setTodayJournals] = useState<Journal[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayIndex = new Date().getDay();
  const todayDayName = DAYS_ID[dayIndex] || 'Senin';

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      const [tList, subList, allDaySchedules, attList, jrnList] = await Promise.all([
        teacherService.getAll(),
        subjectService.getAll(),
        scheduleService.getByDay(todayDayName),
        attendanceService.getByDate(todayStr),
        journalService.getByDate(todayStr)
      ]);

      const currentTeacher = tList.find(t => t.email === userProfile.email || t.teacherCode === userProfile.teacherCode || t.userId === userProfile.uid);
      setTeacher(currentTeacher || null);
      setSubjects(subList);

      const teacherId = currentTeacher?.teacherCode || currentTeacher?.id || userProfile.teacherCode;
      
      const myTodaySchedules = allDaySchedules.filter(s => 
        (s.teacherId === teacherId || s.teacherId === userProfile.uid) && s.status === 'active'
      );
      setTodaySchedules(myTodaySchedules);

      const myAttendance = attList.filter(a => a.teacherId === teacherId || a.teacherId === userProfile.uid);
      setTodayAttendance(myAttendance);

      const myJournals = jrnList.filter(j => j.teacherId === teacherId || j.teacherId === userProfile.uid);
      setTodayJournals(myJournals);
    } catch (error) {
      console.error('Error fetching guru dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectName = (code: string) => {
    const s = subjects.find(sub => sub.code === code || sub.id === code);
    return s ? s.name : code;
  };

  const completedAttCount = todaySchedules.filter(s =>
    todayAttendance.some(a => a.scheduleId === s.id || (a.classId === s.classId && a.subjectId === s.subjectId))
  ).length;

  const completedJrnCount = todaySchedules.filter(s =>
    todayJournals.some(j => j.scheduleId === s.id || (j.classId === s.classId && j.subjectId === s.subjectId))
  ).length;

  const quickActions = [
    { name: 'Jadwal Saya', icon: Clock, href: '/guru/jadwal', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Presensi Siswa', icon: Calendar, href: '/guru/absensi', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Jurnal Mengajar', icon: FileText, href: '/guru/jurnal', color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Nilai Siswa', icon: Activity, href: '/guru/nilai', color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'AI Guru', icon: Bot, href: '/guru/ai', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Selamat Mengajar, {teacher?.name || userProfile?.displayName}!
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Pantau jadwal KBM, isi presensi siswa, dan catat jurnal harian madrasah.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100 text-xs font-bold text-emerald-800">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Hari {todayDayName}, {todayStr}</span>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jadwal Hari Ini</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{todaySchedules.length} <span className="text-xs font-normal text-slate-400">Sesi KBM</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presensi Terisi</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-blue-700">{completedAttCount} <span className="text-xs font-normal text-slate-400">/ {todaySchedules.length}</span></p>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {todaySchedules.length > 0 ? Math.round((completedAttCount / todaySchedules.length) * 100) : 100}%
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jurnal Terisi</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-purple-700">{completedJrnCount} <span className="text-xs font-normal text-slate-400">/ {todaySchedules.length}</span></p>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {todaySchedules.length > 0 ? Math.round((completedJrnCount / todaySchedules.length) * 100) : 100}%
            </span>
          </div>
        </div>
      </div>

      {/* Today's Teaching Flow */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" /> Jadwal Mengajar Hari Ini ({todayDayName})
          </h3>
          <Link to="/guru/jadwal" className="text-xs font-bold text-emerald-600 hover:underline">
            Lihat Jadwal Mingguan →
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm">Memuat jadwal KBM hari ini...</p>
          </div>
        ) : todaySchedules.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-slate-200">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Jadwal Mengajar Hari Ini</h4>
            <p className="text-slate-400 text-xs mt-1">Anda tidak memiliki sesi mengajar terdaftar pada hari {todayDayName}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySchedules
              .sort((a, b) => a.lessonHour - b.lessonHour)
              .map(s => {
                const hasAtt = todayAttendance.some(a => a.scheduleId === s.id || (a.classId === s.classId && a.subjectId === s.subjectId));
                const hasJrn = todayJournals.some(j => j.scheduleId === s.id || (j.classId === s.classId && j.subjectId === s.subjectId));

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-emerald-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          Kelas {s.classId}
                        </span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" /> Jam ke-{s.lessonHour} ({s.startTime} - {s.endTime})
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-base">{getSubjectName(s.subjectId)}</h4>
                      {s.room && <p className="text-xs text-slate-400 mt-0.5">Ruang: {s.room}</p>}

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                        <span className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                          hasAtt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {hasAtt ? '✓ Presensi Selesai' : '⏳ Belum Presensi'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                          hasJrn ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {hasJrn ? '✓ Jurnal Lengkap' : '⏳ Belum Jurnal'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant={hasAtt ? 'outline' : 'default'}
                        onClick={() => navigate(`/guru/absensi?scheduleId=${s.id}&classId=${s.classId}&subjectId=${s.subjectId}&date=${todayStr}`)}
                        className="text-xs font-bold"
                      >
                        {hasAtt ? 'Edit Presensi' : 'Isi Presensi'}
                      </Button>
                      <Button
                        size="sm"
                        variant={hasJrn ? 'outline' : 'default'}
                        onClick={() => navigate(`/guru/jurnal?scheduleId=${s.id}&classId=${s.classId}&subjectId=${s.subjectId}&date=${todayStr}&day=${s.day}&hour=${s.lessonHour}`)}
                        className="text-xs font-bold"
                      >
                        {hasJrn ? 'Edit Jurnal' : 'Isi Jurnal'}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-base mb-4">Fitur & Menu Utama</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link 
              key={action.name} 
              to={action.href}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors"
            >
              <div className={`p-3 rounded-2xl ${action.bg} ${action.color} mb-2`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

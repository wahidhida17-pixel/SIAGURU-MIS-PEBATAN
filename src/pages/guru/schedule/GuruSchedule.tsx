import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, BookOpen, CheckCircle, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { scheduleService } from '../../../services/scheduleService';
import { subjectService } from '../../../services/subjectService';
import { teacherService } from '../../../services/teacherService';
import type { Schedule, DayOfWeek } from '../../../types/schedule';
import type { Subject } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';

const DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const GuruSchedule: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      const [tList, subList, allSchedules] = await Promise.all([
        teacherService.getAll(),
        subjectService.getAll(),
        scheduleService.getAll()
      ]);

      const currentTeacher = tList.find(t => t.email === userProfile.email || t.teacherCode === userProfile.teacherCode || t.userId === userProfile.uid);
      setTeacher(currentTeacher || null);
      setSubjects(subList);

      const teacherId = currentTeacher?.teacherCode || currentTeacher?.id || userProfile.teacherCode;
      const mySchedules = allSchedules.filter(s => s.teacherId === teacherId || s.teacherId === userProfile.uid);
      setSchedules(mySchedules);
    } catch (error) {
      console.error('Error fetching teacher schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectName = (code: string) => {
    const s = subjects.find(sub => sub.code === code || sub.id === code);
    return s ? s.name : code;
  };

  const filtered = schedules.filter(s => {
    if (selectedDay !== 'all' && s.day !== selectedDay) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Jadwal Mengajar Saya</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Daftar penugasan kelas dan jam tatap muka untuk {teacher?.name || userProfile?.displayName}
          </p>
        </div>

        {/* Filter Day */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Hari:</label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Hari</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Memuat jadwal mengajar Anda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">Belum Ada Jadwal Mengajar</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            Jadwal mengajar Anda belum dikonfigurasi oleh Administrator madrasah.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered
            .sort((a, b) => {
              const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
              if (dayDiff !== 0) return dayDiff;
              return a.lessonHour - b.lessonHour;
            })
            .map(s => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100">
                      {s.day}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> Jam ke-{s.lessonHour} ({s.startTime} - {s.endTime})
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{getSubjectName(s.subjectId)}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                      Kelas {s.classId}
                    </span>
                    {s.room && (
                      <span className="text-xs text-slate-400">
                        Ruang: {s.room}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => navigate(`/guru/absensi?scheduleId=${s.id}&classId=${s.classId}&subjectId=${s.subjectId}`)}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-300" /> Mulai Presensi Siswa
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-slate-700"
                    onClick={() => navigate(`/guru/jurnal?scheduleId=${s.id}&classId=${s.classId}&subjectId=${s.subjectId}&day=${s.day}&hour=${s.lessonHour}`)}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" /> Isi Jurnal Mengajar
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

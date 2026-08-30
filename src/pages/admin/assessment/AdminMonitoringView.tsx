import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, CheckCircle2, AlertCircle, 
  Search, Filter, Lock, Unlock, ArrowRight, ShieldCheck, UserCheck2 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { teacherService } from '../../../services/teacherService';
import { subjectService } from '../../../services/subjectService';
import { classService } from '../../../services/classService';
import { assignmentService } from '../../../services/assignmentService';
import { studentService } from '../../../services/studentService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Student, Assignment, Subject, Class } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';
import type { Assessment, Grade } from '../../../types/assessment';

interface TeacherMonitoringRow {
  assignmentId: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  totalStudents: number;
  assessmentsCount: number;
  gradesEntered: number;
  gradesExpected: number;
  percent: number;
  status: 'complete' | 'in_progress' | 'not_started';
}

export const AdminMonitoringView: React.FC = () => {
  const [monitoringRows, setMonitoringRows] = useState<TeacherMonitoringRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  useEffect(() => {
    loadMonitoring();
  }, [academicYear, semester]);

  const loadMonitoring = async () => {
    try {
      setLoading(true);
      const [allAssignments, allTeachers, allSubjects, allClasses, allStudents, allAssessments] = await Promise.all([
        assignmentService.getAll(),
        teacherService.getAll(),
        subjectService.getAll(),
        classService.getAll(),
        studentService.getAll(),
        assessmentService.getAssessments({ academicYear, semester })
      ]);

      setTeachers(allTeachers);
      setSubjects(allSubjects);
      setClasses(allClasses);

      const activeAssignments = allAssignments.filter(
        a => a.academicYear === academicYear && a.semester === semester
      );

      const rows: TeacherMonitoringRow[] = [];

      for (const assign of activeAssignments) {
        const teacherObj = allTeachers.find(t => t.id === assign.teacherId);
        const subjectObj = allSubjects.find(s => s.id === assign.subjectId);
        const classObj = allClasses.find(c => c.id === assign.classId);

        const classStudents = allStudents.filter(s => s.classId === assign.classId);
        const subjectAssessments = allAssessments.filter(
          a => a.teacherId === assign.teacherId && a.subjectId === assign.subjectId && a.classId === assign.classId
        );

        const assessCount = subjectAssessments.length;
        const totalStudents = classStudents.length;
        const gradesExpected = assessCount * totalStudents;

        // Count entered grades for this assign
        const grades = await assessmentService.getGradesByClassSubject(
          assign.classId,
          assign.subjectId,
          academicYear,
          semester
        );
        const gradesEntered = grades.filter(g => g.teacherId === assign.teacherId && g.score !== undefined && g.score !== null).length;

        let pct = 0;
        if (gradesExpected > 0) {
          pct = Math.min(100, Math.round((gradesEntered / gradesExpected) * 100));
        }

        let status: 'complete' | 'in_progress' | 'not_started' = 'not_started';
        if (pct === 100 && gradesExpected > 0) {
          status = 'complete';
        } else if (gradesEntered > 0 || assessCount > 0) {
          status = 'in_progress';
        }

        rows.push({
          assignmentId: assign.id || '',
          teacherId: assign.teacherId,
          teacherName: teacherObj?.name || 'Guru',
          subjectId: assign.subjectId,
          subjectName: subjectObj?.name || 'Mapel',
          classId: assign.classId,
          className: classObj?.name || 'Kelas',
          totalStudents,
          assessmentsCount: assessCount,
          gradesEntered,
          gradesExpected,
          percent: pct,
          status
        });
      }

      setMonitoringRows(rows);
    } catch (err) {
      console.error('Error loading admin monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = monitoringRows.filter(row => {
    if (selectedTeacher !== 'all' && row.teacherId !== selectedTeacher) return false;
    if (selectedStatus !== 'all' && row.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTeacher = row.teacherName.toLowerCase().includes(q);
      const matchMapel = row.subjectName.toLowerCase().includes(q);
      const matchKelas = row.className.toLowerCase().includes(q);
      if (!matchTeacher && !matchMapel && !matchKelas) return false;
    }
    return true;
  });

  const completeCount = monitoringRows.filter(r => r.status === 'complete').length;
  const inProgressCount = monitoringRows.filter(r => r.status === 'in_progress').length;
  const notStartedCount = monitoringRows.filter(r => r.status === 'not_started').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-600" />
              <span>Monitoring Keterisian Nilai Guru</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisi progres input nilai asesmen oleh seluruh dewan guru &bull; TP {academicYear} ({semester})
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari guru, mapel, kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Dewan Guru</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Status Keterisian</option>
              <option value="complete">Lengkap (100%)</option>
              <option value="in_progress">Sedang Mengisi (&gt; 0%)</option>
              <option value="not_started">Belum Mulai (0%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Lengkap 100%</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{completeCount} Penugasan</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Sedang Berjalan</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{inProgressCount} Penugasan</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Belum Dimulai</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{notStartedCount} Penugasan</p>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">Tidak ada data penugasan yang sesuai filter</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[180px]">Nama Guru</th>
                  <th className="py-3 px-4 w-40">Mata Pelajaran</th>
                  <th className="py-3 px-4 w-24">Kelas</th>
                  <th className="py-3 px-4 w-28 text-center">Jml Asesmen</th>
                  <th className="py-3 px-4 min-w-[200px]">Progres Keterisian Nilai</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {row.teacherName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {row.subjectName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-800">
                      {row.className}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {row.assessmentsCount}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">{row.gradesEntered} / {row.gradesExpected} Nilai</span>
                          <span className={row.percent === 100 ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
                            {row.percent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              row.percent === 100 ? 'bg-emerald-600' : row.percent > 0 ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.status === 'complete' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Lengkap
                        </span>
                      ) : row.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Activity className="w-3 h-3" /> Proses
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          Belum Mulai
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

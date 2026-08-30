import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Award, BarChart3, Settings, ShieldCheck, 
  Lock, Unlock, Filter, Search, BookOpen, Users, CheckCircle2, 
  ChevronRight, AlertCircle, FileCheck2, UserSquare2 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { teacherService } from '../../../services/teacherService';
import { subjectService } from '../../../services/subjectService';
import { classService } from '../../../services/classService';
import { useAuth } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment, Grade } from '../../../types/assessment';
import type { Subject, Class } from '../../../types/academic';
import type { Teacher } from '../../../types/teacher';

export const AdminAssessmentOverview: React.FC = () => {
  const { userProfile } = useAuth();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  useEffect(() => {
    loadAllData();
  }, [academicYear, semester]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [assessList, teacherList, subjectList, classList] = await Promise.all([
        assessmentService.getAssessments({ academicYear, semester }),
        teacherService.getAll(),
        subjectService.getAll(),
        classService.getAll()
      ]);

      setAssessments(assessList);
      setTeachers(teacherList);
      setSubjects(subjectList);
      setClasses(classList);
    } catch (err) {
      console.error('Error loading admin assessment overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (item: Assessment) => {
    const newLockState = !item.isLocked;
    const confirmMsg = newLockState
      ? `Kunci asesmen "${item.title}" (${item.teacherName || 'Guru'})? Nilai tidak dapat diubah oleh guru sampai dibuka kembali.`
      : `Buka kunci asesmen "${item.title}"?`;

    if (window.confirm(confirmMsg)) {
      try {
        await assessmentService.toggleLockAssessment(item.id!, newLockState, {
          uid: userProfile?.uid || 'admin',
          name: userProfile?.displayName || 'Administrator'
        });
        setAssessments(prev => prev.map(a => a.id === item.id ? { ...a, isLocked: newLockState } : a));
      } catch (err: any) {
        alert('Gagal mengubah status kunci: ' + (err?.message || 'Error'));
      }
    }
  };

  const filteredAssessments = assessments.filter(item => {
    if (selectedTeacher !== 'all' && item.teacherId !== selectedTeacher) return false;
    if (selectedSubject !== 'all' && item.subjectId !== selectedSubject) return false;
    if (selectedClass !== 'all' && item.classId !== selectedClass) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTeacher = (item.teacherName || '').toLowerCase().includes(q);
      const matchMapel = (item.subjectName || '').toLowerCase().includes(q);
      const matchKelas = (item.className || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTeacher && !matchMapel && !matchKelas) return false;
    }
    return true;
  });

  const lockedCount = assessments.filter(a => a.isLocked).length;

  const adminMenuCards = [
    {
      title: 'Monitoring Guru',
      desc: 'Pantau persentase keterisian nilai oleh seluruh guru.',
      href: '/admin/assessment/monitoring',
      icon: Activity,
      color: 'from-emerald-600 to-teal-700',
      badge: 'Real-Time'
    },
    {
      title: 'Rekap Nilai Madrasah',
      desc: 'Supervisi dan rekapitulasi nilai seluruh kelas dan mapel.',
      href: '/admin/assessment/recap',
      icon: BarChart3,
      color: 'from-blue-600 to-indigo-700',
      badge: 'Supervisi'
    },
    {
      title: 'Konfigurasi Penilaian',
      desc: 'Atur bobot, skala nilai, jenis asesmen, dan pembulatan.',
      href: '/admin/assessment/config',
      icon: Settings,
      color: 'from-amber-600 to-orange-700',
      badge: 'Sistem'
    },
    {
      title: 'Persiapan Rapor',
      desc: 'Validasi kelengkapan nilai sebelum penerbitan rapor.',
      href: '/admin/assessment/rapor-prep',
      icon: FileCheck2,
      color: 'from-purple-600 to-indigo-800',
      badge: 'Verifikasi'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-3 border border-emerald-700/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Supervisi Asesmen & Nilai Madrasah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pusat Penilaian & Rapor Siswa
            </h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Supervisi dan kendali penuh data asesmen formatif, sumatif, pembobotan nilai, serta verifikasi kesiapan rapor MI Syuriyah Pebatan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/assessment/monitoring"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>Monitoring Keterisian Nilai</span>
            </Link>
            <Link
              to="/admin/assessment/config"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Konfigurasi Penilaian</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Asesmen</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{assessments.length}</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terkunci</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{lockedCount}</p>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Guru</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{teachers.length}</p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <UserSquare2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kelas</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{classes.length}</p>
          </div>
          <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Admin Modules Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminMenuCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.href}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group hover:border-emerald-300 hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {card.badge}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {card.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 mt-3">
              <span>Buka Menu</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Comprehensive Assessments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>Semua Asesmen Pembelajaran Madrasah</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Daftar asesmen dari seluruh guru dan rombel</p>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Menampilkan <strong className="text-slate-800">{filteredAssessments.length}</strong> asesmen
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari judul, guru, mapel, kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Teacher Filter */}
          <div>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Guru</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Mapel</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-16">
            <LoadingSpinner />
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada asesmen ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[200px]">Judul Asesmen</th>
                  <th className="py-3 px-4 min-w-[150px]">Guru Pengampu</th>
                  <th className="py-3 px-4 w-36">Mata Pelajaran</th>
                  <th className="py-3 px-4 w-28">Kelas</th>
                  <th className="py-3 px-4 w-28">Jenis</th>
                  <th className="py-3 px-4 w-24 text-center">Status</th>
                  <th className="py-3 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500">Materi: {item.material || '-'}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {item.teacherName || 'Guru'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {item.subjectName || 'Mapel'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-800">
                      {item.className || 'Kelas'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Lock className="w-3 h-3" /> Dikunci
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Unlock className="w-3 h-3" /> Terbuka
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleLock(item)}
                        title={item.isLocked ? "Buka Kunci Nilai" : "Kunci Nilai Asesmen"}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          item.isLocked 
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.isLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

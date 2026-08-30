import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, Award, FileText, CheckCircle2, Clock, 
  BarChart3, Plus, ArrowRight, BookOpen, AlertCircle, 
  Filter, Sparkles, ChevronRight, Lock, Unlock
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment, Grade } from '../../../types/assessment';

export const AssessmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'formatif' | 'sumatif'>('all');

  useEffect(() => {
    loadDashboardData();
  }, [teacherId, academicYear, semester]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await assessmentService.getAssessments({
        teacherId,
        academicYear,
        semester
      });
      setAssessments(data);
    } catch (err) {
      console.error('Error loading assessment dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeAssessments = assessments.filter(a => a.status === 'active' || a.status === 'completed');
  const completedAssessments = assessments.filter(a => a.status === 'completed');
  const draftAssessments = assessments.filter(a => a.status === 'draft');

  const filteredAssessments = assessments.filter(a => {
    if (activeTab === 'all') return true;
    if (activeTab === 'formatif') return a.type.toLowerCase().includes('formatif') || a.type.toLowerCase().includes('tugas');
    if (activeTab === 'sumatif') return a.type.toLowerCase().includes('sumatif') || a.type.toLowerCase().includes('pas') || a.type.toLowerCase().includes('pts');
    return true;
  });

  const menuCards = [
    {
      title: 'Asesmen Saya',
      desc: 'Kelola daftar ulangan, tugas harian, dan asesmen semester.',
      count: assessments.length,
      unit: 'Asesmen',
      href: '/guru/assessment/list',
      icon: Activity,
      color: 'from-emerald-600 to-teal-700',
      badge: 'bg-emerald-100 text-emerald-800'
    },
    {
      title: 'Rekap Nilai Siswa',
      desc: 'Matriks nilai lengkap, statistik rata-rata, dan cetak A4.',
      count: 'Tabel',
      unit: 'Lengkap',
      href: '/guru/assessment/recap',
      icon: BarChart3,
      color: 'from-blue-600 to-indigo-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Nilai per TP',
      desc: 'Analisis ketuntasan kriteria berdasarkan Tujuan Pembelajaran.',
      count: 'Analisis',
      unit: 'Per TP',
      href: '/guru/assessment/objectives',
      icon: Award,
      color: 'from-purple-600 to-indigo-800',
      badge: 'bg-purple-100 text-purple-800'
    },
    {
      title: 'Deskripsi Capaian',
      desc: 'Generator otomatis deskripsi positif perkembangan belajar.',
      count: 'Generator',
      unit: 'Rapor',
      href: '/guru/assessment/descriptions',
      icon: Sparkles,
      color: 'from-amber-600 to-orange-700',
      badge: 'bg-amber-100 text-amber-800'
    },
    {
      title: 'Tindak Lanjut & Remedial',
      desc: 'Pencatatan program remedial, pengayaan, dan pendampingan.',
      count: 'Remedial',
      unit: 'Tercatat',
      href: '/guru/assessment/follow-up',
      icon: BookOpen,
      color: 'from-cyan-600 to-teal-800',
      badge: 'bg-cyan-100 text-cyan-800'
    },
    {
      title: 'Persiapan Rapor',
      desc: 'Verifikasi kelengkapan nilai sebelum integrasi rapor.',
      count: 'Verifikasi',
      unit: 'Semester',
      href: '/guru/assessment/rapor-prep',
      icon: FileText,
      color: 'from-rose-600 to-pink-800',
      badge: 'bg-rose-100 text-rose-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-3 border border-emerald-600/40">
              <Activity className="w-3.5 h-3.5" />
              <span>Modul Penilaian & Rekap Nilai Siswa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Penilaian Pembelajaran Guru
            </h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-2 leading-relaxed">
              Selamat datang, <strong>{teacherName}</strong>. Kelola asesmen formatif, sumatif, rekapitulasi nilai, serta generator deskripsi capaian pembelajaran Kurikulum Merdeka MI Syuriyah Pebatan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/guru/assessment/create"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Asesmen Baru</span>
            </Link>
            <Link
              to="/guru/assessment/recap"
              className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5 rounded-xl backdrop-blur-xs border border-white/20 transition-all text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Lihat Rekap Nilai</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asesmen Aktif</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{activeAssessments.length}</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Draft Asesmen</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{draftAssessments.length}</p>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai Lengkap</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{completedAssessments.length}</p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas Diampu</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{classes.length}</p>
          </div>
          <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Modules */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>Menu Utama Penilaian</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuCards.map((card, idx) => (
            <Link
              key={idx}
              to={card.href}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group hover:border-emerald-300 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${card.badge}`}>
                    {card.count} {card.unit}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-800 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 mt-4">
                <span>Buka Modul</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pekerjaan Terbaru Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Asesmen & Penilaian Terbaru</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Daftar kegiatan penilaian pada tahun ajaran aktif</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semua ({assessments.length})
            </button>
            <button
              onClick={() => setActiveTab('formatif')}
              className={`px-3 py-1 rounded-lg transition-colors ${activeTab === 'formatif' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Formatif & Tugas
            </button>
            <button
              onClick={() => setActiveTab('sumatif')}
              className={`px-3 py-1 rounded-lg transition-colors ${activeTab === 'sumatif' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Sumatif / PAS
            </button>
          </div>
        </div>

        {loading || assignLoading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner />
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Belum ada asesmen yang dibuat</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Mulai buat asesmen formatif atau sumatif untuk kelas dan mata pelajaran yang Anda ampu.
            </p>
            <Link
              to="/guru/assessment/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Asesmen Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssessments.slice(0, 6).map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.type}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {item.subjectName || 'Mata Pelajaran'} &bull; {item.className || 'Kelas'}
                    </span>
                    {item.isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <Lock className="w-3 h-3" /> Dikunci
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-500">
                    Materi: <span className="text-slate-700 font-medium">{item.material || '-'}</span> &bull; Tanggal: {item.date || '-'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/guru/assessment/${item.id}/grades`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white text-xs font-bold rounded-xl transition-all border border-emerald-200"
                  >
                    <span>Lanjutkan Input Nilai</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, Target, GitBranch, Calendar, Table, 
  FileText, Award, FolderArchive, Plus, CheckCircle, Clock, 
  ChevronRight, ArrowUpRight, BarChart2, Sparkles, AlertCircle
} from 'lucide-react';
import { learningService } from '../../../services/learningService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export const GuruAdministrationHub: React.FC = () => {
  const navigate = useNavigate();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [stats, setStats] = useState({
    cpCount: 0,
    tpCount: 0,
    atpCount: 0,
    protaCount: 0,
    promesCount: 0,
    moduleCount: 0,
    kktpCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
  }, [teacherId, academicYear, semester]);

  const loadCounts = async () => {
    try {
      setLoading(true);
      const [cps, tps, atps, protas, promeses, modules, kktps] = await Promise.all([
        learningService.getLearningPlans({ teacherId, academicYear, semester }),
        learningService.getLearningObjectives({ teacherId, academicYear, semester }),
        learningService.getATPs({ teacherId, academicYear, semester }),
        learningService.getProtas({ teacherId, academicYear }),
        learningService.getPromesList({ teacherId, academicYear, semester }),
        learningService.getModules({ teacherId, academicYear, semester }),
        learningService.getKKTPs({ teacherId, academicYear, semester })
      ]);

      setStats({
        cpCount: cps.length,
        tpCount: tps.length,
        atpCount: atps.length,
        protaCount: protas.length,
        promesCount: promeses.length,
        moduleCount: modules.length,
        kktpCount: kktps.length
      });
    } catch (err) {
      console.error('Error loading hub stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      id: 'cp',
      title: 'Capaian Pembelajaran (CP)',
      desc: 'Pemetaan fase, elemen, dan capaian kompetensi dasar.',
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-700',
      bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      count: stats.cpCount,
      unit: 'Dokumen',
      route: '/guru/learning/cp'
    },
    {
      id: 'tp',
      title: 'Tujuan Pembelajaran (TP)',
      desc: 'Perumusan TP dengan Kompetensi & Lingkup Materi spesifik.',
      icon: Target,
      color: 'from-blue-600 to-indigo-700',
      bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
      count: stats.tpCount,
      unit: 'Tujuan',
      route: '/guru/learning/tp'
    },
    {
      id: 'atp',
      title: 'Alur Tujuan Pembelajaran (ATP)',
      desc: 'Pengurutan alur logis materi & alokasi jam per semester.',
      icon: GitBranch,
      color: 'from-purple-600 to-indigo-800',
      bgColor: 'bg-purple-50 text-purple-800 border-purple-200',
      count: stats.atpCount,
      unit: 'Alur',
      route: '/guru/learning/atp'
    },
    {
      id: 'prota',
      title: 'Program Tahunan (Prota)',
      desc: 'Distribusi jam efektif tahunan Semester Ganjil & Genap.',
      icon: Calendar,
      color: 'from-amber-600 to-orange-700',
      bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
      count: stats.protaCount,
      unit: 'Dokumen',
      route: '/guru/learning/prota'
    },
    {
      id: 'promes',
      title: 'Program Semester (Promes)',
      desc: 'Matriks sebaran JP mingguan pada bulan efektif.',
      icon: Table,
      color: 'from-cyan-600 to-teal-800',
      bgColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      count: stats.promesCount,
      unit: 'Matriks',
      route: '/guru/learning/promes'
    },
    {
      id: 'modules',
      title: 'Modul Ajar / RPP',
      desc: 'Generator 7-langkah modul ajar terintegrasi P5-PPRA.',
      icon: FileText,
      color: 'from-indigo-600 to-blue-800',
      bgColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      count: stats.moduleCount,
      unit: 'Modul',
      route: '/guru/learning/modules'
    },
    {
      id: 'kktp',
      title: 'KKTP & Rubrik Ketuntasan',
      desc: 'Kriteria ketercapaian tujuan pembelajaran & interval nilai.',
      icon: Award,
      color: 'from-rose-600 to-pink-800',
      bgColor: 'bg-rose-50 text-rose-800 border-rose-200',
      count: stats.kktpCount,
      unit: 'Dokumen',
      route: '/guru/learning/kktp'
    },
    {
      id: 'bank',
      title: 'Bank Perangkat Pembelajaran',
      desc: 'Template siap pakai PAI, Bahasa Arab & Mapel Umum.',
      icon: FolderArchive,
      color: 'from-slate-700 to-slate-900',
      bgColor: 'bg-slate-50 text-slate-800 border-slate-200',
      count: 'Template',
      unit: 'Siap Pakai',
      route: '/guru/learning/bank'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-3 border border-emerald-600/40">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kurikulum Merdeka Madrasah (Kemenag)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrasi Pembelajaran Guru
            </h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-2 leading-relaxed">
              Selamat datang, <strong>{teacherName}</strong>. Susun dan kelola seluruh perangkat kurikulum merdeka (CP, TP, ATP, Prota, Promes, Modul Ajar, dan KKTP) secara terstruktur dan siap cetak format A4 Kemenag.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20 text-xs shrink-0 space-y-1.5">
            <p className="text-emerald-200 font-bold">Informasi Penugasan:</p>
            <p className="text-white font-medium">Tahun Pelajaran: <strong>{academicYear}</strong></p>
            <p className="text-white font-medium">Semester Aktif: <strong>{semester}</strong></p>
            <p className="text-emerald-300 font-bold">{subjects.length} Mapel &bull; {classes.length} Rombel</p>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminModules.map((mod) => (
            <Link
              key={mod.id}
              to={mod.route}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all p-5 flex flex-col justify-between group hover:border-emerald-300 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <mod.icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${mod.bgColor}`}>
                    {mod.count} {mod.unit}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-800 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {mod.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 mt-4">
                <span>Buka Modul</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

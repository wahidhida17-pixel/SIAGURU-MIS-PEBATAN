import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderArchive, Search, Filter, BookOpen, Download, Copy, Eye, 
  Sparkles, CheckCircle, ArrowRight, Layers, FileText, Award, Calendar, Table
} from 'lucide-react';
import { learningService } from '../../../services/learningService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { DocumentTemplate } from '../../../types/learning';

const PRELOADED_TEMPLATES: Partial<DocumentTemplate>[] = [
  {
    id: 'tmpl-1',
    title: 'Modul Ajar Al-Qur\'an Hadits: Membaca Tartil Surah Pendek',
    type: 'module',
    phase: 'Fase B (Kelas 4)',
    subjectCategory: 'PAI & Bahasa Arab',
    description: 'Format Karakter Madrasah P5-PPRA lengkap dengan pembiasaan talaqqi, rubrik tartil, dan asesmen formatif.',
    isPublic: true
  },
  {
    id: 'tmpl-2',
    title: 'Alur Tujuan Pembelajaran (ATP) Akidah Akhlak',
    type: 'atp',
    phase: 'Fase A (Kelas 1 - 2)',
    subjectCategory: 'PAI & Bahasa Arab',
    description: 'ATP esensial untuk pengenalan Kalimah Thayyibah dan Asmaul Husna dengan alokasi 72 JP setahun.',
    isPublic: true
  },
  {
    id: 'tmpl-3',
    title: 'Program Tahunan & Semester (Prota & Promes) IPAS',
    type: 'prota',
    phase: 'Fase B (Kelas 3 - 4)',
    subjectCategory: 'Umum',
    description: 'Matriks alokasi waktu dan pemetaan bab IPAS (Tumbuhan, Wujud Zat, dan Gaya) terstandar.',
    isPublic: true
  },
  {
    id: 'tmpl-4',
    title: 'Modul Ajar Bahasa Arab: Ta\'aruf & Warga Madrasah',
    type: 'module',
    phase: 'Fase A (Kelas 1)',
    subjectCategory: 'PAI & Bahasa Arab',
    description: 'Dilengkapi lagu perkenalan kosakata, flashcard visual, dan lembar kerja mewarnai mufradat.',
    isPublic: true
  },
  {
    id: 'tmpl-5',
    title: 'KKTP & Rubrik Ketercapaian Fikih Ibadah',
    type: 'kktp',
    phase: 'Fase C (Kelas 5 - 6)',
    subjectCategory: 'PAI & Bahasa Arab',
    description: 'Interval rubrik 4 tingkatan penguasaan tata cara salat rawatib dan salat jama\' qashar.',
    isPublic: true
  },
  {
    id: 'tmpl-6',
    title: 'Modul Ajar Matematika: Bilangan Cacah & Pecahan Sederhana',
    type: 'module',
    phase: 'Fase B (Kelas 4)',
    subjectCategory: 'Umum',
    description: 'Model Problem Based Learning dengan media konkret benda di lingkungan madrasah.',
    isPublic: true
  }
];

export const DocumentBank: React.FC = () => {
  const navigate = useNavigate();
  const { subjects, classes, academicYear } = useTeacherAssignments();

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const fetched = await learningService.getTemplates({});
      if (fetched.length > 0) {
        setTemplates(fetched);
      } else {
        // Fallback to sample templates
        setTemplates(PRELOADED_TEMPLATES as DocumentTemplate[]);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setTemplates(PRELOADED_TEMPLATES as DocumentTemplate[]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (tmpl: DocumentTemplate) => {
    if (tmpl.type === 'module') {
      navigate('/guru/learning/modules/new');
    } else if (tmpl.type === 'atp') {
      navigate('/guru/learning/atp');
    } else if (tmpl.type === 'prota') {
      navigate('/guru/learning/prota');
    } else if (tmpl.type === 'kktp') {
      navigate('/guru/learning/kktp');
    } else {
      navigate('/guru/learning/cp');
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchSearch = (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (t.description || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' ? true : t.type === filterType;
    const matchPhase = filterPhase === 'all' ? true : (t.phase || '').includes(filterPhase);
    const matchCategory = filterCategory === 'all' ? true : t.subjectCategory === filterCategory;
    return matchSearch && matchType && matchPhase && matchCategory;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'module':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Modul Ajar</span>;
      case 'atp':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Alur Tujuan (ATP)</span>;
      case 'prota':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Prota / Promes</span>;
      case 'kktp':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">KKTP & Rubrik</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">Perangkat</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-600/40">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Bank Template Perangkat Pembelajaran MI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Bank Perangkat & Template Administrasi</h1>
          <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-2xl">
            Kumpulan referensi dan template modul ajar, ATP, Prota, Promes, serta KKTP siap pakai untuk seluruh mata pelajaran di MI SYURIYAH PEBATAN.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari perangkat pembelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Jenis Dokumen</option>
            <option value="module">Modul Ajar / RPP</option>
            <option value="atp">Alur Tujuan (ATP)</option>
            <option value="prota">Prota & Promes</option>
            <option value="kktp">KKTP & Rubrik</option>
          </select>

          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Fase</option>
            <option value="Fase A">Fase A (Kelas 1-2)</option>
            <option value="Fase B">Fase B (Kelas 3-4)</option>
            <option value="Fase C">Fase C (Kelas 5-6)</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Rumpun</option>
            <option value="PAI & Bahasa Arab">PAI & Bahasa Arab</option>
            <option value="Umum">Mata Pelajaran Umum</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada template yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci atau filter pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  {getTypeBadge(tmpl.type)}
                  <span className="text-[11px] font-semibold text-slate-500">
                    {tmpl.phase}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 mt-1">
                  {tmpl.title}
                </h3>
                <p className="text-xs font-medium text-emerald-700 mt-1">
                  Rumpun: {tmpl.subjectCategory}
                </p>

                <p className="text-xs text-slate-600 line-clamp-3 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                <span className="text-[11px] text-slate-400 font-medium">
                  MI Syuriyah Pebatan
                </span>

                <button
                  onClick={() => handleUseTemplate(tmpl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Gunakan Template</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

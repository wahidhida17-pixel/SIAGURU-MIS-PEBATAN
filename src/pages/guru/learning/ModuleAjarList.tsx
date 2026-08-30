import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Search, Filter, Eye, Edit, Trash2, Copy, 
  Printer, Download, BookOpen, Layers, CheckCircle, Clock, Archive, Sparkles
} from 'lucide-react';
import { learningService } from '../../../services/learningService';
import { settingsService } from '../../../services/settingsService';
import { auditService } from '../../../services/auditService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { useAuth } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { DocumentHeader } from '../../../components/learning/DocumentHeader';
import { DocumentSignature } from '../../../components/learning/DocumentSignature';
import { DocumentPreviewModal } from '../../../components/learning/DocumentPreviewModal';
import type { ModuleAjar, DocStatus } from '../../../types/learning';
import type { GeneralSettings } from '../../../types/academic';

export const ModuleAjarList: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [modules, setModules] = useState<ModuleAjar[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Preview State
  const [previewModule, setPreviewModule] = useState<ModuleAjar | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [teacherId, academicYear, semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedModules, fetchedSettings] = await Promise.all([
        learningService.getModules({ teacherId, academicYear, semester }),
        settingsService.getGeneralSettings()
      ]);
      setModules(fetchedModules);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error loading modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mod: ModuleAjar) => {
    if (window.confirm(`Hapus Modul Ajar "${mod.title}"?`)) {
      try {
        await learningService.deleteModule(mod.id!);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DELETE',
          'MODUL_AJAR',
          mod.id!,
          `Menghapus Modul Ajar: ${mod.title}`
        );
        loadData();
      } catch (err) {
        console.error('Error deleting module:', err);
      }
    }
  };

  const handleDuplicate = (mod: ModuleAjar) => {
    navigate(`/guru/learning/modules/new?duplicate=${mod.id}`);
  };

  const filteredModules = modules.filter(m => {
    const matchSearch = 
      (m.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.subjectName || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.material || '').toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject ? m.subjectId === filterSubject : true;
    const matchClass = filterClass ? m.classId === filterClass : true;
    const matchStatus = filterStatus ? m.status === filterStatus : true;
    return matchSearch && matchSubject && matchClass && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-600/40">
              <FileText className="w-3.5 h-3.5" />
              <span>Perangkat Pembelajaran Kurikulum Merdeka</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Modul Ajar / RPP</h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-xl">
              Susun dan cetak modul ajar berkualitas dengan 7-langkah generator terintegrasi profil pelajar Pancasila & Rahmatan Lil Alamin.
            </p>
          </div>
          <button
            onClick={() => navigate('/guru/learning/modules/new')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Modul Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari judul modul, topik, atau materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">Semua Mata Pelajaran</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>Kelas {c.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="completed">🟢 Selesai</option>
            <option value="draft">🟡 Draft</option>
          </select>
        </div>
      </div>

      {/* Modules Cards Grid */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Modul Ajar Tersimpan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Gunakan wizard penyusunan modul ajar kami untuk menghasilkan dokumen lengkap sesuai Kurikulum Merdeka Madrasah.
          </p>
          <button
            onClick={() => navigate('/guru/learning/modules/new')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Susun Modul</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map(mod => (
            <div
              key={mod.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Kelas {mod.className}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    mod.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {mod.status === 'completed' ? '🟢 Selesai' : '🟡 Draft'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 mt-1">
                  {mod.title}
                </h3>
                <p className="text-xs font-semibold text-emerald-700 mt-1">
                  {mod.subjectName} &bull; {mod.phase}
                </p>

                <p className="text-xs text-slate-500 line-clamp-2 mt-2 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
                  {mod.tpText || mod.material || 'Materi pembelajaran modul'}
                </p>

                {mod.p5ppra && mod.p5ppra.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {mod.p5ppra.slice(0, 2).map((p, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium truncate max-w-[150px]">
                        {p}
                      </span>
                    ))}
                    {mod.p5ppra.length > 2 && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                        +{mod.p5ppra.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                <span className="text-[11px] text-slate-400">
                  {mod.duration || '2 JP'} &bull; v{mod.version || 1}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setPreviewModule(mod);
                      setIsPreviewOpen(true);
                    }}
                    title="Pratinjau & Cetak A4"
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(mod)}
                    title="Duplikat Modul"
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/guru/learning/modules/edit/${mod.id}`)}
                    title="Edit Modul"
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(mod)}
                    title="Hapus Modul"
                    className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewModule && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Modul Ajar - ${previewModule.title}`}
          fileName={`Modul_Ajar_${previewModule.subjectName?.replace(/\s+/g, '_')}_Kelas_${previewModule.className}_${previewModule.academicYear?.replace('/', '-')}`}
        >
          <DocumentHeader
            settings={settings}
            title="MODUL AJAR KURIKULUM MERDEKA"
            subTitle={`${previewModule.subjectName} &bull; ${previewModule.phase} &bull; Kelas ${previewModule.className}`}
          />

          <div className="space-y-5 text-xs sm:text-sm">
            {/* Identity */}
            <div className="border border-slate-300 rounded-md overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-44 bg-slate-50 font-bold p-2 text-slate-700">Penyusun / Guru</td>
                    <td className="p-2 text-slate-900">: {previewModule.teacherName || teacherName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-2 text-slate-700">Satuan Pendidikan</td>
                    <td className="p-2 text-slate-900">: {settings?.schoolName || 'MI SYURIYAH PEBATAN'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-2 text-slate-700">Mata Pelajaran & Kelas</td>
                    <td className="p-2 text-slate-900">: {previewModule.subjectName} &bull; Kelas {previewModule.className} ({previewModule.phase})</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-2 text-slate-700">Tahun Pelajaran & Sem.</td>
                    <td className="p-2 text-slate-900">: {previewModule.academicYear} &bull; Semester {previewModule.semester}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-2 text-slate-700">Alokasi Waktu</td>
                    <td className="p-2 text-slate-900">: {previewModule.duration || '2 JP x 35 Menit'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-2 text-slate-700">Profil Pelajar (P5-PPRA)</td>
                    <td className="p-2 text-slate-900">: {previewModule.p5ppra?.join(', ') || 'Beriman, Bertakwa, Mandiri'}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 font-bold p-2 text-slate-700">Sarana & Media</td>
                    <td className="p-2 text-slate-900">: {previewModule.facilities || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Core */}
            <div>
              <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 text-xs tracking-wider mb-2">
                A. TUJUAN & PEMAHAMAN BERMAKNA
              </h4>
              <div className="space-y-2">
                <div>
                  <strong className="text-slate-800 text-xs">Tujuan Pembelajaran (TP):</strong>
                  <p className="mt-0.5 text-slate-800 pl-3 border-l-2 border-slate-300 leading-relaxed font-medium">
                    {previewModule.tpText || previewModule.title}
                  </p>
                </div>
                {previewModule.meaningfulUnderstanding && (
                  <div>
                    <strong className="text-slate-800 text-xs">Pemahaman Bermakna:</strong>
                    <p className="mt-0.5 text-slate-700 pl-3 border-l-2 border-slate-300 leading-relaxed">
                      {previewModule.meaningfulUnderstanding}
                    </p>
                  </div>
                )}
                {previewModule.triggerQuestions && (
                  <div>
                    <strong className="text-slate-800 text-xs">Pertanyaan Pemantik:</strong>
                    <p className="mt-0.5 text-slate-700 pl-3 border-l-2 border-slate-300 whitespace-pre-line leading-relaxed">
                      {previewModule.triggerQuestions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            <div>
              <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 text-xs tracking-wider mb-2">
                B. KEGIATAN PEMBELAJARAN
              </h4>
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <strong className="text-slate-900">1. Pendahuluan:</strong>
                  <p className="whitespace-pre-line text-slate-700 mt-1 leading-relaxed">{previewModule.openingActivity}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <strong className="text-slate-900">2. Kegiatan Inti:</strong>
                  <p className="whitespace-pre-line text-slate-700 mt-1 leading-relaxed">{previewModule.coreActivity}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <strong className="text-slate-900">3. Penutup:</strong>
                  <p className="whitespace-pre-line text-slate-700 mt-1 leading-relaxed">{previewModule.closingActivity}</p>
                </div>
              </div>
            </div>

            {/* Assessment */}
            <div>
              <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 text-xs tracking-wider mb-2">
                C. ASESMEN & PENILAIAN
              </h4>
              <p className="whitespace-pre-line text-slate-700 text-xs leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                {previewModule.assessment || 'Formatif: Observasi keaktifan dan tes unjuk kerja membaca tartil.\nSumatif: Ujian hafalan ayat.'}
              </p>
            </div>
          </div>

          <DocumentSignature
            settings={settings}
            teacherName={previewModule.teacherName || teacherName}
          />
        </DocumentPreviewModal>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Eye, Edit, Trash2, Copy, 
  Printer, Download, FileText, CheckCircle, Clock, Archive, Sparkles, PlusCircle, X
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
import type { LearningPlan, DocStatus } from '../../../types/learning';
import type { GeneralSettings } from '../../../types/academic';

const PHASE_OPTIONS = [
  'Fase A (Kelas 1 - 2)',
  'Fase B (Kelas 3 - 4)',
  'Fase C (Kelas 5 - 6)',
  'Fase Khusus / Ekstrakurikuler'
];

export const CPList: React.FC = () => {
  const { userProfile } = useAuth();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();
  
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [phase, setPhase] = useState('Fase B (Kelas 3 - 4)');
  const [source, setSource] = useState('Keputusan BSKAP No. 033/H/KR/2022 & Kemenag No. 3211/2022');
  const [description, setDescription] = useState('');
  const [elements, setElements] = useState<{ name: string; description: string }[]>([
    { name: 'Elemen 1', description: '' }
  ]);
  const [status, setStatus] = useState<DocStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);

  // Preview State
  const [previewPlan, setPreviewPlan] = useState<LearningPlan | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [teacherId, academicYear, semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedPlans, fetchedSettings] = await Promise.all([
        learningService.getLearningPlans({ teacherId, academicYear, semester }),
        settingsService.getGeneralSettings()
      ]);
      setPlans(fetchedPlans);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error loading CP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setSubjectId(subjects[0]?.id || '');
    setClassId('');
    setPhase('Fase B (Kelas 3 - 4)');
    setSource('Keputusan BSKAP No. 033/H/KR/2022 & Kemenag No. 3211/2022');
    setDescription('');
    setElements([{ name: 'Elemen Pemahaman / Al-Qur\'an', description: '' }]);
    setStatus('draft');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: LearningPlan) => {
    setIsEditing(true);
    setCurrentId(plan.id || null);
    setSubjectId(plan.subjectId);
    setClassId(plan.classId || '');
    setPhase(plan.phase);
    setSource(plan.source || '');
    setDescription(plan.description);
    setElements(plan.elements && plan.elements.length > 0 ? plan.elements : [{ name: 'Elemen 1', description: '' }]);
    setStatus(plan.status);
    setIsModalOpen(true);
  };

  const handleAddElement = () => {
    setElements([...elements, { name: `Elemen ${elements.length + 1}`, description: '' }]);
  };

  const handleRemoveElement = (index: number) => {
    if (elements.length > 1) {
      setElements(elements.filter((_, i) => i !== index));
    }
  };

  const handleElementChange = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...elements];
    updated[index][field] = value;
    setElements(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      alert('Silakan pilih mata pelajaran.');
      return;
    }
    if (!description.trim()) {
      alert('Capaian Pembelajaran (Deskripsi) wajib diisi.');
      return;
    }

    const selectedSubject = subjects.find(s => s.id === subjectId);
    const selectedClass = classes.find(c => c.id === classId);

    setIsSaving(true);
    try {
      const payload = {
        teacherId,
        teacherName: teacherName || userProfile?.displayName || 'Guru Pengampu',
        subjectId,
        subjectName: selectedSubject?.name || 'Mata Pelajaran',
        classId: classId || null,
        className: selectedClass?.name || 'Semua Paralel',
        phase,
        academicYear,
        semester,
        source,
        description,
        elements,
        status,
        version: isEditing ? 1 : 1
      };

      if (isEditing && currentId) {
        await learningService.updateLearningPlan(currentId, payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'UPDATE',
          'CP',
          currentId,
          `Mengubah CP: ${payload.subjectName} (${payload.phase})`
        );
      } else {
        const newId = await learningService.createLearningPlan(payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'CREATE',
          'CP',
          newId,
          `Membuat CP: ${payload.subjectName} (${payload.phase})`
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving CP:', err);
      alert('Gagal menyimpan Capaian Pembelajaran.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (plan: LearningPlan) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus CP ${plan.subjectName} (${plan.phase})?`)) {
      try {
        await learningService.deleteLearningPlan(plan.id!);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DELETE',
          'CP',
          plan.id!,
          `Menghapus CP: ${plan.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error deleting CP:', err);
      }
    }
  };

  const handleDuplicate = async (plan: LearningPlan) => {
    if (window.confirm(`Duplikat Capaian Pembelajaran ${plan.subjectName}?`)) {
      try {
        const copyPayload = {
          ...plan,
          status: 'draft' as DocStatus,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        delete copyPayload.id;
        const newId = await learningService.createLearningPlan(copyPayload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DUPLICATE',
          'CP',
          newId,
          `Menduplikasi CP: ${plan.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error duplicating CP:', err);
      }
    }
  };

  const handleOpenPreview = (plan: LearningPlan) => {
    setPreviewPlan(plan);
    setIsPreviewOpen(true);
  };

  const filteredPlans = plans.filter(p => {
    const matchSearch = 
      (p.subjectName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.phase || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject ? p.subjectId === filterSubject : true;
    const matchPhase = filterPhase ? p.phase === filterPhase : true;
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    return matchSearch && matchSubject && matchPhase && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-600/40">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kurikulum Merdeka Madrasah</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Capaian Pembelajaran (CP)</h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-xl">
              Susun dan kelola Capaian Pembelajaran berdasarkan Fase & Mata Pelajaran binaan Anda di MI Syuriyah Pebatan.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah CP Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari mapel, fase, materi..."
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
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">Semua Fase</option>
            {PHASE_OPTIONS.map(f => (
              <option key={f} value={f}>{f}</option>
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
            <option value="archived">⚪ Diarsipkan</option>
          </select>
        </div>
      </div>

      {/* CP List Table / Cards */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Capaian Pembelajaran</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Mulai susun dokumen Capaian Pembelajaran (CP) untuk mata pelajaran penugasan Anda.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah CP Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map(plan => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {plan.phase}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5 leading-tight">
                      {plan.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {plan.className ? `Kelas ${plan.className}` : 'Semua Kelas Fase'} &bull; TP {plan.academicYear} ({plan.semester})
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    plan.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : plan.status === 'draft'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {plan.status === 'completed' ? '🟢 Selesai' : plan.status === 'draft' ? '🟡 Draft' : '⚪ Arsip'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-sans mb-3">
                  {plan.description}
                </p>

                {plan.elements && plan.elements.length > 0 && (
                  <div className="space-y-1 mb-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Elemen ({plan.elements.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.elements.map((el, i) => (
                        <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {el.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  v{plan.version || 1} &bull; {new Date(plan.updatedAt || plan.createdAt || Date.now()).toLocaleDateString('id-ID')}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPreview(plan)}
                    title="Pratinjau & Cetak A4"
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(plan)}
                    title="Duplikat Dokumen"
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    title="Edit CP"
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan)}
                    title="Hapus CP"
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

      {/* Modal Form Tambah/Edit CP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  {isEditing ? 'Edit Capaian Pembelajaran' : 'Tambah Capaian Pembelajaran (CP)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fase Kurikulum <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  >
                    {PHASE_OPTIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khusus Kelas (Opsional)
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  >
                    <option value="">Umum untuk Seluruh Kelas pada Fase ini</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>Kelas {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Dokumen
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DocStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  >
                    <option value="draft">🟡 Draft (Masih Disusun)</option>
                    <option value="completed">🟢 Selesai (Final)</option>
                    <option value="archived">⚪ Diarsipkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sumber Regulasi / Rujukan Kurikulum
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Contoh: Keputusan BSKAP No. 033/H/KR/2022 / Kemenag No. 3211/2022"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Capaian Pembelajaran (CP Menyeluruh) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan rumusan Capaian Pembelajaran pada akhir fase ini..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 leading-relaxed"
                />
              </div>

              {/* Elements Builder */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Elemen-Elemen CP
                  </label>
                  <button
                    type="button"
                    onClick={handleAddElement}
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Elemen</span>
                  </button>
                </div>

                {elements.map((el, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Nama Elemen (misal: Al-Qur'an, Akidah, Fiqih)"
                        value={el.name}
                        onChange={(e) => handleElementChange(index, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-emerald-600"
                      />
                      {elements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveElement(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Deskripsi capaian per elemen..."
                      value={el.description}
                      onChange={(e) => handleElementChange(index, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-emerald-600"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-md transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSaving && <LoadingSpinner className="w-3.5 h-3.5 text-white" />}
                  <span>{isEditing ? 'Perbarui CP' : 'Simpan CP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal (A4 Standard) */}
      {previewPlan && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Capaian Pembelajaran - ${previewPlan.subjectName} (${previewPlan.phase})`}
          fileName={`CP_${previewPlan.subjectName?.replace(/\s+/g, '_')}_${previewPlan.academicYear?.replace('/', '-')}`}
        >
          <DocumentHeader
            settings={settings}
            title="CAPAIAN PEMBELAJARAN (CP)"
            subTitle={`${previewPlan.subjectName} &bull; ${previewPlan.phase}`}
          />

          {/* Identity Table */}
          <div className="mb-6 border border-slate-300 rounded-md overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-40 bg-slate-50 font-bold p-2 text-slate-700">Satuan Pendidikan</td>
                  <td className="p-2 text-slate-900">: {settings?.schoolName || 'MI SYURIYAH PEBATAN'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Mata Pelajaran</td>
                  <td className="p-2 text-slate-900">: {previewPlan.subjectName}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Fase / Kelas</td>
                  <td className="p-2 text-slate-900">: {previewPlan.phase} {previewPlan.className ? `(${previewPlan.className})` : ''}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Tahun Pelajaran / Sem.</td>
                  <td className="p-2 text-slate-900">: {previewPlan.academicYear} &bull; Semester {previewPlan.semester}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Guru Pengampu</td>
                  <td className="p-2 text-slate-900">: {previewPlan.teacherName || teacherName}</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Rujukan / Sumber</td>
                  <td className="p-2 text-slate-900">: {previewPlan.source || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Core Content */}
          <div className="space-y-6 text-xs sm:text-sm">
            <div>
              <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-300 pb-1 mb-2">
                A. Capaian Pembelajaran Umum
              </h4>
              <p className="text-slate-800 leading-relaxed text-justify whitespace-pre-line">
                {previewPlan.description}
              </p>
            </div>

            {previewPlan.elements && previewPlan.elements.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-300 pb-1 mb-2">
                  B. Capaian Pembelajaran Berdasarkan Elemen
                </h4>
                <div className="border border-slate-300 rounded-md overflow-hidden">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                        <th className="p-2.5 text-center w-12 border-r border-slate-300">No</th>
                        <th className="p-2.5 text-left w-48 border-r border-slate-300">Elemen</th>
                        <th className="p-2.5 text-left">Capaian Pembelajaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {previewPlan.elements.map((el, i) => (
                        <tr key={i}>
                          <td className="p-2.5 text-center font-semibold border-r border-slate-200">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{el.name}</td>
                          <td className="p-2.5 text-slate-800 leading-relaxed">{el.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DocumentSignature
            settings={settings}
            teacherName={previewPlan.teacherName || teacherName}
          />
        </DocumentPreviewModal>
      )}
    </div>
  );
};

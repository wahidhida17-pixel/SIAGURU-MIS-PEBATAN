import React, { useState, useEffect } from 'react';
import { 
  Award, Plus, Search, Filter, Eye, Edit, Trash2, Copy, 
  Printer, Download, BookOpen, X, CheckCircle, Percent
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
import type { KKTP, KKTPItem, DocStatus, LearningObjective } from '../../../types/learning';
import type { GeneralSettings } from '../../../types/academic';

export const KKTPList: React.FC = () => {
  const { userProfile } = useAuth();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [kktpList, setKktpList] = useState<KKTP[]>([]);
  const [availableTps, setAvailableTps] = useState<LearningObjective[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [phase, setPhase] = useState('Fase B (Kelas 3 - 4)');
  const [status, setStatus] = useState<DocStatus>('draft');
  const [items, setItems] = useState<KKTPItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Preview State
  const [previewKKTP, setPreviewKKTP] = useState<KKTP | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [teacherId, academicYear, semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedKktps, fetchedTps, fetchedSettings] = await Promise.all([
        learningService.getKKTPs({ teacherId, academicYear, semester }),
        learningService.getLearningObjectives({ teacherId, academicYear, semester }),
        settingsService.getGeneralSettings()
      ]);
      setKktpList(fetchedKktps);
      setAvailableTps(fetchedTps);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error loading KKTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    const initialSubject = subjects[0]?.id || '';
    setSubjectId(initialSubject);
    setClassId('');
    setPhase('Fase B (Kelas 3 - 4)');
    setStatus('draft');

    const relatedTps = availableTps.filter(t => t.subjectId === initialSubject);
    if (relatedTps.length > 0) {
      setItems(
        relatedTps.map((tp) => ({
          tpCode: tp.code,
          tpTitle: tp.title,
          description: 'Mampu melafalkan dan menghafal materi dengan tartil',
          interval0_60: 'Belum mencapai ketuntasan, perlu bimbingan remedial menyeluruh.',
          interval61_75: 'Mencapai ketuntasan minimal, bimbingan remedial pada makhraj tertentu.',
          interval76_85: 'Mencapai ketuntasan dengan baik dan lancar.',
          interval86_100: 'Sangat mahir dan tuntas istimewa, diberikan pengayaan lanjutan.'
        }))
      );
    } else {
      setItems([
        {
          tpCode: 'TP-01',
          tpTitle: 'Peserta didik mampu melafalkan surah pilihan',
          description: 'Kriteria ketuntasan membaca surah',
          interval0_60: 'Perlu bimbingan intensif',
          interval61_75: 'Cukup, tuntas dasar',
          interval76_85: 'Baik dan lancar',
          interval86_100: 'Sangat mahir (Pengayaan)'
        }
      ]);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (k: KKTP) => {
    setIsEditing(true);
    setCurrentId(k.id || null);
    setSubjectId(k.subjectId);
    setClassId(k.classId || '');
    setPhase(k.phase || 'Fase B (Kelas 3 - 4)');
    setStatus(k.status);
    setItems(k.items || []);
    setIsModalOpen(true);
  };

  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    const relatedTps = availableTps.filter(t => t.subjectId === newSubjectId);
    if (relatedTps.length > 0 && !isEditing) {
      setItems(
        relatedTps.map((tp) => ({
          tpCode: tp.code,
          tpTitle: tp.title,
          description: 'Mampu memahami materi dengan indikator ketercapaian',
          interval0_60: 'Perlu bimbingan intensif',
          interval61_75: 'Cukup tuntas',
          interval76_85: 'Baik dan mandiri',
          interval86_100: 'Sangat mahir'
        }))
      );
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        tpCode: `TP-${String(items.length + 1).padStart(2, '0')}`,
        tpTitle: 'Tujuan Pembelajaran Baru',
        description: 'Deskripsi kriteria',
        interval0_60: 'Perlu Bimbingan',
        interval61_75: 'Cukup',
        interval76_85: 'Baik',
        interval86_100: 'Sangat Baik'
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof KKTPItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      alert('Pilih mata pelajaran.');
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
        items,
        status,
        version: 1
      };

      if (isEditing && currentId) {
        await learningService.updateKKTP(currentId, payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'UPDATE',
          'KKTP',
          currentId,
          `Mengubah KKTP: ${payload.subjectName} (${academicYear})`
        );
      } else {
        const newId = await learningService.createKKTP(payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'CREATE',
          'KKTP',
          newId,
          `Membuat KKTP: ${payload.subjectName} (${academicYear})`
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving KKTP:', err);
      alert('Gagal menyimpan KKTP.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (k: KKTP) => {
    if (window.confirm(`Hapus KKTP ${k.subjectName}?`)) {
      try {
        await learningService.deleteKKTP(k.id!);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DELETE',
          'KKTP',
          k.id!,
          `Menghapus KKTP: ${k.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error deleting KKTP:', err);
      }
    }
  };

  const handleDuplicate = async (k: KKTP) => {
    if (window.confirm(`Duplikat KKTP ${k.subjectName}?`)) {
      try {
        const copyPayload = {
          ...k,
          status: 'draft' as DocStatus,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        delete copyPayload.id;
        const newId = await learningService.createKKTP(copyPayload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DUPLICATE',
          'KKTP',
          newId,
          `Menduplikasi KKTP: ${k.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error duplicating KKTP:', err);
      }
    }
  };

  const filteredKKTPs = kktpList.filter(k => {
    const matchSearch = (k.subjectName || '').toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject ? k.subjectId === filterSubject : true;
    const matchStatus = filterStatus ? k.status === filterStatus : true;
    return matchSearch && matchSubject && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-600/40">
              <Award className="w-3.5 h-3.5" />
              <span>Kriteria Ketercapaian Tujuan Pembelajaran</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">KKTP & Rubrik Ketuntasan</h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-xl">
              Tentukan interval nilai ketuntasan dan kriteria ketercapaian per TP untuk acuan asesmen formatif dan sumatif.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Susun KKTP Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari mata pelajaran..."
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

      {/* KKTP Grid */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : filteredKKTPs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Dokumen KKTP</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Buat kriteria ketercapaian tujuan pembelajaran (KKTP) dengan interval rubrik deskriptif.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat KKTP Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredKKTPs.map(k => (
            <div
              key={k.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {k.phase}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1 leading-tight">
                      {k.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      TP {k.academicYear} &bull; Semester {k.semester}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    k.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {k.status === 'completed' ? '🟢 Selesai' : '🟡 Draft'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 mt-3 space-y-1">
                  <p className="font-bold text-slate-700">Kriteria TP ({k.items?.length || 0} Indikator):</p>
                  <div className="divide-y divide-slate-200">
                    {k.items?.slice(0, 3).map((it, idx) => (
                      <div key={idx} className="py-1 flex items-center justify-between">
                        <span className="font-semibold truncate pr-2">
                          <strong className="font-mono text-emerald-700">{it.tpCode}:</strong> {it.tpTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                <span className="text-[11px] text-slate-400">
                  v{k.version || 1} &bull; {new Date(k.updatedAt || k.createdAt || Date.now()).toLocaleDateString('id-ID')}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setPreviewKKTP(k);
                      setIsPreviewOpen(true);
                    }}
                    title="Pratinjau & Cetak A4"
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(k)}
                    title="Duplikat KKTP"
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(k)}
                    title="Edit KKTP"
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(k)}
                    title="Hapus KKTP"
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

      {/* Modal Form KKTP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  {isEditing ? 'Edit KKTP' : 'Penyusunan Kriteria Ketuntasan (KKTP)'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fase Kurikulum
                  </label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  >
                    <option value="Fase A (Kelas 1 - 2)">Fase A (Kelas 1 - 2)</option>
                    <option value="Fase B (Kelas 3 - 4)">Fase B (Kelas 3 - 4)</option>
                    <option value="Fase C (Kelas 5 - 6)">Fase C (Kelas 5 - 6)</option>
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
                    <option value="draft">🟡 Draft</option>
                    <option value="completed">🟢 Selesai (Final)</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Interval Rubrik Ketercapaian Per TP
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris TP</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={item.tpCode}
                            onChange={(e) => handleItemChange(idx, 'tpCode', e.target.value)}
                            placeholder="TP-01"
                            className="w-20 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold focus:outline-emerald-600"
                          />
                          <input
                            type="text"
                            value={item.tpTitle}
                            onChange={(e) => handleItemChange(idx, 'tpTitle', e.target.value)}
                            placeholder="Rumusan TP / Indikator"
                            className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-emerald-600"
                          />
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* 4 Intervals */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-red-700 mb-0.5">0 - 60% (Perlu Bimbingan)</label>
                          <textarea
                            rows={2}
                            value={item.interval0_60}
                            onChange={(e) => handleItemChange(idx, 'interval0_60', e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px] focus:outline-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-700 mb-0.5">61 - 75% (Cukup Tuntas)</label>
                          <textarea
                            rows={2}
                            value={item.interval61_75}
                            onChange={(e) => handleItemChange(idx, 'interval61_75', e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px] focus:outline-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-700 mb-0.5">76 - 85% (Baik / Tuntas)</label>
                          <textarea
                            rows={2}
                            value={item.interval76_85}
                            onChange={(e) => handleItemChange(idx, 'interval76_85', e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px] focus:outline-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">86 - 100% (Sangat Baik / Pengayaan)</label>
                          <textarea
                            rows={2}
                            value={item.interval86_100}
                            onChange={(e) => handleItemChange(idx, 'interval86_100', e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px] focus:outline-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <span>{isEditing ? 'Perbarui KKTP' : 'Simpan Dokumen KKTP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewKKTP && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) - ${previewKKTP.subjectName}`}
          fileName={`KKTP_${previewKKTP.subjectName?.replace(/\s+/g, '_')}_${previewKKTP.academicYear?.replace('/', '-')}`}
          orientation="landscape"
        >
          <DocumentHeader
            settings={settings}
            title="KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)"
            subTitle={`${previewKKTP.subjectName} &bull; ${previewKKTP.phase}`}
          />

          {/* Identity */}
          <div className="mb-4 border border-slate-300 rounded-md overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-36 bg-slate-50 font-bold p-2 text-slate-700">Satuan Pendidikan</td>
                  <td className="p-2 text-slate-900">: {settings?.schoolName || 'MI SYURIYAH PEBATAN'}</td>
                  <td className="w-36 bg-slate-50 font-bold p-2 text-slate-700">Fase / Kelas</td>
                  <td className="p-2 text-slate-900">: {previewKKTP.phase}</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Mata Pelajaran</td>
                  <td className="p-2 text-slate-900">: {previewKKTP.subjectName}</td>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Tahun / Semester</td>
                  <td className="p-2 text-slate-900">: {previewKKTP.academicYear} (Semester {previewKKTP.semester})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Interval Table */}
          <div className="border border-slate-300 rounded-md overflow-hidden mb-6 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-center">
                  <th rowSpan={2} className="p-2 w-10 border-r border-slate-300">No</th>
                  <th rowSpan={2} className="p-2 w-16 border-r border-slate-300">Kode</th>
                  <th rowSpan={2} className="p-2 text-left border-r border-slate-300">Tujuan Pembelajaran</th>
                  <th colSpan={4} className="p-1.5 border-b border-slate-300">Interval Nilai & Ketercapaian</th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-1.5 w-40 border-r border-slate-300 text-red-800">0 - 60% (Perlu Bimbingan)</th>
                  <th className="p-1.5 w-40 border-r border-slate-300 text-amber-800">61 - 75% (Cukup)</th>
                  <th className="p-1.5 w-40 border-r border-slate-300 text-blue-800">76 - 85% (Baik)</th>
                  <th className="p-1.5 w-40 text-emerald-800">86 - 100% (Sangat Baik)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewKKTP.items?.map((it, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="p-2 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-800 border-r border-slate-200">{it.tpCode}</td>
                    <td className="p-2 font-medium text-slate-900 border-r border-slate-200 leading-relaxed">{it.tpTitle}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-200 text-[11px]">{it.interval0_60}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-200 text-[11px]">{it.interval61_75}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-200 text-[11px]">{it.interval76_85}</td>
                    <td className="p-2 text-slate-700 text-[11px]">{it.interval86_100}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DocumentSignature
            settings={settings}
            teacherName={previewKKTP.teacherName || teacherName}
          />
        </DocumentPreviewModal>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  GitMerge, Plus, Search, Filter, Eye, Edit, Trash2, Copy, 
  Printer, Download, ArrowUp, ArrowDown, BookOpen, X, CheckCircle, Layers
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
import type { ATP, ATPItem, LearningObjective, DocStatus } from '../../../types/learning';
import type { GeneralSettings } from '../../../types/academic';

const P5_PPRA_OPTIONS = [
  'Beriman, Bertakwa kepada Tuhan YME, & Berakhlak Mulia',
  'Berkebinekaan Global (Tasamuh / Toleransi)',
  'Gotong Royong (Ta\'awun / Kerjasama)',
  'Mandiri (I\'timad \'ala Nafsi)',
  'Bernalar Kritis (Tafakkur / Kritis)',
  'Kreatif (Ibtikar / Inovatif)',
  'Keteladanan (Qudwah)',
  'Kewarganegaraan & Kebangsaan (Muwatanah)'
];

export const ATPList: React.FC = () => {
  const { userProfile } = useAuth();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [atpList, setAtpList] = useState<ATP[]>([]);
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
  const [items, setItems] = useState<ATPItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Preview State
  const [previewAtp, setPreviewAtp] = useState<ATP | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [teacherId, academicYear, semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedAtps, fetchedTps, fetchedSettings] = await Promise.all([
        learningService.getATPs({ teacherId, academicYear, semester }),
        learningService.getLearningObjectives({ teacherId, academicYear, semester }),
        settingsService.getGeneralSettings()
      ]);
      setAtpList(fetchedAtps);
      setAvailableTps(fetchedTps);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error loading ATP:', err);
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

    // Auto populate items from available TPs for this subject
    const relatedTps = availableTps.filter(t => t.subjectId === initialSubject);
    if (relatedTps.length > 0) {
      setItems(
        relatedTps.map((tp, idx) => ({
          tpId: tp.id || `tp-${idx}`,
          tpCode: tp.code,
          tpTitle: tp.title,
          materialScope: 'Lingkup Materi Bab ' + (idx + 1),
          allocationHours: tp.allocationHours || 4,
          semester: semester,
          p5ppra: ['Beriman, Bertakwa kepada Tuhan YME, & Berakhlak Mulia', 'Keteladanan (Qudwah)'],
          assessmentMethod: 'Formatif (Observasi, Kinerja) & Sumatif Lingkup Materi',
          learningResources: 'Buku Siswa Kemenag, Modul Madrasah, Al-Qur\'an Digital'
        }))
      );
    } else {
      setItems([
        {
          tpId: '',
          tpCode: 'TP-01',
          tpTitle: '',
          materialScope: '',
          allocationHours: 4,
          semester: semester,
          p5ppra: ['Beriman, Bertakwa kepada Tuhan YME, & Berakhlak Mulia'],
          assessmentMethod: 'Formatif & Sumatif',
          learningResources: 'Buku Teks Utama'
        }
      ]);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (atp: ATP) => {
    setIsEditing(true);
    setCurrentId(atp.id || null);
    setSubjectId(atp.subjectId);
    setClassId(atp.classId || '');
    setPhase(atp.phase);
    setStatus(atp.status);
    setItems(atp.items || []);
    setIsModalOpen(true);
  };

  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    const relatedTps = availableTps.filter(t => t.subjectId === newSubjectId);
    if (relatedTps.length > 0 && !isEditing) {
      setItems(
        relatedTps.map((tp, idx) => ({
          tpId: tp.id || `tp-${idx}`,
          tpCode: tp.code,
          tpTitle: tp.title,
          materialScope: 'Lingkup Materi Bab ' + (idx + 1),
          allocationHours: tp.allocationHours || 4,
          semester: semester,
          p5ppra: ['Beriman, Bertakwa kepada Tuhan YME, & Berakhlak Mulia', 'Keteladanan (Qudwah)'],
          assessmentMethod: 'Formatif (Observasi, Kinerja) & Sumatif',
          learningResources: 'Buku Paket Kemenag, Juz Amma, Multimedia Interaktif'
        }))
      );
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        tpId: '',
        tpCode: `TP-${String(items.length + 1).padStart(2, '0')}`,
        tpTitle: '',
        materialScope: '',
        allocationHours: 4,
        semester: semester,
        p5ppra: ['Beriman, Bertakwa kepada Tuhan YME, & Berakhlak Mulia'],
        assessmentMethod: 'Formatif & Sumatif',
        learningResources: 'Buku Teks Kemenag'
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof ATPItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      alert('Pilih mata pelajaran.');
      return;
    }
    if (items.length === 0) {
      alert('Tambahkan minimal 1 alur Tujuan Pembelajaran.');
      return;
    }

    const selectedSubject = subjects.find(s => s.id === subjectId);
    const selectedClass = classes.find(c => c.id === classId);
    const totalHours = items.reduce((acc, curr) => acc + (Number(curr.allocationHours) || 0), 0);

    setIsSaving(true);
    try {
      const payload = {
        teacherId,
        teacherName: teacherName || userProfile?.displayName || 'Guru Pengampu',
        subjectId,
        subjectName: selectedSubject?.name || 'Mata Pelajaran',
        classId: classId || null,
        className: selectedClass?.name || 'Semua Kelas',
        phase,
        academicYear,
        semester,
        totalHours,
        items,
        status,
        version: 1
      };

      if (isEditing && currentId) {
        await learningService.updateATP(currentId, payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'UPDATE',
          'ATP',
          currentId,
          `Mengubah ATP: ${payload.subjectName} (${payload.phase})`
        );
      } else {
        const newId = await learningService.createATP(payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'CREATE',
          'ATP',
          newId,
          `Membuat ATP: ${payload.subjectName} (${payload.phase})`
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving ATP:', err);
      alert('Gagal menyimpan ATP.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (atp: ATP) => {
    if (window.confirm(`Hapus ATP ${atp.subjectName} (${atp.phase})?`)) {
      try {
        await learningService.deleteATP(atp.id!);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DELETE',
          'ATP',
          atp.id!,
          `Menghapus ATP: ${atp.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error deleting ATP:', err);
      }
    }
  };

  const handleDuplicate = async (atp: ATP) => {
    if (window.confirm(`Duplikasi Alur Tujuan Pembelajaran (ATP) ${atp.subjectName}?`)) {
      try {
        const copyPayload = {
          ...atp,
          status: 'draft' as DocStatus,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        delete copyPayload.id;
        const newId = await learningService.createATP(copyPayload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DUPLICATE',
          'ATP',
          newId,
          `Menduplikasi ATP: ${atp.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error duplicating ATP:', err);
      }
    }
  };

  const filteredAtps = atpList.filter(a => {
    const matchSearch = (a.subjectName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (a.phase || '').toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject ? a.subjectId === filterSubject : true;
    const matchStatus = filterStatus ? a.status === filterStatus : true;
    return matchSearch && matchSubject && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-600/40">
              <GitMerge className="w-3.5 h-3.5" />
              <span>Struktur Alur & Profil Pelajar (P5-PPRA)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Alur Tujuan Pembelajaran (ATP)</h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-xl">
              Rancang urutan capaian tujuan pembelajaran per semester lengkap dengan alokasi JP dan integrasi nilai-nilai keislaman madrasah.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Susun ATP Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari mapel, fase, atau materi..."
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

      {/* ATP Cards List */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : filteredAtps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GitMerge className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Dokumen ATP</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Susun Alur Tujuan Pembelajaran dengan merangkai TP dan alokasi JP per semester.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Susun ATP Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAtps.map(atp => (
            <div
              key={atp.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {atp.phase}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1 leading-tight">
                      {atp.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {atp.className ? `Kelas ${atp.className}` : 'Semua Paralel'} &bull; TP {atp.academicYear} ({atp.semester})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      atp.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {atp.status === 'completed' ? '🟢 Selesai' : '🟡 Draft'}
                    </span>
                    <p className="text-xs font-extrabold text-emerald-800 mt-1">
                      {atp.totalHours} JP
                    </p>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Alur TP ({atp.items?.length || 0} Pokok Bahasan):
                  </p>
                  <div className="space-y-1">
                    {atp.items?.slice(0, 3).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                        <span className="truncate pr-2">
                          <strong className="font-mono text-emerald-700">{it.tpCode}:</strong> {it.materialScope || it.tpTitle}
                        </span>
                        <span className="font-bold shrink-0 text-slate-500">{it.allocationHours} JP</span>
                      </div>
                    ))}
                    {(atp.items?.length || 0) > 3 && (
                      <p className="text-[10px] text-slate-400 italic">
                        + {atp.items.length - 3} alur TP lainnya...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                <span className="text-[11px] text-slate-400">
                  v{atp.version || 1} &bull; {new Date(atp.updatedAt || atp.createdAt || Date.now()).toLocaleDateString('id-ID')}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setPreviewAtp(atp);
                      setIsPreviewOpen(true);
                    }}
                    title="Pratinjau & Cetak A4"
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(atp)}
                    title="Duplikat ATP"
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(atp)}
                    title="Edit ATP"
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(atp)}
                    title="Hapus ATP"
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

      {/* Modal Form Tambah/Edit ATP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <GitMerge className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  {isEditing ? 'Edit Alur Tujuan Pembelajaran (ATP)' : 'Penyusunan Alur Tujuan Pembelajaran (ATP)'}
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

              {/* ATP Items Sequence List */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Daftar Alur Tujuan Pembelajaran & Profil Pelajar (P5-PPRA)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Total Jam Pelajaran: <strong className="text-emerald-800">{items.reduce((acc, curr) => acc + (Number(curr.allocationHours) || 0), 0)} JP</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Alur</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 relative group">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-800">Alur Urutan {idx + 1}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 hover:text-emerald-700 disabled:opacity-30"
                            title="Pindah ke atas"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === items.length - 1}
                            className="p-1 text-slate-500 hover:text-emerald-700 disabled:opacity-30"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-red-500 hover:text-red-700 ml-1"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Kode TP</label>
                          <input
                            type="text"
                            value={item.tpCode}
                            onChange={(e) => handleItemChange(idx, 'tpCode', e.target.value)}
                            placeholder="TP-01"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold focus:outline-emerald-600"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Lingkup Materi / Topik</label>
                          <input
                            type="text"
                            value={item.materialScope}
                            onChange={(e) => handleItemChange(idx, 'materialScope', e.target.value)}
                            placeholder="Contoh: Hukum Bacaan Nun Sukun & Tanwin"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Alokasi JP</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={item.allocationHours}
                              onChange={(e) => handleItemChange(idx, 'allocationHours', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold focus:outline-emerald-600"
                            />
                            <span className="text-[11px] font-bold text-slate-500">JP</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Rumusan Tujuan Pembelajaran (TP)</label>
                        <textarea
                          rows={2}
                          value={item.tpTitle}
                          onChange={(e) => handleItemChange(idx, 'tpTitle', e.target.value)}
                          placeholder="Deskripsi pencapaian kompetensi peserta didik..."
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs focus:outline-emerald-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Rencana Asesmen</label>
                          <input
                            type="text"
                            value={item.assessmentMethod || ''}
                            onChange={(e) => handleItemChange(idx, 'assessmentMethod', e.target.value)}
                            placeholder="Formatif: Tes Lisan, Sumatif: Unjuk Kerja"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Sumber Belajar & Media</label>
                          <input
                            type="text"
                            value={item.learningResources || ''}
                            onChange={(e) => handleItemChange(idx, 'learningResources', e.target.value)}
                            placeholder="Buku Siswa, Al-Qur'an, Audio Murottal"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-emerald-600"
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
                  <span>{isEditing ? 'Perbarui ATP' : 'Simpan Dokumen ATP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal for Selected ATP */}
      {previewAtp && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Alur Tujuan Pembelajaran (ATP) - ${previewAtp.subjectName}`}
          fileName={`ATP_${previewAtp.subjectName?.replace(/\s+/g, '_')}_${previewAtp.academicYear?.replace('/', '-')}`}
          orientation="landscape"
        >
          <DocumentHeader
            settings={settings}
            title="ALUR TUJUAN PEMBELAJARAN (ATP)"
            subTitle={`${previewAtp.subjectName} &bull; ${previewAtp.phase}`}
          />

          {/* Identity */}
          <div className="mb-4 border border-slate-300 rounded-md overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-36 bg-slate-50 font-bold p-2 text-slate-700">Satuan Pendidikan</td>
                  <td className="p-2 text-slate-900">: {settings?.schoolName || 'MI SYURIYAH PEBATAN'}</td>
                  <td className="w-36 bg-slate-50 font-bold p-2 text-slate-700">Fase / Kelas</td>
                  <td className="p-2 text-slate-900">: {previewAtp.phase}</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Mata Pelajaran</td>
                  <td className="p-2 text-slate-900">: {previewAtp.subjectName}</td>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Tahun Pelajaran</td>
                  <td className="p-2 text-slate-900">: {previewAtp.academicYear} (Semester {previewAtp.semester})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ATP Full Matrix Table */}
          <div className="border border-slate-300 rounded-md overflow-hidden mb-6 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-center">
                  <th className="p-2 w-10 border-r border-slate-300">Alur</th>
                  <th className="p-2 w-16 border-r border-slate-300">Kode</th>
                  <th className="p-2 text-left border-r border-slate-300">Tujuan Pembelajaran (TP)</th>
                  <th className="p-2 text-left w-48 border-r border-slate-300">Lingkup Materi</th>
                  <th className="p-2 w-12 border-r border-slate-300">JP</th>
                  <th className="p-2 text-left w-40 border-r border-slate-300">Profil Pelajar (P5-PPRA)</th>
                  <th className="p-2 text-left w-36">Asesmen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewAtp.items?.map((it, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="p-2 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                    <td className="p-2 text-center font-mono font-bold border-r border-slate-200 text-emerald-800">{it.tpCode}</td>
                    <td className="p-2 text-slate-900 border-r border-slate-200 leading-relaxed font-medium">
                      {it.tpTitle}
                    </td>
                    <td className="p-2 text-slate-800 border-r border-slate-200">{it.materialScope || '-'}</td>
                    <td className="p-2 text-center font-bold border-r border-slate-200">{it.allocationHours}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-200 text-[11px]">
                      {it.p5ppra && it.p5ppra.length > 0 ? it.p5ppra.join(', ') : 'Beriman, Bertakwa, Mandiri'}
                    </td>
                    <td className="p-2 text-slate-700 text-[11px]">{it.assessmentMethod || 'Formatif & Sumatif'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={4} className="p-2 text-right border-r border-slate-300">Total Alokasi Waktu Keseluruhan:</td>
                  <td className="p-2 text-center text-emerald-800 border-r border-slate-300 font-extrabold">{previewAtp.totalHours} JP</td>
                  <td colSpan={2} className="p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <DocumentSignature
            settings={settings}
            teacherName={previewAtp.teacherName || teacherName}
          />
        </DocumentPreviewModal>
      )}
    </div>
  );
};

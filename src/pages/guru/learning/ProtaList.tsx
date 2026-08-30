import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, Plus, Search, Filter, Eye, Edit, Trash2, Copy, 
  Printer, Download, ArrowUp, ArrowDown, BookOpen, X, CheckCircle, Calculator
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
import type { Prota, ProtaItem, DocStatus } from '../../../types/learning';
import type { GeneralSettings } from '../../../types/academic';

export const ProtaList: React.FC = () => {
  const { userProfile } = useAuth();
  const { teacherId, teacherName, subjects, classes, academicYear, loading: assignLoading } = useTeacherAssignments();

  const [protas, setProtas] = useState<Prota[]>([]);
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
  const [items, setItems] = useState<ProtaItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Preview State
  const [previewProta, setPreviewProta] = useState<Prota | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [teacherId, academicYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedProtas, fetchedSettings] = await Promise.all([
        learningService.getProtas({ teacherId, academicYear }),
        settingsService.getGeneralSettings()
      ]);
      setProtas(fetchedProtas);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error loading Prota:', err);
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

    // Default Prota structure with Semester Ganjil and Semester Genap chapters
    setItems([
      { semester: 'Ganjil', chapterTitle: 'Bab 1: Memahami Kandungan Surah Pilihan', materialScope: 'Surah Al-Adiyat & Al-Qari\'ah', allocationHours: 12, sequence: 1 },
      { semester: 'Ganjil', chapterTitle: 'Bab 2: Hukum Bacaan Tajwid Dasar', materialScope: 'Hukum Nun Sukun dan Tanwin', allocationHours: 14, sequence: 2 },
      { semester: 'Ganjil', chapterTitle: 'Bab 3: Hadits Keutamaan Menuntut Ilmu', materialScope: 'Teks Hadits & Terjemahan', allocationHours: 10, sequence: 3 },
      { semester: 'Genap', chapterTitle: 'Bab 4: Membaca & Menghafal Surah Pendek', materialScope: 'Surah At-Tin & Al-Insyirah', allocationHours: 12, sequence: 4 },
      { semester: 'Genap', chapterTitle: 'Bab 5: Hukum Mim Sukun', materialScope: 'Idgham Mimi, Ikhfa Syafawi, Idzhar Syafawi', allocationHours: 14, sequence: 5 },
      { semester: 'Genap', chapterTitle: 'Bab 6: Hadits Kasih Sayang Terhadap Sesama', materialScope: 'Kandungan Hadits & Hikmah', allocationHours: 10, sequence: 6 }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prota: Prota) => {
    setIsEditing(true);
    setCurrentId(prota.id || null);
    setSubjectId(prota.subjectId);
    setClassId(prota.classId || '');
    setPhase(prota.phase || 'Fase B (Kelas 3 - 4)');
    setStatus(prota.status);
    setItems(prota.items || []);
    setIsModalOpen(true);
  };

  const handleAddItem = (sem: 'Ganjil' | 'Genap') => {
    setItems([
      ...items,
      {
        semester: sem,
        chapterTitle: `Bab Baru (Semester ${sem})`,
        materialScope: '',
        allocationHours: 8,
        sequence: items.length + 1
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof ProtaItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const totalGanjil = items
    .filter(i => i.semester === 'Ganjil')
    .reduce((acc, curr) => acc + (Number(curr.allocationHours) || 0), 0);
  const totalGenap = items
    .filter(i => i.semester === 'Genap')
    .reduce((acc, curr) => acc + (Number(curr.allocationHours) || 0), 0);
  const totalTahun = totalGanjil + totalGenap;

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
        totalHoursGanjil: totalGanjil,
        totalHoursGenap: totalGenap,
        totalHours: totalTahun,
        items,
        status,
        version: 1
      };

      if (isEditing && currentId) {
        await learningService.updateProta(currentId, payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'UPDATE',
          'PROTA',
          currentId,
          `Mengubah Prota: ${payload.subjectName} (${academicYear})`
        );
      } else {
        const newId = await learningService.createProta(payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'CREATE',
          'PROTA',
          newId,
          `Membuat Prota: ${payload.subjectName} (${academicYear})`
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving Prota:', err);
      alert('Gagal menyimpan Program Tahunan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (prota: Prota) => {
    if (window.confirm(`Hapus Prota ${prota.subjectName} Tahun ${prota.academicYear}?`)) {
      try {
        await learningService.deleteProta(prota.id!);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DELETE',
          'PROTA',
          prota.id!,
          `Menghapus Prota: ${prota.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error deleting Prota:', err);
      }
    }
  };

  const handleDuplicate = async (prota: Prota) => {
    if (window.confirm(`Duplikat Program Tahunan (Prota) ${prota.subjectName}?`)) {
      try {
        const copyPayload = {
          ...prota,
          status: 'draft' as DocStatus,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        delete copyPayload.id;
        const newId = await learningService.createProta(copyPayload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DUPLICATE',
          'PROTA',
          newId,
          `Menduplikasi Prota: ${prota.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error duplicating Prota:', err);
      }
    }
  };

  const filteredProtas = protas.filter(p => {
    const matchSearch = (p.subjectName || '').toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject ? p.subjectId === filterSubject : true;
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    return matchSearch && matchSubject && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-600/40">
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Perhitungan Alokasi 1 Tahun Pelajaran</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Program Tahunan (Prota)</h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-xl">
              Susun alokasi waktu per bab dan capaian materi untuk Semester Ganjil dan Genap Tahun Pelajaran {academicYear}.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Susun Prota Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
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

      {/* Prota Cards Grid */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : filteredProtas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarRange className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Program Tahunan (Prota)</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Rencanakan alokasi total JP setahun penuh untuk mata pelajaran yang Anda ampu.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Prota Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProtas.map(prota => {
            const sem1Hours = prota.items?.filter(i => i.semester === 'Ganjil').reduce((a, c) => a + (Number(c.allocationHours) || 0), 0) || 0;
            const sem2Hours = prota.items?.filter(i => i.semester === 'Genap').reduce((a, c) => a + (Number(c.allocationHours) || 0), 0) || 0;

            return (
              <div
                key={prota.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {prota.phase || 'Fase B'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1 leading-tight">
                        {prota.subjectName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tahun Pelajaran {prota.academicYear} &bull; {prota.className ? `Kelas ${prota.className}` : 'Semua Paralel'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      prota.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prota.status === 'completed' ? '🟢 Selesai' : '🟡 Draft'}
                    </span>
                  </div>

                  {/* JP Statistics Pills */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Sem. Ganjil</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{sem1Hours} JP</p>
                    </div>
                    <div className="border-x border-slate-200">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Sem. Genap</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{sem2Hours} JP</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-700 font-semibold uppercase">Total Tahunan</p>
                      <p className="text-xs sm:text-sm font-extrabold text-emerald-800 mt-0.5">{prota.totalHours} JP</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                  <span className="text-[11px] text-slate-400">
                    v{prota.version || 1} &bull; {new Date(prota.updatedAt || prota.createdAt || Date.now()).toLocaleDateString('id-ID')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setPreviewProta(prota);
                        setIsPreviewOpen(true);
                      }}
                      title="Pratinjau & Cetak A4"
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(prota)}
                      title="Duplikat Prota"
                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(prota)}
                      title="Edit Prota"
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prota)}
                      title="Hapus Prota"
                      className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Prota */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <CalendarRange className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  {isEditing ? 'Edit Program Tahunan (Prota)' : 'Penyusunan Program Tahunan (Prota)'}
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
                    onChange={(e) => setSubjectId(e.target.value)}
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

              {/* Total calculation bar */}
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span>Sem. Ganjil: <strong>{totalGanjil} JP</strong></span>
                  <span>Sem. Genap: <strong>{totalGenap} JP</strong></span>
                </div>
                <div className="font-extrabold text-emerald-900 text-sm">
                  Total Setahun: {totalTahun} JP
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4 pt-2">
                {/* Semester Ganjil Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                    A. Semester Ganjil ({totalGanjil} JP)
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddItem('Ganjil')}
                    className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bab Ganjil</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, idx) => {
                    if (item.semester !== 'Ganjil') return null;
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                        <input
                          type="text"
                          value={item.chapterTitle}
                          onChange={(e) => handleItemChange(idx, 'chapterTitle', e.target.value)}
                          placeholder="Judul Bab / Capaian Pembelajaran"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold focus:outline-emerald-600 w-full"
                        />
                        <input
                          type="text"
                          value={item.materialScope}
                          onChange={(e) => handleItemChange(idx, 'materialScope', e.target.value)}
                          placeholder="Materi Pokok"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-emerald-600 w-full"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={item.allocationHours}
                            onChange={(e) => handleItemChange(idx, 'allocationHours', Number(e.target.value))}
                            className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-center focus:outline-emerald-600"
                          />
                          <span className="text-xs font-bold text-slate-500">JP</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Semester Genap Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 pt-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                    B. Semester Genap ({totalGenap} JP)
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddItem('Genap')}
                    className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bab Genap</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, idx) => {
                    if (item.semester !== 'Genap') return null;
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                        <input
                          type="text"
                          value={item.chapterTitle}
                          onChange={(e) => handleItemChange(idx, 'chapterTitle', e.target.value)}
                          placeholder="Judul Bab / Capaian Pembelajaran"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold focus:outline-emerald-600 w-full"
                        />
                        <input
                          type="text"
                          value={item.materialScope}
                          onChange={(e) => handleItemChange(idx, 'materialScope', e.target.value)}
                          placeholder="Materi Pokok"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-emerald-600 w-full"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={item.allocationHours}
                            onChange={(e) => handleItemChange(idx, 'allocationHours', Number(e.target.value))}
                            className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-center focus:outline-emerald-600"
                          />
                          <span className="text-xs font-bold text-slate-500">JP</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  <span>{isEditing ? 'Perbarui Prota' : 'Simpan Prota'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewProta && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Program Tahunan (Prota) - ${previewProta.subjectName}`}
          fileName={`Prota_${previewProta.subjectName?.replace(/\s+/g, '_')}_${previewProta.academicYear?.replace('/', '-')}`}
        >
          <DocumentHeader
            settings={settings}
            title="PROGRAM TAHUNAN (PROTA)"
            subTitle={`Mata Pelajaran: ${previewProta.subjectName} &bull; TP ${previewProta.academicYear}`}
          />

          {/* Identity */}
          <div className="mb-4 border border-slate-300 rounded-md overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-36 bg-slate-50 font-bold p-2 text-slate-700">Satuan Pendidikan</td>
                  <td className="p-2 text-slate-900">: {settings?.schoolName || 'MI SYURIYAH PEBATAN'}</td>
                  <td className="w-36 bg-slate-50 font-bold p-2 text-slate-700">Fase / Kelas</td>
                  <td className="p-2 text-slate-900">: {previewProta.phase}</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Mata Pelajaran</td>
                  <td className="p-2 text-slate-900">: {previewProta.subjectName}</td>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Tahun Pelajaran</td>
                  <td className="p-2 text-slate-900">: {previewProta.academicYear}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Full Prota Matrix */}
          <div className="border border-slate-300 rounded-md overflow-hidden mb-6 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-center">
                  <th className="p-2.5 w-12 border-r border-slate-300">No</th>
                  <th className="p-2.5 w-24 border-r border-slate-300">Semester</th>
                  <th className="p-2.5 text-left border-r border-slate-300">Bab / Capaian Pembelajaran</th>
                  <th className="p-2.5 text-left w-52 border-r border-slate-300">Materi Pokok</th>
                  <th className="p-2.5 w-20">Alokasi (JP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Semester Ganjil Rows */}
                <tr className="bg-slate-50/70 font-bold text-slate-800">
                  <td colSpan={5} className="p-2 bg-emerald-50/60 text-emerald-950">SEMESTER GANJIL</td>
                </tr>
                {previewProta.items?.filter(i => i.semester === 'Ganjil').map((it, idx) => (
                  <tr key={`g-${idx}`}>
                    <td className="p-2.5 text-center font-semibold border-r border-slate-200">{idx + 1}</td>
                    <td className="p-2.5 text-center border-r border-slate-200 font-medium">Ganjil</td>
                    <td className="p-2.5 text-slate-900 font-semibold border-r border-slate-200">{it.chapterTitle}</td>
                    <td className="p-2.5 text-slate-700 border-r border-slate-200">{it.materialScope || '-'}</td>
                    <td className="p-2.5 text-center font-bold text-slate-800">{it.allocationHours} JP</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-b border-slate-300">
                  <td colSpan={4} className="p-2 text-right border-r border-slate-300">Jumlah JP Semester Ganjil:</td>
                  <td className="p-2 text-center text-emerald-800">
                    {previewProta.items?.filter(i => i.semester === 'Ganjil').reduce((a, c) => a + (Number(c.allocationHours) || 0), 0)} JP
                  </td>
                </tr>

                {/* Semester Genap Rows */}
                <tr className="bg-slate-50/70 font-bold text-slate-800">
                  <td colSpan={5} className="p-2 bg-emerald-50/60 text-emerald-950">SEMESTER GENAP</td>
                </tr>
                {previewProta.items?.filter(i => i.semester === 'Genap').map((it, idx) => (
                  <tr key={`gen-${idx}`}>
                    <td className="p-2.5 text-center font-semibold border-r border-slate-200">{idx + 1}</td>
                    <td className="p-2.5 text-center border-r border-slate-200 font-medium">Genap</td>
                    <td className="p-2.5 text-slate-900 font-semibold border-r border-slate-200">{it.chapterTitle}</td>
                    <td className="p-2.5 text-slate-700 border-r border-slate-200">{it.materialScope || '-'}</td>
                    <td className="p-2.5 text-center font-bold text-slate-800">{it.allocationHours} JP</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-b border-slate-300">
                  <td colSpan={4} className="p-2 text-right border-r border-slate-300">Jumlah JP Semester Genap:</td>
                  <td className="p-2 text-center text-emerald-800">
                    {previewProta.items?.filter(i => i.semester === 'Genap').reduce((a, c) => a + (Number(c.allocationHours) || 0), 0)} JP
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-emerald-100 font-extrabold text-emerald-950 text-xs">
                  <td colSpan={4} className="p-2.5 text-right border-r border-emerald-200 uppercase">
                    Total Alokasi Waktu 1 Tahun Pelajaran:
                  </td>
                  <td className="p-2.5 text-center text-emerald-900 font-extrabold">
                    {previewProta.totalHours} JP
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <DocumentSignature
            settings={settings}
            teacherName={previewProta.teacherName || teacherName}
          />
        </DocumentPreviewModal>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Table, Plus, Search, Filter, Eye, Edit, Trash2, Copy, 
  Printer, Download, BookOpen, X, CheckCircle, Calendar, Layers
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
import type { Promes, PromesItem, DocStatus } from '../../../types/learning';
import type { GeneralSettings, Semester } from '../../../types/academic';

const GANJIL_MONTHS = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const GENAP_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

export const PromesList: React.FC = () => {
  const { userProfile } = useAuth();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [promeses, setPromeses] = useState<Promes[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSemester, setFilterSemester] = useState<Semester>(semester);
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
  const [formSemester, setFormSemester] = useState<Semester>(semester);
  const [items, setItems] = useState<PromesItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Preview State
  const [previewPromes, setPreviewPromes] = useState<Promes | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const activeMonths = formSemester === 'Ganjil' ? GANJIL_MONTHS : GENAP_MONTHS;

  useEffect(() => {
    loadData();
  }, [teacherId, academicYear, filterSemester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedPromeses, fetchedSettings] = await Promise.all([
        learningService.getPromesList({ teacherId, academicYear, semester: filterSemester }),
        settingsService.getGeneralSettings()
      ]);
      setPromeses(fetchedPromeses);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error loading Promes:', err);
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
    setFormSemester(filterSemester);
    setStatus('draft');

    const months = filterSemester === 'Ganjil' ? GANJIL_MONTHS : GENAP_MONTHS;

    setItems([
      {
        tpCode: 'TP-01',
        materialScope: 'Bab 1: Membaca dan Menghafal Surah Pilihan',
        allocationHours: 12,
        weeklySchedule: {
          [`${months[0]}_1`]: 4,
          [`${months[0]}_2`]: 4,
          [`${months[0]}_3`]: 4
        }
      },
      {
        tpCode: 'TP-02',
        materialScope: 'Bab 2: Hukum Bacaan Tajwid Dasar',
        allocationHours: 12,
        weeklySchedule: {
          [`${months[0]}_4`]: 4,
          [`${months[1]}_1`]: 4,
          [`${months[1]}_2`]: 4
        }
      },
      {
        tpCode: 'TP-03',
        materialScope: 'Bab 3: Hadits Keutamaan Menuntut Ilmu',
        allocationHours: 12,
        weeklySchedule: {
          [`${months[1]}_3`]: 4,
          [`${months[1]}_4`]: 4,
          [`${months[2]}_1`]: 4
        }
      }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promes: Promes) => {
    setIsEditing(true);
    setCurrentId(promes.id || null);
    setSubjectId(promes.subjectId);
    setClassId(promes.classId || '');
    setPhase(promes.phase || 'Fase B (Kelas 3 - 4)');
    setFormSemester(promes.semester);
    setStatus(promes.status);
    setItems(promes.items || []);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        tpCode: `TP-${String(items.length + 1).padStart(2, '0')}`,
        materialScope: `Pokok Materi ${items.length + 1}`,
        allocationHours: 8,
        weeklySchedule: {}
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof PromesItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleWeeklyScheduleToggle = (itemIndex: number, monthName: string, weekNum: number, value: string) => {
    const key = `${monthName}_${weekNum}`;
    const updated = [...items];
    const numVal = parseInt(value, 10);
    const schedule = { ...updated[itemIndex].weeklySchedule };

    if (isNaN(numVal) || numVal <= 0) {
      delete schedule[key];
    } else {
      schedule[key] = numVal;
    }

    updated[itemIndex].weeklySchedule = schedule;
    setItems(updated);
  };

  const totalHours = items.reduce((acc, curr) => acc + (Number(curr.allocationHours) || 0), 0);

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
        semester: formSemester,
        months: activeMonths,
        totalHours,
        items,
        status,
        version: 1
      };

      if (isEditing && currentId) {
        await learningService.updatePromes(currentId, payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'UPDATE',
          'PROMES',
          currentId,
          `Mengubah Promes: ${payload.subjectName} (${formSemester} ${academicYear})`
        );
      } else {
        const newId = await learningService.createPromes(payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'CREATE',
          'PROMES',
          newId,
          `Membuat Promes: ${payload.subjectName} (${formSemester} ${academicYear})`
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving Promes:', err);
      alert('Gagal menyimpan Program Semester.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (promes: Promes) => {
    if (window.confirm(`Hapus Promes ${promes.subjectName} Semester ${promes.semester}?`)) {
      try {
        await learningService.deletePromes(promes.id!);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DELETE',
          'PROMES',
          promes.id!,
          `Menghapus Promes: ${promes.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error deleting Promes:', err);
      }
    }
  };

  const handleDuplicate = async (promes: Promes) => {
    if (window.confirm(`Duplikat Program Semester ${promes.subjectName}?`)) {
      try {
        const copyPayload = {
          ...promes,
          status: 'draft' as DocStatus,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        delete copyPayload.id;
        const newId = await learningService.createPromes(copyPayload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DUPLICATE',
          'PROMES',
          newId,
          `Menduplikasi Promes: ${promes.subjectName}`
        );
        loadData();
      } catch (err) {
        console.error('Error duplicating Promes:', err);
      }
    }
  };

  const filteredPromeses = promeses.filter(p => {
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
              <Table className="w-3.5 h-3.5" />
              <span>Matriks Distribusi Waktu Mingguan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Program Semester (Promes)</h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-xl">
              Sebarkan materi dan JP per minggu pada bulan efektif di Semester {filterSemester} Tahun Pelajaran {academicYear}.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Susun Promes Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
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
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterSemester('Ganjil')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                filterSemester === 'Ganjil' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem. Ganjil (Jul-Des)
            </button>
            <button
              onClick={() => setFilterSemester('Genap')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                filterSemester === 'Genap' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem. Genap (Jan-Jun)
            </button>
          </div>

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

      {/* Promes List Grid */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : filteredPromeses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Table className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Program Semester ({filterSemester})</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Mulai susun matriks program semester per minggu untuk kelengkapan administrasi pembelajaran.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Promes Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPromeses.map(promes => (
            <div
              key={promes.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Semester {promes.semester}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1 leading-tight">
                      {promes.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {promes.phase} &bull; TP {promes.academicYear}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      promes.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {promes.status === 'completed' ? '🟢 Selesai' : '🟡 Draft'}
                    </span>
                    <p className="text-xs font-extrabold text-emerald-800 mt-1">
                      {promes.totalHours} JP
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700">Materi Terdistribusi ({promes.items?.length || 0} Pokok Bahasan):</p>
                  <div className="divide-y divide-slate-200">
                    {promes.items?.slice(0, 3).map((it, idx) => (
                      <div key={idx} className="py-1 flex items-center justify-between">
                        <span className="truncate pr-2 font-medium">{it.materialScope}</span>
                        <span className="font-bold text-slate-700 shrink-0">{it.allocationHours} JP</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                <span className="text-[11px] text-slate-400">
                  v{promes.version || 1} &bull; {new Date(promes.updatedAt || promes.createdAt || Date.now()).toLocaleDateString('id-ID')}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setPreviewPromes(promes);
                      setIsPreviewOpen(true);
                    }}
                    title="Pratinjau Matriks A4"
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(promes)}
                    title="Duplikat Promes"
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(promes)}
                    title="Edit Promes"
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(promes)}
                    title="Hapus Promes"
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

      {/* Modal Form Promes */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Table className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  {isEditing ? 'Edit Program Semester (Promes)' : 'Penyusunan Program Semester (Promes)'}
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
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
                    Semester
                  </label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value as Semester)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
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

              {/* Matrix Table Editor */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Distribusi Alokasi Jam Pelajaran Per Minggu ({activeMonths.join(' - ')})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Total JP: <strong className="text-emerald-800">{totalHours} JP</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Materi</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 w-full">
                          <input
                            type="text"
                            value={item.tpCode}
                            onChange={(e) => handleItemChange(idx, 'tpCode', e.target.value)}
                            placeholder="Kode TP"
                            className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold focus:outline-emerald-600"
                          />
                          <input
                            type="text"
                            value={item.materialScope}
                            onChange={(e) => handleItemChange(idx, 'materialScope', e.target.value)}
                            placeholder="Lingkup Materi / Bab Pembelajaran"
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-emerald-600"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-xs text-slate-500 font-bold">Total:</label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={item.allocationHours}
                            onChange={(e) => handleItemChange(idx, 'allocationHours', Number(e.target.value))}
                            className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-center focus:outline-emerald-600"
                          />
                          <span className="text-xs font-bold text-slate-500">JP</span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-red-500 hover:text-red-700 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Monthly Weeks Matrix Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-200">
                        {activeMonths.map(month => (
                          <div key={month} className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                            <p className="text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1 mb-1.5">
                              {month}
                            </p>
                            <div className="grid grid-cols-4 gap-1">
                              {[1, 2, 3, 4].map(w => {
                                const key = `${month}_${w}`;
                                const val = item.weeklySchedule?.[key] || '';
                                return (
                                  <div key={w}>
                                    <span className="text-[9px] text-slate-400 font-bold block">W{w}</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={10}
                                      value={val}
                                      onChange={(e) => handleWeeklyScheduleToggle(idx, month, w, e.target.value)}
                                      className="w-full text-center px-0.5 py-1 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded focus:outline-emerald-600"
                                      placeholder="-"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
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
                  <span>{isEditing ? 'Perbarui Promes' : 'Simpan Promes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewPromes && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Program Semester (Promes) - ${previewPromes.subjectName}`}
          fileName={`Promes_${previewPromes.subjectName?.replace(/\s+/g, '_')}_${previewPromes.semester}_${previewPromes.academicYear?.replace('/', '-')}`}
          orientation="landscape"
        >
          <DocumentHeader
            settings={settings}
            title="PROGRAM SEMESTER (PROMES)"
            subTitle={`Mata Pelajaran: ${previewPromes.subjectName} &bull; Semester ${previewPromes.semester} &bull; TP ${previewPromes.academicYear}`}
          />

          {/* Identity */}
          <div className="mb-4 border border-slate-300 rounded-md overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-36 bg-slate-50 font-bold p-2 text-slate-700">Satuan Pendidikan</td>
                  <td className="p-2 text-slate-900">: {settings?.schoolName || 'MI SYURIYAH PEBATAN'}</td>
                  <td className="w-36 bg-slate-50 font-bold p-2 text-slate-700">Fase / Kelas</td>
                  <td className="p-2 text-slate-900">: {previewPromes.phase}</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Mata Pelajaran</td>
                  <td className="p-2 text-slate-900">: {previewPromes.subjectName}</td>
                  <td className="bg-slate-50 font-bold p-2 text-slate-700">Tahun / Semester</td>
                  <td className="p-2 text-slate-900">: {previewPromes.academicYear} (Semester {previewPromes.semester})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Full Promes Matrix Table */}
          <div className="border border-slate-300 rounded-md overflow-hidden mb-6 text-[10px]">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th rowSpan={2} className="p-1.5 w-8 border-r border-slate-300">No</th>
                  <th rowSpan={2} className="p-1.5 w-12 border-r border-slate-300">Kode</th>
                  <th rowSpan={2} className="p-1.5 text-left border-r border-slate-300">Materi Pokok / Tujuan Pembelajaran</th>
                  <th rowSpan={2} className="p-1.5 w-10 border-r border-slate-300">JML JP</th>
                  {previewPromes.months?.map(m => (
                    <th key={m} colSpan={4} className="p-1 border-r border-slate-300 border-b">
                      {m}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-50 border-b border-slate-300 text-slate-600 font-bold">
                  {previewPromes.months?.map(m => (
                    <React.Fragment key={`${m}-weeks`}>
                      <th className="p-1 w-5 border-r border-slate-300">1</th>
                      <th className="p-1 w-5 border-r border-slate-300">2</th>
                      <th className="p-1 w-5 border-r border-slate-300">3</th>
                      <th className="p-1 w-5 border-r border-slate-300">4</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewPromes.items?.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-1.5 font-bold border-r border-slate-200">{idx + 1}</td>
                    <td className="p-1.5 font-mono font-bold text-emerald-800 border-r border-slate-200">{it.tpCode}</td>
                    <td className="p-1.5 text-left text-slate-900 font-medium border-r border-slate-200">{it.materialScope}</td>
                    <td className="p-1.5 font-bold border-r border-slate-200">{it.allocationHours}</td>
                    {previewPromes.months?.map(m => (
                      <React.Fragment key={`${m}-${idx}`}>
                        {[1, 2, 3, 4].map(w => {
                          const val = it.weeklySchedule?.[`${m}_${w}`];
                          return (
                            <td key={w} className="p-1 border-r border-slate-200 font-bold text-emerald-900">
                              {val ? val : ''}
                            </td>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={3} className="p-2 text-right border-r border-slate-300 font-extrabold uppercase">
                    Total Jam Pelajaran:
                  </td>
                  <td className="p-2 text-center text-emerald-800 border-r border-slate-300 font-extrabold">
                    {previewPromes.totalHours} JP
                  </td>
                  <td colSpan={(previewPromes.months?.length || 6) * 4} className="p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <DocumentSignature
            settings={settings}
            teacherName={previewPromes.teacherName || teacherName}
          />
        </DocumentPreviewModal>
      )}
    </div>
  );
};

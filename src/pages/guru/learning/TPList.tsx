import React, { useState, useEffect } from 'react';
import { 
  Target, Plus, Search, Filter, Eye, Edit, Trash2, Copy, 
  Printer, Download, FileText, CheckCircle, Clock, BookOpen, X, Layers
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
import type { LearningObjective, LearningPlan, DocStatus } from '../../../types/learning';
import type { GeneralSettings } from '../../../types/academic';

export const TPList: React.FC = () => {
  const { userProfile } = useAuth();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [tps, setTps] = useState<LearningObjective[]>([]);
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterCP, setFilterCP] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [cpId, setCpId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [phase, setPhase] = useState('Fase B (Kelas 3 - 4)');
  const [code, setCode] = useState('TP-01');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sequence, setSequence] = useState<number>(1);
  const [allocationHours, setAllocationHours] = useState<number>(4);
  const [status, setStatus] = useState<DocStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);

  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [teacherId, academicYear, semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTps, fetchedPlans, fetchedSettings] = await Promise.all([
        learningService.getLearningObjectives({ teacherId, academicYear, semester }),
        learningService.getLearningPlans({ teacherId, academicYear, semester }),
        settingsService.getGeneralSettings()
      ]);
      setTps(fetchedTps);
      setPlans(fetchedPlans);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error loading TP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    const initialPlan = plans[0];
    setCpId(initialPlan?.id || '');
    setSubjectId(initialPlan?.subjectId || subjects[0]?.id || '');
    setClassId(initialPlan?.classId || '');
    setPhase(initialPlan?.phase || 'Fase B (Kelas 3 - 4)');
    
    // Auto generate next sequence code
    const nextSeq = tps.length + 1;
    setSequence(nextSeq);
    setCode(`TP-${String(nextSeq).padStart(2, '0')}`);
    setTitle('');
    setDescription('');
    setAllocationHours(4);
    setStatus('draft');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tp: LearningObjective) => {
    setIsEditing(true);
    setCurrentId(tp.id || null);
    setCpId(tp.cpId);
    setSubjectId(tp.subjectId);
    setClassId(tp.classId || '');
    setPhase(tp.phase);
    setCode(tp.code);
    setTitle(tp.title);
    setDescription(tp.description || '');
    setSequence(tp.sequence || 1);
    setAllocationHours(tp.allocationHours || 4);
    setStatus(tp.status);
    setIsModalOpen(true);
  };

  const handleCPChange = (selectedCpId: string) => {
    setCpId(selectedCpId);
    const foundPlan = plans.find(p => p.id === selectedCpId);
    if (foundPlan) {
      setSubjectId(foundPlan.subjectId);
      setClassId(foundPlan.classId || '');
      setPhase(foundPlan.phase);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpId) {
      alert('Silakan pilih Capaian Pembelajaran (CP) terkait.');
      return;
    }
    if (!title.trim()) {
      alert('Rumusan Tujuan Pembelajaran wajib diisi.');
      return;
    }

    const selectedSubject = subjects.find(s => s.id === subjectId);
    const selectedClass = classes.find(c => c.id === classId);

    setIsSaving(true);
    try {
      const payload = {
        cpId,
        teacherId,
        teacherName: teacherName || userProfile?.displayName || 'Guru Pengampu',
        subjectId,
        subjectName: selectedSubject?.name || 'Mata Pelajaran',
        classId: classId || null,
        className: selectedClass?.name || 'Semua Kelas',
        phase,
        code,
        title,
        description,
        sequence: Number(sequence),
        allocationHours: Number(allocationHours),
        academicYear,
        semester,
        status,
        version: 1
      };

      if (isEditing && currentId) {
        await learningService.updateLearningObjective(currentId, payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'UPDATE',
          'TP',
          currentId,
          `Mengubah TP: ${payload.code} - ${payload.title}`
        );
      } else {
        const newId = await learningService.createLearningObjective(payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'CREATE',
          'TP',
          newId,
          `Membuat TP: ${payload.code} - ${payload.title}`
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving TP:', err);
      alert('Gagal menyimpan Tujuan Pembelajaran.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tp: LearningObjective) => {
    if (window.confirm(`Hapus ${tp.code}: "${tp.title}"?`)) {
      try {
        await learningService.deleteLearningObjective(tp.id!);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'DELETE',
          'TP',
          tp.id!,
          `Menghapus TP: ${tp.code}`
        );
        loadData();
      } catch (err) {
        console.error('Error deleting TP:', err);
      }
    }
  };

  const filteredTps = tps.filter(t => {
    const matchSearch = 
      (t.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.subjectName || '').toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject ? t.subjectId === filterSubject : true;
    const matchCP = filterCP ? t.cpId === filterCP : true;
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    return matchSearch && matchSubject && matchCP && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-600/40">
              <Target className="w-3.5 h-3.5" />
              <span>Relasi Terstruktur: CP &rarr; TP</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tujuan Pembelajaran (TP)</h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-xl">
              Rumuskan Tujuan Pembelajaran yang diturunkan langsung dari Capaian Pembelajaran (CP) mata pelajaran Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap TP</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah TP Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari kode TP, judul, kompetensi..."
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
            value={filterCP}
            onChange={(e) => setFilterCP(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 max-w-xs truncate"
          >
            <option value="">Semua Induk CP</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.subjectName} ({p.phase})</option>
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

      {/* TP Table */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner />
        </div>
      ) : filteredTps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Tujuan Pembelajaran</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Pastikan Anda telah membuat Capaian Pembelajaran (CP) terlebih dahulu, kemudian rumuskan Tujuan Pembelajaran di sini.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah TP Pertama</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">Urutan</th>
                  <th className="py-3.5 px-4 w-28">Kode TP</th>
                  <th className="py-3.5 px-4">Tujuan Pembelajaran</th>
                  <th className="py-3.5 px-4 w-44">Mata Pelajaran / Fase</th>
                  <th className="py-3.5 px-4 w-24 text-center">Alokasi (JP)</th>
                  <th className="py-3.5 px-4 w-24 text-center">Status</th>
                  <th className="py-3.5 px-4 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTps.map((tp) => (
                  <tr key={tp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-500">
                      {tp.sequence}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {tp.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{tp.title}</p>
                      {tp.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{tp.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{tp.subjectName}</p>
                      <p className="text-[11px] text-slate-500">{tp.phase}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {tp.allocationHours} JP
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tp.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tp.status === 'completed' ? 'Selesai' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(tp)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit TP"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tp)}
                          className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus TP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Tambah/Edit TP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Target className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  {isEditing ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran (TP)'}
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Capaian Pembelajaran (Induk CP) <span className="text-red-500">*</span>
                </label>
                <select
                  value={cpId}
                  onChange={(e) => handleCPChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                >
                  <option value="">-- Pilih Induk CP --</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.subjectName} ({p.phase}) - {p.source || 'Kurikulum Merdeka'}
                    </option>
                  ))}
                </select>
                {plans.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    * Belum ada CP yang tersimpan. Sebaiknya buat Capaian Pembelajaran terlebih dahulu.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode TP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Misal: TP-01"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Urutan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sequence}
                    onChange={(e) => setSequence(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rumusan Tujuan Pembelajaran (TP) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Peserta didik mampu membaca dan menghafal Surah Al-Adiyat dengan tartil dan makhraj yang benar..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alokasi Waktu (JP)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={allocationHours}
                      onChange={(e) => setAllocationHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                    />
                    <span className="text-xs text-slate-500 font-bold">JP</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status TP
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DocStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                  >
                    <option value="draft">🟡 Draft</option>
                    <option value="completed">🟢 Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Indikator / Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan lingkup materi atau kemampuan awal yang dibutuhkan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
                />
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
                  <span>{isEditing ? 'Perbarui TP' : 'Simpan TP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal for Entire TP List */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Daftar Tujuan Pembelajaran (TP)"
        fileName={`Daftar_TP_${academicYear.replace('/', '-')}_${semester}`}
      >
        <DocumentHeader
          settings={settings}
          title="DAFTAR TUJUAN PEMBELAJARAN (TP)"
          subTitle={`Tahun Pelajaran ${academicYear} &bull; Semester ${semester}`}
        />

        <div className="border border-slate-300 rounded-md overflow-hidden mb-6 text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                <th className="p-2.5 text-center w-12 border-r border-slate-300">No</th>
                <th className="p-2.5 text-center w-20 border-r border-slate-300">Kode</th>
                <th className="p-2.5 text-left border-r border-slate-300">Tujuan Pembelajaran</th>
                <th className="p-2.5 text-left w-40 border-r border-slate-300">Mata Pelajaran</th>
                <th className="p-2.5 text-center w-16">JP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTps.map((tp, idx) => (
                <tr key={tp.id || idx}>
                  <td className="p-2.5 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                  <td className="p-2.5 text-center font-mono font-bold border-r border-slate-200">{tp.code}</td>
                  <td className="p-2.5 text-slate-900 border-r border-slate-200 leading-relaxed font-medium">
                    {tp.title}
                    {tp.description && <p className="text-[11px] text-slate-500 italic mt-0.5">{tp.description}</p>}
                  </td>
                  <td className="p-2.5 text-slate-800 border-r border-slate-200">
                    <p className="font-semibold">{tp.subjectName}</p>
                    <p className="text-[10px] text-slate-500">{tp.phase}</p>
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-800">{tp.allocationHours}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-300">
                <td colSpan={4} className="p-2.5 text-right border-r border-slate-300">Total Alokasi Waktu:</td>
                <td className="p-2.5 text-center font-bold text-emerald-800">
                  {filteredTps.reduce((acc, curr) => acc + (curr.allocationHours || 0), 0)} JP
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <DocumentSignature
          settings={settings}
          teacherName={teacherName}
        />
      </DocumentPreviewModal>
    </div>
  );
};

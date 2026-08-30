import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Trash2, Edit, 
  Calendar, CheckCircle2, AlertCircle, ArrowRight, User 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { studentService } from '../../../services/studentService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { AssessmentFollowUp, FollowUpType } from '../../../types/assessment';
import type { Student } from '../../../types/academic';

export const FollowUpView: React.FC = () => {
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [followUps, setFollowUps] = useState<AssessmentFollowUp[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formStudentId, setFormStudentId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formType, setFormType] = useState<FollowUpType>('Remedial');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formInitialScore, setFormInitialScore] = useState<string>('');
  const [formFinalScore, setFormFinalScore] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formResult, setFormResult] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFollowUps();
  }, [teacherId, academicYear, semester]);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const [data, studentList] = await Promise.all([
        assessmentService.getFollowUps({ teacherId, academicYear, semester }),
        studentService.getAll()
      ]);
      setFollowUps(data);
      setStudents(studentList);
    } catch (err) {
      console.error('Error loading follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormSubjectId(subjects[0]?.id || '');
    setFormClassId(classes[0]?.id || '');
    setFormStudentId('');
    setFormType('Remedial');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormInitialScore('');
    setFormFinalScore('');
    setFormDescription('');
    setFormResult('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AssessmentFollowUp) => {
    setEditingId(item.id || null);
    setFormSubjectId(item.subjectId);
    setFormClassId(item.classId);
    setFormStudentId(item.studentId);
    setFormType(item.type);
    setFormDate(item.date);
    setFormInitialScore(item.initialScore !== undefined ? String(item.initialScore) : '');
    setFormFinalScore(item.finalScore !== undefined ? String(item.finalScore) : '');
    setFormDescription(item.description);
    setFormResult(item.result);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus catatan tindak lanjut ini?')) {
      try {
        await assessmentService.deleteFollowUp(id, { uid: teacherId, name: teacherName });
        setFollowUps(prev => prev.filter(f => f.id !== id));
      } catch (err: any) {
        alert('Gagal menghapus: ' + (err?.message || 'Error'));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formSubjectId || !formClassId || !formDescription || !formResult) {
      alert('Mohon lengkapi seluruh isian wajib.');
      return;
    }

    try {
      setSaving(true);
      const student = students.find(s => s.id === formStudentId);
      const subject = subjects.find(s => s.id === formSubjectId);
      const cls = classes.find(c => c.id === formClassId);

      const payload: Omit<AssessmentFollowUp, 'id' | 'createdAt' | 'updatedAt'> = {
        studentId: formStudentId,
        studentName: student?.name || 'Siswa',
        studentNis: student?.nis || '',
        teacherId,
        teacherName,
        subjectId: formSubjectId,
        subjectName: subject?.name || 'Mapel',
        classId: formClassId,
        className: cls?.name || 'Kelas',
        type: formType,
        date: formDate,
        initialScore: formInitialScore ? Number(formInitialScore) : undefined,
        finalScore: formFinalScore ? Number(formFinalScore) : undefined,
        description: formDescription.trim(),
        result: formResult.trim(),
        academicYear,
        semester
      };

      if (editingId) {
        await assessmentService.updateFollowUp(editingId, payload, { uid: teacherId, name: teacherName });
      } else {
        await assessmentService.createFollowUp(payload, { uid: teacherId, name: teacherName });
      }

      setIsModalOpen(false);
      loadFollowUps();
    } catch (err: any) {
      alert('Gagal menyimpan tindak lanjut: ' + (err?.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => formClassId ? s.classId === formClassId : true);

  const filteredFollowUps = followUps.filter(item => {
    if (selectedSubject !== 'all' && item.subjectId !== selectedSubject) return false;
    if (selectedClass !== 'all' && item.classId !== selectedClass) return false;
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <span>Tindak Lanjut & Remedial</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi program remedial, pengayaan, dan pendampingan belajar siswa &bull; TP {academicYear} ({semester})
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Tindak Lanjut Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Jenis Tindak Lanjut</option>
              <option value="Remedial">Remedial</option>
              <option value="Pengayaan">Pengayaan</option>
              <option value="Pendampingan">Pendampingan</option>
              <option value="Latihan tambahan">Latihan Tambahan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Follow Ups List */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : filteredFollowUps.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">Belum Ada Catatan Tindak Lanjut</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Catat hasil bimbingan remedial atau pengayaan materi yang telah dilaksanakan untuk siswa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFollowUps.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.type === 'Remedial' 
                      ? 'bg-rose-100 text-rose-800' 
                      : item.type === 'Pengayaan' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Tgl: {item.date}</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.studentName}</h3>
                  <p className="text-xs font-semibold text-emerald-700">
                    {item.subjectName} &bull; {item.className}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 border border-slate-100">
                  <p className="text-slate-700">
                    <strong>Bentuk Kegiatan:</strong> {item.description}
                  </p>
                  <p className="text-slate-700">
                    <strong>Hasil / Capaian:</strong> {item.result}
                  </p>
                  {(item.initialScore !== undefined || item.finalScore !== undefined) && (
                    <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-[11px]">
                      <span>Nilai Awal: <strong className="text-rose-700">{item.initialScore ?? '-'}</strong></span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>Nilai Akhir: <strong className="text-emerald-700">{item.finalScore ?? '-'}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => handleOpenEditModal(item)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'Edit Catatan Tindak Lanjut' : 'Catat Tindak Lanjut Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Siswa</label>
                <select
                  required
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {filteredStudents.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.nis || '-'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Tindak Lanjut</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Remedial">Remedial</option>
                    <option value="Pengayaan">Pengayaan</option>
                    <option value="Pendampingan">Pendampingan</option>
                    <option value="Latihan tambahan">Latihan Tambahan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nilai Awal (Opsional)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formInitialScore}
                    onChange={(e) => setFormInitialScore(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nilai Akhir (Opsional)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formFinalScore}
                    onChange={(e) => setFormFinalScore(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Kegiatan / Tindakan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Pemberian bimbingan perorangan dan latihan soal materi tajwid hukum mad."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hasil & Evaluasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siswa sudah mampu membedakan mad thabi'i dan mad far'i dengan benar."
                  value={formResult}
                  onChange={(e) => setFormResult(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

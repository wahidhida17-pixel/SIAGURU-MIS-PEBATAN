import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  File,
  AlertCircle,
  CheckCircle2,
  Tag,
  Info,
  Loader2
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { documentService, DEFAULT_CATEGORIES } from '../../services/documentService';
import type { DocumentItem, DocumentCategory, DocumentVisibility } from '../../types/document';
import type { ClassData, Subject, Semester } from '../../types/academic';
import { classService } from '../../services/classService';
import { subjectService } from '../../services/subjectService';

interface DocumentUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDocId: string) => void;
  currentUser: { uid: string; name: string; role?: 'admin' | 'guru' };
  initialData?: {
    academicYear?: string;
    semester?: Semester;
    category?: DocumentCategory;
    classId?: string;
    subjectId?: string;
  };
}

export const DocumentUploaderModal: React.FC<DocumentUploaderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  initialData
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(initialData?.category || 'Administrasi Pembelajaran');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState(initialData?.academicYear || '2026/2027');
  const [semester, setSemester] = useState<Semester>(initialData?.semester || 'Ganjil');
  const [classId, setClassId] = useState(initialData?.classId || '');
  const [subjectId, setSubjectId] = useState(initialData?.subjectId || '');
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('school');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      resetForm();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    try {
      const [cls, sub] = await Promise.all([classService.getAll(), subjectService.getAll()]);
      setClasses(cls);
      setSubjects(sub);
    } catch (err) {
      console.error('Error loading classes/subjects in uploader:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory(initialData?.category || 'Administrasi Pembelajaran');
    setDescription('');
    setAcademicYear(initialData?.academicYear || '2026/2027');
    setSemester(initialData?.semester || 'Ganjil');
    setClassId(initialData?.classId || '');
    setSubjectId(initialData?.subjectId || '');
    setTagsInput('');
    setVisibility(currentUser.role === 'admin' ? 'school' : 'private');
    setSelectedFile(null);
    setFileError(null);
    setDuplicateWarning(null);
    setIsSubmitting(false);
  };

  const handleFile = (file: File) => {
    const valid = storageService.validateFile(file);
    if (!valid.isValid) {
      setFileError(valid.error || 'File tidak valid');
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);

    // Auto-fill title if empty
    if (!title.trim()) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(baseName.replace(/_/g, ' '));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent, forceNew: boolean = false) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Mohon masukkan nama dokumen.');
      return;
    }
    if (!selectedFile) {
      alert('Mohon pilih file yang akan diunggah.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Check duplicates if not forced
      if (!forceNew) {
        const existingDocs = await documentService.getDocuments({
          ownerId: currentUser.uid,
          academicYear,
          status: 'active'
        });

        const duplicate = existingDocs.find(
          d => d.title.toLowerCase().trim() === title.toLowerCase().trim()
        );

        if (duplicate) {
          setDuplicateWarning(
            `Dokumen dengan nama "${title}" sudah tersedia di arsip ${academicYear}.`
          );
          setIsSubmitting(false);
          return;
        }
      }

      const selectedClass = classes.find(c => c.id === classId);
      const selectedSubject = subjects.find(s => s.id === subjectId);

      const tags = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(t => t.length > 0);

      const newDocId = await documentService.createDocument(
        {
          ownerId: currentUser.uid,
          ownerName: currentUser.name,
          ownerRole: currentUser.role || 'guru',
          title: title.trim(),
          description: description.trim(),
          category: category,
          fileName: selectedFile.name,
          fileType: storageService.getFileType(selectedFile.name),
          fileSize: selectedFile.size,
          storagePath: '',
          downloadUrl: '',
          academicYear,
          semester,
          classId: classId || undefined,
          className: selectedClass?.name,
          subjectId: subjectId || undefined,
          subjectName: selectedSubject?.name,
          tags,
          isFavorite: false,
          visibility
        },
        selectedFile,
        currentUser
      );

      onSuccess(newDocId);
      onClose();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      alert(err.message || 'Upload dokumen gagal. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Upload Dokumen Administrasi
              </h3>
              <p className="text-xs text-slate-500">
                Simpan dokumen guru, pembelajaran, kelas, atau surat ke arsip digital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={e => handleSubmit(e, false)} className="overflow-y-auto p-6 space-y-4">
          {/* Duplicate Warning Dialog */}
          {duplicateWarning && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-xs text-amber-900 dark:text-amber-300">
                    Dokumen Serupa Ditemukan
                  </h5>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {duplicateWarning}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={e => handleSubmit(e, true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Tetap Upload Sebagai Dokumen Baru
                </button>
              </div>
            </div>
          )}

          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              File Dokumen <span className="text-red-500">*</span>
            </label>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : selectedFile
                  ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      {storageService.getFileType(selectedFile.name).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {storageService.formatFileSize(selectedFile.size)} • Format valid
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold underline">Ganti File</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tarik file ke sini, atau <span className="text-emerald-600">pilih dari perangkat</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PDF, DOCX, XLSX, PPTX, JPG, PNG (Maksimal 25MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {fileError && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {fileError}
              </p>
            )}
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Dokumen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Modul Ajar Al-Qur'an Hadits Fase B Bab 1"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Dokumen <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hak Akses (Visibility)
              </label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as DocumentVisibility)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="private">Pribadi (Hanya Saya)</option>
                <option value="class">Khusus Kelas Terkait</option>
                <option value="school">Sekolah (Seluruh Guru & Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Pelajaran
              </label>
              <select
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value as Semester)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Terkait Kelas (Opsional)
              </label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Umum / Tanpa Kelas --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Terkait Mata Pelajaran (Opsional)
              </label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Umum / Tanpa Mapel --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tag / Kata Kunci (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="Contoh: rpp, fase_b, alquran, semester1, kktp"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catatan / Deskripsi Singkat
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ringkasan isi dokumen atau petunjuk penggunaan..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile || !title.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center gap-2 shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Simpan Dokumen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  History,
  Download,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Star,
  Archive,
  Upload,
  Calendar,
  User,
  Tag,
  Shield,
  FileCheck,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  File,
  Loader2
} from 'lucide-react';
import type { DocumentItem, DocumentVisibility } from '../../types/document';
import { storageService } from '../../services/storageService';
import { documentService, DEFAULT_CATEGORIES } from '../../services/documentService';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  currentUser: { uid: string; name: string; role?: 'admin' | 'guru' };
  onUpdated: () => void;
  onPreview: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  onDuplicate: (doc: DocumentItem) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  currentUser,
  onUpdated,
  onPreview,
  onDownload,
  onDuplicate
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'history' | 'new_version'>('detail');

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState<DocumentVisibility>('school');
  const [isSaving, setIsSaving] = useState(false);

  // New version fields
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState('');
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  React.useEffect(() => {
    if (doc) {
      setEditTitle(doc.title);
      setEditCategory(doc.category);
      setEditDescription(doc.description || '');
      setEditVisibility(doc.visibility || 'school');
      setIsEditing(false);
      setNewVersionFile(null);
      setVersionNote('');
      setActiveTab('detail');
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const canEdit = currentUser.role === 'admin' || doc.ownerId === currentUser.uid;

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      setIsSaving(true);
      await documentService.updateDocument(
        doc.id!,
        {
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          visibility: editVisibility
        },
        undefined,
        undefined,
        currentUser
      );
      setIsEditing(false);
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionFile) {
      alert('Pilih file versi terbaru.');
      return;
    }

    try {
      setIsUploadingVersion(true);
      await documentService.updateDocument(
        doc.id!,
        {},
        newVersionFile,
        versionNote || `Revisi versi ${(doc.version || 1) + 1}`,
        currentUser
      );
      setNewVersionFile(null);
      setVersionNote('');
      setActiveTab('history');
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah versi baru.');
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleTrash = async () => {
    if (window.confirm(`Pindahkan dokumen "${doc.title}" ke tempat sampah?`)) {
      await documentService.moveToTrash(doc.id!, currentUser);
      onClose();
      onUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              {(doc.fileType || 'DOC').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {doc.title}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  v{doc.version || 1}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {doc.category} • {storageService.formatFileSize(doc.fileSize)}
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

        {/* Tab navigation */}
        <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex gap-4 text-xs font-medium text-slate-500 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('detail')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'detail'
                ? 'border-emerald-600 text-emerald-600 font-semibold dark:text-emerald-400'
                : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Informasi Dokumen
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-600 font-semibold dark:text-emerald-400'
                : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat Versi ({doc.versions?.length || 1})
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab('new_version')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'new_version'
                  ? 'border-emerald-600 text-emerald-600 font-semibold dark:text-emerald-400'
                  : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Versi Baru
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'detail' && (
            <div className="space-y-5">
              {isEditing ? (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Edit Informasi Dokumen
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Dokumen
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori
                    </label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                      value={editVisibility}
                      onChange={e => setEditVisibility(e.target.value as DocumentVisibility)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="private">Pribadi (Hanya Saya)</option>
                      <option value="class">Khusus Kelas Terkait</option>
                      <option value="school">Sekolah (Seluruh Guru & Admin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white flex items-center gap-1.5"
                    >
                      {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tahun Pelajaran:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {doc.academicYear} {doc.semester ? `(${doc.semester})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pemilik Dokumen:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{doc.ownerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Format / Ukuran:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {doc.fileType?.toUpperCase()} ({storageService.formatFileSize(doc.fileSize)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Kelas & Mapel:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {doc.className ? `Kelas ${doc.className}` : 'Umum'} {doc.subjectName ? `• ${doc.subjectName}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hak Akses:</span>
                  <span className="font-medium capitalize text-slate-800 dark:text-slate-200">
                    {doc.visibility === 'school' ? 'Seluruh Madrasah' : doc.visibility === 'class' ? 'Terkait Kelas' : 'Pribadi'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tanggal Upload:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(doc.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Catatan:
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {doc.description || 'Tidak ada catatan deskripsi tambahan.'}
                </p>
              </div>

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div>
                  <h5 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                    Tag Kata Kunci:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Riwayat Perubahan & Versi Dokumen
                </h4>
                <span className="text-xs text-slate-400">
                  Total {doc.versions?.length || 1} riwayat revisi
                </span>
              </div>

              <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-4 space-y-4">
                {(doc.versions || [
                  {
                    version: 1,
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    storagePath: doc.storagePath,
                    downloadUrl: doc.downloadUrl,
                    note: 'Versi awal dokumen',
                    updatedBy: doc.ownerId,
                    updatedByName: doc.ownerName,
                    updatedAt: doc.createdAt
                  }
                ]).map((ver, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                            Versi {ver.version}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {ver.fileName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ver.updatedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        {ver.note || 'Pembaruan dokumen'}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500">
                        <span>Oleh: <strong className="font-semibold text-slate-700 dark:text-slate-300">{ver.updatedByName || 'Pengguna'}</strong></span>
                        <span>{storageService.formatFileSize(ver.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'new_version' && (
            <form onSubmit={handleUploadNewVersion} className="space-y-4">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                <p className="font-semibold mb-0.5">Unggah Revisi Versi {(doc.version || 1) + 1}</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Dokumen versi lama tetap akan tersimpan dalam riwayat dan dapat diakses sewaktu-waktu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih File Revisi <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setNewVersionFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Revisi / Pembaruan
                </label>
                <textarea
                  rows={2}
                  value={versionNote}
                  onChange={e => setVersionNote(e.target.value)}
                  placeholder="Contoh: Revisi indikator asesmen dan pembaruan alokasi waktu bab 2"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploadingVersion || !newVersionFile}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  {isUploadingVersion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah Versi Baru...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Simpan Revisi Versi {(doc.version || 1) + 1}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPreview(doc)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={() => onDownload(doc)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Informasi
              </button>
            )}
            <button
              onClick={() => onDuplicate(doc)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5"
              title="Salin dokumen ke tahun ajaran baru"
            >
              <Copy className="w-3.5 h-3.5" /> Duplikat
            </button>
            {canEdit && (
              <button
                onClick={handleTrash}
                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ke Sampah
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

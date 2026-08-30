import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Plus,
  Edit2,
  Trash2,
  Download,
  FileText,
  CheckCircle2,
  Search,
  Upload,
  Layers,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { templateService } from '../../../services/templateService';
import { storageService } from '../../../services/storageService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { DocumentTemplate } from '../../../types/document';
import { DEFAULT_CATEGORIES } from '../../../services/documentService';

export const AdminDocumentTemplatesView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Modul Ajar');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('docx');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const list = await templateService.getTemplates();
      setTemplates(list);
    } catch (e) {
      console.error('Error loading templates:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setTitle('');
    setCategory('Modul Ajar');
    setDescription('');
    setFileType('docx');
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: DocumentTemplate) => {
    setEditingTemplate(t);
    setTitle(t.title);
    setCategory(t.category);
    setDescription(t.description || '');
    setFileType(t.fileType);
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingTemplate?.id) {
        await templateService.updateTemplate(
          editingTemplate.id,
          {
            title: title.trim(),
            category,
            description: description.trim(),
            fileType
          },
          uploadedFile || undefined,
          userProfile
        );
      } else {
        await templateService.createTemplate(
          {
            title: title.trim(),
            category,
            description: description.trim(),
            fileType,
            fileName: uploadedFile ? uploadedFile.name : `${title.replace(/\s+/g, '_')}.${fileType}`,
            fileSize: uploadedFile ? uploadedFile.size : 35000,
            storagePath: '',
            downloadUrl: '',
            isActive: true,
            usageCount: 0,
            createdBy: userProfile!.uid,
            createdByName: userProfile!.name
          },
          uploadedFile || undefined,
          userProfile
        );
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (t: DocumentTemplate) => {
    await templateService.updateTemplate(t.id!, { isActive: !t.isActive }, undefined, userProfile);
    fetchTemplates();
  };

  const handleDelete = async (t: DocumentTemplate) => {
    if (window.confirm(`Hapus template "${t.title}"?`)) {
      await templateService.deleteTemplate(t.id!, userProfile);
      fetchTemplates();
    }
  };

  const filtered = templates.filter(t => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat bank template dokumen madrasah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Kelola Template Dokumen Madrasah
          </h1>
          <p className="text-xs text-slate-500">
            Kelola format standar Prota, Promes, Modul Ajar, Kisi-kisi, dan Daftar Nilai untuk digunakan oleh seluruh dewan guru
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Tambah Template Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama template dokumen..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:w-56 shrink-0">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {DEFAULT_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Templates */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Template</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Format File</th>
                <th className="py-3 px-4 text-center">Penggunaan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(t => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {t.title}
                    </p>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {t.description || t.fileName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 uppercase font-bold text-slate-600 dark:text-slate-300">
                    {t.fileType}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">
                    {t.usageCount || 0}x digunakan
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(t)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.isActive ? 'Aktif' : 'Non-Aktif'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.downloadUrl && (
                        <a
                          href={t.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          title="Unduh File Master"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                        title="Hapus Template"
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingTemplate ? 'Edit Template Dokumen' : 'Tambah Template Dokumen Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Template Dokumen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Template Modul Ajar Kurikulum Merdeka (Word)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Dokumen
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Format File
                  </label>
                  <select
                    value={fileType}
                    onChange={e => setFileType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="docx">Microsoft Word (.docx)</option>
                    <option value="xlsx">Microsoft Excel (.xlsx)</option>
                    <option value="pdf">Adobe PDF (.pdf)</option>
                    <option value="pptx">PowerPoint (.pptx)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload File Master Template (Opsional / Rekomendasi)
                </label>
                <input
                  type="file"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan & Petunjuk Pengisian
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Panduan bagi guru dalam menggunakan format template ini..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

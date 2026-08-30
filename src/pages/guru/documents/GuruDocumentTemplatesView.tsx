import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  FileText,
  FileSpreadsheet,
  Download,
  Copy,
  Plus,
  Eye,
  CheckCircle2,
  Search,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { templateService } from '../../../services/templateService';
import { storageService } from '../../../services/storageService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { DocumentTemplate } from '../../../types/document';
import { useNavigate } from 'react-router-dom';

export const GuruDocumentTemplatesView: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [usingTemplateId, setUsingTemplateId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const list = await templateService.getTemplates({ isActive: true });
      setTemplates(list);
    } catch (e) {
      console.error('Error loading templates:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: DocumentTemplate) => {
    if (!userProfile) return;
    try {
      setUsingTemplateId(template.id!);
      await templateService.useTemplate(
        template.id!,
        {
          uid: userProfile.uid,
          name: userProfile.name
        },
        {
          academicYear: '2026/2027',
          semester: 'Ganjil'
        }
      );
      setSuccessMessage(`Berhasil membuat salinan dokumen dari template "${template.title}"!`);
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/guru/documents/my');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Gagal menggunakan template.');
    } finally {
      setUsingTemplateId(null);
    }
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const filteredTemplates = templates.filter(t => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (category !== 'all' && t.category !== category) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat template dokumen madrasah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur-xs">
            <Bookmark className="w-3.5 h-3.5" /> Template Standar Madrasah
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Bank Template Administrasi Guru
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Gunakan format resmi Prota, Promes, Modul Ajar, Daftar Nilai, Jurnal Mengajar, dan Notulen Rapat MI Syuriyah Pebatan. Sekali klik untuk membuat salinan pribadi.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage} Mengalihkan ke Dokumen Saya...</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari template dokumen..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:w-56 shrink-0">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          Belum ada template dokumen pada kategori yang dipilih.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(tpl => {
            const isWord = ['doc', 'docx'].includes((tpl.fileType || '').toLowerCase());
            const isExcel = ['xls', 'xlsx'].includes((tpl.fileType || '').toLowerCase());
            const isUsing = usingTemplateId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                      {tpl.fileType?.toUpperCase() || 'DOC'}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                      {tpl.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {tpl.description || 'Template resmi madrasah siap pakai.'}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                    <p>Format: <strong>{tpl.fileName}</strong></p>
                    <p>Digunakan: <strong>{tpl.usageCount || 0} kali</strong> oleh dewan guru</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {tpl.downloadUrl && (
                    <a
                      href={tpl.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh
                    </a>
                  )}

                  <button
                    onClick={() => handleUseTemplate(tpl)}
                    disabled={isUsing}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    {isUsing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyiapkan...
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Gunakan Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

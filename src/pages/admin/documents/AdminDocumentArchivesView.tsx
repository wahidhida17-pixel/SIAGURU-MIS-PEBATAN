import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  Download,
  Eye,
  Layers,
  Search,
  ArrowLeft,
  Users
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { documentService } from '../../../services/documentService';
import { storageService } from '../../../services/storageService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { DocumentPreviewModal } from '../../../components/documents/DocumentPreviewModal';
import { DocumentDetailModal } from '../../../components/documents/DocumentDetailModal';
import type { DocumentItem } from '../../../types/document';

export const AdminDocumentArchivesView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentService.getDocuments({ status: 'active' });
      setDocuments(docs);
    } catch (e) {
      console.error('Error loading admin archives:', e);
    } finally {
      setLoading(false);
    }
  };

  const yearFolders = Array.from(new Set(documents.map(d => d.academicYear))).sort().reverse();
  const categoriesInYear = selectedYear
    ? Array.from(
        new Set(
          documents.filter(d => d.academicYear === selectedYear).map(d => d.category)
        )
      )
    : [];

  const currentDocs = documents.filter(d => {
    if (selectedYear && d.academicYear !== selectedYear) return false;
    if (selectedCategory && d.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !d.title.toLowerCase().includes(q) &&
        !d.fileName.toLowerCase().includes(q) &&
        !d.ownerName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handlePreview = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleDetail = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsDetailOpen(true);
  };

  const handleDownload = (doc: DocumentItem) => {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat struktur arsip madrasah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Master Arsip Digital Madrasah
        </h1>
        <p className="text-xs text-slate-500">
          Penjelajah direktori arsip seluruh madrasah: dokumen guru, perangkat ajar, SK, surat, dan administrasi akademik
        </p>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => {
              setSelectedYear(null);
              setSelectedCategory(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              !selectedYear
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" /> Root Arsip Madrasah
          </button>

          {selectedYear && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  !selectedCategory
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                T.P. {selectedYear}
              </button>
            </>
          )}

          {selectedCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-lg">
                {selectedCategory}
              </span>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari dalam arsip madrasah..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Directory Level 1: Year Folders */}
      {!selectedYear ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {yearFolders.map(yr => {
            const count = documents.filter(d => d.academicYear === yr).length;
            return (
              <div
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center font-bold shrink-0 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    T.P. {yr}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{count} Berkas Tersimpan</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : !selectedCategory ? (
        /* Directory Level 2: Categories in Year */
        <div className="space-y-4">
          <button
            onClick={() => setSelectedYear(null)}
            className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Pilihan Tahun
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoriesInYear.map(cat => {
              const count = documents.filter(
                d => d.academicYear === selectedYear && d.category === cat
              ).length;
              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center font-bold shrink-0 group-hover:scale-110 transition-transform">
                    <Folder className="w-6 h-6 fill-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {cat}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{count} Dokumen</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Directory Level 3: Files Table */
        <div className="space-y-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Kategori
          </button>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Dokumen</th>
                    <th className="py-3 px-4">Pemilik / Guru</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Ukuran</th>
                    <th className="py-3 px-4">Tanggal Arsip</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentDocs.map(doc => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {doc.title}
                            </p>
                            <span className="text-[10px] text-slate-400">{doc.fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {doc.ownerName}
                      </td>
                      <td className="py-3 px-4 uppercase font-bold text-slate-600 dark:text-slate-300">
                        {doc.fileType}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {storageService.formatFileSize(doc.fileSize)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(doc.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePreview(doc)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                          >
                            Lihat
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-medium"
                          >
                            Unduh
                          </button>
                          <button
                            onClick={() => handleDetail(doc)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={selectedDoc}
        onDownload={handleDownload}
      />

      <DocumentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        document={selectedDoc}
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name, role: 'admin' }}
        onUpdated={() => fetchDocuments()}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onDuplicate={() => {}}
      />
    </div>
  );
};

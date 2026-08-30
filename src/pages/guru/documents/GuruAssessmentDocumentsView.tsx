import React, { useState, useEffect } from 'react';
import {
  Award,
  Upload,
  Plus,
  FileSpreadsheet,
  FileText,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { documentService } from '../../../services/documentService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { DocumentCard } from '../../../components/documents/DocumentCard';
import { DocumentUploaderModal } from '../../../components/documents/DocumentUploaderModal';
import { DocumentPreviewModal } from '../../../components/documents/DocumentPreviewModal';
import { DocumentDetailModal } from '../../../components/documents/DocumentDetailModal';
import type { DocumentItem } from '../../../types/document';
import { Link } from 'react-router-dom';

export const GuruAssessmentDocumentsView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subCategory, setSubCategory] = useState<string>('Semua');

  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const subCategories = [
    'Semua',
    'Kisi-Kisi Asesmen',
    'Naskah Soal',
    'Rubrik & Pedoman Penskoran',
    'Rekap & Analisis Nilai',
    'Program Remedial & Pengayaan'
  ];

  useEffect(() => {
    fetchData();
  }, [userProfile?.uid]);

  const fetchData = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const docs = await documentService.getDocuments({
        ownerId: userProfile.uid,
        status: 'active'
      });
      const assessmentCategories = [
        'Kisi-kisi',
        'Soal',
        'Rubrik',
        'Penilaian',
        'Remedial',
        'Asesmen',
        'Daftar Nilai',
        'Analisis'
      ];
      const filtered = docs.filter(
        d =>
          assessmentCategories.some(c => d.category.includes(c)) ||
          d.tags?.some(t => assessmentCategories.some(c => t.toLowerCase().includes(c.toLowerCase())))
      );
      setDocuments(filtered);
    } catch (e) {
      console.error('Error loading assessment docs:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(d => {
    if (subCategory !== 'Semua' && !d.category.includes(subCategory.replace(/\s*\(.*?\)/, ''))) {
      return false;
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

  const handleToggleFavorite = async (id: string) => {
    await documentService.toggleFavorite(id, { uid: userProfile!.uid, name: userProfile!.name });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat dokumen penilaian & asesmen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Dokumen Penilaian & Asesmen
          </h1>
          <p className="text-xs text-slate-500">
            Arsip instrumen penilaian, kisi-kisi soal, rubrik evaluasi, hasil analisis ketuntasan, dan program tindak lanjut
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/guru/rekap-nilai"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50"
          >
            Modul Nilai <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setIsUploaderOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" /> + Upload Dokumen
          </button>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subCategories.map(sc => (
          <button
            key={sc}
            onClick={() => setSubCategory(sc)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              subCategory === sc
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {sc}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Award className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Belum ada berkas dokumen penilaian
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Simpan naskah soal sumatif, analisis butir soal, atau daftar nilai formatif ke dalam arsip digital.
          </p>
          <button
            onClick={() => setIsUploaderOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Upload Dokumen Asesmen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onToggleFavorite={handleToggleFavorite}
              onDetail={handleDetail}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <DocumentUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onSuccess={() => fetchData()}
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name, role: 'guru' }}
        defaultCategory="Kisi-kisi & Soal"
      />

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
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name, role: 'guru' }}
        onUpdated={() => fetchData()}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onDuplicate={() => {}}
      />
    </div>
  );
};

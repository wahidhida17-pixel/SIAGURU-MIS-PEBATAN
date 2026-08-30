import React, { useState, useEffect } from 'react';
import {
  Users,
  Upload,
  Plus,
  FileText,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { documentService } from '../../../services/documentService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { DocumentCard } from '../../../components/documents/DocumentCard';
import { DocumentUploaderModal } from '../../../components/documents/DocumentUploaderModal';
import { DocumentPreviewModal } from '../../../components/documents/DocumentPreviewModal';
import { DocumentDetailModal } from '../../../components/documents/DocumentDetailModal';
import type { DocumentItem } from '../../../types/document';
import { classService } from '../../../services/classService';
import type { ClassData } from '../../../types/academic';

export const GuruClassDocumentsView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  useEffect(() => {
    fetchData();
  }, [userProfile?.uid]);

  const fetchData = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const [docs, cls] = await Promise.all([
        documentService.getDocuments({
          category: 'Dokumen Kelas',
          status: 'active'
        }),
        classService.getAll()
      ]);
      setDocuments(docs);
      setClasses(cls);
    } catch (e) {
      console.error('Error loading class docs:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(d => {
    if (selectedClassId !== 'all' && d.classId !== selectedClassId) return false;
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
    } else {
      alert(`Mengunduh ${doc.fileName}...`);
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
        <p className="text-xs text-slate-500 mt-2">Memuat dokumen administrasi kelas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              Wali Kelas & Guru
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            Administrasi & Dokumen Kelas
          </h1>
          <p className="text-xs text-slate-500">
            Daftar Siswa, Struktur Pengurus Kelas, Jadwal Piket Kebersihan, Tata Tertib Kelas, Denah Tempat Duduk, dan Berita Acara Kelas
          </p>
        </div>

        <button
          onClick={() => setIsUploaderOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" /> + Upload Dokumen Kelas
        </button>
      </div>

      {/* Class filter selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedClassId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
            selectedClassId === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Semua Kelas ({documents.length})
        </button>
        {classes.map(c => {
          const count = documents.filter(d => d.classId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                selectedClassId === c.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Kelas {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Belum ada berkas dokumen kelas
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Unggah jadwal piket, denah duduk, atau struktur organisasi kelas untuk memudahkan koordinasi kelas.
          </p>
          <button
            onClick={() => setIsUploaderOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Upload Dokumen Kelas Sekarang
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
        defaultCategory="Dokumen Kelas"
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

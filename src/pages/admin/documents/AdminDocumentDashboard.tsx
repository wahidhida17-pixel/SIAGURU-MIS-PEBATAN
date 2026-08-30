import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  Upload,
  Bookmark,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  Download,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { documentService } from '../../../services/documentService';
import { storageService } from '../../../services/storageService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { DocumentCard } from '../../../components/documents/DocumentCard';
import { DocumentFilterBar } from '../../../components/documents/DocumentFilterBar';
import { DocumentUploaderModal } from '../../../components/documents/DocumentUploaderModal';
import { DocumentPreviewModal } from '../../../components/documents/DocumentPreviewModal';
import { DocumentDetailModal } from '../../../components/documents/DocumentDetailModal';
import type { DocumentItem } from '../../../types/document';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';
import type { ClassData, Subject, Semester } from '../../../types/academic';
import { Link, useNavigate } from 'react-router-dom';

export const AdminDocumentDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [fileType, setFileType] = useState('all');
  const [academicYear, setAcademicYear] = useState('all');
  const [semester, setSemester] = useState<Semester | 'all'>('all');
  const [classId, setClassId] = useState('all');
  const [subjectId, setSubjectId] = useState('all');
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      const [docs, cls, sub] = await Promise.all([
        documentService.getDocuments({ status: 'active' }),
        classService.getAll(),
        subjectService.getAll()
      ]);
      setDocuments(docs);
      setClasses(cls);
      setSubjects(sub);
    } catch (e) {
      console.error('Error loading admin documents:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchCategory = doc.category.toLowerCase().includes(q);
      const matchOwner = doc.ownerName?.toLowerCase().includes(q);
      const matchFileName = doc.fileName?.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory && !matchOwner && !matchFileName) return false;
    }
    if (category !== 'all' && doc.category !== category) return false;
    if (fileType !== 'all') {
      const type = (doc.fileType || '').toLowerCase();
      if (fileType === 'pdf' && type !== 'pdf') return false;
      if (fileType === 'doc' && !['doc', 'docx'].includes(type)) return false;
      if (fileType === 'xls' && !['xls', 'xlsx'].includes(type)) return false;
      if (fileType === 'jpg' && !['jpg', 'jpeg', 'png', 'webp'].includes(type)) return false;
    }
    if (academicYear !== 'all' && doc.academicYear !== academicYear) return false;
    if (semester !== 'all' && doc.semester !== semester) return false;
    if (classId !== 'all' && doc.classId !== classId) return false;
    if (subjectId !== 'all' && doc.subjectId !== subjectId) return false;
    if (isFavorite && !doc.isFavorite) return false;
    return true;
  });

  const pdfCount = documents.filter(d => (d.fileType || '').toLowerCase() === 'pdf').length;
  const wordCount = documents.filter(d => ['doc', 'docx'].includes((d.fileType || '').toLowerCase())).length;
  const excelCount = documents.filter(d => ['xls', 'xlsx'].includes((d.fileType || '').toLowerCase())).length;
  const imageCount = documents.filter(d => ['jpg', 'jpeg', 'png', 'webp'].includes((d.fileType || '').toLowerCase())).length;

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
    fetchAllDocuments();
  };

  const handleTrash = async (doc: DocumentItem) => {
    if (window.confirm(`Pindahkan dokumen "${doc.title}" ke tempat sampah?`)) {
      await documentService.moveToTrash(doc.id!, { uid: userProfile!.uid, name: userProfile!.name });
      fetchAllDocuments();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat Pusat Dokumen & Administrasi Madrasah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5" /> Administrasi Madrasah & Dokumen Pusat
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Pusat Dokumen, Kalender & Arsip MI Syuriyah
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Arsip digital menyeluruh: kelola seluruh berkas perangkat guru, template resmi, surat madrasah, dan monitoring kelengkapan administrasi dewan guru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsUploaderOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <Upload className="w-4 h-4" /> + Upload Dokumen Resmi
            </button>
            <Link
              to="/admin/documents/monitoring"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 border border-white/20 backdrop-blur-xs transition-colors"
            >
              <Users className="w-4 h-4" /> Monitoring Guru
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-400 block mb-1">Total Arsip Dokumen</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {documents.length}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Seluruh Madrasah</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-red-500 font-medium block mb-1">Dokumen PDF</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{pdfCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Modul & Surat</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-blue-500 font-medium block mb-1">Dokumen Word</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{wordCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">RPP & Notulen</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-emerald-500 font-medium block mb-1">Dokumen Excel</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{excelCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Daftar Nilai & Promes</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-amber-500 font-medium block mb-1">Foto / Dokumentasi</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{imageCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Kegiatan</span>
        </div>
      </div>

      {/* Filter Bar */}
      <DocumentFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        fileType={fileType}
        onFileTypeChange={setFileType}
        academicYear={academicYear}
        onAcademicYearChange={setAcademicYear}
        semester={semester}
        onSemesterChange={setSemester}
        classId={classId}
        onClassIdChange={setClassId}
        subjectId={subjectId}
        onSubjectIdChange={setSubjectId}
        isFavorite={isFavorite}
        onToggleFavorite={setIsFavorite}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        classes={classes}
        subjects={subjects}
        totalCount={filteredDocs.length}
      />

      {/* Grid or Table Display */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          Tidak ada dokumen yang sesuai dengan filter pencarian.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onToggleFavorite={handleToggleFavorite}
              onDetail={handleDetail}
              onTrash={handleTrash}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Dokumen</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Pemilik / Guru</th>
                  <th className="py-3 px-4">Tahun / Sem</th>
                  <th className="py-3 px-4">Format / Ukuran</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map(doc => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {doc.title}
                      </p>
                      <span className="text-[10px] text-slate-400">{doc.fileName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {doc.ownerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {doc.academicYear} {doc.semester ? `(${doc.semester})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-500 uppercase font-medium">
                      {doc.fileType} ({storageService.formatFileSize(doc.fileSize)})
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePreview(doc)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[11px]"
                        >
                          Unduh
                        </button>
                        <button
                          onClick={() => handleDetail(doc)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
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
      )}

      {/* Modals */}
      <DocumentUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onSuccess={() => fetchAllDocuments()}
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name, role: 'admin' }}
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
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name, role: 'admin' }}
        onUpdated={() => fetchAllDocuments()}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onDuplicate={() => {}}
      />
    </div>
  );
};

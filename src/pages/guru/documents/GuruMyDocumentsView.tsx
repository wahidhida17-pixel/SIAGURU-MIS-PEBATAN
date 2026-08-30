import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Download,
  Star,
  Layers,
  Sparkles
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
import type { ClassData, Subject, Semester } from '../../../types/academic';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';

export const GuruMyDocumentsView: React.FC = () => {
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filter States
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
    fetchData();
  }, [userProfile?.uid]);

  const fetchData = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const [docs, cls, sub] = await Promise.all([
        documentService.getDocuments({
          ownerId: userProfile.uid,
          status: 'active'
        }),
        classService.getAll(),
        subjectService.getAll()
      ]);
      setDocuments(docs);
      setClasses(cls);
      setSubjects(sub);
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredDocs = documents.filter(doc => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchCategory = doc.category.toLowerCase().includes(q);
      const matchFileName = doc.fileName.toLowerCase().includes(q);
      const matchTags = doc.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchCategory && !matchFileName && !matchTags) return false;
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
      const link = window.document.createElement('a');
      link.href = doc.downloadUrl;
      link.download = doc.fileName || `${doc.title}.pdf`;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      alert(`Memulai unduhan file ${doc.fileName}...`);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await documentService.toggleFavorite(id, { uid: userProfile!.uid, name: userProfile!.name });
    fetchData();
  };

  const handleDuplicate = async (doc: DocumentItem) => {
    await documentService.duplicateDocument(doc.id!, '2026/2027', undefined, {
      uid: userProfile!.uid,
      name: userProfile!.name
    });
    fetchData();
  };

  const handleTrash = async (doc: DocumentItem) => {
    if (window.confirm(`Pindahkan dokumen "${doc.title}" ke tempat sampah?`)) {
      await documentService.moveToTrash(doc.id!, { uid: userProfile!.uid, name: userProfile!.name });
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat koleksi dokumen saya...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Dokumen Saya
          </h1>
          <p className="text-xs text-slate-500">
            Kumpulan seluruh dokumen administrasi, perangkat ajar, dan berkas pribadi Anda
          </p>
        </div>

        <button
          onClick={() => setIsUploaderOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" /> + Upload Dokumen Baru
        </button>
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

      {/* Content View */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Tidak ada dokumen yang sesuai filter
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter format dan kategori.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('all');
              setFileType('all');
              setIsFavorite(false);
            }}
            className="px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
          >
            Reset Semua Filter
          </button>
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
              onDuplicate={handleDuplicate}
              onTrash={handleTrash}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Dokumen</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tahun / Sem</th>
                  <th className="py-3 px-4">Kelas & Mapel</th>
                  <th className="py-3 px-4">Format / Ukuran</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map(doc => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleToggleFavorite(doc.id!)}
                          className="text-slate-300 hover:text-amber-500"
                        >
                          <Star
                            className="w-3.5 h-3.5"
                            fill={doc.isFavorite ? '#f59e0b' : 'none'}
                            stroke={doc.isFavorite ? '#f59e0b' : 'currentColor'}
                          />
                        </button>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {doc.title}
                          </p>
                          <span className="text-[10px] text-slate-400">v{doc.version || 1} • {doc.fileName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {doc.academicYear} {doc.semester ? `(${doc.semester})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {doc.className ? `Kelas ${doc.className}` : '-'} {doc.subjectName ? `• ${doc.subjectName}` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-500 uppercase font-medium">
                      {doc.fileType} ({storageService.formatFileSize(doc.fileSize)})
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
      )}

      {/* Modals */}
      <DocumentUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onSuccess={() => fetchData()}
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name, role: 'guru' }}
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
        onDuplicate={handleDuplicate}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  Upload,
  Plus,
  Bookmark,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Search,
  Layers,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { documentService } from '../../../services/documentService';
import { reminderService } from '../../../services/reminderService';
import { calendarService } from '../../../services/calendarService';
import { agendaService } from '../../../services/agendaService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { DocumentCard } from '../../../components/documents/DocumentCard';
import { DocumentUploaderModal } from '../../../components/documents/DocumentUploaderModal';
import { DocumentPreviewModal } from '../../../components/documents/DocumentPreviewModal';
import { DocumentDetailModal } from '../../../components/documents/DocumentDetailModal';
import { ReminderModal } from '../../../components/calendar/ReminderModal';
import { EventFormModal } from '../../../components/calendar/EventFormModal';
import type { DocumentItem } from '../../../types/document';
import type { CalendarEvent, AgendaItem, ReminderItem } from '../../../types/calendar';
import { Link, useNavigate } from 'react-router-dom';

export const GuruDocumentDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pdfCount: 0,
    wordCount: 0,
    excelCount: 0,
    imageCount: 0,
    favoriteCount: 0,
    draftCount: 0,
    archivedCount: 0,
    trashCount: 0
  });

  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [favoriteDocs, setFavoriteDocs] = useState<DocumentItem[]>([]);
  const [todayAgendas, setTodayAgendas] = useState<AgendaItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  // Modals
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const currentAcademicYear = '2026/2027';

  useEffect(() => {
    fetchDashboardData();
  }, [userProfile?.uid]);

  const fetchDashboardData = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const [
        docStats,
        myDocs,
        favDocs,
        agendas,
        calEvents,
        userReminders
      ] = await Promise.all([
        documentService.getDocumentStatistics(userProfile.uid, currentAcademicYear),
        documentService.getDocuments({
          ownerId: userProfile.uid,
          academicYear: currentAcademicYear,
          status: 'active'
        }),
        documentService.getDocuments({
          ownerId: userProfile.uid,
          isFavorite: true,
          status: 'active'
        }),
        agendaService.getAgendas({
          teacherId: userProfile.uid,
          academicYear: currentAcademicYear
        }),
        calendarService.getEvents({
          academicYear: currentAcademicYear
        }),
        reminderService.getReminders(userProfile.uid)
      ]);

      setStats(docStats as any);
      setRecentDocs(myDocs.slice(0, 4));
      setFavoriteDocs(favDocs.slice(0, 4));
      setTodayAgendas(agendas.slice(0, 3));
      setUpcomingEvents(calEvents.slice(0, 3));
      setReminders(userReminders.filter(r => !r.isDismissed).slice(0, 3));
    } catch (e) {
      console.error('Error loading Guru Document Dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

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
    fetchDashboardData();
  };

  const handleDuplicate = async (doc: DocumentItem) => {
    await documentService.duplicateDocument(doc.id!, currentAcademicYear, undefined, {
      uid: userProfile!.uid,
      name: userProfile!.name
    });
    fetchDashboardData();
  };

  const handleTrash = async (doc: DocumentItem) => {
    if (window.confirm(`Pindahkan dokumen "${doc.title}" ke tempat sampah?`)) {
      await documentService.moveToTrash(doc.id!, { uid: userProfile!.uid, name: userProfile!.name });
      fetchDashboardData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-2">Memuat Dashboard Dokumen & Administrasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" /> Administrasi Guru & Arsip Digital
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Pusat Dokumen & Kalender Akademik
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Kelola perangkat pembelajaran (Prota, Promes, ATP, Modul Ajar), dokumen kelas, penilaian, surat, serta agenda madrasah T.P. {currentAcademicYear}.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsUploaderOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
            >
              <Upload className="w-4 h-4" /> + Upload Dokumen
            </button>
            <button
              onClick={() => navigate('/guru/documents/templates')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 border border-white/20 backdrop-blur-xs transition-colors"
            >
              <Bookmark className="w-4 h-4" /> Gunakan Template
            </button>
            <button
              onClick={() => setIsReminderModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 border border-white/20 backdrop-blur-xs transition-colors"
            >
              <Clock className="w-4 h-4" /> + Buat Pengingat
            </button>
          </div>
        </div>
      </div>

      {/* Deadlines & Incomplete Checklist Alert */}
      {reminders.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                ⏰ Pengingat Deadline & Tugas Terdekat
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {reminders[0].title} — Jatuh tempo pada {reminders[0].date} pukul {reminders[0].time} WIB
              </p>
            </div>
          </div>
          <Link
            to="/guru/reminders"
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 self-start sm:self-center shadow-xs"
          >
            Lihat Semua Pengingat →
          </Link>
        </div>
      )}

      {/* Document Statistics Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-emerald-600" />
            Ringkasan Dokumen Saya
          </h3>
          <Link
            to="/guru/documents/my"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Buka Dokumen Saya ({stats.total}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Dokumen</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.total}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">T.P. {currentAcademicYear}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-red-500 mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">File PDF</span>
              <div className="w-6 h-6 rounded bg-red-100 dark:bg-red-950/60 flex items-center justify-center font-bold text-[10px]">
                PDF
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.pdfCount}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Modul & Laporan</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-blue-500 mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">File Word</span>
              <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center font-bold text-[10px]">
                DOC
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.wordCount}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">RPP & Notulen</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-500 mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">File Excel</span>
              <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center font-bold text-[10px]">
                XLS
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.excelCount}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Daftar Nilai & Promes</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Gambar</span>
              <FileImage className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.imageCount}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Dokumentasi Kegiatan</span>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns: Documents + Calendar/Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent & Favorite Documents (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Documents */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Dokumen Terbaru
              </h3>
              <Link
                to="/guru/documents/my"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Lihat Semua ({stats.total}) →
              </Link>
            </div>

            {recentDocs.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">Belum ada dokumen yang diunggah.</p>
                <button
                  onClick={() => setIsUploaderOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
                >
                  Upload Dokumen Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentDocs.map(doc => (
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
            )}
          </div>

          {/* Favorite Documents */}
          {favoriteDocs.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Dokumen Favorit
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoriteDocs.map(doc => (
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
            </div>
          )}
        </div>

        {/* Right Column: Today's Agenda & Madrasah Events (1 span) */}
        <div className="space-y-6">
          {/* Madrasah Upcoming Events */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> Agenda Madrasah Terdekat
              </h3>
              <Link
                to="/guru/calendar"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Kalender →
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingEvents.map(evt => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md text-white"
                      style={{ backgroundColor: evt.color || '#10b981' }}
                    >
                      {evt.type}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(evt.startDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <h5 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {evt.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{evt.location || 'MI Syuriyah'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links to Document Sub-Modules */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">
              Koleksi & Modul Dokumen
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/guru/documents/learning"
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/40 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors block text-center"
              >
                📘 Pembelajaran
              </Link>
              <Link
                to="/guru/documents/assessment"
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/40 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors block text-center"
              >
                📊 Penilaian
              </Link>
              <Link
                to="/guru/documents/class"
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/40 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors block text-center"
              >
                🏫 Dokumen Kelas
              </Link>
              <Link
                to="/guru/documents/letters"
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/40 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors block text-center"
              >
                ✉️ Surat Resmi
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onSuccess={() => fetchDashboardData()}
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
        onUpdated={() => fetchDashboardData()}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onDuplicate={handleDuplicate}
      />

      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSaved={() => fetchDashboardData()}
        currentUser={{ uid: userProfile!.uid, name: userProfile!.name }}
      />
    </div>
  );
};

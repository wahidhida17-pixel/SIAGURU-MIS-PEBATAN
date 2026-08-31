import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  FilePlus,
  Plus,
  Loader2
} from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar';
import { calendarService } from '../../services/calendarService';
import { documentService } from '../../services/documentService';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  currentUser?: { uid: string; name?: string; role?: string; [key: string]: any };
  onEdit?: (event: CalendarEvent) => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUser,
  onEdit,
  onDeleted,
  onUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'report' | 'notulen'>('detail');

  // Report fields
  const [reportType, setReportType] = useState<'laporan' | 'notulen' | 'presensi'>('notulen');
  const [reportResults, setReportResults] = useState('');
  const [reportDecisions, setReportDecisions] = useState('');
  const [reportFollowUp, setReportFollowUp] = useState('');
  const [attendeesText, setAttendeesText] = useState('');
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (event) {
      setActiveTab('detail');
      setReportType(event.reportData?.type || (event.type === 'Rapat' ? 'notulen' : 'laporan'));
      setReportResults(event.reportData?.results || '');
      setReportDecisions(event.reportData?.decisions || '');
      setReportFollowUp(event.reportData?.followUp || '');
      setAttendeesText((event.reportData?.attendees || []).join(', '));
      setSaveSuccess(false);
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const canManage = currentUser.role === 'admin';

  const handleDelete = async () => {
    if (window.confirm(`Hapus agenda kegiatan "${event.title}" dari kalender?`)) {
      await calendarService.deleteEvent(event.id!, currentUser);
      onClose();
      if (onDeleted) onDeleted();
    }
  };

  const handleSaveReport = async () => {
    try {
      setIsSavingReport(true);
      const attendees = attendeesText
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      await calendarService.saveEventReport(
        event.id!,
        {
          type: reportType,
          results: reportResults,
          decisions: reportDecisions,
          followUp: reportFollowUp,
          attendees
        },
        currentUser
      );

      // Also create an official document in documents collection so it's archived
      await documentService.createDocument(
        {
          ownerId: currentUser?.uid || 'admin',
          ownerName: currentUser?.name || currentUser?.displayName || 'Administrator',
          ownerRole: currentUser?.role === 'admin' ? 'admin' : 'guru',
          title: `${reportType === 'notulen' ? 'Notulen Rapat' : 'Laporan Kegiatan'}: ${event.title}`,
          description: `Catatan resmi hasil kegiatan ${event.title} tanggal ${event.startDate}. Keputusan: ${reportDecisions}`,
          category: reportType === 'notulen' ? 'Rapat' : 'Kegiatan',
          fileName: `${reportType}_${event.startDate}_${event.title.replace(/\s+/g, '_')}.pdf`,
          fileType: 'pdf',
          fileSize: 24000,
          storagePath: '',
          downloadUrl: '',
          academicYear: event.academicYear,
          semester: event.semester,
          tags: [reportType, 'kegiatan', event.type.toLowerCase().replace(/\s+/g, '_')],
          isFavorite: false,
          visibility: 'school'
        },
        undefined,
        currentUser
      );

      setSaveSuccess(true);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan laporan kegiatan.');
    } finally {
      setIsSavingReport(false);
    }
  };

  const startFormatted = new Date(event.startDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col my-8">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
              style={{ backgroundColor: event.color || '#10b981' }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full text-white mb-0.5" style={{ backgroundColor: event.color || '#10b981' }}>
                {event.type}
              </span>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                {event.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex gap-4 text-xs font-medium text-slate-500 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('detail')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'detail'
                ? 'border-emerald-600 text-emerald-600 font-semibold dark:text-emerald-400'
                : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Rincian Agenda
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'border-emerald-600 text-emerald-600 font-semibold dark:text-emerald-400'
                : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Notulen & Laporan Kegiatan
            {event.reportData && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'detail' && (
            <div className="space-y-5">
              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {startFormatted} {event.startDate !== event.endDate ? `s.d. ${event.endDate}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Waktu:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {event.startTime || '08:00'} - {event.endTime || 'Selesai'} WIB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tempat / Lokasi:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {event.location || 'MI Syuriyah Pebatan'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Target Peserta:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {event.targetAudience}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                  Keterangan & Rincian Agenda:
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-line leading-relaxed">
                  {event.description || 'Tidak ada catatan keterangan tambahan.'}
                </p>
              </div>

              {/* Status summary */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <span>Tahun Pelajaran: <strong>{event.academicYear} ({event.semester})</strong></span>
                <span>Dibuat oleh: <strong>{event.createdByName}</strong></span>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Laporan / Notulen berhasil disimpan dan diarsipkan ke Dokumen Administrasi!
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Format Laporan:
                </label>
                <select
                  value={reportType}
                  onChange={e => setReportType(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="notulen">Notulen Rapat Resmi</option>
                  <option value="laporan">Laporan Pelaksanaan Kegiatan</option>
                  <option value="presensi">Daftar Kehadiran Peserta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daftar Peserta Hadir (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={attendeesText}
                  onChange={e => setAttendeesText(e.target.value)}
                  placeholder="Contoh: Kepala Madrasah, Abdul Khanan, Siti Fatimah, Wali Murid Kelas 4"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {reportType === 'notulen' ? 'Pokok Pembahasan / Jalannya Acara' : 'Pelaksanaan Kegiatan & Hasil yang Dicapai'}
                </label>
                <textarea
                  rows={3}
                  value={reportResults}
                  onChange={e => setReportResults(e.target.value)}
                  placeholder="Ringkasan poin-poin yang dibahas atau hasil pelaksanaan kegiatan..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keputusan Musyawarah / Kesimpulan
                </label>
                <textarea
                  rows={2}
                  value={reportDecisions}
                  onChange={e => setReportDecisions(e.target.value)}
                  placeholder="Keputusan resmi yang disepakati bersama..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rencana Tindak Lanjut (RTL) & Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={reportFollowUp}
                  onChange={e => setReportFollowUp(e.target.value)}
                  placeholder="Langkah tindak lanjut berikutnya..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveReport}
                  disabled={isSavingReport}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-xs transition-colors"
                >
                  {isSavingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Laporan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan & Arsipkan ke Dokumen
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {canManage && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Agenda
              </button>
            )}
            {canManage && (
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

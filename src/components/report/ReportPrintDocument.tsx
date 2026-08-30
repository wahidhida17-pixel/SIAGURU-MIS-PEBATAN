import React, { useRef } from 'react';
import { Printer, Download, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Report } from '../../types/report';
import type { GeneralSettings } from '../../types/academic';

interface ReportPrintDocumentProps {
  report: Report;
  schoolSettings?: GeneralSettings | null;
  onBack?: () => void;
}

export const ReportPrintDocument: React.FC<ReportPrintDocumentProps> = ({
  report,
  schoolSettings,
  onBack
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      setDownloading(true);
      const element = printRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (report.studentName || 'Siswa').replace(/[^a-zA-Z0-9]/g, '_');
      const safeClass = (report.className || 'Kelas').replace(/[^a-zA-Z0-9]/g, '_');
      const safeYear = (report.academicYear || 'TA').replace('/', '-');
      const filename = `Rapor_${safeName}_${safeClass}_${safeYear}_${report.semester}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal mengekspor PDF. Anda dapat menggunakan tombol Cetak lalu pilih "Save as PDF".');
    } finally {
      setDownloading(false);
    }
  };

  const school = schoolSettings || {
    schoolName: 'MI SYURIYAH PEBATAN',
    schoolLevel: 'Madrasah Ibtidaiyah',
    nsm: '111233290001',
    npsn: '60712345',
    address: 'Jl. KH. Syuriyah No. 12, Pebatan, Kec. Pusakajaya, Kab. Subang',
    principalName: "H. AHMAD SYAFI'I, S.Pd.I",
    principalNip: '197505122005011003'
  };

  // Group subjects by category if needed
  const subjects = report.subjects || [];
  const agamaSubjects = subjects.filter(s => 
    s.category === 'Agama' || 
    ['Al-Qur\'an Hadits', 'Akidah Akhlak', 'Fikih', 'Sejarah Kebudayaan Islam', 'SKI', 'Bahasa Arab', 'BTA', 'Tahassus'].some(k => s.subjectName.toLowerCase().includes(k.toLowerCase()))
  );
  const umumSubjects = subjects.filter(s => !agamaSubjects.some(as => as.subjectId === s.subjectId));

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-slate-900">Pratinjau Rapor Peserta Didik</h2>
            <p className="text-xs text-slate-500">
              {report.studentName} ({report.studentNis}) - Kelas {report.className} - {report.academicYear} {report.semester}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Status: {report.status} {report.isLocked ? '(Terkunci)' : ''}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak (A4)
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-[#064E3B] hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Memproses PDF...' : 'Unduh PDF'}
          </button>
        </div>
      </div>

      {/* Printable Sheet Container (Styled for A4 print) */}
      <div className="bg-slate-100 p-4 md:p-8 rounded-xl flex justify-center overflow-x-auto">
        <div
          ref={printRef}
          id="printable-rapor"
          className="print-container bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[15mm] shadow-md print:shadow-none print:w-full print:p-0 print:m-0 box-border text-[11pt] leading-normal font-serif"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* Header Kop Madrasah */}
          <div className="border-b-2 border-black pb-3 mb-4 text-center relative">
            <div className="flex items-center justify-between gap-3">
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                <img 
                  src="/logo.svg" 
                  alt="Logo MI Syuriyah" 
                  className="w-16 h-16 object-contain rounded-full" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 px-2 text-center">
                <h3 className="text-sm font-bold uppercase tracking-wider">KEMENTERIAN AGAMA REPUBLIK INDONESIA</h3>
                <h2 className="text-base font-bold uppercase">{school.schoolName || 'MI SYURIYAH PEBATAN'}</h2>
                <p className="text-xs italic">
                  NSM: {school.nsm || '111233290001'} | NPSN: {school.npsn || '60712345'}
                </p>
                <p className="text-[10px] leading-tight mt-0.5">
                  {school.address || 'Jl. KH. Syuriyah No. 12, Pebatan, Kec. Pusakajaya, Kab. Subang'}
                </p>
              </div>
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                <img 
                  src="/logo.svg" 
                  alt="Logo MI Syuriyah" 
                  className="w-16 h-16 object-contain rounded-full opacity-90" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="border-t border-black mt-2 pt-1 text-center font-bold tracking-widest text-sm uppercase">
              LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR)
            </div>
          </div>

          {/* Identitas Peserta Didik */}
          <div className="mb-4 text-xs">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="flex">
                <span className="w-36 font-semibold">Nama Peserta Didik</span>
                <span className="w-3">:</span>
                <span className="font-bold uppercase flex-1">{report.studentName}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold">Kelas</span>
                <span className="w-3">:</span>
                <span className="flex-1">{report.className}</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold">NIS / NISN</span>
                <span className="w-3">:</span>
                <span className="flex-1">{report.studentNis} / {report.studentNisn || '-'}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold">Fase</span>
                <span className="w-3">:</span>
                <span className="flex-1">
                  {report.className.includes('1') || report.className.includes('2') ? 'A' :
                   report.className.includes('3') || report.className.includes('4') ? 'B' : 'C'}
                </span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold">Nama Madrasah</span>
                <span className="w-3">:</span>
                <span className="flex-1">{school.schoolName}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold">Semester</span>
                <span className="w-3">:</span>
                <span className="flex-1">{report.semester}</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold">Alamat Madrasah</span>
                <span className="w-3">:</span>
                <span className="flex-1 truncate">{school.address}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold">Tahun Pelajaran</span>
                <span className="w-3">:</span>
                <span className="flex-1">{report.academicYear}</span>
              </div>
            </div>
          </div>

          {/* A. Capaian Hasil Belajar (Tabel Nilai & Deskripsi) */}
          <div className="mb-4">
            <h4 className="font-bold text-xs uppercase mb-1.5">A. NILAI DAN CAPAIAN PEMBELAJARAN</h4>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200">
                  <th className="border border-black p-1.5 w-8 text-center font-bold">No</th>
                  <th className="border border-black p-1.5 w-44 text-left font-bold">Mata Pelajaran</th>
                  <th className="border border-black p-1.5 w-14 text-center font-bold">Nilai Akhir</th>
                  <th className="border border-black p-1.5 text-left font-bold">Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                {/* Kelompok Mapel Agama */}
                {agamaSubjects.length > 0 && (
                  <>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={4} className="border border-black p-1 pl-2 text-[11px] uppercase bg-slate-100 print:bg-slate-200">
                        Kelompok Mata Pelajaran Agama Islam
                      </td>
                    </tr>
                    {agamaSubjects.map((sub, idx) => (
                      <tr key={sub.subjectId}>
                        <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-black p-1.5 font-medium">{sub.subjectName}</td>
                        <td className="border border-black p-1.5 text-center font-bold">{sub.finalScore > 0 ? sub.finalScore : '-'}</td>
                        <td className="border border-black p-1.5 text-[10.5px] leading-snug">{sub.description}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Kelompok Mapel Umum */}
                {umumSubjects.length > 0 && (
                  <>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={4} className="border border-black p-1 pl-2 text-[11px] uppercase bg-slate-100 print:bg-slate-200">
                        Kelompok Mata Pelajaran Umum & Muatan Lokal
                      </td>
                    </tr>
                    {umumSubjects.map((sub, idx) => (
                      <tr key={sub.subjectId}>
                        <td className="border border-black p-1.5 text-center">{agamaSubjects.length + idx + 1}</td>
                        <td className="border border-black p-1.5 font-medium">{sub.subjectName}</td>
                        <td className="border border-black p-1.5 text-center font-bold">{sub.finalScore > 0 ? sub.finalScore : '-'}</td>
                        <td className="border border-black p-1.5 text-[10.5px] leading-snug">{sub.description}</td>
                      </tr>
                    ))}
                  </>
                )}

                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="border border-black p-3 text-center italic text-slate-500">
                      Belum ada data mata pelajaran untuk periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* B. Ekstrakurikuler */}
          <div className="mb-4">
            <h4 className="font-bold text-xs uppercase mb-1.5">B. EKSTRAKURIKULER</h4>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200">
                  <th className="border border-black p-1 w-8 text-center font-bold">No</th>
                  <th className="border border-black p-1 w-44 text-left font-bold">Kegiatan Ekstrakurikuler</th>
                  <th className="border border-black p-1 w-24 text-center font-bold">Predikat</th>
                  <th className="border border-black p-1 text-left font-bold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {(report.extracurriculars || []).length > 0 ? (
                  report.extracurriculars.map((ekskul, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-1 text-center">{idx + 1}</td>
                      <td className="border border-black p-1 font-medium">{ekskul.activity}</td>
                      <td className="border border-black p-1 text-center">{ekskul.result}</td>
                      <td className="border border-black p-1 text-[10.5px] leading-snug">{ekskul.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-black p-1.5 text-center italic text-slate-500">
                      -
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* C. Prestasi Siswa (jika ada) */}
          {(report.achievements || []).length > 0 && (
            <div className="mb-4">
              <h4 className="font-bold text-xs uppercase mb-1.5">C. PRESTASI SISWA</h4>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200">
                    <th className="border border-black p-1 w-8 text-center font-bold">No</th>
                    <th className="border border-black p-1 text-left font-bold">Jenis Prestasi</th>
                    <th className="border border-black p-1 w-28 text-center font-bold">Tingkat</th>
                    <th className="border border-black p-1 text-left font-bold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {report.achievements.map((ach, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-1 text-center">{idx + 1}</td>
                      <td className="border border-black p-1 font-medium">{ach.name}</td>
                      <td className="border border-black p-1 text-center">{ach.level}</td>
                      <td className="border border-black p-1 text-[10.5px]">{ach.description || ach.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Grid D. Kehadiran & E. Catatan Wali Kelas */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* D. Ketidakhadiran */}
            <div className="col-span-1">
              <h4 className="font-bold text-xs uppercase mb-1.5">D. KETIDAKHADIRAN</h4>
              <table className="w-full border-collapse border border-black text-xs">
                <tbody>
                  <tr>
                    <td className="border border-black p-1 font-medium">Sakit</td>
                    <td className="border border-black p-1 text-center w-16">{report.attendance?.sakit ?? 0} hari</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-medium">Izin</td>
                    <td className="border border-black p-1 text-center w-16">{report.attendance?.izin ?? 0} hari</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-medium">Tanpa Keterangan</td>
                    <td className="border border-black p-1 text-center w-16">{report.attendance?.alpa ?? 0} hari</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* E. Catatan Wali Kelas */}
            <div className="col-span-2">
              <h4 className="font-bold text-xs uppercase mb-1.5">E. CATATAN WALI KELAS</h4>
              <div className="border border-black p-2 min-h-[68px] text-xs leading-relaxed italic bg-slate-50/50">
                "{report.homeroomNote || 'Tingkatkan terus motivasi belajar dan pertahankan prestasi yang telah diraih.'}"
              </div>
            </div>
          </div>

          {/* Keterangan Kenaikan Kelas (Khusus Semester Genap / Akhir Tahun) */}
          {(report.semester === 'Genap' || report.promotionStatus?.decision) && (
            <div className="border border-black p-2 mb-4 text-xs">
              <div className="font-bold uppercase mb-0.5">Keputusan Kenaikan Kelas / Kelulusan:</div>
              <div className="pl-2">
                Berdasarkan pencapaian seluruh kompetensi, peserta didik dinyatakan:{' '}
                <span className="font-bold uppercase underline">
                  {report.promotionStatus?.decision ||
                    (report.promotionStatus?.status === 'Direkomendasikan naik'
                      ? `NAIK KE KELAS BERIKUTNYA`
                      : 'DITENTUKAN SEKOLAH')}
                </span>
                {report.promotionStatus?.nextClassName && (
                  <span className="font-bold"> ({report.promotionStatus.nextClassName})</span>
                )}
              </div>
            </div>
          )}

          {/* Titimangsa & Tanda Tangan */}
          <div className="pt-2 text-xs">
            <div className="flex justify-between items-start mb-16">
              <div className="w-56 text-center">
                <p className="mb-1">Mengetahui,</p>
                <p className="font-medium">Orang Tua / Wali Siswa</p>
              </div>

              <div className="w-56 text-center">
                <p className="mb-1">Pebatan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-medium">Wali Kelas,</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="w-56 text-center">
                <p className="border-b border-black font-bold pt-10 uppercase">( ......................................... )</p>
              </div>

              <div className="w-56 text-center">
                <p className="border-b border-black font-bold pt-10 uppercase">
                  {report.homeroomTeacherName || 'WALI KELAS'}
                </p>
              </div>
            </div>

            {/* Kepala Madrasah (Tengah Bawah) */}
            <div className="text-center mt-6">
              <p className="mb-1">Mengetahui,</p>
              <p className="font-medium">Kepala Madrasah</p>
              <div className="h-16 flex items-center justify-center">
                {/* Space for stamp/signature */}
              </div>
              <p className="font-bold uppercase underline inline-block">
                {school.principalName || "H. AHMAD SYAFI'I, S.Pd.I"}
              </p>
              <p className="text-[10px]">NIP. {school.principalNip || '197505122005011003'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

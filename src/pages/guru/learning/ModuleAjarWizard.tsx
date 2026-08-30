import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  FileText, CheckCircle2, ChevronRight, ChevronLeft, Save, ArrowLeft, 
  Sparkles, Layers, BookOpen, Clock, Target, HelpCircle, UserCheck, AlertCircle, Printer, Download
} from 'lucide-react';
import { learningService } from '../../../services/learningService';
import { settingsService } from '../../../services/settingsService';
import { auditService } from '../../../services/auditService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { useAuth } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { DocumentHeader } from '../../../components/learning/DocumentHeader';
import { DocumentSignature } from '../../../components/learning/DocumentSignature';
import { exportElementToPDF, sanitizeFileName } from '../../../utils/documentPdfUtils';
import type { ModuleAjar, LearningObjective, ATP, DocStatus } from '../../../types/learning';
import type { GeneralSettings } from '../../../types/academic';

const WIZARD_STEPS = [
  { id: 1, title: 'Identitas Modul', desc: 'Informasi dasar & kelas' },
  { id: 2, title: 'Informasi Umum', desc: 'Target siswa, sarana & P5-PPRA' },
  { id: 3, title: 'Komponen Inti', desc: 'CP, TP, Pemahaman & Pemantik' },
  { id: 4, title: 'Kegiatan Pembelajaran', desc: 'Pendahuluan, Inti & Penutup' },
  { id: 5, title: 'Asesmen & Rubrik', desc: 'Formatif & Sumatif' },
  { id: 6, title: 'Pengayaan & Refleksi', desc: 'Remedial & Refleksi Guru' },
  { id: 7, title: 'Pratinjau & Finalisasi', desc: 'Simpan, Cetak & Download PDF' }
];

const TEMPLATES = [
  { id: 'lengkap', name: 'Format Lengkap Standar Kemenag', desc: 'Struktur komprehensif dengan rincian kegiatan lengkap & rubrik mendalam.' },
  { id: 'ringkas', name: 'Format Ringkas (1-2 Halaman)', desc: 'Format esensial padat dan praktis untuk kebutuhan dinas harian.' },
  { id: 'madrasah', name: 'Format Karakter Madrasah (P5-PPRA)', desc: 'Integrasi nilai keteladanan, akhlakul karimah dan muwatanah.' }
];

export const ModuleAjarWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get('duplicate');

  const { userProfile } = useAuth();
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [currentStep, setCurrentStep] = useState(1);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [availableTps, setAvailableTps] = useState<LearningObjective[]>([]);
  const [availableAtps, setAvailableAtps] = useState<ATP[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null);

  // Module Form State
  const [selectedTemplate, setSelectedTemplate] = useState('madrasah');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState('Fase B (Kelas 4)');
  const [duration, setDuration] = useState('2 JP x 35 Menit (1 Pertemuan)');
  const [initialCompetence, setInitialCompetence] = useState('Peserta didik telah mampu membaca huruf Hijaiyah berharakat.');
  const [facilities, setFacilities] = useState('Musholla/Kelas, LCD Proyektor, Mushaf Al-Qur\'an, Kartu Ayat, Speaker');
  const [targetStudents, setTargetStudents] = useState('Peserta didik reguler / tipikal (28 Siswa)');
  const [learningModel, setLearningModel] = useState('Tatap Muka / Problem Based Learning (PBL) & Demonstrasi');
  const [methods, setMethods] = useState<string[]>(['Talaqqi', 'Tanya Jawab', 'Drill & Praktik', 'Diskusi Kelompok']);
  const [p5ppra, setP5ppra] = useState<string[]>([
    'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
    'Keteladanan (Qudwah)',
    'Gotong Royong (Ta\'awun)'
  ]);

  // Core
  const [cpText, setCpText] = useState('');
  const [tpText, setTpText] = useState('');
  const [material, setMaterial] = useState('');
  const [meaningfulUnderstanding, setMeaningfulUnderstanding] = useState('Membaca Al-Qur\'an dengan tartil merupakan wujud kecintaan kepada kalam Allah SWT dan membimbing akhlak keseharian.');
  const [triggerQuestions, setTriggerQuestions] = useState('1. Siapa yang setiap hari membaca Al-Qur\'an di rumah?\n2. Mengapa kita harus membaca ayat Al-Qur\'an dengan tajwid yang benar?');
  
  // Activities
  const [openingActivity, setOpeningActivity] = useState('1. Guru mengucap salam, membaca basmalah, dan berdoa bersama dipimpin ketua kelas.\n2. Guru mengecek kehadiran siswa dan kesiapan ruang belajar.\n3. Apersepsi: Guru mengaitkan materi sebelumnya dengan materi hari ini.\n4. Guru menyampaikan tujuan pembelajaran dan motivasi.');
  const [coreActivity, setCoreActivity] = useState('1. Tahap Stimulasi: Guru menampilkan tayangan/murottal bacaan surah pilihan.\n2. Tahap Talaqqi: Guru mencontohkan pelafalan ayat per ayat, siswa menyimak dan menirukan secara serentak.\n3. Tahap Kerja Kelompok: Siswa dibagi dalam kelompok kecil untuk saling menyimak bacaan teman (Peer Tutoring).\n4. Tahap Verifikasi: Guru berkeliling memberikan bimbingan makharijul huruf bagi yang membutuhkan.\n5. Presentasi: Perwakilan kelompok melafalkan ayat di depan kelas dengan tartil.');
  const [closingActivity, setClosingActivity] = useState('1. Guru bersama siswa menyimpulkan inti pembelajaran hari ini.\n2. Guru melakukan refleksi singkat bersama peserta didik.\n3. Guru memberikan tugas pembiasaan tilawah di rumah.\n4. Kelas ditutup dengan doa kafaratul majlis dan salam.');

  // Assessment & Reflection
  const [assessment, setAssessment] = useState('1. Asesmen Diagnostik: Tanya jawab awal tentang kemampuan membaca ayat.\n2. Asesmen Formatif: Observasi keaktifan & unjuk kerja melafalkan ayat dengan rubrik makhraj.\n3. Asesmen Sumatif: Tes lisan hafalan ayat dan tes tulis pemahaman makna.');
  const [enrichment, setEnrichment] = useState('Peserta didik yang telah mencapai ketuntasan diberikan tantangan menghafal ayat beserta terjemahan dan tajwid mendalam.');
  const [remediation, setRemediation] = useState('Peserta didik yang belum lancar diberikan bimbingan privat membaca per kata bersama guru atau tutor sebaya.');
  const [teacherReflection, setTeacherReflection] = useState('Apakah seluruh siswa aktif dalam kegiatan talaqqi? Strategi apa yang perlu ditingkatkan pada pertemuan berikutnya?');
  const [studentReflection, setStudentReflection] = useState('Bagian mana dari pelajaran ini yang paling kamu senangi? Apakah kamu sudah bisa melafalkan ayat dengan lancar?');
  const [status, setStatus] = useState<DocStatus>('draft');

  useEffect(() => {
    loadInitialData();
  }, [teacherId, id, duplicateFrom]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [fetchedSettings, fetchedTps, fetchedAtps] = await Promise.all([
        settingsService.getGeneralSettings(),
        learningService.getLearningObjectives({ teacherId, academicYear, semester }),
        learningService.getATPs({ teacherId, academicYear, semester })
      ]);

      setSettings(fetchedSettings);
      setAvailableTps(fetchedTps);
      setAvailableAtps(fetchedAtps);

      const targetId = id || duplicateFrom;
      if (targetId) {
        const mod = await learningService.getModuleById(targetId);
        if (mod) {
          setSubjectId(mod.subjectId);
          setClassId(mod.classId || '');
          setTitle(id ? mod.title : `${mod.title} (Salinan)`);
          setPhase(mod.phase || 'Fase B (Kelas 4)');
          setDuration(mod.duration || '2 JP x 35 Menit');
          setInitialCompetence(mod.initialCompetence || '');
          setFacilities(mod.facilities || '');
          setTargetStudents(mod.targetStudents || '');
          setLearningModel(mod.learningModel || '');
          setMethods(mod.methods || []);
          setP5ppra(mod.p5ppra || []);
          setCpText(mod.cpText || '');
          setTpText(mod.tpText || '');
          setMaterial(mod.material || '');
          setMeaningfulUnderstanding(mod.meaningfulUnderstanding || '');
          setTriggerQuestions(mod.triggerQuestions || '');
          setOpeningActivity(mod.openingActivity || '');
          setCoreActivity(mod.coreActivity || '');
          setClosingActivity(mod.closingActivity || '');
          setAssessment(mod.assessment || '');
          setEnrichment(mod.enrichment || '');
          setRemediation(mod.remediation || '');
          setTeacherReflection(mod.teacherReflection || '');
          setStudentReflection(mod.studentReflection || '');
          setStatus(id ? mod.status : 'draft');
        }
      } else {
        // Defaults
        const firstSub = subjects[0]?.id || '';
        setSubjectId(firstSub);
        setClassId(classes[0]?.id || '');
        setTitle('Modul Ajar: Membaca dan Menghafal Surah Al-Adiyat');
        setMaterial('Kandungan dan Hukum Tajwid Surah Al-Adiyat');
      }
    } catch (err) {
      console.error('Error loading module wizard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to import TP into Module
  const handleSelectTP = (tp: LearningObjective) => {
    setTpText(tp.title);
    setMaterial(tp.description || tp.title);
    setTitle(`Modul Ajar: ${tp.title}`);
  };

  const handleSave = async (finalStatus: DocStatus = status) => {
    if (!subjectId) {
      alert('Pilih mata pelajaran.');
      return;
    }
    if (!classId) {
      alert('Pilih kelas sasaran.');
      return;
    }
    if (!title.trim()) {
      alert('Judul modul ajar wajib diisi.');
      return;
    }

    const selectedSubject = subjects.find(s => s.id === subjectId);
    const selectedClass = classes.find(c => c.id === classId);

    setIsSaving(true);
    try {
      const payload: Omit<ModuleAjar, 'id' | 'createdAt' | 'updatedAt'> = {
        teacherId,
        teacherName: teacherName || userProfile?.displayName || 'Guru Pengampu',
        subjectId,
        subjectName: selectedSubject?.name || 'Mata Pelajaran',
        classId,
        className: selectedClass?.name || 'Kelas',
        academicYear,
        semester,
        title,
        phase,
        duration,
        initialCompetence,
        facilities,
        targetStudents,
        learningModel,
        methods,
        p5ppra,
        cpText,
        tpText,
        material,
        meaningfulUnderstanding,
        triggerQuestions,
        openingActivity,
        coreActivity,
        closingActivity,
        assessment,
        enrichment,
        remediation,
        teacherReflection,
        studentReflection,
        status: finalStatus,
        version: 1
      };

      if (id) {
        await learningService.updateModule(id, payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'UPDATE',
          'MODUL_AJAR',
          id,
          `Mengubah Modul Ajar: ${payload.title}`
        );
      } else {
        const newId = await learningService.createModule(payload);
        await auditService.log(
          userProfile?.uid || '',
          userProfile?.displayName || 'Guru',
          'CREATE',
          'MODUL_AJAR',
          newId,
          `Membuat Modul Ajar: ${payload.title}`
        );
      }

      setLastAutosaved(new Date().toLocaleTimeString('id-ID'));
      if (finalStatus === 'completed') {
        alert('Modul Ajar berhasil disimpan sebagai FINAL!');
        navigate('/guru/learning/modules');
      }
    } catch (err) {
      console.error('Error saving module:', err);
      alert('Gagal menyimpan Modul Ajar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const selectedSubject = subjects.find(s => s.id === subjectId);
    const selectedClass = classes.find(c => c.id === classId);
    const fileName = `Modul_Ajar_${selectedSubject?.name || 'Mapel'}_Kelas_${selectedClass?.name || '4'}_${academicYear.replace('/', '-')}`;
    await exportElementToPDF('module-print-area', fileName, 'portrait');
  };

  if (loading || assignLoading) {
    return (
      <div className="flex justify-center p-16">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedSubject = subjects.find(s => s.id === subjectId);
  const selectedClass = classes.find(c => c.id === classId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/guru/learning/modules')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Modul</span>
        </button>

        <div className="flex items-center gap-2">
          {lastAutosaved && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Tersimpan otomatis: {lastAutosaved}
            </span>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Draft</span>
          </button>
          <button
            onClick={() => handleSave('completed')}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalisasi Modul</span>
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] gap-2">
          {WIZARD_STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex-1 flex items-center gap-2 p-2 rounded-xl transition-all text-left ${
                  isCurrent 
                    ? 'bg-emerald-50 border border-emerald-300' 
                    : isCompleted 
                    ? 'bg-slate-50 hover:bg-slate-100' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCurrent 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : isCompleted 
                    ? 'bg-emerald-200 text-emerald-900' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <div className="truncate">
                  <p className={`text-xs font-bold truncate ${isCurrent ? 'text-emerald-900' : 'text-slate-700'}`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{step.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: IDENTITAS MODUL */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Langkah 1: Identitas Modul Ajar</h3>
            <p className="text-xs text-slate-500">Tentukan mata pelajaran, kelas sasaran, fase, dan judul pokok modul.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran *</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Sasaran *</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>Kelas {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Topik Modul Ajar *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Modul Ajar: Membaca dan Menghafal Surah Al-Adiyat"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fase Kurikulum</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              >
                <option value="Fase A (Kelas 1 - 2)">Fase A (Kelas 1 - 2)</option>
                <option value="Fase B (Kelas 3 - 4)">Fase B (Kelas 3 - 4)</option>
                <option value="Fase C (Kelas 5 - 6)">Fase C (Kelas 5 - 6)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alokasi Waktu Pertemuan</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Contoh: 2 JP x 35 Menit (1 Pertemuan)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Quick Select TP from ATP */}
          {availableTps.length > 0 && (
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-800" />
                <h4 className="text-xs font-bold text-emerald-950">Ambil Rumusan Langsung dari Tujuan Pembelajaran (TP):</h4>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTps.filter(t => t.subjectId === subjectId).map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => handleSelectTP(tp)}
                    className="text-[11px] bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold hover:bg-emerald-700 hover:text-white transition-colors"
                  >
                    <strong>{tp.code}:</strong> {tp.title.slice(0, 45)}...
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: INFORMASI UMUM */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Langkah 2: Informasi Umum & Profil Pelajar</h3>
            <p className="text-xs text-slate-500">Tentukan kompetensi awal, sarana prasarana, model pembelajaran, dan dimensi P5-PPRA.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kompetensi Awal Peserta Didik</label>
            <textarea
              rows={2}
              value={initialCompetence}
              onChange={(e) => setInitialCompetence(e.target.value)}
              placeholder="Kemampuan prasyarat yang telah dimiliki peserta didik..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sarana dan Prasarana</label>
              <textarea
                rows={2}
                value={facilities}
                onChange={(e) => setFacilities(e.target.value)}
                placeholder="Musholla, LCD, Mushaf Al-Qur'an, speaker..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Peserta Didik</label>
              <input
                type="text"
                value={targetStudents}
                onChange={(e) => setTargetStudents(e.target.value)}
                placeholder="Peserta didik reguler / tipikal (28 siswa)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model & Pendekatan Pembelajaran</label>
              <input
                type="text"
                value={learningModel}
                onChange={(e) => setLearningModel(e.target.value)}
                placeholder="Problem Based Learning, Talaqqi, Demonstrasi..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Profil Pelajar (P5-PPRA)</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Beriman & Bertakwa', 'Keteladanan (Qudwah)', 'Gotong Royong', 'Mandiri', 'Bernalar Kritis'].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      if (p5ppra.includes(p)) {
                        setP5ppra(p5ppra.filter(x => x !== p));
                      } else {
                        setP5ppra([...p5ppra, p]);
                      }
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-colors ${
                      p5ppra.includes(p)
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {p5ppra.includes(p) ? `✓ ${p}` : `+ ${p}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: KOMPONEN INTI */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Langkah 3: Komponen Inti & Pemantik</h3>
            <p className="text-xs text-slate-500">Rumusan Capaian, Tujuan, Pemahaman Bermakna, dan Pertanyaan Pemantik.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan Pembelajaran (TP) *</label>
            <textarea
              rows={3}
              value={tpText}
              onChange={(e) => setTpText(e.target.value)}
              placeholder="Peserta didik mampu melafalkan dan menghafalkan surah..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lingkup Materi Pokok</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Hukum Bacaan Nun Sukun dan Surat Pilihan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pemahaman Bermakna</label>
            <textarea
              rows={2}
              value={meaningfulUnderstanding}
              onChange={(e) => setMeaningfulUnderstanding(e.target.value)}
              placeholder="Manfaat yang didapat siswa setelah mempelajari materi ini dalam kehidupan sehari-hari..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pertanyaan Pemantik</label>
            <textarea
              rows={2}
              value={triggerQuestions}
              onChange={(e) => setTriggerQuestions(e.target.value)}
              placeholder="Pertanyaan pemicu rasa ingin tahu dan diskusi siswa..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
            />
          </div>
        </div>
      )}

      {/* STEP 4: KEGIATAN PEMBELAJARAN */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Langkah 4: Skenario Kegiatan Pembelajaran</h3>
            <p className="text-xs text-slate-500">Rincian aktivitas pendahuluan, kegiatan inti, dan penutup.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              A. Kegiatan Pendahuluan (10 - 15 Menit)
            </label>
            <textarea
              rows={3}
              value={openingActivity}
              onChange={(e) => setOpeningActivity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 leading-relaxed font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              B. Kegiatan Inti (45 - 50 Menit)
            </label>
            <textarea
              rows={6}
              value={coreActivity}
              onChange={(e) => setCoreActivity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 leading-relaxed font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              C. Kegiatan Penutup (10 Menit)
            </label>
            <textarea
              rows={3}
              value={closingActivity}
              onChange={(e) => setClosingActivity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 leading-relaxed font-sans"
            />
          </div>
        </div>
      )}

      {/* STEP 5: ASESMEN & PENILAIAN */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Langkah 5: Asesmen & Rubrik Penilaian</h3>
            <p className="text-xs text-slate-500">Asesmen diagnostik, formatif proses, dan sumatif lingkup materi.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Asesmen & Instrumen</label>
            <textarea
              rows={5}
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Asesmen formatif unjuk kerja, rubrik penilaian, lembar observasi..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600 leading-relaxed"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-800">Contoh Rubrik Penilaian Unjuk Kerja Tartil Al-Qur'an:</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="font-bold text-emerald-800">Sangat Mahir (4):</span>
                <p className="mt-0.5 text-[11px]">Makhraj dan tajwid sempurna, lancar tanpa bimbingan.</p>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="font-bold text-blue-800">Mahir (3):</span>
                <p className="mt-0.5 text-[11px]">Lancar, terdapat 1-2 kekeliruan kecil pada panjang pendek.</p>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="font-bold text-amber-800">Perlu Bimbingan (2/1):</span>
                <p className="mt-0.5 text-[11px]">Memerlukan tuntunan bertahap dari guru/tutor sebaya.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: PENGAYAAN & REFLEKSI */}
      {currentStep === 6 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Langkah 6: Pengayaan, Remedial & Refleksi</h3>
            <p className="text-xs text-slate-500">Tindak lanjut pembelajaran dan lembar refleksi guru & siswa.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kegiatan Pengayaan</label>
              <textarea
                rows={3}
                value={enrichment}
                onChange={(e) => setEnrichment(e.target.value)}
                placeholder="Kegiatan untuk peserta didik yang telah mencapai tujuan..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kegiatan Remedial</label>
              <textarea
                rows={3}
                value={remediation}
                onChange={(e) => setRemediation(e.target.value)}
                placeholder="Bimbingan khusus bagi peserta didik yang belum tuntas..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Refleksi Pendidik (Guru)</label>
              <textarea
                rows={3}
                value={teacherReflection}
                onChange={(e) => setTeacherReflection(e.target.value)}
                placeholder="Evaluasi proses pembelajaran oleh guru..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Refleksi Peserta Didik</label>
              <textarea
                rows={3}
                value={studentReflection}
                onChange={(e) => setStudentReflection(e.target.value)}
                placeholder="Pertanyaan reflektif untuk dijawab siswa..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: PRATINJAU & FINALISASI A4 */}
      {currentStep === 7 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Pilih Tampilan Template:</span>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF A4</span>
              </button>
            </div>
          </div>

          {/* Printable A4 Container */}
          <div className="flex justify-center bg-slate-200/80 p-4 sm:p-8 rounded-2xl">
            <div
              id="module-print-area"
              className="bg-white p-6 sm:p-12 shadow-xl border border-slate-300 w-full max-w-[820px] text-slate-800 text-xs sm:text-sm leading-relaxed"
            >
              <DocumentHeader
                settings={settings}
                title="MODUL AJAR KURIKULUM MERDEKA"
                subTitle={`${selectedSubject?.name || 'Mata Pelajaran'} &bull; ${phase}`}
              />

              {/* I. INFORMASI UMUM */}
              <div className="space-y-4">
                <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 text-xs tracking-wider">
                  I. INFORMASI UMUM
                </h4>

                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="w-48 font-bold p-1.5 text-slate-700">Nama Penyusun / Guru</td>
                      <td className="p-1.5 text-slate-900">: {teacherName || 'Guru Pengampu'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="font-bold p-1.5 text-slate-700">Satuan Pendidikan</td>
                      <td className="p-1.5 text-slate-900">: {settings?.schoolName || 'MI SYURIYAH PEBATAN'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="font-bold p-1.5 text-slate-700">Tahun Pelajaran / Semester</td>
                      <td className="p-1.5 text-slate-900">: {academicYear} &bull; Semester {semester}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="font-bold p-1.5 text-slate-700">Mata Pelajaran / Fase / Kelas</td>
                      <td className="p-1.5 text-slate-900">: {selectedSubject?.name} &bull; {phase} &bull; Kelas {selectedClass?.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="font-bold p-1.5 text-slate-700">Alokasi Waktu</td>
                      <td className="p-1.5 text-slate-900">: {duration}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="font-bold p-1.5 text-slate-700">Kompetensi Awal</td>
                      <td className="p-1.5 text-slate-900">: {initialCompetence}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="font-bold p-1.5 text-slate-700">Profil Pelajar (P5-PPRA)</td>
                      <td className="p-1.5 text-slate-900">: {p5ppra.join(', ')}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="font-bold p-1.5 text-slate-700">Sarana & Prasarana</td>
                      <td className="p-1.5 text-slate-900">: {facilities}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="font-bold p-1.5 text-slate-700">Target Peserta Didik</td>
                      <td className="p-1.5 text-slate-900">: {targetStudents}</td>
                    </tr>
                    <tr>
                      <td className="font-bold p-1.5 text-slate-700">Model & Metode Pembelajaran</td>
                      <td className="p-1.5 text-slate-900">: {learningModel} ({methods.join(', ')})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* II. KOMPONEN INTI */}
              <div className="mt-6 space-y-4">
                <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 text-xs tracking-wider">
                  II. KOMPONEN INTI
                </h4>

                <div>
                  <p className="font-bold text-slate-800 text-xs">A. Tujuan Pembelajaran (TP):</p>
                  <p className="mt-1 text-slate-800 pl-4 border-l-2 border-slate-300 leading-relaxed">
                    {tpText || 'Peserta didik mampu memahami materi pembelajaran dengan baik.'}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-xs">B. Pemahaman Bermakna:</p>
                  <p className="mt-1 text-slate-800 pl-4 border-l-2 border-slate-300 leading-relaxed">
                    {meaningfulUnderstanding}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-xs">C. Pertanyaan Pemantik:</p>
                  <p className="mt-1 text-slate-800 pl-4 border-l-2 border-slate-300 whitespace-pre-line leading-relaxed">
                    {triggerQuestions}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-xs mb-2">D. Kegiatan Pembelajaran:</p>

                  <div className="space-y-3 pl-2 text-xs">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <p className="font-bold text-slate-900 mb-1">1. Kegiatan Pendahuluan (10 Menit):</p>
                      <p className="whitespace-pre-line text-slate-700 leading-relaxed">{openingActivity}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <p className="font-bold text-slate-900 mb-1">2. Kegiatan Inti (50 Menit):</p>
                      <p className="whitespace-pre-line text-slate-700 leading-relaxed">{coreActivity}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <p className="font-bold text-slate-900 mb-1">3. Kegiatan Penutup (10 Menit):</p>
                      <p className="whitespace-pre-line text-slate-700 leading-relaxed">{closingActivity}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-xs">E. Asesmen Penilaian:</p>
                  <p className="mt-1 text-slate-800 pl-4 border-l-2 border-slate-300 whitespace-pre-line leading-relaxed">
                    {assessment}
                  </p>
                </div>
              </div>

              {/* III. LAMPIRAN & REFLEKSI */}
              <div className="mt-6 space-y-4">
                <h4 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 text-xs tracking-wider">
                  III. PENGAYAAN, REMEDIAL & REFLEKSI
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">A. Pengayaan:</p>
                    <p className="text-slate-700 mt-1 leading-relaxed">{enrichment || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">B. Remedial:</p>
                    <p className="text-slate-700 mt-1 leading-relaxed">{remediation || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  <div>
                    <p className="font-bold text-slate-800">C. Refleksi Guru:</p>
                    <p className="text-slate-700 mt-1 leading-relaxed">{teacherReflection || '-'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">D. Refleksi Siswa:</p>
                    <p className="text-slate-700 mt-1 leading-relaxed">{studentReflection || '-'}</p>
                  </div>
                </div>
              </div>

              <DocumentSignature
                settings={settings}
                teacherName={teacherName}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Stepper Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <div className="flex items-center gap-2">
          {currentStep < 7 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <span>Lanjutkan ke Langkah {currentStep + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave('completed')}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Selesaikan Modul</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

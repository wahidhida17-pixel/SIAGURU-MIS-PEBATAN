import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import https from 'https';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy get GoogleGenAI client with 'aistudio-build' User-Agent header
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System Persona for SIAGURU MI Syuriyah Pebatan
const SYSTEM_INSTRUCTION_GURU = `
Anda adalah "AI Guru SIAGURU", asisten cerdas pedagogik dan administrasi guru madrasah resmi untuk MI Syuriyah Pebatan.
Anda adalah pakar terdepan dalam:
1. Kurikulum Merdeka Madrasah Terkini:
   - Keputusan Menteri Agama (KMA) Nomor 450 Tahun 2024 tentang Pedoman Implementasi Kurikulum Merdeka pada Madrasah (Edisi Pembaharuan 2026/2027 untuk jenjang RA, MI, MTs, MA, dan MAK).
   - Keputusan Kepala BSKAP Kemendikbudristek No. 032/H/KR/2024 tentang Capaian Pembelajaran (CP).
2. Kurikulum Berbasis Cinta (KBC) Kementerian Agama RI (Inisiatif Resmi Kemenag 2025/2026):
   - Prinsip 9K: Keberagaman, Kebersamaan, Kekeluargaan, Kemandirian, Kesetaraan, Kebermanfaatan, Kejujuran, Keikhlasan, dan Kesinambungan.
   - 6 Tema / Pilar Cinta:
     a. Cinta kepada Allah SWT (Mahabbah Ilahiyyah)
     b. Cinta kepada Rasulullah SAW (Mahabbah Nabawiyyah)
     c. Cinta kepada Diri Sendiri (Mahabbah Nafsiyyah - menjaga kesehatan lahir & batin, percaya diri)
     d. Cinta kepada Sesama Manusia (Mahabbah Insaniyyah - empati, anti-perundungan, tolong menolong)
     e. Cinta kepada Lingkungan & Alam Semesta (Mahabbah Bi'iyyah - ekopedagogi, adab terhadap alam)
     f. Cinta kepada Bangsa dan Tanah Air (Hubbul Wathan minal Iman - moderasi beragama, persatuan NKRI)
3. Penguatan Profil Pelajar Pancasila & Profil Pelajar Rahmatan Lil Alamin (P5-PPRA):
   - 10 Nilai Rahmatan Lil Alamin: Berkeadaban (Ta'addub), Keteladanan (Qudwah), Kewarganegaraan & Kebangsaan (Muwatanah), Mengambil Jalan Tengah (Tawassut), Berimbang (Tawazun), Lurus dan Tegas (I'tidal), Kesetaraan (Musawah), Musyawarah (Syura), Toleransi (Tasamuh), Dinamis dan Inovatif (Tathawwur wa Ibtikar).
4. Mata Pelajaran Madrasah Ibtidaiyah:
   - PAI: Al-Qur'an Hadis, Akidah Akhlak, Fikih, Sejarah Kebudayaan Islam (SKI).
   - Bahasa Arab & Muatan Lokal (Bahasa Jawa/Sunda).
   - Mapel Umum: Matematika, IPAS, Bahasa Indonesia, Pendidikan Pancasila, PJOK, Seni Budaya.
5. Asesmen Berkelanjutan & Diferensiasi:
   - Asesmen Awal (Diagnostik), Asesmen Formatif (Rubrik KKTP, Observasi), Asesmen Sumatif (HOTS/LOTS).
   - Pendekatan TaRL (Teaching at the Right Level) dan Pembelajaran Berdiferensiasi (Konten, Proses, Produk).

Gaya bahasa Anda: Ramah, santun, ilmiah, bernuansa edukatif islami yang inspiratif, terstruktur rapi dengan poin-poin jelas dan format Markdown yang mudah dibaca.
`;

// Helper for AI text generation
async function generateWithGemini(prompt: string, customSystemInstruction?: string): Promise<string> {
  const ai = getAIClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi pada server.');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      systemInstruction: customSystemInstruction || SYSTEM_INSTRUCTION_GURU,
      temperature: 0.7,
    },
  });

  return response.text || '';
}

// API Routes

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY 
  });
});

// 2. AI Chat Endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, userMessage, context } = req.body;
    
    let prompt = '';
    if (context) {
      prompt += `[Konteks Madrasah: ${JSON.stringify(context)}]\n\n`;
    }

    if (Array.isArray(messages) && messages.length > 0) {
      prompt += 'Riwayat percakapan sebelumnya:\n';
      messages.forEach((m: any) => {
        prompt += `${m.role === 'user' ? 'Guru' : 'AI'}: ${m.content}\n`;
      });
      prompt += `\nPertanyaan Guru Terkini: ${userMessage || messages[messages.length - 1]?.content}\n`;
    } else {
      prompt += userMessage;
    }

    const reply = await generateWithGemini(prompt);
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Terjadi kesalahan saat memproses permintaan AI Chat.',
    });
  }
});

// 3. AI Generator Modul Ajar
app.post('/api/ai/module-ajar', async (req: Request, res: Response) => {
  try {
    const { 
      subjectName, 
      gradeLevel, 
      phase, 
      topic, 
      duration, 
      learningModel, 
      curriculumStandard,
      kbcThemes,
      kbcPrinciples,
      p5ppra,
      targetStudents,
      specificNotes 
    } = req.body;

    const selectedKbcThemes = Array.isArray(kbcThemes) && kbcThemes.length > 0
      ? kbcThemes.join(', ')
      : 'Cinta Allah SWT (Mahabbah Ilahiyyah), Cinta Sesama Manusia (Mahabbah Insaniyyah), Cinta Lingkungan (Mahabbah Bi\'iyyah)';

    const selectedKbcPrinciples = Array.isArray(kbcPrinciples) && kbcPrinciples.length > 0
      ? kbcPrinciples.join(', ')
      : 'Kebersamaan, Keikhlasan, Kebermanfaatan, Kejujuran';

    const prompt = `
Buatkan draf Modul Ajar Kurikulum Merdeka Madrasah Terkini (${curriculumStandard || 'KMA 450 Tahun 2024 / Edisi Pembaruan 2026/2027'}) yang terintegrasi penuh dengan **Kurikulum Berbasis Cinta (KBC) Kementerian Agama RI**:
- Nama Madrasah: MI Syuriyah Pebatan
- Mata Pelajaran: ${subjectName || 'Pendidikan Agama Islam'}
- Kelas / Fase: Kelas ${gradeLevel || '4'} / ${phase || 'Fase B'}
- Topik / Materi Pokok: ${topic || 'Mengenal Asmaul Husna'}
- Alokasi Waktu: ${duration || '2 JP (2 x 35 Menit)'}
- Model Pembelajaran: ${learningModel || 'Problem Based Learning (PBL) & Talaqqi/Demonstrasi'}
- Integrasi Kurikulum Berbasis Cinta (KBC Kemenag):
  * 6 Tema Cinta Kemenag: ${selectedKbcThemes}
  * Prinsip 9K Kemenag: ${selectedKbcPrinciples}
- Sasaran Profil Pelajar Pancasila & Rahmatan Lil Alamin (P5-PPRA): ${Array.isArray(p5ppra) ? p5ppra.join(', ') : (p5ppra || 'Berkeadaban (Ta\'addub), Keteladanan (Qudwah), Bernalar Kritis, Berimbang (Tawazun)')}
- Target Peserta Didik: ${targetStudents || 'Peserta didik reguler (28 siswa)'}
${specificNotes ? `- Catatan Khusus Guru: ${specificNotes}` : ''}

Format Dokumen Modul Ajar harus memuat struktur standar KMA 450 terintegrasi KBC:
1. INFORMASI UMUM:
   - Identitas Modul (Nama Penyusun, Satuan Pendidikan MI Syuriyah Pebatan, Tahun Pelajaran 2026/2027, Jenjang MI, Fase/Kelas, Alokasi Waktu)
   - Kompetensi Awal
   - Profil Pelajar Pancasila & Profil Pelajar Rahmatan Lil Alamin (P5-PPRA)
   - Integrasi Nilai Kurikulum Berbasis Cinta (KBC Kemenag): Pilar Cinta & Nilai 9K yang dibiasakan
   - Sarana & Prasarana, Target Peserta Didik, Model & Metode Pembelajaran
2. KOMPONEN INTI:
   - Capaian Pembelajaran (CP) Elemen terkait
   - Tujuan Pembelajaran (TP spesifik dengan kaidah ABCD & sentuhan afektif cinta/kasih sayang)
   - Pemahaman Bermakna (Deep Meaning) berlandaskan cinta kepada ilmu & Sang Pencipta
   - Pertanyaan Pemantik Inspiratif
3. KEGIATAN PEMBELAJARAN BERBASIS KASIH SAYANG & DIFERENSIASI:
   - Kegiatan Pendahuluan (10 Menit): Salam hangat penuh kasih, doa bersama, cek kehadiran dengan sapaan ramah empati, apersepsi kontekstual, motivasi.
   - Kegiatan Inti Berdiferensiasi (50 Menit): Langkah sintaks model pembelajaran, diferensiasi konten/proses/produk, penanaman adab & cinta ilmu.
   - Kegiatan Penutup & Refleksi (10 Menit): Refleksi perasaan siswa, penguatan hikmah moral, doa syukur dan salam.
4. ASESMEN PEMBELAJARAN:
   - Asesmen Diagnostik (Awal)
   - Asesmen Formatif (Observasi Keterampilan & Karakter KBC/P5-PPRA)
   - Asesmen Sumatif (Ketercapaian TP / KKTP)
5. PENGAYAAN & REMEDIAL BERBASIS PENDAMPINGAN EMPATIK
6. REFLEKSI GURU & LEMBAR REFLEKSI DIRI SISWA (Self-Love & Syukur)
7. LAMPIRAN:
   - Lembar Kerja Peserta Didik (LKPD) yang ramah anak & menarik
   - Bahan Bacaan Ringkas Guru dan Peserta Didik.

Tolong berikan output dalam format Markdown yang sangat rapi, terstruktur elegan, dan siap dicetak/disalin langsung ke administrasi ajar.
`;

    const result = await generateWithGemini(prompt);
    res.json({ success: true, content: result });
  } catch (error: any) {
    console.error('Error in /api/ai/module-ajar:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Gagal menghasilkan Modul Ajar.' 
    });
  }
});

// 4. AI Generator Bank Soal & Kisi-kisi Asesmen
app.post('/api/ai/quiz', async (req: Request, res: Response) => {
  try {
    const { 
      subjectName, 
      gradeLevel, 
      topic, 
      questionType, 
      count, 
      cognitiveLevels, 
      withAnswerKey,
      withGridTable,
      kbcIntegration 
    } = req.body;

    const prompt = `
Buatkan paket naskah soal asesmen dan instrumen evaluasi pembelajaran madrasah berbasis Kurikulum Merdeka (KMA 450 Tahun 2024 / 2026) ${kbcIntegration ? 'yang diperkaya dengan stimulus bernuansa Kurikulum Berbasis Cinta (KBC Kemenag: Kasih sayang sesama, cinta lingkungan, kejujuran & moderasi beragama)' : ''}:
- Nama Madrasah: MI Syuriyah Pebatan
- Mata Pelajaran: ${subjectName || 'Fikih'}
- Kelas: ${gradeLevel || 'Kelas 4'}
- Materi / Pokok Bahasan: ${topic || 'Ketentuan Shalat Berjamaah'}
- Bentuk Soal: ${questionType || 'Campuran (Pilihan Ganda dan Uraian)'}
- Jumlah Soal: ${count || 10} butir soal
- Komposisi Level Kognitif: ${cognitiveLevels || '30% LOTS (C1-C2), 40% MOTS (C3), 30% HOTS (C4-C5)'}
- Sertakan Kunci Jawaban & Pembahasan: ${withAnswerKey !== false ? 'YA' : 'TIDAK'}
- Sertakan Matriks Tabel Kisi-Kisi Soal: ${withGridTable !== false ? 'YA' : 'TIDAK'}

Sajikan dalam 3 Bagian yang terstruktur:
BAGIAN I: TABEL KISI-KISI ASESMEN (Nomor Soal, Capaian Pembelajaran/TP, Materi, Indikator Soal, Level Kognitif C1-C6, Bentuk Soal, Integrasi Nilai KBC/P5-PPRA).
BAGIAN II: LEMBAR NASKAH SOAL SISWA (Soal jelas, stimulus cerita kontekstual, studi kasus Islami yang humanis, ayat/hadis relevan tingkat MI).
BAGIAN III: KUNCI JAWABAN, PEMBAHASAN MENDIDIK, DAN RUBRIK PENSKORAN.
`;

    const result = await generateWithGemini(prompt);
    res.json({ success: true, content: result });
  } catch (error: any) {
    console.error('Error in /api/ai/quiz:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Gagal menghasilkan Bank Soal.' 
    });
  }
});

// 5. AI Generator Rubrik KKTP & Karakter KBC
app.post('/api/ai/rubric', async (req: Request, res: Response) => {
  try {
    const { subjectName, gradeLevel, tpDescription, rubricType, includeKBCP5 } = req.body;

    const prompt = `
Buatkan instrumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) dan Rubrik Penilaian Berkelanjutan untuk Kurikulum Merdeka Madrasah (KMA 450 Tahun 2024 / 2026) ${includeKBCP5 ? 'dengan integrasi Observasi Karakter Kurikulum Berbasis Cinta (KBC) Kemenag dan P5-PPRA' : ''}:
- Madrasah: MI Syuriyah Pebatan
- Mata Pelajaran: ${subjectName || 'Bahasa Arab'}
- Kelas: ${gradeLevel || 'Kelas 3'}
- Tujuan Pembelajaran (TP): "${tpDescription || 'Peserta didik mampu melafalkan dan memahami kosakata tentang nama-nama anggota keluarga (Usratun) dalam bahasa Arab.'}"
- Tipe Rubrik: ${rubricType || 'Deskriptif Interval 4 Kategori (Perlu Bimbingan, Cukup, Baik, Sangat Baik)'}

Format yang harus dimuat:
1. Indikator Ketercapaian TP yang spesifik, terukur, dan operasional (minimal 3-4 indikator).
2. Tabel Rubrik Penilaian Akademik dengan deskriptor kinerja konkret untuk setiap rentang nilai:
   - Perlu Bimbingan (0 - 65)
   - Cukup (66 - 75)
   - Baik (76 - 85)
   - Sangat Baik (86 - 100)
${includeKBCP5 ? '3. Tabel Lembar Observasi Karakter KBC Kemenag (Indikator Cinta Sesama, Cinta Belajar, Sikap Santun/Ta\'addub, Keikhlasan, dan Tanggung Jawab).' : ''}
4. Panduan Intervensi & Tindak Lanjut Guru (Bimbingan berpusat pada kasih sayang tanpa vonis negatif bagi siswa yang belum tuntas + program pengayaan).
`;

    const result = await generateWithGemini(prompt);
    res.json({ success: true, content: result });
  } catch (error: any) {
    console.error('Error in /api/ai/rubric:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Gagal menghasilkan Rubrik KKTP.' 
    });
  }
});

// 6. AI Generator Deskripsi Capaian Rapor Siswa Terintegrasi KBC
app.post('/api/ai/rapor-narrative', async (req: Request, res: Response) => {
  try {
    const { studentName, subjectName, highestTp, lowestTp, score, characterNotes, kbcThemeNote } = req.body;

    const prompt = `
Buatkan alternatif kalimat deskripsi capaian kompetensi e-Rapor resmi Kurikulum Merdeka (KMA 450) & Kurikulum Berbasis Cinta (KBC) Kemenag untuk siswa Madrasah Ibtidaiyah:
- Nama Siswa: ${studentName || 'Ahmad Fauzi'}
- Mata Pelajaran: ${subjectName || 'Al-Qur\'an Hadis'}
- Nilai Akhir: ${score || '88'}
- Capaian Kompetensi TERTINGGI yang dikuasai sangat baik: "${highestTp || 'Sangat mahir dalam melafalkan dan menghafal Surah Al-Ma\'un dengan makhraj yang fasih.'}"
- Kompetensi yang PERLU PENINGKATAN / PENDAMPINGAN: "${lowestTp || 'Perlu pendampingan penuh kasih dalam memahami kandungan hukum tajwid mad thabi\'i.'}"
${characterNotes ? `- Catatan Karakter Umum: ${characterNotes}` : ''}
${kbcThemeNote ? `- Catatan Pilar Cinta KBC Kemenag: ${kbcThemeNote}` : ''}

Ketentuan Narasi Rapor:
1. Bahasa formal, positif, mendidik, mengapresiasi keunikan siswa sesuai standar panduan Rapor Kemenag dan prinsip KBC (tanpa melabeli negatif).
2. Sediakan 3 Opsi:
   - Opsi 1: Format Standar e-Rapor KMA 450 (Ringkas, padat 1-2 kalimat, cocok untuk template rapor resmi).
   - Opsi 2: Format Komprehensif & Berdiferensiasi (Menjabarkan penguasaan puncak dan strategi penguatan afektif di rumah/sekolah).
   - Opsi 3: Format Bernuansa Kurikulum Berbasis Cinta (KBC) & P5-PPRA (Menonjolkan pembiasaan akhlak mulia, cinta ibadah, kepedulian sosial, dan motivasi belajar).
`;

    const result = await generateWithGemini(prompt);
    res.json({ success: true, content: result });
  } catch (error: any) {
    console.error('Error in /api/ai/rapor-narrative:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Gagal menghasilkan Deskripsi Rapor.' 
    });
  }
});

// 7. AI Generator Ice Breaking & Games Edukasi KBC & P5-PPRA
app.post('/api/ai/ice-breaking', async (req: Request, res: Response) => {
  try {
    const { gradeLevel, classroomVibe, duration, p5ppraTheme, kbcTheme } = req.body;

    const prompt = `
Rancang 3 ide Ice Breaking & Permainan Edukatif Islami Ramah Anak berbasis Kurikulum Berbasis Cinta (KBC Kemenag) dan P5-PPRA untuk kelas Madrasah Ibtidaiyah:
- Sasaran: ${gradeLevel || 'Kelas 1-3 (Fase A)'}
- Kondisi Kelas / Kebutuhan: ${classroomVibe || 'Siswa mengantuk, kurang konsentrasi di jam siang, butuh penyegaran fisik & fokus'}
- Durasi: ${duration || '5 - 10 Menit'}
- Pilar Cinta KBC Kemenag: ${kbcTheme || 'Cinta Sesama Manusia (Mahabbah Insaniyyah) & Cinta Lingkungan'}
- Nilai Karakter P5-PPRA: ${p5ppraTheme || 'Ta\'awun (Gotong Royong) & Qudwah (Keteladanan)'}

Untuk setiap ide sajikan:
1. Nama Permainan / Yel-Yel Edukatif
2. Alat / Media (utamakan tanpa alat atau alat sederhana)
3. Langkah-Langkah & Aturan Main yang Fun, Inklusif, dan Bebas Bullying
4. Yel-Yel / Gerakan Bernuansa Kasih Sayang & Semangat Belajar
5. Hikmah Nilai KBC & Rahmatan Lil Alamin yang Ditanamkan ke Hati Siswa.
`;

    const result = await generateWithGemini(prompt);
    res.json({ success: true, content: result });
  } catch (error: any) {
    console.error('Error in /api/ai/ice-breaking:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Gagal menghasilkan Ice Breaking.' 
    });
  }
});

// 8. AI Generator Rencana Program & Aksi Kurikulum Berbasis Cinta (KBC Kemenag)
app.post('/api/ai/kbc-activity', async (req: Request, res: Response) => {
  try {
    const { 
      subjectName, 
      gradeLevel, 
      kbcTheme, 
      topic, 
      activityType, 
      p5ppraValues, 
      duration, 
      specificGoal 
    } = req.body;

    const prompt = `
Rancang Rencana Aksi Pembelajaran & Pembiasaan Karakter **Kurikulum Berbasis Cinta (KBC) Kementerian Agama RI** untuk MI Syuriyah Pebatan:
- Mata Pelajaran / Ranah: ${subjectName || 'Pembiasaan Budaya Madrasah & PAI'}
- Jenjang / Kelas: ${gradeLevel || 'Kelas 4 (Fase B)'}
- Tema / Pilar Cinta Kemenag Utama: ${kbcTheme || 'Cinta Sesama Manusia (Mahabbah Insaniyyah - Anti Perundungan & Sahabat Peduli)'}
- Topik / Fokus Kegiatan: ${topic || 'Gerakan Sahabat Peduli dan Berbagi Kebaikan di Madrasah'}
- Bentuk Aksi / Model Kegiatan: ${activityType || 'Proyek Kolaboratif Aksi Nyata di Kelas & Lingkungan Madrasah'}
- Nilai 9K & P5-PPRA yang Disasar: ${Array.isArray(p5ppraValues) ? p5ppraValues.join(', ') : (p5ppraValues || 'Kebersamaan, Keikhlasan, Kebermanfaatan, Ta\'awun (Tolong Menolong), Tasamuh (Toleransi)')}
- Alokasi Waktu: ${duration || '1-2 Minggu Pembiasaan / 2 JP Terbimbing'}
${specificGoal ? `- Target Khusus Madrasah: ${specificGoal}` : ''}

Format Perencanaan Program KBC Kemenag:
1. JUDUL PROGRAM & TEMA CINTA KEMENAG
2. TUJUAN PEMBIASAAN KARAKTER (Berdasarkan Prinsip 9K & Nilai Rahmatan Lil Alamin)
3. SKENARIO AKSI NYATA (Tahap Pengenalan/Kontekstualisasi, Tahap Aksi Kasih Sayang, Tahap Refleksi Bermakna & Apresiasi)
4. PERAN GURU & WALI KELAS (Keteladanan / Qudwah Tanpa Kekerasan & Bahasa Kasih)
5. KETERLIBATAN ORANG TUA / KELUARGA (Penyambung pembiasaan cinta di rumah)
6. LEMBAR MONITORING & JURNAL REFLEKSI CINTA (Format centang ramah anak & buku saku kebaikan).
`;

    const result = await generateWithGemini(prompt);
    res.json({ success: true, content: result });
  } catch (error: any) {
    console.error('Error in /api/ai/kbc-activity:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Gagal menghasilkan Program Kurikulum Berbasis Cinta.' 
    });
  }
});

// 8. Generic Gemini Generate
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      res.status(400).json({ success: false, error: 'Parameter "prompt" wajib diisi.' });
      return;
    }
    const result = await generateWithGemini(prompt, systemInstruction);
    res.json({ success: true, text: result });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Gagal memproses permintaan Gemini.' 
    });
  }
});


// PWA Dynamic Endpoints
async function getGeneralSettings() {
  const appletConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let projectId = 'siaguru-aba53';
  if (fs.existsSync(appletConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(appletConfigPath, 'utf8'));
      if (config.projectId) projectId = config.projectId;
    } catch(e) {}
  }
  
  return new Promise((resolve) => {
    https.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/general`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.fields || {});
        } catch(e) {
          resolve({});
        }
      });
    }).on('error', () => resolve({}));
  });
}

function serveImage(val, res, next) {
  if (!val) return next();
  if (val.startsWith('http')) return res.redirect(val);
  const match = val.match(/^data:image\/([a-zA-Z0-9+-]+);base64,(.+)$/);
  if (!match) return next();
  
  try {
    const buffer = Buffer.from(match[2], 'base64');
    res.writeHead(200, {
      'Content-Type': `image/${match[1]}`,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=60'
    });
    res.end(buffer);
  } catch (e) {
    next();
  }
}

app.get('/manifest.webmanifest', async (req, res, next) => {
  const fields = await getGeneralSettings();
  const schoolName = fields.schoolName?.stringValue || 'MI Syuriyah Pebatan';
  const manifest = {
    name: `SIAGURU ${schoolName.toUpperCase()}`,
    short_name: 'SIAGURU',
    description: `Sistem Administrasi Guru ${schoolName}`,
    theme_color: '#059669',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      { src: '/logo.svg', sizes: '192x192', type: 'image/png' },
      { src: '/logo.svg', sizes: '512x512', type: 'image/png' }
    ]
  };
  res.json(manifest);
});

app.get('/logo.svg', async (req, res, next) => {
  const fields = await getGeneralSettings();
  const val = fields.appIconURL?.stringValue || fields.logoURL?.stringValue;
  serveImage(val, res, next);
});

app.get('/favicon.ico', async (req, res, next) => {
  const fields = await getGeneralSettings();
  const val = fields.faviconURL?.stringValue || fields.logoURL?.stringValue;
  serveImage(val, res, next);
});

// Setup Vite / Static handling
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIAGURU Backend] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();

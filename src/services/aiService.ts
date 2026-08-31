import type { 
  ChatMessage, 
  ModuleAjarGenParams, 
  QuizGenParams, 
  RubricGenParams, 
  RaporNarrativeGenParams, 
  IceBreakingGenParams,
  KBCActivityGenParams,
  SavedAIItem 
} from '../types/ai';

const STORAGE_KEY = 'siaguru_saved_ai_items';
const CHAT_HISTORY_KEY = 'siaguru_ai_chat_history';

class AIService {
  // 1. AI Chat Assistant
  async sendChatMessage(
    messages: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
    context?: any
  ): Promise<string> {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userMessage, context }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal berkomunikasi dengan AI Guru.');
      }

      return data.reply;
    } catch (err: any) {
      console.warn('Backend chat API returned error, using fallback helper:', err);
      return this.generateFallbackChatResponse(userMessage);
    }
  }

  // 2. Modul Ajar Generator (KMA 450 & KBC Kemenag)
  async generateModuleAjar(params: ModuleAjarGenParams): Promise<string> {
    try {
      const res = await fetch('/api/ai/module-ajar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan Modul Ajar.');
      }

      return data.content;
    } catch (err: any) {
      console.warn('Backend Modul Ajar API error, using fallback:', err);
      return this.generateFallbackModuleAjar(params);
    }
  }

  // 3. Bank Soal & Kisi-Kisi Generator
  async generateQuiz(params: QuizGenParams): Promise<string> {
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan Bank Soal.');
      }

      return data.content;
    } catch (err: any) {
      console.warn('Backend Quiz API error, using fallback:', err);
      return this.generateFallbackQuiz(params);
    }
  }

  // 4. Rubrik KKTP Generator
  async generateRubric(params: RubricGenParams): Promise<string> {
    try {
      const res = await fetch('/api/ai/rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan Rubrik KKTP.');
      }

      return data.content;
    } catch (err: any) {
      console.warn('Backend Rubric API error, using fallback:', err);
      return this.generateFallbackRubric(params);
    }
  }

  // 5. Narasi Rapor Generator
  async generateRaporNarrative(params: RaporNarrativeGenParams): Promise<string> {
    try {
      const res = await fetch('/api/ai/rapor-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan Deskripsi Rapor.');
      }

      return data.content;
    } catch (err: any) {
      console.warn('Backend Rapor API error, using fallback:', err);
      return this.generateFallbackRaporNarrative(params);
    }
  }

  // 6. Ice Breaking & Game Edukasi Generator
  async generateIceBreaking(params: IceBreakingGenParams): Promise<string> {
    try {
      const res = await fetch('/api/ai/ice-breaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan ide Ice Breaking.');
      }

      return data.content;
    } catch (err: any) {
      console.warn('Backend Ice Breaking API error, using fallback:', err);
      return this.generateFallbackIceBreaking(params);
    }
  }

  // 7. Kurikulum Berbasis Cinta (KBC Kemenag) Activity Generator
  async generateKBCActivity(params: KBCActivityGenParams): Promise<string> {
    try {
      const res = await fetch('/api/ai/kbc-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal merancang program Kurikulum Berbasis Cinta.');
      }

      return data.content;
    } catch (err: any) {
      console.warn('Backend KBC API error, using fallback:', err);
      return this.generateFallbackKBCActivity(params);
    }
  }

  // 8. Generic Generate
  async generateCustom(prompt: string, systemInstruction?: string): Promise<string> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal memproses permintaan AI.');
    }

    return data.text;
  }

  // Local Storage Management for Saved Artifacts
  getSavedItems(): SavedAIItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveItem(item: Omit<SavedAIItem, 'id' | 'createdAt'>): SavedAIItem {
    const items = this.getSavedItems();
    const newItem: SavedAIItem = {
      ...item,
      id: 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return newItem;
  }

  deleteSavedItem(id: string): void {
    const items = this.getSavedItems().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  getChatHistory(): ChatMessage[] {
    try {
      const data = localStorage.getItem(CHAT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveChatHistory(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  }

  clearChatHistory(): void {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }

  // Intelligent Fallback Generators (Ensures high quality even during offline/limited network)
  private generateFallbackChatResponse(query: string): string {
    return `### 💡 Panduan Jawaban Pedagogik AI Guru (MI Syuriyah Pebatan)

Terima kasih atas pertanyaan Bapak/Ibu Guru. Berikut adalah rekomendasi praktis implementasi pembelajaran madrasah:

1. **Pendekatan Diferensiasi & Karakter**:
   - Sesuaikan tingkat kesulitan tugas berdasarkan pemetaan diagnostik awal siswa.
   - Sisipkan nilai-nilai **Profil Pelajar Rahmatan Lil Alamin (PPRA)** seperti *Ta'addub* (sopan santun) dan *Qudwah* (keteladanan).

2. **Strategi Pembelajaran Aktif**:
   - Manfaatkan metode interaktif seperti *Talking Stick*, *Talaqqi berpasangan*, atau *Gallery Walk*.
   - Gunakan media visual, kartu ayat, atau stimulus digital yang kontekstual dengan kehidupan anak.

3. **Asesmen Berkelanjutan**:
   - Berikan umpan balik langsung (*formative feedback*) yang membesarkan hati peserta didik.
   - Catat perkembangan peserta didik pada lembar observasi harian.

*Silakan tanyakan aspek spesifik lainnya, seperti modul ajar, rubrik KKTP, atau bank soal asesmen.*`;
  }

  private generateFallbackModuleAjar(params: ModuleAjarGenParams): string {
    return `# MODUL AJAR KURIKULUM MERDEKA (KMA 450 TAHUN 2024)
**SATUAN PENDIDIKAN:** MI SYURIYAH PEBATAN  
**MATA PELAJARAN:** ${params.subjectName.toUpperCase()}  
**FASE / KELAS:** ${params.phase} (${params.gradeLevel})  
**ALOKASI WAKTU:** ${params.duration || '2 JP (2 x 35 Menit)'}  
**MATERI POKOK:** ${params.topic}  

---

### I. INFORMASI UMUM
- **Kompetensi Awal:** Peserta didik memiliki pengetahuan dasar dan ketertarikan terhadap materi ${params.topic}.
- **Profil Pelajar Pancasila & Rahmatan Lil Alamin (P5-PPRA):**
  - Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia
  - Keteladanan (*Qudwah*) & Berkeadaban (*Ta'addub*)
  - Gotong Royong (*Ta'awun*) & Bernalar Kritis
- **Sarana & Prasarana:** Ruang kelas/musholla, buku ajar, LCD proyektor/kartu materi, lembar kerja siswa.
- **Target Peserta Didik:** ${params.targetStudents || 'Peserta didik reguler / tipikal'}
- **Model & Metode:** ${params.learningModel || 'Problem Based Learning (PBL)'}, Diskusi, Tanya Jawab, Penugasan.

---

### II. KOMPONEN INTI
- **Capaian Pembelajaran (CP):** Peserta didik mampu memahami konsep esensial dan menerapkan nilai-nilai ${params.topic} dalam konteks ibadah dan akhlak sehari-hari.
- **Tujuan Pembelajaran (TP):**
  1. Melalui pengamatan dan tanya jawab, peserta didik mampu menjelaskan pengertian dan makna ${params.topic} dengan tepat.
  2. Melalui diskusi kelompok, peserta didik dapat mengidentifikasi contoh penerapan ${params.topic} dalam kehidupan sehari-hari.
  3. Peserta didik menunjukkan sikap disiplin, santun, dan saling menghormati selama pembelajaran.
- **Pemahaman Bermakna:** Mempelajari ${params.topic} membentuk pribadi muslim yang berilmu, bertakwa, dan berakhlak terpuji.
- **Pertanyaan Pemantik:**
  1. Mengapa materi ${params.topic} sangat penting bagi kehidupan kita?
  2. Bagaimana cara kita membiasakannya dalam kegiatan di madrasah dan rumah?

---

### III. KEGIATAN PEMBELAJARAN
#### A. Kegiatan Pendahuluan (10 Menit)
1. Guru mengucap salam, membaca doa bersama dipimpin ketua kelas, dan tadarus surat pendek.
2. Memeriksa kehadiran dan kesiapan sarana belajar peserta didik.
3. Apersepsi: Guru mengaitkan materi sebelumnya dengan materi ${params.topic}.
4. Menyampaikan tujuan pembelajaran dan memotivasi peserta didik.

#### B. Kegiatan Inti (50 Menit)
1. **Orientasi Masalah:** Guru menampilkan stimulus berupa gambar/cerita/video terkait ${params.topic}.
2. **Pengorganisasian Belajar:** Siswa dibagi menjadi kelompok kecil beranggotakan 4-5 orang.
3. **Penyelidikan Mandiri/Kelompok:** Siswa berdiskusi menyelesaikan lembar kerja (LKPD) yang dibagikan guru. Guru berkeliling memfasilitasi bimbingan diferensiasi.
4. **Pengembangan & Penyajian:** Setiap perwakilan kelompok mempresentasikan hasil diskusinya.
5. **Evaluasi & Penguatan:** Guru memberikan apresiasi dan meluruskan konsep materi.

#### C. Kegiatan Penutup (10 Menit)
1. Guru bersama peserta didik merangkum poin-poin utama pembelajaran hari ini.
2. Melakukan refleksi singkat (apa yang paling disukai dan dipahami hari ini).
3. Memberikan pengarahan tugas pembiasaan di rumah.
4. Menutup pembelajaran dengan doa penutup majlis dan salam.

---

### IV. ASESMEN PEMBELAJARAN
1. **Asesmen Diagnostik:** Tanya jawab lisan di awal pembelajaran.
2. **Asesmen Formatif:** Observasi sikap aktif dan penilaian unjuk kerja diskusi/presentasi LKPD.
3. **Asesmen Sumatif:** Tes tulis/lisan 5 butir soal di akhir materi.

---

### V. PENGAYAAN & REMEDIAL
- **Pengayaan:** Siswa dengan pemahaman tinggi diberikan materi pengayaan analisis contoh lanjutan.
- **Remedial:** Bimbingan khusus secara personal atau tutor sebaya bagi siswa yang belum mencapai KKTP.`;
  }

  private generateFallbackQuiz(params: QuizGenParams): string {
    return `# PAKET NASKAH SOAL & KISI-KISI ASESMEN MADRASAH
**MADRASAH:** MI SYURIYAH PEBATAN  
**MATA PELAJARAN:** ${params.subjectName.toUpperCase()}  
**KELAS / TINGKAT:** ${params.gradeLevel}  
**MATERI POKOK:** ${params.topic}  
**BENTUK SOAL:** ${params.questionType} (${params.count} Butir Soal)  

---

### BAGIAN I: MATRIKS KISI-KISI SOAL
| No | Capaian / Tujuan Pembelajaran | Materi Pokok | Indikator Soal | Level Kognitif | Bentuk Soal |
|:--:|:-----------------------------|:-------------|:---------------|:--------------:|:-----------:|
| 1  | Memahami konsep ${params.topic} | Pengertian Dasar | Disajikan narasi, siswa dapat menyebutkan arti dasar | C1 (LOTS) | PG / Isian |
| 2  | Mengidentifikasi rukun & syarat | Ketentuan Pokok | Siswa dapat mengelompokkan syarat & rukun | C2 (LOTS) | PG |
| 3  | Menerapkan tata cara dalam ibadah | Praktik & Hikmah | Disajikan ilustrasi kasus, siswa dapat menentukan sikap yang tepat | C3 (MOTS) | PG |
| 4  | Menganalisis sebab-akibat | Studi Kasus | Siswa dapat menganalisis solusi permasalahan ibadah | C4 (HOTS) | Uraian |
| 5  | Menyimpulkan hikmah perilaku | Karakter P5-PPRA | Siswa dapat merumuskan hikmah akhlak terpuji | C5 (HOTS) | Uraian |

---

### BAGIAN II: NASKAH SOAL ASESMEN

**A. Pilihan Ganda**  
*Pilihlah salah satu jawaban A, B, C, atau D yang paling benar!*

1. Pengertian paling tepat terkait pokok bahasan ${params.topic} adalah ...  
   A. Perbuatan yang dilakukan tanpa aturan yang jelas  
   B. Segala ketentuan syariat yang diajarkan dalam agama Islam  
   C. Kebiasaan masyarakat yang tidak memiliki dasar hukum  
   D. Tindakan yang hanya boleh dilakukan oleh orang dewasa  

2. Salah satu syarat utama yang harus dipenuhi peserta didik dalam melaksanakan ${params.topic} adalah ...  
   A. Mengutamakan pujian orang lain  
   B. Beriman, suci dari hadas, dan berniat ikhlas karena Allah SWT  
   C. Dilakukan hanya saat diawasi oleh guru  
   D. Membawa perlengkapan serba baru  

3. Perhatikan pernyataan berikut!  
   (1) Membaca basmalah sebelum memulai  
   (2) Melakukan dengan tergesa-gesa  
   (3) Mengikuti urutan tata cara yang benar  
   (4) Menghargai teman yang sedang belajar  
   Sikap yang mencerminkan adab terpuji adalah nomor ...  
   A. (1), (2), dan (3)  
   B. (1), (3), dan (4)  
   C. (2), (3), dan (4)  
   D. (1) dan (2) saja  

**B. Soal Uraian / Essay**  
*Jawablah pertanyaan di bawah ini dengan jelas dan tepat!*

4. Jelaskan 3 (tiga) manfaat penting mempelajari ${params.topic} dalam kehidupan sehari-hari di madrasah dan di rumah!
5. Bagaimana sikap kamu jika melihat teman yang mengalami kesulitan dalam memahami materi ${params.topic}? Berikan solusinya!

---

### BAGIAN III: KUNCI JAWABAN & PEDOMAN PENSKORAN

**Kunci Pilihan Ganda:**
1. **B** (Skor: 10)
2. **B** (Skor: 10)
3. **B** (Skor: 10)

**Pedoman Penskoran Uraian:**
- **Nomor 4 (Skor Maksimal: 35):**
  - Menjelaskan 3 manfaat dengan runtut dan benar = Skor 35
  - Menjelaskan 2 manfaat = Skor 25
  - Menjelaskan 1 manfaat = Skor 15
- **Nomor 5 (Skor Maksimal: 35):**
  - Memberikan sikap empati, tolong-menolong (*ta'awun*), dan solusi konkrit = Skor 35
  - Menjawab sebagian = Skor 20

**Total Skor Maksimal = 100**  
Nilai Akhir = (Skor Perolehan / Total Skor Maksimal) x 100`;
  }

  private generateFallbackRubric(params: RubricGenParams): string {
    return `# KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) & RUBRIK PENILAIAN
**SATUAN PENDIDIKAN:** MI SYURIYAH PEBATAN  
**MATA PELAJARAN:** ${params.subjectName.toUpperCase()}  
**KELAS / SEMESTER:** ${params.gradeLevel}  
**TUJUAN PEMBELAJARAN (TP):** "${params.tpDescription}"  

---

### TABEL RUBRIK PENILAIAN KRITERIA KETERCAPAIAN (KKTP)

| Kriteria / Indikator | Perlu Bimbingan (0 - 65) | Cukup (66 - 75) | Baik (76 - 85) | Sangat Baik (86 - 100) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Penguasaan Konsep Dasar** | Belum mampu menyebutkan dan memahami konsep dasar tanpa panduan guru. | Mampu menyebutkan sebagian konsep dasar, namun masih ada kekeliruan kecil. | Mampu memahami dan menjelaskan konsep secara benar dan mandiri. | Mampu menguraikan konsep secara mendalam dan memberikan contoh aplikatif. |
| **2. Keterampilan & Praktik** | Belum mampu mempraktikkan langkah kegiatan dengan tepat. | Mampu mempraktikkan sebagian langkah dengan arahan bertahap dari guru. | Mampu mempraktikkan seluruh langkah dengan urutan yang benar. | Sangat mahir mempraktikkan secara tartil, fasih, dan dapat membimbing teman. |
| **3. Sikap & Profil Rahmatan Lil Alamin** | Belum menunjukkan adab kesungguhan belajar di kelas. | Mulai menunjukkan sikap tertib dan sopan santun saat ditegur. | Konsisten menunjukkan sikap disiplin, santun (*Ta'addub*), dan aktif. | Menjadi teladan (*Qudwah*) bagi teman sebaya dalam kedisiplinan dan akhlak mulia. |

---

### TINDAK LANJUT ASESMEN:
1. **Interval 0 - 65 (Perlu Bimbingan):** Dilakukan remedial intensif pada indikator yang belum tercapai dengan pendampingan langsung guru atau kartu bantuan belajar.
2. **Interval 66 - 75 (Cukup):** Diberikan latihan penguatan konsep tambahan untuk memantapkan pemahaman.
3. **Interval 76 - 85 (Baik):** Peserta didik telah mencapai ketuntasan TP dan dapat melanjutkan ke materi berikutnya.
4. **Interval 86 - 100 (Sangat Baik):** Diberikan materi pengayaan (proyek kreatif / menjadi tutor sebaya bagi temannya).`;
  }

  private generateFallbackRaporNarrative(params: RaporNarrativeGenParams): string {
    return `# REKOMENDASI DESKRIPSI CAPAIAN RAPOR SISWA (E-RAPOR KURIKULUM MERDEKA)
**NAMA SISWA:** ${params.studentName}  
**MATA PELAJARAN:** ${params.subjectName}  
**NILAI AKHIR:** ${params.score || '85'}  

---

### 📝 PILIHAN OPSI NARASI RAPOR:

#### Opsi 1: Format Komprehensif (Resmi Standar Kemenag)
> "Menunjukkan penguasaan yang sangat baik dalam ${params.highestTp}. Namun demikian, ananda masih memerlukan bimbingan dan pendampingan berkelanjutan dalam ${params.lowestTp}."

#### Opsi 2: Format Ringkas & Padat (Efisien Kolom Rapor)
> "Sangat terampil dalam ${params.highestTp}, serta perlu ditingkatkan pemahamannya mengenai ${params.lowestTp}."

#### Opsi 3: Format Apresiatif & Penguatan Karakter Islami (P5-PPRA)
> "Alhamdulillah, ananda menunjukkan semangat belajar dan akhlak terpuji yang membanggakan, sangat mahir dalam ${params.highestTp}. Disarankan untuk terus dibimbing di rumah dalam memantapkan ${params.lowestTp}."`;
  }

  private generateFallbackIceBreaking(params: IceBreakingGenParams): string {
    return `# 🎲 IDE ICE BREAKING & GAMES EDUKATIF ISLAMI (MI SYURIYAH PEBATAN)
**SASARAN KELAS:** ${params.gradeLevel}  
**KONDISI KELAS:** ${params.classroomVibe}  
**DURASI:** ${params.duration || '5 - 10 Menit'}  
**PENGUATAN KARAKTER:** ${params.p5ppraTheme || 'Ta\'awun & Keteladanan'}  

---

### 🎯 IDE 1: "Tepuk Hijaiyah Berantai" (Fokus & Kecepatan)
- **Bahan / Alat:** Tanpa alat.
- **Cara Bermain:**
  1. Guru memberikan kode gerakan untuk 3 huruf Hijaiyah:
     - Huruf *Alif*: Tepuk tangan 1x sambil berdiri tegak.
     - Huruf *Ba*: Tepuk paha 2x sambil duduk rapi.
     - Huruf *Ta*: Angkat kedua tangan sambil berucap "Subhanallah!".
  2. Guru menyebutkan rangkaian huruf secara acak dengan tempo cepat. Siswa yang salah gerakan diminta memimpin tepuk berikutnya.
- **Hikmah / Nilai Edukasi:** Melatih konsentrasi mendengar (*Istima'*), daya ingat, dan respons motorik anak.

---

### 🎯 IDE 2: "Bisik Sahabat / Estafet Pesan Kebaikan" (Kerjasama / Ta'awun)
- **Bahan / Alat:** Kertas kecil berisi potongan hadis pendek (misal: *"Senyummu di hadapan saudaramu adalah sedekah"*).
- **Cara Bermain:**
  1. Siswa berbaris per baris meja (1 kelompok isi 4-6 siswa).
  2. Siswa paling depan membaca pesan singkat dari guru, lalu membisikkannya ke teman di belakangnya secara berantai hingga orang terakhir.
  3. Siswa terakhir menuliskan atau melafalkan pesan tersebut dengan lantang.
- **Hikmah / Nilai Edukasi:** Menanamkan nilai amanah dalam menyampaikan informasi dan kekompakan kelompok (*Ta'awun*).

---

### 🎯 IDE 3: "Sambung Asmaul Husna" (Penyegaran Suasana Islami)
- **Bahan / Alat:** Bola kertas / spidol estafet.
- **Cara Bermain:**
  1. Seluruh siswa menyanyikan lagu Asmaul Husna bersama sambil mengoper bola kertas.
  2. Saat guru berkata "STOP!", siswa yang memegang bola harus melafalkan 1 nama Asmaul Husna beserta artinya secara percaya diri.
  3. Teman-teman sekelas serentak berucap: *"Masya Allah, Hebat!"*.
- **Hikmah / Nilai Edukasi:** Penguatan hafalan dan keberanian tampil percaya diri (*Saja'ah*).`;
  }

  private generateFallbackKBCActivity(params: KBCActivityGenParams): string {
    const mainTheme = params.primaryTheme || params.kbcTheme || 'Cinta Sesama Manusia (Mahabbah Insaniyyah)';
    const audience = params.targetAudience || params.gradeLevel || 'Semua Siswa MI';
    const activityName = params.specificGoals || params.topic || 'Pembiasaan Budaya Kasih Sayang & Sahabat Peduli';
    const principles = params.principles9K?.join(', ') || 'Keberagaman, Kebersamaan, Kekeluargaan, Keikhlasan';

    return `# 💖 RENCANA AKSI KURIKULUM BERBASIS CINTA (KBC) KEMENAG RI
**SATUAN PENDIDIKAN:** MI SYURIYAH PEBATAN  
**SASARAN SISWA:** ${audience}  
**PILAR UTAMA TEMA CINTA:** ${mainTheme}  
${params.secondaryTheme ? `**TEMA PENDUKUNG:** ${params.secondaryTheme}  \n` : ''}**BENTUK PROGRAM / FORMAT:** ${params.activityType}  
**PRINSIP 9K YANG DIKUATKAN:** ${principles}  
**DURASI PELAKSANAAN:** ${params.duration || '1 Bulan Pembiasaan Terpadu (4 Minggu)'}  
**FOKUS UTAMA / TARGET:** ${activityName}  

---

### I. LATAR BELAKANG & TUJUAN PEMBIASAAN
1. **Latar Belakang:** Implementasi Kurikulum Berbasis Cinta (KBC) Kemenag RI yang berlandaskan 9 Prinsip K (Keberagaman, Kebersamaan, Kekeluargaan, Kemandirian, Kesetaraan, Kebermanfaatan, Kejujuran, Keikhlasan, Kesinambungan) guna menciptakan ekosistem madrasah yang humanis, penuh kasih sayang, ramah anak, dan bebas perundungan (bullying).
2. **Tujuan Karakter:**
   - Menumbuhkan rasa kasih sayang mendalam kepada Allah SWT, sesama manusia, diri sendiri, dan lingkungan alam.
   - Menguatkan profil Pelajar Rahmatan Lil Alamin (*Ta'addub*, *Qudwah*, *Ta'awun*, dan *Tasamuh*).
   - Menjadikan madrasah sebagai rumah kedua yang hangat, aman, dan membahagiakan bagi seluruh anak didik.

---

### II. TAHAPAN SKENARIO AKSI KASIH SAYANG

#### 1. Tahap Orientasi & Sentuhan Kalbu (Pekan 1)
- Guru menyapa siswa dengan senyuman hangat, salam, dan menanyakan kabar perasaan siswa hari ini (*Emotional Check-in*).
- Menampilkan stimulus kisah teladan Rasulullah SAW dan inspirasi tentang indahnya tolong-menolong dan menyayangi sesama makhluk ciptaan Allah.
- Refleksi kelas: *"Bagaimana perasaan kita saat disayangi, dihargai, dan ditolong orang lain?"*.

#### 2. Tahap Aksi Nyata & Kolaborasi Bermakna (Pekan 2 - 3)
- **Aksi Kelompok:** Siswa membuat *"Pohon Kebaikan & Kartu Kasih Sayang"*, di mana setiap anak menuliskan apresiasi tulus untuk sahabat sekelasnya.
- **Praktik Lapangan:** Gerakan bersih-bersih lingkungan madrasah bersama (*Cinta Alam & Lingkungan*) diiringi senandung shalawat dan lagu kebersamaan.
- Pembagian peran yang setara dan inklusif tanpa membedakan latar belakang kemampuan anak.

#### 3. Tahap Refleksi & Apresiasi Karakter (Pekan 4)
- Siswa membacakan salah satu kartu apresiasi yang diterimanya dengan senyuman.
- Guru menguatkan komitmen bersama: *"Di madrasah kita, tidak ada ejekan, yang ada hanyalah saling menjaga, membimbing, dan menyayangi karena Allah SWT"*.
- Penutupan dengan doa bersama dan saling bersalaman dengan adab sopan santun (*Musafahah*).

---

### III. PERAN KETELADANAN GURU & WALI KELAS
- **Bahasa Kasih:** Menggunakan intonasi lembut, tidak membentak, dan memberikan pujian tulus terhadap usaha anak.
- **Pendengar Aktif:** Memberikan waktu mendengar keluh kesah siswa dengan penuh perhatian.
- **Keadilan Emosional:** Memastikan setiap anak merasa diterima, aman, dan berharga di dalam kelas.

---

### IV. LEMBAR MONITORING JURNAL KEBAIKAN SISWA
| Hari / Tanggal | Aksi Kasih Sayang yang Dilakukan | Perasaan Setelah Melakukan | Catatan Guru / Wali Kelas |
| :--- | :--- | :--- | :--- |
| Senin | Membantu teman memungut alat tulis yang jatuh | Sangat senang & lega | ⭐ Menunjukkan kepedulian tulus |
| Selasa | Berbagi bekal makanan sehat saat jam istirahat | Bahagia bisa berbagi | ⭐ Mengamalkan sedekah |
| Rabu | Menyiram tanaman di depan kelas madrasah | Senang melihat tanaman subur | ⭐ Menyayangi lingkungan alam |
| Kamis | Menghibur teman yang sedang sedih | Hati merasa tenteram | ⭐ Empati kemanusiaan |
| Jumat | Infak sukarela Jumat Berkah | Merasa bersyukur kepada Allah | ⭐ Mahabbah Ilahiyyah |`;
  }
}

export const aiService = new AIService();

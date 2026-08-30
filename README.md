# SIAGURU MI SYURIYAH PEBATAN

## 1. Tentang Aplikasi
**SIAGURU MI Syuriyah Pebatan** adalah Sistem Administrasi Guru Terintegrasi yang memfasilitasi administrasi sekolah, pembelajaran, pengelolaan nilai, rapor, dan monitoring kinerja guru secara komprehensif.

## 2. Fitur
- Manajemen Master Data (Guru, Siswa, Kelas, Mapel).
- Pengelolaan Kurikulum dan Asesmen.
- Rekam Jurnal Mengajar dan Absensi.
- Rekapitulasi Penilaian dan Pembuatan Rapor Siswa.
- Monitoring Kinerja Akademik (Kepala Madrasah).
- Laporan dan Arsip Administrasi.

## 3. Role
Aplikasi ini memiliki 3 hak akses utama (Role):
- **Admin:** Bertanggung jawab atas pengelolaan master data dan sistem secara keseluruhan.
- **Kepala Madrasah:** Memiliki akses baca (Read-Only) untuk memonitor perkembangan administrasi dan proses pembelajaran di sekolah, serta mencetak laporan.
- **Guru (Guru Kelas, Mapel, Agama):** Bertanggung jawab atas kelas/mapel yang ditugaskan, mulai dari jurnal, asesmen, hingga rapor.

## 4. Instalasi
1. Clone repository ini.
2. Jalankan `npm install` untuk mengunduh seluruh dependensi.
3. Konfigurasikan file `.env` berdasarkan kredensial Firebase.
4. Jalankan `npm run dev` untuk memulai server pengembangan lokal di `localhost:3000`.

## 5. Firebase Setup
Aplikasi berjalan menggunakan layanan Google Firebase:
- **Firebase Authentication** untuk manajemen otentikasi (Email/Password).
- **Cloud Firestore** untuk basis data NoSQL.
- **Firebase Storage** untuk penyimpanan dokumen/file unggahan.

Pastikan akun Anda memiliki peran yang tepat (`admin`, `headmaster`, atau `guru`) yang diset langsung pada koleksi `users` di Firestore.

## 6. Firestore
Basis data diorganisasikan ke dalam beberapa koleksi utama:
- `users`: Data profil dan autentikasi pengguna.
- `teachers`, `students`, `classes`, `subjects`: Master data.
- `assignments`, `schedules`: Penugasan dan jadwal mengajar.
- `journals`, `attendance`: Rekam aktivitas harian dan kehadiran.
- `learningPlans`, `assessments`, `grades`, `reports`: Dokumen akademis dan rekap nilai/rapor.

## 7. Storage
File fisik disimpan di Firebase Storage pada bucket `documents/` atau sub-direktori lainnya. Aturan keamanan (`storage.rules`) diperlukan untuk mengamankan data pengguna.

## 8. Security Rules
Aturan keamanan Firestore dirancang untuk menerapkan akses *Role-Based Access Control* (RBAC):
- `admin` memiliki akses mutasi (Create, Update, Delete) ke seluruh master data dan konfigurasi sistem.
- `headmaster` memiliki akses `read` secara global ke seluruh koleksi, tanpa izin mutasi.
- `guru` hanya dapat melihat, menambah, atau memodifikasi data yang secara logis terhubung dengan ID pengguna mereka atau tugas yang diberikan.

## 9. Environment Variables
Buat file `.env` di root project Anda dengan parameter berikut:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 10. Development
Aplikasi menggunakan:
- Vite + React 18 (TypeScript)
- Tailwind CSS untuk styling
- Lucide React untuk ikon
- React Router DOM untuk *routing*

## 11. Build
Jalankan kompilasi TypeScript dan bundler Vite untuk memproduksi build yang dioptimasi:
```bash
npm run lint
npm run build
```
File output akan dihasilkan di folder `dist/`.

## 12. Deployment
Aplikasi (SPA) dapat langsung dipublikasikan (di-*deploy*) menggunakan Firebase Hosting atau platform Cloud yang mendukung hosting statis (Vercel, Netlify, Cloud Run, dll).

## 13. Backup
Direkomendasikan untuk secara rutin mengekspor basis data Firestore menggunakan fitur *Firestore Export* via Google Cloud Console, minimal satu kali per semester (atau sebelum kenaikan kelas).

## 14. Troubleshooting
- **Tidak bisa login?** Pastikan akun telah diregistrasi oleh Admin dan konfigurasi `users` pada Firestore valid.
- **Data kosong di dashboard?** Pastikan role Anda diset dengan benar (contoh: `admin` tidak akan melihat data guru spesifik di dashboard, ia melihat _System Overview_).
- **Tombol fungsi tidak berfungsi?** Periksa *Developer Console* browser untuk pesan *Permission Denied*. Jika terjadi, verifikasikan aturan Firestore Rules terbaru di konsol Firebase Anda.

const fs = require('fs');

const path = 'src/services/calendarService.ts';
let content = fs.readFileSync(path, 'utf8');

const newMethod = `
  async syncKemenagCalendar(academicYear: string = '2026/2027'): Promise<void> {
    const KEMENAG_EVENTS = [
      {
        title: 'Hari Amal Bakti (HAB) Kemenag RI',
        description: 'Upacara peringatan Hari Amal Bakti Kementerian Agama Republik Indonesia.',
        startDate: '2027-01-03',
        endDate: '2027-01-03',
        startTime: '07:30',
        endTime: '10:00',
        type: 'Keagamaan',
        academicYear,
        semester: 'Genap',
        location: 'Halaman Madrasah / Kemenag Kota',
        targetAudience: 'Semua',
        color: '#10b981',
        createdBy: 'system',
        createdByName: 'Sinkronisasi Kemenag'
      },
      {
        title: 'Awal Masuk Sekolah (Semester Ganjil)',
        description: 'Hari pertama masuk sekolah tahun ajaran baru sesuai kalender pendidikan Kemenag.',
        startDate: '2026-07-13',
        endDate: '2026-07-13',
        startTime: '07:00',
        endTime: '12:00',
        type: 'Kegiatan Madrasah',
        academicYear,
        semester: 'Ganjil',
        location: 'Lingkungan Madrasah',
        targetAudience: 'Semua',
        color: '#3b82f6',
        createdBy: 'system',
        createdByName: 'Sinkronisasi Kemenag'
      },
      {
        title: 'Asesmen Madrasah (AM) Utama',
        description: 'Pelaksanaan Asesmen Madrasah (Ujian Akhir Madrasah) berstandar nasional.',
        startDate: '2027-04-12',
        endDate: '2027-04-17',
        startTime: '07:30',
        endTime: '12:00',
        type: 'Ujian',
        academicYear,
        semester: 'Genap',
        location: 'Ruang Kelas',
        targetAudience: 'Siswa',
        color: '#ef4444',
        createdBy: 'system',
        createdByName: 'Sinkronisasi Kemenag'
      },
      {
        title: 'Peringatan Hari Santri Nasional',
        description: 'Apel akbar peringatan Hari Santri Nasional di tingkat madrasah dan kemenag setempat.',
        startDate: '2026-10-22',
        endDate: '2026-10-22',
        startTime: '07:30',
        endTime: '10:00',
        type: 'Keagamaan',
        academicYear,
        semester: 'Ganjil',
        location: 'Lapangan Upacara',
        targetAudience: 'Semua',
        color: '#14b8a6',
        createdBy: 'system',
        createdByName: 'Sinkronisasi Kemenag'
      },
      {
        title: 'Libur Awal Ramadhan 1448 H',
        description: 'Libur khusus menyambut awal bulan suci Ramadhan sesuai edaran Dirjen Pendis.',
        startDate: '2027-03-09',
        endDate: '2027-03-10',
        startTime: '00:00',
        endTime: '23:59',
        type: 'Libur',
        academicYear,
        semester: 'Genap',
        location: '-',
        targetAudience: 'Semua',
        isHoliday: true,
        color: '#8b5cf6',
        createdBy: 'system',
        createdByName: 'Sinkronisasi Kemenag'
      },
      {
        title: 'Libur Hari Raya Idul Fitri 1448 H',
        description: 'Libur cuti bersama Hari Raya Idul Fitri.',
        startDate: '2027-04-06',
        endDate: '2027-04-12',
        startTime: '00:00',
        endTime: '23:59',
        type: 'Libur',
        academicYear,
        semester: 'Genap',
        location: '-',
        targetAudience: 'Semua',
        isHoliday: true,
        color: '#d946ef',
        createdBy: 'system',
        createdByName: 'Sinkronisasi Kemenag'
      }
    ];

    const timestamp = new Date().toISOString();
    for (const evt of KEMENAG_EVENTS) {
      // Basic check if event already exists
      const q = query(
        collection(db, 'calendarEvents'),
        where('title', '==', evt.title),
        where('academicYear', '==', evt.academicYear)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        await addDoc(collection(db, 'calendarEvents'), {
          ...evt,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    }
  }
`;

content = content.replace(/};\s*$/, newMethod + '\n};\n');
fs.writeFileSync(path, content, 'utf8');


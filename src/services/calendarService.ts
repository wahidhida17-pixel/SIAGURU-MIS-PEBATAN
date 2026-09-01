import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { CalendarEvent, CalendarEventType } from '../types/calendar';
import type { Semester } from '../types/academic';
import { auditService } from './auditService';

export const INITIAL_MADRASAH_EVENTS: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Upacara HUT Kemerdekaan RI Ke-81 & Karnaval',
    description: 'Upacara bendera peringatan hari kemerdekaan di lapangan madrasah dan pawai karnaval santri.',
    startDate: '2026-08-17',
    endDate: '2026-08-17',
    startTime: '07:30',
    endTime: '11:00',
    type: 'Kegiatan Madrasah',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Lapangan MI Syuriyah Pebatan',
    targetAudience: 'Semua',
    isHoliday: false,
    color: '#ef4444',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Kegiatan Perkemahan Jamran Pramuka Penggalang',
    description: 'Jambore Ranting gerakan pramuka tingkat Kwartir Ranting.',
    startDate: '2026-08-28',
    endDate: '2026-08-30',
    startTime: '08:00',
    endTime: '16:00',
    type: 'Pramuka',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Bumi Perkemahan Pebatan',
    targetAudience: 'Semua',
    color: '#854d0e',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Rapat Koordinasi Evaluasi Pembelajaran & Supervisi',
    description: 'Rapat dewan guru dan kepala madrasah mengenai evaluasi modul ajar dan ketertiban administrasi.',
    startDate: '2026-09-05',
    endDate: '2026-09-05',
    startTime: '09:00',
    endTime: '11:30',
    type: 'Rapat',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Ruang Guru MI Syuriyah',
    targetAudience: 'Guru',
    color: '#3b82f6',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Penilaian Tengah Semester (PTS) Ganjil',
    description: 'Pelaksanaan asesmen sumatif tengah semester untuk seluruh jenjang kelas 1-6.',
    startDate: '2026-09-21',
    endDate: '2026-09-26',
    startTime: '07:30',
    endTime: '12:00',
    type: 'PTS',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Ruang Kelas 1 - 6',
    targetAudience: 'Semua',
    color: '#8b5cf6',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Peringatan Maulid Nabi Muhammad SAW 1448 H',
    description: 'Pengajian akbar dan lomba keagamaan (Tahfidz, Adzan, Kaligrafi, Da\'i Cilik).',
    startDate: '2026-09-24',
    endDate: '2026-09-24',
    startTime: '08:00',
    endTime: '12:30',
    type: 'Keagamaan',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Halaman Madrasah & Masjid',
    targetAudience: 'Semua',
    color: '#10b981',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Peringatan Hari Santri Nasional 2026',
    description: 'Apel akbar Hari Santri dan kirab santri MI Syuriyah Pebatan.',
    startDate: '2026-10-22',
    endDate: '2026-10-22',
    startTime: '07:00',
    endTime: '10:30',
    type: 'Keagamaan',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Lapangan Kecamatan',
    targetAudience: 'Semua',
    color: '#059669',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Peringatan Hari Guru Nasional & Harlah Madrasah',
    description: 'Upacara peringatan HGN dan tasyakuran kebersamaan guru dan komite.',
    startDate: '2026-11-25',
    endDate: '2026-11-25',
    startTime: '08:00',
    endTime: '11:00',
    type: 'Kegiatan Guru',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Ruang Aula Madrasah',
    targetAudience: 'Guru',
    color: '#f59e0b',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Penilaian Akhir Semester (PAS) Ganjil',
    description: 'Pelaksanaan asesmen sumatif akhir semester ganjil T.P. 2026/2027.',
    startDate: '2026-12-01',
    endDate: '2026-12-08',
    startTime: '07:30',
    endTime: '12:00',
    type: 'PAS',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Ruang Kelas 1 - 6',
    targetAudience: 'Semua',
    color: '#ec4899',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Pekan Olahraga & Seni (Porseni) Antar Kelas',
    description: 'Pertandingan futsal, bulutangkis, catur, puisi religi, dan pildacil pasca PAS.',
    startDate: '2026-12-10',
    endDate: '2026-12-15',
    startTime: '08:00',
    endTime: '12:00',
    type: 'Olahraga',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Kompleks Olahraga Madrasah',
    targetAudience: 'Siswa',
    color: '#0284c7',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  },
  {
    title: 'Pembagian Buku Laporan Hasil Belajar (Rapor)',
    description: 'Penerimaan rapor semester ganjil oleh wali murid di kelas masing-masing.',
    startDate: '2026-12-19',
    endDate: '2026-12-19',
    startTime: '08:00',
    endTime: '11:30',
    type: 'Kegiatan Madrasah',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    location: 'Ruang Kelas 1 - 6',
    targetAudience: 'Semua',
    color: '#6366f1',
    createdBy: 'system',
    createdByName: 'Admin Madrasah'
  }
];

export const calendarService = {
  async getEvents(filters?: {
    academicYear?: string;
    semester?: Semester | 'all';
    type?: CalendarEventType | 'all';
    month?: string; // YYYY-MM
    targetAudience?: string;
    search?: string;
  }): Promise<CalendarEvent[]> {
    try {
      const q = query(collection(db, 'calendarEvents'), orderBy('startDate', 'asc'));
      const snapshot = await getDocs(q);
      let events = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent));

      if (events.length === 0) {
        await this.seedDefaultEvents();
        return this.getEvents(filters);
      }

      if (filters?.academicYear && filters.academicYear !== 'all') {
        events = events.filter(e => e.academicYear === filters.academicYear);
      }

      if (filters?.semester && filters.semester !== 'all') {
        events = events.filter(e => e.semester === filters.semester);
      }

      if (filters?.type && filters.type !== 'all') {
        events = events.filter(e => e.type === filters.type);
      }

      if (filters?.month) {
        events = events.filter(
          e => e.startDate.startsWith(filters.month!) || e.endDate.startsWith(filters.month!)
        );
      }

      if (filters?.targetAudience && filters.targetAudience !== 'all') {
        events = events.filter(
          e => e.targetAudience === 'Semua' || e.targetAudience === filters.targetAudience
        );
      }

      if (filters?.search && filters.search.trim() !== '') {
        const queryTerm = filters.search.toLowerCase().trim();
        events = events.filter(
          e =>
            e.title.toLowerCase().includes(queryTerm) ||
            e.description.toLowerCase().includes(queryTerm) ||
            (e.location || '').toLowerCase().includes(queryTerm)
        );
      }

      return events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  },

  async seedDefaultEvents(): Promise<void> {
    const timestamp = new Date().toISOString();
    for (const evt of INITIAL_MADRASAH_EVENTS) {
      await addDoc(collection(db, 'calendarEvents'), {
        ...evt,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
  },

  async getEventById(id: string): Promise<CalendarEvent | null> {
    try {
      const docRef = doc(db, 'calendarEvents', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as CalendarEvent;
    } catch (error) {
      console.error('Error getting event by id:', error);
      return null;
    }
  },

  async createEvent(
    data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
    currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const payload = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const docRef = await addDoc(collection(db, 'calendarEvents'), payload);

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'CREATE',
        'KALENDER',
        docRef.id,
        `Menambahkan agenda kalender "${data.title}" (${data.startDate} s.d. ${data.endDate})`
      );
    }

    return docRef.id;
  },

  async updateEvent(
    id: string,
    data: Partial<CalendarEvent>,
    currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }
  ): Promise<void> {
    const docRef = doc(db, 'calendarEvents', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'UPDATE',
        'KALENDER',
        id,
        `Memperbarui agenda kalender "${data.title || id}"`
      );
    }
  },

  async deleteEvent(id: string, currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }): Promise<void> {
    await deleteDoc(doc(db, 'calendarEvents', id));
    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'DELETE',
        'KALENDER',
        id,
        `Menghapus agenda kalender ID: ${id}`
      );
    }
  },

  async saveEventReport(
    eventId: string,
    reportData: CalendarEvent['reportData'],
    currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }
  ): Promise<void> {
    const docRef = doc(db, 'calendarEvents', eventId);
    await updateDoc(docRef, {
      reportData: {
        ...reportData,
        recordedAt: new Date().toISOString(),
        recordedBy: currentUser?.name || currentUser?.displayName || 'Administrator'
      },
      updatedAt: new Date().toISOString()
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'REPORT_EVENT',
        'KALENDER',
        eventId,
        `Mencatat ${reportData?.type || 'laporan'} kegiatan kalender ID: ${eventId}`
      );
    }
  },

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

};

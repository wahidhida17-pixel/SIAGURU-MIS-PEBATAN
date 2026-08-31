import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { GeneralSettings } from '../types/academic';

export const DEFAULT_SCHOOL_SETTINGS: GeneralSettings = {
  schoolName: "MI Syuriyah Pebatan",
  schoolLevel: "Madrasah Ibtidaiyah",
  schoolStatus: "Swasta",
  foundationName: "Yayasan Pendidikan dan Sosial Syuriyah",
  npsn: "60712345",
  nsm: "111233290001",
  nss: "112321306001",
  accreditation: "A (Unggul)",
  accreditationNo: "134/BAN-SM/SK/2023",
  curriculum: "Kurikulum Merdeka",

  principalName: "H. AHMAD SYAFI'I, S.Pd.I",
  principalNip: "197505122005011003",
  principalSignatureURL: "",
  signaturePlace: "Pebatan",
  vicePrincipalName: "Wahid Hidayat, S.Pd",
  treasurerName: "Siti Masitoh, S.Pd",
  committeeHeadName: "H. Mustofa, M.Ag",

  academicYear: "2026/2027",
  semester: "Ganjil",
  semesterStartDate: "2026-07-13",
  semesterEndDate: "2026-12-20",
  reportDateGanjil: "2026-12-19",
  reportDateGenap: "2027-06-26",

  logoURL: "",
  logoFoundationURL: "",
  stampURL: "",

  address: "Jl. KH. Syuriyah No. 12, Pebatan",
  rtRw: "003/002",
  village: "Pebatan",
  district: "Pusakajaya",
  city: "Kab. Subang",
  province: "Jawa Barat",
  postalCode: "41255",
  phone: "(0260) 123456",
  fax: "(0260) 123457",
  email: "misyuriyahpebatan@gmail.com",
  website: "https://misyuriyahpebatan.sch.id",

  letterheadLine1: "YAYASAN PENDIDIKAN DAN SOSIAL SYURIYAH",
  letterheadLine2: "KANTOR KEMENTERIAN AGAMA KABUPATEN SUBANG",
  letterheadLine3: "MADRASAH IBTIDAIYAH SYURIYAH PEBATAN",
  letterheadLine4: "Jl. KH. Syuriyah No. 12, Pebatan, Kec. Pusakajaya, Kab. Subang 41255 | Telp: (0260) 123456",
  showDoubleLine: true,
  autoStampInReports: true,

  updatedAt: new Date().toISOString()
};

export const settingsService = {
  async getGeneralSettings(): Promise<GeneralSettings | null> {
    try {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as GeneralSettings;
        return {
          ...DEFAULT_SCHOOL_SETTINGS,
          ...data
        };
      }
      
      // Otomatis membuat konfigurasi di database jika belum ada
      await setDoc(docRef, DEFAULT_SCHOOL_SETTINGS);
    } catch (error) {
      console.warn("Menggunakan pengaturan default:", error);
    }

    return DEFAULT_SCHOOL_SETTINGS;
  },

  subscribeGeneralSettings(callback: (settings: GeneralSettings) => void): () => void {
    const docRef = doc(db, 'settings', 'general');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({
          ...DEFAULT_SCHOOL_SETTINGS,
          ...(docSnap.data() as GeneralSettings)
        });
      } else {
        callback(DEFAULT_SCHOOL_SETTINGS);
      }
    }, (error) => {
      console.warn("Error listening to settings:", error);
      callback(DEFAULT_SCHOOL_SETTINGS);
    });
  },

  async updateGeneralSettings(data: Partial<GeneralSettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'general');
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  }
};

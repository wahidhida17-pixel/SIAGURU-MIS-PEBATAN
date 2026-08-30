import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { GeneralSettings } from '../types/academic';

export const settingsService = {
  async getGeneralSettings(): Promise<GeneralSettings | null> {
    const defaultSettings: GeneralSettings = {
      schoolName: "MI Syuriyah Pebatan",
      schoolLevel: "Madrasah Ibtidaiyah",
      npsn: "60712345",
      nsm: "111233290001",
      principalName: "H. AHMAD SYAFI'I, S.Pd.I",
      principalNip: "197505122005011003",
      academicYear: "2026/2027",
      semester: "Ganjil",
      logoURL: "",
      address: "Jl. KH. Syuriyah No. 12, Pebatan, Kec. Pusakajaya, Kab. Subang",
      phone: "(0260) 123456",
      email: "misyuriyahpebatan@gmail.com",
      updatedAt: new Date().toISOString() as any
    };

    try {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as GeneralSettings;
      }
      
      // Otomatis membuat konfigurasi di database jika belum ada
      await setDoc(docRef, defaultSettings);
    } catch (error) {
      console.warn("Menggunakan pengaturan default:", error);
    }

    return defaultSettings;
  },

  async updateGeneralSettings(data: Partial<GeneralSettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'general');
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  }
};

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';
import { auth } from '../firebase/auth';
import app from '../firebase/config';
import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { userService } from './userService';
import type { UserProfile, UserRole } from '../types/user';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return userCredential.user;
  },

  async register(
    email: string, 
    password: string, 
    displayName?: string, 
    role: UserRole = 'admin'
  ): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const userProfile: UserProfile = {
      uid: user.uid,
      email: email.trim(),
      displayName: displayName || email.split('@')[0],
      role: role,
      teacherId: null,
      photoURL: user.photoURL || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await userService.createUserProfile(userProfile);
    } catch (e) {
      console.warn('Could not write initial profile to firestore:', e);
    }

    return user;
  },

  async createSecondaryUser(email: string, password: string): Promise<User> {
    const appName = `SecondaryApp_${Date.now()}`;
    const secondaryApp = initializeApp(app.options, appName);
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
      const user = userCredential.user;
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      return user;
    } catch (error) {
      try {
        await deleteApp(secondaryApp);
      } catch {
        // ignore cleanup error
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  getFriendlyErrorMessage(err: any): string {
    if (!err) return 'Terjadi kesalahan pada sistem.';
    const code = err.code || '';
    const message = err.message || '';

    if (
      code === 'auth/invalid-credential' || 
      code === 'auth/invalid-login-credentials' || 
      code === 'auth/wrong-password' || 
      code === 'auth/user-not-found'
    ) {
      return 'Email atau password yang Anda masukkan salah. Pastikan akun sudah terdaftar.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Alamat email ini sudah terdaftar. Silakan masuk menggunakan menu Masuk.';
    }
    if (code === 'auth/invalid-email') {
      return 'Format alamat email tidak valid.';
    }
    if (code === 'auth/weak-password') {
      return 'Password terlalu singkat atau lemah. Gunakan minimal 6 karakter.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Terlalu banyak percobaan gagal. Akses dibatasi sementara demi keamanan. Silakan coba lagi beberapa saat atau gunakan Lupa Password.';
    }
    if (code === 'auth/user-disabled') {
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Koneksi jaringan terputus. Periksa koneksi internet Anda dan coba lagi.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Metode login Email/Password belum diaktifkan di Firebase Console.';
    }
    
    return message || 'Terjadi kesalahan saat otentikasi.';
  }
};


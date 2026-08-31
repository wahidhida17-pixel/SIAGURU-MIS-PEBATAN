import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { auth } from '../firebase/auth';
import type { UserProfile } from '../types/user';

export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }

      // If document doesn't exist yet, construct and persist a sensible default profile
      const currentAuthUser = auth.currentUser;
      const userEmail = currentAuthUser?.email || '';
      let defaultRole: 'admin' | 'guru' | 'headmaster' = 'admin';
      if (userEmail.includes('guru')) defaultRole = 'guru';
      else if (userEmail.includes('kamad') || userEmail.includes('kepala')) defaultRole = 'headmaster';

      const fallbackProfile: UserProfile = {
        uid,
        email: userEmail,
        displayName: currentAuthUser?.displayName || (userEmail ? userEmail.split('@')[0] : 'Pengguna'),
        role: defaultRole,
        teacherId: null,
        photoURL: currentAuthUser?.photoURL || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(docRef, fallbackProfile, { merge: true });
      } catch (writeErr) {
        console.warn('Could not write fallback profile to Firestore:', writeErr);
      }

      return fallbackProfile;
    } catch (err) {
      console.warn('Error fetching user profile from Firestore:', err);
      // Even if Firestore read fails, return fallback based on authenticated user
      const currentAuthUser = auth.currentUser;
      if (currentAuthUser && currentAuthUser.uid === uid) {
        const userEmail = currentAuthUser.email || '';
        let defaultRole: 'admin' | 'guru' | 'headmaster' = 'admin';
        if (userEmail.includes('guru')) defaultRole = 'guru';
        else if (userEmail.includes('kamad') || userEmail.includes('kepala')) defaultRole = 'headmaster';

        return {
          uid,
          email: userEmail,
          displayName: currentAuthUser.displayName || (userEmail ? userEmail.split('@')[0] : 'Pengguna'),
          role: defaultRole,
          teacherId: null,
          photoURL: currentAuthUser.photoURL || null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return null;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    } catch (err) {
      console.warn('Error fetching all users:', err);
      return [];
    }
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, profile);
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteUserProfile(uid: string): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await deleteDoc(docRef);
  },

};

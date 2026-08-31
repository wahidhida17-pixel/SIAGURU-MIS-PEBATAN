const fs = require('fs');

const path = 'src/services/userService.ts';
let content = fs.readFileSync(path, 'utf8');

// Add imports
content = content.replace(/import \{ doc, getDoc, setDoc \} from 'firebase\/firestore';/, 
`import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query } from 'firebase/firestore';`);

// Add methods before final };
const newMethods = `
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
`;

content = content.replace(/};\s*$/, newMethods + '\n};\n');
fs.writeFileSync(path, content, 'utf8');


export type UserRole = 'admin' | 'guru' | 'headmaster';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teacherId: string | null;
  photoURL: string | null;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

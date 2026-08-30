import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/auth';
import { userService } from '../services/userService';
import type { UserProfile, UserRole } from '../types/user';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (uid?: string) => {
    const targetUid = uid || currentUser?.uid;
    if (targetUid) {
      const profile = await userService.getUserProfile(targetUid);
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await refreshProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      role: userProfile?.role || (currentUser?.email?.includes('guru') ? 'guru' : currentUser?.email?.includes('kamad') ? 'headmaster' : 'admin'),
      loading,
      isAuthenticated: !!currentUser && (userProfile ? userProfile.isActive !== false : true),
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

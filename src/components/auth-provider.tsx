'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase';
import { createUserProfileDocument } from '@/lib/user-service';

interface AuthContextType {
  user: User | null;
  is_admin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, is_admin: false, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [is_admin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        createUserProfileDocument(user);
        // Admin status is now determined by UID, not custom claims
        const isAdmin = user.uid === 'VT5YjCvGZOcgNOCknKkmspw2E9y2';
        setIsAdmin(isAdmin);
      } else {
        setIsAdmin(false);
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, is_admin, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInAnonymously, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Attempt to set local persistence, fallback to memory
    setPersistence(auth, browserLocalPersistence).catch(() => {
      return setPersistence(auth, inMemoryPersistence);
    }).then(() => {
      unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u) {
          setUser(u);
          setLoading(false);
        } else {
          try {
            await signInAnonymously(auth);
          } catch (err) {
            console.error("Auto anonymous sign-in failed", err);
            setLoading(false);
          }
        }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signIn = async () => {
    try {
      const result = await signInAnonymously(auth);
      setUser(result.user);
    } catch (e: any) {
      console.error("Anonymous Sign in failed", e);
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

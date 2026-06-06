import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  masteryXp: number;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateMasteryXp: (xp: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [masteryXp, setMasteryXp] = useState<number>(0);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true); // Re-trigger loading state when user auth changes
        const docRef = doc(db, 'users', currentUser.uid);
        
        // Use onSnapshot for real-time updates and faster local caching
        unsubscribeSnapshot = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            setMasteryXp(docSnap.data().currentXp || 0);
          } else {
            // Document doesn't exist, create it with 0
            try {
              await setDoc(docRef, { currentXp: 0, updatedAt: serverTimestamp() });
            } catch (err) {
              console.error("Error creating initial profile", err);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data", error);
          setLoading(false);
        });
      } else {
        setMasteryXp(0);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateMasteryXp = async (newXp: number) => {
    setMasteryXp(newXp);
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { currentXp: newXp, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error updating mastery XP in Firestore", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, masteryXp, signInWithGoogle, logout, updateMasteryXp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

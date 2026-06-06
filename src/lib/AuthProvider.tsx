import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isPlaceholderConfig } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  masteryXp: number;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateMasteryXp: (xp: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [masteryXp, setMasteryXp] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    
    if (isPlaceholderConfig) {
      setAuthError("Firebase API configuration is missing on this site. Please add your Netlify environment variables (see instructions in chat).");
      setLoading(false);
      return;
    }

    // Migrate legacy local storage key to the offline/guest key if any offline configuration is not yet created
    try {
      const legacyXp = localStorage.getItem('calcmr_mastery_xp');
      if (legacyXp !== null && localStorage.getItem('calcmr_mastery_xp_offline') === null) {
        localStorage.setItem('calcmr_mastery_xp_offline', legacyXp);
        localStorage.removeItem('calcmr_mastery_xp');
      }
    } catch (e) {
      console.warn("Storage migration failed", e);
    }

    // Handle redirect results for users returning to the app from custom domains
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Successfully logged in via redirect:", result.user);
          setAuthError(null);
        }
      })
      .catch((error: any) => {
        console.error("Redirect auth error:", error);
        setAuthError(error.message || "Failed to complete sign-in from redirect.");
      });
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Unsubscribe from any previous snapshot listener to prevent cross-account triggers/leaks
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      setUser(currentUser);
      if (currentUser) {
        setLoading(true); // Re-trigger loading state when user auth changes
        const docRef = doc(db, 'users', currentUser.uid);
        
        // Use onSnapshot for real-time updates and faster local caching
        unsubscribeSnapshot = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const serverXp = docSnap.data().currentXp || 0;
            setMasteryXp(serverXp);
            // Save to user-specific local storage
            localStorage.setItem(`calcmr_mastery_xp_${currentUser.uid}`, serverXp.toString());
          } else {
            // Document doesn't exist, migration from anonymous guest/offline local storage to user account
            try {
              const offlineXpStr = localStorage.getItem('calcmr_mastery_xp_offline');
              const initialXp = offlineXpStr ? parseInt(offlineXpStr, 10) : 0;
              await setDoc(docRef, { currentXp: initialXp, updatedAt: serverTimestamp() });
              setMasteryXp(initialXp);
              
              // Persist locally for this user
              localStorage.setItem(`calcmr_mastery_xp_${currentUser.uid}`, initialXp.toString());
              
              // Since the offline data has been migrated, remove it so subsequent logins (or other users)
              // don't try to migrate the same legacy/offline data again
              localStorage.removeItem('calcmr_mastery_xp_offline');
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
        // If logged out or unauthenticated, retrieve the guest/offline storage value
        const offlineXpStr = localStorage.getItem('calcmr_mastery_xp_offline');
        setMasteryXp(offlineXpStr ? parseInt(offlineXpStr, 10) : 0);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    if (isPlaceholderConfig) {
      setAuthError("Firebase API configuration is missing. You need to configure Netlify environment variables to enable login.");
      return;
    }
    
    try {
      // With our dynamic authDomain and public/_redirects Netlify proxy configured,
      // signInWithPopup works flawlessly on custom domains without cross-origin blockage.
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      setAuthError(error.message || "An authentication error occurred.");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateMasteryXp = async (newXp: number) => {
    setMasteryXp(newXp);
    if (user) {
      localStorage.setItem(`calcmr_mastery_xp_${user.uid}`, newXp.toString());
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { currentXp: newXp, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error updating mastery XP in Firestore", error);
      }
    } else {
      localStorage.setItem('calcmr_mastery_xp_offline', newXp.toString());
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, masteryXp, authError, signInWithGoogle, logout, updateMasteryXp }}>
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

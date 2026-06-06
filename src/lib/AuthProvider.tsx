import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isPlaceholderConfig } from './firebase';
import { getCurrentRank } from './calc';

export interface XpHistoryItem {
  id: string;
  xp: number;
  rankNumber: number;
  rankName: string;
  timestamp: number;
  note?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  masteryXp: number;
  xpHistory: XpHistoryItem[];
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateMasteryXp: (xp: number, preventHistoryAdded?: boolean) => Promise<void>;
  addHistoryEntry: (xp: number, note?: string) => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  updateHistoryEntryNote: (id: string, note: string) => Promise<void>;
  clearXpHistory: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createHistoryItem = (xp: number, note?: string): XpHistoryItem => {
  const rank = getCurrentRank(xp);
  return {
    id: Math.random().toString(36).substring(2, 11),
    xp,
    rankNumber: rank.rankNumber,
    rankName: rank.rankName,
    timestamp: Date.now(),
    note: note || '',
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [masteryXp, setMasteryXp] = useState<number>(0);
  const [xpHistory, setXpHistory] = useState<XpHistoryItem[]>([]);
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
        setMasteryXp(0); // Immediately clear the visual state to prevent bleed-over!
        setXpHistory([]); // Immediately clear history to prevent bleed-over!
        const docRef = doc(db, 'users', currentUser.uid);
        
        // Use onSnapshot for real-time updates and faster local caching
        unsubscribeSnapshot = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const serverXp = docSnap.data().currentXp || 0;
            const serverHistory = docSnap.data().history || [];
            setMasteryXp(serverXp);
            setXpHistory(serverHistory);
            // Save to user-specific local storage
            localStorage.setItem(`calcmr_mastery_xp_${currentUser.uid}`, serverXp.toString());
          } else {
            // Document doesn't exist, migration from anonymous guest/offline local storage to user account
            try {
              const offlineXpStr = localStorage.getItem('calcmr_mastery_xp_offline');
              const initialXp = offlineXpStr ? parseInt(offlineXpStr, 10) : 0;
              
              const offlineHistoryStr = localStorage.getItem('calcmr_xp_history_offline');
              let initialHistory: XpHistoryItem[] = [];
              if (offlineHistoryStr) {
                try {
                  initialHistory = JSON.parse(offlineHistoryStr);
                } catch (e) {
                  console.warn("Error parsing offline history", e);
                }
              }

              // Create initial cloud-synced document representing fully migrated guest progress
              await setDoc(docRef, { 
                currentXp: initialXp, 
                history: initialHistory,
                updatedAt: serverTimestamp() 
              });
              setMasteryXp(initialXp);
              setXpHistory(initialHistory);
              
              // Persist locally for this user
              localStorage.setItem(`calcmr_mastery_xp_${currentUser.uid}`, initialXp.toString());
              
              // Clear guest modifications since they're securely persisted in the new account profile
              localStorage.removeItem('calcmr_mastery_xp_offline');
              localStorage.removeItem('calcmr_xp_history_offline');
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

        const offlineHistoryStr = localStorage.getItem('calcmr_xp_history_offline');
        if (offlineHistoryStr) {
          try {
            setXpHistory(JSON.parse(offlineHistoryStr));
          } catch (e) {
            setXpHistory([]);
          }
        } else {
          setXpHistory([]);
        }
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
      localStorage.removeItem('calcmr_mastery_xp_offline');
      localStorage.removeItem('calcmr_xp_history_offline');
      setXpHistory([]);
      await signOut(auth);
      setAuthError(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateMasteryXp = async (newXp: number, preventHistoryAdded: boolean = false) => {
    setMasteryXp(newXp);
    const currentAuthUser = auth.currentUser;

    let updatedHistory = [...xpHistory];
    if (!preventHistoryAdded && newXp > 0) {
      const lastItemXP = xpHistory.length > 0 ? xpHistory[0].xp : null;
      if (newXp !== lastItemXP) {
        const newItem = createHistoryItem(newXp);
        updatedHistory = [newItem, ...xpHistory];
      }
    }

    if (currentAuthUser) {
      localStorage.setItem(`calcmr_mastery_xp_${currentAuthUser.uid}`, newXp.toString());
      try {
        const docRef = doc(db, 'users', currentAuthUser.uid);
        const dataToSave: any = { currentXp: newXp, updatedAt: serverTimestamp() };
        if (!preventHistoryAdded && newXp > 0) {
          dataToSave.history = updatedHistory;
        }
        await setDoc(docRef, dataToSave, { merge: true });
      } catch (error) {
        console.error("Error updating mastery XP in Firestore", error);
      }
    } else {
      localStorage.setItem('calcmr_mastery_xp_offline', newXp.toString());
      if (!preventHistoryAdded && newXp > 0) {
        setXpHistory(updatedHistory);
        localStorage.setItem('calcmr_xp_history_offline', JSON.stringify(updatedHistory));
      }
    }
  };

  const addHistoryEntry = async (xp: number, note?: string) => {
    const newItem = createHistoryItem(xp, note);
    const updatedHistory = [newItem, ...xpHistory];
    const currentAuthUser = auth.currentUser;
    
    if (currentAuthUser) {
      try {
        const docRef = doc(db, 'users', currentAuthUser.uid);
        await setDoc(docRef, { history: updatedHistory, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error adding history entry in Firestore", error);
      }
    } else {
      setXpHistory(updatedHistory);
      localStorage.setItem('calcmr_xp_history_offline', JSON.stringify(updatedHistory));
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    const updatedHistory = xpHistory.filter(item => item.id !== id);
    const currentAuthUser = auth.currentUser;
    
    if (currentAuthUser) {
      try {
        const docRef = doc(db, 'users', currentAuthUser.uid);
        await setDoc(docRef, { history: updatedHistory, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error deleting history entry in Firestore", error);
      }
    } else {
      setXpHistory(updatedHistory);
      localStorage.setItem('calcmr_xp_history_offline', JSON.stringify(updatedHistory));
    }
  };

  const updateHistoryEntryNote = async (id: string, note: string) => {
    const updatedHistory = xpHistory.map(item => item.id === id ? { ...item, note } : item);
    const currentAuthUser = auth.currentUser;
    
    if (currentAuthUser) {
      try {
        const docRef = doc(db, 'users', currentAuthUser.uid);
        await setDoc(docRef, { history: updatedHistory, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error updating history note in Firestore", error);
      }
    } else {
      setXpHistory(updatedHistory);
      localStorage.setItem('calcmr_xp_history_offline', JSON.stringify(updatedHistory));
    }
  };

  const clearXpHistory = async () => {
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser) {
      try {
        const docRef = doc(db, 'users', currentAuthUser.uid);
        await setDoc(docRef, { history: [], updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error clearing history in Firestore", error);
      }
    } else {
      setXpHistory([]);
      localStorage.setItem('calcmr_xp_history_offline', JSON.stringify([]));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      masteryXp, 
      xpHistory, 
      authError, 
      signInWithGoogle, 
      logout, 
      updateMasteryXp,
      addHistoryEntry,
      deleteHistoryEntry,
      updateHistoryEntryNote,
      clearXpHistory
    }}>
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

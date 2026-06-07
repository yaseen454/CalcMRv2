import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import { auth, db, googleProvider, isPlaceholderConfig } from './firebase';

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
  updateMasteryXp: (xp: number) => Promise<void>;
  addHistoryEntry: (xp: number, rankNumber: number, rankName: string, note?: string) => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  clearXpHistory: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [masteryXp, setMasteryXp] = useState<number>(0);
  const [xpHistory, setXpHistory] = useState<XpHistoryItem[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    let unsubscribeHistory: (() => void) | undefined;
    
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
      // Unsubscribe from any previous snapshot listeners (profile + history) to prevent cross-account triggers/leaks (Directive 4)
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }
      if (unsubscribeHistory) {
        unsubscribeHistory();
        unsubscribeHistory = undefined;
      }

      setUser(currentUser);
      
      // Dispatch synchronous state clears at the exact memory point a valid/invalid user is parsed (Directive 3)
      setXpHistory([]);
      setMasteryXp(0);

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

              // Create initial cloud-synced document representing fully migrated guest progress
              await setDoc(docRef, { 
                currentXp: initialXp, 
                updatedAt: serverTimestamp() 
              });
              setMasteryXp(initialXp);
              
              // Persist locally for this user
              localStorage.setItem(`calcmr_mastery_xp_${currentUser.uid}`, initialXp.toString());
              
              // Clear guest modifications since they're securely persisted in the new account profile
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

        // Set up real-time listener for cost-optimized inputHistory subcollection (Directive 7)
        const historyCollRef = collection(db, 'users', currentUser.uid, 'inputHistory');
        const historyQuery = query(historyCollRef, orderBy('createdAt', 'desc'));
        
        unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
          const items: XpHistoryItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const inputStr = data.input || '';
            const parts = inputStr.split('::');
            const xp = parseInt(parts[0], 10) || 0;
            const rankNumber = parseInt(parts[1], 10) || 0;
            const rankName = parts[2] || '';
            const note = parts.slice(3).join('::') || '';
            const timestamp = data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now()) : Date.now();
            
            items.push({
              id: doc.id,
              xp,
              rankNumber,
              rankName,
              timestamp,
              note
            });
          });
          setXpHistory(items);
        }, (error) => {
          console.error("Error fetching input history", error);
        });
      } else {
        // If logged out or unauthenticated, retrieve the guest/offline storage value
        const offlineXpStr = localStorage.getItem('calcmr_mastery_xp_offline');
        setMasteryXp(offlineXpStr ? parseInt(offlineXpStr, 10) : 0);

        // Fetch offline local storage history
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
      if (unsubscribeHistory) unsubscribeHistory();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    if (isPlaceholderConfig) {
      setAuthError("Firebase API configuration is missing. You need to configure Netlify environment variables to enable login.");
      return;
    }
    
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      setAuthError(error.message || "An authentication error occurred.");
    }
  };

  const logout = async () => {
    try {
      // Synchronously wipe offline local cache synchronously immediately before logout (Directive 2 + 3)
      localStorage.removeItem('calcmr_mastery_xp_offline');
      localStorage.removeItem('calcmr_xp_history_offline');
      setXpHistory([]);
      await signOut(auth);
      setAuthError(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateMasteryXp = async (newXp: number) => {
    setMasteryXp(newXp);
    const currentAuthUser = auth.currentUser;

    if (currentAuthUser) {
      localStorage.setItem(`calcmr_mastery_xp_${currentAuthUser.uid}`, newXp.toString());
      try {
        const docRef = doc(db, 'users', currentAuthUser.uid);
        await setDoc(docRef, { currentXp: newXp, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error updating mastery XP in Firestore", error);
      }
    } else {
      localStorage.setItem('calcmr_mastery_xp_offline', newXp.toString());
    }
  };

  // Helper to generate a random alphanumeric ID matching validation requirements
  const generateSafeId = () => {
    return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
  };

  const addHistoryEntry = async (xp: number, rankNumber: number, rankName: string, note?: string) => {
    const currentAuthUser = auth.currentUser;
    const itemInput = `${xp}::${rankNumber}::${rankName}::${(note || '').trim()}`;
    const safeHistoryId = generateSafeId();

    if (currentAuthUser) {
      try {
        // Nested subcollection structured according to Directive 7
        const subcollRef = doc(db, 'users', currentAuthUser.uid, 'inputHistory', safeHistoryId);
        await setDoc(subcollRef, {
          input: itemInput,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error adding history entry in Firestore:", error);
      }
    } else {
      // Offline/Guest local storage fallback
      const newItem: XpHistoryItem = {
        id: safeHistoryId,
        xp,
        rankNumber,
        rankName,
        timestamp: Date.now(),
        note: note || ''
      };
      const offlineHistoryStr = localStorage.getItem('calcmr_xp_history_offline');
      let currentList: XpHistoryItem[] = [];
      if (offlineHistoryStr) {
        try {
          currentList = JSON.parse(offlineHistoryStr);
        } catch (e) {
          currentList = [];
        }
      }
      const updatedList = [newItem, ...currentList];
      setXpHistory(updatedList);
      localStorage.setItem('calcmr_xp_history_offline', JSON.stringify(updatedList));
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      // Local deletions are allowed in offline mode
      const updated = xpHistory.filter(item => item.id !== id);
      setXpHistory(updated);
      localStorage.setItem('calcmr_xp_history_offline', JSON.stringify(updated));
    } else {
      console.warn("Cloud-saved history logs are permanently and immutably written; deletion is client-side restricted.");
    }
  };

  const clearXpHistory = async () => {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      setXpHistory([]);
      localStorage.setItem('calcmr_xp_history_offline', '[]');
    } else {
      console.warn("Cloud-saved history logs are structurally immutable; batch deletion is client-side restricted.");
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

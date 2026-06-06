import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfigLookup from "../../firebase-applet-config.json";

const metaEnv = (import.meta as any).env || {};

// Dynamically use client environment variables if present (e.g. on Netlify), falling back to preconfigured settings
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigLookup.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLookup.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigLookup.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLookup.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLookup.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigLookup.appId,
  measurementId: (firebaseConfigLookup as any).measurementId || undefined
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

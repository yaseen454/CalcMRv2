import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Preconfigured backup settings for the project to ensure successful building
// in external environments like Netlify when build-time configuration files are ignored.
const preconfiguredConfig = {
  projectId: "calcmr-ca8a2",
  appId: "1:642013598607:web:2e5af8058629f30715b1fa",
  apiKey: "AIzaSyD4Vt80wpW2agVXIEXv0BYzuhMBkbKA0AE",
  authDomain: "calcmr-ca8a2.firebaseapp.com",
  storageBucket: "calcmr-ca8a2.firebasestorage.app",
  messagingSenderId: "642013598607",
  measurementId: "G-J1DE8VGTED"
};

// Dynamically use client environment variables if present (e.g. on Netlify), falling back to preconfigured settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || preconfiguredConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || preconfiguredConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || preconfiguredConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || preconfiguredConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || preconfiguredConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || preconfiguredConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || preconfiguredConfig.measurementId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const isPlaceholderConfig = 
  (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes("YOUR_")) && 
  (preconfiguredConfig.apiKey.includes("YOUR_"));

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

// Dynamically determine the best authDomain.
// By default, we use the Firebase-authorized calcmr-ca8a2.firebaseapp.com to prevent "redirect_uri_mismatch" errors 
// on Netlify or custom domains since this domain is pre-authorized inside the Google Cloud Console.
// If the developer explicitly configures custom domain proxying in Google Console and Firebase, they can 
// set the VITE_USE_CUSTOM_AUTH_DOMAIN environment variable to "true".
const getAuthDomain = () => {
  const defaultAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || preconfiguredConfig.authDomain;
  if (typeof window === 'undefined') {
    return defaultAuthDomain;
  }
  
  const hostname = window.location.hostname;
  const useCustomAuthDomain = import.meta.env.VITE_USE_CUSTOM_AUTH_DOMAIN === 'true';

  if (useCustomAuthDomain && 
      hostname !== 'localhost' && 
      hostname !== '127.0.0.1' && 
      !hostname.includes('run.app') && 
      !hostname.includes('googleusercontent.com')
  ) {
    return hostname;
  }
  
  return defaultAuthDomain;
};

// Dynamically use client environment variables if present (e.g. on Netlify), falling back to preconfigured settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || preconfiguredConfig.apiKey,
  authDomain: getAuthDomain(),
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

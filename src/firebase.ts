import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration with safe default fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAiPSDl_slAc3m8usISzMkj67562YudkwM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "koperasi-icms.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "koperasi-icms",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "koperasi-icms.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "248300243612",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:248300243612:web:4f3aed701f46605a033b59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfigJson from "../firebase-applet-config.json";

// Cast configuration as any to prevent strict type failures if the file is a placeholder empty object
const configData = firebaseConfigJson as any;

// Use environment variables if available (for Vercel), otherwise fallback to local JSON
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || configData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || configData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || configData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || configData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || configData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || configData.appId,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || configData.firestoreDatabaseId || "";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use the named database only when one is configured; otherwise fall back to
// the project's (default) database. (New project dicky-portfolio-83529 uses
// the default DB, so firestoreDatabaseId is empty.)
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);
export const storage = getStorage(app);

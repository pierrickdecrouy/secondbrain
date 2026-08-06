import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

// Helper to remove undefined values before saving to Firestore
export const prepareForFirebase = <T extends Record<string, any>>(obj: T): T => {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) {
            continue;
        }
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            sanitized[key] = sanitizeForFirebase(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized as T;
};

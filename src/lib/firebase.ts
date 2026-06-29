import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7xL4k8T8tily6Ia8WtcHtdQmyPIoN8BY",
  authDomain: "xtnd-a77a5.firebaseapp.com",
  projectId: "xtnd-a77a5",
  storageBucket: "xtnd-a77a5.firebasestorage.app",
  messagingSenderId: "642704687075",
  appId: "1:642704687075:web:e6b69274011223d0e02ad6",
  measurementId: "G-3EQFZ0YBLH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
        console.warn("Firebase persistence: Multiple tabs open.");
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn("Firebase persistence: Browser not supported.");
    }
});

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB9AG1gnBOdoKm8flBER49fbtlVjfs5M3c",
  authDomain: "studium-math.firebaseapp.com",
  projectId: "studium-math",
  storageBucket: "studium-math.firebasestorage.app",
  messagingSenderId: "415314029997",
  appId: "1:415314029997:web:94b7356ae93c85c5870524",
  measurementId: "G-C4WW91NF2Z"
};

// Initialize Firebase
let app;
try {
  app = getApp();
} catch {
  app = initializeApp(firebaseConfig);
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 
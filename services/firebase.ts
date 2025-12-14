import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC2S0hs6S2yWHdGDobfXmAVsYKuZG-2uk0",
  authDomain: "rccestimator.firebaseapp.com",
  projectId: "rccestimator",
  storageBucket: "rccestimator.firebasestorage.app",
  messagingSenderId: "533314966966",
  appId: "1:533314966966:web:e9ea721743a2395d08dd17",
  measurementId: "G-PN5RBRCMWP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Safe Analytics Initialization
let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics could not be initialized:", e);
}
export const analytics = analyticsInstance;

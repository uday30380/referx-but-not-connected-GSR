import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configured using the keys provided for primeconnects
const firebaseConfig = {
  apiKey: "AIzaSyB_loVHXurGpzSZ25DsVWbmTfYrW-9L1jU",
  authDomain: "primeconnects.firebaseapp.com",
  projectId: "primeconnects",
  storageBucket: "primeconnects.firebasestorage.app",
  messagingSenderId: "93542498643",
  appId: "1:93542498643:web:494ed08c0be4d007e661a6",
  measurementId: "G-EV4LVC1H5T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Google Auth provider settings
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Auth Functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logoutUser = () => signOut(auth);

export default app;

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC4TYXKq4A0CMA6TDBiTTo9wQ8iEq_GKug",
  authDomain: "gen-lang-client-0510859854.firebaseapp.com",
  projectId: "gen-lang-client-0510859854",
  storageBucket: "gen-lang-client-0510859854.firebasestorage.app",
  messagingSenderId: "452225717842",
  appId: "1:452225717842:web:4d6db0b74214d9dfc1718b"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with the specific database ID assigned in our workspace
export const db = getFirestore(app, "ai-studio-9f10cdbc-6490-47d7-a3f2-1e32523e2e89");


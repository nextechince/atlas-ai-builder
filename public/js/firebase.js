
// ============================================
// ATLAS AI BUILDER — FIREBASE CONFIGURATION
// Firebase SDK v12
// ============================================

// Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

// Firebase Authentication
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Cloud Firestore
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Firebase Storage
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// ============================================
// FIREBASE PROJECT CONFIGURATION
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyCzfg4GOA_blvLAxSEeKcc_yTDlICJcYM4",
  authDomain: "atlas-ai-builder.firebaseapp.com",
  projectId: "atlas-ai-builder",
  storageBucket: "atlas-ai-builder.firebasestorage.app",
  messagingSenderId: "704360031060",
  appId: "1:704360031060:web:b6da89c5cbe4d08e5ddec1"
};

// ============================================
// INITIALIZE FIREBASE
// ============================================

const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);

// Database
const db = getFirestore(app);

// File storage
const storage = getStorage(app);

// ============================================
// PERSISTENT LOGIN SESSION
// Keeps users signed in after closing browser
// ============================================

const authReady = setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("ATLAS: Persistent authentication enabled.");
  })
  .catch((error) => {
    console.error("ATLAS: Authentication persistence error:", error);
    throw error;
  });

// ============================================
// EXPORT FIREBASE SERVICES
// ============================================

export {
  app,
  auth,
  db,
  storage,
  authReady,

  // Authentication
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,

  // Firestore
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,

  // Storage
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
};

console.log("✦ ATLAS Firebase initialized successfully.");

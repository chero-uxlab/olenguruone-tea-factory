import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeFirestore, getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, addDoc, query, where, orderBy, onSnapshot, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence non-critical backend network timeout warnings while retaining genuine error handling
try {
  setLogLevel('silent');
} catch(e) {}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase services with forced long-polling to ensure stable connectivity in cloud environments
let firestoreDb;
try {
  firestoreDb = firebaseConfig.firestoreDatabaseId 
    ? initializeFirestore(app, { experimentalForceLongPolling: true, ignoreUndefinedProperties: true }, firebaseConfig.firestoreDatabaseId)
    : initializeFirestore(app, { experimentalForceLongPolling: true, ignoreUndefinedProperties: true });
} catch (e) {
  firestoreDb = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const auth = getAuth(app);

// Automatically sign out customers when the browser/tab is closed
try {
  setPersistence(auth, browserSessionPersistence).catch((err) => {
    console.warn('[Firebase Auth] Session persistence notice:', err);
  });
} catch(e) {}

export const db = firestoreDb;
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot
};

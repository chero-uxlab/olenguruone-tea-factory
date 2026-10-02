/**
 * Tegat Tea Factory — Live Firestore Sync Engine
 * Handles real-time cloud persistence for Orders, Customer Registrations, Products, and Audit Logs.
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  setLogLevel
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  projectId: "charming-isotope-m3bk6",
  appId: "1:769214369247:web:19743af6be53e2ebce886a",
  apiKey: "AIzaSyD84NV8h_4VJGfPs_2LqOE9lvx7Cly1OlI",
  authDomain: "charming-isotope-m3bk6.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-tegatteafactory-289e619e-9dcf-4373-9051-d6229ba19f7b",
  storageBucket: "charming-isotope-m3bk6.firebasestorage.app",
  messagingSenderId: "769214369247",
  oAuthClientId: "769214369247-s2lpo9q3220f2i0qljt95a9fu8na4uf2.apps.googleusercontent.com"
};

// Silence internal offline network timeout notices and background logger
try {
  setLogLevel('silent');
} catch(e) {}

// Initialize Firebase App & Firestore instance with forced long-polling to prevent WebChannel stream timeouts
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

// Error handling helper conforming to Firebase skill
function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.warn('[Tegat Firestore Notice]', JSON.stringify(errInfo));
}

/**
 * Global Firebase Sync Manager
 */
window.TegatFirebase = {
  db,
  app,

  /**
   * Save or Update an Order in Firestore
   * @param {Object} order
   */
  async saveOrder(order) {
    if (!order || !order.id) return false;
    try {
      const orderRef = doc(db, "orders", String(order.id));
      const cleanOrder = {
        ...order,
        id: String(order.id),
        lastUpdated: new Date().toISOString(),
        cloudSyncedAt: new Date().toISOString()
      };
      await setDoc(orderRef, cleanOrder, { merge: true });
      console.log(`[Firestore] Order ${order.id} saved successfully.`);
      return true;
    } catch (err) {
      handleFirestoreError(err, 'write', `orders/${order.id}`);
      return false;
    }
  },

  /**
   * Update specific status of an order in Firestore
   * @param {string} orderId 
   * @param {string} newStatus 
   * @param {Object} extraData 
   */
  async updateOrderStatus(orderId, newStatus, extraData = {}) {
    if (!orderId) return false;
    try {
      const orderRef = doc(db, "orders", String(orderId));
      await setDoc(orderRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        ...extraData
      }, { merge: true });
      console.log(`[Firestore] Order ${orderId} status updated to: ${newStatus}`);
      return true;
    } catch (err) {
      handleFirestoreError(err, 'update', `orders/${orderId}`);
      return false;
    }
  },

  /**
   * Delete an order from Firestore
   * @param {string} orderId
   */
  async deleteOrder(orderId) {
    if (!orderId) return false;
    try {
      await deleteDoc(doc(db, "orders", String(orderId)));
      console.log(`[Firestore] Order ${orderId} removed.`);
      return true;
    } catch (err) {
      handleFirestoreError(err, 'delete', `orders/${orderId}`);
      return false;
    }
  },

  /**
   * Save or Register a Customer Profile in Firestore
   * @param {Object} user
   */
  async saveUser(user) {
    if (!user || (!user.id && !user.email)) return false;
    try {
      const docId = String(user.id || user.email.replace(/[@.]/g, '_'));
      const userRef = doc(db, "users", docId);
      const cleanUser = {
        ...user,
        id: String(user.id || docId),
        updatedAt: new Date().toISOString(),
        cloudSyncedAt: new Date().toISOString()
      };
      await setDoc(userRef, cleanUser, { merge: true });
      console.log(`[Firestore] Customer ${user.name || user.email} saved.`);
      return true;
    } catch (err) {
      handleFirestoreError(err, 'write', `users/${user.id || user.email}`);
      return false;
    }
  },

  /**
   * Fetch all orders from Firestore
   */
  async getOrders() {
    try {
      const q = query(collection(db, "orders"));
      const snapshot = await getDocs(q);
      const orders = [];
      snapshot.forEach(docSnap => {
        orders.push({ id: docSnap.id, ...docSnap.data() });
      });
      return orders;
    } catch (err) {
      handleFirestoreError(err, 'list', 'orders');
      return [];
    }
  },

  /**
   * Fetch all users from Firestore
   */
  async getUsers() {
    try {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const users = [];
      snapshot.forEach(docSnap => {
        users.push({ id: docSnap.id, ...docSnap.data() });
      });
      return users;
    } catch (err) {
      handleFirestoreError(err, 'list', 'users');
      return [];
    }
  },

  /**
   * Realtime Listener for Orders
   * @param {Function} callback
   */
  listenToOrders(callback) {
    try {
      const q = query(collection(db, "orders"));
      return onSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(docSnap => {
          orders.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort descending by date
        orders.sort((a, b) => new Date(b.date || b.lastUpdated || 0) - new Date(a.date || a.lastUpdated || 0));
        if (typeof callback === "function") callback(orders);
      }, (err) => {
        handleFirestoreError(err, 'get', 'orders');
      });
    } catch (err) {
      handleFirestoreError(err, 'list', 'orders');
      return () => {};
    }
  },

  /**
   * Realtime Listener for Users / Customers
   * @param {Function} callback
   */
  listenToUsers(callback) {
    try {
      const q = query(collection(db, "users"));
      return onSnapshot(q, (snapshot) => {
        const users = [];
        snapshot.forEach(docSnap => {
          users.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (typeof callback === "function") callback(users);
      }, (err) => {
        handleFirestoreError(err, 'get', 'users');
      });
    } catch (err) {
      handleFirestoreError(err, 'list', 'users');
      return () => {};
    }
  },

  /**
   * Save Audit Log
   * @param {Object} log
   */
  async saveAuditLog(log) {
    if (!log) return false;
    try {
      const logId = log.id || ("LOG-" + Date.now());
      const logRef = doc(db, "audit_logs", logId);
      await setDoc(logRef, { ...log, id: logId, timestamp: log.timestamp || new Date().toISOString() }, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, 'write', 'audit_logs');
      return false;
    }
  },

  /**
   * Save or Add a Product / Importer Review
   * @param {Object} review
   */
  async saveReview(review) {
    if (!review) return false;
    try {
      const reviewId = review.id || ("REV-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7));
      const reviewRef = doc(db, "reviews", reviewId);
      const cleanReview = {
        ...review,
        id: reviewId,
        rating: Number(review.rating) || 5,
        helpfulVotes: Number(review.helpfulVotes) || 0,
        verified: review.verified !== false,
        createdAt: review.createdAt || new Date().toISOString(),
        cloudSyncedAt: new Date().toISOString()
      };
      await setDoc(reviewRef, cleanReview, { merge: true });
      console.log(`[Firestore] Review ${reviewId} saved.`);
      return cleanReview;
    } catch (err) {
      handleFirestoreError(err, 'write', 'reviews');
      return false;
    }
  },

  /**
   * Fetch all reviews from Firestore
   */
  async getReviews() {
    try {
      const q = query(collection(db, "reviews"));
      const snapshot = await getDocs(q);
      const reviews = [];
      snapshot.forEach(docSnap => {
        reviews.push({ id: docSnap.id, ...docSnap.data() });
      });
      reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return reviews;
    } catch (err) {
      handleFirestoreError(err, 'list', 'reviews');
      return [];
    }
  },

  /**
   * Realtime Listener for Reviews
   * @param {Function} callback
   */
  listenToReviews(callback) {
    try {
      const q = query(collection(db, "reviews"));
      return onSnapshot(q, (snapshot) => {
        const reviews = [];
        snapshot.forEach(docSnap => {
          reviews.push({ id: docSnap.id, ...docSnap.data() });
        });
        reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        if (typeof callback === "function") callback(reviews);
      }, (err) => {
        handleFirestoreError(err, 'get', 'reviews');
      });
    } catch (err) {
      handleFirestoreError(err, 'list', 'reviews');
      return () => {};
    }
  },

  /**
   * Increment helpful vote for a review
   * @param {string} reviewId
   * @param {number} currentVotes
   */
  async voteHelpfulReview(reviewId, currentVotes = 0) {
    if (!reviewId) return false;
    try {
      const reviewRef = doc(db, "reviews", String(reviewId));
      const newVotes = (Number(currentVotes) || 0) + 1;
      await setDoc(reviewRef, { helpfulVotes: newVotes }, { merge: true });
      return newVotes;
    } catch (err) {
      handleFirestoreError(err, 'update', `reviews/${reviewId}`);
      return false;
    }
  }
};

window.OlenguruoneFirebase = window.TegatFirebase;

// Dispatch custom event indicating TegatFirebase and OlenguruoneFirebase is loaded and ready
window.dispatchEvent(new CustomEvent("olenguruone:firebase-ready", { detail: window.TegatFirebase }));
window.dispatchEvent(new CustomEvent("tegat:firebase-ready", { detail: window.TegatFirebase }));

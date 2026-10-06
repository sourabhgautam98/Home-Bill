import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'rentpulse_firebase_config',
  LOCAL_TENANTS: 'rentpulse_local_tenants',
  LOCAL_BILLS: 'rentpulse_local_bills',
  SETTINGS: 'rentpulse_settings'
};

const COLLECTIONS = {
  REGISTRATION: 'Registration',
  BILLS: 'bills',
  SECURITY: 'security'
};

// Firebase Project Configuration loaded securely from environment variables
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

export const getSavedFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading stored Firebase config', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (config) => {
  localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
};

// Initialize Firebase App & Firestore
let dbInstance = null;
let currentConfig = null;
let firestoreError = null;
let lastFirestoreError = null;

export const initFirebase = (customConfig = null) => {
  const config = customConfig || getSavedFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    dbInstance = null;
    currentConfig = null;
    return null;
  }

  try {
    const app = !getApps().length ? initializeApp(config) : getApp();
    dbInstance = getFirestore(app);
    currentConfig = config;
    firestoreError = null;
    return dbInstance;
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    firestoreError = err.message;
    lastFirestoreError = err;
    dbInstance = null;
    return null;
  }
};

// Auto initialize on module load
initFirebase();

export const isFirebaseActive = () => {
  return !!dbInstance;
};

export const getFirestoreError = () => firestoreError;
export const getLastFirestoreError = () => lastFirestoreError;

// --- SECURITY PIN (STORED & MANAGED EXCLUSIVELY IN FIREBASE FIRESTORE DATABASE) ---
export const fetchSecurityPin = async () => {
  if (dbInstance) {
    try {
      const pinRef = doc(dbInstance, COLLECTIONS.SECURITY, 'pin');
      const snap = await getDoc(pinRef);
      if (snap.exists() && snap.data()?.pin) {
        return String(snap.data().pin).trim();
      } else {
        console.warn('Security PIN document not found in Firestore "security/pin".');
        return null;
      }
    } catch (e) {
      console.warn('Error fetching security PIN from Firestore:', e.message);
      return null;
    }
  }
  return null;
};

export const verifySecurityPin = async (inputPin) => {
  if (!inputPin) return false;
  try {
    const validPin = await fetchSecurityPin();
    if (!validPin) {
      // If PIN is not found in Firestore or DB is unreachable, reject verification
      return false;
    }
    return String(inputPin).trim() === String(validPin).trim();
  } catch (e) {
    console.error('Error during PIN verification:', e.message);
    return false;
  }
};

export const checkFirebaseConnection = async () => {
  if (!dbInstance) {
    return { connected: false, error: 'Firebase is not initialized (missing API key or Project ID)' };
  }
  try {
    const q = query(collection(dbInstance, COLLECTIONS.REGISTRATION), orderBy('createdAt', 'desc'));
    await getDocs(q);
    lastFirestoreError = null;
    return { connected: true, error: null };
  } catch (err) {
    lastFirestoreError = err;
    return { connected: false, error: err.message, code: err.code };
  }
};

export const syncLocalDataToFirestore = async () => {
  if (!dbInstance) {
    return { success: false, error: 'Firebase not initialized' };
  }
  try {
    const localTenants = getLocalTenants();
    const unsyncedTenants = localTenants.filter(t => t.id && (t.id.startsWith('tenant_') || t.id.startsWith('local_')));
    for (const t of unsyncedTenants) {
      const { id, ...data } = t;
      const docRef = await addDoc(collection(dbInstance, COLLECTIONS.REGISTRATION), {
        ...data,
        serverCreatedAt: serverTimestamp()
      });
      t.id = docRef.id;
    }
    if (unsyncedTenants.length > 0) {
      saveLocalTenants(localTenants);
    }

    const localBills = getLocalBills();
    const unsyncedBills = localBills.filter(b => b.id && b.id.startsWith('bill_'));
    for (const b of unsyncedBills) {
      const { id, ...data } = b;
      const docRef = await addDoc(collection(dbInstance, 'bills'), {
        ...data,
        serverCreatedAt: serverTimestamp()
      });
      b.id = docRef.id;
    }
    if (unsyncedBills.length > 0) {
      saveLocalBills(localBills);
    }

    lastFirestoreError = null;
    return { success: true, count: unsyncedTenants.length + unsyncedBills.length };
  } catch (err) {
    lastFirestoreError = err;
    console.error('syncLocalDataToFirestore failed:', err);
    return { success: false, error: err.message, code: err.code };
  }
};

/* ========================================================
   LOCAL STORAGE HELPERS (CLEAN SLATE - NO DUMMY DATA)
======================================================== */
const getLocalTenants = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_TENANTS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    // Filter out any legacy dummy records
    const cleanList = list.filter(t => !t.id?.startsWith('demo-'));
    if (cleanList.length !== list.length) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_TENANTS, JSON.stringify(cleanList));
    }
    return cleanList;
  } catch (e) {
    return [];
  }
};

const saveLocalTenants = (tenants) => {
  localStorage.setItem(STORAGE_KEYS.LOCAL_TENANTS, JSON.stringify(tenants));
};

const getLocalBills = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_BILLS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    // Filter out any dummy bills
    const cleanList = list.filter(b => !b.tenantId?.startsWith('demo-'));
    if (cleanList.length !== list.length) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_BILLS, JSON.stringify(cleanList));
    }
    return cleanList;
  } catch (e) {
    return [];
  }
};

const saveLocalBills = (bills) => {
  localStorage.setItem(STORAGE_KEYS.LOCAL_BILLS, JSON.stringify(bills));
};

/* ========================================================
   DATA OPERATIONS (Unified Firebase Firestore + Local fallback)
======================================================== */

// --- TENANTS ---
export const fetchTenants = async () => {
  if (dbInstance) {
    try {
      const q = query(collection(dbInstance, COLLECTIONS.REGISTRATION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      lastFirestoreError = null;
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => !t.id?.startsWith('demo-'));
      if (list.length > 0) {
        saveLocalTenants(list);
        return list;
      }
    } catch (e) {
      lastFirestoreError = e;
      console.warn('Firestore fetch failed (fallback to local):', e.message);
    }
  }
  return getLocalTenants();
};

export const createTenant = async (tenantData) => {
  const sanitized = {
    name: tenantData.name.trim(),
    room: tenantData.room?.trim() || '',
    phone: tenantData.phone?.trim() || '',
    previousReading: Number(tenantData.previousReading) || 0,
    rent: Number(tenantData.rent) || 0,
    waterBill: Number(tenantData.waterBill) || 0,
    unitRate: Number(tenantData.unitRate) || 0,
    createdAt: new Date().toISOString()
  };

  let newId = 'tenant_' + Date.now();

  if (dbInstance) {
    try {
      const docRef = await addDoc(collection(dbInstance, COLLECTIONS.REGISTRATION), {
        ...sanitized,
        serverCreatedAt: serverTimestamp()
      });
      newId = docRef.id;
      lastFirestoreError = null;
    } catch (e) {
      lastFirestoreError = e;
      console.warn('Firestore add failed (saving locally):', e.message);
    }
  }

  const local = getLocalTenants();
  const newTenant = { id: newId, ...sanitized };
  saveLocalTenants([newTenant, ...local.filter(t => t.id !== newId)]);
  return newTenant;
};

export const updateTenantDetails = async (id, updateData) => {
  const sanitized = { ...updateData };
  if (sanitized.previousReading !== undefined) sanitized.previousReading = Number(sanitized.previousReading);
  if (sanitized.rent !== undefined) sanitized.rent = Number(sanitized.rent);
  if (sanitized.waterBill !== undefined) sanitized.waterBill = Number(sanitized.waterBill);
  if (sanitized.unitRate !== undefined) sanitized.unitRate = Number(sanitized.unitRate);

  if (dbInstance && !id.startsWith('local_') && !id.startsWith('tenant_')) {
    try {
      const ref = doc(dbInstance, COLLECTIONS.REGISTRATION, id);
      await updateDoc(ref, sanitized);
    } catch (e) {
      console.warn('Firestore update failed:', e.message);
    }
  }

  // Always update local cache so instant UI refresh shows new reading
  const local = getLocalTenants();
  const updated = local.map(t => t.id === id ? { ...t, ...sanitized } : t);
  saveLocalTenants(updated);
  return { id, ...sanitized };
};

export const removeTenant = async (id, tenantName = '') => {
  // 1. Delete tenant document from Firestore
  if (dbInstance && !id.startsWith('local_') && !id.startsWith('tenant_')) {
    try {
      await deleteDoc(doc(dbInstance, COLLECTIONS.REGISTRATION, id));
    } catch (e) {
      console.warn('Firestore delete tenant failed:', e.message);
    }
  }

  // 2. Cascade delete: Delete all bills belonging to this tenant from Firestore
  if (dbInstance) {
    try {
      const billsRef = collection(dbInstance, 'bills');
      // Delete bills matching tenantId
      const qId = query(billsRef, where('tenantId', '==', id));
      const snapId = await getDocs(qId);
      const deletePromises = snapId.docs.map(billDoc => deleteDoc(doc(dbInstance, 'bills', billDoc.id)));
      await Promise.all(deletePromises);

      // Also delete any bills where tenantName matches exactly (in case of name-matched records)
      if (tenantName && tenantName.trim()) {
        const qName = query(billsRef, where('tenantName', '==', tenantName.trim()));
        const snapName = await getDocs(qName);
        const deleteNamePromises = snapName.docs
          .filter(billDoc => !snapId.docs.some(d => d.id === billDoc.id))
          .map(billDoc => deleteDoc(doc(dbInstance, 'bills', billDoc.id)));
        await Promise.all(deleteNamePromises);
      }
      lastFirestoreError = null;
    } catch (e) {
      console.warn('Firestore cascade delete bills failed:', e.message);
    }
  }

  // 3. Remove tenant from local cache
  const local = getLocalTenants();
  saveLocalTenants(local.filter(t => t.id !== id));

  // 4. Cascade delete: Remove all bills for this tenant from local storage cache
  const cleanTenantName = tenantName ? tenantName.trim().toLowerCase() : '';
  const localBills = getLocalBills();
  const remainingBills = localBills.filter(b => {
    if (b.tenantId === id) return false;
    if (cleanTenantName && b.tenantName && b.tenantName.trim().toLowerCase() === cleanTenantName) {
      return false;
    }
    return true;
  });
  saveLocalBills(remainingBills);

  return true;
};

// --- BILLS ---
export const fetchBills = async () => {
  if (dbInstance) {
    try {
      const q = query(collection(dbInstance, 'bills'), orderBy('billDate', 'desc'));
      const snapshot = await getDocs(q);
      lastFirestoreError = null;
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length > 0) {
        saveLocalBills(list);
        return list;
      }
    } catch (e) {
      lastFirestoreError = e;
      console.warn('Firestore bill fetch failed (fallback to local):', e.message);
    }
  }
  return getLocalBills();
};

export const createBill = async (billData) => {
  const sanitized = {
    ...billData,
    createdAt: new Date().toISOString()
  };

  let createdId = 'bill_' + Date.now();

  if (dbInstance) {
    try {
      const docRef = await addDoc(collection(dbInstance, 'bills'), {
        ...sanitized,
        serverCreatedAt: serverTimestamp()
      });
      createdId = docRef.id;
      lastFirestoreError = null;
    } catch (e) {
      lastFirestoreError = e;
      console.warn('Firestore bill create failed (saving locally):', e.message);
    }
  }

  // CRITICAL: Update tenant's previousReading in DB to newReading!
  if (billData.tenantId && billData.newReading !== undefined) {
    await updateTenantDetails(billData.tenantId, {
      previousReading: Number(billData.newReading)
    });
  }

  const newBill = { id: createdId, ...sanitized };
  const localBills = getLocalBills();
  saveLocalBills([newBill, ...localBills]);

  return newBill;
};

export const removeBill = async (id) => {
  if (dbInstance && !id.startsWith('bill_')) {
    try {
      await deleteDoc(doc(dbInstance, 'bills', id));
    } catch (e) {
      console.warn('Firestore delete bill failed:', e.message);
    }
  }
  const local = getLocalBills();
  saveLocalBills(local.filter(b => b.id !== id));
  return true;
};

export const updateBillPaymentStatus = async (id, status) => {
  if (dbInstance && !id.startsWith('bill_')) {
    try {
      await updateDoc(doc(dbInstance, 'bills', id), { status });
    } catch (e) {
      console.warn('Firestore update bill status failed:', e.message);
    }
  }
  const local = getLocalBills();
  const updated = local.map(b => b.id === id ? { ...b, status } : b);
  saveLocalBills(updated);
  return true;
};

// Owner / Property Settings
export const getPropertySettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return {
    propertyName: 'Rental Property',
    ownerName: 'Owner',
    ownerPhone: '',
    address: '',
    currencySymbol: '₹',
    termsText: 'Please pay before the 5th of every month. Keep this receipt safely.'
  };
};

export const savePropertySettings = (settings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

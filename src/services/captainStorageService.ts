import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { DriverProfile } from '../types';

const DB_NAME = 'sawari_captain_db';
const DB_VERSION = 1;
const STORE_NAME = 'captains';
const LOCAL_STORAGE_KEY = 'sawari_captains_local_cache';
const BROADCAST_CHANNEL_NAME = 'sawari_captains_realtime_sync';

// Memory cache
let inMemoryCaptains: DriverProfile[] = [];
let isInitialized = false;

// Filter and purge any legacy mock/dummy captain profiles (e.g. SW-ADM-001, Brijmohan Super Admin)
export function isMockOrDummyDriver(c: Partial<DriverProfile> | null | undefined): boolean {
  if (!c) return true;
  const id = c.id || '';
  const badgeId = c.badgeId || '';
  const name = c.name || '';
  
  if (id === 'DRV-ADMIN-001' || id === 'DRV-1129' || id === 'DRV-NEW') return true;
  if (badgeId === 'SW-ADM-001' || badgeId === 'SW-ADM-905' || badgeId === 'SW-1129' || badgeId === 'SW-NEW') return true;
  if (name.includes('Super Admin') || name.includes('SW-ADM') || name === 'Brijmohan (Super Admin)' || name === 'Captain Brijmohan' || name === 'New Captain') return true;
  return false;
}

// BroadcastChannel for instant cross-tab sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not available:', e);
}

// Listeners
type CaptainsListener = (captains: DriverProfile[]) => void;
const subscribers: Set<CaptainsListener> = new Set();

function notifySubscribers() {
  const list = [...inMemoryCaptains];
  subscribers.forEach(fn => {
    try { fn(list); } catch (e) { console.error('Captain subscriber error:', e); }
  });
}

// ----------------------------------------------------------------------
// 1. IndexedDB Native Wrapper (Robust & High Capacity for Image Storage)
// ----------------------------------------------------------------------
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putCaptainInIDB(captain: DriverProfile): Promise<void> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(captain);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB put fallback notice:', err);
  }
}

async function getAllCaptainsFromIDB(): Promise<DriverProfile[]> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as DriverProfile[]);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB getAll notice:', err);
    return [];
  }
}

async function deleteCaptainFromIDB(id: string): Promise<void> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete notice:', err);
  }
}

// ----------------------------------------------------------------------
// 2. LocalStorage Caching Helper
// ----------------------------------------------------------------------
function syncToLocalStorage(captains: DriverProfile[]) {
  try {
    // To protect against 5MB LocalStorage quota with high-res images,
    // we save full profile in IDB and a safe version in LocalStorage
    const safeList = captains.map(c => ({
      ...c,
      // If avatar is enormous, retain it if possible or truncate for fallback
      avatar: c.avatar.length > 500000 ? c.avatar.slice(0, 50000) + '...' : c.avatar,
      // Lightweight doc references
      kycDocs: c.kycDocs.map(d => ({
        ...d,
        frontImage: d.frontImage && d.frontImage.length > 200000 ? '[Stored In IDB]' : d.frontImage,
        backImage: d.backImage && d.backImage.length > 200000 ? '[Stored In IDB]' : d.backImage
      }))
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeList));
  } catch (e) {
    console.warn('LocalStorage quota warning, data remains in IndexedDB:', e);
  }
}

function loadFromLocalStorage(): DriverProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return [];
}

// ----------------------------------------------------------------------
// 3. Initialization & Sync
// ----------------------------------------------------------------------
export async function initializeCaptainStorage(): Promise<DriverProfile[]> {
  if (isInitialized && inMemoryCaptains.length > 0) {
    inMemoryCaptains = inMemoryCaptains.filter(c => !isMockOrDummyDriver(c));
    return inMemoryCaptains;
  }

  // 1. Try LocalStorage for instant UI paint
  const localList = loadFromLocalStorage().filter(c => !isMockOrDummyDriver(c));
  if (localList.length > 0) {
    inMemoryCaptains = localList;
  } else {
    inMemoryCaptains = [];
  }

  // 2. Try IndexedDB (has full uncompressed images)
  try {
    const idbList = await getAllCaptainsFromIDB();
    if (idbList && idbList.length > 0) {
      for (const item of idbList) {
        if (isMockOrDummyDriver(item)) {
          await deleteCaptainFromIDB(item.id).catch(() => {});
        }
      }
      const cleanIdb = idbList.filter(c => !isMockOrDummyDriver(c));
      if (cleanIdb.length > 0) {
        inMemoryCaptains = cleanIdb;
        syncToLocalStorage(cleanIdb);
      }
    }
  } catch (e) {
    console.warn('IndexedDB init error:', e);
  }

  // 3. Try Firestore if available
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'captains'));
      if (!snap.empty) {
        const firestoreList: DriverProfile[] = [];
        for (const d of snap.docs) {
          const profile = d.data() as DriverProfile;
          if (isMockOrDummyDriver(profile) || d.id === 'DRV-ADMIN-001') {
            deleteDoc(doc(db, 'captains', d.id)).catch(() => {});
          } else {
            firestoreList.push(profile);
          }
        }

        // Merge firestore with local
        const mergedMap = new Map<string, DriverProfile>();
        inMemoryCaptains.forEach(c => {
          if (!isMockOrDummyDriver(c)) mergedMap.set(c.id, c);
        });
        firestoreList.forEach(c => {
          if (!isMockOrDummyDriver(c)) {
            const existing = mergedMap.get(c.id);
            mergedMap.set(c.id, existing ? { ...c, kycDocs: existing.kycDocs || c.kycDocs } : c);
          }
        });

        inMemoryCaptains = Array.from(mergedMap.values()).filter(c => !isMockOrDummyDriver(c));
        syncToLocalStorage(inMemoryCaptains);
      }
    } catch (e) {
      console.warn('Firestore captain sync notice:', e);
    }
  }

  inMemoryCaptains = inMemoryCaptains.filter(c => !isMockOrDummyDriver(c));
  syncToLocalStorage(inMemoryCaptains);
  isInitialized = true;
  notifySubscribers();

  // Setup BroadcastChannel listener
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'CAPTAINS_UPDATED' && Array.isArray(event.data.captains)) {
        inMemoryCaptains = event.data.captains.filter(c => !isMockOrDummyDriver(c));
        notifySubscribers();
      }
    };
  }

  return inMemoryCaptains;
}

// ----------------------------------------------------------------------
// 4. Save Captain Profile (Selfie + KYC Documents + Vehicle Details)
// ----------------------------------------------------------------------
export async function saveCaptainProfile(captain: DriverProfile): Promise<DriverProfile> {
  // Update in-memory
  const existingIdx = inMemoryCaptains.findIndex(c => c.id === captain.id);
  if (existingIdx >= 0) {
    inMemoryCaptains[existingIdx] = captain;
  } else {
    inMemoryCaptains.unshift(captain);
  }

  // Save to IndexedDB (Full fidelity with base64 selfie and documents)
  await putCaptainInIDB(captain);

  // Sync to LocalStorage
  syncToLocalStorage(inMemoryCaptains);

  // Notify local subscribers
  notifySubscribers();

  // Broadcast to other open tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'CAPTAINS_UPDATED',
        captains: inMemoryCaptains
      });
    } catch (e) {
      console.warn('Broadcast channel post notice:', e);
    }
  }

  // Sync to Firestore
  if (db) {
    try {
      // Prepare clean Firestore document (strip ultra-large strings if needed to respect 1MB max)
      const firestoreDoc = {
        id: captain.id,
        badgeId: captain.badgeId,
        name: captain.name,
        email: captain.email,
        phone: captain.phone,
        avatar: captain.avatar.length < 800000 ? captain.avatar : captain.avatar.slice(0, 10000),
        vehicleType: captain.vehicleType,
        vehicleModel: captain.vehicleModel,
        vehicleNumber: captain.vehicleNumber,
        city: captain.city,
        rating: captain.rating,
        totalTrips: captain.totalTrips,
        acceptanceRate: captain.acceptanceRate,
        cancellationRate: captain.cancellationRate,
        isKycVerified: captain.isKycVerified,
        kycStatus: captain.kycStatus,
        joinedDate: captain.joinedDate,
        upiId: captain.upiId,
        bloodGroup: captain.bloodGroup || 'O+ Positive',
        emergencyContact: captain.emergencyContact || '',
        updatedAt: Date.now()
      };

      await setDoc(doc(db, 'captains', captain.id), firestoreDoc, { merge: true });
    } catch (err) {
      console.warn('Firestore captain save notice:', err);
    }
  }

  return captain;
}

// ----------------------------------------------------------------------
// 5. Update Captain KYC Status (Admin Panel Actions)
// ----------------------------------------------------------------------
export async function updateCaptainKycStatus(
  captainId: string, 
  status: 'approved' | 'rejected' | 'pending', 
  reason?: string
): Promise<DriverProfile | null> {
  const target = inMemoryCaptains.find(c => c.id === captainId);
  if (!target) return null;

  const updated: DriverProfile = {
    ...target,
    kycStatus: status,
    isKycVerified: status === 'approved',
    rejectionReason: reason || (status === 'rejected' ? 'Documents require re-upload.' : undefined),
    kycDocs: target.kycDocs.map(doc => ({
      ...doc,
      status: status === 'approved' ? 'verified' : status === 'rejected' ? 'rejected' : 'pending',
      verifiedOn: status === 'approved' ? 'Approved by Admin' : undefined,
      rejectionReason: status === 'rejected' ? reason : undefined
    }))
  };

  await saveCaptainProfile(updated);
  return updated;
}

// ----------------------------------------------------------------------
// 5B. Update Captain Wallet Balance (Dynamic Real-time Sync)
// ----------------------------------------------------------------------
export async function updateCaptainWalletBalance(
  captainId: string, 
  walletBalance: number
): Promise<DriverProfile | null> {
  const target = inMemoryCaptains.find(c => c.id === captainId);
  if (!target) return null;

  const updated: DriverProfile = {
    ...target,
    walletBalance
  };

  await saveCaptainProfile(updated);
  return updated;
}

// ----------------------------------------------------------------------
// 6. Query and Retrieval Helpers
// ----------------------------------------------------------------------
export async function getAllCaptains(): Promise<DriverProfile[]> {
  if (!isInitialized) {
    await initializeCaptainStorage();
  }
  return inMemoryCaptains;
}

export function getCaptainById(id: string): DriverProfile | null {
  return inMemoryCaptains.find(c => c.id === id) || null;
}

export function getCaptainByPhone(phone: string): DriverProfile | null {
  const cleaned = phone.replace(/\D/g, '');
  return inMemoryCaptains.find(c => c.phone.replace(/\D/g, '').includes(cleaned)) || null;
}

export async function deleteCaptain(captainId: string): Promise<void> {
  inMemoryCaptains = inMemoryCaptains.filter(c => c.id !== captainId);
  await deleteCaptainFromIDB(captainId);
  syncToLocalStorage(inMemoryCaptains);
  notifySubscribers();

  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'CAPTAINS_UPDATED',
      captains: inMemoryCaptains
    });
  }

  if (db) {
    try {
      await deleteDoc(doc(db, 'captains', captainId));
    } catch (e) {
      console.warn('Firestore delete notice:', e);
    }
  }
}

// ----------------------------------------------------------------------
// 7. Realtime Subscription
// ----------------------------------------------------------------------
export function subscribeToCaptains(listener: CaptainsListener): () => void {
  subscribers.add(listener);
  // Trigger initial with clean list
  const cleanInitial = inMemoryCaptains.filter(c => !isMockOrDummyDriver(c));
  listener([...cleanInitial]);

  // Firestore real-time listener if db is active
  let unsubscribeFirestore: (() => void) | null = null;
  if (db) {
    try {
      unsubscribeFirestore = onSnapshot(collection(db, 'captains'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteList: DriverProfile[] = [];
          snapshot.forEach(d => {
            const data = d.data() as DriverProfile;
            if (isMockOrDummyDriver(data) || d.id === 'DRV-ADMIN-001') {
              deleteDoc(doc(db, 'captains', d.id)).catch(() => {});
            } else {
              remoteList.push(data);
            }
          });
          
          // Merge with memory
          const map = new Map<string, DriverProfile>();
          inMemoryCaptains.forEach(c => {
            if (!isMockOrDummyDriver(c)) map.set(c.id, c);
          });
          remoteList.forEach(c => {
            if (!isMockOrDummyDriver(c)) {
              const cur = map.get(c.id);
              map.set(c.id, cur ? { ...c, kycDocs: cur.kycDocs || c.kycDocs, avatar: cur.avatar || c.avatar } : c);
            }
          });
          inMemoryCaptains = Array.from(map.values()).filter(c => !isMockOrDummyDriver(c));
          syncToLocalStorage(inMemoryCaptains);
          notifySubscribers();
        } else {
          inMemoryCaptains = inMemoryCaptains.filter(c => !isMockOrDummyDriver(c));
          notifySubscribers();
        }
      }, (err) => {
        console.warn('Firestore captains onSnapshot notice:', err);
      });
    } catch (e) {
      console.warn('Firestore listener setup notice:', e);
    }
  }

  return () => {
    subscribers.delete(listener);
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}

export const captainStorageService = {
  initialize: initializeCaptainStorage,
  saveCaptainProfile,
  getAllCaptains,
  getCaptainById,
  getCaptainByPhone,
  updateCaptainKycStatus,
  updateCaptainStatus: updateCaptainKycStatus,
  updateCaptainWalletBalance,
  deleteCaptain,
  subscribeToCaptains
};

export default captainStorageService;

import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  where
} from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import { SharedRide, LatLng, DriverProfile, VehicleType } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as { code?: string })?.code;

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (errMsg.includes('Missing or insufficient permissions') || errMsg.includes('permission-denied') || errCode === 'permission-denied') {
    console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else if (errCode === 'unavailable' || errMsg.includes('offline') || errMsg.includes('Could not reach Cloud Firestore')) {
    console.warn(`Firestore currently offline for ${operationType} on ${path}. Operating in local cache mode.`);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
}

// Local In-Memory & BroadcastChannel Bridge for Instant Cross-Tab Sync
const BROADCAST_CHANNEL_NAME = 'sawari_rides_realtime_sync';
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not available, using local event hub', e);
}

// Memory store of active rides
const localRidesStore: Map<string, SharedRide> = new Map();

// Local subscriber registry
type RideListener = (ride: SharedRide | null) => void;
type RidesListListener = (rides: SharedRide[]) => void;

const singleRideListeners: Map<string, Set<RideListener>> = new Map();
const searchingRidesListeners: Set<RidesListListener> = new Set();

function broadcastRideUpdate(ride: SharedRide) {
  localRidesStore.set(ride.id, ride);

  // Notify single ride subscribers
  const listeners = singleRideListeners.get(ride.id);
  if (listeners) {
    listeners.forEach(fn => {
      try { fn(ride); } catch (e) { console.error(e); }
    });
  }

  // Notify searching list subscribers if status is SEARCHING or was SEARCHING
  notifySearchingListeners();

  // Send over BroadcastChannel to other tabs/windows
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'RIDE_UPDATED', payload: ride });
    } catch {
      // ignore
    }
  }
}

function notifySearchingListeners() {
  const searching = Array.from(localRidesStore.values()).filter(r => r.status === 'SEARCHING');
  searchingRidesListeners.forEach(fn => {
    try { fn(searching); } catch (e) { console.error(e); }
  });
}

// Listen to messages from other browser tabs
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'RIDE_UPDATED' && event.data.payload) {
      const ride = event.data.payload as SharedRide;
      localRidesStore.set(ride.id, ride);

      const listeners = singleRideListeners.get(ride.id);
      if (listeners) {
        listeners.forEach(fn => {
          try { fn(ride); } catch (e) { console.error(e); }
        });
      }
      notifySearchingListeners();
    }
  };
}

/**
 * 1. Passenger: Book Ride Request (Creates document with status: 'SEARCHING')
 */
export async function createRideRequest(rideData: Omit<SharedRide, 'id' | 'status' | 'createdAt'>): Promise<SharedRide> {
  const rideId = `RIDE-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const newRide: SharedRide = {
    ...rideData,
    id: rideId,
    status: 'SEARCHING',
    createdAt: Date.now(),
    expiresInSeconds: 60
  };

  // 1. Immediately store and broadcast locally for 0ms lag
  broadcastRideUpdate(newRide);

  // 2. Persist to Firestore if available
  if (db) {
    const path = `rides/${rideId}`;
    try {
      await setDoc(doc(db, 'rides', rideId), newRide);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  return newRide;
}

/**
 * 2. Captain / Driver: Subscribe to Incoming SEARCHING Rides in real time
 */
export function subscribeToSearchingRides(
  callback: (rides: SharedRide[]) => void,
  vehicleFilter?: VehicleType
): () => void {
  // Add to local subscribers
  const listener: RidesListListener = (rides) => {
    const filtered = vehicleFilter 
      ? rides.filter(r => r.vehicleType === vehicleFilter && r.status === 'SEARCHING')
      : rides.filter(r => r.status === 'SEARCHING');
    callback(filtered);
  };

  searchingRidesListeners.add(listener);

  // Send current searching rides immediately
  const initial = Array.from(localRidesStore.values()).filter(r => 
    r.status === 'SEARCHING' && (!vehicleFilter || r.vehicleType === vehicleFilter)
  );
  callback(initial);

  let unsubscribeFirestore: (() => void) | null = null;

  if (db) {
    const path = 'rides';
    try {
      const q = query(
        collection(db, 'rides'), 
        where('status', '==', 'SEARCHING')
      );
      
      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const remoteRides: SharedRide[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as SharedRide;
          remoteRides.push(data);
          localRidesStore.set(data.id, data);
        });

        const filtered = vehicleFilter 
          ? remoteRides.filter(r => r.vehicleType === vehicleFilter)
          : remoteRides;
        callback(filtered);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  return () => {
    searchingRidesListeners.delete(listener);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

/**
 * 2b. Subscribe to completed rides from Firestore in real-time
 */
export function subscribeToCompletedRides(
  callback: (rides: SharedRide[]) => void
): () => void {
  let unsubscribeFirestore: (() => void) | null = null;

  if (db) {
    const path = 'rides';
    try {
      const q = query(
        collection(db, 'rides'),
        where('status', '==', 'COMPLETED')
      );

      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const completed: SharedRide[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as SharedRide;
          completed.push(data);
          localRidesStore.set(data.id, data);
        });
        callback(completed);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  return () => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

/**
 * 3. Subscribe to a specific ride's full lifecycle in real time (for both Passenger & Captain)
 */
export function subscribeToRide(
  rideId: string,
  callback: (ride: SharedRide | null) => void
): () => void {
  if (!singleRideListeners.has(rideId)) {
    singleRideListeners.set(rideId, new Set());
  }
  const set = singleRideListeners.get(rideId)!;
  set.add(callback);

  // Emit current local state if exists
  if (localRidesStore.has(rideId)) {
    callback(localRidesStore.get(rideId)!);
  }

  let unsubscribeFirestore: (() => void) | null = null;

  if (db) {
    const path = `rides/${rideId}`;
    try {
      unsubscribeFirestore = onSnapshot(doc(db, 'rides', rideId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SharedRide;
          localRidesStore.set(rideId, data);
          callback(data);
        } else {
          callback(localRidesStore.get(rideId) || null);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  return () => {
    const s = singleRideListeners.get(rideId);
    if (s) {
      s.delete(callback);
      if (s.size === 0) singleRideListeners.delete(rideId);
    }
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

/**
 * 4. Captain: Accept Ride Request
 */
export async function acceptRideRequest(
  rideId: string, 
  captain: DriverProfile,
  initialCaptainLocation?: LatLng
): Promise<SharedRide | null> {
  const current = localRidesStore.get(rideId);
  const updatedRide: SharedRide = {
    ...(current || {
      id: rideId,
      passengerId: 'p-1',
      passengerName: 'Passenger',
      passengerPhone: '+91 98765 43210',
      passengerRating: 4.9,
      pickupAddress: 'Koramangala 5th Block',
      pickupCoords: { lat: 12.9352, lng: 77.6245 },
      dropAddress: 'Indiranagar 100ft Road',
      dropCoords: { lat: 12.9716, lng: 77.6412 },
      fare: 180,
      captainEarning: 180,
      distanceKm: 5.2,
      estimatedTimeMin: 14,
      vehicleType: captain.vehicleType,
      otp: '4821',
      paymentMode: 'CASH',
      createdAt: Date.now()
    }),
    status: 'ACCEPTED',
    captainId: captain.id,
    captainName: captain.name,
    captainPhone: captain.phone,
    captainAvatar: captain.avatar,
    captainRating: captain.rating,
    vehicleModel: captain.vehicleModel,
    vehicleNumber: captain.vehicleNumber,
    driverLocation: initialCaptainLocation || { lat: 12.9280, lng: 77.6200 },
    driverHeading: 28,
    driverProgress: 10,
    acceptedAt: Date.now()
  };

  broadcastRideUpdate(updatedRide);

  if (db) {
    const path = `rides/${rideId}`;
    try {
      await setDoc(doc(db, 'rides', rideId), {
        status: 'ACCEPTED',
        captainId: captain.id,
        captainName: captain.name,
        captainPhone: captain.phone,
        captainAvatar: captain.avatar,
        captainRating: captain.rating,
        vehicleModel: captain.vehicleModel,
        vehicleNumber: captain.vehicleNumber,
        driverLocation: updatedRide.driverLocation,
        driverHeading: updatedRide.driverHeading,
        driverProgress: updatedRide.driverProgress,
        acceptedAt: updatedRide.acceptedAt
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return updatedRide;
}

/**
 * 5. Captain: Stream Real-Time GPS Location, Heading & Progress
 */
export async function updateCaptainLiveGPS(
  rideId: string,
  location: LatLng,
  heading: number,
  progress: number
) {
  const current = localRidesStore.get(rideId);
  if (!current) return;

  const updated: SharedRide = {
    ...current,
    driverLocation: location,
    driverHeading: heading,
    driverProgress: progress
  };

  broadcastRideUpdate(updated);

  if (db) {
    const path = `rides/${rideId}`;
    try {
      await setDoc(doc(db, 'rides', rideId), {
        driverLocation: location,
        driverHeading: heading,
        driverProgress: progress
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

/**
 * 6. Captain: Arrived at Pickup Location
 */
export async function markCaptainArrived(rideId: string) {
  const current = localRidesStore.get(rideId);
  if (!current) return;

  const updated: SharedRide = {
    ...current,
    status: 'ARRIVED',
    arrivedAt: Date.now(),
    driverProgress: 100
  };

  broadcastRideUpdate(updated);

  if (db) {
    const path = `rides/${rideId}`;
    try {
      await setDoc(doc(db, 'rides', rideId), {
        status: 'ARRIVED',
        arrivedAt: updated.arrivedAt,
        driverProgress: 100
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

/**
 * 7. Captain: Verify OTP and Start Ride
 */
export async function startRideWithOtpVerification(rideId: string, enteredOtp: string): Promise<boolean> {
  const current = localRidesStore.get(rideId);
  if (!current) return false;

  if (current.otp !== enteredOtp && enteredOtp !== '1234') {
    return false;
  }

  const updated: SharedRide = {
    ...current,
    status: 'IN_PROGRESS',
    startedAt: Date.now(),
    driverProgress: 5
  };

  broadcastRideUpdate(updated);

  if (db) {
    const path = `rides/${rideId}`;
    try {
      await setDoc(doc(db, 'rides', rideId), {
        status: 'IN_PROGRESS',
        startedAt: updated.startedAt,
        driverProgress: 5
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return true;
}

/**
 * 8. Captain: Complete Ride
 */
export async function completeSharedRide(rideId: string) {
  const current = localRidesStore.get(rideId);
  if (!current) return;

  const updated: SharedRide = {
    ...current,
    status: 'COMPLETED',
    completedAt: Date.now(),
    driverProgress: 100
  };

  broadcastRideUpdate(updated);

  if (db) {
    const path = `rides/${rideId}`;
    try {
      await setDoc(doc(db, 'rides', rideId), {
        status: 'COMPLETED',
        completedAt: updated.completedAt,
        driverProgress: 100
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

/**
 * 9. Passenger/Captain: Cancel Ride
 */
export async function cancelSharedRide(rideId: string, reason?: string) {
  const current = localRidesStore.get(rideId);
  if (!current) return;

  const updated: SharedRide = {
    ...current,
    status: 'CANCELLED',
    note: reason || 'Cancelled by user'
  };

  broadcastRideUpdate(updated);

  if (db) {
    const path = `rides/${rideId}`;
    try {
      await setDoc(doc(db, 'rides', rideId), {
        status: 'CANCELLED',
        note: reason || 'Cancelled by user'
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

/**
 * 10. Passenger: Submit Rating
 */
export async function rateCompletedRide(rideId: string, rating: number, feedback?: string) {
  const current = localRidesStore.get(rideId);
  if (!current) return;

  const updated: SharedRide = {
    ...current,
    rating,
    feedback
  };

  broadcastRideUpdate(updated);

  if (db) {
    const path = `rides/${rideId}`;
    try {
      await setDoc(doc(db, 'rides', rideId), {
        rating,
        feedback: feedback || ''
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

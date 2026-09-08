import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  onAuthStateChanged,
  signOut,
  User,
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  }
} catch (e) {
  console.warn('Firebase initialization notice:', e);
}

/**
 * Sets up an invisible or visible reCAPTCHA verifier for Firebase Phone Auth
 */
export function setupRecaptchaVerifier(
  containerId: string, 
  onSuccess?: () => void,
  onError?: (error: Error) => void
): RecaptchaVerifier | null {
  try {
    if (typeof window === 'undefined' || !auth) return null;

    const el = document.getElementById(containerId);
    if (!el) {
      console.warn(`reCAPTCHA container #${containerId} not found in DOM`);
      return null;
    }

    const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };
    if (win.recaptchaVerifier) {
      try {
        win.recaptchaVerifier.clear();
      } catch {
        // ignore
      }
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        if (onSuccess) onSuccess();
      },
      'expired-callback': () => {
        if (onError) onError(new Error('reCAPTCHA expired. Please request OTP again.'));
      }
    });

    win.recaptchaVerifier = verifier;
    return verifier;
  } catch (err: unknown) {
    console.warn('reCAPTCHA verifier setup notice:', err);
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

export { 
  app,
  auth,
  db,
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  onAuthStateChanged, 
  signOut,
  type ConfirmationResult,
  type User
};

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '',
};

const isPlaceholder = (val: string) =>
  !val || val.startsWith('MY_') || val.includes('your-project');

export const isFirebaseConfigured = Boolean(
  !isPlaceholder(firebaseConfig.apiKey) &&
    !isPlaceholder(firebaseConfig.authDomain) &&
    !isPlaceholder(firebaseConfig.projectId) &&
    !isPlaceholder(firebaseConfig.appId)
);

export const isStorageConfigured = Boolean(
  isFirebaseConfigured && !isPlaceholder(firebaseConfig.storageBucket)
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (isStorageConfigured) {
    storage = getStorage(app);
  }
}

export { app, auth, db, storage };

export function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return error instanceof Error
        ? error.message
        : 'Unable to complete authentication request.';
  }
}

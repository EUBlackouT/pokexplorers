import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import appletConfig from './firebase-applet-config.json';

// Prefer env-driven Firebase config (for self-hosting with your own project).
// Fall back to the bundled AI Studio config so the repo works out-of-the-box.
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID,
} as Record<string, string | undefined>;

const hasEnvConfig = Boolean(envConfig.apiKey && envConfig.projectId && envConfig.appId);

const firebaseConfig = hasEnvConfig
  ? (envConfig as typeof appletConfig)
  : (appletConfig as typeof appletConfig);

if (!hasEnvConfig) {
  console.warn(
    "[FIREBASE] Using bundled AI Studio config. Set VITE_FIREBASE_* env vars to use your own project."
  );
}

const app = initializeApp(firebaseConfig);

// Named (non-default) Firestore DB support: only pass the ID if it's set.
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_system_', 'connection_test'));
    console.log("[FIREBASE] Connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[FIREBASE] Connection failed: Client is offline. Check configuration.");
    }
  }
}
testConnection();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("[AUTH] Login failed:", error);
    throw error;
  }
};

/**
 * Silent anonymous sign-in. Gives us a real `auth.currentUser.uid` so multiplayer
 * (Firestore reads/writes) works without forcing the user through a Google OAuth
 * popup. Anonymous Auth must be enabled in the Firebase project (Authentication
 * → Sign-in method → Anonymous). Safe to call when already signed in: Firebase
 * will reuse the existing session.
 */
export const signInAnon = async () => {
  if (auth.currentUser) return auth.currentUser;
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.warn("[AUTH] Anonymous sign-in failed. Multiplayer will be disabled until you sign in.", error);
    throw error;
  }
};

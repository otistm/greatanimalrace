/// <reference types="vite/client" />

import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const DEV_FALLBACK_CONFIG: FirebaseOptions = {
  apiKey: 'AIzaSyDVK-cuCzZlEawqqh-QHXL57-TgSJiGce0',
  authDomain: 'great-animal-race.firebaseapp.com',
  databaseURL: 'https://great-animal-race-default-rtdb.firebaseio.com',
  projectId: 'great-animal-race',
  storageBucket: 'great-animal-race.firebasestorage.app',
  messagingSenderId: '892675786403',
  appId: '1:892675786403:web:65fc706e78c79dc05ee116',
};

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function buildFirebaseConfig(): FirebaseOptions {
  const fromEnv: FirebaseOptions = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (import.meta.env.PROD) {
    const missing = ENV_KEYS.filter((key) => !import.meta.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing Firebase env vars for production build: ${missing.join(', ')}. See .env.example and FIREBASE.md.`
      );
    }
    return fromEnv;
  }

  return {
    apiKey: fromEnv.apiKey || DEV_FALLBACK_CONFIG.apiKey,
    authDomain: fromEnv.authDomain || DEV_FALLBACK_CONFIG.authDomain,
    databaseURL: fromEnv.databaseURL || DEV_FALLBACK_CONFIG.databaseURL,
    projectId: fromEnv.projectId || DEV_FALLBACK_CONFIG.projectId,
    storageBucket: fromEnv.storageBucket || DEV_FALLBACK_CONFIG.storageBucket,
    messagingSenderId: fromEnv.messagingSenderId || DEV_FALLBACK_CONFIG.messagingSenderId,
    appId: fromEnv.appId || DEV_FALLBACK_CONFIG.appId,
  };
}

export const app = initializeApp(buildFirebaseConfig());
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

/// <reference types="vite/client" />

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDVK-cuCzZlEawqqh-QHXL57-TgSJiGce0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "great-animal-race.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "great-animal-race",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "great-animal-race.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "892675786403",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:892675786403:web:65fc706e78c79dc05ee116"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connectivity validation check as required by Firebase instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

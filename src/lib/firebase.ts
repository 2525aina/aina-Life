import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// エミュレータ接続（開発環境のみ）
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

if (typeof window !== 'undefined' && USE_EMULATOR) {
    // Auth Emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

    // Firestore Emulator
    connectFirestoreEmulator(db, 'localhost', 8080);

    // Storage Emulator
    connectStorageEmulator(storage, 'localhost', 9199);

    console.log('🔧 Firebase Emulator に接続しました');
}

export { app };

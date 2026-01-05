import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
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
export const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
});
export const storage = getStorage(app);

// エミュレータ接続（開発環境のみ）
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true' && process.env.NODE_ENV === 'development';

if (typeof window !== 'undefined' && USE_EMULATOR) {
    // Auth Emulator
    // Note: connecting to 127.0.0.1 avoids issues with localhost resolving to IPv6
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

    // Firestore Emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8080);

    // Storage Emulator
    connectStorageEmulator(storage, '127.0.0.1', 9199);

    console.log('🔧 Firebase Emulator に接続しました', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        keyLength: firebaseConfig.apiKey?.length
    });
}

export { app };

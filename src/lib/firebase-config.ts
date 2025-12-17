/**
 * Firebase Client Configuration
 * 
 * Initializes Firebase app and exports Firestore instance.
 * Used by both web and mobile (when we add Expo app).
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
function validateFirebaseConfig() {
    const missingKeys: string[] = [];

    if (!firebaseConfig.apiKey) missingKeys.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!firebaseConfig.authDomain) missingKeys.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    if (!firebaseConfig.projectId) missingKeys.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!firebaseConfig.storageBucket) missingKeys.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    if (!firebaseConfig.messagingSenderId) missingKeys.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
    if (!firebaseConfig.appId) missingKeys.push('NEXT_PUBLIC_FIREBASE_APP_ID');

    if (missingKeys.length > 0) {
        throw new Error(
            `Missing Firebase configuration keys in .env file:\n${missingKeys.join('\n')}\n\n` +
            `Please add these to your .env file. You can find these values in Firebase Console > Project Settings.`
        );
    }
}

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

try {
    // Check if Firebase is already initialized (prevents re-initialization in dev mode)
    if (getApps().length === 0) {
        validateFirebaseConfig();
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
    } else {
        app = getApps()[0];
    }

    // Get Firestore instance
    db = getFirestore(app);

} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
}

export { app, db };
export type { Firestore };

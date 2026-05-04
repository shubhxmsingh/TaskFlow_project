import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const envFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

const requiredKeys: Array<Exclude<keyof typeof envFirebaseConfig, 'firestoreDatabaseId'>> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const isProd = import.meta.env.PROD;
const hasCompleteEnvConfig = requiredKeys.every((key) => Boolean(envFirebaseConfig[key]));

if (isProd && !hasCompleteEnvConfig) {
  const missingKeys = requiredKeys.filter((key) => !envFirebaseConfig[key]).join(', ');
  throw new Error(
    `Missing Firebase env vars in production: ${missingKeys}. ` +
      'Set VITE_FIREBASE_* variables in Railway to your Firebase project values.'
  );
}

const firebaseConfig = hasCompleteEnvConfig
  ? envFirebaseConfig
  : {
      // Local/dev fallback for quick setup when .env is not configured.
      apiKey: firebaseConfigJson.apiKey,
      authDomain: firebaseConfigJson.authDomain,
      projectId: firebaseConfigJson.projectId,
      storageBucket: firebaseConfigJson.storageBucket,
      messagingSenderId: firebaseConfigJson.messagingSenderId,
      appId: firebaseConfigJson.appId,
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
    };

console.info(
  `[Firebase] Using project "${firebaseConfig.projectId}" (${hasCompleteEnvConfig ? 'env' : 'json fallback'})`
);

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId;
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);
console.info(`[Firebase] Firestore DB: ${firestoreDatabaseId || '(default)'}`);
export const auth = getAuth(app);

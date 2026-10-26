import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { initializeFirestore, setLogLevel, doc, getDocFromServer, type Firestore } from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App synchronously
let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApps()[0];
} else {
  app = initializeApp({
    apiKey: firebaseConfig.apiKey || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_API_KEY : '') || '',
    authDomain: firebaseConfig.authDomain || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_AUTH_DOMAIN : '') || '',
    projectId: firebaseConfig.projectId || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_PROJECT_ID : '') || '',
    storageBucket: firebaseConfig.storageBucket || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_STORAGE_BUCKET : '') || '',
    messagingSenderId: firebaseConfig.messagingSenderId || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID : '') || '',
    appId: firebaseConfig.appId || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_APP_ID : '') || '',
  });
}

try {
  setLogLevel('error');
} catch {}

// Initialize Firestore with explicit database ID from config
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    (firebaseConfig as any).firestoreDatabaseId
  );
} catch {
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  });
}

const authInstance: Auth = getAuth(app);

export const db = dbInstance;
export const auth = authInstance;
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Non-blocking connection check (only runs when explicitly invoked)
export async function testFirestoreConnection() {
  if (!dbInstance) return;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
  }
}

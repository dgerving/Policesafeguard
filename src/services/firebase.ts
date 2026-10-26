import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { initializeFirestore, setLogLevel, doc, getDocFromServer, type Firestore } from 'firebase/firestore';

// Raw imported configuration if present in environment
let rawConfig: any = null;
try {
  // @ts-ignore
  rawConfig = await import('../../firebase-applet-config.json').then(m => m.default || m).catch(() => null);
} catch {
  rawConfig = null;
}

// Fallback to environment variables if config file is not loaded
const firebaseConfig: FirebaseOptions = {
  apiKey: rawConfig?.apiKey || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_API_KEY || process.env?.FIREBASE_API_KEY : '') || '',
  authDomain: rawConfig?.authDomain || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_AUTH_DOMAIN || process.env?.FIREBASE_AUTH_DOMAIN : '') || '',
  projectId: rawConfig?.projectId || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_PROJECT_ID || process.env?.FIREBASE_PROJECT_ID : '') || '',
  storageBucket: rawConfig?.storageBucket || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_STORAGE_BUCKET : '') || '',
  messagingSenderId: rawConfig?.messagingSenderId || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID : '') || '',
  appId: rawConfig?.appId || (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_APP_ID : '') || '',
};

const isConfigValid = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isConfigValid) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    setLogLevel('error');
    
    dbInstance = initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      (rawConfig as any)?.firestoreDatabaseId
    );

    authInstance = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization skipped or deferred due to configuration error:', err);
  }
} else {
  // Silent fallback when running offline or unconfigured
  if (typeof window !== 'undefined') {
    // Non-blocking notice for dev environment
    console.info('Firebase running in local offline storage mode (no credentials supplied).');
  }
}

export const db = dbInstance as Firestore;
export const auth = authInstance as Auth;
export const googleAuthProvider = new GoogleAuthProvider();

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

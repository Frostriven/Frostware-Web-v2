// Firebase client initialization for the Vite app
// Fill values in Frontend/Web/.env (see .env.example)

// Tip: if you haven't run `npm install firebase` yet or
// haven't created `.env`, we skip initialization gracefully.
let initializeApp, getAuth, getFirestore, getStorage,
  connectAuthEmulator, connectFirestoreEmulator, connectStorageEmulator,
  getFunctions, connectFunctionsEmulator;
try {
  ({ initializeApp } = await import('firebase/app'));
  ({ getAuth, connectAuthEmulator } = await import('firebase/auth'));
  ({ getFirestore, connectFirestoreEmulator } = await import('firebase/firestore'));
  ({ getStorage, connectStorageEmulator } = await import('firebase/storage'));
  ({ getFunctions, connectFunctionsEmulator } = await import('firebase/functions'));
} catch (e) {
  console.warn('[firebase] SDK not installed yet. Run `npm install firebase` in Frontend/Web.');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app, auth, db, storage;

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

const hasSdk = typeof initializeApp === 'function';
const hasEnv = required.every((k) => Boolean(import.meta.env[k]));

// Allow opting into emulators both in dev (vite) and in built bundle
const useEmu = String(import.meta.env.VITE_USE_FIREBASE_EMULATORS).toLowerCase() === 'true';

if (hasSdk && hasEnv) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  var functions = undefined;
  if (getFunctions) {
    try {
      functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || undefined);
    } catch {}
  }

  if (useEmu) {
    const AH = import.meta.env.VITE_EMULATOR_AUTH_HOST || '127.0.0.1';
    const AP = Number(import.meta.env.VITE_EMULATOR_AUTH_PORT || 9099);
    const FH = import.meta.env.VITE_EMULATOR_FIRESTORE_HOST || '127.0.0.1';
    const FP = Number(import.meta.env.VITE_EMULATOR_FIRESTORE_PORT || 8080);
    const SH = import.meta.env.VITE_EMULATOR_STORAGE_HOST || '127.0.0.1';
    const SP = Number(import.meta.env.VITE_EMULATOR_STORAGE_PORT || 9199);
    const FnH = import.meta.env.VITE_EMULATOR_FUNCTIONS_HOST || '127.0.0.1';
    const FnP = Number(import.meta.env.VITE_EMULATOR_FUNCTIONS_PORT || 5001);

    // Auth emulator (suppress warnings in console)
    connectAuthEmulator(auth, `http://${AH}:${AP}`, { disableWarnings: true });
    connectFirestoreEmulator(db, FH, FP);
    connectStorageEmulator(storage, SH, SP);
    if (functions && connectFunctionsEmulator) {
      try { connectFunctionsEmulator(functions, FnH, FnP); } catch {}
    }
  }
  console.info('[firebase] Initialized', {
    projectId: firebaseConfig.projectId,
    usingEmulators: useEmu,
    emulators: useEmu ? {
      auth: `${import.meta.env.VITE_EMULATOR_AUTH_HOST || '127.0.0.1'}:${import.meta.env.VITE_EMULATOR_AUTH_PORT || 9099}`,
      firestore: `${import.meta.env.VITE_EMULATOR_FIRESTORE_HOST || '127.0.0.1'}:${import.meta.env.VITE_EMULATOR_FIRESTORE_PORT || 8080}`,
      storage: `${import.meta.env.VITE_EMULATOR_STORAGE_HOST || '127.0.0.1'}:${import.meta.env.VITE_EMULATOR_STORAGE_PORT || 9199}`,
      functions: `${import.meta.env.VITE_EMULATOR_FUNCTIONS_HOST || '127.0.0.1'}:${import.meta.env.VITE_EMULATOR_FUNCTIONS_PORT || 5001}`,
    } : undefined,
  });
} else {
  if (!hasSdk) console.warn('[firebase] Skipping init: SDK missing');
  if (!hasEnv) console.warn('[firebase] Skipping init: missing env vars. See Frontend/Web/.env.example');
}

export { app, auth, db, storage };

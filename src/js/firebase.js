// Firebase client initialization for the Vite app
// Refactored to avoid top-level await for better browser compatibility

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

const hasEnv = required.every((k) => Boolean(import.meta.env[k]));
const useEmu = String(import.meta.env.VITE_USE_FIREBASE_EMULATORS).toLowerCase() === 'true';

let app, auth, db, storage;
let initPromise = null;

// Initialize Firebase asynchronously
async function initializeFirebase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!hasEnv) {
        console.warn('[firebase] Skipping init: missing env vars. See Frontend/Web/.env.example');
        return;
      }

      const { initializeApp } = await import('firebase/app');
      const { getAuth, connectAuthEmulator } = await import('firebase/auth');
      const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
      const { getStorage, connectStorageEmulator } = await import('firebase/storage');

      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);

      let functions = undefined;
      try {
        const { getFunctions, connectFunctionsEmulator } = await import('firebase/functions');
        functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || undefined);

        if (useEmu && functions) {
          const FnH = import.meta.env.VITE_EMULATOR_FUNCTIONS_HOST || '127.0.0.1';
          const FnP = Number(import.meta.env.VITE_EMULATOR_FUNCTIONS_PORT || 5001);
          connectFunctionsEmulator(functions, FnH, FnP);
        }
      } catch (e) {
        // Functions module is optional
      }

      if (useEmu) {
        const AH = import.meta.env.VITE_EMULATOR_AUTH_HOST || '127.0.0.1';
        const AP = Number(import.meta.env.VITE_EMULATOR_AUTH_PORT || 9099);
        const FH = import.meta.env.VITE_EMULATOR_FIRESTORE_HOST || '127.0.0.1';
        const FP = Number(import.meta.env.VITE_EMULATOR_FIRESTORE_PORT || 8080);
        const SH = import.meta.env.VITE_EMULATOR_STORAGE_HOST || '127.0.0.1';
        const SP = Number(import.meta.env.VITE_EMULATOR_STORAGE_PORT || 9199);

        connectAuthEmulator(auth, `http://${AH}:${AP}`, { disableWarnings: true });
        connectFirestoreEmulator(db, FH, FP);
        connectStorageEmulator(storage, SH, SP);
      }

      console.info('[firebase] Initialized', {
        projectId: firebaseConfig.projectId,
        usingEmulators: useEmu,
      });
    } catch (e) {
      console.warn('[firebase] SDK not installed yet. Run `npm install firebase`:', e.message);
    }
  })();

  return initPromise;
}

// Auto-initialize on import
initializeFirebase();

export { app, auth, db, storage, initializeFirebase };

import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

export async function registerWithEmail(name, email, password) {
  if (!auth) throw new Error('Firebase no inicializado');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

export async function loginWithEmail(email, password) {
  if (!auth) throw new Error('Firebase no inicializado');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase no inicializado');
  const provider = new GoogleAuthProvider();
  // Note: En el Auth Emulator, el flujo con proveedores externos puede no estar disponible.
  // En producción, habilita Google como proveedor en Firebase Console y agrega tu dominio.
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function resetPassword(email) {
  if (!auth) throw new Error('Firebase no inicializado');
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  if (!auth) throw new Error('Firebase no inicializado');
  await signOut(auth);
}

export function watchAuthState(cb) {
  if (!auth) {
    console.warn('[auth] Firebase no inicializado');
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
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

export async function changePassword(currentPassword, newPassword) {
  if (!auth || !auth.currentUser) throw new Error('Usuario no autenticado');

  const user = auth.currentUser;

  // Reautenticar al usuario con su contraseña actual
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Cambiar la contraseña
  await updatePassword(user, newPassword);

  return true;
}

export async function updateUserDisplayName(newName) {
  if (!auth || !auth.currentUser) throw new Error('Usuario no autenticado');

  const user = auth.currentUser;
  await updateProfile(user, { displayName: newName });

  return user;
}

export async function logout() {
  if (!auth) throw new Error('Firebase no inicializado');

  // Don't clear cart on logout - let user keep their items for when they return

  await signOut(auth);
}

export async function watchAuthState(cb) {
  // Wait for Firebase to initialize before watching auth state
  if (!auth) {
    console.log('[auth] Waiting for Firebase to initialize...');
    const { initializeFirebase, auth: authModule } = await import('./firebase.js');
    await initializeFirebase();

    // Import auth again after initialization
    const firebase = await import('./firebase.js');
    if (!firebase.auth) {
      console.warn('[auth] Firebase auth still not available');
      cb(null);
      return () => {};
    }

    return onAuthStateChanged(firebase.auth, cb);
  }
  return onAuthStateChanged(auth, cb);
}

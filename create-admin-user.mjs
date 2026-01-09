// Script temporal para crear usuario admin en Firestore
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

// Cargar service account desde variables de entorno o archivo
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';

try {
  const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  // Obtener el UID del usuario demo@frostware.com
  const userRecord = await admin.auth().getUserByEmail('demo@frostware.com');
  console.log('Usuario encontrado:', userRecord.uid, userRecord.email);

  // Crear/actualizar documento en Firestore
  await db.collection('users').doc(userRecord.uid).set({
    email: 'demo@frostware.com',
    role: 'admin',
    displayName: 'Admin Demo',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('✅ Documento de usuario admin creado/actualizado correctamente');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nNota: Este script requiere el archivo serviceAccountKey.json');
  console.log('Descárgalo desde Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

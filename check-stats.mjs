// Script para verificar estadísticas en Firestore
import admin from 'firebase-admin';

// Obtener project ID de las variables de entorno
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'frostware-website';

try {
  // Inicializar sin credenciales (usar emulador o project ID)
  admin.initializeApp({
    projectId: projectId
  });

  const db = admin.firestore();

  // Listar todos los documentos en user_statistics
  const statsSnapshot = await db.collection('user_statistics').get();
  
  if (statsSnapshot.empty) {
    console.log('❌ No hay documentos en user_statistics');
  } else {
    console.log(`✅ Encontrados ${statsSnapshot.size} documentos en user_statistics:\n`);
    statsSnapshot.forEach(doc => {
      console.log(`📄 ID: ${doc.id}`);
      console.log('   Datos:', JSON.stringify(doc.data(), null, 2));
      console.log('');
    });
  }

  // Listar sesiones
  const sessionsSnapshot = await db.collection('sessions').get();
  if (sessionsSnapshot.empty) {
    console.log('❌ No hay documentos en sessions');
  } else {
    console.log(`✅ Encontradas ${sessionsSnapshot.size} sesiones:\n`);
    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📄 ID: ${doc.id}`);
      console.log(`   Usuario: ${data.userId}`);
      console.log(`   Producto: ${data.productName}`);
      console.log(`   Estado: ${data.status}`);
      console.log('');
    });
  }

  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

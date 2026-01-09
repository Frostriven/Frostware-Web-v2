#!/usr/bin/env node

/**
 * Script para verificar el estado del usuario admin en Firebase
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración de Firebase desde .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAdminStatus() {
  try {
    console.log('🔍 Verificando estado del administrador...\n');

    // Verificar todos los usuarios con rol admin
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log(`📊 Total de usuarios en Firebase: ${snapshot.size}\n`);

    let adminCount = 0;
    snapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role === 'admin' || userData.isAdmin === true) {
        adminCount++;
        console.log('✅ Usuario Admin encontrado:');
        console.log(`   ID: ${doc.id}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Nombre: ${userData.name || 'N/A'}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   isAdmin: ${userData.isAdmin}`);
        console.log(`   Creado: ${userData.createdAt?.toDate?.() || 'N/A'}`);
        console.log('');
      }
    });

    if (adminCount === 0) {
      console.log('❌ No se encontró ningún usuario con rol de administrador');
      console.log('💡 Usa el botón "🔧 Configurar Admin" en el panel de administración');
    } else {
      console.log(`✅ Total de administradores: ${adminCount}`);
    }

    console.log('\n📋 Regla de admin actual en firestore.rules:');
    console.log('   Email permitido: danyley2000@gmail.com');
    console.log('\n💡 Asegúrate de que tu email de Google coincida con el de las reglas');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }

  process.exit(0);
}

checkAdminStatus();

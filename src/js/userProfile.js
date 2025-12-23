import { db } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp, query } from 'firebase/firestore';

// Obtener perfil del usuario
export async function getUserProfile(userId) {
  if (!db) throw new Error('Firestore no inicializado');

  const userDoc = doc(db, 'users', userId);
  const docSnap = await getDoc(userDoc);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // Crear perfil inicial si no existe
    const initialProfile = {
      name: '',
      phone: '',
      country: '',
      company: '',
      bio: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(userDoc, initialProfile);
    return initialProfile;
  }
}

// Actualizar perfil del usuario
export async function updateUserProfile(userId, profileData) {
  if (!db) throw new Error('Firestore no inicializado');

  const userDoc = doc(db, 'users', userId);
  const updateData = {
    ...profileData,
    updatedAt: serverTimestamp()
  };

  await updateDoc(userDoc, updateData);
  return updateData;
}

// Obtener productos del usuario
export async function getUserProducts(userId) {
  if (!db) throw new Error('Firestore no inicializado');

  // Usar subcolección: users/{userId}/purchasedProducts
  const purchasedProductsRef = collection(db, 'users', userId, 'purchasedProducts');
  const querySnapshot = await getDocs(purchasedProductsRef);
  const products = [];

  querySnapshot.forEach((doc) => {
    products.push({
      id: doc.id, // Este es el productId
      ...doc.data()
    });
  });

  return products;
}

// Agregar producto al usuario (simulando compra)
// Emergency function to clear phantom products
export async function clearPhantomProducts(userId) {
  if (!db) throw new Error('Firestore no inicializado');

  try {
    const userProductsRef = collection(db, 'users', userId, 'purchasedProducts');
    const snapshot = await getDocs(userProductsRef);

    console.log('🧹 Clearing', snapshot.size, 'phantom products...');

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log('✅ All phantom products cleared');
    return snapshot.size;
  } catch (error) {
    console.error('Error clearing phantom products:', error);
    throw error;
  }
}

// Make cleanup function available globally for emergency use
window.clearPhantomProducts = clearPhantomProducts;

export async function addUserProduct(userId, productData) {
  if (!db) throw new Error('Firestore no inicializado');

  // Usar subcolección con el productId como ID del documento
  const productDocRef = doc(db, 'users', userId, 'purchasedProducts', productData.id);

  // Check if product already exists for this user
  const existingDoc = await getDoc(productDocRef);
  if (existingDoc.exists()) {
    // Product already exists, return the existing one
    return {
      id: existingDoc.id,
      ...existingDoc.data()
    };
  }

  const productDoc = {
    // Ya no necesitamos userId ni productId porque están implícitos en la ruta
    name: productData.name,
    description: productData.description,
    price: productData.price,
    image: productData.image,
    category: productData.category || 'general',
    appUrl: productData.appUrl || null,
    // Eliminar accessToken redundante - la existencia del doc es suficiente
    purchaseDate: serverTimestamp(), // Usar timestamp del servidor
    status: 'active'
  };

  await setDoc(productDocRef, productDoc);
  return {
    id: productData.id, // El productId es el ID del documento
    ...productDoc
  };
}

// Nota: El accessToken fue eliminado - la existencia del documento es suficiente para verificar acceso

// Verificar acceso del usuario a una app específica
export async function verifyUserAppAccess(userId, productId) {
  if (!db) throw new Error('Firestore no inicializado');

  // Verificar directamente si existe el documento en la subcolección
  const productDocRef = doc(db, 'users', userId, 'purchasedProducts', productId);
  const productDoc = await getDoc(productDocRef);

  if (productDoc.exists()) {
    const productData = productDoc.data();
    // Solo verificar si el producto está activo
    if (productData.status === 'active') {
      return {
        hasAccess: true,
        appUrl: productData.appUrl,
        purchaseDate: productData.purchaseDate,
        productName: productData.name
      };
    }
  }

  return {
    hasAccess: false,
    message: 'No tienes acceso a esta aplicación. Adquiere el producto primero.'
  };
}

// Obtener todas las apps/guías a las que el usuario tiene acceso
export async function getUserApps(userId) {
  if (!db) throw new Error('Firestore no inicializado');

  const userProducts = await getUserProducts(userId);

  // Filter only products that have an associated app
  const userApps = userProducts
    .filter(product => product.appUrl)
    .map(product => ({
      id: product.id, // El productId
      name: product.name,
      description: product.description,
      appUrl: product.appUrl,
      purchaseDate: product.purchaseDate,
      image: product.image
    }));

  return userApps;
}

// Eliminar producto del usuario
export async function removeUserProduct(userId, productId) {
  if (!db) throw new Error('Firestore no inicializado');

  // Eliminar de la subcolección del usuario
  const productDocRef = doc(db, 'users', userId, 'purchasedProducts', productId);
  await deleteDoc(productDocRef);

  return { success: true };
}

// NOTA: Los productos se gestionan exclusivamente desde el panel de administración (#/admin)
// No hay productos hardcodeados - todos vienen de Firebase

// Crear usuario demo para desarrollo
export async function createDemoUser() {
  const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');
  const { auth } = await import('./firebase.js');

  const demoEmail = "demo@frostware.com";
  const demoPassword = "demo123456";

  try {
    // Intentar hacer login primero (el usuario ya puede existir)
    const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
    console.log('Usuario demo ya existe, sesión iniciada:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        // Crear nuevo usuario demo
        const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        console.log('Usuario demo creado:', userCredential.user.email);

        // Hacer al usuario demo administrador
        await makeUserAdmin(userCredential.user.uid);
        console.log('Usuario demo configurado como administrador');

        return userCredential.user;
      } catch (createError) {
        console.error('Error creando usuario demo:', createError);
        throw createError;
      }
    } else {
      console.error('Error inesperado:', error);
      throw error;
    }
  }
}

// Login rápido para desarrollo
export async function quickDemoLogin() {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const { auth } = await import('./firebase.js');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, "demo@frostware.com", "demo123456");
    console.log('Login demo exitoso:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.log('Usuario demo no existe, creándolo...');
    return await createDemoUser();
  }
}

// Cargar productos desde Firebase (única fuente de verdad)
export async function getProductsFromFirebase() {
  // Wait for Firebase to initialize if not ready
  if (!db) {
    const { initializeFirebase } = await import('./firebase.js');
    await initializeFirebase();

    // Import db again after initialization
    const firebase = await import('./firebase.js');
    if (!firebase.db) {
      throw new Error('Firestore no inicializado - Firebase es requerido para la aplicación');
    }
  }

  try {
    const productsQuery = query(collection(db, 'products'));
    const querySnapshot = await getDocs(productsQuery);
    const firebaseProducts = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Usar los campos directamente de Firebase sin mapeo
      firebaseProducts.push({
        id: doc.id,
        ...data,
        // Asegurar que los timestamps son objetos Date para compatibilidad
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });

    if (firebaseProducts.length === 0) {
      console.warn('No se encontraron productos en Firebase. Ejecute initializeProductsInFirebase() primero.');
    }

    // Debug: log first product structure
    if (firebaseProducts.length > 0) {
      console.log('🔍 First product from Firebase:', JSON.stringify(firebaseProducts[0], null, 2));
      if (firebaseProducts[0].detailedFeatures) {
        console.log('🔍 First detailed feature:', JSON.stringify(firebaseProducts[0].detailedFeatures[0], null, 2));
      }
    }

    return firebaseProducts;
  } catch (error) {
    console.error('Error cargando productos desde Firebase:', error);
    throw error; // No usar fallback - fallar explícitamente para detectar problemas
  }
}

// Inicializar categorías y badges en Firebase (solo metadata, NO productos)
export async function initializeProductsInFirebase() {
  if (!db) return;

  try {
    console.log('🚀 Inicializando categorías y badges en Firebase...');

    // 1. Inicializar Categorías por defecto
    await initializeCategoriesInFirebase();

    // 2. Inicializar Badges por defecto
    await initializeBadgesInFirebase();

    console.log('✅ Categorías y badges inicializados. Usa el panel de administración para crear productos.');

  } catch (error) {
    console.error('Error inicializando datos en Firebase:', error);
  }
}

async function initializeCategoriesInFirebase() {
  const defaultCategories = [
    { id: 'aviation', name: 'Aviación', color: '#3B82F6' },
    { id: 'development', name: 'Desarrollo', color: '#10B981' },
    { id: 'education', name: 'Educación', color: '#F59E0B' },
    { id: 'ai', name: 'Inteligencia Artificial', color: '#8B5CF6' },
    { id: 'technology', name: 'Tecnología', color: '#EF4444' },
    { id: 'design', name: 'Diseño', color: '#EC4899' },
    { id: 'business', name: 'Negocios', color: '#6B7280' }
  ];

  for (const cat of defaultCategories) {
    const catRef = doc(db, 'categories', cat.id);
    const catDoc = await getDoc(catRef);
    if (!catDoc.exists()) {
      await setDoc(catRef, cat);
      console.log(`✅ Categoría ${cat.name} inicializada`);
    }
  }
}

async function initializeBadgesInFirebase() {
  const defaultBadges = [
    { id: 'New', name: 'Nuevo', color: '#3B82F6' },
    { id: 'Popular', name: 'Popular', color: '#10B981' },
    { id: 'Bestseller', name: 'Bestseller', color: '#F59E0B' },
    { id: 'Premium', name: 'Premium', color: '#8B5CF6' },
    { id: 'Professional', name: 'Professional', color: '#EC4899' },
    { id: 'Enterprise', name: 'Enterprise', color: '#6366F1' }
  ];

  for (const badge of defaultBadges) {
    const badgeRef = doc(db, 'badges', badge.id);
    const badgeDoc = await getDoc(badgeRef);
    if (!badgeDoc.exists()) {
      await setDoc(badgeRef, badge);
      console.log(`✅ Badge ${badge.name} inicializada`);
    }
  }
}

// Verificar si un usuario es administrador
export async function isUserAdmin(userId) {
  if (!db) return false;

  try {
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      return userData.role === 'admin' || userData.isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error('Error verificando rol de administrador:', error);
    return false;
  }
}

// Hacer a un usuario administrador (solo para setup inicial)
export async function makeUserAdmin(userId) {
  if (!db) throw new Error('Firestore no inicializado');

  const userDoc = doc(db, 'users', userId);
  await updateDoc(userDoc, {
    role: 'admin',
    isAdmin: true,
    updatedAt: new Date()
  });

  return { success: true };
}

// Lista de emails de administradores predefinidos (fallback)
const ADMIN_EMAILS = [
  'demo@frostware.com'
  // Agrega más emails de administradores aquí
];

// Verificar si un email es de administrador
export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
}

// NOTA: sampleProducts ha sido eliminado - usar getProductsFromFirebase() para obtener productos
export const sampleProducts = [];

/*
=======================================================================================
FIREBASE DATABASE SCHEMA FOR SESSION HISTORY AND STATISTICS
=======================================================================================

Para implementar el historial de sesiones y estadísticas, necesitamos las siguientes
colecciones y subcollecciones en Firestore:

1. users/{userId}/sessions/{sessionId}
   - startedAt: timestamp
   - completedAt: timestamp
   - mode: 'practice' | 'exam'
   - totalQuestions: number
   - answeredQuestions: number
   - correctAnswers: number
   - score: number (percentage)
   - timeSpent: number (seconds)
   - products: array of productIds
   - topics: array of {productId, topicIds[]}
   - configuration: {
       questionCount: number,
       examTimer: number (if exam mode),
       selectedProducts: string[],
       selectedTopics: object
     }

2. users/{userId}/statistics/general
   - totalSessions: number
   - totalQuestionsAnswered: number
   - totalTimeSpent: number (seconds)
   - averageScore: number
   - bestScore: number
   - lastSessionDate: timestamp
   - preferredMode: 'practice' | 'exam'
   - streak: number (consecutive days)

3. users/{userId}/statistics/products/{productId}
   - sessionsCompleted: number
   - questionsAnswered: number
   - averageScore: number
   - bestScore: number
   - timeSpent: number (seconds)
   - topicsProgress: {
       [topicId]: {
         questionsAnswered: number,
         correctAnswers: number,
         averageScore: number,
         lastStudied: timestamp
       }
     }
   - lastSessionDate: timestamp

4. users/{userId}/progress/{productId}
   - overallProgress: number (percentage)
   - topicsCompleted: string[]
   - currentTopic: string
   - milestones: {
       firstSession: timestamp,
       halfway: timestamp,
       completed: timestamp
     }

FUNCTIONS TO IMPLEMENT:

// Session Management
export async function createSession(userId, configuration)
export async function updateSession(userId, sessionId, progress)
export async function completeSession(userId, sessionId, results)

// Statistics
export async function getUserStatistics(userId)
export async function getProductStatistics(userId, productId)
export async function updateUserStatistics(userId, sessionResults)

// Progress Tracking
export async function getProgressByProduct(userId, productId)
export async function updateProgress(userId, productId, topicId, score)

// History
export async function getSessionHistory(userId, limit = 10)
export async function getSessionsByProduct(userId, productId)
export async function getRecentActivity(userId, days = 7)

=======================================================================================
*/

// TODO: Implement session tracking functions
// TODO: Implement statistics calculation functions
// TODO: Implement progress tracking functions

// Force update Firebase products (for debugging)
window.forceUpdateFirebaseProducts = async () => {
  console.log('🔄 Force updating Firebase products...');
  await initializeProductsInFirebase();
  console.log('✅ Firebase products force updated');
};

// Completely delete all Firebase products (use with caution!)
window.recreateFirebaseProducts = async () => {
  if (!db) {
    console.error('❌ Firestore not initialized');
    return;
  }

  console.log('💥 ELIMINANDO TODOS LOS PRODUCTOS de Firebase...');
  console.warn('⚠️ Esta acción NO puede deshacerse. Los productos deben recrearse desde el panel de administración.');

  try {
    // Delete all existing products
    const productsQuery = query(collection(db, 'products'));
    const querySnapshot = await getDocs(productsQuery);

    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);
    console.log('🗑️ Todos los productos eliminados');
    console.log('💡 Usa el panel de administración (#/admin) para crear nuevos productos');

    // Reload the page to get fresh data
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Error eliminando productos:', error);
  }
};
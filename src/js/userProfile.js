import { db } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp, query, addDoc, orderBy, limit as firestoreLimit, where } from 'firebase/firestore';

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

// =====================================================================================
// ORDERS SYSTEM - Colección centralizada de órdenes/ventas
// =====================================================================================

/**
 * Crear una orden en la colección centralizada 'orders'
 * @param {string} userId - ID del usuario que compra
 * @param {string} userEmail - Email del usuario
 * @param {Object} productData - Datos del producto comprado
 * @returns {Object} - Orden creada con ID
 */
export async function createOrder(userId, userEmail, productData) {
  if (!db) throw new Error('Firestore no inicializado');

  // Obtener nombre del producto (manejar bilingüe)
  let productName = productData.name || productData.title || productData.id;
  if (typeof productName === 'object' && productName !== null) {
    productName = productName.es || productName.en || productData.id;
  }

  const orderData = {
    // Usuario
    userId: userId,
    userEmail: userEmail,

    // Producto
    productId: productData.id,
    productName: productName,
    productCategory: productData.category || 'general',

    // Precio
    price: parseFloat(productData.price) || 0,
    originalPrice: parseFloat(productData.originalPrice) || parseFloat(productData.price) || 0,
    currency: 'USD',

    // Estado
    status: 'completed',
    paymentMethod: 'demo', // Cambiar cuando tengas pasarela real

    // Timestamps
    createdAt: serverTimestamp(),
    completedAt: serverTimestamp()
  };

  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, orderData);

    console.log('✅ Orden creada:', docRef.id, orderData);

    return {
      id: docRef.id,
      ...orderData
    };
  } catch (error) {
    console.error('Error creando orden:', error);
    throw error;
  }
}

/**
 * Obtener todas las órdenes (para admin)
 * @param {number} limitCount - Límite de órdenes a obtener
 * @returns {Array} - Lista de órdenes
 */
export async function getAllOrders(limitCount = 100) {
  if (!db) throw new Error('Firestore no inicializado');

  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);

    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });

    return orders;
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    return [];
  }
}

/**
 * Obtener estadísticas financieras desde la colección orders
 * @returns {Object} - Estadísticas financieras
 */
export async function getFinancialStats() {
  if (!db) throw new Error('Firestore no inicializado');

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  try {
    // Obtener todas las órdenes completadas
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '==', 'completed'));
    const snapshot = await getDocs(q);

    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let yearRevenue = 0;
    const productSales = {};
    const dailyRevenue = {};
    const monthlyRevenue = {};

    snapshot.forEach(doc => {
      const order = doc.data();
      const price = parseFloat(order.price) || 0;
      const date = order.createdAt?.toDate() || new Date();

      totalRevenue += price;

      if (date >= startOfDay) {
        todayRevenue += price;
      }
      if (date >= startOfMonth) {
        monthRevenue += price;
      }
      if (date >= startOfYear) {
        yearRevenue += price;
      }

      // Ventas por producto
      const productName = order.productName || order.productId;
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          productId: order.productId,
          sales: 0,
          revenue: 0
        };
      }
      productSales[productName].sales++;
      productSales[productName].revenue += price;

      // Revenue por día
      const dayKey = date.toISOString().split('T')[0];
      dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + price;

      // Revenue por mes
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + price;
    });

    // Top productos
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // Revenue por día (últimos 7 días)
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      revenueByDay.push({
        date: key,
        label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        revenue: dailyRevenue[key] || 0
      });
    }

    // Revenue por mes (últimos 12 meses)
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth.push({
        month: key,
        label: d.toLocaleDateString('es-ES', { month: 'short' }),
        revenue: monthlyRevenue[key] || 0
      });
    }

    return {
      totalRevenue,
      todayRevenue,
      monthRevenue,
      yearRevenue,
      totalOrders: snapshot.size,
      topProducts,
      revenueByDay,
      revenueByMonth
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas financieras:', error);
    return {
      totalRevenue: 0,
      todayRevenue: 0,
      monthRevenue: 0,
      yearRevenue: 0,
      totalOrders: 0,
      topProducts: [],
      revenueByDay: [],
      revenueByMonth: []
    };
  }
}

/**
 * Obtener estadísticas de usuarios
 * @returns {Object} - Estadísticas de usuarios
 */
export async function getUserStats() {
  if (!db) throw new Error('Firestore no inicializado');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    let totalUsers = snapshot.size;
    let activeUsers = 0;

    snapshot.forEach(doc => {
      const user = doc.data();
      const lastLogin = user.lastLogin?.toDate?.() || user.updatedAt?.toDate?.();

      if (lastLogin && lastLogin > thirtyDaysAgo) {
        activeUsers++;
      }
    });

    // Si no hay datos de lastLogin, estimar usuarios activos
    if (activeUsers === 0 && totalUsers > 0) {
      activeUsers = Math.floor(totalUsers * 0.6);
    }

    return {
      totalUsers,
      activeUsers
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error);
    return {
      totalUsers: 0,
      activeUsers: 0
    };
  }
}

/**
 * Migrar datos existentes de purchasedProducts a orders
 * Ejecutar una sola vez para migrar datos históricos
 */
export async function migrateExistingPurchasesToOrders() {
  if (!db) throw new Error('Firestore no inicializado');

  console.log('🔄 Iniciando migración de compras existentes a orders...');

  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const userEmail = userData.email || 'unknown@email.com';

      // Obtener productos comprados del usuario
      const purchasedRef = collection(db, `users/${userId}/purchasedProducts`);
      const purchasedSnapshot = await getDocs(purchasedRef);

      for (const purchaseDoc of purchasedSnapshot.docs) {
        const purchase = purchaseDoc.data();
        const productId = purchaseDoc.id;

        // Verificar si ya existe una orden para este usuario/producto
        const ordersRef = collection(db, 'orders');
        const existingQuery = query(
          ordersRef,
          where('userId', '==', userId),
          where('productId', '==', productId)
        );
        const existingOrders = await getDocs(existingQuery);

        if (existingOrders.empty) {
          // Crear orden para esta compra histórica
          let productName = purchase.name || productId;
          if (typeof productName === 'object' && productName !== null) {
            productName = productName.es || productName.en || productId;
          }

          await addDoc(ordersRef, {
            userId,
            userEmail,
            productId,
            productName,
            productCategory: purchase.category || 'general',
            price: parseFloat(purchase.price) || 0,
            originalPrice: parseFloat(purchase.price) || 0,
            currency: 'USD',
            status: 'completed',
            paymentMethod: 'migrated',
            createdAt: purchase.purchaseDate || serverTimestamp(),
            completedAt: purchase.purchaseDate || serverTimestamp(),
            migratedAt: serverTimestamp()
          });

          migratedCount++;
          console.log(`✅ Migrada orden: ${productName} para usuario ${userId}`);
        } else {
          skippedCount++;
        }
      }
    }

    console.log(`🎉 Migración completada: ${migratedCount} órdenes migradas, ${skippedCount} omitidas (ya existían)`);
    return { migratedCount, skippedCount };

  } catch (error) {
    console.error('Error en migración:', error);
    throw error;
  }
}

// Hacer función de migración disponible globalmente para ejecutar desde consola
window.migrateExistingPurchasesToOrders = migrateExistingPurchasesToOrders;

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

  // Return all purchased products - access is implicit through purchase
  const userApps = userProducts.map(product => ({
    id: product.id, // El productId
    name: product.name,
    description: product.description,
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

// Obtener ofertas activas desde Firebase
export async function getActiveOffers() {
  if (!db) {
    const { initializeFirebase } = await import('./firebase.js');
    await initializeFirebase();

    const firebase = await import('./firebase.js');
    if (!firebase.db) {
      throw new Error('Firestore no inicializado - Firebase es requerido para la aplicación');
    }
  }

  try {
    const offersQuery = query(collection(db, 'offers'));
    const querySnapshot = await getDocs(offersQuery);
    const activeOffers = {};
    const now = new Date();

    console.log(`🔍 Buscando ofertas activas... (Total ofertas en DB: ${querySnapshot.size})`);

    querySnapshot.forEach((doc) => {
      const offer = doc.data();

      // Convertir timestamps de Firestore a Date si es necesario
      const startDate = offer.startDate?.toDate?.() || offer.startDate;
      const endDate = offer.endDate?.toDate?.() || offer.endDate;

      const isActive = offer.active;
      const isInDateRange = startDate <= now && endDate >= now;

      console.log(`📋 Oferta ${doc.id}:`, {
        productId: offer.productId,
        active: isActive,
        startDate: startDate.toLocaleDateString(),
        endDate: endDate.toLocaleDateString(),
        isInDateRange,
        willBeApplied: isActive && isInDateRange
      });

      // Verificar si la oferta está activa y dentro del rango de fechas
      if (isActive && isInDateRange) {
        console.log(`✅ Oferta activa para producto ${offer.productId}: $${offer.originalPrice} → $${offer.discountPrice}`);
        activeOffers[offer.productId] = {
          id: doc.id,
          originalPrice: offer.originalPrice,
          discountPrice: offer.discountPrice,
          startDate: startDate,
          endDate: endDate,
          description: offer.description
        };
      }
    });

    console.log(`📦 Total ofertas activas a aplicar: ${Object.keys(activeOffers).length}`);
    return activeOffers;
  } catch (error) {
    console.error('Error cargando ofertas activas:', error);
    return {};
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

    // Obtener ofertas activas
    const activeOffers = await getActiveOffers();
    console.log(`🎁 Ofertas activas encontradas:`, Object.keys(activeOffers).length);

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Crear objeto base del producto
      const product = {
        id: doc.id,
        ...data,
        // Asegurar que los timestamps son objetos Date para compatibilidad
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      };

      // Aplicar oferta activa si existe (esto sobrescribe los valores de Firebase)
      if (activeOffers[doc.id]) {
        const offer = activeOffers[doc.id];
        console.log(`✨ Aplicando oferta a producto ${doc.id}:`, {
          precioEnFirebase: data.price,
          precioConOferta: offer.discountPrice,
          originalPrice: offer.originalPrice,
          descuento: `${Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100)}%`
        });
        product.originalPrice = offer.originalPrice;
        product.price = offer.discountPrice;
        product.hasActiveOffer = true;
        product.activeOfferId = offer.id;
      } else if (data.hasActiveOffer) {
        // Si Firebase dice que hay oferta activa, mantener esos valores
        console.log(`📦 Producto ${doc.id} tiene oferta en Firebase:`, {
          price: data.price,
          originalPrice: data.originalPrice,
          hasActiveOffer: data.hasActiveOffer
        });
      }

      firebaseProducts.push(product);
    });

    console.log(`✅ ${firebaseProducts.length} productos cargados, ${Object.keys(activeOffers).length} con ofertas activas en tiempo real`);

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
  'danyley2000@gmail.com'
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
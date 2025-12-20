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

// Productos iniciales para poblar Firebase (solo usados en initializeProductsInFirebase)
// IMPORTANTE: Estos productos solo se usan para inicializar la base de datos
// La aplicación siempre carga productos desde Firebase usando getProductsFromFirebase()
const initialProducts = [
  {
    id: 'north-atlantic-ops',
    title: {
      es: 'Procedimientos Operacionales del Atlántico Norte',
      en: 'North Atlantic Operational Procedures'
    },
    shortDescription: {
      es: 'Un banco de preguntas completo para pilotos transoceánicos que operan en el espacio aéreo del Atlántico Norte. Basado en documentos oficiales de OACI con referencias y justificaciones.',
      en: 'A comprehensive question bank for transoceanic pilots operating in North Atlantic airspace. Based on official ICAO documents with references and justifications.'
    },
    longDescription: {
      es: 'El banco de preguntas más completo para pilotos transoceánicos. Estudia procedimientos oficiales de OACI, practica con escenarios reales y aprueba tu certificación de operaciones NAT con confianza.',
      en: 'The most comprehensive question bank for transoceanic pilots. Study official ICAO procedures, practice with real scenarios, and pass your NAT operations certification with confidence.'
    },
    price: 99,
    originalPrice: 150,
    imageURL: 'https://placehold.co/600x400/1a202c/FFFFFF?text=NAT+OPS&font=inter',
    category: 'aviation',
    detailGradientColors: ['#1b1b25', '#190d36', '#1b1b25'],
    cardBgColor: '#1b1b25',
    badge: 'Disponible',
    badgeColor: 'blue',
    rating: 5.0,
    reviews: 342,
    features: ['Banco de preguntas interactivo', 'Documentos ICAO oficiales', 'Referencias y justificaciones', 'Acceso completo'],
    detailedFeatures: [
      {
        icon: 'radio',
        title: {
          es: 'Procedimientos de Comunicación',
          en: 'Communications Procedures'
        },
        description: {
          es: 'Domina protocolos de radio HF, operaciones SELCAL y requisitos de reporte de posición para vuelos oceánicos.',
          en: 'Master HF radio protocols, SELCAL operations, and position reporting requirements for oceanic flight.'
        }
      },
      {
        icon: 'map',
        title: {
          es: 'Sistemas de Navegación y Rutas',
          en: 'Navigation & Track Systems'
        },
        description: {
          es: 'Aprende sistemas de rutas NAT, procedimientos de waypoints y requisitos RNAV para navegación oceánica segura.',
          en: 'Learn NAT track systems, waypoint procedures, and RNAV requirements for safe oceanic navigation.'
        }
      },
      {
        icon: 'cloud',
        title: {
          es: 'Meteorología y Ambiente',
          en: 'Weather & Environmental'
        },
        description: {
          es: 'Comprende cartas SIGWX, reporte de turbulencias y cómo el clima afecta las operaciones NAT.',
          en: 'Understand SIGWX charts, turbulence reporting, and how weather affects NAT operations.'
        }
      },
      {
        icon: 'warning',
        title: {
          es: 'Procedimientos de Emergencia',
          en: 'Emergency Procedures'
        },
        description: {
          es: 'Practica procedimientos de contingencia, desvíos y requisitos ETOPS para operaciones seguras.',
          en: 'Practice contingency procedures, diversions, and ETOPS requirements for safe operations.'
        }
      },
      {
        icon: 'certificate',
        title: {
          es: 'Listo para Certificación',
          en: 'Certification Ready'
        },
        description: {
          es: 'Preguntas diseñadas para coincidir con exámenes de certificación reales con explicaciones detalladas y referencias.',
          en: 'Questions designed to match real certification exams with detailed explanations and references.'
        }
      },
      {
        icon: 'lightning',
        title: {
          es: 'Aprendizaje Interactivo',
          en: 'Interactive Learning'
        },
        description: {
          es: 'Pistas, explicaciones detalladas y seguimiento de progreso para optimizar tus sesiones de estudio.',
          en: 'Hints, detailed explanations, and progress tracking to optimize your study sessions.'
        }
      }
    ],
    tags: ['aviation', 'NAT', 'oceanic', 'procedures'],
    appUrl: '/apps/north-atlantic-procedures/guide.html'
  },

  {
    id: 'p2',
    title: {
      es: 'Calculadora de Rendimiento P2',
      en: 'P2 Performance Calculator'
    },
    shortDescription: {
      es: 'Herramienta avanzada de cálculo de rendimiento para operaciones de vuelo. Incluye análisis de peso y balance, consumo de combustible y optimización de rutas.',
      en: 'Advanced flight performance calculation tool. Includes weight and balance analysis, fuel consumption and route optimization.'
    },
    longDescription: {
      es: 'El banco de preguntas más completo para pilotos transoceánicos. Estudia procedimientos oficiales de OACI, practica con escenarios reales y aprueba tu certificación de operaciones NAT con confianza.',
      en: 'The most comprehensive question bank for transoceanic pilots. Study official ICAO procedures, practice with real scenarios, and pass your NAT operations certification with confidence.'
    },
    price: 99,
    originalPrice: 150,
    imageURL: 'https://static.vecteezy.com/system/resources/previews/001/194/635/non_2x/snowflake-png.png',
    category: 'aviation',
    detailGradientColors: ['#d4d8dfff', '#39c815ff', '#51023cff'],
    cardBgColor: '#d4d8dfff',
    badge: 'Disponible',
    badgeColor: 'blue',
    rating: 5.0,
    reviews: 342,
    features: ['Banco de preguntas interactivo', 'Documentos ICAO oficiales', 'Referencias y justificaciones', 'Acceso completo'],
    detailedFeatures: [
      {
        icon: 'radio',
        title: {
          es: 'Procedimientos de Comunicación',
          en: 'Communications Procedures'
        },
        description: {
          es: 'Domina protocolos de radio HF, operaciones SELCAL y requisitos de reporte de posición para vuelos oceánicos.',
          en: 'Master HF radio protocols, SELCAL operations, and position reporting requirements for oceanic flight.'
        }
      },
      {
        icon: 'map',
        title: {
          es: 'Sistemas de Navegación y Rutas',
          en: 'Navigation & Track Systems'
        },
        description: {
          es: 'Aprende sistemas de rutas NAT, procedimientos de waypoints y requisitos RNAV para navegación oceánica segura.',
          en: 'Learn NAT track systems, waypoint procedures, and RNAV requirements for safe oceanic navigation.'
        }
      },
      {
        icon: 'cloud',
        title: {
          es: 'Meteorología y Ambiente',
          en: 'Weather & Environmental'
        },
        description: {
          es: 'Comprende cartas SIGWX, reporte de turbulencias y cómo el clima afecta las operaciones NAT.',
          en: 'Understand SIGWX charts, turbulence reporting, and how weather affects NAT operations.'
        }
      },
      {
        icon: 'warning',
        title: {
          es: 'Procedimientos de Emergencia',
          en: 'Emergency Procedures'
        },
        description: {
          es: 'Practica procedimientos de contingencia, desvíos y requisitos ETOPS para operaciones seguras.',
          en: 'Practice contingency procedures, diversions, and ETOPS requirements for safe operations.'
        }
      },
      {
        icon: 'certificate',
        title: {
          es: 'Listo para Certificación',
          en: 'Certification Ready'
        },
        description: {
          es: 'Preguntas diseñadas para coincidir con exámenes de certificación reales con explicaciones detalladas y referencias.',
          en: 'Questions designed to match real certification exams with detailed explanations and references.'
        }
      },
      {
        icon: 'lightning',
        title: {
          es: 'Aprendizaje Interactivo',
          en: 'Interactive Learning'
        },
        description: {
          es: 'Pistas, explicaciones detalladas y seguimiento de progreso para optimizar tus sesiones de estudio.',
          en: 'Hints, detailed explanations, and progress tracking to optimize your study sessions.'
        }
      }
    ],
    tags: ['aviation', 'NAT', 'oceanic', 'procedures'],
    appUrl: '/apps/north-atlantic-procedures/guide.html'
  },


];

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
  if (!db) {
    throw new Error('Firestore no inicializado - Firebase es requerido para la aplicación');
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

// Guardar productos estáticos en Firebase (función de inicialización)
export async function initializeProductsInFirebase() {
  if (!db) return;

  try {
    // 1. Inicializar Productos
    for (const product of initialProducts) {
      const productRef = doc(db, 'products', product.id);
      const productDoc = await getDoc(productRef);

      if (productDoc.exists()) {
        const existingData = productDoc.data();
        // Criterios para actualizar - verificar si faltan campos importantes
        const needsUpdate =
          !existingData.detailedFeatures ||
          !existingData.rating ||
          !existingData.reviews ||
          !existingData.detailGradientColors ||
          !existingData.cardBgColor ||
          !existingData.badge ||
          !existingData.features ||
          existingData.detailedFeatures.length !== product.detailedFeatures?.length ||
          typeof existingData.shortDescription === 'string' ||
          typeof existingData.longDescription === 'string' ||
          typeof existingData.title === 'string';

        if (needsUpdate) {
          console.log(`🔄 Updating product ${product.id} with all fields...`);
          // Actualizar con TODOS los campos del producto usando nombres de Firebase
          await updateDoc(productRef, {
            title: product.title,
            shortDescription: product.shortDescription,
            longDescription: product.longDescription,
            price: product.price,
            originalPrice: product.originalPrice,
            imageURL: product.imageURL,
            category: product.category,
            detailGradientColors: product.detailGradientColors || [],
            cardBgColor: product.cardBgColor,
            badge: product.badge,
            badgeColor: product.badgeColor,
            rating: product.rating || 4.5,
            reviews: product.reviews || 0,
            features: product.features || [],
            detailedFeatures: product.detailedFeatures || [],
            tags: product.tags || [],
            appUrl: product.appUrl || null,
            updatedAt: serverTimestamp()
          });
          console.log(`✅ Product ${product.id} updated with all fields`);
        }
      } else {
        // Crear producto nuevo con todos los campos
        const productWithTimestamps = {
          ...product,
          // Asegurar valores por defecto para campos opcionales
          rating: product.rating || 4.5,
          reviews: product.reviews || 0,
          detailGradientColors: product.detailGradientColors || [],
          cardBgColor: product.cardBgColor,
          features: product.features || [],
          detailedFeatures: product.detailedFeatures || [],
          tags: product.tags || [],
          appUrl: product.appUrl || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(productRef, productWithTimestamps);
        console.log(`✅ Producto ${product.id} inicializado con todos los campos`);
      }
    }

    // 2. Inicializar Categorías por defecto
    await initializeCategoriesInFirebase();

    // 3. Inicializar Badges por defecto
    await initializeBadgesInFirebase();

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

// NOTA: Para compatibilidad con código legacy, se exporta initialProducts
// Sin embargo, SIEMPRE debes usar getProductsFromFirebase() para obtener productos
export const sampleProducts = initialProducts;

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

// Completely recreate Firebase products (nuclear option)
window.recreateFirebaseProducts = async () => {
  if (!db) {
    console.error('❌ Firestore not initialized');
    return;
  }

  console.log('💥 Completely recreating Firebase products...');

  try {
    // Delete all existing products
    const productsQuery = query(collection(db, 'products'));
    const querySnapshot = await getDocs(productsQuery);

    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);
    console.log('🗑️ Deleted all existing products');

    // Recreate products with new structure
    const { serverTimestamp } = await import('firebase/firestore');

    for (const product of initialProducts) {
      const productRef = doc(db, 'products', product.id);
      const productWithTimestamps = {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(productRef, productWithTimestamps);
      console.log(`✅ Recreated product ${product.id} with new structure`);
    }

    console.log('🎉 All products recreated successfully!');

    // Reload the page to get fresh data
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Error recreating products:', error);
  }
};
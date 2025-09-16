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

// Productos disponibles en la tienda
export const products = [
  {
    id: 'north-atlantic-ops',
    name: 'North Atlantic Operational Procedures',
    description: 'A comprehensive question bank for transoceanic pilots operating in North Atlantic airspace. Based on official ICAO documents with references and justifications.',
    longDescription: 'The most comprehensive question bank for transoceanic pilots. Study official ICAO procedures, practice with real scenarios, and pass your NAT operations certification with confidence.',
    price: 99,
    originalPrice: 150,
    image: 'https://placehold.co/600x400/1a202c/FFFFFF?text=NAT+OPS&font=inter',
    category: 'aviation',
    colors: ['#d4d8dfff', '#39c815ff', '#51023cff'],
    badge: 'Disponible',
    badgeColor: 'blue',
    rating: 5.0,
    reviews: 342,
    features: ['Banco de preguntas interactivo', 'Documentos ICAO oficiales', 'Referencias y justificaciones', 'Acceso completo'],
    detailedFeatures: [
      {
        icon: 'radio',
        title: 'Communications Procedures',
        description: 'Master HF radio protocols, SELCAL operations, and position reporting requirements for oceanic flight.'
      },
      {
        icon: 'map',
        title: 'Navigation & Track Systems',
        description: 'Learn NAT track systems, waypoint procedures, and RNAV requirements for safe oceanic navigation.'
      },
      {
        icon: 'cloud',
        title: 'Weather & Environmental',
        description: 'Understand SIGWX charts, turbulence reporting, and how weather affects NAT operations.'
      },
      {
        icon: 'warning',
        title: 'Emergency Procedures',
        description: 'Practice contingency procedures, diversions, and ETOPS requirements for safe operations.'
      },
      {
        icon: 'certificate',
        title: 'Certification Ready',
        description: 'Questions designed to match real certification exams with detailed explanations and references.'
      },
      {
        icon: 'lightning',
        title: 'Interactive Learning',
        description: 'Hints, detailed explanations, and progress tracking to optimize your study sessions.'
      }
    ],
    tags: ['aviation', 'NAT', 'oceanic', 'procedures'],
    appUrl: '/apps/north-atlantic-procedures/guide.html'
  },

  {
    id: 'p2',
    name: 'P2',
    description: 'A comprehensive question bank for transoceanic pilots operating in North Atlantic airspace. Based on official ICAO documents with references and justifications.',
    longDescription: 'The most comprehensive question bank for transoceanic pilots. Study official ICAO procedures, practice with real scenarios, and pass your NAT operations certification with confidence.',
    price: 99,
    originalPrice: 150,
    image: 'https://static.vecteezy.com/system/resources/previews/001/194/635/non_2x/snowflake-png.png',
    category: 'aviation',
    colors: ['#d4d8dfff', '#39c815ff', '#51023cff'],
    badge: 'Disponible',
    badgeColor: 'blue',
    rating: 5.0,
    reviews: 342,
    features: ['Banco de preguntas interactivo', 'Documentos ICAO oficiales', 'Referencias y justificaciones', 'Acceso completo'],
    detailedFeatures: [
      {
        icon: 'radio',
        title: 'Communications Procedures',
        description: 'Master HF radio protocols, SELCAL operations, and position reporting requirements for oceanic flight.'
      },
      {
        icon: 'map',
        title: 'Navigation & Track Systems',
        description: 'Learn NAT track systems, waypoint procedures, and RNAV requirements for safe oceanic navigation.'
      },
      {
        icon: 'cloud',
        title: 'Weather & Environmental',
        description: 'Understand SIGWX charts, turbulence reporting, and how weather affects NAT operations.'
      },
      {
        icon: 'warning',
        title: 'Emergency Procedures',
        description: 'Practice contingency procedures, diversions, and ETOPS requirements for safe operations.'
      },
      {
        icon: 'certificate',
        title: 'Certification Ready',
        description: 'Questions designed to match real certification exams with detailed explanations and references.'
      },
      {
        icon: 'lightning',
        title: 'Interactive Learning',
        description: 'Hints, detailed explanations, and progress tracking to optimize your study sessions.'
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
      firebaseProducts.push({
        id: doc.id,
        ...doc.data(),
        // Asegurar que los timestamps son objetos Date para compatibilidad
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      });
    });

    if (firebaseProducts.length === 0) {
      console.warn('No se encontraron productos en Firebase. Ejecute initializeProductsInFirebase() primero.');
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
    // Actualizar productos existentes con nuevos campos
    for (const product of products) {
      const productRef = doc(db, 'products', product.id);
      const productDoc = await getDoc(productRef);

      if (productDoc.exists()) {
        // Si existe, actualizar con los nuevos campos (detailedFeatures)
        const existingData = productDoc.data();
        if (!existingData.detailedFeatures || existingData.detailedFeatures.length !== product.detailedFeatures?.length) {
          await updateDoc(productRef, {
            detailedFeatures: product.detailedFeatures || [],
            updatedAt: serverTimestamp()
          });
          console.log(`Producto ${product.id} actualizado con detailedFeatures`);
        }
      } else {
        // Si no existe, crear nuevo
        const productWithTimestamps = {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(productRef, productWithTimestamps);
        console.log(`Producto ${product.id} creado en Firebase`);
      }
    }
  } catch (error) {
    console.error('Error inicializando productos en Firebase:', error);
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

// Alias para compatibilidad
export const sampleProducts = products;
import { db } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';

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
      createdAt: new Date(),
      updatedAt: new Date()
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
    updatedAt: new Date()
  };

  await updateDoc(userDoc, updateData);
  return updateData;
}

// Obtener productos del usuario
export async function getUserProducts(userId) {
  if (!db) throw new Error('Firestore no inicializado');

  const productsQuery = query(
    collection(db, 'userProducts'),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(productsQuery);
  const products = [];

  querySnapshot.forEach((doc) => {
    products.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return products;
}

// Agregar producto al usuario (simulando compra)
export async function addUserProduct(userId, productData) {
  if (!db) throw new Error('Firestore no inicializado');

  // Check if product already exists for this user
  const existingProductQuery = query(
    collection(db, 'userProducts'),
    where('userId', '==', userId),
    where('productId', '==', productData.id)
  );

  const existingSnapshot = await getDocs(existingProductQuery);
  if (!existingSnapshot.empty) {
    // Product already exists, return the existing one
    const existingDoc = existingSnapshot.docs[0];
    return {
      id: existingDoc.id,
      ...existingDoc.data()
    };
  }

  const productDoc = {
    userId: userId,
    productId: productData.id,
    productName: productData.name,
    productDescription: productData.description,
    productPrice: productData.price,
    productImage: productData.image,
    appUrl: productData.appUrl || null, // URL to the interactive app/guide
    accessToken: generateAccessToken(), // Unique token for secure access
    purchaseDate: new Date(),
    status: 'active'
  };

  const docRef = await addDoc(collection(db, 'userProducts'), productDoc);
  return {
    id: docRef.id,
    ...productDoc
  };
}

// Generate a unique access token for secure app access
function generateAccessToken() {
  return 'frostware_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Verificar acceso del usuario a una app específica
export async function verifyUserAppAccess(userId, productId) {
  if (!db) throw new Error('Firestore no inicializado');

  const userProductsQuery = query(
    collection(db, 'userProducts'),
    where('userId', '==', userId),
    where('productId', '==', productId),
    where('status', '==', 'active')
  );

  const querySnapshot = await getDocs(userProductsQuery);

  if (!querySnapshot.empty) {
    const userProduct = querySnapshot.docs[0].data();
    return {
      hasAccess: true,
      accessToken: userProduct.accessToken,
      appUrl: userProduct.appUrl,
      purchaseDate: userProduct.purchaseDate,
      productName: userProduct.productName
    };
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
      id: product.id,
      productId: product.productId,
      name: product.productName,
      description: product.productDescription,
      appUrl: product.appUrl,
      accessToken: product.accessToken,
      purchaseDate: product.purchaseDate,
      image: product.productImage
    }));

  return userApps;
}

// Eliminar producto del usuario
export async function removeUserProduct(productId) {
  if (!db) throw new Error('Firestore no inicializado');

  const productDocRef = doc(db, 'userProducts', productId);
  await deleteDoc(productDocRef);

  return { success: true };
}

// Productos disponibles en la tienda
export const products = [
  {
    id: 'north-atlantic-ops',
    name: 'North Atlantic Operational Procedures',
    description: 'Guía completa para procedimientos operacionales del Atlántico Norte con banco de preguntas interactivo',
    longDescription: 'Banco de preguntas completo para pilotos transoceánicos que operan en el espacio aéreo del Atlántico Norte. Basado en documentos oficiales de ICAO con referencias y justificaciones.',
    price: 0,
    originalPrice: 0,
    image: 'https://placehold.co/600x400/1a202c/FFFFFF?text=NAT+OPS&font=inter',
    category: 'aviation',
    colors: ['#1e293b', '#0f172a', '#334155'],
    badge: 'Disponible',
    badgeColor: 'blue',
    rating: 5.0,
    reviews: 342,
    features: ['Banco de preguntas interactivo', 'Documentos ICAO oficiales', 'Referencias y justificaciones', 'Acceso completo'],
    tags: ['aviation', 'NAT', 'oceanic', 'procedures'],
    appUrl: '/apps/north-atlantic-procedures/guide.html'
  },
  {
    id: 'flight-performance-calc',
    name: 'Flight Performance Calculator',
    description: 'Calculadora avanzada de performance de vuelo para despegue, aterrizaje y planificación de combustible',
    longDescription: 'Cálculos avanzados de performance de vuelo para despegue, aterrizaje, planificación de combustible y peso & balance. Conforme a ICAO con múltiples tipos de aeronaves.',
    price: 49.99,
    originalPrice: 49.99,
    image: 'https://placehold.co/600x400/4c1d95/FFFFFF?text=Flight+Calculator&font=inter',
    category: 'aviation',
    colors: ['#4c1d95', '#6d28d9', '#8b5cf6'],
    badge: 'Professional',
    badgeColor: 'purple',
    rating: 4.0,
    reviews: 150,
    features: ['Cálculos de despegue/aterrizaje', 'Planificación de combustible', 'Peso & balance', 'Múltiples aeronaves'],
    tags: ['aviation', 'performance', 'calculator', 'flight'],
    appUrl: '/apps/flight-performance-calculator/guide.html'
  },
  {
    id: 'smartwatch-pro',
    name: 'SmartWatch Pro',
    description: 'Reloj inteligente con funciones avanzadas de salud y fitness',
    longDescription: 'Reloj inteligente de última generación con monitoreo continuo de salud, GPS integrado, resistencia al agua y batería de larga duración. Perfecto para deportistas y profesionales.',
    price: 299,
    originalPrice: 374,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'technology',
    colors: ['#1e293b', '#0f172a', '#334155'],
    badge: 'Bestseller',
    badgeColor: 'blue',
    rating: 4.8,
    reviews: 124,
    features: ['Monitor de frecuencia cardíaca', 'GPS integrado', 'Resistente al agua', 'Batería 7 días'],
    tags: ['smartwatch', 'fitness', 'health', 'technology']
  },
  {
    id: 'design-toolkit',
    name: 'Design Toolkit',
    description: 'Kit completo de herramientas para diseñadores creativos',
    longDescription: 'Suite completa de herramientas de diseño que incluye editores vectoriales, gestión de colores, tipografías premium y plantillas profesionales.',
    price: 149,
    originalPrice: 149,
    image: 'https://images.unsplash.com/photo-1558655146-9f40138c2ac8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'design',
    colors: ['#d97706', '#ea580c', '#f59e0b'],
    badge: 'Creative',
    badgeColor: 'orange',
    rating: 4.6,
    reviews: 89,
    features: ['Editor vectorial', 'Paletas de colores', 'Tipografías premium', 'Plantillas profesionales'],
    tags: ['design', 'graphics', 'creative', 'toolkit']
  },
  {
    id: 'business-suite',
    name: 'Business Suite',
    description: 'Suite completa de herramientas para gestión empresarial',
    longDescription: 'Plataforma integral de gestión empresarial con CRM, contabilidad, gestión de proyectos y análisis de datos en una sola solución.',
    price: 199,
    originalPrice: 234,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'business',
    colors: ['#4c1d95', '#6d28d9', '#8b5cf6'],
    badge: 'Professional',
    badgeColor: 'purple',
    rating: 4.9,
    reviews: 156,
    features: ['CRM integrado', 'Contabilidad automatizada', 'Gestión de proyectos', 'Análisis de datos'],
    tags: ['business', 'crm', 'accounting', 'management']
  },
  {
    id: 'learning-platform',
    name: 'Learning Platform',
    description: 'Plataforma de aprendizaje en línea con cursos interactivos',
    longDescription: 'Plataforma educativa completa con cursos interactivos, evaluaciones automáticas, seguimiento de progreso y certificaciones oficiales.',
    price: 99,
    originalPrice: 99,
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'education',
    colors: ['#16a34a', '#15803d', '#22c55e'],
    badge: 'Popular',
    badgeColor: 'green',
    rating: 4.7,
    reviews: 203,
    features: ['Cursos interactivos', 'Evaluaciones automáticas', 'Seguimiento de progreso', 'Certificaciones'],
    tags: ['education', 'learning', 'courses', 'certification']
  },
  {
    id: 'wireless-earbuds',
    name: 'Wireless Earbuds',
    description: 'Auriculares inalámbricos con cancelación de ruido',
    longDescription: 'Auriculares inalámbricos premium con cancelación activa de ruido, sonido de alta fidelidad y diseño ergonómico para uso prolongado.',
    price: 179,
    originalPrice: 179,
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'technology',
    colors: ['#dc2626', '#ef4444', '#f87171'],
    badge: 'Audio',
    badgeColor: 'red',
    rating: 4.5,
    reviews: 78,
    features: ['Cancelación de ruido', 'Sonido Hi-Fi', 'Diseño ergonómico', 'Batería 8 horas'],
    tags: ['audio', 'wireless', 'earbuds', 'noise-canceling']
  },
  {
    id: 'creative-studio',
    name: 'Creative Studio',
    description: 'Suite profesional para creativos y diseñadores',
    longDescription: 'Estudio creativo completo con herramientas avanzadas de diseño, edición de video, animación y efectos especiales para profesionales.',
    price: 399,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'design',
    colors: ['#0891b2', '#0e7490', '#06b6d4'],
    badge: 'Premium',
    badgeColor: 'cyan',
    rating: 4.9,
    reviews: 267,
    features: ['Edición de video 4K', 'Animación profesional', 'Efectos especiales', 'Exportación múltiple'],
    tags: ['creative', 'video', 'animation', 'professional']
  }
];

// Cargar productos desde Firebase
export async function getProductsFromFirebase() {
  if (!db) {
    console.warn('Firestore no inicializado, usando productos estáticos');
    return products;
  }

  try {
    const productsQuery = query(collection(db, 'products'));
    const querySnapshot = await getDocs(productsQuery);
    const firebaseProducts = [];

    querySnapshot.forEach((doc) => {
      firebaseProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Si no hay productos en Firebase, usar los productos estáticos
    return firebaseProducts.length > 0 ? firebaseProducts : products;
  } catch (error) {
    console.error('Error cargando productos desde Firebase:', error);
    return products; // Fallback a productos estáticos
  }
}

// Guardar productos estáticos en Firebase (función de inicialización)
export async function initializeProductsInFirebase() {
  if (!db) return;

  try {
    // Verificar si ya existen productos
    const productsQuery = query(collection(db, 'products'));
    const querySnapshot = await getDocs(productsQuery);

    if (querySnapshot.empty) {
      // No hay productos, agregar los productos estáticos
      for (const product of products) {
        await setDoc(doc(db, 'products', product.id), product);
      }
      console.log('Productos inicializados en Firebase');
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
  'admin@frostware.com',
  'daniel@frostware.com',
  'dan@dan.com',
  // Agrega más emails de administradores aquí
];

// Verificar si un email es de administrador
export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
}

// Alias para compatibilidad
export const sampleProducts = products;
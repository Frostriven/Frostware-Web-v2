import { db } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

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

  const productDoc = {
    userId: userId,
    productId: productData.id,
    productName: productData.name,
    productDescription: productData.description,
    productPrice: productData.price,
    productImage: productData.image,
    purchaseDate: new Date(),
    status: 'active'
  };

  const docRef = await addDoc(collection(db, 'userProducts'), productDoc);
  return {
    id: docRef.id,
    ...productDoc
  };
}

// Productos de ejemplo para testing
export const sampleProducts = [
  {
    id: 'nopac-procedures',
    name: 'NOPAC North Operational Pacific Procedures',
    description: 'Comprehensive training on North Operational Pacific procedures and routes.',
    price: 49.99,
    image: 'https://placehold.co/400x250/1e293b/FFFFFF?text=NOPAC+Procedures',
    category: 'Aviation Training'
  },
  {
    id: 'gold-datalink',
    name: 'GOLD Global Operational Datalink',
    description: 'Advanced training for Global Operational Datalink procedures.',
    price: 59.99,
    image: 'https://placehold.co/400x250/d97706/FFFFFF?text=GOLD+Datalink',
    category: 'Aviation Training'
  },
  {
    id: 'flight-calculator',
    name: 'Flight Performance Calculator',
    description: 'Advanced flight performance calculations for takeoff, landing, and fuel planning.',
    price: 29.99,
    image: 'https://placehold.co/400x250/4c1d95/FFFFFF?text=Flight+Calculator',
    category: 'Tools'
  },
  {
    id: 'focusflow',
    name: 'FocusFlow Productivity Suite',
    description: 'Complete productivity toolkit for professionals and creators.',
    price: 39.99,
    image: 'https://placehold.co/400x250/16a34a/FFFFFF?text=FocusFlow',
    category: 'Productivity'
  }
];
// Script temporal para crear 1 producto de prueba
// Ejecutar desde la consola del navegador: await createTestProduct()

import { db } from '../js/firebase.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function createTestProduct() {
  if (!db) {
    console.error('❌ Firebase no inicializado');
    return;
  }

  console.log('🚀 Creando producto de prueba...');

  const testProduct = {
    id: 'test-product-1',
    // Campos principales (products page)
    name: 'Producto de Prueba',
    description: 'Este es un producto de prueba temporal para desarrollo y testing.',
    // Campos alias (homepage)
    title: 'Producto de Prueba',
    shortDescription: 'Este es un producto de prueba temporal para desarrollo y testing.',
    // Precio y metadata
    price: 0,
    originalPrice: null,
    rating: 4.5,
    reviews: 123,
    category: 'technology',
    badge: 'New',
    // Imágenes
    image: 'https://placehold.co/600x400/22a7d0/FFFFFF?text=Test+Product&font=inter',
    imageURL: 'https://placehold.co/600x400/22a7d0/FFFFFF?text=Test+Product&font=inter',
    // Configuración
    showOnHomepage: true,
    appUrl: null,
    offerId: null,
    // Arrays
    features: ['Producto de prueba', 'Solo para testing', 'Borrar después'],
    tags: ['test', 'development'],
    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'products', testProduct.id), testProduct);
    console.log('✅ Producto de prueba creado exitosamente!');
    console.log('   ID:', testProduct.id);
    console.log('   Nombre:', testProduct.name);
    console.log('');
    console.log('💡 Para borrar este producto:');
    console.log('   await deleteProductById("test-product-1")');
    console.log('');
    console.log('🔄 Recarga la página para ver el producto');

    return testProduct;
  } catch (error) {
    console.error('❌ Error creando producto de prueba:', error);
    throw error;
  }
}

// Hacer la función disponible globalmente
if (typeof window !== 'undefined') {
  window.createTestProduct = createTestProduct;
  console.log('✨ Función disponible: createTestProduct()');
}

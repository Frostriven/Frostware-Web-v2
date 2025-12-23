// Helper para inicializar productos en Firebase
// Puedes importar esto en cualquier página y llamar las funciones

import { getProductsFromFirebase, initializeProductsInFirebase } from '../js/userProfile.js';
import { createTestProduct } from './create-test-product.js';

/**
 * Verifica cuántos productos hay en Firebase
 */
export async function checkFirebaseProducts() {
  console.log('🔍 Verificando productos en Firebase...');

  try {
    const products = await getProductsFromFirebase();

    console.log(`📦 Total de productos: ${products.length}`);

    if (products.length === 0) {
      console.warn('⚠️ No se encontraron productos en Firebase');
      console.log('💡 Ejecuta: initFirebaseProducts() para inicializar');
      return [];
    }

    console.table(products.map(p => ({
      ID: p.id,
      Nombre: typeof p.title === 'object' ? p.title.es : p.title,
      Precio: `$${p.price}`,
      Categoría: p.category
    })));

    return products;

  } catch (error) {
    console.error('❌ Error al verificar productos:', error);
    throw error;
  }
}

/**
 * Inicializa categorías y badges en Firebase
 * NOTA: Los productos se crean desde el panel de administración, no desde código
 */
export async function initFirebaseProducts() {
  console.log('🚀 Inicializando categorías y badges...');
  console.log('ℹ️  Los productos se crean desde el panel de administración (#/admin)');

  try {
    await initializeProductsInFirebase();
    console.log('✅ Categorías y badges inicializados!');

    // Verificar productos existentes
    const products = await getProductsFromFirebase();
    console.log(`📦 Productos actuales en Firebase: ${products.length}`);

    if (products.length === 0) {
      console.log('💡 No hay productos. Crea productos desde el panel de administración (#/admin)');
    }

    return products;

  } catch (error) {
    console.error('❌ Error al inicializar:', error);
    throw error;
  }
}

/**
 * Muestra un resumen completo
 */
export async function showFirebaseSummary() {
  console.log('📊 === RESUMEN DE FIREBASE ===');

  const products = await checkFirebaseProducts();

  if (products.length > 0) {
    console.log('\n🎯 Productos por categoría:');
    const categories = {};
    products.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    console.table(categories);

    console.log('\n💰 Rango de precios:');
    const prices = products.map(p => p.price).filter(p => p > 0);
    console.log(`  - Mínimo: $${Math.min(...prices)}`);
    console.log(`  - Máximo: $${Math.max(...prices)}`);
    console.log(`  - Promedio: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
  }

  console.log('\n================================\n');
}

/**
 * Elimina productos duplicados manteniendo solo los que tienen más campos
 */
export async function cleanDuplicateProducts() {
  console.log('🧹 Limpiando productos duplicados...');

  try {
    const products = await getProductsFromFirebase();

    // Agrupar por nombre similar
    const productsByName = {};

    products.forEach(product => {
      const name = typeof product.title === 'object'
        ? (product.title.es || product.title.en)
        : product.title;

      const cleanName = name.toLowerCase().trim();

      if (!productsByName[cleanName]) {
        productsByName[cleanName] = [];
      }

      productsByName[cleanName].push(product);
    });

    // Encontrar duplicados
    const duplicates = Object.entries(productsByName).filter(([name, prods]) => prods.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron duplicados');
      return;
    }

    console.log(`⚠️ Se encontraron ${duplicates.length} productos con duplicados:`);
    duplicates.forEach(([name, prods]) => {
      console.log(`  - "${name}": ${prods.length} versiones`);
    });

    console.log('\n📋 Lista de productos duplicados:');
    console.table(products.map(p => ({
      ID: p.id,
      Nombre: typeof p.title === 'object' ? p.title.es || p.title.en : p.title,
      Precio: p.price,
      'Tiene Rating': p.rating ? '✓' : '✗',
      'Tiene Colors': p.detailGradientColors && p.detailGradientColors.length > 0 ? '✓' : '✗',
      'Tiene Features': p.features && p.features.length > 0 ? '✓' : '✗'
    })));

    console.log('\n💡 Para eliminar manualmente, usa:');
    console.log('   await deleteProductById("ID_DEL_PRODUCTO")');

  } catch (error) {
    console.error('❌ Error limpiando duplicados:', error);
    throw error;
  }
}

/**
 * Elimina un producto por ID
 */
export async function deleteProductById(productId) {
  console.log(`🗑️ Eliminando producto ${productId}...`);

  try {
    const { db } = await import('../js/firebase.js');
    const { doc, deleteDoc } = await import('firebase/firestore');

    await deleteDoc(doc(db, 'products', productId));
    console.log(`✅ Producto ${productId} eliminado`);

    // Mostrar productos restantes
    await checkFirebaseProducts();

  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    throw error;
  }
}

/**
 * Elimina productos por nombre (útil para limpiar hardcoded products)
 */
export async function deleteProductsByName(...productNames) {
  console.log(`🗑️ Buscando y eliminando productos: ${productNames.join(', ')}...`);

  try {
    const products = await getProductsFromFirebase();
    let deletedCount = 0;

    for (const product of products) {
      const productName = typeof product.title === 'object'
        ? (product.title.es || product.title.en)
        : product.title;

      // Check if this product matches any of the names to delete
      const shouldDelete = productNames.some(name =>
        productName.toLowerCase().includes(name.toLowerCase())
      );

      if (shouldDelete) {
        await deleteProductById(product.id);
        deletedCount++;
        console.log(`✅ Eliminado: ${productName} (ID: ${product.id})`);
      }
    }

    if (deletedCount === 0) {
      console.log('⚠️ No se encontraron productos con esos nombres');
    } else {
      console.log(`✅ Total eliminados: ${deletedCount} productos`);
    }

    return deletedCount;

  } catch (error) {
    console.error('❌ Error eliminando productos:', error);
    throw error;
  }
}

/**
 * Sincroniza campos alias para compatibilidad entre homepage y products page
 * Agrega campos title/shortDescription/imageURL si solo existen name/description/image
 */
export async function syncProductFields() {
  console.log('🔄 Sincronizando campos de productos...');

  try {
    const { db } = await import('../js/firebase.js');
    const { doc, updateDoc } = await import('firebase/firestore');
    const products = await getProductsFromFirebase();

    console.log(`📦 Revisando ${products.length} productos...`);

    let updatedCount = 0;

    for (const product of products) {
      const updates = {};

      // Sync name <-> title
      if (product.name && !product.title) {
        updates.title = product.name;
      } else if (product.title && !product.name) {
        updates.name = product.title;
      }

      // Sync description <-> shortDescription
      if (product.description && !product.shortDescription) {
        updates.shortDescription = product.description;
      } else if (product.shortDescription && !product.description) {
        updates.description = product.shortDescription;
      }

      // Sync image <-> imageURL
      if (product.image && !product.imageURL) {
        updates.imageURL = product.image;
      } else if (product.imageURL && !product.image) {
        updates.image = product.imageURL;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'products', product.id), updates);
        console.log(`✅ ${product.id} actualizado:`, Object.keys(updates).join(', '));
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log('✅ Todos los productos ya están sincronizados');
    } else {
      console.log(`✅ ${updatedCount} productos actualizados`);
    }

    await checkFirebaseProducts();

  } catch (error) {
    console.error('❌ Error sincronizando productos:', error);
    throw error;
  }
}

/**
 * Marca todos los productos actuales para mostrarse en la homepage
 * Útil para migración después de agregar el campo showOnHomepage
 */
export async function markAllProductsForHomepage() {
  console.log('🏠 Marcando todos los productos para mostrarse en homepage...');

  try {
    const { db } = await import('../js/firebase.js');
    const { doc, updateDoc } = await import('firebase/firestore');
    const products = await getProductsFromFirebase();

    console.log(`📦 Actualizando ${products.length} productos...`);

    for (const product of products) {
      await updateDoc(doc(db, 'products', product.id), {
        showOnHomepage: true
      });
      console.log(`✅ ${product.id} marcado para homepage`);
    }

    console.log('✅ Todos los productos marcados exitosamente!');
    await checkFirebaseProducts();

  } catch (error) {
    console.error('❌ Error marcando productos:', error);
    throw error;
  }
}

/**
 * Marca productos específicos para mostrarse en la homepage
 */
export async function markProductsForHomepage(...productIds) {
  console.log(`🏠 Marcando ${productIds.length} productos para homepage...`);

  try {
    const { db } = await import('../js/firebase.js');
    const { doc, updateDoc } = await import('firebase/firestore');

    for (const productId of productIds) {
      await updateDoc(doc(db, 'products', productId), {
        showOnHomepage: true
      });
      console.log(`✅ ${productId} marcado para homepage`);
    }

    console.log('✅ Productos marcados exitosamente!');

  } catch (error) {
    console.error('❌ Error marcando productos:', error);
    throw error;
  }
}

// Hacer funciones disponibles globalmente para uso en consola
if (typeof window !== 'undefined') {
  window.checkFirebaseProducts = checkFirebaseProducts;
  window.initFirebaseProducts = initFirebaseProducts;
  window.showFirebaseSummary = showFirebaseSummary;
  window.cleanDuplicateProducts = cleanDuplicateProducts;
  window.deleteProductById = deleteProductById;
  window.deleteProductsByName = deleteProductsByName;
  window.syncProductFields = syncProductFields;
  window.markAllProductsForHomepage = markAllProductsForHomepage;
  window.markProductsForHomepage = markProductsForHomepage;
  window.createTestProduct = createTestProduct;

  console.log('✨ Funciones de Firebase disponibles:');
  console.log('  - checkFirebaseProducts() - Ver productos actuales');
  console.log('  - initFirebaseProducts() - Inicializar categorías y badges (NO crea productos)');
  console.log('  - showFirebaseSummary() - Ver resumen completo');
  console.log('  - cleanDuplicateProducts() - Detectar productos duplicados');
  console.log('  - deleteProductById("id") - Eliminar producto por ID');
  console.log('  - deleteProductsByName("nombre1", "nombre2") - Eliminar productos por nombre');
  console.log('  - syncProductFields() - Sincronizar campos name/title, description/shortDescription, image/imageURL');
  console.log('  - markAllProductsForHomepage() - Marcar todos para homepage');
  console.log('  - markProductsForHomepage("id1", "id2") - Marcar específicos para homepage');
  console.log('  - createTestProduct() - 🧪 CREAR PRODUCTO DE PRUEBA (temporal)');
  console.log('');
  console.log('💡 Para crear productos permanentes, usa el panel de administración: #/admin');
}

// Helper para inicializar productos en Firebase
// Puedes importar esto en cualquier página y llamar las funciones

import { getProductsFromFirebase, initializeProductsInFirebase } from '../js/userProfile.js';

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
 * Inicializa los productos en Firebase
 * IMPORTANTE: Esta función ahora actualiza productos existentes si les faltan campos
 */
export async function initFirebaseProducts() {
  console.log('🚀 Iniciando inicialización/actualización de productos...');
  console.log('ℹ️  Esto actualizará productos existentes si les faltan campos como rating, reviews, etc.');

  try {
    await initializeProductsInFirebase();
    console.log('✅ Productos inicializados/actualizados exitosamente!');

    // Verificar
    const products = await getProductsFromFirebase();
    console.log(`📦 Total de productos después de inicializar: ${products.length}`);

    // Mostrar campos de un producto de ejemplo
    if (products.length > 0) {
      const sample = products[0];
      console.log('\n📋 Campos del primer producto:');
      console.log(`  - ID: ${sample.id}`);
      console.log(`  - Title: ${typeof sample.title === 'object' ? 'Multilingüe ✓' : sample.title}`);
      console.log(`  - Rating: ${sample.rating || 'FALTA'}`);
      console.log(`  - Reviews: ${sample.reviews || 'FALTA'}`);
      console.log(`  - Colors: ${sample.detailGradientColors ? sample.detailGradientColors.length + ' colores' : 'FALTA'}`);
      console.log(`  - Badge: ${sample.badge || 'FALTA'}`);
      console.log(`  - Features: ${sample.features ? sample.features.length + ' características' : 'FALTA'}`);
      console.log(`  - Detailed Features: ${sample.detailedFeatures ? sample.detailedFeatures.length + ' características detalladas' : 'FALTA'}`);
    }

    return products;

  } catch (error) {
    console.error('❌ Error al inicializar productos:', error);
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

// Hacer funciones disponibles globalmente para uso en consola
if (typeof window !== 'undefined') {
  window.checkFirebaseProducts = checkFirebaseProducts;
  window.initFirebaseProducts = initFirebaseProducts;
  window.showFirebaseSummary = showFirebaseSummary;
  window.cleanDuplicateProducts = cleanDuplicateProducts;
  window.deleteProductById = deleteProductById;

  console.log('✨ Funciones de Firebase disponibles:');
  console.log('  - checkFirebaseProducts() - Ver productos actuales');
  console.log('  - initFirebaseProducts() - Inicializar productos');
  console.log('  - showFirebaseSummary() - Ver resumen completo');
  console.log('  - cleanDuplicateProducts() - Detectar productos duplicados');
  console.log('  - deleteProductById("id") - Eliminar producto por ID');
}

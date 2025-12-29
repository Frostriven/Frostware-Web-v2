/**
 * Script para insertar el producto "North Atlantic Operational Procedures" en Firebase
 *
 * INSTRUCCIONES:
 * 1. Abre la consola de Chrome (F12)
 * 2. Copia y pega este script completo
 * 3. Presiona Enter
 * 4. Espera a que el producto se inserte
 * 5. Recarga la página para ver el producto
 *
 * NOTA: Este script se puede ejecutar directamente en la consola
 * También puedes modificar el objeto 'productData' para crear otros productos similares
 */

(async function insertNATOpsProduct() {
  console.log('🚀 Iniciando inserción del producto NAT OPS...');

  // Importar Firebase
  const { db } = await import('/src/js/firebase.js');
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

  if (!db) {
    console.error('❌ Firebase no está inicializado');
    return;
  }

  // Definición completa del producto
  const productData = {
    // ===== IDENTIFICACIÓN =====
    id: 'north-atlantic-ops',

    // ===== NOMBRES (bilingüe) =====
    name: {
      es: 'Procedimientos Operacionales del Atlántico Norte',
      en: 'North Atlantic Operational Procedures'
    },
    title: {
      es: 'Procedimientos Operacionales del Atlántico Norte',
      en: 'North Atlantic Operational Procedures'
    },

    // ===== DESCRIPCIONES (bilingüe) =====
    description: {
      es: 'Un banco de preguntas completo para pilotos transoceánicos que operan en el espacio aéreo del Atlántico Norte. Basado en documentos oficiales de OACI con referencias y justificaciones.',
      en: 'A comprehensive question bank for transoceanic pilots operating in North Atlantic airspace. Based on official ICAO documents with references and justifications.'
    },
    shortDescription: {
      es: 'Un banco de preguntas completo para pilotos transoceánicos que operan en el espacio aéreo del Atlántico Norte. Basado en documentos oficiales de OACI con referencias y justificaciones.',
      en: 'A comprehensive question bank for transoceanic pilots operating in North Atlantic airspace. Based on official ICAO documents with references and justifications.'
    },
    longDescription: {
      es: 'El banco de preguntas más completo para pilotos transoceánicos. Estudia procedimientos oficiales de OACI, practica con escenarios reales y aprueba tu certificación de operaciones NAT con confianza.',
      en: 'The most comprehensive question bank for transoceanic pilots. Study official ICAO procedures, practice with real scenarios, and pass your NAT operations certification with confidence.'
    },

    // ===== PRECIOS =====
    price: 99,
    originalPrice: 150,

    // ===== IMÁGENES =====
    image: 'https://placehold.co/600x400/1a202c/FFFFFF?text=NAT+OPS&font=inter',
    imageURL: 'https://placehold.co/600x400/1a202c/FFFFFF?text=NAT+OPS&font=inter',

    // ===== CATEGORÍA Y ETIQUETAS =====
    category: 'aviation',
    badge: 'Disponible',
    badgeColor: 'blue',
    tags: ['aviation', 'NAT', 'oceanic', 'procedures'],

    // ===== RATING Y REVIEWS =====
    rating: 5.0,
    reviews: 342,

    // ===== COLORES PARA GRADIENTE (detail page) =====
    colors: ['#1b1b25', '#190d36', '#1b1b25'],
    detailGradientColors: ['#1b1b25', '#190d36', '#1b1b25'],

    // ===== CARACTERÍSTICAS SIMPLES =====
    features: [
      'Banco de preguntas interactivo',
      'Documentos ICAO oficiales',
      'Referencias y justificaciones',
      'Acceso completo'
    ],

    // ===== CARACTERÍSTICAS DETALLADAS (para detail page) =====
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

    // ===== CONFIGURACIÓN =====
    showOnHomepage: true,
    appUrl: '/apps/north-atlantic-procedures/guide.html',
    offerId: null,

    // ===== TIMESTAMPS =====
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    console.log('📝 Insertando producto en Firestore...');
    console.log('   ID:', productData.id);
    console.log('   Nombre (ES):', productData.name.es);
    console.log('   Nombre (EN):', productData.name.en);
    console.log('   Precio:', `$${productData.price}`);
    console.log('   Categoría:', productData.category);

    await setDoc(doc(db, 'products', productData.id), productData);

    console.log('');
    console.log('✅ ¡Producto insertado exitosamente!');
    console.log('');
    console.log('📊 Resumen del producto:');
    console.log('   - ID:', productData.id);
    console.log('   - Nombre:', productData.name.es);
    console.log('   - Precio:', `$${productData.price} (antes $${productData.originalPrice})`);
    console.log('   - Categoría:', productData.category);
    console.log('   - Rating:', `${productData.rating}/5.0 (${productData.reviews} reviews)`);
    console.log('   - Features:', productData.features.length);
    console.log('   - Detailed Features:', productData.detailedFeatures.length);
    console.log('   - Colores de gradiente:', productData.detailGradientColors.join(', '));
    console.log('');
    console.log('🔗 URLs:');
    console.log('   - Ver producto: #/product/' + productData.id);
    console.log('   - App URL:', productData.appUrl);
    console.log('');
    console.log('🎨 El producto incluye:');
    console.log('   ✓ Nombres bilingües (ES/EN)');
    console.log('   ✓ Descripciones bilingües (corta, larga)');
    console.log('   ✓ 4 características simples');
    console.log('   ✓ 6 características detalladas con iconos');
    console.log('   ✓ Gradiente de colores personalizado');
    console.log('   ✓ Badge y rating');
    console.log('   ✓ Timestamps automáticos');
    console.log('');
    console.log('🔄 Recarga la página para ver el producto en acción');
    console.log('');
    console.log('💡 Para eliminar este producto:');
    console.log('   deleteProductById("' + productData.id + '")');

    return productData;
  } catch (error) {
    console.error('❌ Error insertando producto:', error);
    console.error('   Detalles:', error.message);
    throw error;
  }
})();

/**
 * PLANTILLA PARA CREAR MÁS PRODUCTOS
 *
 * Puedes copiar el objeto 'productData' de arriba y modificarlo para crear
 * otros productos. Los campos principales son:
 *
 * - id: Identificador único (ej: 'my-product-id')
 * - name/title: Nombres bilingües { es: '', en: '' }
 * - description/shortDescription/longDescription: Descripciones bilingües
 * - price: Precio actual
 * - originalPrice: Precio original (opcional)
 * - image/imageURL: URL de la imagen
 * - category: Categoría del producto
 * - badge/badgeColor: Etiqueta y color
 * - rating/reviews: Calificación y número de reseñas
 * - colors/detailGradientColors: Array de colores para el gradiente
 * - features: Array de características simples (strings)
 * - detailedFeatures: Array de objetos con { icon, title, description }
 * - tags: Array de etiquetas
 * - appUrl: URL de la aplicación
 * - showOnHomepage: true/false
 *
 * Iconos disponibles para detailedFeatures:
 * 'radio', 'map', 'cloud', 'warning', 'certificate', 'lightning',
 * 'code', 'database', 'shield', 'default'
 */

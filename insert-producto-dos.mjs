#!/usr/bin/env node
/**
 * Script Node.js para insertar "Producto Dos" en Firebase
 * Ejecutar: node insert-producto-dos.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDinqSKWJfwHCYDE9R6dojcfpMJzq_yNFk',
  authDomain: 'frostware-website.firebaseapp.com',
  projectId: 'frostware-website',
  storageBucket: 'frostware-website.firebasestorage.app',
  messagingSenderId: '982396359232',
  appId: '1:982396359232:web:2dd91562af60222e3745a5'
};

console.log('🚀 Iniciando inserción de Producto Dos...');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Definición completa del producto
const productData = {
  // ===== IDENTIFICACIÓN =====
  id: 'producto-dos',

  // ===== NOMBRES (bilingüe) =====
  name: {
    es: 'Producto Dos',
    en: 'Product Two'
  },
  title: {
    es: 'Producto Dos',
    en: 'Product Two'
  },

  // ===== DESCRIPCIONES (bilingüe) =====
  description: {
    es: 'Un producto de ejemplo para demostración. Incluye todas las características necesarias para pruebas y desarrollo.',
    en: 'A sample product for demonstration. Includes all necessary features for testing and development.'
  },
  shortDescription: {
    es: 'Un producto de ejemplo para demostración. Incluye todas las características necesarias para pruebas y desarrollo.',
    en: 'A sample product for demonstration. Includes all necessary features for testing and development.'
  },
  longDescription: {
    es: 'Este es un producto de ejemplo completo con todas las características del sistema. Perfecto para pruebas, desarrollo y demostraciones de funcionalidad.',
    en: 'This is a complete sample product with all system features. Perfect for testing, development and functionality demonstrations.'
  },

  // ===== PRECIOS =====
  price: 99,
  originalPrice: 150,

  // ===== IMÁGENES =====
  image: 'https://placehold.co/600x400/2d3748/FFFFFF?text=Producto+Dos&font=inter',
  imageURL: 'https://placehold.co/600x400/2d3748/FFFFFF?text=Producto+Dos&font=inter',

  // ===== CATEGORÍA Y ETIQUETAS =====
  category: 'aviation',
  badge: 'Disponible',
  badgeColor: 'blue',
  tags: ['ejemplo', 'demo', 'prueba', 'testing'],

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
  appUrl: '/apps/producto-dos/guide.html',
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

  process.exit(0);
} catch (error) {
  console.error('❌ Error insertando producto:', error);
  console.error('   Detalles:', error.message);
  process.exit(1);
}

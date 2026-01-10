import { auth, db } from '../../js/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import { waitForAuthReady } from '../../js/auth.js';
import { verifyUserAppAccess, getProductsFromFirebase, getUserProducts } from '../../js/userProfile.js';
import {
  createSession,
  completeSession,
  getUserStatistics,
  getUserSessions,
  getProductStatistics,
  formatTime
} from '../../js/sessionManager.js';
import { t, i18n } from '../../i18n/index.js';

// Cache para los temas cargados de cada producto
let topicsCache = {};

// Función para cargar temas desde Firebase basado en el databaseId del producto
async function loadTopicsFromDatabase(product) {
  const databaseId = product.databaseId;
  if (!databaseId) {
    console.warn(`⚠️ Producto ${product.id} no tiene databaseId`);
    return [];
  }

  // Verificar cache
  if (topicsCache[databaseId]) {
    return topicsCache[databaseId];
  }

  try {
    const questionsRef = collection(db, databaseId);
    const snapshot = await getDocs(questionsRef);

    if (snapshot.empty) {
      console.warn(`⚠️ No se encontraron preguntas en ${databaseId}`);
      return [];
    }

    // Extraer temas únicos y contar preguntas por tema
    const topicCounts = {};
    const currentLang = i18n.getCurrentLanguage();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      let topicName = data.topic;

      // Manejar temas multilingües
      if (typeof topicName === 'object' && topicName !== null) {
        topicName = topicName[currentLang] || topicName.es || topicName.en || 'Sin tema';
      }

      if (topicName) {
        if (!topicCounts[topicName]) {
          topicCounts[topicName] = 0;
        }
        topicCounts[topicName]++;
      }
    });

    // Convertir a array de objetos
    const topics = Object.entries(topicCounts).map(([name, questions]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: name,
      questions: questions
    }));

    // Ordenar alfabéticamente
    topics.sort((a, b) => a.name.localeCompare(b.name));

    // Guardar en cache
    topicsCache[databaseId] = topics;

    console.log(`✅ Cargados ${topics.length} temas de ${databaseId}:`, topics);
    return topics;
  } catch (error) {
    console.error(`❌ Error cargando temas de ${databaseId}:`, error);
    return [];
  }
}

export async function renderDashboardView(productId) {
  const spaRoot = document.getElementById('spa-root');
  if (!spaRoot) return;

  // Esperar a que las traducciones estén listas
  await i18n.ready();

  // Esperar a que Firebase determine el estado de autenticación
  // Esto previene redirecciones falsas durante la recarga de página
  await waitForAuthReady();

  // Verify authentication
  if (!auth?.currentUser) {
    window.location.hash = '#/auth/login';
    return;
  }

  // Verify user has access to this product
  const accessCheck = await verifyUserAppAccess(auth.currentUser.uid, productId);
  if (!accessCheck.hasAccess) {
    spaRoot.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div class="text-red-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('common.error')}</h2>
          <p class="text-gray-600 mb-6">${accessCheck.message}</p>
          <button onclick="window.location.hash='#/products'" class="bg-[#22a7d0] text-white px-6 py-3 rounded-lg hover:bg-[#1e96bc] transition-colors">
            ${t('account.products.viewProducts')}
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Get product information and user's purchased products
  let product = null;
  let allProducts = [];
  let userPurchasedProducts = [];
  let userStats = null;
  let productStats = null;

  try {
    allProducts = await getProductsFromFirebase();
    product = allProducts.find(p => p.id === productId);
    userPurchasedProducts = await getUserProducts(auth.currentUser.uid);

    // Load user statistics from new model
    try {
      // Load statistics for this specific product from the new structure
      // users/{userId}/stats/{productId}
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../js/firebase.js');

      const statsRef = doc(db, 'users', auth.currentUser.uid, 'stats', productId);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        productStats = statsSnap.data();
        console.log('📊 Estadísticas del producto cargadas:', productStats);
      } else {
        console.warn('⚠️ No hay estadísticas para este producto aún');
        productStats = {
          totalSessions: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          averageScore: 0,
          totalTimeStudied: 0,
          averageTimePerSession: 0,
          bestScore: 0,
          worstScore: 100,
          currentStreak: 0,
          longestStreak: 0,
          practiceMode: {
            sessions: 0,
            questions: 0,
            correct: 0,
            incorrect: 0,
            averageScore: 0,
            timeStudied: 0
          },
          examMode: {
            sessions: 0,
            questions: 0,
            correct: 0,
            incorrect: 0,
            averageScore: 0,
            timeStudied: 0,
            passed: 0,
            failed: 0
          },
          topicStats: {}
        };
      }

      // Calculate general user stats by aggregating all product stats
      userStats = {
        totalSessions: productStats.totalSessions || 0,
        totalQuestions: productStats.totalQuestions || 0,
        correctAnswers: productStats.totalCorrect || 0,
        incorrectAnswers: productStats.totalIncorrect || 0,
        averageScore: productStats.averageScore || 0,
        totalTimeSpent: productStats.totalTimeStudied || 0,
        currentStreak: productStats.currentStreak || 0,
        longestStreak: productStats.longestStreak || 0
      };
    } catch (statsError) {
      console.warn('⚠️ No se pudieron cargar estadísticas (puede ser primera vez):', statsError.message);
      // Usar estadísticas vacías si hay error
      userStats = {
        totalSessions: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0
      };
      productStats = {
        totalSessions: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        averageScore: 0,
        totalTimeStudied: 0,
        averageTimePerSession: 0,
        bestScore: 0,
        worstScore: 100,
        currentStreak: 0,
        longestStreak: 0,
        practiceMode: {
          sessions: 0,
          questions: 0,
          correct: 0,
          incorrect: 0,
          averageScore: 0,
          timeStudied: 0
        },
        examMode: {
          sessions: 0,
          questions: 0,
          correct: 0,
          incorrect: 0,
          averageScore: 0,
          timeStudied: 0,
          passed: 0,
          failed: 0
        },
        topicStats: {}
      };
    }

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Helper function to get text in current language (bilingual support)
    const getText = (field) => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      if (typeof field === 'object') {
        const lang = i18n.getCurrentLanguage();
        return field[lang] || field.es || field.en || '';
      }
      return '';
    };

    // Helper function to get product name safely
    const getProductName = (prod) => {
      return getText(prod.name) || getText(prod.title) || 'Producto';
    };

    // Enhance product with text getters
    product.displayName = getProductName(product);
    product.displayDescription = getText(product.description) || getText(product.shortDescription) || '';

    // Get colors for header gradient from product's detailGradientColors or colors array
    // Try multiple sources: detailGradientColors, colors, headerColor/headerColor2, or default to cyan theme
    const gradientColors = product.detailGradientColors || product.colors;

    if (gradientColors && Array.isArray(gradientColors) && gradientColors.length > 0) {
      product.headerColor1 = gradientColors[0];
      product.headerColor2 = gradientColors[1] || gradientColors[0];
    } else if (product.headerColor && product.headerColor2) {
      product.headerColor1 = product.headerColor;
      product.headerColor2 = product.headerColor2;
    } else {
      // Default to cyan theme
      product.headerColor1 = '#0891b2'; // cyan-600
      product.headerColor2 = '#0e7490'; // cyan-700
    }

    // Enhance userPurchasedProducts with displayNames
    userPurchasedProducts = userPurchasedProducts.map(p => ({
      ...p,
      displayName: getProductName(p)
    }));

    // Enhance allProducts with displayNames
    allProducts = allProducts.map(p => ({
      ...p,
      displayName: getProductName(p),
      displayDescription: getText(p.description) || getText(p.shortDescription) || ''
    }));

    // Debug logging
    console.log('🎨 Current Product:', {
      productId: product.id,
      name: product.name,
      displayName: product.displayName,
      gradientColors: gradientColors,
      headerColor1: product.headerColor1,
      headerColor2: product.headerColor2
    });

    console.log('📦 User Purchased Products:', userPurchasedProducts.map(p => ({
      id: p.id,
      displayName: p.displayName
    })));

    // Cargar temas desde Firebase para cada producto comprado
    console.log('📂 Cargando temas de Firebase para productos comprados...');
    for (const prod of userPurchasedProducts) {
      const fullProduct = allProducts.find(p => p.id === prod.id);
      if (fullProduct && fullProduct.databaseId) {
        const topics = await loadTopicsFromDatabase(fullProduct);
        prod.topics = topics;
        prod.totalQuestions = topics.reduce((sum, t) => sum + t.questions, 0);
        console.log(`📚 ${prod.displayName}: ${topics.length} temas, ${prod.totalQuestions} preguntas`);
      }
    }

    // También cargar temas para todos los productos (para mostrar info en los no comprados)
    for (const prod of allProducts) {
      if (prod.databaseId && !topicsCache[prod.databaseId]) {
        const topics = await loadTopicsFromDatabase(prod);
        prod.topics = topics;
        prod.totalQuestions = topics.reduce((sum, t) => sum + t.questions, 0);
      } else if (topicsCache[prod.databaseId]) {
        prod.topics = topicsCache[prod.databaseId];
        prod.totalQuestions = prod.topics.reduce((sum, t) => sum + t.questions, 0);
      }
    }
  } catch (error) {
    console.error('Error loading product:', error);
    spaRoot.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('common.error')}</h2>
          <p class="text-gray-600 mb-6">${t('productDetail.errorLoading')}</p>
          <button onclick="window.location.hash='#/products'" class="bg-[#22a7d0] text-white px-6 py-3 rounded-lg hover:bg-[#1e96bc] transition-colors">
            ${t('productDetail.backToProducts')}
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Create the purchased products set for easy lookup
  const purchasedProductIds = new Set(userPurchasedProducts.map(p => p.id));

  spaRoot.innerHTML = `
    <style>
      /* CSS Variables for theming */
      :root {
        --color-bg-primary: #ffffff;
        --color-bg-secondary: #f9fafb;
        --color-text-primary: #111827;
        --color-text-secondary: #4b5563;
        --color-border-primary: #e5e7eb;
        --color-brand-primary: #22a7d0;
        --color-brand-secondary: #1e96bc;
      }

      html.dark {
        --color-bg-primary: #0a0e1a;
        --color-bg-secondary: #1a1f2e;
        --color-text-primary: #e4e8ef;
        --color-text-secondary: #94a3b8;
        --color-border-primary: #1e293b;
      }

      /* Custom slider styles */
      .slider::-webkit-slider-thumb {
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 3px solid #22a7d0;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(34, 167, 208, 0.3);
        transition: all 0.3s ease;
      }

      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }

      .slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 3px solid #22a7d0;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(34, 167, 208, 0.3);
      }

      .slider::-webkit-slider-track {
        background: var(--color-border-primary, #e5e7eb);
        height: 8px;
        border-radius: 4px;
      }

      .slider::-moz-range-track {
        background: var(--color-border-primary, #e5e7eb);
        height: 8px;
        border-radius: 4px;
        border: none;
      }

      /* Card glassmorphism */
      .card-glass {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(34, 167, 208, 0.15);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-radius: 1rem;
      }

      html.dark .card-glass {
        background: rgba(26, 31, 46, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .card-glass:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 30px rgba(34, 167, 208, 0.2);
      }

      /* Database item styles */
      .database-item {
        position: relative;
        padding: 1.5rem;
        background: var(--color-bg-primary);
        border: 2px solid var(--color-border-primary);
        border-radius: 1rem;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .database-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, #22a7d0, #1e96bc);
        border-radius: 1rem 0 0 1rem;
        transform: scaleY(0);
        transition: transform 0.3s ease;
      }

      .database-item:hover::before {
        transform: scaleY(1);
      }

      .database-item:hover {
        border-color: #22a7d0;
        box-shadow: 0 4px 12px rgba(34, 167, 208, 0.2);
      }

      .database-item.selected {
        border-color: #22a7d0;
        background: rgba(34, 167, 208, 0.05);
      }

      html.dark .database-item {
        background: var(--color-bg-secondary);
      }

      html.dark .database-item.selected {
        background: rgba(34, 167, 208, 0.1);
      }

      /* Topic item styles */
      .topic-item {
        padding: 0.75rem;
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: 0.5rem;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .topic-item:hover {
        border-color: #22a7d0;
        background: rgba(34, 167, 208, 0.05);
      }

      .topic-item.selected {
        border-color: #22a7d0;
        background: rgba(34, 167, 208, 0.08);
      }

      html.dark .topic-item {
        background: var(--color-bg-secondary);
      }

      html.dark .topic-item:hover {
        background: rgba(34, 167, 208, 0.15);
      }

      html.dark .topic-item.selected {
        background: rgba(34, 167, 208, 0.2);
      }

      /* iOS Toggle Switch */
      .ios-toggle {
        position: relative;
        display: inline-block;
        width: 51px;
        height: 31px;
      }

      .ios-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .ios-toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #cbd5e1;
        transition: .3s;
        border-radius: 31px;
      }

      .ios-toggle-slider:before {
        position: absolute;
        content: "";
        height: 23px;
        width: 23px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .3s;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .ios-toggle input:checked + .ios-toggle-slider {
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      }

      .ios-toggle input:checked + .ios-toggle-slider:before {
        transform: translateX(20px);
      }

      .ios-toggle input:disabled + .ios-toggle-slider {
        background-color: #e2e8f0;
        cursor: not-allowed;
        opacity: 0.5;
      }

      html.dark .ios-toggle-slider {
        background-color: #475569;
      }

      html.dark .ios-toggle input:checked + .ios-toggle-slider {
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      }

      /* Mode card styles */
      .mode-card {
        padding: 1.5rem;
        background: var(--color-bg-primary);
        border: 2px solid var(--color-border-primary);
        border-radius: 1rem;
        transition: all 0.3s ease;
        cursor: pointer;
        text-align: center;
      }

      .mode-card:hover {
        border-color: #22a7d0;
        background: rgba(34, 167, 208, 0.05);
        transform: translateY(-2px);
      }

      .mode-card.selected {
        border-color: #22a7d0;
        background: rgba(34, 167, 208, 0.1);
        box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.2);
      }

      html.dark .mode-card {
        background: var(--color-bg-secondary);
      }

      html.dark .mode-card:hover {
        background: rgba(34, 167, 208, 0.15);
      }

      html.dark .mode-card.selected {
        background: rgba(34, 167, 208, 0.2);
      }

      /* Animations */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .fade-in {
        animation: slideIn 0.5s ease;
      }

      /* Custom checkbox for topics */
      .custom-checkbox {
        position: relative;
        width: 24px;
        height: 24px;
        min-width: 24px;
        border: 2px solid #cbd5e1;
        border-radius: 6px;
        background: white;
        transition: all 0.3s ease;
        flex-shrink: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .custom-checkbox:hover {
        border-color: #22a7d0;
        transform: scale(1.05);
      }

      .custom-checkbox svg {
        width: 14px;
        height: 14px;
        opacity: 0;
        transform: scale(0);
        transition: all 0.2s ease;
      }

      /* Estado seleccionado */
      .topic-item.selected .custom-checkbox,
      .database-item.selected .custom-checkbox {
        background: linear-gradient(135deg, #22a7d0 0%, #1e96bc 100%);
        border-color: #22a7d0;
        box-shadow: 0 2px 8px rgba(34, 167, 208, 0.4);
      }

      .topic-item.selected .custom-checkbox svg,
      .database-item.selected .custom-checkbox svg {
        opacity: 1;
        transform: scale(1);
      }

      /* Estado no seleccionado - más visible */
      .topic-item:not(.selected) .custom-checkbox {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      .topic-item:not(.selected) .custom-checkbox:hover {
        background: #e2e8f0;
        border-color: #94a3b8;
      }

      /* Dark mode */
      html.dark .custom-checkbox {
        background: #374151;
        border-color: #4b5563;
      }

      html.dark .topic-item:not(.selected) .custom-checkbox {
        background: #1f2937;
        border-color: #4b5563;
      }

      html.dark .topic-item:not(.selected) .custom-checkbox:hover {
        background: #374151;
        border-color: #6b7280;
      }

      html.dark .topic-item.selected .custom-checkbox {
        background: linear-gradient(135deg, #22a7d0 0%, #1e96bc 100%);
        border-color: #22a7d0;
      }
    </style>
    <div class="min-h-screen relative">
      <!-- Header Navigation -->
      <div class="page-header p-8 relative overflow-hidden" style="background: linear-gradient(135deg, ${product.headerColor1} 0%, ${product.headerColor2} 100%);">
        <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-white/15 to-transparent pointer-events-none"></div>
        <div class="container mx-auto max-w-7xl relative z-10">
          <div class="flex items-center gap-2 mb-4 text-white/80 text-sm">
            <a href="#/products" class="hover:text-white transition flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 19l-7-7 7-7"/>
              </svg>
              ${t('dashboard.header.backToProducts')}
            </a>
            <span>/</span>
            <span class="text-white">${t('dashboard.header.configureGuide')}</span>
          </div>
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-xl">
              ${product.image ? `<img src="${product.imageURL || product.image}" alt="${product.displayName}" class="w-full h-full object-cover rounded-2xl" />` : '📚'}
            </div>
            <div>
              <h1 class="text-4xl font-bold text-white mb-2">${product.displayName}</h1>
              <p class="text-white/90 text-lg">${product.displayDescription || 'Configura tu sesión de entrenamiento personalizada'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="container mx-auto px-6 py-8">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- Main Training Area -->
            <div class="lg:col-span-2 space-y-6">

              <!-- Product Database Selection -->
              <div class="card-glass p-6 fade-in">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2" style="border-color: var(--color-border-primary);">
                  <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span class="text-2xl">📚</span>
                  </div>
                  <h2 class="text-2xl font-bold" style="color: var(--color-text-primary);">${t('dashboard.databases.title')}</h2>
                </div>

                <!-- Info Banner -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                  <div class="flex gap-3">
                    <span class="text-2xl">💡</span>
                    <div class="flex-1">
                      <h3 class="font-extrabold text-blue-800 dark:text-blue-300 mb-2">${t('dashboard.databases.infoTitle')}</h3>
                      <ul class="text-sm font-semibold text-gray-800 dark:text-blue-300 space-y-1">
                        <li>• ${t('dashboard.databases.infoBullet1')}</li>
                        <li>• ${t('dashboard.databases.infoBullet2')}</li>
                        <li>• ${t('dashboard.databases.infoBullet3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Database Items -->
                <div class="space-y-4">
                  ${allProducts.map(prod => {
    const isPurchased = purchasedProductIds.has(prod.id);

    return `
                      <div class="database-item ${isPurchased ? 'selected' : 'locked'}" onclick="${isPurchased ? 'toggleDatabase(this)' : ''}" data-product-id="${prod.id}">
                        <div class="flex items-center gap-4">
                          ${isPurchased ? `
                            <label class="ios-toggle flex-shrink-0" onclick="event.stopPropagation()">
                              <input type="checkbox" id="product-${prod.id}" checked onchange="toggleProductDatabase('${prod.id}', this.checked)">
                              <span class="ios-toggle-slider"></span>
                            </label>
                          ` : `
                            <div class="flex-shrink-0 opacity-50">
                              <svg class="w-6 h-6" style="color: var(--color-text-secondary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                              </svg>
                            </div>
                          `}
                          <img src="${prod.imageURL || prod.image}" alt="${prod.displayName}" class="w-14 h-14 rounded-xl object-cover shadow-md ${!isPurchased ? 'grayscale' : ''}">
                          <div class="flex-1">
                            <h3 class="font-bold text-lg ${isPurchased ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}">${prod.displayName}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${typeof prod.category === 'string' ? prod.category : 'Categoría'} ${prod.questionCount ? `• ${prod.questionCount} preguntas` : ''}</p>
                          </div>
                          ${isPurchased
        ? `<div class="px-4 py-2 bg-green-100 dark:bg-green-900/50 rounded-full text-sm font-semibold border border-green-400 dark:border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                              <span class="inline-block w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2 animate-pulse shadow-[0_0_8px_currentColor]"></span>
                              <span class="text-green-800 dark:text-green-200 font-bold tracking-wide">${t('dashboard.databases.activeLabel')}</span>
                            </div>`
        : `<div class="text-right">
                              <div class="text-2xl font-bold" style="color: var(--color-text-secondary);">$${prod.price || '0.00'}</div>
                              <button onclick="addToCartFromDashboard(event, '${prod.id}')" class="mt-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition shadow-md">
                                ${t('dashboard.databases.addButton')}
                              </button>
                            </div>`
      }
                        </div>

                        <!-- Topics -->
                        ${isPurchased ? `
                          <div class="topics-section mt-4 pt-4 border-t border-dashed" style="border-color: var(--color-border-primary);" id="topics-${prod.id}">
                            <!-- Header colapsable -->
                            <div class="topics-header flex items-center justify-between gap-3 cursor-pointer select-none py-2 px-3 -mx-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors" onclick="toggleTopicsCollapse('${prod.id}')">
                              <!-- Lado izquierdo: Chevron + Stats -->
                              <div class="flex items-center gap-3">
                                <svg id="collapse-icon-${prod.id}" class="w-4 h-4 text-cyan-600 dark:text-cyan-400 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                                </svg>
                                <div class="flex items-center gap-2 flex-wrap">
                                  <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">${t('dashboard.topics.availableTopics') || 'Temas Disponibles'}:</span>
                                  <span class="text-sm font-bold text-cyan-700 dark:text-cyan-300">
                                    <span id="selected-topics-count-${prod.id}">${prod.topics?.length || 0}</span> ${t('dashboard.topics.of') || 'de'} <span id="topics-count-${prod.id}">${prod.topics?.length || 0}</span>
                                  </span>
                                  <span class="text-gray-400 dark:text-gray-500">|</span>
                                  <span class="text-sm text-gray-600 dark:text-gray-300">
                                    <span id="questions-count-${prod.id}" class="font-bold text-cyan-700 dark:text-cyan-300">${prod.totalQuestions || 0}</span> ${t('dashboard.topics.of') || 'de'} ${prod.totalQuestions || 0} ${t('dashboard.databases.questions')}
                                  </span>
                                </div>
                              </div>
                              <!-- Lado derecho: Toggle -->
                              <label class="inline-flex items-center cursor-pointer flex-shrink-0" onclick="event.stopPropagation();">
                                <span class="me-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hidden sm:inline">${t('dashboard.topics.selectAll')}</span>
                                <input type="checkbox" id="toggle-all-${prod.id}" class="sr-only peer" checked onchange="toggleAllTopicsCheckbox('${prod.id}', this.checked)">
                                <div class="relative w-10 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-cyan-600"></div>
                              </label>
                            </div>

                            <!-- Contenido colapsable -->
                            <div id="topics-content-${prod.id}" class="topics-content mt-3 overflow-hidden transition-all duration-300" style="max-height: 0; opacity: 0;">
                              ${prod.topics && prod.topics.length > 0 ? `
                                <div class="space-y-2 pt-2">
                                  ${prod.topics.map((topic) => `
                                    <div class="topic-item selected" data-topic-id="${topic.id}" data-product-id="${prod.id}" data-questions="${topic.questions}" data-max-questions="${topic.questions}">
                                      <div class="flex items-center gap-3">
                                        <div class="custom-checkbox" onclick="event.stopPropagation(); toggleTopicCheckbox(this.parentElement.parentElement, '${prod.id}', '${topic.id}')">
                                          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                          </svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                          <div class="font-semibold text-sm truncate" style="color: var(--color-text-primary);" title="${topic.name}">${topic.name}</div>
                                          <div class="text-xs topic-questions-label" style="color: var(--color-text-secondary);">${topic.questions} ${t('dashboard.databases.questions')}</div>
                                        </div>
                                        <div class="flex items-center gap-2" onclick="event.stopPropagation();">
                                          <input type="number"
                                            class="topic-question-input w-16 px-2 py-1 text-sm text-center border rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
                                            style="border-color: var(--color-border-primary); background: var(--color-bg-primary); color: var(--color-text-primary);"
                                            value="${topic.questions}"
                                            min="1"
                                            max="${topic.questions}"
                                            data-topic-id="${topic.id}"
                                            data-product-id="${prod.id}"
                                            data-max="${topic.questions}"
                                            onchange="updateTopicQuestionCount(this, '${prod.id}', '${topic.id}')"
                                            oninput="validateTopicInput(this)">
                                          <span class="text-xs text-gray-500 dark:text-gray-400">/ ${topic.questions}</span>
                                        </div>
                                      </div>
                                    </div>
                                  `).join('')}
                                </div>
                              ` : `
                                <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                                  <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                  <p class="font-semibold">${t('dashboard.topics.noTopics')}</p>
                                  <p class="text-xs mt-1">${t('dashboard.topics.noTopicsDesc')}</p>
                                </div>
                              `}
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    `;
  }).join('')}
                </div>

                <!-- Info and Summary -->
                <div class="mt-4 space-y-3">
                  <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                    <div class="flex items-start space-x-3">
                      <svg class="w-5 h-5 text-blue-700 dark:text-blue-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <h4 class="font-extrabold text-blue-800 dark:text-blue-300 mb-1">${t('dashboard.databases.howItWorksTitle')}</h4>
                        <ul class="text-sm font-semibold text-gray-800 dark:text-blue-300 space-y-1">
                          <li>• <strong class="text-blue-900 dark:text-blue-300">${t('dashboard.databases.howItWorksBullet1')}</strong> ${t('dashboard.databases.howItWorksBullet1Desc')}</li>
                          <li>• <strong class="text-blue-900 dark:text-blue-300">${t('dashboard.databases.howItWorksBullet2')}</strong> ${t('dashboard.databases.howItWorksBullet2Desc')}</li>
                          <li>• <strong class="text-blue-900 dark:text-blue-300">${t('dashboard.databases.howItWorksBullet3')}</strong> ${t('dashboard.databases.howItWorksBullet3Desc')}</li>
                          <li>• <strong class="text-blue-900 dark:text-blue-300">${t('dashboard.databases.howItWorksBullet4')}</strong> ${t('dashboard.databases.howItWorksBullet4Desc')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div class="p-4 bg-cyan-50 dark:bg-slate-900/80 border-2 border-cyan-200 dark:border-cyan-800/50 rounded-lg shadow-lg dark:shadow-cyan-900/20">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div class="text-lg font-bold text-cyan-700 dark:text-cyan-400" id="active-databases-count">${userPurchasedProducts.length}</div>
                        <div class="text-xs font-bold text-gray-800 dark:text-slate-300">${t('dashboard.summary.activeDatabases')}</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-cyan-700 dark:text-cyan-400" id="total-questions">0</div>
                        <div class="text-xs font-bold text-gray-800 dark:text-slate-300">${t('dashboard.summary.totalQuestions')}</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-cyan-700 dark:text-cyan-400" id="selected-topics">0</div>
                        <div class="text-xs font-bold text-gray-800 dark:text-slate-300">${t('dashboard.summary.selectedTopics')}</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-cyan-700 dark:text-cyan-400" id="estimated-time">~60min</div>
                        <div class="text-xs font-bold text-gray-800 dark:text-slate-300">${t('dashboard.summary.estimatedTime')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Training Configuration -->
              <div class="card-glass p-6 fade-in" style="animation-delay: 0.1s;">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b-2" style="border-color: var(--color-border-primary);">
                  <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span class="text-2xl">⚙️</span>
                  </div>
                  <h2 class="text-2xl font-bold" style="color: var(--color-text-primary);">${t('dashboard.configuration.title')}</h2>
                </div>

                <!-- Mode Selection -->
                <div class="mb-6">
                  <label class="block font-semibold mb-3" style="color: var(--color-text-primary);">${t('dashboard.configuration.modeLabel')}</label>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="mode-card selected" onclick="selectMode(this, 'practice')">
                      <div class="text-3xl mb-2">🎯</div>
                      <h3 class="font-bold text-lg mb-1" style="color: var(--color-text-primary);">${t('dashboard.configuration.practiceMode')}</h3>
                      <p class="text-sm" style="color: var(--color-text-secondary);">${t('dashboard.configuration.practiceModeDesc')}</p>
                    </div>
                    <div class="mode-card" onclick="selectMode(this, 'exam')">
                      <div class="text-3xl mb-2">📝</div>
                      <h3 class="font-bold text-lg mb-1" style="color: var(--color-text-primary);">${t('dashboard.configuration.examMode')}</h3>
                      <p class="text-sm" style="color: var(--color-text-secondary);">${t('dashboard.configuration.examModeDesc')}</p>
                    </div>
                  </div>
                </div>

                <!-- Hidden input para mantener compatibilidad con el código existente -->
                <input type="hidden" id="question-count" value="9999">
                <input type="hidden" id="use-all-questions-toggle" checked>

                <!-- Timer (hidden by default) -->
                <div id="timer-section" class="mb-6 hidden">
                  <div class="flex justify-between items-center mb-3">
                    <label class="font-semibold" style="color: var(--color-text-primary);">${t('dashboard.configuration.timerLabel')}</label>
                    <span class="text-xl font-bold text-cyan-600 dark:text-cyan-400"><span id="timer-value">60</span> ${t('dashboard.configuration.timerMinutes')}</span>
                  </div>
                  <input type="range" id="timer-slider" min="15" max="180" value="60" step="15" class="w-full h-2 rounded-lg appearance-none cursor-pointer slider" oninput="updateTimer(this.value)">
                  <div class="flex justify-between text-xs mt-1" style="color: var(--color-text-secondary);">
                    <span>15 min</span>
                    <span>180 min</span>
                  </div>
                </div>

                <!-- Passing Score (hidden by default) -->
                <div id="passing-score-section" class="mb-6 hidden">
                  <div class="flex justify-between items-center mb-3">
                    <label class="font-semibold" style="color: var(--color-text-primary);">Mínimo Aprobatorio</label>
                    <span class="text-xl font-bold text-green-600 dark:text-green-400"><span id="passing-score-value">70</span>%</span>
                  </div>
                  <input type="range" id="passing-score-slider" min="50" max="100" value="70" step="5" class="w-full h-2 rounded-lg appearance-none cursor-pointer slider" oninput="updatePassingScore(this.value)">
                  <div class="flex justify-between text-xs mt-1" style="color: var(--color-text-secondary);">
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <!-- Summary -->
                <div class="border-2 rounded-xl p-5 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-cyan-600">
                  <div class="flex items-center gap-2 font-bold text-lg mb-4 text-gray-800 dark:text-white">
                    <span>📊</span>
                    ${t('dashboard.configuration.summaryTitle')}
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                      <div class="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.configuration.summaryMode')}</div>
                      <div class="font-bold text-lg text-gray-800 dark:text-white" id="session-mode">${t('dashboard.configuration.practiceMode')}</div>
                    </div>
                    <div class="p-3 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                      <div class="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.configuration.summaryQuestions')}</div>
                      <div class="font-bold text-lg text-gray-800 dark:text-white" id="session-questions">50</div>
                    </div>
                    <div class="p-3 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                      <div class="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.configuration.summaryActiveTopics')}</div>
                      <div class="font-bold text-lg text-gray-800 dark:text-white" id="selected-topics">0</div>
                    </div>
                    <div class="p-3 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                      <div class="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.configuration.summaryEstimatedTime')}</div>
                      <div class="font-bold text-lg text-gray-800 dark:text-white" id="session-time">~60 min</div>
                    </div>
                  </div>
                </div>

                <!-- Start Button -->
                <button id="start-training" class="btn-primary w-full mt-6 bg-gradient-to-r from-[#22a7d0] to-[#1e96bc] text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                  <div class="flex items-center justify-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span>${t('dashboard.configuration.startButton')}</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Sidebar with Stats -->
            <div class="space-y-6">

              <!-- General Statistics -->
              <div class="card-glass rounded-xl p-6 bg-white dark:bg-transparent border border-gray-200 dark:border-transparent">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">${t('dashboard.stats.productStatsTitle')}</h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.stats.totalSessions')}</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-400">${productStats?.totalSessions || 0}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.stats.questionsAnswered')}</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-400">${productStats?.totalQuestions || 0}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.stats.generalAverage')}</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-400">${productStats?.averageScore || 0}%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.stats.bestScore')}</span>
                    <span class="font-bold text-green-700 dark:text-green-400">${productStats?.bestScore || 0}%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.stats.totalTimeStudied')}</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-400">${formatTime(productStats?.totalTimeStudied || 0)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.stats.currentStreak')}</span>
                    <span class="font-bold text-orange-700 dark:text-orange-400">${productStats?.currentStreak || 0} ${t('dashboard.stats.days')}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">${t('dashboard.stats.bestStreak')}</span>
                    <span class="font-bold text-orange-700 dark:text-orange-400">${productStats?.longestStreak || 0} ${t('dashboard.stats.days')}</span>
                  </div>
                </div>
              </div>

              <!-- Practice vs Exam Statistics -->
              <div class="card-glass rounded-xl p-6 bg-white dark:bg-transparent border border-gray-200 dark:border-transparent">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">${t('dashboard.stats.practiceVsExam')}</h3>
                <div class="space-y-6">
                  <!-- Practice Mode -->
                  <div>
                    <h4 class="font-bold text-gray-800 dark:text-white text-sm mb-3 flex items-center">
                      <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      ${t('dashboard.configuration.practiceMode')}
                    </h4>
                    <div class="grid grid-cols-2 gap-2 text-xs font-medium text-gray-700 dark:text-gray-400">
                      <div>${t('dashboard.stats.sessions')}: <span class="font-semibold">${productStats?.practiceMode?.sessions || 0}</span></div>
                      <div>${t('dashboard.stats.average')}: <span class="font-semibold">${productStats?.practiceMode?.averageScore || 0}%</span></div>
                      <div>${t('dashboard.configuration.summaryQuestions')}: <span class="font-semibold">${productStats?.practiceMode?.questions || 0}</span></div>
                      <div>${t('dashboard.stats.correct')}: <span class="font-semibold">${productStats?.practiceMode?.correct || 0}</span></div>
                    </div>
                  </div>

                  <!-- Exam Mode -->
                  <div>
                    <h4 class="font-bold text-gray-800 dark:text-white text-sm mb-3 flex items-center">
                      <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      ${t('dashboard.configuration.examMode')}
                    </h4>
                    <div class="grid grid-cols-2 gap-2 text-xs font-medium text-gray-700 dark:text-gray-400">
                      <div>${t('dashboard.stats.sessions')}: <span class="font-semibold">${productStats?.examMode?.sessions || 0}</span></div>
                      <div>${t('dashboard.stats.average')}: <span class="font-semibold">${productStats?.examMode?.averageScore || 0}%</span></div>
                      <div>${t('dashboard.stats.passed')}: <span class="font-semibold text-green-600">${productStats?.examMode?.passed || 0}</span></div>
                      <div>${t('dashboard.stats.failed')}: <span class="font-semibold text-red-600">${productStats?.examMode?.failed || 0}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Topic Statistics -->
              ${Object.keys(productStats?.topicStats || {}).length > 0 ? `
              <div class="card-glass rounded-xl p-6 bg-white dark:bg-transparent border border-gray-200 dark:border-transparent">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">${t('dashboard.stats.topicStatsTitle')}</h3>
                <div class="space-y-3">
                  ${Object.entries(productStats.topicStats).map(([topic, stats]) => `
                    <div class="border-l-4 ${stats.accuracy >= 70 ? 'border-green-600' : 'border-yellow-600'} dark:${stats.accuracy >= 70 ? 'border-green-500' : 'border-yellow-500'} pl-4">
                      <h4 class="font-bold text-gray-800 dark:text-white text-sm">${topic}</h4>
                      <div class="grid grid-cols-3 gap-2 text-xs font-medium text-gray-700 dark:text-gray-400 mt-2">
                        <div>${t('dashboard.stats.accuracy')}: <span class="font-semibold ${stats.accuracy >= 70 ? 'text-green-600' : 'text-yellow-600'}">${stats.accuracy}%</span></div>
                        <div>${t('dashboard.stats.correct')}: <span class="font-semibold">${stats.correct}</span></div>
                        <div>${t('dashboard.stats.incorrect')}: <span class="font-semibold">${stats.incorrect}</span></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              <!-- Quick Access -->
              <div class="card-glass rounded-xl p-6 bg-white dark:bg-transparent border border-gray-200 dark:border-transparent">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">${t('dashboard.quickActions.title')}</h3>
                <div class="space-y-3">
                  <button class="w-full text-left p-3 rounded-lg bg-cyan-50 dark:bg-gray-800 hover:bg-cyan-100 dark:hover:bg-gray-700 transition-colors border border-cyan-200 dark:border-gray-700 shadow-sm">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-cyan-700 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                      <span class="text-sm font-bold text-gray-800 dark:text-gray-200">${t('dashboard.quickActions.history')}</span>
                    </div>
                  </button>
                  <button class="w-full text-left p-3 rounded-lg bg-cyan-50 dark:bg-gray-800 hover:bg-cyan-100 dark:hover:bg-gray-700 transition-colors border border-cyan-200 dark:border-gray-700 shadow-sm">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-cyan-700 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      <span class="text-sm font-bold text-gray-800 dark:text-gray-200">${t('dashboard.quickActions.documentation')}</span>
                    </div>
                  </button>
                  <button class="w-full text-left p-3 rounded-lg bg-cyan-50 dark:bg-gray-800 hover:bg-cyan-100 dark:hover:bg-gray-700 transition-colors border border-cyan-200 dark:border-gray-700 shadow-sm">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-cyan-700 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span class="text-sm font-bold text-gray-800 dark:text-gray-200">${t('dashboard.quickActions.support')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  const startTrainingButton = document.getElementById('start-training');
  if (startTrainingButton) {
    startTrainingButton.addEventListener('click', () => {
      console.log('🚀 Iniciando entrenamiento para producto:', productId);

      // Detectar el modo seleccionado (check onclick attribute for language-independent detection)
      const selectedModeCard = document.querySelector('.mode-card.selected');
      const isExamMode = selectedModeCard?.getAttribute('onclick')?.includes("'exam'");
      const mode = isExamMode ? 'exam' : 'practice';

      // Obtener duración y mínimo aprobatorio para modo examen
      const timerValue = document.getElementById('timer-value')?.textContent || '60';
      const passingScore = document.getElementById('passing-score-value')?.textContent || '70';
      const duration = parseInt(timerValue) * 60; // Convertir minutos a segundos

      console.log('📋 Modo seleccionado:', mode);
      console.log('⏱️ Duración:', timerValue, 'min (', duration, 's)');
      console.log('✅ Mínimo aprobatorio:', passingScore, '%');

      // Construir URL con parámetros
      let url = `#/training/${productId}?mode=${mode}`;
      if (isExamMode) {
        url += `&duration=${duration}&passingScore=${passingScore}`;
      }

      window.location.hash = url;
      console.log('✅ Hash actualizado a:', window.location.hash);
    });
  }

  // Question count change listener
  const questionCountInput = document.getElementById('question-count');
  if (questionCountInput) {
    questionCountInput.addEventListener('input', () => {
      updateSessionSummary();
    });
  }

  // Global functions for interaction
  window.toggleDatabase = function (element) {
    element.classList.toggle('selected');
  };

  // Toggle individual del checkbox de tema con animación
  window.toggleTopicCheckbox = function (element, productId, topicId) {
    const isSelected = element.classList.contains('selected');

    if (isSelected) {
      // Desmarcar con animación
      element.classList.remove('selected');
      element.style.transition = 'all 0.3s ease';
      element.style.opacity = '0.6';
      setTimeout(() => {
        element.style.opacity = '1';
      }, 150);

      // Deshabilitar input de preguntas
      const input = element.querySelector('.topic-question-input');
      if (input) {
        input.disabled = true;
        input.style.opacity = '0.5';
      }
    } else {
      // Marcar con animación
      element.classList.add('selected');
      element.style.transition = 'all 0.3s ease';
      element.style.transform = 'scale(1.02)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 150);

      // Habilitar input de preguntas
      const input = element.querySelector('.topic-question-input');
      if (input) {
        input.disabled = false;
        input.style.opacity = '1';
      }
    }

    // Actualizar el toggle principal si es necesario
    updateMainToggleState(productId);
    updateAllCounts();
  };

  // Legacy function para compatibilidad
  window.toggleTopic = function (element, productId, topicId) {
    toggleTopicCheckbox(element, productId, topicId);
  };

  // Toggle de todos los temas con el switch
  window.toggleAllTopicsCheckbox = function (prodId, isChecked) {
    const topicsSection = document.getElementById(`topics-${prodId}`);
    if (topicsSection) {
      topicsSection.querySelectorAll('.topic-item').forEach(item => {
        if (isChecked) {
          item.classList.add('selected');
          const input = item.querySelector('.topic-question-input');
          if (input) {
            input.disabled = false;
            input.style.opacity = '1';
            // Restaurar al máximo
            input.value = input.dataset.max || input.max;
          }
        } else {
          item.classList.remove('selected');
          const input = item.querySelector('.topic-question-input');
          if (input) {
            input.disabled = true;
            input.style.opacity = '0.5';
          }
        }
      });
      updateAllCounts();
    }
  };

  // Actualizar estado del toggle principal basado en los items
  function updateMainToggleState(prodId) {
    const topicsSection = document.getElementById(`topics-${prodId}`);
    const mainToggle = document.getElementById(`toggle-all-${prodId}`);
    if (topicsSection && mainToggle) {
      const allItems = topicsSection.querySelectorAll('.topic-item');
      const selectedItems = topicsSection.querySelectorAll('.topic-item.selected');
      mainToggle.checked = allItems.length > 0 && selectedItems.length === allItems.length;
    }
  }

  // Toggle para colapsar/expandir los temas de un producto
  window.toggleTopicsCollapse = function (prodId) {
    const content = document.getElementById(`topics-content-${prodId}`);
    const icon = document.getElementById(`collapse-icon-${prodId}`);

    if (!content) return;

    const isCollapsed = content.style.maxHeight === '0px' || content.style.maxHeight === '';

    if (isCollapsed) {
      // Expandir
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.opacity = '1';
      if (icon) {
        icon.style.transform = 'rotate(180deg)';
      }
    } else {
      // Colapsar
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      if (icon) {
        icon.style.transform = 'rotate(0deg)';
      }
    }
  };

  // Legacy functions
  window.selectAllTopics = function (prodId) {
    const toggle = document.getElementById(`toggle-all-${prodId}`);
    if (toggle) {
      toggle.checked = true;
      toggleAllTopicsCheckbox(prodId, true);
    }
  };

  window.deselectAllTopics = function (prodId) {
    const toggle = document.getElementById(`toggle-all-${prodId}`);
    if (toggle) {
      toggle.checked = false;
      toggleAllTopicsCheckbox(prodId, false);
    }
  };

  // Actualizar preguntas por tema individual
  window.updateTopicQuestionCount = function (input, productId, topicId) {
    const max = parseInt(input.dataset.max) || parseInt(input.max) || 100;
    let value = parseInt(input.value) || 1;
    value = Math.max(1, Math.min(value, max));
    input.value = value;

    // Actualizar el data attribute
    const topicItem = input.closest('.topic-item');
    if (topicItem) {
      topicItem.dataset.questions = value;
    }

    updateAllCounts();
  };

  // Validar input de tema
  window.validateTopicInput = function (input) {
    const max = parseInt(input.dataset.max) || parseInt(input.max) || 100;
    let value = parseInt(input.value) || 0;
    if (value > max) {
      input.value = max;
    }
    if (value < 1 && input.value !== '') {
      input.value = 1;
    }
  };

  // Toggle de "Todas las preguntas"
  window.toggleAllQuestions = function (useAll) {
    const customSection = document.getElementById('custom-questions-section');
    const questionInput = document.getElementById('question-count');

    if (useAll) {
      // Ocultar input personalizado
      if (customSection) customSection.classList.add('hidden');
      // Establecer el valor al total de preguntas seleccionadas
      const { totalQuestions } = getSelectedTopics();
      if (questionInput) questionInput.value = totalQuestions;
    } else {
      // Mostrar input personalizado
      if (customSection) customSection.classList.remove('hidden');
    }

    updateSessionSummary();
  };

  // Actualizar el conteo de preguntas
  window.updateQuestionCount = function (value) {
    const input = document.getElementById('question-count');
    const { totalQuestions } = getSelectedTopics();

    if (input) {
      let numValue = parseInt(value) || 1;
      numValue = Math.max(1, Math.min(numValue, totalQuestions || 9999));
      input.value = numValue;
    }

    // Desactivar el toggle de "todas" si se personaliza
    const allToggle = document.getElementById('use-all-questions-toggle');
    if (allToggle && parseInt(input?.value) !== totalQuestions) {
      allToggle.checked = false;
      const customSection = document.getElementById('custom-questions-section');
      if (customSection) customSection.classList.remove('hidden');
    }

    updateSessionSummary();
  };

  // Legacy - Usar todas las preguntas disponibles
  window.useAllQuestions = function () {
    const toggle = document.getElementById('use-all-questions-toggle');
    if (toggle) {
      toggle.checked = true;
      toggleAllQuestions(true);
    }
  };

  window.selectMode = function (element, mode) {
    document.querySelectorAll('.mode-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');

    const timerSection = document.getElementById('timer-section');
    const passingScoreSection = document.getElementById('passing-score-section');
    if (mode === 'exam') {
      timerSection.classList.remove('hidden');
      passingScoreSection.classList.remove('hidden');
    } else {
      timerSection.classList.add('hidden');
      passingScoreSection.classList.add('hidden');
    }
    updateSessionSummary();
  };

  window.updateTimer = function (value) {
    const timerValue = document.getElementById('timer-value');
    if (timerValue) {
      timerValue.textContent = value;
    }
    const slider = document.getElementById('timer-slider');
    if (slider) {
      const percentage = ((value - 15) / (180 - 15)) * 100;
      slider.style.background = `linear-gradient(to right, #22a7d0 0%, #22a7d0 ${percentage}%, var(--color-border-primary) ${percentage}%, var(--color-border-primary) 100%)`;
    }
  };

  window.updatePassingScore = function (value) {
    const passingScoreValue = document.getElementById('passing-score-value');
    if (passingScoreValue) {
      passingScoreValue.textContent = value;
    }
    const slider = document.getElementById('passing-score-slider');
    if (slider) {
      const percentage = ((value - 50) / (100 - 50)) * 100;
      slider.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, var(--color-border-primary) ${percentage}%, var(--color-border-primary) 100%)`;
    }
  };

  window.toggleProductDatabase = function (prodId, isSelected) {
    const topicsSection = document.getElementById(`topics-${prodId}`);
    if (topicsSection) {
      if (isSelected) {
        topicsSection.style.display = 'block';
      } else {
        topicsSection.style.display = 'none';
      }
    }
    updateAllCounts();
  };

  // Función para formatear tiempo (convierte a horas si es mayor a 59 minutos)
  function formatEstimatedTime(minutes) {
    if (minutes > 59) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      if (remainingMins === 0) {
        return `~${hours}h`;
      }
      return `~${hours}h ${remainingMins}m`;
    }
    return `~${minutes} ${t('dashboard.configuration.timerMinutes')}`;
  }

  window.addToCartFromDashboard = function (evt, prodId) {
    evt.stopPropagation();

    const productToAdd = allProducts.find(p => p.id === prodId);
    if (productToAdd && window.cart) {
      window.cart.addToCart(productToAdd);

      // Abrir el modal del carrito
      if (window.cart.openCartModal) {
        window.cart.openCartModal();
      }

      // Cambiar el botón a "Agregado"
      const button = evt.target;
      if (button && button.tagName === 'BUTTON') {
        const originalHTML = button.innerHTML;
        button.innerHTML = '✓ Agregado';
        button.classList.remove('bg-orange-500', 'hover:bg-orange-600');
        button.classList.add('bg-green-500', 'cursor-default');
        button.disabled = true;

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.classList.remove('bg-green-500', 'cursor-default');
          button.classList.add('bg-orange-500', 'hover:bg-orange-600');
          button.disabled = false;
        }, 3000);
      }
    }
  };

  function getSelectedProducts() {
    const selectedProducts = [];
    userPurchasedProducts.forEach(product => {
      const checkbox = document.getElementById(`product-${product.id}`);
      if (checkbox && checkbox.checked) {
        selectedProducts.push(product.id);
      }
    });
    return selectedProducts;
  }

  function getSelectedTopics() {
    let totalTopics = 0;
    let totalQuestions = 0;
    const selectedProducts = getSelectedProducts();

    selectedProducts.forEach(prodId => {
      const topicsSection = document.getElementById(`topics-${prodId}`);
      if (topicsSection) {
        const selectedTopicItems = topicsSection.querySelectorAll('.topic-item.selected');
        totalTopics += selectedTopicItems.length;

        // Calculate questions from selected topics using input values
        selectedTopicItems.forEach(item => {
          // Primero intentar obtener del input individual
          const input = item.querySelector('.topic-question-input');
          if (input && !input.disabled) {
            const questions = parseInt(input.value) || 0;
            totalQuestions += questions;
          } else {
            // Fallback al data attribute
            const questions = parseInt(item.dataset.questions) || 0;
            totalQuestions += questions;
          }
        });

        // Actualizar contador de temas seleccionados por producto
        const selectedCountEl = document.getElementById(`selected-topics-count-${prodId}`);
        if (selectedCountEl) {
          selectedCountEl.textContent = selectedTopicItems.length;
        }

        // Actualizar contador de preguntas por producto
        let prodQuestions = 0;
        selectedTopicItems.forEach(item => {
          const input = item.querySelector('.topic-question-input');
          if (input && !input.disabled) {
            prodQuestions += parseInt(input.value) || 0;
          } else {
            prodQuestions += parseInt(item.dataset.questions) || 0;
          }
        });
        const questionsCountEl = document.getElementById(`questions-count-${prodId}`);
        if (questionsCountEl) {
          questionsCountEl.textContent = prodQuestions;
        }
      }
    });

    return { totalTopics, totalQuestions };
  }

  function updateAllCounts() {
    const { totalTopics, totalQuestions } = getSelectedTopics();

    // Calcular total de preguntas de todos los productos activos
    let totalAvailableQuestions = 0;
    userPurchasedProducts.forEach(prod => {
      const checkbox = document.getElementById(`product-${prod.id}`);
      if (checkbox && checkbox.checked) {
        totalAvailableQuestions += prod.totalQuestions || 0;
      }
    });

    // Update topics count in summary card
    const topicsElement = document.getElementById('selected-topics');
    if (topicsElement) {
      topicsElement.textContent = totalTopics;
    }

    // Update total questions display
    const totalQuestionsElement = document.getElementById('total-questions');
    if (totalQuestionsElement) {
      totalQuestionsElement.textContent = totalQuestions;
    }

    // Update selected topics questions count
    const selectedTopicsQuestionsElement = document.getElementById('selected-topics-questions');
    if (selectedTopicsQuestionsElement) {
      selectedTopicsQuestionsElement.textContent = totalQuestions;
    }

    // Update selected topics display
    const selectedTopicsDisplayElement = document.getElementById('selected-topics-display');
    if (selectedTopicsDisplayElement) {
      selectedTopicsDisplayElement.textContent = totalTopics;
    }

    // Update max questions display
    const maxQuestionsDisplayElement = document.getElementById('max-questions-display');
    if (maxQuestionsDisplayElement) {
      maxQuestionsDisplayElement.textContent = totalQuestions;
    }

    // Update estimated time
    const estimatedTimeElement = document.getElementById('estimated-time');
    if (estimatedTimeElement) {
      const estimatedMinutes = Math.ceil(totalQuestions * 1.2);
      estimatedTimeElement.textContent = formatEstimatedTime(estimatedMinutes);
    }

    // Si el toggle de "todas las preguntas" está activo, actualizar el input
    const allQuestionsToggle = document.getElementById('use-all-questions-toggle');
    const questionInput = document.getElementById('question-count');
    if (allQuestionsToggle?.checked && questionInput) {
      questionInput.value = totalQuestions;
    }

    updateSessionSummary();
  }

  function updateSessionSummary() {
    const { totalTopics, totalQuestions } = getSelectedTopics();
    const selectedModeCard = document.querySelector('.mode-card.selected');
    // Check by looking at the onclick attribute which contains the mode
    const isExamMode = selectedModeCard?.getAttribute('onclick')?.includes("'exam'");
    const questionCountInput = document.getElementById('question-count');
    const questionCount = questionCountInput?.value || '50';
    const timerValue = document.getElementById('timer-value')?.textContent || '60';

    // Update session mode
    const modeElement = document.getElementById('session-mode');
    if (modeElement) {
      modeElement.textContent = isExamMode ? t('dashboard.configuration.examMode') : t('dashboard.configuration.practiceMode');
    }

    // Update session questions
    const questionsElement = document.getElementById('session-questions');
    if (questionsElement) {
      questionsElement.textContent = questionCount;
    }

    // Update session time
    const timeElement = document.getElementById('session-time');
    if (timeElement) {
      if (isExamMode) {
        const timerMinutes = parseInt(timerValue) || 60;
        timeElement.textContent = formatEstimatedTime(timerMinutes);
      } else {
        const numQuestions = parseInt(questionCount) || 50;
        const estimatedMinutes = Math.ceil(numQuestions * 1.2);
        timeElement.textContent = formatEstimatedTime(estimatedMinutes);
      }
    }

    // Update topics count
    const topicsCountElements = document.querySelectorAll('#selected-topics');
    topicsCountElements.forEach(el => {
      el.textContent = totalTopics;
    });

    // Validar que el número de preguntas no exceda las disponibles
    if (questionCountInput && totalQuestions > 0) {
      const currentValue = parseInt(questionCountInput.value) || 0;
      if (currentValue > totalQuestions) {
        questionCountInput.value = totalQuestions;
      }
      questionCountInput.max = totalQuestions;
    }
  }

  // Initialize counts, summary, and timer
  updateAllCounts();
  updateTimer(60);

  // Listener para cambio de idioma - recargar la página
  const languageChangeHandler = () => {
    console.log('🌍 Idioma cambiado, recargando dashboard...');
    // Limpiar cache de temas para que se recarguen con el nuevo idioma
    topicsCache = {};
    // Recargar la vista
    renderDashboardView(productId);
  };

  // Registrar el listener
  if (typeof i18n !== 'undefined' && i18n.onLanguageChange) {
    i18n.onLanguageChange(languageChangeHandler);
  }

  // Escuchar también el evento personalizado de cambio de idioma
  window.addEventListener('languageChanged', languageChangeHandler, { once: true });
}
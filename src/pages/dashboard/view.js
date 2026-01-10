import { auth } from '../../js/firebase.js';
import { verifyUserAppAccess, getProductsFromFirebase, getUserProducts } from '../../js/userProfile.js';
import {
  createSession,
  completeSession,
  getUserStatistics,
  getUserSessions,
  getProductStatistics,
  formatTime
} from '../../js/sessionManager.js';

export async function renderDashboardView(productId) {
  const spaRoot = document.getElementById('spa-root');
  if (!spaRoot) return;

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
          <h2 class="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p class="text-gray-600 mb-6">${accessCheck.message}</p>
          <button onclick="window.location.hash='#/products'" class="bg-[#22a7d0] text-white px-6 py-3 rounded-lg hover:bg-[#1e96bc] transition-colors">
            Ver Productos
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
        const lang = localStorage.getItem('language') || 'es';
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
  } catch (error) {
    console.error('Error loading product:', error);
    spaRoot.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p class="text-gray-600 mb-6">No se pudo cargar la información del producto.</p>
          <button onclick="window.location.hash='#/products'" class="bg-[#22a7d0] text-white px-6 py-3 rounded-lg hover:bg-[#1e96bc] transition-colors">
            Volver a Productos
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
        border: 2px solid #cbd5e1;
        border-radius: 6px;
        background: white;
        transition: all 0.3s ease;
        flex-shrink: 0;
      }

      .custom-checkbox svg {
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s ease;
      }

      .topic-item.selected .custom-checkbox,
      .database-item.selected .custom-checkbox {
        background: linear-gradient(135deg, #22a7d0 0%, #1e96bc 100%);
        border-color: #22a7d0;
      }

      .topic-item.selected .custom-checkbox svg,
      .database-item.selected .custom-checkbox svg {
        opacity: 1;
        transform: scale(1);
      }

      html.dark .custom-checkbox {
        background: var(--color-bg-secondary);
        border-color: #475569;
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
              Mis Productos
            </a>
            <span>/</span>
            <span class="text-white">Configuración de Entrenamiento</span>
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
                  <h2 class="text-2xl font-bold" style="color: var(--color-text-primary);">Bases de Datos de Conocimiento</h2>
                </div>

                <!-- Info Banner -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                  <div class="flex gap-3">
                    <span class="text-2xl">💡</span>
                    <div class="flex-1">
                      <h3 class="font-extrabold text-blue-800 dark:text-blue-300 mb-2">Selección Inteligente de Contenido</h3>
                      <ul class="text-sm font-semibold text-gray-800 dark:text-blue-300 space-y-1">
                        <li>• Combina múltiples bases de datos para sesiones personalizadas</li>
                        <li>• Selecciona temas específicos de cada producto</li>
                        <li>• Los productos no comprados están disponibles para agregar al carrito</li>
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
                              <span class="text-green-800 dark:text-green-200 font-bold tracking-wide">Activo</span>
                            </div>`
        : `<div class="text-right">
                              <div class="text-2xl font-bold" style="color: var(--color-text-secondary);">$${prod.price || '0.00'}</div>
                              <button onclick="addToCartFromDashboard(event, '${prod.id}')" class="mt-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition shadow-md">
                                Agregar
                              </button>
                            </div>`
      }
                        </div>

                        <!-- Topics -->
                        ${isPurchased ? `
                          <div class="topics-section mt-4 pt-4 border-t border-dashed" style="border-color: var(--color-border-primary);" id="topics-${prod.id}">
                            <div class="grid grid-cols-2 gap-3">
                              ${(prod.topics || [
          { id: 'communications', name: 'Communications', questions: 45 },
          { id: 'navigation', name: 'Navigation & Tracks', questions: 38 },
          { id: 'weather', name: 'Weather & Environmental', questions: 32 },
          { id: 'emergency', name: 'Emergency Procedures', questions: 25 }
        ]).map((topic, index) => `
                                <div class="topic-item ${index < 2 ? 'selected' : ''}" onclick="event.stopPropagation(); toggleTopic(this, '${prod.id}', '${topic.id}')">
                                  <div class="flex items-center gap-3">
                                    <div class="custom-checkbox">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                                        <polyline points="20 6 9 17 4 12"/>
                                      </svg>
                                    </div>
                                    <div class="flex-1">
                                      <div class="font-semibold text-sm" style="color: var(--color-text-primary);">${topic.name}</div>
                                      <div class="text-xs" style="color: var(--color-text-secondary);">${topic.questions} preguntas</div>
                                    </div>
                                  </div>
                                </div>
                              `).join('')}
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
                        <h4 class="font-extrabold text-blue-800 dark:text-blue-300 mb-1">Cómo funciona la selección de bases de datos</h4>
                        <ul class="text-sm font-semibold text-gray-800 dark:text-blue-300 space-y-1">
                          <li>• <strong class="text-blue-900 dark:text-blue-300">Productos comprados:</strong> Puedes seleccionar los temas específicos de cada producto</li>
                          <li>• <strong class="text-blue-900 dark:text-blue-300">Productos no comprados:</strong> Aparecen en gris con el precio, necesitas comprarlos primero</li>
                          <li>• <strong class="text-blue-900 dark:text-blue-300">Combinación de bases:</strong> Selecciona múltiples productos para combinar sus preguntas en una sola sesión</li>
                          <li>• <strong class="text-blue-900 dark:text-blue-300">Temas personalizados:</strong> Elige los temas específicos que quieres estudiar de cada producto</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div class="p-4 bg-cyan-50 dark:bg-slate-900/80 border-2 border-cyan-200 dark:border-cyan-800/50 rounded-lg shadow-lg dark:shadow-cyan-900/20">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div class="text-lg font-bold text-cyan-700 dark:text-cyan-400" id="active-databases-count">${userPurchasedProducts.length}</div>
                        <div class="text-xs font-bold text-gray-800 dark:text-slate-300">Bases Activas</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-cyan-700 dark:text-cyan-400" id="total-questions">0</div>
                        <div class="text-xs font-bold text-gray-800 dark:text-slate-300">Preguntas Totales</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-cyan-700 dark:text-cyan-400" id="selected-topics">0</div>
                        <div class="text-xs font-bold text-gray-800 dark:text-slate-300">Temas Seleccionados</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-cyan-700 dark:text-cyan-400" id="estimated-time">~60min</div>
                        <div class="text-xs font-bold text-gray-800 dark:text-slate-300">Tiempo Estimado</div>
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
                  <h2 class="text-2xl font-bold" style="color: var(--color-text-primary);">Configuración de Sesión</h2>
                </div>

                <!-- Mode Selection -->
                <div class="mb-6">
                  <label class="block font-semibold mb-3" style="color: var(--color-text-primary);">Modo de Entrenamiento</label>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="mode-card selected" onclick="selectMode(this, 'practice')">
                      <div class="text-3xl mb-2">🎯</div>
                      <h3 class="font-bold text-lg mb-1" style="color: var(--color-text-primary);">Modo Práctica</h3>
                      <p class="text-sm" style="color: var(--color-text-secondary);">Aprende a tu ritmo sin límite de tiempo</p>
                    </div>
                    <div class="mode-card" onclick="selectMode(this, 'exam')">
                      <div class="text-3xl mb-2">📝</div>
                      <h3 class="font-bold text-lg mb-1" style="color: var(--color-text-primary);">Modo Examen</h3>
                      <p class="text-sm" style="color: var(--color-text-secondary);">Condiciones reales con tiempo limitado</p>
                    </div>
                  </div>
                </div>

                <!-- Question Count -->
                <div class="mb-6">
                  <label class="block font-semibold mb-3" style="color: var(--color-text-primary);">Número de Preguntas</label>
                  <select id="question-count" class="w-full p-3 border-2 rounded-xl font-medium focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition" style="border-color: var(--color-border-primary); background: var(--color-bg-primary); color: var(--color-text-primary);">
                    <option value="10">10 preguntas - Sesión rápida</option>
                    <option value="25">25 preguntas - Sesión corta</option>
                    <option value="50" selected>50 preguntas - Sesión estándar</option>
                    <option value="100">100 preguntas - Sesión extendida</option>
                    <option value="all">Todas las preguntas disponibles</option>
                  </select>
                </div>

                <!-- Timer (hidden by default) -->
                <div id="timer-section" class="mb-6 hidden">
                  <div class="flex justify-between items-center mb-3">
                    <label class="font-semibold" style="color: var(--color-text-primary);">Tiempo del Examen</label>
                    <span class="text-xl font-bold text-cyan-600 dark:text-cyan-400"><span id="timer-value">60</span> min</span>
                  </div>
                  <input type="range" id="timer-slider" min="15" max="180" value="60" step="15" class="w-full h-2 rounded-lg appearance-none cursor-pointer slider" oninput="updateTimer(this.value)">
                  <div class="flex justify-between text-xs mt-1" style="color: var(--color-text-secondary);">
                    <span>15 min</span>
                    <span>180 min</span>
                  </div>
                </div>

                <!-- Summary -->
                <div class="border-2 rounded-xl p-5 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-cyan-600">
                  <div class="flex items-center gap-2 font-bold text-lg mb-4 text-gray-800 dark:text-white">
                    <span>📊</span>
                    Resumen de la Sesión
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                      <div class="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-400">Modo</div>
                      <div class="font-bold text-lg text-gray-800 dark:text-white" id="session-mode">Práctica</div>
                    </div>
                    <div class="p-3 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                      <div class="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-400">Preguntas</div>
                      <div class="font-bold text-lg text-gray-800 dark:text-white" id="session-questions">50</div>
                    </div>
                    <div class="p-3 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                      <div class="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-400">Temas Activos</div>
                      <div class="font-bold text-lg text-gray-800 dark:text-white" id="selected-topics">0</div>
                    </div>
                    <div class="p-3 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                      <div class="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-400">Tiempo Est.</div>
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
                    <span>Iniciar Entrenamiento</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Sidebar with Stats -->
            <div class="space-y-6">

              <!-- General Statistics -->
              <div class="card-glass rounded-xl p-6 bg-white dark:bg-transparent border border-gray-200 dark:border-transparent">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Estadísticas del Producto</h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">Total Sesiones</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-400">${productStats?.totalSessions || 0}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">Preguntas Respondidas</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-400">${productStats?.totalQuestions || 0}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">Promedio General</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-400">${productStats?.averageScore || 0}%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">Mejor Puntuación</span>
                    <span class="font-bold text-green-700 dark:text-green-400">${productStats?.bestScore || 0}%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">Tiempo Total Estudiado</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-400">${formatTime(productStats?.totalTimeStudied || 0)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">Racha Actual</span>
                    <span class="font-bold text-orange-700 dark:text-orange-400">${productStats?.currentStreak || 0} días</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-400">Mejor Racha</span>
                    <span class="font-bold text-orange-700 dark:text-orange-400">${productStats?.longestStreak || 0} días</span>
                  </div>
                </div>
              </div>

              <!-- Practice vs Exam Statistics -->
              <div class="card-glass rounded-xl p-6 bg-white dark:bg-transparent border border-gray-200 dark:border-transparent">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Modo Práctica vs Examen</h3>
                <div class="space-y-6">
                  <!-- Practice Mode -->
                  <div>
                    <h4 class="font-bold text-gray-800 dark:text-white text-sm mb-3 flex items-center">
                      <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      Modo Práctica
                    </h4>
                    <div class="grid grid-cols-2 gap-2 text-xs font-medium text-gray-700 dark:text-gray-400">
                      <div>Sesiones: <span class="font-semibold">${productStats?.practiceMode?.sessions || 0}</span></div>
                      <div>Promedio: <span class="font-semibold">${productStats?.practiceMode?.averageScore || 0}%</span></div>
                      <div>Preguntas: <span class="font-semibold">${productStats?.practiceMode?.questions || 0}</span></div>
                      <div>Correctas: <span class="font-semibold">${productStats?.practiceMode?.correct || 0}</span></div>
                    </div>
                  </div>

                  <!-- Exam Mode -->
                  <div>
                    <h4 class="font-bold text-gray-800 dark:text-white text-sm mb-3 flex items-center">
                      <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Modo Examen
                    </h4>
                    <div class="grid grid-cols-2 gap-2 text-xs font-medium text-gray-700 dark:text-gray-400">
                      <div>Sesiones: <span class="font-semibold">${productStats?.examMode?.sessions || 0}</span></div>
                      <div>Promedio: <span class="font-semibold">${productStats?.examMode?.averageScore || 0}%</span></div>
                      <div>Aprobados: <span class="font-semibold text-green-600">${productStats?.examMode?.passed || 0}</span></div>
                      <div>Reprobados: <span class="font-semibold text-red-600">${productStats?.examMode?.failed || 0}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Topic Statistics -->
              ${Object.keys(productStats?.topicStats || {}).length > 0 ? `
              <div class="card-glass rounded-xl p-6 bg-white dark:bg-transparent border border-gray-200 dark:border-transparent">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Estadísticas por Tema</h3>
                <div class="space-y-3">
                  ${Object.entries(productStats.topicStats).map(([topic, stats]) => `
                    <div class="border-l-4 ${stats.accuracy >= 70 ? 'border-green-600' : 'border-yellow-600'} dark:${stats.accuracy >= 70 ? 'border-green-500' : 'border-yellow-500'} pl-4">
                      <h4 class="font-bold text-gray-800 dark:text-white text-sm">${topic}</h4>
                      <div class="grid grid-cols-3 gap-2 text-xs font-medium text-gray-700 dark:text-gray-400 mt-2">
                        <div>Precisión: <span class="font-semibold ${stats.accuracy >= 70 ? 'text-green-600' : 'text-yellow-600'}">${stats.accuracy}%</span></div>
                        <div>Correctas: <span class="font-semibold">${stats.correct}</span></div>
                        <div>Incorrectas: <span class="font-semibold">${stats.incorrect}</span></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              <!-- Quick Access -->
              <div class="card-glass rounded-xl p-6 bg-white dark:bg-transparent border border-gray-200 dark:border-transparent">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Acceso Rápido</h3>
                <div class="space-y-3">
                  <button class="w-full text-left p-3 rounded-lg bg-cyan-50 dark:bg-gray-800 hover:bg-cyan-100 dark:hover:bg-gray-700 transition-colors border border-cyan-200 dark:border-gray-700 shadow-sm">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-cyan-700 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                      <span class="text-sm font-bold text-gray-800 dark:text-gray-200">Historial de Sesiones</span>
                    </div>
                  </button>
                  <button class="w-full text-left p-3 rounded-lg bg-cyan-50 dark:bg-gray-800 hover:bg-cyan-100 dark:hover:bg-gray-700 transition-colors border border-cyan-200 dark:border-gray-700 shadow-sm">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-cyan-700 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      <span class="text-sm font-bold text-gray-800 dark:text-gray-200">Documentación</span>
                    </div>
                  </button>
                  <button class="w-full text-left p-3 rounded-lg bg-cyan-50 dark:bg-gray-800 hover:bg-cyan-100 dark:hover:bg-gray-700 transition-colors border border-cyan-200 dark:border-gray-700 shadow-sm">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-cyan-700 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span class="text-sm font-bold text-gray-800 dark:text-gray-200">Ayuda y Soporte</span>
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
      // Redirigir a la aplicación de entrenamiento dentro del SPA
      window.location.hash = `#/training/${productId}`;
      console.log('✅ Hash actualizado a:', window.location.hash);
    });
  }

  // Question count change listener
  const questionCountSelect = document.getElementById('question-count');
  if (questionCountSelect) {
    questionCountSelect.addEventListener('change', () => {
      updateSessionSummary();
    });
  }

  // Global functions for interaction
  window.toggleDatabase = function (element) {
    element.classList.toggle('selected');
  };

  window.toggleTopic = function (element, productId, topicId) {
    element.classList.toggle('selected');
    updateAllCounts();
  };

  window.selectMode = function (element, mode) {
    document.querySelectorAll('.mode-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');

    const timerSection = document.getElementById('timer-section');
    if (mode === 'exam') {
      timerSection.classList.remove('hidden');
    } else {
      timerSection.classList.add('hidden');
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

        // Calculate questions from selected topics
        selectedTopicItems.forEach(item => {
          const questionElement = item.querySelector('.text-xs');
          if (questionElement) {
            const match = questionElement.textContent.match(/(\d+)/);
            const questions = match ? parseInt(match[0]) : 0;
            totalQuestions += questions;
          }
        });
      }
    });

    return { totalTopics, totalQuestions };
  }

  function updateAllCounts() {
    const selectedProducts = getSelectedProducts();
    const { totalTopics, totalQuestions } = getSelectedTopics();

    // Update topics count
    const topicsElement = document.getElementById('selected-topics');
    if (topicsElement) {
      topicsElement.textContent = totalTopics;
    }

    updateSessionSummary();
  }

  function updateSessionSummary() {
    const { totalTopics } = getSelectedTopics();
    const selectedModeCard = document.querySelector('.mode-card.selected');
    const isExamMode = selectedModeCard?.textContent.includes('Examen');
    const questionCount = document.getElementById('question-count')?.value || '50';
    const timerValue = document.getElementById('timer-value')?.textContent || '60';

    // Update session mode
    const modeElement = document.getElementById('session-mode');
    if (modeElement) {
      modeElement.textContent = isExamMode ? 'Examen' : 'Práctica';
    }

    // Update session questions
    const questionsElement = document.getElementById('session-questions');
    if (questionsElement) {
      questionsElement.textContent = questionCount === 'all' ? 'Todas' : questionCount;
    }

    // Update session time
    const timeElement = document.getElementById('session-time');
    if (timeElement) {
      if (isExamMode) {
        timeElement.textContent = `~${timerValue} min`;
      } else {
        const estimatedMinutes = Math.ceil(parseInt(questionCount || 50) * 1.2);
        timeElement.textContent = `~${estimatedMinutes} min`;
      }
    }

    // Update topics count
    const topicsElement = document.getElementById('selected-topics');
    if (topicsElement) {
      topicsElement.textContent = totalTopics;
    }
  }

  // Initialize counts, summary, and timer
  updateAllCounts();
  updateTimer(60);
}
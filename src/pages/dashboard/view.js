import { auth, db } from '../../js/firebase.js';
import { verifyUserAppAccess, getProductsFromFirebase, getUserProducts } from '../../js/userProfile.js';
import { collection, getDocs, query } from 'firebase/firestore';

// Helper function to get categories with colors from Firebase
async function getCategoriesFromFirebase() {
  try {
    const categoriesQuery = query(collection(db, 'categories'));
    const querySnapshot = await getDocs(categoriesQuery);
    const categories = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      categories[doc.id] = {
        id: doc.id,
        name: data.name || doc.id,
        color: data.color || '#3B82F6'
      };
    });

    // Return default categories if Firebase is empty
    if (Object.keys(categories).length === 0) {
      return {
        'aviation': { id: 'aviation', name: 'Aviación', color: '#3B82F6' },
        'development': { id: 'development', name: 'Desarrollo', color: '#10B981' },
        'education': { id: 'education', name: 'Educación', color: '#F59E0B' },
        'ai': { id: 'ai', name: 'Inteligencia Artificial', color: '#8B5CF6' }
      };
    }

    return categories;
  } catch (error) {
    console.error('Error loading categories:', error);
    return {
      'aviation': { id: 'aviation', name: 'Aviación', color: '#3B82F6' },
      'development': { id: 'development', name: 'Desarrollo', color: '#10B981' }
    };
  }
}

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
  let categories = {};

  try {
    allProducts = await getProductsFromFirebase();
    product = allProducts.find(p => p.id === productId);
    userPurchasedProducts = await getUserProducts(auth.currentUser.uid);
    categories = await getCategoriesFromFirebase();

    if (!product) {
      throw new Error('Producto no encontrado');
    }
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

  // Get purchase date for display
  const purchaseDate = accessCheck.purchaseDate;
  const formattedDate = purchaseDate ? new Date(purchaseDate.seconds * 1000).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Fecha no disponible';

  // Create the purchased products set for easy lookup
  const purchasedProductIds = new Set(userPurchasedProducts.map(p => p.id));

  spaRoot.innerHTML = `
    <style>
      /* Custom slider styles */
      .slider::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #22a7d0;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #22a7d0;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .slider::-webkit-slider-track {
        background: #e5e7eb;
        height: 8px;
        border-radius: 4px;
      }

      .slider::-moz-range-track {
        background: #e5e7eb;
        height: 8px;
        border-radius: 4px;
        border: none;
      }
    </style>
    <div class="min-h-screen bg-gray-50">
      <!-- Header Navigation -->
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200 p-6">
        <div class="container mx-auto max-w-6xl">
          <div class="flex items-center justify-between">
            <button id="back-to-products" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#22a7d0] to-[#1e96c8] text-white font-semibold rounded-lg hover:from-[#1e96c8] hover:to-[#1a8bb8] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Explorar Todos los Productos
            </button>
            <div class="text-center">
              <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900">${product.name}</h1>
              <p class="text-orange-700 text-sm">Dashboard de Entrenamiento</p>
            </div>
            <div class="w-48"></div> <!-- Spacer for centering -->
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
              <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg class="w-6 h-6 mr-2 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                  </svg>
                  Bases de Datos Disponibles
                </h2>

                <div class="space-y-3">
                  ${allProducts.map(prod => {
    const isPurchased = purchasedProductIds.has(prod.id);
    const isCurrentProduct = prod.id === productId;

    return `
                      <div class="space-y-3">
                        <div class="flex items-center justify-between p-4 rounded-lg border-2 ${isPurchased
        ? isCurrentProduct
          ? 'border-[#22a7d0] bg-blue-50'
          : 'border-green-200 bg-green-50'
        : 'border-gray-300 bg-gray-100 opacity-75'
      } transition-all duration-200 hover:shadow-md ${isPurchased ? 'cursor-pointer' : ''}">
                          <div class="flex items-center space-x-3 flex-1">
                            <div class="relative">
                              <input type="checkbox" id="product-${prod.id}" ${isPurchased ? 'checked' : ''} ${!isPurchased ? 'disabled' : ''}
                                     class="w-5 h-5 text-[#22a7d0] bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#22a7d0] focus:ring-opacity-50 transition-all duration-200 ${!isPurchased ? 'cursor-not-allowed opacity-50' : 'hover:border-[#22a7d0] cursor-pointer'}"
                                     onchange="toggleProductDatabase('${prod.id}', this.checked)">
                              ${isPurchased ? `
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <svg class="w-3 h-3 text-white transform transition-all duration-300 ${document.getElementById('product-' + prod.id)?.checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                  </svg>
                                </div>
                              ` : ''}
                            </div>
                            <img src="${prod.imageURL || prod.image}" alt="${prod.name}" class="w-10 h-10 rounded-lg object-cover shadow-sm transition-all duration-200 ${!isPurchased ? 'grayscale' : ''}">
                            <div class="flex-1">
                              <h3 class="font-semibold ${isPurchased ? 'text-gray-900' : 'text-gray-500'} transition-colors">${prod.name}</h3>
                              <p class="text-sm ${isPurchased ? 'text-gray-600' : 'text-gray-400'}">${prod.category}</p>
                              ${!isPurchased ? `<p class="text-xs text-gray-500 mt-1">Este producto no ha sido comprado</p>` : ''}
                            </div>
                            ${isPurchased ? `
                              <div class="flex items-center">
                                <svg id="chevron-${prod.id}" class="w-5 h-5 text-gray-400 transition-transform duration-200 ${document.getElementById('product-' + prod.id)?.checked ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              </div>
                            ` : ''}
                          </div>
                          <div class="text-right ml-4">
                            ${isPurchased
        ? `<div class="flex items-center space-x-2">
                                   <span class="px-3 py-1 text-xs font-medium rounded-full border" style="background-color: ${(categories[prod.category]?.color || '#10B981')}20; color: ${categories[prod.category]?.color || '#10B981'}; border-color: ${categories[prod.category]?.color || '#10B981'}40;">
                                     <span class="w-2 h-2 rounded-full inline-block mr-1 animate-pulse" style="background-color: ${categories[prod.category]?.color || '#10B981'};"></span>
                                     Activo
                                   </span>
                                 </div>`
        : `<div class="text-right space-y-2">
                                   <div class="text-lg font-bold text-gray-500">$${prod.price}</div>
                                   <button onclick="addToCartFromDashboard('${prod.id}')" class="px-3 py-1 bg-[#22a7d0] text-white text-xs font-medium rounded-lg hover:bg-[#1e96bc] transition-colors shadow-sm transform hover:scale-105 duration-200">
                                     Agregar al Carrito
                                   </button>
                                 </div>`
      }
                          </div>
                        </div>

                        <!-- Topic Selection for Purchased Products -->
                        ${isPurchased ? `
                          <div id="topics-${prod.id}" class="ml-8 space-y-2 ${!document.getElementById('product-' + prod.id)?.checked ? 'hidden' : ''}">
                            <h4 class="text-sm font-medium text-gray-700">Temas disponibles:</h4>
                            <div class="grid grid-cols-2 gap-2">
                              ${(prod.topics || [
          { id: 'communications', name: 'Communications', questions: 45 },
          { id: 'navigation', name: 'Navigation & Tracks', questions: 38 },
          { id: 'weather', name: 'Weather & Environmental', questions: 32 },
          { id: 'emergency', name: 'Emergency Procedures', questions: 25 },
          { id: 'certification', name: 'Certification Standards', questions: 10 }
        ]).map(topic => `
                                <label class="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50">
                                  <input type="checkbox" checked class="text-[#22a7d0] focus:ring-[#22a7d0]"
                                         onchange="updateTopicSelection('${prod.id}', '${topic.id}', this.checked)">
                                  <div class="flex-1">
                                    <div class="text-sm font-medium text-gray-900">${topic.name}</div>
                                    <div class="text-xs text-gray-500">${topic.questions} preguntas</div>
                                  </div>
                                </label>
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
                  <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div class="flex items-start space-x-3">
                      <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <h4 class="font-medium text-amber-900 mb-1">Cómo funciona la selección de bases de datos</h4>
                        <ul class="text-sm text-amber-800 space-y-1">
                          <li>• <strong>Productos comprados:</strong> Puedes seleccionar los temas específicos de cada producto</li>
                          <li>• <strong>Productos no comprados:</strong> Aparecen en gris con el precio, necesitas comprarlos primero</li>
                          <li>• <strong>Combinación de bases:</strong> Selecciona múltiples productos para combinar sus preguntas en una sola sesión</li>
                          <li>• <strong>Temas personalizados:</strong> Elige los temas específicos que quieres estudiar de cada producto</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div class="text-lg font-bold text-[#22a7d0]" id="active-databases-count">${userPurchasedProducts.length}</div>
                        <div class="text-xs text-blue-800">Bases Activas</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-[#22a7d0]" id="total-questions">0</div>
                        <div class="text-xs text-blue-800">Preguntas Totales</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-[#22a7d0]" id="selected-topics">0</div>
                        <div class="text-xs text-blue-800">Temas Seleccionados</div>
                      </div>
                      <div>
                        <div class="text-lg font-bold text-[#22a7d0]" id="estimated-time">~60min</div>
                        <div class="text-xs text-blue-800">Tiempo Estimado</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Training Configuration -->
              <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg class="w-6 h-6 mr-2 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Configuración de Entrenamiento
                </h2>

                <div class="grid md:grid-cols-2 gap-6">
                  <!-- Mode Selection -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">Modo de Entrenamiento</label>
                    <div class="space-y-3">
                      <label class="flex items-center">
                        <input type="radio" name="training-mode" value="practice" checked class="mr-3 text-[#22a7d0] focus:ring-[#22a7d0]">
                        <div>
                          <div class="font-medium text-gray-900">Modo Práctica</div>
                          <div class="text-sm text-gray-600">Sin límite de tiempo, respuestas inmediatas</div>
                        </div>
                      </label>
                      <label class="flex items-center">
                        <input type="radio" name="training-mode" value="exam" class="mr-3 text-[#22a7d0] focus:ring-[#22a7d0]">
                        <div>
                          <div class="font-medium text-gray-900">Modo Examen</div>
                          <div class="text-sm text-gray-600">Tiempo limitado, evaluación final</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Question Count -->
                  <div>
                    <label for="question-count" class="block text-sm font-medium text-gray-700 mb-3">Número de Preguntas</label>
                    <select id="question-count" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                      <option value="10">10 preguntas</option>
                      <option value="25">25 preguntas</option>
                      <option value="50" selected>50 preguntas</option>
                      <option value="100">100 preguntas</option>
                      <option value="all">Todas las preguntas</option>
                    </select>
                  </div>

                  <!-- Exam Timer -->
                  <div id="exam-timer-section" class="hidden">
                    <label for="exam-timer" class="block text-sm font-medium text-gray-700 mb-3">
                      Tiempo del Examen: <span id="timer-display" class="font-bold text-[#22a7d0]">60 minutos</span>
                    </label>
                    <input type="range" id="exam-timer" min="15" max="180" value="60" step="15"
                           class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                           oninput="updateTimerDisplay(this.value)">
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                      <span>15 min</span>
                      <span>180 min</span>
                    </div>
                  </div>

                  <!-- Session Summary -->
                  <div class="md:col-span-2">
                    <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 class="font-medium text-gray-900 mb-3">Resumen de la Sesión</h4>
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span class="text-gray-600">Modo:</span>
                          <div class="font-medium" id="session-mode">Práctica</div>
                        </div>
                        <div>
                          <span class="text-gray-600">Preguntas:</span>
                          <div class="font-medium" id="session-questions">50</div>
                        </div>
                        <div>
                          <span class="text-gray-600">Tiempo:</span>
                          <div class="font-medium" id="session-time">Sin límite</div>
                        </div>
                        <div>
                          <span class="text-gray-600">Productos:</span>
                          <div class="font-medium" id="session-products">${userPurchasedProducts.length}</div>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t border-gray-200">
                        <span class="text-gray-600 text-sm">Temas seleccionados:</span>
                        <div class="mt-1" id="session-topics-list">
                          <span class="text-sm text-gray-500">Todos los temas de productos seleccionados</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Start Button -->
                  <div class="md:col-span-2">
                    <button id="start-training" class="w-full bg-[#22a7d0] text-white px-6 py-4 rounded-lg font-bold hover:bg-[#1e96bc] transition-all duration-300 shadow-lg transform hover:scale-105">
                      <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      Iniciar Entrenamiento
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar with Stats -->
            <div class="space-y-6">

              <!-- General Statistics -->
              <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Estadísticas Generales</h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Productos Adquiridos</span>
                    <span class="font-bold text-[#22a7d0]">${userPurchasedProducts.length}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Preguntas Respondidas</span>
                    <span class="font-bold text-[#22a7d0]">0</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Promedio General</span>
                    <span class="font-bold text-[#22a7d0]">--%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Tiempo Total Estudiado</span>
                    <span class="font-bold text-[#22a7d0]">0h 0m</span>
                  </div>
                </div>
              </div>

              <!-- Product-specific Statistics -->
              <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Estadísticas por Producto</h3>
                <div class="space-y-4">
                  ${userPurchasedProducts.map(prod => `
                    <div class="border-l-4 border-[#22a7d0] pl-4">
                      <h4 class="font-semibold text-gray-900 text-sm">${prod.name}</h4>
                      <div class="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                        <div>Progreso: <span class="font-medium">0%</span></div>
                        <div>Mejores: <span class="font-medium">--%</span></div>
                        <div>Preguntas: <span class="font-medium">0</span></div>
                        <div>Tiempo: <span class="font-medium">0h</span></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Quick Access -->
              <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Acceso Rápido</h3>
                <div class="space-y-3">
                  <button class="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                      <span class="text-sm font-medium">Historial de Sesiones</span>
                    </div>
                  </button>
                  <button class="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      <span class="text-sm font-medium">Documentación</span>
                    </div>
                  </button>
                  <button class="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 mr-3 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span class="text-sm font-medium">Ayuda y Soporte</span>
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
  const backButton = document.getElementById('back-to-products');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.hash = '#/products';
    });
  }

  const startTrainingButton = document.getElementById('start-training');
  if (startTrainingButton) {
    startTrainingButton.addEventListener('click', () => {
      // TODO: Navigate to guide page when implemented with selected configuration
      const selectedProducts = getSelectedProducts();
      const trainingMode = document.querySelector('input[name="training-mode"]:checked').value;
      const questionCount = document.getElementById('question-count').value;
      const examTimer = document.getElementById('exam-timer').value;

      console.log('Training Configuration:', {
        products: selectedProducts,
        mode: trainingMode,
        questions: questionCount,
        timer: examTimer
      });

      // For now, navigate to guide with main product
      window.location.hash = `#/guide/${productId}`;
    });
  }

  // Training mode toggle for exam timer
  const trainingModeInputs = document.querySelectorAll('input[name="training-mode"]');
  trainingModeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const examTimerSection = document.getElementById('exam-timer-section');
      if (e.target.value === 'exam') {
        examTimerSection.classList.remove('hidden');
      } else {
        examTimerSection.classList.add('hidden');
      }
      updateSessionSummary();
    });
  });

  // Question count change listener
  const questionCountSelect = document.getElementById('question-count');
  if (questionCountSelect) {
    questionCountSelect.addEventListener('change', updateSessionSummary);
  }

  // Global functions for interaction
  window.toggleProductDatabase = function (productId, isSelected) {
    console.log(`Database ${productId} ${isSelected ? 'activated' : 'deactivated'}`);

    // Show/hide topics section
    const topicsSection = document.getElementById(`topics-${productId}`);
    const chevron = document.getElementById(`chevron-${productId}`);

    if (topicsSection) {
      if (isSelected) {
        topicsSection.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
      } else {
        topicsSection.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
      }
    }

    updateAllCounts();
    updateSessionSummary();
  };

  window.addToCartFromDashboard = function (productId) {
    // Find the product and add to cart
    const productToAdd = allProducts.find(p => p.id === productId);
    if (productToAdd && window.cart) {
      window.cart.addToCart(productToAdd);

      // Show success message
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '¡Agregado!';
      button.classList.remove('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
      button.classList.add('bg-green-500', 'hover:bg-green-600');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-500', 'hover:bg-green-600');
        button.classList.add('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
      }, 2000);
    }
  };

  window.updateTopicSelection = function (productId, topicId, isSelected) {
    console.log(`Topic ${topicId} in ${productId} ${isSelected ? 'selected' : 'deselected'}`);
    updateAllCounts();
    updateSessionSummary();
  };

  window.updateTimerDisplay = function (value) {
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = `${value} minutos`;
    }
    updateSessionSummary();
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

    selectedProducts.forEach(productId => {
      const topicsSection = document.getElementById(`topics-${productId}`);
      if (topicsSection) {
        const topicCheckboxes = topicsSection.querySelectorAll('input[type="checkbox"]:checked');
        totalTopics += topicCheckboxes.length;

        // Calculate questions from selected topics
        topicCheckboxes.forEach(checkbox => {
          const questionElement = checkbox.closest('label').querySelector('.text-xs');
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

    // Update database count
    const countElement = document.getElementById('active-databases-count');
    if (countElement) {
      countElement.textContent = selectedProducts.length;
    }

    // Update topics count
    const topicsElement = document.getElementById('selected-topics');
    if (topicsElement) {
      topicsElement.textContent = totalTopics;
    }

    // Update questions count
    const questionsElement = document.getElementById('total-questions');
    if (questionsElement) {
      questionsElement.textContent = totalQuestions;
    }

    // Update estimated time based on actual selected topics
    const timeElement = document.getElementById('estimated-time');
    if (timeElement) {
      if (totalQuestions > 0) {
        const estimatedMinutes = Math.ceil(totalQuestions * 1.2); // 1.2 minutes per question
        timeElement.textContent = `~${estimatedMinutes}min`;
      } else {
        timeElement.textContent = '~0min';
      }
    }
  }

  function updateSessionSummary() {
    const selectedProducts = getSelectedProducts();
    const { totalTopics, totalQuestions } = getSelectedTopics();
    const trainingMode = document.querySelector('input[name="training-mode"]:checked')?.value || 'practice';
    const questionCount = document.getElementById('question-count')?.value || '50';
    const examTimer = document.getElementById('exam-timer')?.value || '60';

    // Update session mode
    const modeElement = document.getElementById('session-mode');
    if (modeElement) {
      modeElement.textContent = trainingMode === 'practice' ? 'Práctica' : 'Examen';
    }

    // Update session questions
    const questionsElement = document.getElementById('session-questions');
    if (questionsElement) {
      if (questionCount === 'all') {
        questionsElement.textContent = `${totalQuestions} (todas)`;
      } else {
        questionsElement.textContent = Math.min(parseInt(questionCount), totalQuestions);
      }
    }

    // Update session time
    const timeElement = document.getElementById('session-time');
    if (timeElement) {
      if (trainingMode === 'exam') {
        timeElement.textContent = `${examTimer} minutos`;
      } else {
        timeElement.textContent = 'Sin límite';
      }
    }

    // Update session products
    const productsElement = document.getElementById('session-products');
    if (productsElement) {
      productsElement.textContent = selectedProducts.length;
    }

    // Update topics list with specific selected topics
    const topicsListElement = document.getElementById('session-topics-list');
    if (topicsListElement) {
      if (totalTopics > 0) {
        const selectedTopicDetails = getSelectedTopicsDetails();
        const topicsHtml = selectedTopicDetails.map(item =>
          `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">${item.productName}: ${item.topics.join(', ')}</span>`
        ).join('');

        topicsListElement.innerHTML = `
          <div class="space-y-1">
            <div class="text-sm text-gray-700 font-medium">${totalTopics} temas seleccionados:</div>
            <div class="flex flex-wrap">${topicsHtml}</div>
          </div>
        `;
      } else {
        topicsListElement.innerHTML = `<span class="text-sm text-gray-500">Selecciona productos para ver temas disponibles</span>`;
      }
    }
  }

  function getSelectedTopicsDetails() {
    const selectedProducts = getSelectedProducts();
    const topicsDetails = [];

    selectedProducts.forEach(productId => {
      const product = allProducts.find(p => p.id === productId);
      const topicsSection = document.getElementById(`topics-${productId}`);

      if (topicsSection && product) {
        const selectedTopicNames = [];
        const topicCheckboxes = topicsSection.querySelectorAll('input[type="checkbox"]:checked');

        topicCheckboxes.forEach(checkbox => {
          const label = checkbox.closest('label');
          const topicName = label.querySelector('.text-sm.font-medium').textContent;
          selectedTopicNames.push(topicName);
        });

        if (selectedTopicNames.length > 0) {
          topicsDetails.push({
            productName: product.name,
            topics: selectedTopicNames
          });
        }
      }
    });

    return topicsDetails;
  }

  // Initialize counts and summary
  updateAllCounts();
  updateSessionSummary();
}
import { auth } from '../../js/firebase.js';
import { verifyUserAppAccess, getProductsFromFirebase, getUserProducts } from '../../js/userProfile.js';

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

  try {
    allProducts = await getProductsFromFirebase();
    product = allProducts.find(p => p.id === productId);
    userPurchasedProducts = await getUserProducts(auth.currentUser.uid);

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
                      <div class="flex items-center justify-between p-4 rounded-lg border-2 ${
                        isPurchased
                          ? isCurrentProduct
                            ? 'border-[#22a7d0] bg-blue-50'
                            : 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }">
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <input type="checkbox" id="product-${prod.id}" ${isPurchased ? 'checked' : ''} ${!isPurchased ? 'disabled' : ''}
                                   class="w-5 h-5 text-[#22a7d0] bg-gray-100 border-gray-300 rounded focus:ring-[#22a7d0] focus:ring-2"
                                   onchange="toggleProductDatabase('${prod.id}', this.checked)">
                            ${isPurchased ? `
                              <svg class="absolute top-0 left-0 w-5 h-5 text-green-500 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                              </svg>
                            ` : ''}
                          </div>
                          <img src="${prod.image}" alt="${prod.name}" class="w-8 h-8 rounded object-cover">
                          <div>
                            <h3 class="font-semibold text-gray-900">${prod.name}</h3>
                            <p class="text-sm text-gray-600">${prod.category}</p>
                          </div>
                        </div>
                        <div class="text-right">
                          ${isPurchased
                            ? `<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">✓ Activo</span>`
                            : `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">No disponible</span>`
                          }
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p class="text-sm text-blue-800">
                    <strong>Bases activas:</strong> <span id="active-databases-count">${userPurchasedProducts.length}</span> productos
                    | <strong>Total de preguntas combinadas:</strong> <span id="total-questions">0</span>
                  </p>
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
                    <label for="exam-timer" class="block text-sm font-medium text-gray-700 mb-3">Tiempo del Examen</label>
                    <select id="exam-timer" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                      <option value="30">30 minutos</option>
                      <option value="60" selected>60 minutos</option>
                      <option value="90">90 minutos</option>
                      <option value="120">120 minutos</option>
                    </select>
                  </div>

                  <!-- Start Button -->
                  <div class="flex items-end">
                    <button id="start-training" class="w-full bg-[#22a7d0] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1e96bc] transition-all duration-300 shadow-lg transform hover:scale-105">
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
    });
  });

  // Global functions for checkbox interaction
  window.toggleProductDatabase = function(productId, isSelected) {
    console.log(`Database ${productId} ${isSelected ? 'activated' : 'deactivated'}`);
    updateDatabaseCount();
    updateTotalQuestions();
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

  function updateDatabaseCount() {
    const selectedProducts = getSelectedProducts();
    const countElement = document.getElementById('active-databases-count');
    if (countElement) {
      countElement.textContent = selectedProducts.length;
    }
  }

  function updateTotalQuestions() {
    // Simulate question count calculation
    const selectedProducts = getSelectedProducts();
    const baseQuestions = 150; // Base questions per product
    const totalQuestions = selectedProducts.length * baseQuestions;

    const questionsElement = document.getElementById('total-questions');
    if (questionsElement) {
      questionsElement.textContent = totalQuestions;
    }
  }

  // Initialize counts
  updateDatabaseCount();
  updateTotalQuestions();
}
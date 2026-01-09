import { getProductsFromFirebase, initializeProductsInFirebase, isUserAdmin, isAdminEmail } from '../../js/userProfile.js';
import { auth, db } from '../../js/firebase.js';
import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';

export async function renderAdminView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  // Check if user is authenticated
  if (!auth?.currentUser) {
    root.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h1>
          <p class="text-gray-600 mb-6">Debes iniciar sesión para acceder al panel de administración.</p>
          <a href="#/auth" class="bg-[#22a7d0] text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
            Iniciar Sesión
          </a>
        </div>
      </div>
    `;
    return;
  }

  // DEBUG: Log email exacto del usuario
  console.log('🔍 EMAIL EXACTO DEL USUARIO:', auth.currentUser.email);
  console.log('📧 Copia este email y actualiza firestore.rules línea 9');

  // Check if user is admin
  const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);

  if (!userIsAdmin) {
    root.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <div class="mb-6">
            <svg class="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.832-.833-2.602 0L4.212 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p class="text-gray-600 mb-6">No tienes permisos para acceder al panel de administración.</p>
          <p class="text-sm text-gray-500 mb-6">Solo los administradores pueden gestionar el catálogo de productos.</p>
          <div class="space-x-4">
            <a href="#/" class="bg-[#22a7d0] text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
              Volver al Inicio
            </a>
            <a href="#/products" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors">
              Ver Productos
            </a>
          </div>
        </div>
      </div>
    `;
    return;
  }

  try {
    const products = await getProductsFromFirebase();
    const categories = await getCategoriesFromFirebase();
    const badges = await getBadgesFromFirebase();

    // Create lookup maps for colors
    const categoryColorMap = {};
    categories.forEach(cat => {
      categoryColorMap[cat.id] = cat.color;
    });

    const badgeColorMap = {};
    badges.forEach(badge => {
      badgeColorMap[badge.id] = badge.color;
    });

    root.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <div class="bg-white shadow-sm border-b">
          <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
              <h1 class="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <div class="flex items-center gap-4">
                <button
                  id="setup-admin-btn"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  title="Crear usuario admin en Firebase"
                >
                  🔧 Configurar Admin
                </button>
                <span class="text-sm text-gray-600">Bienvenido, ${auth.currentUser.email}</span>
                <a href="#/" class="text-[#22a7d0] hover:text-blue-600">← Volver al sitio</a>
              </div>
            </div>
          </div>
        </div>

        <div class="container mx-auto px-6 py-8">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6 border">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Total Productos</p>
                  <p class="text-2xl font-bold text-gray-900">${products.length}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6 border">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-green-100 text-green-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Categorías</p>
                  <p class="text-2xl font-bold text-gray-900">${[...new Set(products.map(p => p.category))].length}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6 border">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Estado</p>
                  <p class="text-2xl font-bold text-green-600">Activo</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Admin Tabs -->
          <div class="bg-white rounded-lg shadow-sm border mb-8">
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <button id="tab-products" class="admin-tab active py-4 px-1 border-b-2 border-[#22a7d0] font-medium text-sm text-[#22a7d0]">
                  Productos
                </button>
                <button id="tab-categories" class="admin-tab py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Categorías
                </button>
                <button id="tab-badges" class="admin-tab py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Badges
                </button>
                <button id="tab-offers" class="admin-tab py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Ofertas
                </button>
                <a href="#/admin/users" class="admin-tab-link py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center gap-2">
                  Usuarios
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
                <a href="#/admin/databases" class="admin-tab-link py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center gap-2">
                  Bases de Datos
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M10 11v6m4-6v6"></path>
                  </svg>
                </a>
              </nav>
            </div>

            <!-- Products Tab -->
            <div id="products-content" class="admin-content p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">Gestión de Productos</h2>
                <button id="btn-add-product" class="bg-[#22a7d0] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  + Agregar Producto
                </button>
              </div>
              <!-- Product Form Modal (hidden by default) -->
              <div id="product-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                  <div class="flex justify-between items-center mb-4">
                    <h3 id="modal-title" class="text-lg font-bold text-gray-900">Agregar Producto</h3>
                    <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>

                  <form id="product-form" class="space-y-4">
                    <input type="hidden" id="product-id">

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto</label>
                        <input type="text" id="product-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Precio ($)</label>
                        <input type="number" id="product-price" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Precio Original (opcional)</label>
                        <input type="number" id="product-original-price" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                        <input type="number" id="product-rating" min="1" max="5" step="0.1" value="4.5" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                        <select id="product-category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                          <option value="">Seleccionar categoría</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Badge</label>
                        <select id="product-badge" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                          <option value="">Sin badge</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Oferta</label>
                      <select id="product-offer" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                        <option value="">Sin oferta</option>
                      </select>
                      <p class="text-xs text-gray-500 mt-1">Solo se mostrarán ofertas creadas para este producto</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                      <textarea id="product-description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required></textarea>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">URL de Imagen</label>
                      <input type="url" id="product-image" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="https://ejemplo.com/imagen.jpg">
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">URL de la App/Guía (para acceso post-compra)</label>
                      <input type="url" id="product-app-url" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="https://apps.frostware.com/mi-guia/">
                      <p class="text-xs text-gray-500 mt-1">URL donde el usuario accederá después de comprar el producto</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">ID de Base de Datos (para preguntas)</label>
                      <input type="text" id="product-database-id" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="Ej: nat-ops-questions">
                      <p class="text-xs text-gray-500 mt-1">Identificador único para la colección de preguntas de este producto</p>
                    </div>

                    <!-- Questions Management Section -->
                    <div class="border-t border-gray-200 pt-4 mt-4">
                      <h4 class="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Gestión de Preguntas
                      </h4>

                      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div class="flex items-start">
                          <svg class="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                          </svg>
                          <div class="text-sm text-blue-800">
                            <p class="font-medium mb-1">Formato del JSON de preguntas:</p>
                            <p class="text-xs">El JSON debe ser un array con objetos que contengan: question, options (array), correctAnswer (índice), topic, explanation (opcional)</p>
                          </div>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div class="flex items-center justify-between">
                            <div>
                              <p class="text-xs text-gray-500 uppercase tracking-wide">Preguntas Actuales</p>
                              <p id="current-questions-count" class="text-2xl font-bold text-gray-900">-</p>
                            </div>
                            <div class="p-3 bg-blue-100 rounded-full">
                              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div class="flex items-center justify-between">
                            <div>
                              <p class="text-xs text-gray-500 uppercase tracking-wide">Preguntas Detectadas</p>
                              <p id="detected-questions-count" class="text-2xl font-bold text-green-600">-</p>
                            </div>
                            <div class="p-3 bg-green-100 rounded-full">
                              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="mb-3">
                        <label class="block text-sm font-medium text-gray-700 mb-2">JSON de Preguntas</label>
                        <textarea id="product-questions-json" rows="6" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0] font-mono text-sm" placeholder='[{"question": "¿Pregunta?", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "topic": "Tema"}]'></textarea>
                        <p class="text-xs text-gray-500 mt-1">Pega aquí el JSON con las preguntas del producto</p>
                      </div>

                      <div id="json-validation-message" class="hidden mb-3"></div>

                      <div class="flex gap-3">
                        <button type="button" id="btn-process-questions" class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          Procesar JSON
                        </button>
                        <button type="button" id="btn-insert-questions" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 opacity-50 cursor-not-allowed" disabled>
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                          </svg>
                          Insertar a Firebase
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center">
                      <input type="checkbox" id="product-show-on-homepage" class="w-4 h-4 text-[#22a7d0] border-gray-300 rounded focus:ring-[#22a7d0]">
                      <label for="product-show-on-homepage" class="ml-2 block text-sm font-medium text-gray-700">Mostrar en página principal</label>
                      <p class="ml-2 text-xs text-gray-500">(Los productos marcados aparecerán en la sección de productos destacados)</p>
                    </div>

                    <div class="flex justify-end space-x-3">
                      <button type="button" id="cancel-product" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        Cancelar
                      </button>
                      <button type="submit" id="submit-product" class="bg-[#22a7d0] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        Guardar Producto
                      </button>
                    </div>
                  </form>
                </div>
              </div>
          </div>

              <!-- Products Table -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ofertas</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200" id="products-table-body">
                    ${products.map(product => {
      // Calcular descuento si hay oferta activa
      const hasOffer = product.hasActiveOffer && product.originalPrice && product.originalPrice > product.price;
      const discountPercent = hasOffer
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

      return `
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            ${(() => {
          const productName = typeof product.name === 'string'
            ? product.name
            : (product.name?.[i18n.getCurrentLanguage()] || product.name?.es || product.name?.en || 'Sin nombre');
          const productDesc = typeof product.description === 'string'
            ? product.description.substring(0, 50)
            : (product.description?.[i18n.getCurrentLanguage()] || product.description?.es || product.description?.en || 'Sin descripción').substring(0, 50);
          return `
                                <img src="${product.imageURL || product.image || 'https://placehold.co/40x40/1a202c/FFFFFF?text=' + encodeURIComponent(productName.charAt(0))}"
                                     alt="${productName}" class="w-10 h-10 rounded-lg object-cover">
                                <div class="ml-4">
                                  <div class="text-sm font-medium text-gray-900">${productName}</div>
                                  <div class="text-sm text-gray-500">${productDesc}...</div>
                                </div>
                              `;
        })()}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          ${(() => {
          const categoryColor = categoryColorMap[product.category] || '#6B7280';
          return `
                              <span class="px-2 py-1 text-xs font-medium rounded-full" style="background-color: ${categoryColor}20; color: ${categoryColor}">
                                ${product.category}
                              </span>
                            `;
        })()}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          ${hasOffer ? `
                            <div class="flex items-center space-x-2">
                              <span class="font-bold text-green-600">$${product.price}</span>
                              <span class="text-gray-500 line-through text-xs">$${product.originalPrice}</span>
                            </div>
                          ` : `
                            <span class="text-gray-900">$${product.price || 99}</span>
                          `}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          ${hasOffer ? `
                            <div class="flex flex-col space-y-1">
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"></path>
                                </svg>
                                -${discountPercent}% OFF
                              </span>
                              <span class="text-xs text-green-700 font-medium">
                                Ahorro: $${(product.originalPrice - product.price).toFixed(2)}
                              </span>
                            </div>
                          ` : `
                            <span class="text-xs text-gray-500">Sin oferta</span>
                          `}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          ${product.badge ? (() => {
          const badgeColor = badgeColorMap[product.badge] || '#3B82F6';
          return `
                              <span class="px-2 py-1 text-xs font-medium rounded-full" style="background-color: ${badgeColor}20; color: ${badgeColor}">
                                ${product.badge}
                              </span>
                            `;
        })() : '-'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button data-product-id="${product.id}" data-action="edit-product"
                                  class="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 px-3 py-1 rounded transition-colors">
                            Editar
                          </button>
                          <button data-product-id="${product.id}" data-action="delete-product"
                                  class="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors">
                            Eliminar
                          </button>
                        </td>
                      </tr>`;
    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Categories Tab -->
            <div id="categories-content" class="admin-content hidden p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">Gestión de Categorías</h2>
                <button id="btn-add-category" class="bg-[#22a7d0] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  + Agregar Categoría
                </button>
              </div>

              <!-- Category Form Modal (hidden by default) -->
              <div id="category-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
                  <div class="flex justify-between items-center mb-4">
                    <h3 id="category-modal-title" class="text-lg font-bold text-gray-900">Agregar Categoría</h3>
                    <button id="close-category-modal" class="text-gray-400 hover:text-gray-600">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>

                  <form id="category-form" class="space-y-4">
                    <input type="hidden" id="category-editing-id">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">ID de la Categoría</label>
                      <input type="text" id="category-id" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="Ej: question-guide" required>
                      <p class="text-xs text-gray-500 mt-1">Usar minúsculas, sin espacios, con guiones</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de la Categoría</label>
                      <input type="text" id="category-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="Ej: Question Guide App" required>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Color (formato hex)</label>
                      <div class="flex gap-2">
                        <input type="color" id="category-color-picker" class="w-16 h-10 border border-gray-300 rounded-md cursor-pointer">
                        <input type="text" id="category-color" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="#3B82F6" pattern="^#([A-Fa-f0-9]{6})$" required>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">Selecciona un color para identificar la categoría</p>
                    </div>

                    <div class="flex justify-end space-x-3">
                      <button type="button" id="cancel-category" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        Cancelar
                      </button>
                      <button type="submit" id="submit-category" class="bg-[#22a7d0] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        Guardar Categoría
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div id="categories-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Categories will be loaded here -->
              </div>
            </div>

            <!-- Badges Tab -->
            <div id="badges-content" class="admin-content hidden p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">Gestión de Badges</h2>
                <button id="btn-add-badge" class="bg-[#22a7d0] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  + Agregar Badge
                </button>
              </div>

              <!-- Badge Form Modal (hidden by default) -->
              <div id="badge-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
                  <div class="flex justify-between items-center mb-4">
                    <h3 id="badge-modal-title" class="text-lg font-bold text-gray-900">Agregar Badge</h3>
                    <button id="close-badge-modal" class="text-gray-400 hover:text-gray-600">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>

                  <form id="badge-form" class="space-y-4">
                    <input type="hidden" id="badge-editing-id">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">ID del Badge</label>
                      <input type="text" id="badge-id" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="Ej: New" required>
                      <p class="text-xs text-gray-500 mt-1">Identificador único del badge</p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Badge</label>
                      <input type="text" id="badge-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="Ej: Nuevo" required>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Color (formato hex)</label>
                      <div class="flex gap-2">
                        <input type="color" id="badge-color-picker" class="w-16 h-10 border border-gray-300 rounded-md cursor-pointer">
                        <input type="text" id="badge-color" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="#3B82F6" pattern="^#([A-Fa-f0-9]{6})$" required>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">Color del badge para visualización</p>
                    </div>

                    <div class="flex justify-end space-x-3">
                      <button type="button" id="cancel-badge" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        Cancelar
                      </button>
                      <button type="submit" id="submit-badge" class="bg-[#22a7d0] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        Guardar Badge
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div id="badges-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Badges will be loaded here -->
              </div>
            </div>

            <!-- Offers Tab -->
            <div id="offers-content" class="admin-content hidden p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">Gestión de Ofertas</h2>
                <button id="btn-add-offer" class="bg-[#22a7d0] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  + Crear Oferta
                </button>
              </div>

              <!-- Offer Form Modal (hidden by default) -->
              <div id="offer-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 shadow-lg rounded-md bg-white">
                  <div class="flex justify-between items-center mb-4">
                    <h3 id="offer-modal-title" class="text-lg font-bold text-gray-900">Crear Oferta</h3>
                    <button id="close-offer-modal" class="text-gray-400 hover:text-gray-600">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>

                  <form id="offer-form" class="space-y-4">
                    <input type="hidden" id="offer-editing-id">

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                      <select id="offer-product" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                        <option value="">Seleccionar producto</option>
                      </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Precio Original</label>
                        <input type="number" id="offer-original-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0] bg-gray-100" placeholder="99.99" step="0.01" readonly required>
                        <p class="text-xs text-gray-500 mt-1">Se carga automáticamente del producto</p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Precio con Descuento</label>
                        <div class="flex gap-2">
                          <input type="number" id="offer-discount-price" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="49.99" step="0.01" required>
                          <button type="button" id="set-free-btn" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                            Gratis
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio</label>
                        <input type="date" id="offer-start-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin</label>
                        <input type="date" id="offer-end-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                        <div class="flex items-center mt-2">
                          <input type="checkbox" id="offer-indefinite" class="w-4 h-4 text-[#22a7d0] border-gray-300 rounded focus:ring-[#22a7d0]">
                          <label for="offer-indefinite" class="ml-2 block text-sm text-gray-700">Por tiempo indefinido</label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
                      <textarea id="offer-description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" placeholder="Oferta especial de temporada"></textarea>
                    </div>

                    <div class="flex items-center">
                      <input type="checkbox" id="offer-active" class="w-4 h-4 text-[#22a7d0] border-gray-300 rounded focus:ring-[#22a7d0]">
                      <label for="offer-active" class="ml-2 block text-sm text-gray-700">Activar oferta inmediatamente</label>
                    </div>

                    <div class="flex justify-end space-x-3">
                      <button type="button" id="cancel-offer" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        Cancelar
                      </button>
                      <button type="submit" id="submit-offer" class="bg-[#22a7d0] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        Guardar Oferta
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div id="offers-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Offers will be loaded here -->
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Custom Confirmation Modal -->
      <div id="custom-confirm-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[60] flex items-center justify-center">
        <div class="relative mx-auto p-8 border w-11/12 md:w-2/3 lg:w-1/2 max-w-2xl shadow-2xl rounded-xl bg-white transform transition-all">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h3 id="confirm-modal-title" class="text-2xl font-bold text-gray-900 mb-3"></h3>
            <div id="confirm-modal-message" class="text-gray-600 text-left bg-gray-50 rounded-lg p-4 mb-6 space-y-2"></div>
            <div class="flex justify-center space-x-4">
              <button id="confirm-cancel-btn" class="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200 min-w-[120px]">
                Cancelar
              </button>
              <button id="confirm-delete-btn" class="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200 min-w-[120px] flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize form handling
    initializeAdminPage();

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error cargando panel de administración:', error);
    root.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
  }
}

function initializeAdminPage() {
  console.log('🚀 Initializing admin page...');

  // Initialize setup admin button
  const setupAdminBtn = document.getElementById('setup-admin-btn');
  if (setupAdminBtn) {
    setupAdminBtn.addEventListener('click', setupAdminUser);
  }

  // Initialize tabs
  initializeTabs();

  // Initialize modals
  initializeModals();

  // Initialize global event listeners for admin panel (only once)
  console.log('📌 About to call initializeCategoryBadgeListeners...');
  initializeCategoryBadgeListeners();

  // Load dynamic data
  loadCategoriesAndBadges();
  loadOffers();

  // Initialize product form
  initializeProductForm();

  // Initialize category form
  initializeCategoryForm();

  // Initialize badge form
  initializeBadgeForm();

  // Initialize offer modal and form
  initializeOfferModal();
  initializeOfferForm();

  // Initialize questions management
  initializeQuestionsManagement();

  console.log('✅ Admin page initialization complete');
}

// Global click handler for admin panel
function handleAdminPanelClick(e) {
  const button = e.target.closest('[data-action]');

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  // Product actions
  if (action === 'edit-product') {
    e.preventDefault();
    e.stopPropagation();
    const productId = button.dataset.productId;
    window.editProduct(productId);
  } else if (action === 'delete-product') {
    e.preventDefault();
    e.stopPropagation();
    const productId = button.dataset.productId;
    window.deleteProduct(productId);
  }
  // Category actions
  else if (action === 'edit-category') {
    e.preventDefault();
    e.stopPropagation();
    const categoryId = button.dataset.categoryId;
    window.editCategory(categoryId);
  } else if (action === 'delete-category') {
    e.preventDefault();
    e.stopPropagation();
    const categoryId = button.dataset.categoryId;
    const productCount = parseInt(button.dataset.productCount) || 0;
    window.deleteCategory(categoryId, productCount);
  }
  // Badge actions
  else if (action === 'edit-badge') {
    e.preventDefault();
    e.stopPropagation();
    const badgeId = button.dataset.badgeId;
    window.editBadge(badgeId);
  } else if (action === 'delete-badge') {
    e.preventDefault();
    e.stopPropagation();
    const badgeId = button.dataset.badgeId;
    const productCount = parseInt(button.dataset.productCount) || 0;
    window.deleteBadge(badgeId, productCount);
  }
  // Offer actions
  else if (action === 'edit-offer') {
    e.preventDefault();
    e.stopPropagation();
    const offerId = button.dataset.offerId;
    window.editOffer(offerId);
  } else if (action === 'delete-offer') {
    e.preventDefault();
    e.stopPropagation();
    const offerId = button.dataset.offerId;
    window.deleteOffer(offerId);
  }
}

// Initialize event listeners - attach once to document
let adminListenerAttached = false;

function initializeCategoryBadgeListeners() {
  if (adminListenerAttached) return;

  // Attach a single listener to document that handles all admin panel clicks
  // Use capture phase to intercept events before other handlers
  document.addEventListener('click', handleAdminPanelClick, true);
  adminListenerAttached = true;
  console.log('✅ Admin panel listeners attached to document with capture=true');

  // Add listeners for category and badge select changes to update colors
  initializeColorPreviewListeners();
}

async function initializeColorPreviewListeners() {
  console.log('🎨 Initializing color preview listeners...');
  const categorySelect = document.getElementById('product-category');
  const badgeSelect = document.getElementById('product-badge');

  if (categorySelect) {
    console.log('✅ Category select found, adding listener');
    categorySelect.addEventListener('change', async (e) => {
      console.log('🔄 Category changed to:', e.target.value);
      const categories = await getCategoriesFromFirebase();
      console.log('📋 Categories loaded:', categories);
      const selectedCategory = categories.find(c => c.id === e.target.value);
      console.log('🎯 Selected category:', selectedCategory);

      // Update category color in the select or add a color preview
      if (selectedCategory && selectedCategory.color) {
        console.log('🎨 Applying color:', selectedCategory.color);
        categorySelect.style.borderLeftColor = selectedCategory.color;
        categorySelect.style.borderLeftWidth = '4px';
        categorySelect.style.borderLeftStyle = 'solid';
      } else {
        console.log('⚠️ No color found for category');
        categorySelect.style.borderLeftColor = '';
        categorySelect.style.borderLeftWidth = '';
        categorySelect.style.borderLeftStyle = '';
      }
    });
  } else {
    console.log('❌ Category select not found');
  }

  if (badgeSelect) {
    console.log('✅ Badge select found, adding listener');
    badgeSelect.addEventListener('change', async (e) => {
      console.log('🔄 Badge changed to:', e.target.value);
      const badges = await getBadgesFromFirebase();
      console.log('📋 Badges loaded:', badges);
      const selectedBadge = badges.find(b => b.id === e.target.value);
      console.log('🎯 Selected badge:', selectedBadge);

      // Update badge color in the select or add a color preview
      if (selectedBadge && selectedBadge.color) {
        console.log('🎨 Applying color:', selectedBadge.color);
        badgeSelect.style.borderLeftColor = selectedBadge.color;
        badgeSelect.style.borderLeftWidth = '4px';
        badgeSelect.style.borderLeftStyle = 'solid';
      } else {
        console.log('⚠️ No color found for badge');
        badgeSelect.style.borderLeftColor = '';
        badgeSelect.style.borderLeftWidth = '';
        badgeSelect.style.borderLeftStyle = '';
      }
    });
  } else {
    console.log('❌ Badge select not found');
  }
}

// Helper function to apply colors to selects
async function applySelectColors(categoryId, badgeId) {
  console.log('🎨 Applying colors for category:', categoryId, 'badge:', badgeId);

  const categorySelect = document.getElementById('product-category');
  const badgeSelect = document.getElementById('product-badge');

  // Apply category color
  if (categoryId && categorySelect) {
    const categories = await getCategoriesFromFirebase();
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (selectedCategory && selectedCategory.color) {
      console.log('🎨 Applying category color:', selectedCategory.color);
      categorySelect.style.borderLeftColor = selectedCategory.color;
      categorySelect.style.borderLeftWidth = '4px';
      categorySelect.style.borderLeftStyle = 'solid';
    }
  }

  // Apply badge color
  if (badgeId && badgeSelect) {
    const badges = await getBadgesFromFirebase();
    const selectedBadge = badges.find(b => b.id === badgeId);
    if (selectedBadge && selectedBadge.color) {
      console.log('🎨 Applying badge color:', selectedBadge.color);
      badgeSelect.style.borderLeftColor = selectedBadge.color;
      badgeSelect.style.borderLeftWidth = '4px';
      badgeSelect.style.borderLeftStyle = 'solid';
    }
  }
}

function initializeTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const contents = document.querySelectorAll('.admin-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => {
        t.classList.remove('active', 'border-[#22a7d0]', 'text-[#22a7d0]');
        t.classList.add('border-transparent', 'text-gray-500');
      });

      // Add active class to clicked tab
      tab.classList.add('active', 'border-[#22a7d0]', 'text-[#22a7d0]');
      tab.classList.remove('border-transparent', 'text-gray-500');

      // Hide all content
      contents.forEach(content => content.classList.add('hidden'));

      // Show corresponding content
      const targetId = tab.id.replace('tab-', '') + '-content';
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.remove('hidden');
      }
    });
  });
}

function initializeModals() {
  // Product Modal
  const modal = document.getElementById('product-modal');
  const btnAdd = document.getElementById('btn-add-product');
  const btnClose = document.getElementById('close-modal');
  const btnCancel = document.getElementById('cancel-product');

  // Navigate to product form page for adding product
  if (btnAdd) {
    console.log('✅ btn-add-product found, attaching listener');
    btnAdd.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔘 Agregar Producto clicked, navigating to #/admin/product/new');

      try {
        // Cambiar hash primero
        window.location.hash = '#/admin/product/new';
        console.log('✅ Hash changed to:', window.location.hash);

        // Importar y llamar directamente a la función
        const { renderProductFormView } = await import('../product-form/view.js');
        await renderProductFormView();
        console.log('✅ Product form view rendered');
      } catch (error) {
        console.error('❌ Error navigating to product form:', error);
      }
    });
  } else {
    console.warn('⚠️ btn-add-product not found in DOM');
  }

  // Close modal
  const closeModal = () => {
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  btnClose?.addEventListener('click', closeModal);
  btnCancel?.addEventListener('click', closeModal);

  // Close modal when clicking outside
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Category Modal
  const categoryModal = document.getElementById('category-modal');
  const btnAddCategory = document.getElementById('btn-add-category');
  const btnCloseCategory = document.getElementById('close-category-modal');
  const btnCancelCategory = document.getElementById('cancel-category');

  btnAddCategory?.addEventListener('click', () => {
    document.getElementById('category-modal-title').textContent = 'Agregar Categoría';
    document.getElementById('category-editing-id').value = '';
    document.getElementById('category-form').reset();
    document.getElementById('category-id').disabled = false;
    document.getElementById('category-color').value = '#3B82F6';
    document.getElementById('category-color-picker').value = '#3B82F6';
    categoryModal.classList.remove('hidden');
  });

  const closeCategoryModal = () => {
    categoryModal.classList.add('hidden');
    document.getElementById('category-editing-id').value = '';
    document.getElementById('category-id').disabled = false;
  };

  btnCloseCategory?.addEventListener('click', closeCategoryModal);
  btnCancelCategory?.addEventListener('click', closeCategoryModal);

  categoryModal?.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
      closeCategoryModal();
    }
  });

  // Sync color picker with text input for categories
  const categoryColorPicker = document.getElementById('category-color-picker');
  const categoryColorInput = document.getElementById('category-color');

  categoryColorPicker?.addEventListener('input', (e) => {
    categoryColorInput.value = e.target.value.toUpperCase();
  });

  categoryColorInput?.addEventListener('input', (e) => {
    const color = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      categoryColorPicker.value = color;
    }
  });

  // Badge Modal
  const badgeModal = document.getElementById('badge-modal');
  const btnAddBadge = document.getElementById('btn-add-badge');
  const btnCloseBadge = document.getElementById('close-badge-modal');
  const btnCancelBadge = document.getElementById('cancel-badge');

  btnAddBadge?.addEventListener('click', () => {
    document.getElementById('badge-modal-title').textContent = 'Agregar Badge';
    document.getElementById('badge-editing-id').value = '';
    document.getElementById('badge-form').reset();
    document.getElementById('badge-id').disabled = false;
    document.getElementById('badge-color').value = '#3B82F6';
    document.getElementById('badge-color-picker').value = '#3B82F6';
    badgeModal.classList.remove('hidden');
  });

  const closeBadgeModal = () => {
    badgeModal.classList.add('hidden');
    document.getElementById('badge-editing-id').value = '';
    document.getElementById('badge-id').disabled = false;
  };

  btnCloseBadge?.addEventListener('click', closeBadgeModal);
  btnCancelBadge?.addEventListener('click', closeBadgeModal);

  badgeModal?.addEventListener('click', (e) => {
    if (e.target === badgeModal) {
      closeBadgeModal();
    }
  });

  // Sync color picker with text input for badges
  const badgeColorPicker = document.getElementById('badge-color-picker');
  const badgeColorInput = document.getElementById('badge-color');

  badgeColorPicker?.addEventListener('input', (e) => {
    badgeColorInput.value = e.target.value.toUpperCase();
  });

  badgeColorInput?.addEventListener('input', (e) => {
    const color = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      badgeColorPicker.value = color;
    }
  });
}

async function loadCategoriesAndBadges() {
  try {
    // Load categories from Firebase or use defaults
    const categories = await getCategoriesFromFirebase();
    const badges = await getBadgesFromFirebase();
    const products = await getProductsFromFirebase();

    // Populate category select
    const categorySelect = document.getElementById('product-category');
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
      categories.forEach(category => {
        categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
      });
    }

    // Populate badge select
    const badgeSelect = document.getElementById('product-badge');
    if (badgeSelect) {
      badgeSelect.innerHTML = '<option value="">Sin badge</option>';
      badges.forEach(badge => {
        badgeSelect.innerHTML += `<option value="${badge.id}">${badge.name}</option>`;
      });
    }

    // Load categories list with product counts
    loadCategoriesList(categories, products);
    loadBadgesList(badges, products);

  } catch (error) {
    console.error('Error loading categories and badges:', error);
  }
}

function initializeProductForm() {
  const productForm = document.getElementById('product-form');

  productForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      // Check if user is authenticated and admin
      if (!auth?.currentUser) {
        showAdminToast('Debes iniciar sesión para realizar esta acción', 'error');
        return;
      }

      const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
      if (!userIsAdmin) {
        showAdminToast('No tienes permisos para realizar esta acción.', 'error');
        return;
      }

      const submitBtn = document.getElementById('submit-product');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      // Get form data
      const productName = document.getElementById('product-name').value;
      const productDescription = document.getElementById('product-description').value;

      const productData = {
        // Primary fields (used by products page)
        name: productName,
        description: productDescription,
        // Alias fields (used by homepage)
        title: productName,
        shortDescription: productDescription,
        // Other fields
        price: parseFloat(document.getElementById('product-price').value) || 0,
        originalPrice: parseFloat(document.getElementById('product-original-price').value) || null,
        rating: parseFloat(document.getElementById('product-rating').value) || 4.5,
        category: document.getElementById('product-category').value,
        badge: document.getElementById('product-badge').value,
        offerId: document.getElementById('product-offer').value || null,
        image: document.getElementById('product-image').value,
        imageURL: document.getElementById('product-image').value, // Alias for homepage
        appUrl: document.getElementById('product-app-url').value,
        databaseId: document.getElementById('product-database-id').value || null,
        showOnHomepage: document.getElementById('product-show-on-homepage').checked,
        reviews: Math.floor(Math.random() * 400) + 50,
        features: [],
        tags: [document.getElementById('product-category').value],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const productId = document.getElementById('product-id').value;
      const isEditing = productId !== '';

      if (isEditing) {
        // Update existing product
        await setDoc(doc(db, 'products', productId), {
          ...productData,
          id: productId,
          updatedAt: new Date()
        }, { merge: true });
        showAdminToast('Producto actualizado exitosamente', 'success');
      } else {
        // Create new product
        const newProductId = productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await setDoc(doc(db, 'products', newProductId), {
          id: newProductId,
          ...productData
        });
        showAdminToast('Producto creado exitosamente', 'success');
      }

      // Close modal and reload
      const modal = document.getElementById('product-modal');
      modal.classList.add('hidden');
      modal.style.display = 'none';
      document.body.style.overflow = '';
      await renderAdminView();

    } catch (error) {
      console.error('Error saving product:', error);
      showAdminToast('Error al guardar producto: ' + error.message, 'error');

      // Re-enable submit button
      const submitBtn = document.getElementById('submit-product');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Producto';
    }
  });
}

function initializeCategoryForm() {
  const categoryForm = document.getElementById('category-form');

  categoryForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      if (!auth?.currentUser) {
        showAdminToast('Debes iniciar sesión para realizar esta acción', 'error');
        return;
      }

      const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
      if (!userIsAdmin) {
        showAdminToast('No tienes permisos para realizar esta acción.', 'error');
        return;
      }

      const submitBtn = document.getElementById('submit-category');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      const editingId = document.getElementById('category-editing-id').value;
      const isEditing = editingId !== '';

      const categoryId = isEditing ? editingId : document.getElementById('category-id').value;
      const categoryData = {
        id: categoryId,
        name: document.getElementById('category-name').value,
        color: document.getElementById('category-color').value,
        updatedAt: new Date()
      };

      // Solo agregar createdAt si es nuevo
      if (!isEditing) {
        categoryData.createdAt = new Date();
      }

      await setDoc(doc(db, 'categories', categoryId), categoryData, { merge: true });
      showAdminToast(isEditing ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente', 'success');

      document.getElementById('category-modal').classList.add('hidden');
      document.getElementById('category-editing-id').value = '';
      document.getElementById('category-id').disabled = false;

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Categoría';

      await loadCategoriesAndBadges();

    } catch (error) {
      console.error('Error saving category:', error);
      showAdminToast('Error al guardar categoría: ' + error.message, 'error');

      const submitBtn = document.getElementById('submit-category');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Categoría';
    }
  });
}

function initializeBadgeForm() {
  const badgeForm = document.getElementById('badge-form');

  badgeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      if (!auth?.currentUser) {
        showAdminToast('Debes iniciar sesión para realizar esta acción', 'error');
        return;
      }

      const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
      if (!userIsAdmin) {
        showAdminToast('No tienes permisos para realizar esta acción.', 'error');
        return;
      }

      const submitBtn = document.getElementById('submit-badge');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      const editingId = document.getElementById('badge-editing-id').value;
      const isEditing = editingId !== '';

      const badgeId = isEditing ? editingId : document.getElementById('badge-id').value;
      const badgeData = {
        id: badgeId,
        name: document.getElementById('badge-name').value,
        color: document.getElementById('badge-color').value,
        updatedAt: new Date()
      };

      // Solo agregar createdAt si es nuevo
      if (!isEditing) {
        badgeData.createdAt = new Date();
      }

      await setDoc(doc(db, 'badges', badgeId), badgeData, { merge: true });
      showAdminToast(isEditing ? 'Badge actualizado exitosamente' : 'Badge creado exitosamente', 'success');

      document.getElementById('badge-modal').classList.add('hidden');
      document.getElementById('badge-editing-id').value = '';
      document.getElementById('badge-id').disabled = false;

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Badge';

      await loadCategoriesAndBadges();

    } catch (error) {
      console.error('Error saving badge:', error);
      showAdminToast('Error al guardar badge: ' + error.message, 'error');

      const submitBtn = document.getElementById('submit-badge');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Badge';
    }
  });
}

// Global function to edit products - navigate to product form page
window.editProduct = async function (productId) {
  console.log('📝 editProduct called with ID:', productId);
  // Navigate to product form page with productId
  window.location.hash = `#/admin/product/${productId}`;
  return; // Skip the old modal code

  // OLD MODAL CODE (keeping for reference but won't execute)
  try {
    // Get product data
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (!productDoc.exists()) {
      console.error('❌ Product not found:', productId);
      showAdminToast('Producto no encontrado', 'error');
      return;
    }

    const product = productDoc.data();
    console.log('✅ Product loaded:', product);

    // Populate form with product data
    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('product-id').value = productId;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-original-price').value = product.originalPrice || '';
    document.getElementById('product-rating').value = product.rating || 4.5;
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-badge').value = product.badge || '';
    document.getElementById('product-description').value = product.description || '';

    // Apply category and badge colors
    await applySelectColors(product.category, product.badge);
    document.getElementById('product-image').value = product.imageURL || product.image || '';
    document.getElementById('product-app-url').value = product.appUrl || '';
    document.getElementById('product-database-id').value = product.databaseId || '';
    document.getElementById('product-show-on-homepage').checked = product.showOnHomepage || false;

    // Load current questions count if database ID exists
    if (product.databaseId) {
      await loadCurrentQuestionsCount(product.databaseId);
    }

    // Load offers for this product
    const offers = await getOffersFromFirebase();
    const productOffers = offers.filter(offer => offer.productId === productId);
    const offerSelect = document.getElementById('product-offer');
    offerSelect.innerHTML = '<option value="">Sin oferta</option>';
    productOffers.forEach(offer => {
      const discount = offer.discountPrice === 0
        ? 'GRATIS'
        : `$${offer.discountPrice.toFixed(2)} (${Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100)}% OFF)`;
      // Pre-seleccionar si es la oferta activa del producto
      const selected = (product.activeOfferId === offer.id || product.offerId === offer.id) ? 'selected' : '';
      offerSelect.innerHTML += `<option value="${offer.id}" ${selected}>${discount} - ${offer.description || 'Sin descripción'}</option>`;
    });

    // Deshabilitar campos de precio si hay oferta activa
    const priceInput = document.getElementById('product-price');
    const originalPriceInput = document.getElementById('product-original-price');

    if (product.hasActiveOffer) {
      priceInput.disabled = true;
      originalPriceInput.disabled = true;
      priceInput.classList.add('bg-gray-100', 'cursor-not-allowed');
      originalPriceInput.classList.add('bg-gray-100', 'cursor-not-allowed');

      // Agregar mensaje informativo
      const priceContainer = priceInput.parentElement;
      let warningMsg = priceContainer.querySelector('.offer-warning');
      if (!warningMsg) {
        warningMsg = document.createElement('p');
        warningMsg.className = 'offer-warning text-xs text-orange-600 mt-1 font-medium';
        warningMsg.innerHTML = '⚠️ Precio controlado por oferta activa';
        priceContainer.appendChild(warningMsg);
      }
    } else {
      priceInput.disabled = false;
      originalPriceInput.disabled = false;
      priceInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
      originalPriceInput.classList.remove('bg-gray-100', 'cursor-not-allowed');

      // Remover mensaje si existe
      const priceContainer = priceInput.parentElement;
      const warningMsg = priceContainer.querySelector('.offer-warning');
      if (warningMsg) {
        warningMsg.remove();
      }
    }

    // Show modal
    const modal = document.getElementById('product-modal');
    console.log('🎭 Modal element:', modal);
    console.log('🎭 Modal classes before:', modal?.className);
    console.log('🎭 Modal current display:', modal?.style.display);
    console.log('🎭 Modal computed styles:', window.getComputedStyle(modal));

    if (modal) {
      console.log('🎭 BEFORE - Modal parent:', modal.parentElement?.tagName);
      console.log('🎭 BEFORE - Has hidden class:', modal.classList.contains('hidden'));

      // Step 1: Remove the 'hidden' class explicitly
      modal.classList.remove('hidden');
      console.log('🎭 STEP 1 - Removed hidden class');

      // Step 2: Move to body if not already there
      if (modal.parentElement !== document.body) {
        console.log('🎭 STEP 2 - Moving from', modal.parentElement?.tagName, 'to BODY');
        document.body.appendChild(modal);
      }

      // Step 3: Apply flex to make it visible
      modal.style.display = 'flex';
      modal.style.position = 'fixed';
      modal.style.inset = '0';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modal.style.zIndex = '9999';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.overflow = 'auto';

      document.body.style.overflow = 'hidden';

      console.log('🎭 AFTER - offsetWidth:', modal.offsetWidth, 'offsetHeight:', modal.offsetHeight);
      console.log('🎭 AFTER - display:', modal.style.display);
      console.log('✅ Modal should now be visible');
    } else {
      console.error('❌ Modal element not found!');
    }

  } catch (error) {
    console.error('❌ Error loading product for edit:', error);
    showAdminToast('Error al cargar producto para editar', 'error');
  }
};

// Global function to delete products
window.deleteProduct = async function (productId) {
  try {
    // Check if user is authenticated and admin
    if (!auth?.currentUser) {
      showAdminToast('Debes iniciar sesión para realizar esta acción', 'error');
      window.location.hash = '#/auth';
      return;
    }

    const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
    if (!userIsAdmin) {
      showAdminToast('No tienes permisos para eliminar productos. Solo los administradores pueden realizar esta acción.', 'error');
      return;
    }

    const messageHTML = `
      <p class="text-base mb-3">¿Estás seguro de que deseas eliminar este producto?</p>
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <p class="font-semibold text-yellow-800">¡Advertencia!</p>
            <p class="text-yellow-700 text-sm">Esta acción eliminará permanentemente el producto.</p>
          </div>
        </div>
      </div>
      <p class="text-sm text-gray-500 italic">⚠️ Esta acción no se puede deshacer.</p>
    `;

    showCustomConfirm('Eliminar Producto', messageHTML, async () => {
      try {
        await deleteDoc(doc(db, 'products', productId));

        // Show success message
        showAdminToast('Producto eliminado exitosamente', 'success');

        // Reload admin view instead of full page reload
        await renderAdminView();
      } catch (error) {
        console.error('Error eliminando producto:', error);
        showAdminToast('Error al eliminar producto: ' + error.message, 'error');
      }
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    showAdminToast('Error al eliminar producto: ' + error.message, 'error');
  }
};

// Toast notification function for admin panel
function showAdminToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 z-50 transform transition-all duration-300 translate-x-full';

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? `
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
  ` : `
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  `;

  toast.innerHTML = `
    <div class="${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
      ${icon}
      <span class="font-medium">${message}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);

  // Animate out and remove
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Custom confirmation modal
function showCustomConfirm(title, message, onConfirm) {
  const modal = document.getElementById('custom-confirm-modal');
  const titleElement = document.getElementById('confirm-modal-title');
  const messageElement = document.getElementById('confirm-modal-message');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  const deleteBtn = document.getElementById('confirm-delete-btn');

  // Set content
  titleElement.textContent = title;
  messageElement.innerHTML = message;

  // Show modal
  modal.classList.remove('hidden');

  // Handle cancel
  const handleCancel = () => {
    modal.classList.add('hidden');
    cancelBtn.removeEventListener('click', handleCancel);
    deleteBtn.removeEventListener('click', handleConfirm);
  };

  // Handle confirm
  const handleConfirm = () => {
    modal.classList.add('hidden');
    cancelBtn.removeEventListener('click', handleCancel);
    deleteBtn.removeEventListener('click', handleConfirm);
    onConfirm();
  };

  // Add event listeners
  cancelBtn.addEventListener('click', handleCancel);
  deleteBtn.addEventListener('click', handleConfirm);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      handleCancel();
    }
  });
}

// Helper functions for categories and badges
async function getCategoriesFromFirebase() {
  try {
    const categoriesQuery = query(collection(db, 'categories'));
    const querySnapshot = await getDocs(categoriesQuery);
    const categories = [];

    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // If no categories in Firebase, return defaults
    if (categories.length === 0) {
      return [
        { id: 'aviation', name: 'Aviación', color: '#3B82F6' },
        { id: 'development', name: 'Desarrollo', color: '#10B981' },
        { id: 'education', name: 'Educación', color: '#F59E0B' },
        { id: 'ai', name: 'Inteligencia Artificial', color: '#8B5CF6' },
        { id: 'technology', name: 'Tecnología', color: '#EF4444' },
        { id: 'design', name: 'Diseño', color: '#EC4899' },
        { id: 'business', name: 'Negocios', color: '#6B7280' }
      ];
    }

    return categories;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

async function getBadgesFromFirebase() {
  try {
    const badgesQuery = query(collection(db, 'badges'));
    const querySnapshot = await getDocs(badgesQuery);
    const badges = [];

    querySnapshot.forEach((doc) => {
      badges.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // If no badges in Firebase, return defaults
    if (badges.length === 0) {
      return [
        { id: 'New', name: 'Nuevo', color: '#3B82F6' },
        { id: 'Popular', name: 'Popular', color: '#10B981' },
        { id: 'Bestseller', name: 'Bestseller', color: '#F59E0B' },
        { id: 'Premium', name: 'Premium', color: '#8B5CF6' },
        { id: 'Professional', name: 'Professional', color: '#EC4899' },
        { id: 'Enterprise', name: 'Enterprise', color: '#6366F1' }
      ];
    }

    return badges;
  } catch (error) {
    console.error('Error loading badges:', error);
    return [];
  }
}

function loadCategoriesList(categories, products) {
  console.log('📋 Loading categories list. Categories count:', categories.length);
  const categoriesList = document.getElementById('categories-list');
  if (!categoriesList) {
    console.error('❌ categories-list element not found!');
    return;
  }

  if (categories.length === 0) {
    console.warn('⚠️ No categories to display');
    categoriesList.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay categorías creadas aún.</p>';
    return;
  }

  const html = categories.map(category => {
    const productCount = products.filter(p => p.category === category.id).length;

    return `
    <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center flex-1">
          <div class="w-4 h-4 rounded-full mr-2 flex-shrink-0" style="background-color: ${category.color}"></div>
          <h3 class="font-semibold text-gray-900 truncate">${category.name}</h3>
        </div>
        <div class="flex items-center space-x-2">
          <button data-category-id="${category.id}" data-action="edit-category" class="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors" title="Editar categoría">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button data-category-id="${category.id}" data-product-count="${productCount}" data-action="delete-category" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Eliminar categoría">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="space-y-1">
        <p class="text-sm text-gray-600">ID: <span class="font-mono text-xs">${category.id}</span></p>
        <p class="text-sm ${productCount > 0 ? 'text-blue-600' : 'text-gray-500'}">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          ${productCount} ${productCount === 1 ? 'producto' : 'productos'}
        </p>
      </div>
    </div>
  `;
  }).join('');

  categoriesList.innerHTML = html;
  console.log('✅ Categories list rendered with', categories.length, 'items');
}

function loadBadgesList(badges, products) {
  const badgesList = document.getElementById('badges-list');
  if (!badgesList) return;

  badgesList.innerHTML = badges.map(badge => {
    const productCount = products.filter(p => p.badge === badge.id).length;

    return `
    <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center flex-1">
          <span class="px-2 py-1 text-xs font-medium rounded-full mr-2" style="background-color: ${badge.color}20; color: ${badge.color}">${badge.name}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button data-badge-id="${badge.id}" data-action="edit-badge" class="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors" title="Editar badge">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button data-badge-id="${badge.id}" data-product-count="${productCount}" data-action="delete-badge" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Eliminar badge">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="space-y-1">
        <p class="text-sm text-gray-600">ID: <span class="font-mono text-xs">${badge.id}</span></p>
        <p class="text-sm ${productCount > 0 ? 'text-blue-600' : 'text-gray-500'}">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          ${productCount} ${productCount === 1 ? 'producto' : 'productos'}
        </p>
      </div>
    </div>
  `;
  }).join('');
}

// Global function to edit categories
window.editCategory = async function (categoryId) {
  try {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    if (!categoryDoc.exists()) {
      showAdminToast('Categoría no encontrada', 'error');
      return;
    }

    const category = categoryDoc.data();

    // Populate form with category data
    document.getElementById('category-modal-title').textContent = 'Editar Categoría';
    document.getElementById('category-editing-id').value = categoryId;
    document.getElementById('category-id').value = category.id || categoryId;
    document.getElementById('category-id').disabled = true; // No permitir cambiar el ID al editar
    document.getElementById('category-name').value = category.name || '';
    document.getElementById('category-color').value = category.color || '#3B82F6';
    document.getElementById('category-color-picker').value = category.color || '#3B82F6';

    // Show modal
    document.getElementById('category-modal').classList.remove('hidden');

  } catch (error) {
    console.error('Error loading category for edit:', error);
    showAdminToast('Error al cargar categoría para editar', 'error');
  }
};

// Global function to delete categories
window.deleteCategory = async function (categoryId, productCount = 0) {
  try {
    if (!auth?.currentUser) {
      showAdminToast('Debes iniciar sesión para realizar esta acción', 'error');
      window.location.hash = '#/auth';
      return;
    }

    const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
    if (!userIsAdmin) {
      showAdminToast('No tienes permisos para eliminar categorías.', 'error');
      return;
    }

    // Crear mensaje de confirmación con información de productos
    let messageHTML = '<p class="text-base mb-3">¿Estás seguro de que deseas eliminar esta categoría?</p>';
    if (productCount > 0) {
      messageHTML += `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <div>
              <p class="font-semibold text-yellow-800">¡Advertencia!</p>
              <p class="text-yellow-700 text-sm">Esta categoría está siendo usada por <strong>${productCount}</strong> ${productCount === 1 ? 'producto' : 'productos'}.</p>
              <p class="text-yellow-700 text-sm mt-1">Al eliminarla, estos productos quedarán sin categoría asignada.</p>
            </div>
          </div>
        </div>
      `;
    }
    messageHTML += '<p class="text-sm text-gray-500 italic">⚠️ Esta acción no se puede deshacer.</p>';

    showCustomConfirm('Eliminar Categoría', messageHTML, async () => {
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
        showAdminToast('Categoría eliminada exitosamente', 'success');
        await loadCategoriesAndBadges();
      } catch (error) {
        console.error('Error eliminando categoría:', error);
        showAdminToast('Error al eliminar categoría: ' + error.message, 'error');
      }
    });

  } catch (error) {
    console.error('Error en deleteCategory:', error);
    showAdminToast('Error: ' + error.message, 'error');
  }
};

// Global function to edit badges
window.editBadge = async function (badgeId) {
  try {
    const badgeDoc = await getDoc(doc(db, 'badges', badgeId));
    if (!badgeDoc.exists()) {
      showAdminToast('Badge no encontrado', 'error');
      return;
    }

    const badge = badgeDoc.data();

    // Populate form with badge data
    document.getElementById('badge-modal-title').textContent = 'Editar Badge';
    document.getElementById('badge-editing-id').value = badgeId;
    document.getElementById('badge-id').value = badge.id || badgeId;
    document.getElementById('badge-id').disabled = true; // No permitir cambiar el ID al editar
    document.getElementById('badge-name').value = badge.name || '';
    document.getElementById('badge-color').value = badge.color || '#3B82F6';
    document.getElementById('badge-color-picker').value = badge.color || '#3B82F6';

    // Show modal
    document.getElementById('badge-modal').classList.remove('hidden');

  } catch (error) {
    console.error('Error loading badge for edit:', error);
    showAdminToast('Error al cargar badge para editar', 'error');
  }
};

// Global function to delete badges
window.deleteBadge = async function (badgeId, productCount = 0) {
  try {
    if (!auth?.currentUser) {
      showAdminToast('Debes iniciar sesión para realizar esta acción', 'error');
      window.location.hash = '#/auth';
      return;
    }

    const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
    if (!userIsAdmin) {
      showAdminToast('No tienes permisos para eliminar badges.', 'error');
      return;
    }

    // Crear mensaje de confirmación con información de productos
    let messageHTML = '<p class="text-base mb-3">¿Estás seguro de que deseas eliminar este badge?</p>';
    if (productCount > 0) {
      messageHTML += `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <div>
              <p class="font-semibold text-yellow-800">¡Advertencia!</p>
              <p class="text-yellow-700 text-sm">Este badge está siendo usado por <strong>${productCount}</strong> ${productCount === 1 ? 'producto' : 'productos'}.</p>
              <p class="text-yellow-700 text-sm mt-1">Al eliminarlo, estos productos quedarán sin badge asignado.</p>
            </div>
          </div>
        </div>
      `;
    }
    messageHTML += '<p class="text-sm text-gray-500 italic">⚠️ Esta acción no se puede deshacer.</p>';

    showCustomConfirm('Eliminar Badge', messageHTML, async () => {
      try {
        await deleteDoc(doc(db, 'badges', badgeId));
        showAdminToast('Badge eliminado exitosamente', 'success');
        await loadCategoriesAndBadges();
      } catch (error) {
        console.error('Error eliminando badge:', error);
        showAdminToast('Error al eliminar badge: ' + error.message, 'error');
      }
    });

  } catch (error) {
    console.error('Error en deleteBadge:', error);
    showAdminToast('Error: ' + error.message, 'error');
  }
};

// Offers Management Functions
async function getOffersFromFirebase() {
  try {
    const offersQuery = query(collection(db, 'offers'));
    const querySnapshot = await getDocs(offersQuery);
    const offers = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      offers.push({
        id: doc.id,
        ...data
      });
    });

    return offers;
  } catch (error) {
    console.error('Error loading offers:', error);
    return [];
  }
}

function initializeOfferModal() {
  const offerModal = document.getElementById('offer-modal');
  const btnAddOffer = document.getElementById('btn-add-offer');
  const btnCloseOffer = document.getElementById('close-offer-modal');
  const btnCancelOffer = document.getElementById('cancel-offer');
  const setFreeBtn = document.getElementById('set-free-btn');
  const indefiniteCheckbox = document.getElementById('offer-indefinite');
  const endDateInput = document.getElementById('offer-end-date');
  const productSelect = document.getElementById('offer-product');
  const originalPriceInput = document.getElementById('offer-original-price');
  const discountPriceInput = document.getElementById('offer-discount-price');
  const startDateInput = document.getElementById('offer-start-date');

  // Handle "Gratis" button
  setFreeBtn?.addEventListener('click', () => {
    discountPriceInput.value = '0';
  });

  // Handle "Por tiempo indefinido" checkbox
  indefiniteCheckbox?.addEventListener('change', (e) => {
    if (e.target.checked) {
      endDateInput.disabled = true;
      endDateInput.required = false;
      endDateInput.value = '';
      endDateInput.classList.add('bg-gray-100');
    } else {
      endDateInput.disabled = false;
      endDateInput.required = true;
      endDateInput.classList.remove('bg-gray-100');
    }
  });

  // Handle product selection to load price
  productSelect?.addEventListener('change', async (e) => {
    const productId = e.target.value;
    if (!productId) {
      originalPriceInput.value = '';
      return;
    }

    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        const product = productDoc.data();
        originalPriceInput.value = product.price || '';
      }
    } catch (error) {
      console.error('Error loading product price:', error);
    }
  });

  btnAddOffer?.addEventListener('click', async () => {
    document.getElementById('offer-modal-title').textContent = 'Crear Oferta';
    document.getElementById('offer-editing-id').value = '';
    document.getElementById('offer-form').reset();
    document.getElementById('offer-active').checked = true;

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;

    // Load products into select
    const products = await getProductsFromFirebase();
    productSelect.innerHTML = '<option value="">Seleccionar producto</option>';
    products.forEach(product => {
      productSelect.innerHTML += `<option value="${product.id}">${product.name}</option>`;
    });

    // Reset indefinite checkbox
    indefiniteCheckbox.checked = false;
    endDateInput.disabled = false;
    endDateInput.required = true;
    endDateInput.classList.remove('bg-gray-100');

    offerModal.classList.remove('hidden');
  });

  const closeOfferModal = () => {
    offerModal.classList.add('hidden');
    document.getElementById('offer-editing-id').value = '';
  };

  btnCloseOffer?.addEventListener('click', closeOfferModal);
  btnCancelOffer?.addEventListener('click', closeOfferModal);

  offerModal?.addEventListener('click', (e) => {
    if (e.target === offerModal) {
      closeOfferModal();
    }
  });
}

function initializeOfferForm() {
  const offerForm = document.getElementById('offer-form');

  console.log('🔧 initializeOfferForm called, form element:', offerForm);

  if (!offerForm) {
    console.error('❌ FORM NOT FOUND: offer-form element does not exist in DOM');
    return;
  }

  console.log('✅ Form found, attaching submit listener...');

  offerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('🚀 FORM SUBMIT EVENT TRIGGERED');

    try {
      console.log('🔐 Checking auth...');
      if (!auth?.currentUser) {
        showAdminToast('Debes iniciar sesión para realizar esta acción', 'error');
        return;
      }

      const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
      if (!userIsAdmin) {
        showAdminToast('No tienes permisos para realizar esta acción.', 'error');
        return;
      }

      const submitBtn = document.getElementById('submit-offer');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      const editingId = document.getElementById('offer-editing-id').value;
      const isEditing = editingId !== '';

      const isIndefinite = document.getElementById('offer-indefinite').checked;
      const endDateValue = document.getElementById('offer-end-date').value;

      // Si es indefinido, establecer una fecha muy lejana en el futuro (año 2099)
      const endDate = isIndefinite
        ? new Date('2099-12-31')
        : new Date(endDateValue);

      const offerData = {
        productId: document.getElementById('offer-product').value,
        originalPrice: parseFloat(document.getElementById('offer-original-price').value),
        discountPrice: parseFloat(document.getElementById('offer-discount-price').value),
        startDate: new Date(document.getElementById('offer-start-date').value),
        endDate: endDate,
        indefinite: isIndefinite,
        description: document.getElementById('offer-description').value || '',
        active: document.getElementById('offer-active').checked,
        updatedAt: new Date()
      };

      if (!isEditing) {
        offerData.createdAt = new Date();
      }

      const offerId = isEditing ? editingId : `offer-${Date.now()}`;

      console.log('💾 Guardando oferta en Firebase...', { offerId, offerData });
      await setDoc(doc(db, 'offers', offerId), offerData, { merge: true });
      console.log('✅ Oferta guardada en Firebase exitosamente');

      // Actualizar el precio del producto según el estado de la oferta
      const productRef = doc(db, 'products', offerData.productId);

      console.log('💰 Oferta guardada, actualizando precio del producto:', {
        productId: offerData.productId,
        active: offerData.active,
        originalPrice: offerData.originalPrice,
        discountPrice: offerData.discountPrice,
        startDate: offerData.startDate,
        endDate: offerData.endDate
      });

      if (offerData.active) {
        const now = new Date();
        const isInDateRange = offerData.startDate <= now && offerData.endDate >= now;

        console.log('📅 Verificando rango de fechas:', {
          now: now.toISOString(),
          startDate: offerData.startDate.toISOString(),
          endDate: offerData.endDate.toISOString(),
          isInDateRange
        });

        if (isInDateRange) {
          console.log('✅ Oferta dentro de rango, actualizando producto...');
          // Actualizar el producto con el precio de oferta
          await updateDoc(productRef, {
            price: offerData.discountPrice,
            originalPrice: offerData.originalPrice,
            activeOfferId: offerId,
            hasActiveOffer: true,
            updatedAt: new Date()
          });
          console.log('✅ Producto actualizado con precio de oferta:', offerData.discountPrice);
        } else {
          console.warn('⚠️ Oferta fuera de rango de fechas, NO se actualizará el precio');
        }
      } else {
        console.log('❌ Oferta inactiva, restaurando precio original...');
        // Si la oferta se desactiva, restaurar el precio original
        await updateDoc(productRef, {
          price: offerData.originalPrice,
          originalPrice: null,
          activeOfferId: null,
          hasActiveOffer: false,
          updatedAt: new Date()
        });
        console.log('✅ Precio restaurado a:', offerData.originalPrice);
      }

      // Cerrar modal
      document.getElementById('offer-modal').classList.add('hidden');
      document.getElementById('offer-editing-id').value = '';

      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Oferta';

      showAdminToast(isEditing ? 'Oferta actualizada, recargando productos...' : 'Oferta creada, recargando productos...', 'success');

      // Esperar un momento para que Firebase se actualice completamente
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recargar solo la vista del admin sin recargar toda la página
      console.log('🔄 Recargando vista del panel de administración...');
      await renderAdminView();

      // Cambiar a la pestaña de ofertas después de recargar
      setTimeout(() => {
        const offersTab = document.getElementById('tab-offers');
        if (offersTab) offersTab.click();
      }, 100);

    } catch (error) {
      console.error('Error saving offer:', error);
      showAdminToast('Error al guardar oferta: ' + error.message, 'error');

      const submitBtn = document.getElementById('submit-offer');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Oferta';
    }
  });
}

async function loadOffers() {
  try {
    const offers = await getOffersFromFirebase();
    const products = await getProductsFromFirebase();
    const offersList = document.getElementById('offers-list');

    if (!offersList) return;

    if (offers.length === 0) {
      offersList.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay ofertas creadas aún.</p>';
      return;
    }

    offersList.innerHTML = offers.map(offer => {
      const product = products.find(p => p.id === offer.productId);
      const discount = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);
      const isActive = offer.active && new Date() >= offer.startDate.toDate() && new Date() <= offer.endDate.toDate();

      return `
      <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900">${product?.name || 'Producto no encontrado'}</h3>
            <span class="inline-block px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} mt-1">
              ${isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <button data-offer-id="${offer.id}" data-action="edit-offer" class="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors" title="Editar oferta">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button data-offer-id="${offer.id}" data-action="delete-offer" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Eliminar oferta">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex items-baseline space-x-2">
            <span class="text-2xl font-bold text-[#22a7d0]">$${offer.discountPrice.toFixed(2)}</span>
            <span class="text-sm text-gray-500 line-through">$${offer.originalPrice.toFixed(2)}</span>
            <span class="text-sm font-medium text-green-600">${discount}% OFF</span>
          </div>
          <p class="text-xs text-gray-600">
            ${offer.startDate.toDate().toLocaleDateString()} - ${offer.endDate.toDate().toLocaleDateString()}
          </p>
          ${offer.description ? `<p class="text-sm text-gray-600">${offer.description}</p>` : ''}
        </div>
      </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading offers:', error);
  }
}

window.editOffer = async function (offerId) {
  try {
    const offerDoc = await getDoc(doc(db, 'offers', offerId));
    if (!offerDoc.exists()) {
      showAdminToast('Oferta no encontrada', 'error');
      return;
    }

    const offer = offerDoc.data();

    // Load products
    const products = await getProductsFromFirebase();
    const productSelect = document.getElementById('offer-product');
    productSelect.innerHTML = '<option value="">Seleccionar producto</option>';
    products.forEach(product => {
      productSelect.innerHTML += `<option value="${product.id}" ${product.id === offer.productId ? 'selected' : ''}>${product.name}</option>`;
    });

    document.getElementById('offer-modal-title').textContent = 'Editar Oferta';
    document.getElementById('offer-editing-id').value = offerId;
    document.getElementById('offer-original-price').value = offer.originalPrice;
    document.getElementById('offer-discount-price').value = offer.discountPrice;
    document.getElementById('offer-start-date').value = offer.startDate.toDate().toISOString().split('T')[0];
    document.getElementById('offer-end-date').value = offer.endDate.toDate().toISOString().split('T')[0];
    document.getElementById('offer-description').value = offer.description || '';
    document.getElementById('offer-active').checked = offer.active;

    document.getElementById('offer-modal').classList.remove('hidden');

  } catch (error) {
    console.error('Error loading offer for edit:', error);
    showAdminToast('Error al cargar oferta para editar', 'error');
  }
};

window.deleteOffer = async function (offerId) {
  try {
    if (!auth?.currentUser) {
      showAdminToast('Debes iniciar sesión para realizar esta acción', 'error');
      window.location.hash = '#/auth';
      return;
    }

    const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
    if (!userIsAdmin) {
      showAdminToast('No tienes permisos para eliminar ofertas.', 'error');
      return;
    }

    const messageHTML = `
      <p class="text-base mb-3">¿Estás seguro de que deseas eliminar esta oferta?</p>
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <p class="font-semibold text-yellow-800">¡Advertencia!</p>
            <p class="text-yellow-700 text-sm">Esta oferta será eliminada permanentemente.</p>
          </div>
        </div>
      </div>
      <p class="text-sm text-gray-500 italic">⚠️ Esta acción no se puede deshacer.</p>
    `;

    showCustomConfirm('Eliminar Oferta', messageHTML, async () => {
      try {
        // Obtener datos de la oferta antes de eliminarla
        const offerDoc = await getDoc(doc(db, 'offers', offerId));
        if (offerDoc.exists()) {
          const offer = offerDoc.data();

          // Restaurar precio original del producto
          const productRef = doc(db, 'products', offer.productId);
          await updateDoc(productRef, {
            price: offer.originalPrice,
            originalPrice: null,
            activeOfferId: null,
            hasActiveOffer: false,
            updatedAt: new Date()
          });
        }

        await deleteDoc(doc(db, 'offers', offerId));
        showAdminToast('Oferta eliminada, recargando productos...', 'success');

        // Esperar para que Firebase se actualice
        await new Promise(resolve => setTimeout(resolve, 500));

        // Recargar solo la vista del admin sin recargar toda la página
        await renderAdminView();

        // Cambiar a la pestaña de ofertas después de recargar
        setTimeout(() => {
          const offersTab = document.getElementById('tab-offers');
          if (offersTab) offersTab.click();
        }, 100);
      } catch (error) {
        console.error('Error eliminando oferta:', error);
        showAdminToast('Error al eliminar oferta: ' + error.message, 'error');
      }
    });

  } catch (error) {
    console.error('Error en deleteOffer:', error);
    showAdminToast('Error: ' + error.message, 'error');
  }
};

// ============================================
// QUESTIONS MANAGEMENT FUNCTIONS
// ============================================

let processedQuestionsData = null;

// Process questions JSON
async function processQuestionsJSON() {
  const jsonTextarea = document.getElementById('product-questions-json');
  const validationMessage = document.getElementById('json-validation-message');
  const detectedCount = document.getElementById('detected-questions-count');
  const insertBtn = document.getElementById('btn-insert-questions');
  const processBtn = document.getElementById('btn-process-questions');

  try {
    processBtn.disabled = true;
    processBtn.textContent = 'Procesando...';

    const jsonText = jsonTextarea.value.trim();

    if (!jsonText) {
      throw new Error('El campo de JSON está vacío');
    }

    // Parse JSON
    const questions = JSON.parse(jsonText);

    if (!Array.isArray(questions)) {
      throw new Error('El JSON debe ser un array de preguntas');
    }

    if (questions.length === 0) {
      throw new Error('El array de preguntas está vacío');
    }

    // Validate each question
    const errors = [];
    questions.forEach((q, index) => {
      if (!q.question || typeof q.question !== 'string') {
        errors.push(`Pregunta ${index + 1}: falta el campo 'question' o no es texto`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Pregunta ${index + 1}: 'options' debe ser un array con al menos 2 opciones`);
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= (q.options?.length || 0)) {
        errors.push(`Pregunta ${index + 1}: 'correctAnswer' debe ser un índice válido de options`);
      }
      if (!q.topic || typeof q.topic !== 'string') {
        errors.push(`Pregunta ${index + 1}: falta el campo 'topic' o no es texto`);
      }
    });

    if (errors.length > 0) {
      throw new Error('Errores de validación:\n' + errors.join('\n'));
    }

    // All valid!
    processedQuestionsData = questions;
    detectedCount.textContent = questions.length;

    validationMessage.className = 'bg-green-50 border border-green-200 rounded-lg p-4 mb-3';
    validationMessage.innerHTML = `
      <div class="flex items-start">
        <svg class="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <div class="text-sm text-green-800">
          <p class="font-medium mb-1">✅ JSON válido</p>
          <p class="text-xs">Se detectaron ${questions.length} preguntas correctamente formateadas</p>
          <div class="mt-2 text-xs bg-green-100 rounded p-2">
            <p><strong>Temas detectados:</strong> ${[...new Set(questions.map(q => q.topic))].join(', ')}</p>
          </div>
        </div>
      </div>
    `;
    validationMessage.classList.remove('hidden');

    // Enable insert button
    insertBtn.disabled = false;
    insertBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    insertBtn.classList.add('hover:bg-green-700');

    showAdminToast(`✅ ${questions.length} preguntas procesadas correctamente`, 'success');

  } catch (error) {
    processedQuestionsData = null;
    detectedCount.textContent = '0';

    validationMessage.className = 'bg-red-50 border border-red-200 rounded-lg p-4 mb-3';
    validationMessage.innerHTML = `
      <div class="flex items-start">
        <svg class="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <div class="text-sm text-red-800">
          <p class="font-medium mb-1">❌ Error en el JSON</p>
          <p class="text-xs whitespace-pre-wrap">${error.message}</p>
        </div>
      </div>
    `;
    validationMessage.classList.remove('hidden');

    // Disable insert button
    insertBtn.disabled = true;
    insertBtn.classList.add('opacity-50', 'cursor-not-allowed');
    insertBtn.classList.remove('hover:bg-green-700');

    showAdminToast('Error procesando JSON: ' + error.message, 'error');
  } finally {
    processBtn.disabled = false;
    processBtn.textContent = 'Procesar JSON';
  }
}

// Insert questions to Firebase
async function insertQuestionsToFirebase() {
  if (!processedQuestionsData) {
    showAdminToast('Primero debes procesar el JSON de preguntas', 'error');
    return;
  }

  const databaseId = document.getElementById('product-database-id').value.trim();

  if (!databaseId) {
    showAdminToast('Debes especificar un ID de base de datos para el producto', 'error');
    return;
  }

  const insertBtn = document.getElementById('btn-insert-questions');

  try {
    insertBtn.disabled = true;
    insertBtn.textContent = 'Insertando...';

    // Check if collection exists and count current questions
    const questionsRef = collection(db, databaseId);
    const snapshot = await getDocs(questionsRef);
    const currentCount = snapshot.size;

    // Insert all questions
    const insertPromises = processedQuestionsData.map(question =>
      addDoc(questionsRef, {
        ...question,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );

    await Promise.all(insertPromises);

    // Update current questions count
    const newSnapshot = await getDocs(questionsRef);
    document.getElementById('current-questions-count').textContent = newSnapshot.size;

    showAdminToast(
      `✅ ${processedQuestionsData.length} preguntas insertadas exitosamente. Total: ${newSnapshot.size}`,
      'success'
    );

    // Clear textarea and reset
    document.getElementById('product-questions-json').value = '';
    document.getElementById('detected-questions-count').textContent = '-';
    document.getElementById('json-validation-message').classList.add('hidden');
    processedQuestionsData = null;

    insertBtn.disabled = true;
    insertBtn.classList.add('opacity-50', 'cursor-not-allowed');

  } catch (error) {
    console.error('Error insertando preguntas:', error);
    showAdminToast('Error al insertar preguntas: ' + error.message, 'error');
  } finally {
    insertBtn.disabled = false;
    insertBtn.textContent = 'Insertar a Firebase';
  }
}

// Load current questions count
async function loadCurrentQuestionsCount(databaseId) {
  if (!databaseId) {
    document.getElementById('current-questions-count').textContent = '-';
    return;
  }

  try {
    const questionsRef = collection(db, databaseId);
    const snapshot = await getDocs(questionsRef);
    document.getElementById('current-questions-count').textContent = snapshot.size;
  } catch (error) {
    console.error('Error cargando conteo de preguntas:', error);
    document.getElementById('current-questions-count').textContent = 'Error';
  }
}

// Initialize questions management
function initializeQuestionsManagement() {
  const processBtn = document.getElementById('btn-process-questions');
  const insertBtn = document.getElementById('btn-insert-questions');
  const databaseIdInput = document.getElementById('product-database-id');

  processBtn?.addEventListener('click', processQuestionsJSON);
  insertBtn?.addEventListener('click', insertQuestionsToFirebase);

  // Load current questions count when database ID changes
  databaseIdInput?.addEventListener('blur', (e) => {
    loadCurrentQuestionsCount(e.target.value.trim());
  });
}

// Setup admin user in Firebase
async function setupAdminUser() {
  const btn = document.getElementById('setup-admin-btn');
  const originalText = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '⏳ Configurando...';

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    // Create/update user document in Firebase with admin privileges
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);

    const userData = {
      email: currentUser.email,
      role: 'admin',
      isAdmin: true,
      name: currentUser.displayName || currentUser.email.split('@')[0],
      updatedAt: serverTimestamp()
    };

    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userRef, userData);
      showAdminToast('✓ Usuario actualizado como administrador', 'success');
    } else {
      // Create new user document
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp()
      });
      showAdminToast('✓ Usuario administrador creado exitosamente', 'success');
    }

    // Show success message with instructions
    setTimeout(() => {
      showAdminToast('Ahora puedes acceder a todas las funciones de administración. Recarga la página si es necesario.', 'info');
    }, 2000);

    btn.innerHTML = '✓ Configurado';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 3000);

  } catch (error) {
    console.error('Error setting up admin:', error);
    showAdminToast('Error: ' + error.message, 'error');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Note: User management has been moved to a dedicated page at #/admin/users
// See src/pages/admin-users/view.js for the full user management interface


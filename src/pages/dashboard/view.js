import { auth } from '../../js/firebase.js';
import { verifyUserAppAccess, getProductsFromFirebase } from '../../js/userProfile.js';

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

  // Get product information
  let product = null;
  try {
    const products = await getProductsFromFirebase();
    product = products.find(p => p.id === productId);

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

  spaRoot.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <!-- Header con botón de regreso -->
      <div class="relative z-10 p-6">
        <button id="back-to-products" class="inline-flex items-center px-4 py-2 bg-[#22a7d0] text-white rounded-lg hover:bg-[#1e96bc] transition-all duration-300 shadow-lg">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Volver a Productos
        </button>
      </div>

      <!-- Contenido principal del dashboard -->
      <div class="relative z-10 px-6 pb-20">
        <div class="max-w-6xl mx-auto">
          <!-- Hero Section -->
          <div class="text-center mb-12">
            <div class="inline-block p-4 bg-white rounded-2xl shadow-2xl mb-6">
              <img src="${product.image}" alt="${product.name}" class="w-24 h-24 object-cover rounded-xl">
            </div>

            <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
              ¡Bienvenido a ${product.name}!
            </h1>

            <p class="text-xl text-gray-300 mb-2">
              ${product.description}
            </p>

            <div class="text-gray-400 text-sm">
              Acceso adquirido el ${formattedDate}
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="grid md:grid-cols-3 gap-6 mb-12">
            <div class="bg-white rounded-xl p-6 text-center shadow-lg">
              <div class="text-3xl font-bold text-[#22a7d0] mb-2">0%</div>
              <div class="text-gray-600">Progreso Completado</div>
            </div>

            <div class="bg-white rounded-xl p-6 text-center shadow-lg">
              <div class="text-3xl font-bold text-[#22a7d0] mb-2">0</div>
              <div class="text-gray-600">Preguntas Respondidas</div>
            </div>

            <div class="bg-white rounded-xl p-6 text-center shadow-lg">
              <div class="text-3xl font-bold text-[#22a7d0] mb-2">--</div>
              <div class="text-gray-600">Mejor Puntuación</div>
            </div>
          </div>

          <!-- Main Action Card -->
          <div class="bg-white rounded-2xl p-8 text-center mb-8 shadow-xl">
            <div class="w-16 h-16 bg-[#22a7d0] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>

            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              Comienza tu Entrenamiento
            </h2>

            <p class="text-gray-600 mb-8 max-w-2xl mx-auto">
              Accede a tu guía interactiva de entrenamiento con preguntas y respuestas detalladas.
              Practica con escenarios reales y obtén tu certificación.
            </p>

            <button id="start-training" class="bg-[#22a7d0] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#1e96bc] transition-all duration-300 shadow-lg transform hover:scale-105">
              <svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Iniciar Guía Interactiva
            </button>
          </div>

          <!-- Product Features -->
          <div class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">
              Características del Entrenamiento
            </h3>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${product.detailedFeatures?.slice(0, 6).map(feature => {
                const iconMap = {
                  'radio': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>',
                  'map': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>',
                  'cloud': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>',
                  'warning': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>',
                  'certificate': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>',
                  'lightning': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>'
                };

                const iconPath = iconMap[feature.icon] || '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

                return `
                  <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="flex-shrink-0">
                      <div class="w-10 h-10 bg-[#22a7d0] rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          ${iconPath}
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 mb-1">${feature.title}</h4>
                      <p class="text-gray-600 text-sm">${feature.description}</p>
                    </div>
                  </div>
                `;
              }).join('') || '<p class="text-gray-600 text-center">Características en desarrollo...</p>'}
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
              <div class="w-12 h-12 bg-[#22a7d0] rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">Recursos Adicionales</h4>
              <p class="text-gray-600 text-sm">Documentación y materiales de apoyo</p>
            </div>

            <div class="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
              <div class="w-12 h-12 bg-[#22a7d0] rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">Configuración</h4>
              <p class="text-gray-600 text-sm">Personaliza tu experiencia de estudio</p>
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
      // TODO: Navigate to guide page when implemented
      window.location.hash = `#/guide/${productId}`;
    });
  }
}
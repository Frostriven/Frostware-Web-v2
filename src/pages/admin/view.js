import { getProductsFromFirebase, initializeProductsInFirebase, isUserAdmin, isAdminEmail } from '../../js/userProfile.js';
import { auth, db } from '../../js/firebase.js';
import { doc, setDoc, deleteDoc, collection, addDoc, getDoc, getDocs, query } from 'firebase/firestore';

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

    root.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <div class="bg-white shadow-sm border-b">
          <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
              <h1 class="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <div class="flex items-center gap-4">
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

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Oferta (inicio)</label>
                        <input type="datetime-local" id="offer-start" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Oferta (fin)</label>
                        <input type="datetime-local" id="offer-end" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                      </div>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200" id="products-table-body">
                    ${products.map(product => `
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <img src="${product.image || 'https://placehold.co/40x40/1a202c/FFFFFF?text=' + encodeURIComponent(product.name.charAt(0))}"
                                 alt="${product.name}" class="w-10 h-10 rounded-lg object-cover">
                            <div class="ml-4">
                              <div class="text-sm font-medium text-gray-900">${product.name}</div>
                              <div class="text-sm text-gray-500">${product.description.substring(0, 50)}...</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            ${product.category}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          $${product.price || 99}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          ${product.badge ? `
                            <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              ${product.badge}
                            </span>
                          ` : '-'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onclick="editProduct('${product.id}')"
                                  class="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 px-3 py-1 rounded transition-colors">
                            Editar
                          </button>
                          <button onclick="deleteProduct('${product.id}')"
                                  class="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    `).join('')}
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

              <div id="offers-list">
                <!-- Offers will be loaded here -->
              </div>
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
  // Initialize tabs
  initializeTabs();

  // Initialize modals
  initializeModals();

  // Load dynamic data
  loadCategoriesAndBadges();

  // Initialize product form
  initializeProductForm();
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
  const modal = document.getElementById('product-modal');
  const btnAdd = document.getElementById('btn-add-product');
  const btnClose = document.getElementById('close-modal');
  const btnCancel = document.getElementById('cancel-product');

  // Open modal for adding product
  btnAdd?.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Agregar Producto';
    document.getElementById('product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('product-rating').value = '4.5';
    modal.classList.remove('hidden');
  });

  // Close modal
  const closeModal = () => {
    modal.classList.add('hidden');
  };

  btnClose?.addEventListener('click', closeModal);
  btnCancel?.addEventListener('click', closeModal);

  // Close modal when clicking outside
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

async function loadCategoriesAndBadges() {
  try {
    // Load categories from Firebase or use defaults
    const categories = await getCategoriesFromFirebase();
    const badges = await getBadgesFromFirebase();

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

    // Load categories list
    loadCategoriesList(categories);
    loadBadgesList(badges);

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
      const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value) || 0,
        originalPrice: parseFloat(document.getElementById('product-original-price').value) || null,
        rating: parseFloat(document.getElementById('product-rating').value) || 4.5,
        category: document.getElementById('product-category').value,
        badge: document.getElementById('product-badge').value,
        description: document.getElementById('product-description').value,
        image: document.getElementById('product-image').value,
        appUrl: document.getElementById('product-app-url').value,
        offerStart: document.getElementById('offer-start').value ? new Date(document.getElementById('offer-start').value) : null,
        offerEnd: document.getElementById('offer-end').value ? new Date(document.getElementById('offer-end').value) : null,
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
      document.getElementById('product-modal').classList.add('hidden');
      await renderAdminView();

    } catch (error) {
      console.error('Error saving product:', error);
      showAdminToast('Error al guardar producto: ' + error.message, 'error');

      // Re-enable submit button
      const submitBtn = document.getElementById('submit-product');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Global function to edit products
window.editProduct = async function(productId) {
  try {
    // Get product data
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (!productDoc.exists()) {
      showAdminToast('Producto no encontrado', 'error');
      return;
    }

    const product = productDoc.data();

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
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-app-url').value = product.appUrl || '';

    // Handle dates
    if (product.offerStart) {
      const offerStart = product.offerStart.toDate ? product.offerStart.toDate() : new Date(product.offerStart);
      document.getElementById('offer-start').value = offerStart.toISOString().slice(0, 16);
    }
    if (product.offerEnd) {
      const offerEnd = product.offerEnd.toDate ? product.offerEnd.toDate() : new Date(product.offerEnd);
      document.getElementById('offer-end').value = offerEnd.toISOString().slice(0, 16);
    }

    // Show modal
    document.getElementById('product-modal').classList.remove('hidden');

  } catch (error) {
    console.error('Error loading product for edit:', error);
    showAdminToast('Error al cargar producto para editar', 'error');
  }
};

// Global function to delete products
window.deleteProduct = async function(productId) {
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

    const confirmed = confirm('¿Estás seguro de que deseas eliminar este producto?');
    if (!confirmed) return;

    await deleteDoc(doc(db, 'products', productId));

    // Show success message
    showAdminToast('Producto eliminado exitosamente', 'success');

    // Reload admin view instead of full page reload
    await renderAdminView();

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

function loadCategoriesList(categories) {
  const categoriesList = document.getElementById('categories-list');
  if (!categoriesList) return;

  categoriesList.innerHTML = categories.map(category => `
    <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${category.color}"></div>
          <h3 class="font-semibold text-gray-900">${category.name}</h3>
        </div>
        <button onclick="deleteCategory('${category.id}')" class="text-red-500 hover:text-red-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
      <p class="text-sm text-gray-600">ID: ${category.id}</p>
    </div>
  `).join('');
}

function loadBadgesList(badges) {
  const badgesList = document.getElementById('badges-list');
  if (!badgesList) return;

  badgesList.innerHTML = badges.map(badge => `
    <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <span class="px-2 py-1 text-xs font-medium rounded-full mr-2" style="background-color: ${badge.color}20; color: ${badge.color}">${badge.name}</span>
        </div>
        <button onclick="deleteBadge('${badge.id}')" class="text-red-500 hover:text-red-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
      <p class="text-sm text-gray-600">ID: ${badge.id}</p>
    </div>
  `).join('');
}
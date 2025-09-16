import { getProductsFromFirebase, initializeProductsInFirebase, isUserAdmin, isAdminEmail } from '../../js/userProfile.js';
import { auth, db } from '../../js/firebase.js';
import { doc, setDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';

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

          <!-- Add Product Form -->
          <div class="bg-white rounded-lg shadow-sm p-6 border mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-6">Agregar Nuevo Producto</h2>
            <form id="add-product-form" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto</label>
                  <input type="text" id="product-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Precio ($)</label>
                  <input type="number" id="product-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select id="product-category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]" required>
                    <option value="">Seleccionar categoría</option>
                    <option value="aviation">Aviación</option>
                    <option value="development">Desarrollo</option>
                    <option value="education">Educación</option>
                    <option value="ai">Inteligencia Artificial</option>
                    <option value="technology">Tecnología</option>
                    <option value="design">Diseño</option>
                    <option value="business">Negocios</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Badge</label>
                  <select id="product-badge" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#22a7d0] focus:border-[#22a7d0]">
                    <option value="">Sin badge</option>
                    <option value="New">Nuevo</option>
                    <option value="Popular">Popular</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Premium">Premium</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
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

              <div class="flex justify-end">
                <button type="submit" class="bg-[#22a7d0] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  Agregar Producto
                </button>
              </div>
            </form>
          </div>

          <!-- Products List -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-xl font-bold text-gray-900">Productos Existentes</h2>
            </div>
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
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
  const addProductForm = document.getElementById('add-product-form');

  addProductForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
      name: document.getElementById('product-name').value,
      price: parseInt(document.getElementById('product-price').value),
      category: document.getElementById('product-category').value,
      badge: document.getElementById('product-badge').value,
      description: document.getElementById('product-description').value,
      image: document.getElementById('product-image').value,
      rating: 4.5,
      reviews: 0,
      features: [],
      tags: [document.getElementById('product-category').value]
    };

    try {
      // Check if user is authenticated and admin
      if (!auth?.currentUser) {
        alert('Debes iniciar sesión para realizar esta acción');
        return;
      }

      const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
      if (!userIsAdmin) {
        alert('No tienes permisos para agregar productos. Solo los administradores pueden realizar esta acción.');
        return;
      }

      const submitBtn = addProductForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Agregando...';

      // Add to Firebase
      const productId = productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await setDoc(doc(db, 'products', productId), {
        id: productId,
        ...productData
      });

      // Reset form
      addProductForm.reset();

      // Reload page to show new product
      window.location.reload();

    } catch (error) {
      console.error('Error agregando producto:', error);
      alert('Error al agregar producto: ' + error.message);

      // Re-enable submit button
      const submitBtn = addProductForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Agregar Producto';
    }
  });
}

// Global function to delete products
window.deleteProduct = async function(productId) {
  try {
    // Check if user is authenticated and admin
    if (!auth?.currentUser) {
      alert('Debes iniciar sesión para realizar esta acción');
      window.location.hash = '#/auth';
      return;
    }

    const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
    if (!userIsAdmin) {
      alert('No tienes permisos para eliminar productos. Solo los administradores pueden realizar esta acción.');
      return;
    }

    const confirmed = confirm('¿Estás seguro de que deseas eliminar este producto?');
    if (!confirmed) return;

    await deleteDoc(doc(db, 'products', productId));

    // Reload page
    window.location.reload();

  } catch (error) {
    console.error('Error eliminando producto:', error);
    alert('Error al eliminar producto: ' + error.message);
  }
};
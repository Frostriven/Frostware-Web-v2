// Products page functionality

// Import Firebase functions to load products
import { getProductsFromFirebase } from '../src/js/userProfile.js';

// Global variables
let products = [];
let filteredProducts = [];
let currentCategory = 'all';

// Badge color classes
const badgeClasses = {
  blue: 'bg-blue-100 text-blue-800',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  cyan: 'bg-cyan-100 text-cyan-800'
};

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Load products from Firebase
    products = await getProductsFromFirebase();
    filteredProducts = [...products];

    // Render and setup
    renderProducts();
    setupEventListeners();
    updateTotalCount();
  } catch (error) {
    console.error('Error loading products:', error);
    // Show error message to user
    const grid = document.getElementById('products-grid');
    if (grid) {
      grid.innerHTML = '<p class="col-span-full text-center text-red-500">Error al cargar productos. Por favor, intenta de nuevo más tarde.</p>';
    }
  }
});

function setupEventListeners() {
  // Category filters
  document.querySelectorAll('.category-filter').forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('active');
      });

      // Add active class to clicked button
      this.classList.add('active');

      currentCategory = this.dataset.category;
      filterProducts();
    });
  });

  // Search functionality
  const searchInput = document.getElementById('search-products');
  searchInput.addEventListener('input', function() {
    filterProducts();
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('product-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
}

function filterProducts() {
  const searchTerm = document.getElementById('search-products').value.toLowerCase();

  filteredProducts = products.filter(product => {
    const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
    const matchesSearch = searchTerm === '' ||
                         product.name.toLowerCase().includes(searchTerm) ||
                         product.description.toLowerCase().includes(searchTerm) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm));

    return matchesCategory && matchesSearch;
  });

  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const noResults = document.getElementById('no-results');

  if (filteredProducts.length === 0) {
    grid.innerHTML = '';
    if (noResults) noResults.classList.remove('hidden');
    return;
  }

  if (noResults) noResults.classList.add('hidden');

  grid.innerHTML = filteredProducts.map(product => {
    // Get product name and description using Firebase field names
    const productName = typeof product.title === 'object'
      ? (product.title.es || product.title.en || 'Sin nombre')
      : product.title;

    const productDescription = typeof product.shortDescription === 'object'
      ? (product.shortDescription.es || product.shortDescription.en || 'Sin descripción')
      : product.shortDescription;

    return `
    <div class="product-card bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden cursor-pointer"
         onclick="openProductModal('${product.id}')">
      <div class="relative">
        <img src="${product.imageURL}" alt="${productName}" class="w-full h-48 object-cover">

        <!-- Badge -->
        <div class="absolute top-3 left-3">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${badgeClasses[product.badgeColor]}">
            ${product.badge}
          </span>
        </div>

        <!-- Colors indicator -->
        <div class="absolute top-3 right-3 flex space-x-1">
          ${product.detailGradientColors ? product.detailGradientColors.map(color => `
            <div class="color-indicator" style="background-color: ${color}"></div>
          `).join('') : ''}
        </div>

        <!-- Discount badge -->
        ${product.originalPrice > product.price ? `
          <div class="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            -${Math.round((1 - product.price / product.originalPrice) * 100)}%
          </div>
        ` : ''}
      </div>

      <div class="p-6">
        <h3 class="text-xl font-bold mb-2 text-gray-900">${productName}</h3>

        <!-- Rating -->
        <div class="flex items-center mb-3">
          <div class="flex text-yellow-400">
            ${generateStars(product.rating || 4.5)}
          </div>
          <span class="text-sm text-gray-600 ml-2">${product.rating || 4.5} (${product.reviews || 0} reviews)</span>
        </div>

        <p class="text-gray-600 mb-4 text-sm line-clamp-3">${productDescription}</p>

        <!-- Features -->
        <div class="mb-4">
          <div class="flex flex-wrap gap-1">
            ${product.features ? product.features.slice(0, 2).map(feature => `
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">${feature}</span>
            `).join('') : ''}
            ${product.features && product.features.length > 2 ? `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">+${product.features.length - 2} más</span>` : ''}
          </div>
        </div>

        <!-- Price and button -->
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <span class="text-2xl font-bold text-gray-900">$${product.price}</span>
            ${product.originalPrice > product.price ? `
              <span class="text-lg text-gray-500 line-through">$${product.originalPrice}</span>
            ` : ''}
          </div>
          <button class="bg-[#22a7d0] text-white px-4 py-2 rounded-lg hover:bg-[#1a8db3] transition-colors font-medium"
                  onclick="event.stopPropagation(); addToCart('${product.id}')">
            Comprar
          </button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let stars = '';

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars += '<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
  }

  // Half star
  if (hasHalfStar) {
    stars += '<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="#e5e7eb"/></linearGradient></defs><path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars += '<svg class="h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
  }

  return stars;
}

function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const modalContent = document.getElementById('modal-content');

  // Get localized content using Firebase field names
  const productName = typeof product.title === 'object'
    ? (product.title.es || product.title.en || 'Sin nombre')
    : product.title;

  const productDescription = typeof product.shortDescription === 'object'
    ? (product.shortDescription.es || product.shortDescription.en || 'Sin descripción')
    : product.shortDescription;

  const productLongDescription = typeof product.longDescription === 'object'
    ? (product.longDescription.es || product.longDescription.en || productDescription)
    : (product.longDescription || productDescription);

  modalContent.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
      <!-- Product Image -->
      <div class="space-y-4">
        <img src="${product.imageURL}" alt="${productName}" class="w-full rounded-lg">

        <!-- Color options -->
        ${product.detailGradientColors ? `
          <div class="flex space-x-3">
            ${product.detailGradientColors.map((color, index) => `
              <div class="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                   style="background-color: ${color}"
                   title="Color ${index + 1}"></div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Product Details -->
      <div class="space-y-6">
        <!-- Header -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            ${product.badge ? `
              <span class="px-3 py-1 rounded-full text-sm font-medium ${badgeClasses[product.badgeColor] || 'bg-blue-100 text-blue-800'}">
                ${product.badge}
              </span>
            ` : ''}
            <span class="text-sm text-gray-500">${product.category}</span>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">${productName}</h2>

          <!-- Rating -->
          <div class="flex items-center mb-4">
            <div class="flex text-yellow-400">
              ${generateStars(product.rating || 4.5)}
            </div>
            <span class="text-sm text-gray-600 ml-2">${product.rating || 4.5} (${product.reviews || 0} reviews)</span>
          </div>
        </div>

        <!-- Description -->
        <div>
          <p class="text-gray-600 leading-relaxed">${productLongDescription}</p>
        </div>

        <!-- Features -->
        ${product.features && product.features.length > 0 ? `
          <div>
            <h3 class="font-semibold text-gray-900 mb-3">Características principales:</h3>
            <ul class="space-y-2">
              ${product.features.map(feature => `
                <li class="flex items-center">
                  <svg class="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  ${feature}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Tags -->
        ${product.tags && product.tags.length > 0 ? `
          <div>
            <div class="flex flex-wrap gap-2">
              ${product.tags.map(tag => `
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">#${tag}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Price and Purchase -->
        <div class="border-t pt-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <div class="flex items-center space-x-3">
                <span class="text-4xl font-bold text-gray-900">$${product.price}</span>
                ${product.originalPrice > product.price ? `
                  <div class="flex flex-col">
                    <span class="text-lg text-gray-500 line-through">$${product.originalPrice}</span>
                    <span class="text-sm text-green-600 font-medium">
                      Ahorra $${(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <button class="w-full bg-[#22a7d0] text-white py-4 px-6 rounded-lg hover:bg-[#1a8db3] transition-colors font-semibold text-lg"
                  onclick="addToCart('${product.id}')">
            Comprar ahora
          </button>

          <p class="text-sm text-gray-500 text-center mt-3">
            💳 Pago seguro • 🔄 30 días de garantía • 📞 Soporte 24/7
          </p>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('product-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = 'auto';
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // Simulated purchase process
  const button = event.target;
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = 'Procesando...';
  button.classList.add('opacity-75');

  // Simulate purchase delay
  setTimeout(() => {
    // Show success message
    button.textContent = '✅ Comprado';
    button.classList.remove('opacity-75');
    button.classList.add('bg-green-500');

    // Show toast notification
    showToast(`¡${product.name} añadido a tu cuenta!`, 'success');

    // Reset button after 2 seconds
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      button.classList.remove('bg-green-500');
    }, 2000);

    // Close modal if open
    closeModal();
  }, 1500);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-full ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);

  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

function updateTotalCount() {
  document.getElementById('total-products').textContent = products.length;
}
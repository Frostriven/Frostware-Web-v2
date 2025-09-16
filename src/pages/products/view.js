import { getProductsFromFirebase, addUserProduct } from '../../js/userProfile.js';
import { auth } from '../../js/firebase.js';

export async function renderProductsView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  try {
    // Load products from Firebase
    const products = await getProductsFromFirebase();

    // Generate HTML dynamically
    const html = generateProductsHTML(products);

    // Wrap it in a container that preserves the styling with animation
    root.innerHTML = `<div class="bg-gray-50 opacity-0 transform translate-y-4 transition-all duration-700">${html}</div>`;

    // Trigger entrance animation
    setTimeout(() => {
      const container = root.querySelector('.bg-gray-50');
      if (container) {
        container.classList.remove('opacity-0', 'translate-y-4');
        container.classList.add('opacity-100', 'translate-y-0');
      }
    }, 50);

    // Animate product cards with smooth fade-in
    setTimeout(() => {
      const productCards = root.querySelectorAll('.product-card');
      productCards.forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
      });

      // Trigger all cards animation simultaneously
      setTimeout(() => {
        productCards.forEach((card) => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        });
      }, 50);
    }, 300);

    // Re-initialize the filter functionality
    initializeProductFilters();

    // Add purchase animations
    initializePurchaseAnimations();

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error cargando productos:', error);
    root.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
  }
}

function generateProductsHTML(products) {
  const categories = [...new Set(products.map(p => p.category))];

  const filtersHTML = `
    <button class="filter-btn active px-4 py-2 rounded-full text-sm font-medium transition-colors bg-[#22a7d0] text-white" data-filter="all">
      Todos los Productos
    </button>
    ${categories.map(category => `
      <button class="filter-btn px-4 py-2 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200" data-filter="${category}">
        ${getCategoryDisplayName(category)}
      </button>
    `).join('')}
  `;

  const productsHTML = products.map(product => {
    const badgeColor = getBadgeColor(product.badge || 'Disponible');
    const starsHTML = generateStarsHTML(product.rating || 4.5);
    const reviewsCount = product.reviews || Math.floor(Math.random() * 400) + 50; // Random reviews if not specified

    return `
      <div class="product-card bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full" data-category="${product.category}">
        <div class="relative h-48 overflow-hidden rounded-t-lg">
          <img src="${product.image || 'https://placehold.co/600x400/1a202c/FFFFFF?text=' + encodeURIComponent(product.name) + '&font=inter'}"
               class="w-full h-full object-cover rounded-t-lg"
               alt="${product.name}">
        </div>
        <div class="p-6 flex flex-col flex-grow">
          <h3 class="text-xl font-bold mb-2 line-clamp-2 min-h-[3.5rem]">${product.name}</h3>
          <div class="flex items-center mb-3 star-rating">
            ${starsHTML}
            <span class="text-xs text-gray-500 ml-2">(${reviewsCount})</span>
          </div>
          <p class="text-gray-600 mb-4 flex-grow line-clamp-3 min-h-[4.5rem]">${product.description}</p>
          <div class="flex justify-between items-center mb-3">
            ${product.price === 0 || product.price === "Gratis" ? `
              <span class="text-2xl font-bold text-gray-900">Gratis</span>
            ` : product.originalPrice && product.originalPrice > product.price ? `
              <div class="flex items-center space-x-2">
                <span class="text-2xl font-bold text-gray-900">$${product.price}</span>
                <span class="text-lg text-gray-500 line-through">$${product.originalPrice}</span>
              </div>
            ` : `
              <span class="text-2xl font-bold text-gray-900">$${product.price || 99}</span>
            `}
            <span class="text-sm ${badgeColor} px-2 py-1 rounded-full">${product.badge || 'Disponible'}</span>
          </div>
          <a href="#" class="mt-auto cta-button text-center bg-[#22a7d0] text-white font-bold py-2 px-4 rounded-lg">${product.price === 0 || product.price === "Gratis" ? 'Acceder a la Guía' : 'Obtener Licencia'}</a>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section id="productos" class="py-20">
      <div class="container mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-sm font-bold uppercase text-[#22a7d0]">SOLUCIONES DIGITALES</h2>
          <p class="section-title text-3xl md:text-4xl mt-2">Un ecosistema para tu crecimiento</p>
        </div>

        <!-- Filter Section -->
        <div class="mb-8">
          <div class="flex flex-wrap justify-center gap-4">
            ${filtersHTML}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          ${productsHTML}
        </div>
      </div>
    </section>
  `;
}

function getCategoryDisplayName(category) {
  const categoryNames = {
    'aviation': 'Aviación',
    'development': 'Desarrollo',
    'education': 'Educación',
    'ai': 'Inteligencia Artificial',
    'technology': 'Tecnología',
    'design': 'Diseño',
    'business': 'Negocios'
  };
  return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

function getBadgeColor(badge) {
  const badgeColors = {
    'Enterprise': 'text-indigo-600 bg-indigo-100',
    'Professional': 'text-purple-600 bg-purple-100',
    'Popular': 'text-green-600 bg-green-100',
    'New': 'text-blue-600 bg-blue-100',
    'Bestseller': 'text-orange-600 bg-orange-100',
    'Premium': 'text-cyan-600 bg-cyan-100',
    'Creative': 'text-pink-600 bg-pink-100',
    'Disponible': 'text-blue-600 bg-blue-100',
    'Default': 'text-blue-600 bg-blue-100'
  };
  return badgeColors[badge] || badgeColors['Default'];
}

function generateStarsHTML(rating) {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  let starsHTML = '';

  // Full stars (yellow)
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>';
  }

  // Empty stars (gray)
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>';
  }

  return starsHTML;
}

function initializeProductFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');

      // Update active button
      filterButtons.forEach(btn => {
        btn.classList.remove('active', 'bg-[#22a7d0]', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
      });
      this.classList.add('active', 'bg-[#22a7d0]', 'text-white');
      this.classList.remove('bg-gray-100', 'text-gray-700');

      // Filter products with animation
      productCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.3s ease-in-out';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function initializePurchaseAnimations() {
  // Add purchase functionality to all buttons
  const purchaseButtons = document.querySelectorAll('.cta-button');

  purchaseButtons.forEach(button => {
    // Remove any existing onclick to prevent duplicates
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Check if user is logged in
      if (!auth?.currentUser) {
        showToast('Debes iniciar sesión para obtener productos', 'error');
        window.location.hash = '#/auth';
        return;
      }

      const originalText = this.textContent;
      const originalClasses = this.className;

      // Get product info from the card
      const productCard = this.closest('.product-card');
      const productName = productCard.querySelector('h3').textContent;
      const productDescription = productCard.querySelector('.text-gray-600').textContent;

      // Purchase animation
      this.disabled = true;
      this.textContent = 'Procesando...';
      this.classList.add('opacity-75');

      try {
        // Get product info from the current product data (find matching product)
        const productCategory = productCard.getAttribute('data-category');
        const products = await getProductsFromFirebase();
        const currentProduct = products.find(p => p.name === productName);

        // Add to Firebase
        const productData = {
          id: currentProduct?.id || productName.toLowerCase().replace(/\s+/g, '-'),
          name: productName,
          description: productDescription,
          price: currentProduct?.price || 99,
          image: productCard.querySelector('img')?.src || '',
          category: productCategory || 'general',
          appUrl: currentProduct?.appUrl || null // Include app URL if available
        };

        await addUserProduct(auth.currentUser.uid, productData);

        setTimeout(() => {
          // Success state with checkmark
          this.textContent = '✅ ¡Agregado!';
          this.classList.remove('bg-[#22a7d0]', 'opacity-75');
          this.classList.add('bg-green-500');

          // Show toast notification with app access info
          if (productData.appUrl) {
            showPurchaseToastWithApp(productData.appUrl);
          } else {
            showPurchaseToast();
          }

          // Reset button after animation
          setTimeout(() => {
            this.textContent = originalText;
            this.className = originalClasses;
            this.disabled = false;
          }, 2000);
        }, 1000);

      } catch (error) {
        console.error('Error al agregar producto:', error);
        this.textContent = '❌ Error';
        this.classList.add('bg-red-500');
        showToast('Error al agregar producto', 'error');

        setTimeout(() => {
          this.textContent = originalText;
          this.className = originalClasses;
          this.disabled = false;
        }, 2000);
      }
    });
  });
}

function showToast(message, type = 'success') {
  // Create toast element
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

function showPurchaseToast() {
  showToast('¡Producto agregado exitosamente!', 'success');
}

function showPurchaseToastWithApp(appUrl) {
  // Create interactive toast with app access button
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 z-50 transform transition-all duration-500 translate-x-full';

  toast.innerHTML = `
    <div class="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg min-w-80">
      <div class="flex items-start space-x-3">
        <svg class="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div class="flex-1">
          <p class="font-medium mb-2">¡Producto agregado exitosamente!</p>
          <p class="text-sm mb-3">Ahora tienes acceso a la guía interactiva.</p>
          <div class="flex space-x-2">
            <button onclick="window.open('${appUrl}', '_blank')"
                    class="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm font-medium transition-colors">
              Abrir Guía
            </button>
            <button onclick="window.location.hash = '#/account'"
                    class="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm font-medium transition-colors">
              Ver Mis Apps
            </button>
          </div>
        </div>
        <button class="text-white hover:text-gray-200 transition-colors" onclick="this.parentElement.parentElement.parentElement.remove()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
    toast.classList.add('translate-x-0');
  }, 10);

  // Auto remove after longer duration for interactive toast
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 500);
  }, 8000);
}

// Add the fadeIn animation and utilities to the document
if (!document.querySelector('#products-animation-style')) {
  const style = document.createElement('style');
  style.id = 'products-animation-style';
  style.innerHTML = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .product-card {
      transition: all 0.3s ease;
      height: 100%;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .cta-button {
      transition: all 0.3s ease;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(34, 167, 208, 0.3);
    }

    .filter-btn {
      transition: all 0.3s ease;
    }

    .filter-btn:hover {
      transform: translateY(-1px);
    }

    /* Line clamp utilities for consistent text heights */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Ensure grid items stretch to same height */
    .grid.items-stretch > .product-card {
      align-self: stretch;
    }
  `;
  document.head.appendChild(style);
}
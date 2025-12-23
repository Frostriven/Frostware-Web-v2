import { getProductsFromFirebase, addUserProduct } from '../../js/userProfile.js';
import { auth } from '../../js/firebase.js';
import ShoppingCart from '../../js/cart.js';
import { t, i18n } from '../../i18n/index.js';

export async function renderProductsView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  try {
    // Load products from Firebase
    const products = await getProductsFromFirebase();

    // Generate HTML dynamically
    const html = generateProductsHTML(products);

    // Wrap it in a container - simplified (no double animation)
    root.innerHTML = `<div class="bg-gray-50 min-h-screen">${html}</div>`;

    // Animate product cards with smooth fade-in
    const productCards = root.querySelectorAll('.product-card');

    // Set initial state for animation (JS-controlled for robustness)
    productCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
    });

    setTimeout(() => {
      // Trigger staggered animation
      productCards.forEach((card, index) => {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100); // 100ms delay between each card
      });
    }, 100);

    // Re-initialize the filter functionality
    initializeProductFilters();

    // Initialize product buttons
    initializeProductButtons();

    // Add click listeners for product cards to navigate to detail view
    setTimeout(() => {
      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach(card => {
        card.addEventListener('click', (e) => {
          // Don't navigate if clicking on the action button
          if (e.target.classList.contains('product-action-button')) {
            return;
          }

          const productId = card.getAttribute('data-product-id');
          if (productId) {
            window.location.hash = `#/product/${productId}`;
          }
        });
      });
    }, 100);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Add listener for language changes
    const handleLanguageChange = () => {
      setTimeout(() => {
        // Re-render the products page with new language
        renderProductsView();
      }, 100);
    };

    // Remove existing listener to avoid duplicates
    window.removeEventListener('languageChanged', handleLanguageChange);
    // Add new listener
    window.addEventListener('languageChanged', handleLanguageChange);

  } catch (error) {
    console.error('Error cargando productos:', error);
    root.innerHTML = `<p class="text-center text-red-500">${t('productsPage.page.errorLoading')}: ${error.message}</p>`;
  }
}

function generateProductsHTML(products) {
  const categories = [...new Set(products.map(p => p.category))];

  const filtersHTML = `
    <button class="filter-btn active px-4 py-2 rounded-full text-sm font-medium transition-colors bg-[#22a7d0] text-white" data-filter="all">
      ${t('productsPage.filters.all')}
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

    // Get name and description in current language
    const currentLang = i18n.getCurrentLanguage();

    const name = typeof product.name === 'object'
      ? (product.name[currentLang] || product.name['en'] || product.name)
      : product.name;

    const description = typeof product.description === 'object'
      ? (product.description[currentLang] || product.description['en'] || product.description)
      : product.description;

    return `
      <div class="product-card hover-neon-glow cursor-pointer relative bg-white shadow-lg border border-gray-200"
           data-category="${product.category}"
           data-product-id="${product.id}"
           style="border-radius: 14px; height: 720px; z-index: 1;">

        <!-- Inner container for content -->
        <div class="w-full h-full flex flex-col" style="border-radius: 14px; overflow: hidden;">
            <div class="w-full h-1/2 overflow-hidden">
            <img src="${product.image || 'https://placehold.co/600x400/1a202c/FFFFFF?text=' + encodeURIComponent(name) + '&font=inter'}"
                class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                alt="${name}">
            </div>
            <div class="p-4 flex flex-col h-1/2 justify-between bg-white">
            <div class="flex-grow">
                <h3 class="text-lg font-bold mb-2 text-left">${name}</h3>
                <div class="flex items-center mb-2 star-rating justify-start">
                ${starsHTML}
                <span class="text-xs text-gray-500 ml-2">(${reviewsCount})</span>
                </div>
                <p class="text-gray-600 text-sm text-left line-clamp-2">${description}</p>
            </div>
            <div class="mt-auto">
                <div class="flex justify-between items-center mb-3">
                ${product.price === 0 || product.price === "Gratis" ? `
                <span class="text-2xl font-bold text-gray-900">${t('productsPage.pricing.free')}</span>
                ` : product.originalPrice && product.originalPrice > product.price ? `
                <div class="flex items-center space-x-2">
                    <span class="text-2xl font-bold text-gray-900">$${product.price}</span>
                    <span class="text-lg text-gray-500 line-through">$${product.originalPrice}</span>
                </div>
                ` : `
                <span class="text-2xl font-bold text-gray-900">$${product.price || 99}</span>
                `}
                <span class="text-sm ${badgeColor} px-2 py-1 rounded-full">${getBadgeDisplayName(product.badge || 'available')}</span>
                </div>
                <button class="product-action-button text-center bg-[#22a7d0] text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[#1e96bc] w-full"
                        data-product-id="${product.id}"
                        data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}'></button>
            </div>
            </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section id="productos" class="py-20">
      <div class="container mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-sm font-bold uppercase text-[#22a7d0]">${t('productsPage.page.tagline')}</h2>
          <p class="section-title text-3xl md:text-4xl mt-2">${t('productsPage.page.title')}</p>
        </div>

        <!-- Filter Section -->
        <div class="mb-8">
          <div class="flex flex-wrap justify-center gap-4">
            ${filtersHTML}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
          ${productsHTML}
        </div>
      </div>
    </section >
    `;
}

function getCategoryDisplayName(category) {
  const categoryKey = `productsPage.categories.${category} `;
  const translatedCategory = t(categoryKey);

  // If translation doesn't exist, fallback to capitalized category name
  if (translatedCategory === categoryKey) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  return translatedCategory;
}

function getBadgeDisplayName(badge) {
  const badgeKey = `productsPage.badges.${badge.toLowerCase()} `;
  const translatedBadge = t(badgeKey);

  // If translation doesn't exist, return original badge
  if (translatedBadge === badgeKey) {
    return badge;
  }

  return translatedBadge;
}

function getBadgeColor(badge) {
  const normalizedBadge = badge.toLowerCase();
  const badgeColors = {
    'enterprise': 'text-indigo-600 bg-indigo-100',
    'professional': 'text-purple-600 bg-purple-100',
    'popular': 'text-green-600 bg-green-100',
    'new': 'text-blue-600 bg-blue-100',
    'nuevo': 'text-blue-600 bg-blue-100',
    'bestseller': 'text-orange-600 bg-orange-100',
    'premium': 'text-cyan-600 bg-cyan-100',
    'creative': 'text-pink-600 bg-pink-100',
    'disponible': 'text-blue-600 bg-blue-100',
    'available': 'text-blue-600 bg-blue-100',
    'default': 'text-blue-600 bg-blue-100'
  };
  return badgeColors[normalizedBadge] || badgeColors['default'];
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
    button.addEventListener('click', function () {
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

async function initializeProductButtons() {
  // Wait for cart to be initialized
  if (!window.cart) {
    setTimeout(initializeProductButtons, 100);
    return;
  }

  // Only reload user purchased products if we haven't done it recently
  // This prevents unnecessary reloads that could cause UI issues
  if (!window.cart._lastProductsReload || (Date.now() - window.cart._lastProductsReload) > 30000) {
    await window.cart.loadUserPurchasedProducts();
    window.cart._lastProductsReload = Date.now();
  }

  const productButtons = document.querySelectorAll('.product-action-button');

  for (const button of productButtons) {
    const productData = JSON.parse(button.getAttribute('data-product').replace(/&apos;/g, "'"));
    const productId = button.getAttribute('data-product-id');

    // Check states
    const isPurchased = window.cart.isProductPurchased(productId);
    const inCart = window.cart.isProductInCart(productId);

    if (isPurchased) {
      button.textContent = t('productsPage.buttons.alreadyOwned');
      button.disabled = true;
      button.classList.remove('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
      button.classList.add('bg-gray-400', 'cursor-not-allowed');
    } else if (inCart) {
      if (productData.price === 0 || productData.price === "Gratis") {
        button.textContent = t('productsPage.buttons.getFree');
      } else {
        button.textContent = t('productsPage.buttons.removeFromCart');
        button.classList.remove('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
        button.classList.add('bg-orange-500', 'hover:bg-orange-600');
      }
    } else {
      if (productData.price === 0 || productData.price === "Gratis") {
        button.textContent = t('productsPage.buttons.getFree');
      } else {
        button.textContent = t('productsPage.buttons.addToCart');
      }
    }

    // Add click event
    if (!isPurchased) {
      button.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!auth?.currentUser) {
          showToast(t('productsPage.messages.loginRequired'), 'error');
          window.location.hash = '#/auth';
          return;
        }

        // If product is already in cart for paid products, remove it
        if (window.cart.isProductInCart(productId) && productData.price !== 0 && productData.price !== "Gratis") {
          window.cart.removeFromCart(productId);
          return;
        }

        // If it's a free product, add directly to user's library
        if (productData.price === 0 || productData.price === "Gratis") {
          const originalText = this.textContent;
          this.disabled = true;
          this.textContent = t('productsPage.buttons.processing');
          this.classList.add('opacity-75');

          try {
            await addUserProduct(auth.currentUser.uid, {
              id: productData.id,
              name: productData.name,
              description: productData.description,
              price: productData.price,
              image: productData.image,
              category: productData.category || 'general',
              purchaseDate: new Date().toISOString()
            });

            this.textContent = t('productsPage.buttons.added');
            this.classList.remove('bg-[#22a7d0]', 'opacity-75');
            this.classList.add('bg-green-500');

            showToast(t('productsPage.messages.productAdded'), 'success');

            // Update button state
            setTimeout(() => {
              this.textContent = t('productsPage.buttons.alreadyOwned');
              this.classList.remove('bg-green-500');
              this.classList.add('bg-gray-400', 'cursor-not-allowed');
              this.disabled = true;
            }, 2000);

            // Reload user products
            await window.cart.loadUserPurchasedProducts();

            // Update all product buttons
            window.cart.updateAllProductButtons();

          } catch (error) {
            console.error('Error adding free product:', error);
            this.textContent = t('productsPage.buttons.error');
            this.classList.add('bg-red-500');
            showToast(t('productsPage.messages.errorAddingProduct'), 'error');

            setTimeout(() => {
              this.textContent = originalText;
              this.className = 'mt-auto product-action-button text-center bg-[#22a7d0] text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[#1e96bc]';
              this.disabled = false;
            }, 2000);
          }
        } else {
          // Add to cart for paid products
          const success = window.cart.addToCart(productData);
          if (success) {
            // Optionally update button text temporarily
            const originalText = this.textContent;
            this.textContent = t('productsPage.buttons.added');
            this.classList.add('bg-green-500');

            setTimeout(() => {
              this.textContent = originalText;
              this.classList.remove('bg-green-500');
            }, 1500);
          }
        }
      });
    }
  }
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
  showToast(t('productsPage.messages.productAddedSuccess'), 'success');
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
          <p class="font-medium mb-2">${t('productsPage.messages.productAddedSuccess')}</p>
          <p class="text-sm mb-3">${t('productsPage.messages.productAddedDescription')}</p>
          <div class="flex space-x-2">
            <button onclick="window.open('${appUrl}', '_blank')"
              class="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm font-medium transition-colors">
              ${t('productsPage.toast.openGuide')}
            </button>
            <button onclick="window.location.hash = '#/account'"
              class="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm font-medium transition-colors">
              ${t('productsPage.toast.viewMyApps')}
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
    overflow: hidden;
  }

    .product-card img {
    margin: 0;
    padding: 0;
    display: block;
  }

    .cta-button {
    transition: all 0.3s ease;
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
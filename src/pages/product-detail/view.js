import { getUserProfile, verifyUserAppAccess } from '../../js/userProfile.js';
import { auth } from '../../js/firebase.js';
import { getProductsFromFirebase } from '../../js/userProfile.js';

export async function renderProductDetailView(productId) {
  const root = document.getElementById('spa-root');
  if (!root) return;

  try {
    // Load product data
    const products = await getProductsFromFirebase();
    const product = products.find(p => p.id === productId);

    if (!product) {
      root.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h2>
            <a href="#/products" class="text-[#22a7d0] hover:text-[#1e96c8]">Volver a productos</a>
          </div>
        </div>
      `;
      return;
    }

    // Check if user has purchased this product and if it's in cart
    let hasPurchased = false;
    let isInCart = false;

    if (auth?.currentUser) {
      const { getUserProducts } = await import('../../js/userProfile.js');
      const userProducts = await getUserProducts(auth.currentUser.uid);
      hasPurchased = userProducts.some(p => p.id === productId);

      // Only check cart if user is logged in
      if (window.cart) {
        isInCart = window.cart.isProductInCart(productId);
      }
    }
    // If no user is logged in, cart status should always be false
    // The cart should only be relevant for logged-in users

    // Create dynamic gradient from product colors
    const colors = product.colors || ['#1e293b', '#0f172a', '#334155'];
    const gradientClass = `bg-gradient-to-br`;
    const gradientStyle = `background: linear-gradient(to bottom right, ${colors[0]}, ${colors[1] || colors[0]}, ${colors[2] || colors[0]})`;

    root.innerHTML = `
      <div class="product-detail-page opacity-0 transform translate-y-8 transition-all duration-500 ease-out">
        <!-- Back Button -->
        <div class="absolute top-6 left-6 z-10">
          <button id="back-to-products" class="inline-flex items-center bg-[#22a7d0] text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:bg-[#1e96c8] hover:shadow-xl transition-all duration-200 group backdrop-blur-sm border border-white/20">
            <svg class="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Volver a Productos
          </button>
        </div>

        <!-- Hero Section with Dynamic Gradient -->
        <section class="text-white py-20" style="${gradientStyle}">
          <div class="container mx-auto px-6">
            <div class="max-w-6xl mx-auto">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div class="mb-6">
                    <span class="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
                      ${product.category === 'aviation' ? 'Professional Aviation Training' : 'Premium Digital Product'}
                    </span>
                    <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                      ${product.name}
                    </h1>
                    <p class="text-xl text-blue-100 mb-8">
                      ${product.longDescription || product.description}
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-4 mb-8">
                    ${product.features ? product.features.map(feature => `
                      <div class="flex items-center space-x-2">
                        <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                        <span>${feature}</span>
                      </div>
                    `).join('') : ''}
                  </div>

                  <div class="flex flex-col sm:flex-row gap-4">
                    ${hasPurchased ? `
                      <a href="#/dashboard/${product.id}" class="inline-flex items-center justify-center px-8 py-4 bg-[#22a7d0] text-white font-bold rounded-lg text-lg hover:bg-[#1e96c8] transition-colors shadow-lg">
                        Acceder Ahora
                        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                        </svg>
                      </a>
                    ` : !hasPurchased ? `
                      <button id="add-to-cart-btn" class="inline-flex items-center justify-center px-8 py-4 ${isInCart ? 'bg-green-500 hover:bg-green-600' : 'bg-[#22a7d0] hover:bg-[#1e96c8]'} text-white font-bold rounded-lg text-lg transition-colors shadow-lg" data-product-id="${product.id}">
                        ${isInCart ? 'En el Carrito' : 'Agregar al Carrito'}
                        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          ${isInCart ? `
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          ` : `
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"></path>
                          `}
                        </svg>
                      </button>
                    ` : ''}
                    <button id="learn-more-btn" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors">
                      Ver Detalles
                    </button>
                  </div>
                </div>

                <div class="relative">
                  <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <img src="${product.image}"
                         alt="${product.name}"
                         class="rounded-lg shadow-2xl w-full">

                    ${product.badge ? `
                      <div class="absolute -top-4 -right-4 bg-${product.badgeColor === 'blue' ? 'blue' : 'green'}-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                        ${product.badge}
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="py-20 bg-gray-50">
          <div class="container mx-auto px-6">
            <div class="max-w-6xl mx-auto">
              <div class="text-center mb-16">
                <h2 class="text-sm font-bold uppercase text-[#22a7d0] mb-2">PRODUCTO COMPLETO</h2>
                <h3 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Todo lo que necesitas</h3>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                  ${product.longDescription || product.description}
                </p>
              </div>

              ${product.detailedFeatures && product.detailedFeatures.length > 0 ? `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  ${product.detailedFeatures.map((feature, index) => {
                    const colors = ['blue', 'green', 'orange', 'red', 'purple', 'indigo'];
                    const color = colors[index % colors.length];

                    // Map icon names to SVG paths
                    const iconPaths = {
                      'radio': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>',
                      'map': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>',
                      'cloud': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>',
                      'warning': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>',
                      'certificate': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>',
                      'lightning': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>',
                      'code': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>',
                      'database': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>',
                      'shield': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"></path>',
                      'default': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
                    };

                    const iconPath = iconPaths[feature.icon] || iconPaths['default'];

                    return `
                      <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                        <div class="w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-6">
                          <svg class="w-6 h-6 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${iconPath}
                          </svg>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 mb-3">${feature.title}</h4>
                        <p class="text-gray-600">${feature.description}</p>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : product.features && product.features.length > 0 ? `
                <!-- Fallback to simple features if detailedFeatures not available -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  ${product.features.map((feature, index) => {
                    const colors = ['blue', 'green', 'orange', 'red', 'purple', 'indigo'];
                    const color = colors[index % colors.length];

                    return `
                      <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                        <div class="w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-6">
                          <svg class="w-6 h-6 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 mb-3">${feature}</h4>
                        <p class="text-gray-600">Funcionalidad completa incluida en este producto premium.</p>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </section>

        <!-- Statistics Section -->
        <section class="py-20 bg-white">
          <div class="container mx-auto px-6">
            <div class="max-w-6xl mx-auto">
              <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Producto Confiable y Probado</h2>
                <p class="text-xl text-gray-600">Únete a los usuarios satisfechos que ya disfrutan de este producto</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div class="text-4xl font-extrabold text-[#22a7d0] mb-2">${product.reviews || '50'}+</div>
                  <div class="text-gray-600">Usuarios Activos</div>
                </div>
                <div>
                  <div class="text-4xl font-extrabold text-[#22a7d0] mb-2">${product.rating || '5.0'}</div>
                  <div class="text-gray-600">Calificación Promedio</div>
                </div>
                <div>
                  <div class="text-4xl font-extrabold text-[#22a7d0] mb-2">${product.features?.length || '10'}</div>
                  <div class="text-gray-600">Funcionalidades</div>
                </div>
                <div>
                  <div class="text-4xl font-extrabold text-[#22a7d0] mb-2">95%</div>
                  <div class="text-gray-600">Satisfacción</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="py-20" style="${gradientStyle}">
          <div class="container mx-auto px-6">
            <div class="max-w-4xl mx-auto text-center text-white">
              <h2 class="text-3xl md:text-4xl font-extrabold mb-4">Obtén Acceso Completo</h2>
              <p class="text-xl mb-8 text-blue-100">
                ${product.longDescription || product.description}
              </p>

              ${hasPurchased ? `
                <a href="#/dashboard/${product.id}" class="inline-flex items-center px-10 py-4 bg-white text-[#22a7d0] font-bold rounded-lg text-xl hover:bg-blue-50 transition-colors shadow-lg">
                  Acceder Ahora
                  <svg class="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </a>
              ` : !hasPurchased ? `
                <div class="text-2xl font-bold mb-4">$${product.price}</div>
                <button id="add-to-cart-btn-cta" class="inline-flex items-center px-10 py-4 ${isInCart ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-white text-[#22a7d0] hover:bg-blue-50'} font-bold rounded-lg text-xl transition-colors shadow-lg" data-product-id="${product.id}">
                  ${isInCart ? 'En el Carrito' : 'Agregar al Carrito'}
                  <svg class="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    ${isInCart ? `
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    ` : `
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"></path>
                    `}
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
        </section>
      </div>
    `;

    // Add event listeners after rendering
    setupProductDetailEventListeners(product);

    // Animate page entrance
    requestAnimationFrame(() => {
      const page = root.querySelector('.product-detail-page');
      if (page) {
        page.classList.remove('opacity-0', 'translate-y-8');
        page.classList.add('opacity-100', 'translate-y-0');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error rendering product detail:', error);
    root.innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <p class="text-red-500 mb-4">Error cargando el producto</p>
          <a href="#/products" class="text-[#22a7d0] hover:text-[#1e96c8]">Volver a productos</a>
        </div>
      </div>
    `;
  }
}

function setupProductDetailEventListeners(product) {
  const backButton = document.getElementById('back-to-products');
  const learnMoreBtn = document.getElementById('learn-more-btn');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const addToCartBtnCta = document.getElementById('add-to-cart-btn-cta');

  if (backButton) {
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      animatePageExit(() => {
        window.location.hash = '#/products';
      });
    });
  }

  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('features').scrollIntoView({
        behavior: 'smooth'
      });
    });
  }

  // Add to cart functionality
  const handleAddToCart = async (button) => {
    if (!auth?.currentUser) {
      // Show toast or redirect to login
      if (window.cart && window.cart.showToast) {
        window.cart.showToast('Debes iniciar sesión para agregar productos', 'error');
      }
      window.location.hash = '#/auth';
      return;
    }

    // Check if product is already in cart
    const isInCart = window.cart && window.cart.isProductInCart(product.id);

    if (window.cart) {
      if (isInCart) {
        // Remove from cart
        window.cart.removeFromCart(product.id);
        updateBothButtons(false);
        // Force update cart count in header
        if (window.cart.updateCartCountSafe) {
          window.cart.updateCartCountSafe();
        }
      } else {
        // Add to cart
        const success = window.cart.addToCart(product);
        if (success) {
          updateBothButtons(true);
          // Force update cart count in header
          if (window.cart.updateCartCountSafe) {
            window.cart.updateCartCountSafe();
          }
        }
      }
    }
  };

  // Function to update both buttons simultaneously
  const updateBothButtons = (inCart) => {
    const topButton = document.getElementById('add-to-cart-btn');
    const bottomButton = document.getElementById('add-to-cart-btn-cta');

    const buttonText = inCart ? 'En el Carrito' : 'Agregar al Carrito';
    const iconPath = inCart
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"></path>';

    if (topButton) {
      topButton.innerHTML = `
        ${buttonText}
        <svg class="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${iconPath}
        </svg>
      `;
      topButton.className = inCart
        ? 'inline-flex items-center justify-center px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg transition-colors shadow-lg'
        : 'inline-flex items-center justify-center px-8 py-4 bg-[#22a7d0] hover:bg-[#1e96c8] text-white font-bold rounded-lg text-lg transition-colors shadow-lg';
    }

    if (bottomButton) {
      bottomButton.innerHTML = `
        ${buttonText}
        <svg class="w-6 h-6 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${iconPath}
        </svg>
      `;
      bottomButton.className = inCart
        ? 'inline-flex items-center px-10 py-4 bg-green-500 text-white hover:bg-green-600 font-bold rounded-lg text-xl transition-colors shadow-lg'
        : 'inline-flex items-center px-10 py-4 bg-white text-[#22a7d0] hover:bg-blue-50 font-bold rounded-lg text-xl transition-colors shadow-lg';
    }
  };

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => handleAddToCart(addToCartBtn));
  }

  if (addToCartBtnCta) {
    addToCartBtnCta.addEventListener('click', () => handleAddToCart(addToCartBtnCta));
  }
}

function animatePageExit(callback) {
  const page = document.querySelector('.product-detail-page');
  if (page) {
    page.classList.add('opacity-0', 'translate-y-8');
    setTimeout(callback, 300);
  } else {
    callback();
  }
}
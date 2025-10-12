import '../styles/styles.css';
import '../styles/firebase-integration.css';
// Firebase init
import './firebase.js';
import { initRouter, registerRoute } from './router.js';
import { renderLoginView } from '../pages/auth/login/view.js';
import { renderRegisterView } from '../pages/auth/register/view.js';
import { renderResetView } from '../pages/auth/reset/view.js';
import { renderAccountView } from '../pages/auth/account/view.js';
import { renderProductsView } from '../pages/products/view.js';
import { renderAdminView } from '../pages/admin/view.js';
import { renderProductDetailView } from '../pages/product-detail/view.js';
import { renderDashboardView } from '../pages/dashboard/view.js';
import { renderTermsView } from '../pages/terms/view.js';
import { renderPrivacyView } from '../pages/privacy/view.js';
import { renderContactView } from '../pages/contact/view.js';
import { watchAuthState, logout } from './auth.js';
import { initializeProductsInFirebase, isUserAdmin, isAdminEmail } from './userProfile.js';
import { isDevelopment, AUTO_DEMO_LOGIN } from './config.js';
import './cart.js';
// i18n system
import { i18n, t } from '../i18n/index.js';
import { getFlagSVG } from '../i18n/flags.js';
import { updateHomepageTranslations } from './homepage-i18n.js';

// Track page load time to prevent automatic actions during page load
window.pageLoadTime = Date.now();

// Función principal de inicialización
const initializeApp = () => {
  // Add loading state to prevent auth flash
  let authInitialized = false;

  // Render header content in Spanish into existing <header>
  const header = document.querySelector('header');
  const renderHeader = async (user, loading = false) => {
    if (!header) return;
    const currentHash = window.location.hash || '#/';

    let isAdmin = false;
    if (user) {
      isAdmin = await isUserAdmin(user.uid) || isAdminEmail(user.email);
    }

    header.innerHTML = `
      <nav class="container mx-auto px-6 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <div class="logo-icon mr-2">
            <div class="arc-1"></div>
            <div class="arc-2"></div>
          </div>
          <a class="text-white text-xl font-bold" href="#/">Frostware</a>
        </div>
        <div class="hidden md:flex items-center space-x-1">
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link ${currentHash === '#/' ? 'active' : ''}" href="#/">${t('navigation.home')}</a>
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link ${currentHash === '#/products' ? 'active' : ''}" href="#/products">${t('navigation.products')}</a>
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link ${currentHash === '#/terms' ? 'active' : ''}" href="#/terms">${t('navigation.terms')}</a>
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link ${currentHash === '#/privacy' ? 'active' : ''}" href="#/privacy">${t('navigation.privacy')}</a>
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link ${currentHash === '#/contact' ? 'active' : ''}" href="#/contact">${t('navigation.contact')}</a>
        </div>
        <div class="flex items-center space-x-4">
          <!-- Language Selector -->
          <div class="relative">
            <button id="language-selector" class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white">
              <div class="w-5 h-5">${getFlagSVG(i18n.getCurrentLanguage())}</div>
              <span class="text-sm font-medium">${i18n.getCurrentLanguage().toUpperCase()}</span>
              <svg class="w-4 h-4 transition-transform duration-200" id="language-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div id="language-dropdown" class="hidden absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
              <button onclick="changeLanguage('es')" class="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900 ${i18n.getCurrentLanguage() === 'es' ? 'bg-blue-50 text-blue-700' : ''}">
                <div class="w-5 h-5 mr-3">${getFlagSVG('es')}</div>
                <span class="font-medium">Español</span>
                ${i18n.getCurrentLanguage() === 'es' ? '<svg class="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
              </button>
              <button onclick="changeLanguage('en')" class="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900 ${i18n.getCurrentLanguage() === 'en' ? 'bg-blue-50 text-blue-700' : ''}">
                <div class="w-5 h-5 mr-3">${getFlagSVG('en')}</div>
                <span class="font-medium">English</span>
                ${i18n.getCurrentLanguage() === 'en' ? '<svg class="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
              </button>
            </div>
          </div>

          <!-- Carrito de compras (solo para usuarios loggeados) -->
          ${user ? `
            <div class="relative">
              <button id="cart-button" class="text-gray-300 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"></path>
                </svg>
                <span id="cart-count" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
              </button>
            </div>
          ` : ''}
          ${loading ? `
            <div class="animate-pulse bg-gray-600 h-8 w-20 rounded"></div>
          ` : user ? `
            <a class="text-gray-300 hover:text-white ${currentHash === '#/account' ? 'active' : ''}" href="#/account">${t('navigation.myAccount')}</a>
            <a class="flex items-center gap-2 text-gray-300 hover:text-white ${currentHash === '#/account/products' ? 'active' : ''}" href="#/account/products">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              ${t('navigation.myProducts')}
            </a>
            ${isAdmin ? `<a class="text-gray-300 hover:text-white ${currentHash === '#/admin' ? 'active' : ''}" href="#/admin">${t('navigation.admin')}</a>` : ''}
            <button id="btn-header-logout" class="cta-button bg-red-600 text-white font-bold py-2 px-4 rounded-lg">${t('navigation.logout')}</button>
          ` : `
            <a class="cta-button bg-[#22a7d0] text-white font-bold py-2 px-4 rounded-lg" href="#/auth">${t('navigation.login')}</a>
          `}
        </div>
      </nav>
    `;
    const btnLogout = header.querySelector('#btn-header-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        await logout();
        window.location.hash = '#/auth/login';
      });
    }

    // Add language selector event listeners
    const languageSelector = header.querySelector('#language-selector');
    const languageDropdown = header.querySelector('#language-dropdown');
    const languageChevron = header.querySelector('#language-chevron');

    if (languageSelector && languageDropdown) {
      languageSelector.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        languageDropdown.classList.toggle('hidden');
        languageChevron.style.transform = languageDropdown.classList.contains('hidden')
          ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!languageSelector.contains(e.target)) {
          languageDropdown.classList.add('hidden');
          languageChevron.style.transform = 'rotate(0deg)';
        }
      });
    }

    // Re-bind cart events after header render and update cart count
    setTimeout(() => {
      if (window.cart) {
        window.cart.bindEvents();
        window.cart.updateCartCountSafe(); // Safe update without retries
      }
    }, 50);
  };

  let currentUser = null;
  renderHeader(null, true); // Show loading state initially
  watchAuthState(async (user) => {
    currentUser = user;
    authInitialized = true;
    await renderHeader(user, false); // Remove loading state

    // Auto-login demo user in development if enabled and no user is logged in
    if (!user && isDevelopment() && AUTO_DEMO_LOGIN) {
      try {
        console.log('🚀 Auto-login demo habilitado - iniciando sesión...');
        const { quickDemoLogin } = await import('./userProfile.js');
        await quickDemoLogin();
        return; // Exit early, watchAuthState will trigger again with the user
      } catch (error) {
        console.error('Error en auto-login demo:', error);
      }
    }

    // Initialize products in Firebase when auth is ready
    initializeProductsInFirebase();

    // Add cart modal to the page if not present
    if (!document.getElementById('cart-modal')) {
      const cartModal = document.createElement('div');
      cartModal.innerHTML = `
        <!-- Modal del Carrito -->
        <div id="cart-modal" class="fixed inset-0 z-[110] hidden items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden">
                <div class="p-6 border-b flex justify-between items-center">
                    <h2 class="text-2xl font-bold">${t('cart.title')}</h2>
                    <button id="cart-close-button" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                <div id="cart-content" class="p-6 max-h-[50vh] overflow-y-auto">
                    <div id="cart-empty" class="text-center py-8 text-gray-500">
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 8L5 21h14a2 2 0 002-2V9H5m0 4v6a2 2 0 002 2h10a2 2 0 002-2v-6M9 21v-2m6 2v-2"></path>
                        </svg>
                        <p class="text-lg">${t('cart.empty')}</p>
                    </div>
                    <div id="cart-items" class="space-y-4"></div>
                </div>
                <div id="cart-footer" class="p-6 border-t bg-gray-50">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-xl font-bold">${t('cart.total')}: $<span id="cart-total">0.00</span></span>
                    </div>
                    <div class="flex space-x-4">
                        <button id="clear-cart" class="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors">
                            ${t('cart.clear')}
                        </button>
                        <button id="process-payment" class="flex-1 bg-[#22a7d0] text-white py-3 px-6 rounded-lg hover:bg-[#1e96bc] transition-colors">
                            ${t('cart.processPayment')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      `;
      document.body.appendChild(cartModal.firstElementChild);
    }

    // Re-initialize cart events after modal is added
    setTimeout(() => {
      if (window.cart) {
        window.cart.bindEvents();
        console.log('Cart events reinitialized from main.js');
      }
    }, 200);
  });

  // Update header when hash changes
  window.addEventListener('hashchange', async () => {
    await renderHeader(currentUser);
    // Re-bind cart events and reload purchased products after header update
    setTimeout(async () => {
      if (window.cart) {
        window.cart.bindEvents();
        // Only reload purchased products when navigating to account/products page
        const currentHash = window.location.hash;
        if (currentHash === '#/account/products' || currentHash === '#/account') {
          await window.cart.loadUserPurchasedProducts();
        }
        // Always update cart count after header render
        window.cart.updateCartCountSafe();
      }
    }, 100);
  });

  // Smooth scrolling solo para anclas de sección (#id), no para rutas SPA (#/route)
  document.querySelectorAll('.nav-link').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#') && !href.startsWith('#/')) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  // Router SPA: mostrar/ocultar contenido principal
  const setMainVisible = (visible) => {
    const main = document.getElementById('main-content');
    const footer = document.querySelector('footer');
    const spa = document.getElementById('spa-root');

    if (main) {
      main.style.display = visible ? '' : 'none';
    }
    if (footer) {
      footer.style.display = visible ? '' : 'none';
    }
  };

  registerRoute('#/', () => {
    const spa = document.getElementById('spa-root');
    if (spa) spa.innerHTML = '';
    setMainVisible(true);
    // Update homepage translations when showing homepage
    setTimeout(updateHomepageTranslations, 100);
  });
  // Alias genérico /auth que apunta a Login
  registerRoute('#/auth', () => {
    setMainVisible(false);
    renderLoginView();
  });
  registerRoute('#/auth/login', () => {
    setMainVisible(false);
    renderLoginView();
  });
  registerRoute('#/auth/register', () => {
    setMainVisible(false);
    renderRegisterView();
  });
  registerRoute('#/auth/reset', () => {
    setMainVisible(false);
    renderResetView();
  });
  registerRoute('#/account', () => {
    setMainVisible(false);
    renderAccountView();
  });
  registerRoute('#/account/products', () => {
    setMainVisible(false);
    renderAccountView('products');
  });
  registerRoute('#/products', () => {
    setMainVisible(false);
    renderProductsView();
  });
  registerRoute('#/admin', () => {
    setMainVisible(false);
    renderAdminView();
  });

  // Register a generic product route handler
  registerRoute('#/product', () => {
    const hash = window.location.hash;
    const productDetailMatch = hash.match(/^#\/product\/(.+)$/);
    if (productDetailMatch) {
      const productId = productDetailMatch[1];
      setMainVisible(false);
      renderProductDetailView(productId);
    }
  });

  // Register dashboard route handler
  registerRoute('#/dashboard', () => {
    const hash = window.location.hash;
    const dashboardMatch = hash.match(/^#\/dashboard\/(.+)$/);
    if (dashboardMatch) {
      const productId = dashboardMatch[1];
      setMainVisible(false);
      renderDashboardView(productId);
    }
  });

  // Register new page routes
  registerRoute('#/terms', () => {
    setMainVisible(false);
    renderTermsView();
  });

  registerRoute('#/privacy', () => {
    setMainVisible(false);
    renderPrivacyView();
  });

  registerRoute('#/contact', () => {
    setMainVisible(false);
    renderContactView();
  });

  initRouter();

  // Listen for language changes and update header
  window.addEventListener('languageChanged', async () => {
    await renderHeader(currentUser);
    console.log('✅ Header updated after language change');

    // Update cart modal content if it exists - but don't interfere with page navigation
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && !cartModal.classList.contains('updating')) {
      cartModal.classList.add('updating');
      cartModal.remove();
      // Re-create the cart modal with updated translations
      if (!document.getElementById('cart-modal')) {
        const newCartModal = document.createElement('div');
        newCartModal.innerHTML = `
          <!-- Modal del Carrito -->
          <div id="cart-modal" class="fixed inset-0 z-[110] hidden items-center justify-center bg-black bg-opacity-50">
              <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden">
                  <div class="p-6 border-b flex justify-between items-center">
                      <h2 class="text-2xl font-bold">${t('cart.title')}</h2>
                      <button id="cart-close-button" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                  </div>
                  <div id="cart-content" class="p-6 max-h-[50vh] overflow-y-auto">
                      <div id="cart-empty" class="text-center py-8 text-gray-500">
                          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 8L5 21h14a2 2 0 002-2V9H5m0 4v6a2 2 0 002 2h10a2 2 0 002-2v-6M9 21v-2m6 2v-2"></path>
                          </svg>
                          <p class="text-lg">${t('cart.empty')}</p>
                      </div>
                      <div id="cart-items" class="space-y-4"></div>
                  </div>
                  <div id="cart-footer" class="p-6 border-t bg-gray-50">
                      <div class="flex justify-between items-center mb-4">
                          <span class="text-xl font-bold">${t('cart.total')}: $<span id="cart-total">0.00</span></span>
                      </div>
                      <div class="flex space-x-4">
                          <button id="clear-cart" class="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors">
                              ${t('cart.clear')}
                          </button>
                          <button id="process-payment" class="flex-1 bg-[#22a7d0] text-white py-3 px-6 rounded-lg hover:bg-[#1e96bc] transition-colors">
                              ${t('cart.processPayment')}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
        `;
        document.body.appendChild(newCartModal.firstElementChild);

        // Re-bind cart events
        setTimeout(() => {
          if (window.cart) {
            window.cart.bindEvents();
            window.cart.updateCartUI();
            console.log('✅ Cart modal updated and events rebound after language change');
          }
          // Remove updating flag
          const updatedModal = document.getElementById('cart-modal');
          if (updatedModal) {
            updatedModal.classList.remove('updating');
          }
        }, 100);
      }
    }
  });

  // Update homepage translations if starting on homepage
  setTimeout(() => {
    const currentHash = window.location.hash || '#/';
    if (currentHash === '#/' || currentHash === '') {
      updateHomepageTranslations();
    }
  }, 300);
};

// Verificar si el DOM ya está cargado o esperar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
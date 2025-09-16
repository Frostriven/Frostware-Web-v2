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
import { watchAuthState, logout } from './auth.js';
import { initializeProductsInFirebase, isUserAdmin, isAdminEmail } from './userProfile.js';
import './cart.js';

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
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link ${currentHash === '#/' ? 'active' : ''}" href="#/">Inicio</a>
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link ${currentHash === '#/products' ? 'active' : ''}" href="#/products">Productos</a>
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link" href="#pricing">Precios</a>
        </div>
        <div class="flex items-center space-x-4">
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
            <a class="text-gray-300 hover:text-white ${currentHash === '#/account' ? 'active' : ''}" href="#/account">Mi cuenta</a>
            ${isAdmin ? `<a class="text-gray-300 hover:text-white ${currentHash === '#/admin' ? 'active' : ''}" href="#/admin">Admin</a>` : ''}
            <button id="btn-header-logout" class="cta-button bg-red-600 text-white font-bold py-2 px-4 rounded-lg">Salir</button>
          ` : `
            <a class="cta-button bg-[#22a7d0] text-white font-bold py-2 px-4 rounded-lg" href="#/auth">Iniciar sesión</a>
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

    // Re-bind cart events after header render
    setTimeout(() => {
      if (window.cart) {
        window.cart.bindEvents();
      }
    }, 50);
  };

  let currentUser = null;
  renderHeader(null, true); // Show loading state initially
  watchAuthState(async (user) => {
    currentUser = user;
    authInitialized = true;
    await renderHeader(user, false); // Remove loading state

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
                    <h2 class="text-2xl font-bold">Carrito de Compras</h2>
                    <button id="cart-close-button" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                <div id="cart-content" class="p-6 max-h-[50vh] overflow-y-auto">
                    <div id="cart-empty" class="text-center py-8 text-gray-500">
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 8L5 21h14a2 2 0 002-2V9H5m0 4v6a2 2 0 002 2h10a2 2 0 002-2v-6M9 21v-2m6 2v-2"></path>
                        </svg>
                        <p class="text-lg">Tu carrito está vacío</p>
                    </div>
                    <div id="cart-items" class="space-y-4"></div>
                </div>
                <div id="cart-footer" class="p-6 border-t bg-gray-50">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-xl font-bold">Total: $<span id="cart-total">0.00</span></span>
                    </div>
                    <div class="flex space-x-4">
                        <button id="clear-cart" class="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors">
                            Limpiar Carrito
                        </button>
                        <button id="process-payment" class="flex-1 bg-[#22a7d0] text-white py-3 px-6 rounded-lg hover:bg-[#1e96bc] transition-colors">
                            Procesar Pago
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
    // Re-bind cart events after header update
    setTimeout(() => {
      if (window.cart) {
        window.cart.bindEvents();
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
    const spa = document.getElementById('spa-root');
    if (main) {
      main.style.display = visible ? '' : 'none';
    }
  };

  registerRoute('#/', () => {
    const spa = document.getElementById('spa-root');
    if (spa) spa.innerHTML = '';
    setMainVisible(true);
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
  initRouter();
};

// Verificar si el DOM ya está cargado o esperar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
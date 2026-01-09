import '../styles/styles.css';
import '../styles/firebase-integration.css';
import '../styles/dark-mode.css';
import '../styles/enhancements.css';
// Firebase init
import './firebase.js';
import { initRouter, registerRoute } from './router.js';
import { renderLoginView } from '../pages/auth/login/view.js';
import { renderRegisterView } from '../pages/auth/register/view.js';
import { renderResetView } from '../pages/auth/reset/view.js';
import { renderAccountView } from '../pages/auth/account/view.js';
import { renderProductsView } from '../pages/products/view.js';
import { renderAdminView } from '../pages/admin/view.js';
import { renderAdminUsersView } from '../pages/admin-users/view.js';
import { renderProductFormView } from '../pages/product-form/view.js';
import { renderUserFormView } from '../pages/user-form/view.js';
import { renderDatabaseManagementView } from '../pages/database-management/view.js';
import { renderProductDetailView } from '../pages/product-detail/view.js';
import { renderDashboardView } from '../pages/dashboard/view.js';
import { renderTrainingView } from '../pages/training/view.js';
import { renderTermsView } from '../pages/terms/view.js';
import { renderPrivacyView } from '../pages/privacy/view.js';
import { renderContactView } from '../pages/contact/view.js';
import { watchAuthState, logout } from './auth.js';
import { isUserAdmin, isAdminEmail } from './userProfile.js';
import { isDevelopment, AUTO_DEMO_LOGIN } from './config.js';
import { initScrollObserver } from './utils/scrollObserver.js';
import './cart.js';
// i18n system
import { i18n, t } from '../i18n/index.js';
import { getFlagSVG } from '../i18n/flags.js';
import { updateHomepageTranslations } from './homepage-i18n.js';
// Firebase helpers (disponibles en consola para debugging)
import '../utils/firebase-init-helper.js';
// Theme Manager
import themeManager from '../utils/themeManager.js';
import { createThemeToggleHTML, getThemeToggleStyles, bindThemeToggleEvents, initializeThemeToggle } from '../components/ThemeToggle.js';

// Track page load time to prevent automatic actions during page load
window.pageLoadTime = Date.now();

// Función principal de inicialización
const initializeApp = async () => {
  // Wait for translations to be ready to prevent flickering keys
  await i18n.ready();

  // Inject theme toggle styles into head
  if (!document.getElementById('theme-toggle-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'theme-toggle-styles';
    styleElement.innerHTML = getThemeToggleStyles();
    document.head.appendChild(styleElement.firstElementChild);
  }

  // Add loading state to prevent auth flash
  let authInitialized = false;
  let isInitialRender = true;

  // Render header content in Spanish into existing <header>
  const header = document.querySelector('header');



  // NOTE: Initial loading state is now handled by index.html to prevent flickering.
  // We only update the header once we have the authentication state or meaningful data.

  const renderHeader = async (user, skipAnimation = false) => {
    if (!header) return;
    const currentHash = window.location.hash || '#/';

    let isAdmin = false;
    if (user) {
      isAdmin = await isUserAdmin(user.uid) || isAdminEmail(user.email);
    }

    // Make header visible with smooth fade-in only on first render
    // Skip animation on subsequent updates to prevent flashing
    if (isInitialRender && !skipAnimation) {
      header.style.transition = 'opacity 0.3s ease-in-out';
      header.style.opacity = '1';
      isInitialRender = false;
    } else if (!skipAnimation) {
      // For updates after initial render, use instant transition
      header.style.transition = 'none';
      header.style.opacity = '1';
    }

    header.innerHTML = `
      <nav class="container mx-auto px-6 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <div class="logo-icon mr-2">
            <div class="arc-1"></div>
            <div class="arc-2"></div>
          </div>
          <a class="text-gray-800 dark:text-white text-xl font-bold" href="#/">Frostware</a>
        </div>
        <div class="hidden md:flex items-center space-x-1">
          <a class="py-2 px-3 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white nav-link ${currentHash === '#/' ? 'active' : ''}" href="#/">${t('navigation.home')}</a>
          <a class="py-2 px-3 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white nav-link ${currentHash === '#/products' ? 'active' : ''}" href="#/products">${t('navigation.products')}</a>
          <a class="py-2 px-3 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white nav-link ${currentHash === '#/terms' ? 'active' : ''}" href="#/terms">${t('navigation.terms')}</a>
          <a class="py-2 px-3 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white nav-link ${currentHash === '#/privacy' ? 'active' : ''}" href="#/privacy">${t('navigation.privacy')}</a>
          <a class="py-2 px-3 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white nav-link ${currentHash === '#/contact' ? 'active' : ''}" href="#/contact">${t('navigation.contact')}</a>
        </div>
        <div class="flex items-center space-x-4">
          <!-- Language Selector -->
          <div class="relative">
            <button id="language-selector" class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <div class="w-5 h-5">${getFlagSVG(i18n.getCurrentLanguage())}</div>
              <span class="text-sm font-medium">${i18n.getCurrentLanguage().toUpperCase()}</span>
              <svg class="w-4 h-4 transition-transform duration-200" id="language-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div id="language-dropdown" class="hidden absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[102] overflow-hidden">
              <button onclick="changeLanguage('es')" class="flex items-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white ${i18n.getCurrentLanguage() === 'es' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}">
                <div class="w-5 h-5 mr-3">${getFlagSVG('es')}</div>
                <span class="font-medium">Español</span>
                ${i18n.getCurrentLanguage() === 'es' ? '<svg class="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
              </button>
              <button onclick="changeLanguage('en')" class="flex items-center w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white ${i18n.getCurrentLanguage() === 'en' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}">
                <div class="w-5 h-5 mr-3">${getFlagSVG('en')}</div>
                <span class="font-medium">English</span>
                ${i18n.getCurrentLanguage() === 'en' ? '<svg class="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
              </button>
            </div>
          </div>

          <!-- Carrito de compras (solo para usuarios loggeados) -->
          ${user ? `
            <div class="relative">
              <button id="cart-button" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"></path>
                </svg>
                <span id="cart-count" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
              </button>
            </div>
          ` : ''}
          ${user ? `
            <!-- User Menu with Greeting Stacked -->
            <div class="relative flex flex-col items-center" id="user-menu-container">
              <button id="user-menu-button" class="flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors focus:outline-none">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <svg class="w-3 h-3 transition-transform duration-200" id="user-menu-arrow" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </button>
              <!-- User Greeting Below Icon -->
              <span class="text-gray-500 dark:text-gray-400 text-xs mt-0.5 whitespace-nowrap">${t('navigation.greeting')}, <span class="font-semibold text-gray-700 dark:text-white">${user.displayName || user.email?.split('@')[0] || 'Usuario'}</span></span>

              <div id="user-menu-dropdown" class="hidden absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[101] overflow-hidden">
                <div class="py-2">
                  <a href="#/account" class="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${currentHash === '#/account' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span class="font-medium">${t('navigation.myAccount')}</span>
                  </a>

                  <a href="#/account/products" class="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${currentHash === '#/account/products' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    <span class="font-medium">${t('navigation.myProducts')}</span>
                  </a>

                  ${isAdmin ? `
                    <a href="#/admin" class="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${currentHash === '#/admin' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                      <span class="font-medium">${t('navigation.admin')}</span>
                    </a>
                  ` : ''}

                  <hr class="my-2 border-gray-200 dark:border-gray-700">

                  <!-- Theme Toggle -->
                  ${createThemeToggleHTML(themeManager.isDarkMode())}

                  <hr class="my-2 border-gray-200 dark:border-gray-700">

                  <button id="btn-header-logout" class="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    <span class="font-medium">${t('navigation.logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <!-- Theme Toggle for non-logged in users (iOS Switch) -->
            <button
              id="theme-toggle-public"
              class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
              aria-label="Toggle dark mode"
              title="${themeManager.isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}"
            >
              <div class="ios-switch-container">
                <div class="ios-switch ${themeManager.isDarkMode() ? 'active' : ''}" data-theme-switch-public>
                  <div class="ios-switch-track ${themeManager.isDarkMode() ? 'active' : ''}">
                    <div class="ios-switch-thumb ${themeManager.isDarkMode() ? 'active' : ''}">
                      <svg class="thumb-icon sun ${!themeManager.isDarkMode() ? 'visible' : ''}" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
                      </svg>
                      <svg class="thumb-icon moon ${themeManager.isDarkMode() ? 'visible' : ''}" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </button>
            <a class="cta-button bg-[#22a7d0] text-white font-bold py-2 px-4 rounded-lg" href="#/auth">${t('navigation.login')}</a>
          `}
        </div>
      </nav>
    `;
    const btnLogout = header.querySelector('#btn-header-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        await logout();

        // Show logout success toast
        if (window.cart && window.cart.showToast) {
          window.cart.showToast(t('auth.logoutSuccess') || 'Sesión cerrada exitosamente', 'success');
        }

        // Redirect to homepage
        window.location.hash = '#/';
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

    // Add user menu dropdown event listeners
    const userMenuButton = header.querySelector('#user-menu-button');
    const userMenuDropdown = header.querySelector('#user-menu-dropdown');
    const userMenuArrow = header.querySelector('#user-menu-arrow');

    if (userMenuButton && userMenuDropdown) {
      userMenuButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        userMenuDropdown.classList.toggle('hidden');
        userMenuArrow.style.transform = userMenuDropdown.classList.contains('hidden')
          ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target)) {
          userMenuDropdown.classList.add('hidden');
          userMenuArrow.style.transform = 'rotate(0deg)';
        }
      });

      // Close dropdown when clicking on a menu item (except logout button)
      userMenuDropdown.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          userMenuDropdown.classList.add('hidden');
          userMenuArrow.style.transform = 'rotate(0deg)';
        });
      });
    }

    // Initialize theme toggle if user is logged in
    if (user) {
      setTimeout(() => {
        initializeThemeToggle(themeManager);
      }, 10);
    } else {
      // Initialize theme toggle for public users
      const publicToggle = header.querySelector('#theme-toggle-public');
      if (publicToggle) {
        publicToggle.addEventListener('click', () => {
          themeManager.toggleTheme();
          renderHeader(null, true); // Re-render header to update icons

          if (window.cart && window.cart.showToast) {
            const message = themeManager.isDarkMode()
              ? '🌙 Modo oscuro activado'
              : '☀️ Modo claro activado';
            window.cart.showToast(message, 'success');
          }
        });
      }
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
  // Don't render header until auth state is determined to prevent flicker
  // The index.html already has skeleton placeholders that will show while loading
  watchAuthState(async (user) => {
    console.log('[watchAuthState] Auth state changed:', user ? `User: ${user.email}` : 'No user');
    currentUser = user;

    // Render header on every auth state change
    // First render gets smooth animation, subsequent renders are instant
    const skipAnimation = authInitialized;
    if (!authInitialized) {
      authInitialized = true;
      console.log('[watchAuthState] First auth initialization');
    }
    console.log('[watchAuthState] Rendering header with user:', user ? user.email : 'null');
    await renderHeader(user, skipAnimation);

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
    // NOTA: Comentado para evitar inicialización automática en cada recarga
    // Ejecuta manualmente desde la consola: await initFirebaseProducts()
    // initializeProductsInFirebase();

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
    console.log('[hashchange] Hash changed to:', window.location.hash);
    // Get current auth state directly from Firebase instead of using cached currentUser
    // This prevents race conditions where navigation happens before watchAuthState updates
    const { auth } = await import('./firebase.js');
    const user = auth?.currentUser || null;
    console.log('[hashchange] Firebase auth.currentUser:', user ? user.email : 'null');
    console.log('[hashchange] Cached currentUser:', currentUser ? currentUser.email : 'null');
    currentUser = user; // Keep currentUser in sync

    await renderHeader(user, true); // Skip animation on navigation
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
  registerRoute('#/admin/users', () => {
    setMainVisible(false);
    renderAdminUsersView();
  });

  registerRoute('#/admin/databases', () => {
    setMainVisible(false);
    renderDatabaseManagementView();
  });

  // User form routes (creation and editing)
  registerRoute('#/admin/user/new', () => {
    setMainVisible(false);
    renderUserFormView();
  });

  registerRoute('#/admin/user', () => {
    const hash = window.location.hash;
    const userEditMatch = hash.match(/^#\/admin\/user\/(.+)$/);
    if (userEditMatch && userEditMatch[1] !== 'new') {
      const userId = userEditMatch[1];
      setMainVisible(false);
      renderUserFormView(userId);
    }
  });

  // Product form routes (creation and editing)
  registerRoute('#/admin/product/new', () => {
    setMainVisible(false);
    renderProductFormView();
  });

  registerRoute('#/admin/product', () => {
    const hash = window.location.hash;
    const productEditMatch = hash.match(/^#\/admin\/product\/(.+)$/);
    if (productEditMatch && productEditMatch[1] !== 'new') {
      const productId = productEditMatch[1];
      setMainVisible(false);
      renderProductFormView(productId);
    }
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

  // Register training route handler
  registerRoute('#/training', () => {
    console.log('🎮 Ruta de entrenamiento detectada');
    const hash = window.location.hash;
    console.log('📍 Hash actual:', hash);
    const trainingMatch = hash.match(/^#\/training\/(.+)$/);
    if (trainingMatch) {
      const productId = trainingMatch[1];
      console.log('✅ ProductId extraído:', productId);
      setMainVisible(false);
      renderTrainingView(productId);
    } else {
      console.log('❌ No se pudo extraer productId del hash');
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

  // watchAuthState handles all header updates based on auth state
  // No need for additional timeouts - it fires on every auth state change

  // Listen for language changes and update header
  window.addEventListener('languageChanged', async () => {
    // Get current auth state directly from Firebase
    const { auth } = await import('./firebase.js');
    const user = auth?.currentUser || null;

    await renderHeader(user);
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

  // Initialize scroll animations
  const scrollObserver = initScrollObserver();
  // Expose observer to window for dynamic content updates
  window.scrollObserver = scrollObserver;

  // Update homepage translations if starting on homepage
  setTimeout(async () => {
    const currentHash = window.location.hash || '#/';
    if (currentHash === '#/' || currentHash === '') {
      await i18n.ready(); // Ensure translations are loaded
      updateHomepageTranslations();
    }
  }, 300);

  // Re-observe when DOM likely changes (e.g., route change)
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      scrollObserver.refresh();
    }, 500); // Wait for new content to render
  });
};

// Verificar si el DOM ya está cargado o esperar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
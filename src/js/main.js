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
        <div class="flex items-center">
          ${loading ? `
            <div class="animate-pulse bg-gray-600 h-8 w-20 rounded"></div>
          ` : user ? `
            <a class="mr-3 text-gray-300 hover:text-white ${currentHash === '#/account' ? 'active' : ''}" href="#/account">Mi cuenta</a>
            ${isAdmin ? `<a class="mr-3 text-gray-300 hover:text-white ${currentHash === '#/admin' ? 'active' : ''}" href="#/admin">Admin</a>` : ''}
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
  };

  let currentUser = null;
  renderHeader(null, true); // Show loading state initially
  watchAuthState(async (user) => {
    currentUser = user;
    authInitialized = true;
    await renderHeader(user, false); // Remove loading state

    // Initialize products in Firebase when auth is ready
    initializeProductsInFirebase();
  });

  // Update header when hash changes
  window.addEventListener('hashchange', async () => {
    await renderHeader(currentUser);
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
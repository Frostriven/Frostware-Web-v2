import '../styles/styles.css';
import '../styles/firebase-integration.css';
// Firebase init
import './firebase.js';
import { initRouter, registerRoute } from './router.js';
import { renderLoginView } from '../pages/auth/login/view.js';
import { renderRegisterView } from '../pages/auth/register/view.js';
import { renderResetView } from '../pages/auth/reset/view.js';
import { renderAccountView } from '../pages/auth/account/view.js';
import { watchAuthState, logout } from './auth.js';

// Función principal de inicialización
const initializeApp = () => {
  // Global bubbles generator
  const gb = document.querySelector('.global-bubbles');
  if (gb) {
    const rnd = (min, max) => Math.random() * (max - min) + min;
    const viewH = window.innerHeight || 800;
    // Create simple bubbles (larger, varied, already present on load)
    for (let i = 0; i < 48; i++) {
      const s = document.createElement('span');
      s.className = 'bubble';
      const size = rnd(12, 42);
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.left = `${rnd(0, 100)}%`;
      s.style.bottom = `${rnd(0, viewH)}px`;
      s.style.setProperty('--dur', `${rnd(10, 22)}s`);
      s.style.setProperty('--drift', `${rnd(-70, 70)}px`);
      s.style.animationDelay = `-${rnd(0, 18)}s`;
      gb.appendChild(s);
    }
    // Add a few logo bubbles
    for (let i = 0; i < 8; i++) {
      const w = document.createElement('div');
      w.className = 'logo-bubble';
      w.style.left = `${rnd(0, 100)}%`;
      w.style.bottom = `${rnd(0, viewH)}px`;
      w.style.setProperty('--size', `${rnd(24, 44)}px`);
      w.style.setProperty('--dur', `${rnd(14, 24)}s`);
      w.style.setProperty('--drift', `${rnd(-80, 80)}px`);
      w.style.animationDelay = `-${rnd(0, 20)}s`;
      w.innerHTML = `
        <div class="logo-icon">
          <div class="arc-1"></div>
          <div class="arc-2"></div>
        </div>
      `;
      gb.appendChild(w);
    }

    // Cell-like split effect: occasionally split a bubble into two
    const splitBubble = () => {
      const candidates = Array.from(gb.querySelectorAll('.bubble'));
      if (!candidates.length) return;
      const b = candidates[Math.floor(rnd(0, candidates.length))];
      const left = parseFloat(b.style.left) || rnd(0, 100);
      const bottom = parseFloat(b.style.bottom) || rnd(0, viewH);
      const size = parseFloat(b.style.width) || rnd(12, 42);
      // Create two smaller bubbles drifting apart
      const mk = (dx) => {
        const s = document.createElement('span');
        s.className = 'bubble';
        const newSize = Math.max(8, size * rnd(0.45, 0.65));
        s.style.width = `${newSize}px`;
        s.style.height = `${newSize}px`;
        s.style.left = `${Math.min(100, Math.max(0, left + dx))}%`;
        s.style.bottom = `${bottom + rnd(-20, 20)}px`;
        s.style.setProperty('--dur', `${rnd(10, 18)}s`);
        s.style.setProperty('--drift', `${dx > 0 ? rnd(20, 80) : rnd(-80, -20)}px`);
        s.style.animationDelay = `-${rnd(0, 12)}s`;
        s.style.opacity = '0.9';
        return s;
      };
      const s1 = mk(rnd(-6, -2));
      const s2 = mk(rnd(2, 6));
      gb.appendChild(s1);
      gb.appendChild(s2);
      // Soften/remove the original
      b.style.opacity = '0.35';
      setTimeout(() => {
        b.remove();
      }, 1500);
      // Cleanup children later
      setTimeout(() => { s1.remove(); }, 25000);
      setTimeout(() => { s2.remove(); }, 25000);
    };
    setInterval(splitBubble, 2200);
  }
  // Render header content in Spanish into existing <header>
  const header = document.querySelector('header');
  const renderHeader = (user) => {
    if (!header) return;
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
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link" href="#/">Inicio</a>
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link" href="#productos-destacados">Productos</a>
          <a class="py-2 px-3 text-gray-300 hover:text-white nav-link" href="#pricing">Precios</a>
        </div>
        <div class="flex items-center">
          ${user ? `
            <a class="mr-3 text-gray-300 hover:text-white" href="#/account">Mi cuenta</a>
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

  renderHeader(null);
  watchAuthState((user) => renderHeader(user));

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
  initRouter();
};

// Verificar si el DOM ya está cargado o esperar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
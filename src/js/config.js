// Configuración de desarrollo
export const isDevelopment = () => {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('dev') ||
         window.location.search.includes('dev=true');
};

// Configuración de usuario demo
export const DEMO_USER = {
  email: 'demo@frostware.com',
  password: 'demo123456',
  name: 'Usuario Demo',
  isAdmin: true, // Usuario demo es administrador
  redirectTo: '#/products' // Redirige a productos después del login
};

// Configuración de auto-login (cámbialo a true si quieres auto-login)
export const AUTO_DEMO_LOGIN = false; // Cambiar a true para auto-login
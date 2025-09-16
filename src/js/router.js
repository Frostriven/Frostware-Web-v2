// Router muy simple basado en hash (#/route)

const routes = new Map();

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

export function initRouter() {
  const run = () => {
    const hash = window.location.hash || '#/';
    const path = hash.split('?')[0];

    // Check for dynamic routes (e.g., #/product/123, #/dashboard/123)
    if (path.startsWith('#/product/')) {
      const productHandler = routes.get('#/product');
      if (productHandler) {
        productHandler();
        return;
      }
    }

    if (path.startsWith('#/dashboard/')) {
      const dashboardHandler = routes.get('#/dashboard');
      if (dashboardHandler) {
        dashboardHandler();
        return;
      }
    }

    // Normal route handling
    const handler = routes.get(path) || routes.get('#/');
    if (typeof handler === 'function') handler();
  };

  window.addEventListener('hashchange', run);
  run();
}

// Router muy simple basado en hash (#/route)

const routes = new Map();

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

export function initRouter() {
  const run = () => {
    const hash = window.location.hash || '#/';
    const path = hash.split('?')[0];
    const handler = routes.get(path) || routes.get('#/');
    if (typeof handler === 'function') handler();
  };

  window.addEventListener('hashchange', run);
  run();
}

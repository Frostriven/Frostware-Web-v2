import { resetPassword } from '../../../js/auth.js';

export function renderResetView() {
  const root = document.getElementById('spa-root');
  if (!root) return;
  root.innerHTML = `
    <section class="py-12">
      <div class="container mx-auto max-w-md">
        <h2 class="text-2xl font-extrabold text-center mb-6">Recuperar contraseña</h2>
        <div class="bg-white p-6 rounded-lg shadow border">
          <label class="block text-sm font-medium mb-1" for="email">Email</label>
          <input id="email" type="email" class="w-full p-3 border rounded mb-4" placeholder="you@example.com" />
          <button id="btn-reset" class="w-full bg-[#22a7d0] text-white font-semibold py-2 rounded">Enviar enlace</button>
          <div class="mt-4 text-sm text-center">
            <a href="#/auth/login" class="text-[#22a7d0]">Volver a iniciar sesión</a>
          </div>
          <div id="status" class="mt-4 text-sm text-gray-600"></div>
        </div>
      </div>
    </section>
  `;

  const email = root.querySelector('#email');
  const btn = root.querySelector('#btn-reset');
  const status = root.querySelector('#status');

  btn.addEventListener('click', async () => {
    try {
      btn.disabled = true;
      await resetPassword(email.value.trim());
      status.textContent = 'Hemos enviado un enlace de recuperación si el email existe.';
    } catch (e) {
      status.textContent = `Error: ${e.message}`;
    } finally {
      btn.disabled = false;
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

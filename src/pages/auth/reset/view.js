import { resetPassword } from '../../../js/auth.js';
import { toast, showLoadingToast } from '../../../js/utils/toast.js';

function getResetErrorMessage(errorCode) {
  const errorMessages = {
    'auth/invalid-email': 'El formato del email no es válido',
    'auth/user-not-found': 'No existe una cuenta con este email',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    'auth/missing-email': 'Debes ingresar un email'
  };

  return errorMessages[errorCode] || 'Error al enviar el enlace. Intenta nuevamente';
}

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
        </div>
      </div>
    </section>
  `;

  const email = root.querySelector('#email');
  const btn = root.querySelector('#btn-reset');

  btn.addEventListener('click', async () => {
    const emailValue = email.value.trim();

    // Validation
    if (!emailValue) {
      toast.error('Por favor, ingresa tu email');
      return;
    }

    const loadingToast = showLoadingToast('Enviando enlace de recuperación...');

    try {
      btn.disabled = true;
      await resetPassword(emailValue);
      loadingToast.success('¡Enlace enviado! Revisa tu email (incluyendo spam)');
    } catch (e) {
      console.error('Error en reset password:', e);
      const errorMessage = getResetErrorMessage(e.code || e.message);
      loadingToast.error(errorMessage);
    } finally {
      btn.disabled = false;
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

import { registerWithEmail, loginWithGoogle } from '../../../js/auth.js';
import { toast, showLoadingToast } from '../../../js/utils/toast.js';

function getRegisterErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'Ya existe una cuenta con este email',
    'auth/invalid-email': 'El formato del email no es válido',
    'auth/operation-not-allowed': 'Registro con email/contraseña no permitido',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/missing-email': 'Debes ingresar un email',
    'auth/missing-password': 'Debes ingresar una contraseña',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
  };

  return errorMessages[errorCode] || 'Error al crear la cuenta. Intenta nuevamente';
}

export async function renderRegisterView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  try {
    const response = await fetch('/pages/auth/register.html');
    if (!response.ok) {
      throw new Error(`No se pudo cargar la página de registro. Status: ${response.status}`);
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const mainContent = doc.querySelector('main');

    if (mainContent) {
      root.innerHTML = mainContent.innerHTML;
    } else {
        throw new Error('Contenido principal no encontrado en la página de registro.');
    }

    const registerButton = root.querySelector('#register-button');
    const googleButton = root.querySelector('#btn-google-register');
    const nameInput = root.querySelector('#register-name');
    const emailInput = root.querySelector('#register-email');
    const passwordInput = root.querySelector('#register-password');
    const passwordConfirmInput = root.querySelector('#register-password-confirm');

    if (registerButton) {
      registerButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const name = nameInput?.value.trim() || '';
        const email = emailInput?.value.trim() || '';
        const password = passwordInput?.value || '';
        const passwordConfirm = passwordConfirmInput?.value || '';

        // Validation
        if (!name || !email || !password || !passwordConfirm) {
          toast.error('Por favor, completa todos los campos');
          return;
        }

        if (password !== passwordConfirm) {
          toast.error('Las contraseñas no coinciden');
          return;
        }

        const loadingToast = showLoadingToast('Creando cuenta...');

        try {
          registerButton.disabled = true;
          const user = await registerWithEmail(name, email, password);

          loadingToast.success('¡Cuenta creada exitosamente!');
          setTimeout(() => {
            window.location.hash = '#/';
          }, 1500);
        } catch (error) {
          console.error("Error en el registro:", error);
          const errorMessage = getRegisterErrorMessage(error.code || error.message);
          loadingToast.error(errorMessage);
        } finally {
          registerButton.disabled = false;
        }
      });
    }

    if (googleButton) {
        googleButton.addEventListener('click', async (e) => {
            e.preventDefault();

            const loadingToast = showLoadingToast('Iniciando sesión con Google...');

            try {
                googleButton.disabled = true;
                const user = await loginWithGoogle();

                loadingToast.success('¡Cuenta creada con Google exitosamente!');
                setTimeout(() => {
                    window.location.hash = '#/';
                }, 1500);
            } catch (e) {
                console.error('Error con Google:', e);
                const errorMessage = getRegisterErrorMessage(e.code || e.message);
                loadingToast.error(errorMessage);
            } finally {
                googleButton.disabled = false;
            }
        });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error general:', error);
    root.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
  }
}
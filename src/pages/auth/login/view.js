import { loginWithEmail, loginWithGoogle } from '../../../js/auth.js';
import { initializeRememberMe, saveCredentials } from '../../../js/rememberMe.js';
import { toast, showLoadingToast } from '../../../js/utils/toast.js';

function getLoginErrorMessage(errorCode) {
  const errorMessages = {
    'auth/user-not-found': 'No existe una cuenta con este email',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-email': 'El formato del email no es válido',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    'auth/invalid-credential': 'Credenciales inválidas. Verifica tu email y contraseña',
    'auth/missing-password': 'Debes ingresar una contraseña',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres'
  };

  return errorMessages[errorCode] || 'Error al iniciar sesión. Intenta nuevamente';
}

export async function renderLoginView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  try {
    const response = await fetch('/pages/auth/login.html');
    if (!response.ok) {
      throw new Error(`No se pudo cargar la página de inicio de sesión. Status: ${response.status}`);
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const mainContent = doc.querySelector('main');

    if (mainContent) {
      root.innerHTML = mainContent.innerHTML;
    } else {
      throw new Error('Contenido principal no encontrado en la página de inicio de sesión.');
    }

    const emailInput = root.querySelector('#email');
    const passwordInput = root.querySelector('#password');
    const rememberCheckbox = root.querySelector('#remember-me');
    const loginButton = root.querySelector('#btn-login');
    const googleButton = root.querySelector('#btn-google-login');
    const demoButton = root.querySelector('#btn-demo-login');

    // Initialize remember me functionality
    initializeRememberMe(emailInput, rememberCheckbox);

    if (loginButton) {
      loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput?.value.trim() || '';
        const password = passwordInput?.value || '';

        // Validation
        if (!email || !password) {
          toast.error('Por favor, completa todos los campos');
          return;
        }

        const loadingToast = showLoadingToast('Iniciando sesión...');

        try {
          loginButton.disabled = true;
          const user = await loginWithEmail(email, password);

          // Save credentials if remember me is checked
          saveCredentials(email, rememberCheckbox?.checked || false);

          loadingToast.success('¡Sesión iniciada exitosamente!');
          setTimeout(() => {
            window.location.hash = '#/account';
          }, 1500);
        } catch (e) {
          console.error('Error en login:', e);
          const errorMessage = getLoginErrorMessage(e.code || e.message);
          loadingToast.error(errorMessage);
        } finally {
          loginButton.disabled = false;
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

                // Save Google user email if remember me is checked
                if (rememberCheckbox?.checked && user.email) {
                  saveCredentials(user.email, true);
                }

                loadingToast.success('¡Sesión iniciada con Google exitosamente!');
                setTimeout(() => {
                    window.location.hash = '#/account';
                }, 1500);
            } catch (e) {
                console.error('Error con Google:', e);
                const errorMessage = getLoginErrorMessage(e.code || e.message);
                loadingToast.error(errorMessage);
            } finally {
                googleButton.disabled = false;
            }
        });
    }

    // Demo login button handler
    if (demoButton) {
        demoButton.addEventListener('click', async (e) => {
            e.preventDefault();

            const loadingToast = showLoadingToast('Iniciando sesión demo...');

            try {
                demoButton.disabled = true;

                // Import the demo login function
                const { quickDemoLogin } = await import('../../../js/userProfile.js');
                const user = await quickDemoLogin();

                loadingToast.success('¡Sesión demo iniciada exitosamente!');
                setTimeout(() => {
                    window.location.hash = '#/products';
                }, 1500);
            } catch (e) {
                console.error('Error en demo login:', e);
                loadingToast.error('Error al crear/acceder usuario demo. Revisa la consola.');
            } finally {
                demoButton.disabled = false;
            }
        });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error general:', error);
    root.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
  }
}
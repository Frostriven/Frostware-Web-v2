import { registerWithEmail, loginWithGoogle } from '../../../js/auth.js';

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

    const statusDiv = document.createElement('div');
    statusDiv.className = 'mt-4 text-sm text-center';
    if(registerButton) {
        registerButton.parentElement.appendChild(statusDiv);
    }

    if (registerButton) {
      registerButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const name = nameInput?.value || '';
        const email = emailInput?.value || '';
        const password = passwordInput?.value || '';
        const passwordConfirm = passwordConfirmInput?.value || '';

        if (password !== passwordConfirm) {
          statusDiv.textContent = "Las contraseñas no coinciden.";
          statusDiv.style.color = 'red';
          return;
        }

        try {
          registerButton.disabled = true;
          statusDiv.textContent = 'Creando cuenta...';
          statusDiv.style.color = 'black';
          const user = await registerWithEmail(name, email, password);
          statusDiv.textContent = 'Cuenta creada exitosamente!';
          statusDiv.style.color = 'green';
          setTimeout(() => {
            window.location.hash = '#/account';
          }, 1500);
        } catch (error) {
          console.error("Error en el registro:", error);
          statusDiv.textContent = `Error: ${error.message}`;
          statusDiv.style.color = 'red';
        } finally {
          registerButton.disabled = false;
        }
      });
    }

    if (googleButton) {
        googleButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                googleButton.disabled = true;
                statusDiv.textContent = 'Iniciando sesión con Google...';
                statusDiv.style.color = 'black';
                const user = await loginWithGoogle();
                statusDiv.textContent = 'Sesión iniciada con Google!';
                statusDiv.style.color = 'green';
                setTimeout(() => {
                    window.location.hash = '#/account';
                }, 1000);
            } catch (e) {
                console.error('Error con Google:', e);
                statusDiv.textContent = `Error: ${e.message}`;
                statusDiv.style.color = 'red';
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
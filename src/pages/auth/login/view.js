import { loginWithEmail, loginWithGoogle } from '../../../js/auth.js';

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
    const loginButton = root.querySelector('#btn-login');
    const googleButton = root.querySelector('#btn-google-login');

    const statusDiv = document.createElement('div');
    statusDiv.className = 'mt-4 text-sm text-center';
    if(loginButton) {
        loginButton.parentElement.appendChild(statusDiv);
    }

    if (loginButton) {
      loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput?.value.trim() || '';
        const password = passwordInput?.value || '';

        try {
          loginButton.disabled = true;
          statusDiv.textContent = 'Iniciando sesión...';
          statusDiv.style.color = 'black';
          const user = await loginWithEmail(email, password);
          statusDiv.textContent = 'Sesión iniciada exitosamente!';
          statusDiv.style.color = 'green';
          setTimeout(() => {
            window.location.hash = '#/account';
          }, 1000);
        } catch (e) {
          console.error('Error en login:', e);
          statusDiv.textContent = `Error: ${e.message}`;
          statusDiv.style.color = 'red';
        } finally {
          loginButton.disabled = false;
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
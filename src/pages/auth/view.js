import { auth } from '../../js/firebase.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

function renderForm(root) {
  root.innerHTML = `
    <section class="py-12 bg-white">
      <div class="container mx-auto max-w-md">
        <h2 class="text-2xl font-bold text-center mb-6">Iniciar sesión / Registrarse</h2>
        <div class="bg-white p-6 rounded-lg shadow border">
          <label class="block text-sm font-medium mb-1" for="email">Email</label>
          <input id="auth-email" type="email" class="w-full p-3 border rounded mb-4" placeholder="you@example.com" />
          <label class="block text-sm font-medium mb-1" for="password">Contraseña</label>
          <input id="auth-password" type="password" class="w-full p-3 border rounded mb-4" placeholder="••••••••" />
          <div class="grid grid-cols-2 gap-3">
            <button id="btn-register" class="bg-[#22a7d0] text-white font-semibold py-2 rounded">Registrarse</button>
            <button id="btn-login" class="bg-gray-800 text-white font-semibold py-2 rounded">Iniciar sesión</button>
          </div>
          <button id="btn-logout" class="mt-4 w-full bg-red-600 text-white font-semibold py-2 rounded hidden">Cerrar sesión</button>
          <div id="auth-status" class="mt-4 text-sm text-gray-600"></div>
        </div>
      </div>
    </section>
  `;
}

function bindEvents(root) {
  const emailEl = root.querySelector('#auth-email');
  const passEl = root.querySelector('#auth-password');
  const btnRegister = root.querySelector('#btn-register');
  const btnLogin = root.querySelector('#btn-login');
  const btnLogout = root.querySelector('#btn-logout');
  const status = root.querySelector('#auth-status');

  const getCreds = () => ({ email: emailEl.value.trim(), password: passEl.value });

  btnRegister.addEventListener('click', async () => {
    const { email, password } = getCreds();
    try {
      if (!auth) throw new Error('Firebase no inicializado');
      await createUserWithEmailAndPassword(auth, email, password);
      status.textContent = 'Usuario registrado correctamente.';
    } catch (e) {
      status.textContent = `Error al registrar: ${e.message}`;
    }
  });

  btnLogin.addEventListener('click', async () => {
    const { email, password } = getCreds();
    try {
      if (!auth) throw new Error('Firebase no inicializado');
      await signInWithEmailAndPassword(auth, email, password);
      status.textContent = 'Sesión iniciada.';
    } catch (e) {
      status.textContent = `Error al iniciar sesión: ${e.message}`;
    }
  });

  btnLogout.addEventListener('click', async () => {
    try {
      if (!auth) throw new Error('Firebase no inicializado');
      await signOut(auth);
      status.textContent = 'Sesión cerrada.';
    } catch (e) {
      status.textContent = `Error al cerrar sesión: ${e.message}`;
    }
  });

  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        btnLogout.classList.remove('hidden');
        btnRegister.disabled = true;
        btnLogin.disabled = true;
        status.textContent = `Autenticado como: ${user.email}`;
      } else {
        btnLogout.classList.add('hidden');
        btnRegister.disabled = false;
        btnLogin.disabled = false;
        status.textContent = 'No autenticado.';
      }
    });
  } else {
    status.textContent = 'Firebase no inicializado. Revisa .env y la consola.';
  }
}

export function renderAuthView() {
  const root = document.getElementById('spa-root');
  if (!root) return;
  renderForm(root);
  bindEvents(root);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


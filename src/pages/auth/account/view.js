import { logout, watchAuthState } from '../../../js/auth.js';
import { getUserProfile, updateUserProfile, getUserProducts, addUserProduct, sampleProducts } from '../../../js/userProfile.js';

export async function renderAccountView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  try {
    const response = await fetch('/pages/auth/account.html');
    if (!response.ok) {
      throw new Error(`No se pudo cargar la página de cuenta. Status: ${response.status}`);
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const mainContent = doc.querySelector('main');

    if (mainContent) {
      root.innerHTML = mainContent.innerHTML;
    } else {
      throw new Error('Contenido principal no encontrado en la página de cuenta.');
    }

    // Inicializar la funcionalidad
    initializeAccountPage();

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error general en account:', error);
    root.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
  }
}

function initializeAccountPage() {
  let currentUser = null;

  // Elementos del DOM
  const userEmail = document.getElementById('user-email');
  const userAvatar = document.getElementById('user-avatar');
  const memberSince = document.getElementById('member-since');
  const productsCount = document.getElementById('products-count');
  const totalProducts = document.getElementById('total-products');

  // Tabs
  const tabProfile = document.getElementById('tab-profile');
  const tabProducts = document.getElementById('tab-products');
  const profileSection = document.getElementById('profile-section');
  const productsSection = document.getElementById('products-section');

  // Formulario de perfil
  const profileForm = document.getElementById('profile-form');
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profilePhone = document.getElementById('profile-phone');
  const profileCountry = document.getElementById('profile-country');
  const profileCompany = document.getElementById('profile-company');
  const profileBio = document.getElementById('profile-bio');
  const profileStatus = document.getElementById('profile-status');

  // Lista de productos
  const productsList = document.getElementById('products-list');

  // Botón de logout
  const btnLogout = document.getElementById('btn-logout');

  // Funciones de navegación entre tabs
  function showTab(tabName) {
    if (tabName === 'profile') {
      tabProfile.className = 'py-2 px-1 border-b-2 border-[#22a7d0] font-medium text-[#22a7d0] text-sm';
      tabProducts.className = 'py-2 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 text-sm';
      profileSection.classList.remove('hidden');
      productsSection.classList.add('hidden');
    } else if (tabName === 'products') {
      tabProfile.className = 'py-2 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 text-sm';
      tabProducts.className = 'py-2 px-1 border-b-2 border-[#22a7d0] font-medium text-[#22a7d0] text-sm';
      profileSection.classList.add('hidden');
      productsSection.classList.remove('hidden');
    }
  }

  // Event listeners para tabs
  tabProfile?.addEventListener('click', () => showTab('profile'));
  tabProducts?.addEventListener('click', () => showTab('products'));

  // Cargar perfil del usuario
  async function loadUserProfile(user) {
    try {
      const profile = await getUserProfile(user.uid);

      // Actualizar información básica
      profileName.value = profile.name || user.displayName || '';
      profileEmail.value = user.email || '';
      profilePhone.value = profile.phone || '';
      profileCountry.value = profile.country || '';
      profileCompany.value = profile.company || '';
      profileBio.value = profile.bio || '';

      // Actualizar avatar
      const firstLetter = (profile.name || user.displayName || user.email || 'U').charAt(0).toUpperCase();
      userAvatar.textContent = firstLetter;

      // Fecha de creación
      const createdDate = profile.createdAt?.toDate() || user.metadata?.creationTime ? new Date(user.metadata.creationTime) : new Date();
      memberSince.textContent = createdDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    } catch (error) {
      console.error('Error cargando perfil:', error);
      profileStatus.textContent = 'Error cargando datos del perfil';
      profileStatus.style.color = 'red';
    }
  }

  // Cargar productos del usuario
  async function loadUserProducts(user) {
    try {
      const products = await getUserProducts(user.uid);

      // Actualizar contadores
      productsCount.textContent = products.length;
      totalProducts.textContent = products.length;

      // Renderizar lista de productos
      if (products.length === 0) {
        productsList.innerHTML = `
          <div class="text-center py-12 text-gray-500">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
            </div>
            <p class="text-lg font-medium mb-2">No tienes productos todavía</p>
            <p class="text-sm">Explora nuestro catálogo y encuentra las herramientas perfectas para ti.</p>
            <div class="mt-4 space-x-2">
              <a href="#/" class="inline-block bg-[#22a7d0] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Ver Productos
              </a>
              <button id="add-sample-product" class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Agregar Producto de Prueba
              </button>
            </div>
          </div>
        `;

        // Botón para agregar producto de prueba
        const addSampleBtn = document.getElementById('add-sample-product');
        addSampleBtn?.addEventListener('click', async () => {
          try {
            const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
            await addUserProduct(user.uid, randomProduct);
            loadUserProducts(user); // Recargar la lista
            profileStatus.textContent = `Producto "${randomProduct.name}" agregado exitosamente!`;
            profileStatus.style.color = 'green';
            setTimeout(() => {
              profileStatus.textContent = '';
            }, 3000);
          } catch (error) {
            console.error('Error agregando producto:', error);
          }
        });

      } else {
        productsList.innerHTML = products.map(product => `
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <img src="${product.productImage}" alt="${product.productName}" class="w-20 h-20 rounded-lg object-cover">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-1">${product.productName}</h3>
                <p class="text-gray-600 text-sm mb-2">${product.productDescription}</p>
                <div class="flex justify-between items-center">
                  <div class="text-sm text-gray-500">
                    Adquirido: ${product.purchaseDate.toDate().toLocaleDateString('es-ES')}
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-bold text-gray-900">$${product.productPrice}</span>
                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Activo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('');
      }

    } catch (error) {
      console.error('Error cargando productos:', error);
      productsList.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <p>Error cargando productos. Inténtalo de nuevo más tarde.</p>
        </div>
      `;
    }
  }

  // Guardar perfil
  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
      profileStatus.textContent = 'Error: Usuario no autenticado';
      profileStatus.style.color = 'red';
      return;
    }

    try {
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      profileStatus.textContent = 'Guardando cambios...';
      profileStatus.style.color = 'blue';

      const profileData = {
        name: profileName.value.trim(),
        phone: profilePhone.value.trim(),
        country: profileCountry.value,
        company: profileCompany.value.trim(),
        bio: profileBio.value.trim()
      };

      await updateUserProfile(currentUser.uid, profileData);

      profileStatus.textContent = 'Perfil actualizado exitosamente!';
      profileStatus.style.color = 'green';

      // Actualizar avatar si cambió el nombre
      const firstLetter = (profileData.name || currentUser.email || 'U').charAt(0).toUpperCase();
      userAvatar.textContent = firstLetter;

      setTimeout(() => {
        profileStatus.textContent = '';
      }, 3000);

    } catch (error) {
      console.error('Error guardando perfil:', error);
      profileStatus.textContent = `Error: ${error.message}`;
      profileStatus.style.color = 'red';
    } finally {
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Cambios';
    }
  });

  // Logout
  btnLogout?.addEventListener('click', async () => {
    try {
      await logout();
      window.location.hash = '#/auth/login';
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  });

  // Watch del estado de autenticación
  watchAuthState((user) => {
    if (!user) {
      window.location.hash = '#/auth/login';
      return;
    }

    currentUser = user;
    userEmail.textContent = user.email;

    // Cargar datos del usuario
    loadUserProfile(user);
    loadUserProducts(user);
  });
}
import { logout, watchAuthState, changePassword, updateUserDisplayName } from '../../../js/auth.js';
import { getUserProfile, updateUserProfile, getUserProducts, addUserProduct, removeUserProduct, sampleProducts } from '../../../js/userProfile.js';
import { initializeCountrySelect, setGlobalCountry } from '../../../js/countries.js';

export async function renderAccountView(initialTab = 'profile') {
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
    initializeAccountPage(initialTab);

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error general en account:', error);
    root.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
  }
}

function initializeAccountPage(initialTab = 'profile') {
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

  // Botones de acción
  const btnLogout = document.getElementById('btn-logout');
  const btnChangePassword = document.getElementById('btn-change-password');

  // Modal de cambio de contraseña
  const passwordModal = document.getElementById('password-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const passwordForm = document.getElementById('password-form');
  const currentPassword = document.getElementById('current-password');
  const newPassword = document.getElementById('new-password');
  const confirmNewPassword = document.getElementById('confirm-new-password');
  const passwordStatus = document.getElementById('password-status');

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

  // Initialize global country selection
  initializeCountrySelect(profileCountry);

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
    // Hacer disponible globalmente para la función removeUserProduct
    window.accountLoadUserProducts = loadUserProducts;
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
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex items-start gap-4">
              <img src="${product.image || 'https://placehold.co/80x80/1a202c/FFFFFF?text=' + encodeURIComponent(product.name.charAt(0))}" alt="${product.name}" class="w-20 h-20 rounded-lg object-cover shadow-md">
              <div class="flex-1">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-gray-900 text-lg">${product.name}</h3>
                  <div class="flex items-center gap-2">
                    <button class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors" onclick="removeUserProduct('${product.id}', '${user.uid}')" title="Eliminar producto">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
                <div class="flex justify-between items-center mb-3">
                  <div class="text-sm text-gray-500">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Adquirido: ${product.purchaseDate?.toDate ? product.purchaseDate.toDate().toLocaleDateString('es-ES') :
                               product.purchaseDate instanceof Date ? product.purchaseDate.toLocaleDateString('es-ES') :
                               'Fecha no disponible'}
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-xl font-bold text-[#22a7d0]">${product.price === 0 ? 'Gratis' : `$${product.price}`}</span>
                    <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
                      <span class="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></span>
                      Activo
                    </span>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <a href="#/dashboard/${product.id}" class="inline-flex items-center px-4 py-2 bg-[#22a7d0] text-white font-medium rounded-lg hover:bg-[#1e96bc] transition-colors text-sm">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Dashboard
                  </a>
                  <a href="#/product/${product.id}" class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Ver Detalles
                  </a>
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

      // Update global country selection
      setGlobalCountry(profileData.country);

      // Update Firebase display name if name changed
      if (profileData.name && profileData.name !== (currentUser.displayName || '')) {
        await updateUserDisplayName(profileData.name);
      }

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

  // Funciones del modal
  function openPasswordModal() {
    passwordModal.classList.remove('hidden');
    passwordModal.classList.add('flex');
    currentPassword.focus();
  }

  function closePasswordModal() {
    passwordModal.classList.add('hidden');
    passwordModal.classList.remove('flex');
    passwordForm.reset();
    passwordStatus.textContent = '';
  }

  // Event listeners del modal
  btnChangePassword?.addEventListener('click', openPasswordModal);
  modalClose?.addEventListener('click', closePasswordModal);
  modalCancel?.addEventListener('click', closePasswordModal);

  // Cerrar modal al hacer click fuera de él
  passwordModal?.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      closePasswordModal();
    }
  });

  // Formulario de cambio de contraseña
  passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
      passwordStatus.textContent = 'Error: Usuario no autenticado';
      passwordStatus.style.color = 'red';
      return;
    }

    const currentPass = currentPassword.value;
    const newPass = newPassword.value;
    const confirmPass = confirmNewPassword.value;

    // Validar que las contraseñas coincidan
    if (newPass !== confirmPass) {
      passwordStatus.textContent = 'Las nuevas contraseñas no coinciden';
      passwordStatus.style.color = 'red';
      return;
    }

    // Validar longitud mínima
    if (newPass.length < 6) {
      passwordStatus.textContent = 'La nueva contraseña debe tener al menos 6 caracteres';
      passwordStatus.style.color = 'red';
      return;
    }

    // Verificar que la nueva contraseña sea diferente
    if (currentPass === newPass) {
      passwordStatus.textContent = 'La nueva contraseña debe ser diferente a la actual';
      passwordStatus.style.color = 'red';
      return;
    }

    try {
      const submitBtn = passwordForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Cambiando...';

      passwordStatus.textContent = 'Cambiando contraseña...';
      passwordStatus.style.color = 'blue';

      await changePassword(currentPass, newPass);

      passwordStatus.textContent = '¡Contraseña cambiada exitosamente!';
      passwordStatus.style.color = 'green';

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        closePasswordModal();
        profileStatus.textContent = 'Contraseña actualizada exitosamente';
        profileStatus.style.color = 'green';
        setTimeout(() => {
          profileStatus.textContent = '';
        }, 3000);
      }, 2000);

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      let errorMessage = 'Error al cambiar la contraseña';

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La nueva contraseña es muy débil';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por seguridad, necesitas volver a iniciar sesión para cambiar tu contraseña';
      }

      passwordStatus.textContent = errorMessage;
      passwordStatus.style.color = 'red';
    } finally {
      const submitBtn = passwordForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cambiar Contraseña';
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

    // Mostrar la pestaña inicial
    showTab(initialTab);
  });
}

// Función global para eliminar productos (accesible desde el HTML)
window.removeUserProduct = async function(productId, userId) {
  try {
    const confirmed = confirm('¿Estás seguro de que deseas eliminar este producto?');
    if (!confirmed) return;

    await removeUserProduct(userId, productId);

    // Recargar la lista de productos
    const user = { uid: userId };
    const loadUserProducts = window.accountLoadUserProducts;
    if (loadUserProducts) {
      loadUserProducts(user);
    } else {
      // Fallback: recargar la página
      window.location.reload();
    }

    // Mostrar mensaje de éxito
    const profileStatus = document.getElementById('profile-status');
    if (profileStatus) {
      profileStatus.textContent = 'Producto eliminado exitosamente';
      profileStatus.style.color = 'green';
      setTimeout(() => {
        profileStatus.textContent = '';
      }, 3000);
    }

  } catch (error) {
    console.error('Error eliminando producto:', error);
    const profileStatus = document.getElementById('profile-status');
    if (profileStatus) {
      profileStatus.textContent = 'Error al eliminar el producto';
      profileStatus.style.color = 'red';
      setTimeout(() => {
        profileStatus.textContent = '';
      }, 3000);
    }
  }
};
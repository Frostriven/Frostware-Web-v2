import { logout, watchAuthState, changePassword, updateUserDisplayName } from '../../../js/auth.js';
import { getUserProfile, updateUserProfile, getUserProducts, addUserProduct, removeUserProduct, sampleProducts } from '../../../js/userProfile.js';
import { initializeCountrySelect, setGlobalCountry } from '../../../js/countries.js';
import { t, i18n } from '../../../i18n/index.js';

export async function renderAccountView(initialTab = 'profile') {
  const root = document.getElementById('spa-root');
  if (!root) return;

  try {
    // Wait for translations to load
    if (!i18n.translations || Object.keys(i18n.translations).length === 0) {
      console.log('⏳ Waiting for translations to load...');
      await i18n.loadTranslations();
    }

    // Build HTML with translations instead of loading static file
    root.innerHTML = `
      <main class="py-8">
        <div class="container mx-auto max-w-6xl px-6">
          <!-- Header de la cuenta -->
          <div class="mb-8">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-16 h-16 rounded-full bg-gradient-to-r from-[#22a7d0] to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                <span id="user-avatar">U</span>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">${t('account.title')}</h1>
                <p id="user-email" class="text-gray-600">${t('account.loading')}</p>
              </div>
            </div>
            <div class="border-b border-gray-200">
              <nav class="flex space-x-8">
                <button id="tab-profile" class="py-2 px-1 border-b-2 border-[#22a7d0] font-medium text-[#22a7d0] text-sm">
                  ${t('account.tabs.profile')}
                </button>
                <button id="tab-products" class="py-2 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 text-sm">
                  ${t('account.tabs.products')}
                </button>
              </nav>
            </div>
          </div>

          <!-- Tab: Perfil -->
          <div id="profile-section" class="tab-content">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- Información personal -->
              <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow border p-6">
                  <h2 class="text-xl font-semibold text-gray-900 mb-6">${t('account.profile.title')}</h2>
                  <form id="profile-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label for="profile-name" class="block text-sm font-medium text-gray-700 mb-1">${t('account.profile.fullName')}</label>
                        <input type="text" id="profile-name" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent" placeholder="${t('account.profile.fullNamePlaceholder')}">
                      </div>
                      <div>
                        <label for="profile-email" class="block text-sm font-medium text-gray-700 mb-1">${t('account.profile.email')}</label>
                        <input type="email" id="profile-email" class="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="${t('account.profile.emailPlaceholder')}" readonly disabled>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label for="profile-phone" class="block text-sm font-medium text-gray-700 mb-1">${t('account.profile.phone')}</label>
                        <input type="tel" id="profile-phone" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent" placeholder="${t('account.profile.phonePlaceholder')}">
                      </div>
                      <div>
                        <label for="profile-country" class="block text-sm font-medium text-gray-700 mb-1">${t('account.profile.country')}</label>
                        <select id="profile-country" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent">
                          <!-- Countries will be populated by JavaScript -->
                        </select>
                      </div>
                    </div>

                    <div>
                      <label for="profile-company" class="block text-sm font-medium text-gray-700 mb-1">${t('account.profile.company')}</label>
                      <input type="text" id="profile-company" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent" placeholder="${t('account.profile.companyPlaceholder')}">
                    </div>

                    <div>
                      <label for="profile-bio" class="block text-sm font-medium text-gray-700 mb-1">${t('account.profile.bio')}</label>
                      <textarea id="profile-bio" rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent" placeholder="${t('account.profile.bioPlaceholder')}"></textarea>
                    </div>

                    <div class="flex justify-between items-center pt-4">
                      <div id="profile-status" class="text-sm"></div>
                      <button type="submit" class="save-changes-btn bg-[#22a7d0] text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-[#1a8db3] hover:shadow-[0_0_20px_rgba(34,167,208,0.5)] hover:scale-105">
                        ${t('account.profile.saveChanges')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- Información de la cuenta -->
              <div class="space-y-6">
                <div class="bg-white rounded-lg shadow border p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">${t('account.status.title')}</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-600">${t('account.status.accountType')}</span>
                      <span class="font-medium text-green-600">${t('account.status.freeAccount')}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">${t('account.status.productsAcquired')}</span>
                      <span id="products-count" class="font-medium">0</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">${t('account.status.memberSince')}</span>
                      <span id="member-since" class="font-medium">-</span>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow border p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">${t('account.actions.title')}</h3>
                  <div class="space-y-3">
                    <button id="btn-change-password" class="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      ${t('account.actions.changePassword')}
                    </button>
                    <button id="btn-logout" class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      ${t('account.actions.logout')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Productos -->
          <div id="products-section" class="tab-content hidden">
            <div class="bg-white rounded-lg shadow border p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-semibold text-gray-900">${t('account.products.title')}</h2>
                <span class="text-sm text-gray-500">${t('account.products.total')} <span id="total-products">0</span> ${t('account.products.totalProducts')}</span>
              </div>

              <!-- Lista de productos -->
              <div id="products-list" class="space-y-4">
                <!-- Los productos se cargarán aquí dinámicamente -->
              </div>
            </div>
          </div>

        </div>
      </main>

      <!-- Modal para cambio de contraseña -->
      <div id="password-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg shadow-2xl max-w-md w-full m-4">
          <div class="p-6 border-b flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">${t('account.passwordModal.title')}</h2>
            <button id="modal-close" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div class="p-6">
            <form id="password-form" class="space-y-4">
              <div>
                <label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">${t('account.passwordModal.currentPassword')}</label>
                <input type="password" id="current-password" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent" placeholder="${t('account.passwordModal.currentPasswordPlaceholder')}" required>
              </div>
              <div>
                <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">${t('account.passwordModal.newPassword')}</label>
                <input type="password" id="new-password" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent" placeholder="${t('account.passwordModal.newPasswordPlaceholder')}" required minlength="6">
              </div>
              <div>
                <label for="confirm-new-password" class="block text-sm font-medium text-gray-700 mb-1">${t('account.passwordModal.confirmPassword')}</label>
                <input type="password" id="confirm-new-password" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent" placeholder="${t('account.passwordModal.confirmPasswordPlaceholder')}" required minlength="6">
              </div>
              <div id="password-status" class="text-sm text-center"></div>
              <div class="flex gap-3 pt-4">
                <button type="button" id="modal-cancel" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  ${t('account.passwordModal.cancel')}
                </button>
                <button type="submit" class="flex-1 px-4 py-2 bg-[#22a7d0] text-white rounded-lg hover:bg-blue-600 transition-colors">
                  ${t('account.passwordModal.changePassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Inicializar la funcionalidad
    initializeAccountPage(initialTab);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Add listener for language changes
    const handleLanguageChange = () => {
      setTimeout(() => {
        // Re-render the account page with new language
        renderAccountView(initialTab);
      }, 100);
    };

    // Remove existing listener to avoid duplicates
    window.removeEventListener('languageChanged', handleLanguageChange);
    // Add new listener
    window.addEventListener('languageChanged', handleLanguageChange);

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
      const lang = i18n.getCurrentLanguage();
      profileStatus.textContent = lang === 'es' ? 'Error cargando datos del perfil' : 'Error loading profile data';
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
            <p class="text-lg font-medium mb-2">${t('account.products.noProducts')}</p>
            <p class="text-sm">${t('account.products.noProductsDescription')}</p>
            <div class="mt-4 space-x-2">
              <a href="#/" class="inline-block bg-[#22a7d0] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                ${t('account.products.viewProducts')}
              </a>
              <button id="add-sample-product" class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                ${i18n.getCurrentLanguage() === 'es' ? 'Agregar Producto de Prueba' : 'Add Sample Product'}
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
            const lang = i18n.getCurrentLanguage();
            profileStatus.textContent = lang === 'es' ? `Producto "${randomProduct.name}" agregado exitosamente!` : `Product "${randomProduct.name}" added successfully!`;
            profileStatus.style.color = 'green';
            setTimeout(() => {
              profileStatus.textContent = '';
            }, 3000);
          } catch (error) {
            console.error('Error agregando producto:', error);
          }
        });

      } else {
        productsList.innerHTML = products.map(product => {
          // Handle name that might be an object
          const currentLang = i18n.getCurrentLanguage();

          let name = '';
          if (typeof product.name === 'object' && product.name !== null) {
            name = product.name[currentLang] || product.name['en'] || product.name['es'] || '';
          } else {
            name = product.name || '';
          }

          // Handle description that might be an object
          let description = '';
          if (typeof product.description === 'object' && product.description !== null) {
            description = product.description[currentLang] || product.description['en'] || product.description['es'] || '';
          } else {
            description = product.description || '';
          }

          // Handle date formatting based on current language
          const dateLocale = currentLang === 'es' ? 'es-ES' : 'en-US';
          const formattedDate = product.purchaseDate?.toDate ? product.purchaseDate.toDate().toLocaleDateString(dateLocale) :
            product.purchaseDate instanceof Date ? product.purchaseDate.toLocaleDateString(dateLocale) :
              t('account.product.dateNotAvailable');

          return `
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex items-start gap-4">
              <img src="${product.imageURL || product.image || 'https://placehold.co/80x80/1a202c/FFFFFF?text=' + encodeURIComponent(name.charAt(0))}" alt="${name}" class="w-20 h-20 rounded-lg object-cover shadow-md">
              <div class="flex-1">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-gray-900 text-lg">${name}</h3>
                  <div class="flex items-center gap-2">
                    <button class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors" onclick="removeUserProduct('${product.id}', '${user.uid}')" title="Eliminar producto">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${description}</p>
                <div class="flex justify-between items-center mb-3">
                  <div class="text-sm text-gray-500">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    ${t('account.product.acquired')}: ${formattedDate}
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-xl font-bold text-[#22a7d0]">${product.price === 0 ? t('cart.price.free') : `$${product.price}`}</span>
                    <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
                      <span class="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></span>
                      ${t('account.product.active')}
                    </span>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <a href="#/dashboard/${product.id}" class="inline-flex items-center px-4 py-2 bg-[#22a7d0] text-white font-medium rounded-lg hover:bg-[#1e96bc] transition-colors text-sm">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    ${currentLang === 'es' ? 'Dashboard' : 'Dashboard'}
                  </a>
                  <a href="#/product/${product.id}" class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    ${t('account.product.viewDetails')}
                  </a>
                </div>
              </div>
            </div>
          </div>
          `;
        }).join('');
      }

    } catch (error) {
      console.error('Error cargando productos:', error);
      const lang = i18n.getCurrentLanguage();
      productsList.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <p>${lang === 'es' ? 'Error cargando productos. Inténtalo de nuevo más tarde.' : 'Error loading products. Please try again later.'}</p>
        </div>
      `;
    }
  }

  // Guardar perfil
  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
      const lang = i18n.getCurrentLanguage();
      profileStatus.textContent = lang === 'es' ? 'Error: Usuario no autenticado' : 'Error: User not authenticated';
      profileStatus.style.color = 'red';
      return;
    }

    try {
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = i18n.getCurrentLanguage() === 'es' ? 'Guardando...' : 'Saving...';

      profileStatus.textContent = i18n.getCurrentLanguage() === 'es' ? 'Guardando cambios...' : 'Saving changes...';
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

      profileStatus.textContent = t('account.profile.changesSaved');
      profileStatus.style.color = 'green';

      // Actualizar avatar si cambió el nombre
      const firstLetter = (profileData.name || currentUser.email || 'U').charAt(0).toUpperCase();
      userAvatar.textContent = firstLetter;

      setTimeout(() => {
        profileStatus.textContent = '';
      }, 3000);

    } catch (error) {
      console.error('Error guardando perfil:', error);
      profileStatus.textContent = t('account.profile.errorSaving') + `: ${error.message}`;
      profileStatus.style.color = 'red';
    } finally {
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = t('account.profile.saveChanges');
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
      const lang = i18n.getCurrentLanguage();
      passwordStatus.textContent = lang === 'es' ? 'Error: Usuario no autenticado' : 'Error: User not authenticated';
      passwordStatus.style.color = 'red';
      return;
    }

    const currentPass = currentPassword.value;
    const newPass = newPassword.value;
    const confirmPass = confirmNewPassword.value;

    // Validar que las contraseñas coincidan
    if (newPass !== confirmPass) {
      passwordStatus.textContent = t('account.passwordModal.passwordsDoNotMatch');
      passwordStatus.style.color = 'red';
      return;
    }

    // Validar longitud mínima
    if (newPass.length < 6) {
      passwordStatus.textContent = t('account.passwordModal.passwordTooShort');
      passwordStatus.style.color = 'red';
      return;
    }

    // Verificar que la nueva contraseña sea diferente
    if (currentPass === newPass) {
      passwordStatus.textContent = i18n.getCurrentLanguage() === 'es' ? 'La nueva contraseña debe ser diferente a la actual' : 'New password must be different from current';
      passwordStatus.style.color = 'red';
      return;
    }

    try {
      const submitBtn = passwordForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = i18n.getCurrentLanguage() === 'es' ? 'Cambiando...' : 'Changing...';

      passwordStatus.textContent = i18n.getCurrentLanguage() === 'es' ? 'Cambiando contraseña...' : 'Changing password...';
      passwordStatus.style.color = 'blue';

      await changePassword(currentPass, newPass);

      passwordStatus.textContent = t('account.passwordModal.passwordChanged');
      passwordStatus.style.color = 'green';

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        closePasswordModal();
        profileStatus.textContent = t('account.passwordModal.passwordChanged');
        profileStatus.style.color = 'green';
        setTimeout(() => {
          profileStatus.textContent = '';
        }, 3000);
      }, 2000);

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      const lang = i18n.getCurrentLanguage();
      let errorMessage = lang === 'es' ? 'Error al cambiar la contraseña' : 'Error changing password';

      if (error.code === 'auth/wrong-password') {
        errorMessage = lang === 'es' ? 'La contraseña actual es incorrecta' : 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = lang === 'es' ? 'La nueva contraseña es muy débil' : 'New password is too weak';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = lang === 'es' ? 'Por seguridad, necesitas volver a iniciar sesión para cambiar tu contraseña' : 'For security, you need to log in again to change your password';
      }

      passwordStatus.textContent = errorMessage;
      passwordStatus.style.color = 'red';
    } finally {
      const submitBtn = passwordForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = t('account.passwordModal.changePassword');
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
window.removeUserProduct = async function (productId, userId) {
  try {
    const lang = i18n.getCurrentLanguage();
    const confirmed = confirm(lang === 'es' ? '¿Estás seguro de que deseas eliminar este producto?' : 'Are you sure you want to delete this product?');
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
      profileStatus.textContent = lang === 'es' ? 'Producto eliminado exitosamente' : 'Product deleted successfully';
      profileStatus.style.color = 'green';
      setTimeout(() => {
        profileStatus.textContent = '';
      }, 3000);
    }

  } catch (error) {
    console.error('Error eliminando producto:', error);
    const lang = i18n.getCurrentLanguage();
    const profileStatus = document.getElementById('profile-status');
    if (profileStatus) {
      profileStatus.textContent = lang === 'es' ? 'Error al eliminar el producto' : 'Error deleting product';
      profileStatus.style.color = 'red';
      setTimeout(() => {
        profileStatus.textContent = '';
      }, 3000);
    }
  }
};
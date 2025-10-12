import { t, i18n } from '../i18n/index.js';
import { getFlagSVG } from '../i18n/flags.js';

// Make changeLanguage function available globally
window.changeLanguage = function(lang) {
  i18n.setLanguage(lang);
  updateAccountTranslations();
  // Close dropdown after selection
  const dropdown = document.getElementById('language-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
  }
};

/**
 * Update the static header with dynamic language selector
 */
function updateHeaderWithLanguageSelector() {
  const header = document.querySelector('header');
  if (!header) return;

  const currentLang = i18n.getCurrentLanguage();

  // Update the header with translated navigation
  header.innerHTML = `
    <nav class="container mx-auto px-6 py-3 flex justify-between items-center">
      <div class="flex items-center">
        <div class="logo-icon mr-2">
          <div class="arc-1"></div>
          <div class="arc-2"></div>
        </div>
        <a class="text-white text-xl font-bold" href="#/">Frostware</a>
      </div>
      <div class="hidden md:flex items-center space-x-1">
        <a class="py-2 px-3 text-gray-300 hover:text-white" href="#/">${t('navigation.home')}</a>
        <a class="py-2 px-3 text-gray-300 hover:text-white" href="#/products">${t('navigation.products')}</a>
        <a class="py-2 px-3 text-gray-300 hover:text-white" href="#/terms">${t('navigation.terms')}</a>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Language Selector -->
        <div class="relative">
          <button id="language-selector" class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white">
            <div class="w-5 h-5">${getFlagSVG(currentLang)}</div>
            <span class="text-sm font-medium">${currentLang.toUpperCase()}</span>
            <svg class="w-4 h-4 transition-transform duration-200" id="language-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <div id="language-dropdown" class="hidden absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <button onclick="changeLanguage('es')" class="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900 ${currentLang === 'es' ? 'bg-blue-50 text-blue-700' : ''}">
              <div class="w-5 h-5 mr-3">${getFlagSVG('es')}</div>
              <span class="font-medium">Español</span>
              ${currentLang === 'es' ? '<svg class="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
            </button>
            <button onclick="changeLanguage('en')" class="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900 ${currentLang === 'en' ? 'bg-blue-50 text-blue-700' : ''}">
              <div class="w-5 h-5 mr-3">${getFlagSVG('en')}</div>
              <span class="font-medium">English</span>
              ${currentLang === 'en' ? '<svg class="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
            </button>
          </div>
        </div>

        <a class="cta-button bg-red-600 text-white font-bold py-2 px-4 rounded-lg" href="#/auth/login">${t('navigation.logout')}</a>
      </div>
    </nav>
  `;

  // Setup language selector dropdown toggle
  setupLanguageDropdown();
}

/**
 * Setup language dropdown toggle functionality
 */
function setupLanguageDropdown() {
  const languageSelector = document.getElementById('language-selector');
  const languageDropdown = document.getElementById('language-dropdown');
  const languageChevron = document.getElementById('language-chevron');

  if (languageSelector && languageDropdown) {
    languageSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      languageDropdown.classList.toggle('hidden');
      if (languageChevron) {
        languageChevron.style.transform = languageDropdown.classList.contains('hidden')
          ? 'rotate(0deg)'
          : 'rotate(180deg)';
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      if (!languageDropdown.classList.contains('hidden')) {
        languageDropdown.classList.add('hidden');
        if (languageChevron) {
          languageChevron.style.transform = 'rotate(0deg)';
        }
      }
    });
  }
}

export function updateAccountTranslations() {
  console.log('🌐 Updating account page translations...');
  console.log('Current language:', i18n.getCurrentLanguage());
  console.log('Test translation account.title:', t('account.title'));

  // Update header with dynamic language selector
  updateHeaderWithLanguageSelector();

  // Account title and tabs
  updateElementText('account_title', 'account.title');
  updateElementText('account_tab_profile', 'account.tabs.profile');
  updateElementText('account_tab_products', 'account.tabs.products');

  // Profile section
  updateElementText('account_profile_title', 'account.profile.title');
  updateElementText('account_profile_fullName', 'account.profile.fullName');
  updateElementText('account_profile_email', 'account.profile.email');
  updateElementText('account_profile_phone', 'account.profile.phone');
  updateElementText('account_profile_country', 'account.profile.country');
  updateElementText('account_profile_company', 'account.profile.company');
  updateElementText('account_profile_bio', 'account.profile.bio');
  updateElementText('account_profile_saveChanges', 'account.profile.saveChanges');

  // Update placeholders
  updatePlaceholder('account_profile_fullNamePlaceholder', 'account.profile.fullNamePlaceholder');
  updatePlaceholder('account_profile_emailPlaceholder', 'account.profile.emailPlaceholder');
  updatePlaceholder('account_profile_phonePlaceholder', 'account.profile.phonePlaceholder');
  updatePlaceholder('account_profile_companyPlaceholder', 'account.profile.companyPlaceholder');
  updatePlaceholder('account_profile_bioPlaceholder', 'account.profile.bioPlaceholder');

  // Account status section
  updateElementText('account_status_title', 'account.status.title');
  updateElementText('account_status_accountType', 'account.status.accountType');
  updateElementText('account_status_freeAccount', 'account.status.freeAccount');
  updateElementText('account_status_productsAcquired', 'account.status.productsAcquired');
  updateElementText('account_status_memberSince', 'account.status.memberSince');

  // Account actions section
  updateElementText('account_actions_title', 'account.actions.title');
  updateElementText('account_actions_changePassword', 'account.actions.changePassword');
  updateElementText('account_actions_logout', 'account.actions.logout');

  // Products section
  updateElementText('account_products_title', 'account.products.title');
  updateElementText('account_products_total', 'account.products.total');
  updateElementText('account_products_totalProducts', 'account.products.totalProducts');
  updateElementText('account_products_noProducts', 'account.products.noProducts');
  updateElementText('account_products_noProductsDescription', 'account.products.noProductsDescription');
  updateElementText('account_products_viewProducts', 'account.products.viewProducts');

  // Password modal
  updateElementText('account_passwordModal_title', 'account.passwordModal.title');
  updateElementText('account_passwordModal_currentPassword', 'account.passwordModal.currentPassword');
  updateElementText('account_passwordModal_newPassword', 'account.passwordModal.newPassword');
  updateElementText('account_passwordModal_confirmPassword', 'account.passwordModal.confirmPassword');
  updateElementText('account_passwordModal_cancel', 'account.passwordModal.cancel');
  updateElementText('account_passwordModal_changePassword', 'account.passwordModal.changePassword');

  // Update password modal placeholders
  updatePlaceholder('account_passwordModal_currentPasswordPlaceholder', 'account.passwordModal.currentPasswordPlaceholder');
  updatePlaceholder('account_passwordModal_newPasswordPlaceholder', 'account.passwordModal.newPasswordPlaceholder');
  updatePlaceholder('account_passwordModal_confirmPasswordPlaceholder', 'account.passwordModal.confirmPasswordPlaceholder');

  console.log('✅ Account page translations updated');
}

/**
 * Helper function to update element text content
 */
function updateElementText(dataKey, translationKey) {
  const element = document.querySelector(`[data-translate-key="${dataKey}"]`);
  if (element) {
    const translatedText = t(translationKey);
    console.log(`✏️ Updating ${dataKey}: "${translatedText}"`);
    element.textContent = translatedText;
  } else {
    console.warn(`⚠️ Element with data-translate-key="${dataKey}" not found`);
  }
}

/**
 * Helper function to update input/textarea placeholders
 */
function updatePlaceholder(dataKey, translationKey) {
  const element = document.querySelector(`[data-translate-placeholder="${dataKey}"]`);
  if (element) {
    element.placeholder = t(translationKey);
  }
}

// Listen for language change events
window.addEventListener('languageChanged', () => {
  console.log('🔄 Language changed, updating account translations...');
  setTimeout(updateAccountTranslations, 100);
});

// Update translations when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateAccountTranslations);
} else {
  updateAccountTranslations();
}

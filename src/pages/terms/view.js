import { t, i18n } from '../../i18n/index.js';

export async function renderTermsView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  const html = `
    <div class="min-h-screen bg-gray-50 pt-20">
      <div class="max-w-4xl mx-auto px-6 py-12">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ${t('terms.title')}
          </h1>
          <p class="text-gray-600">
            ${t('terms.lastUpdated')}
          </p>
        </div>

        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg">
          <h2 class="text-xl font-bold text-yellow-800 mb-3 flex items-center">
            ⚠️ ${t('terms.disclaimer.title')}
          </h2>
          <p class="text-yellow-700">
            ${t('terms.disclaimer.content')}
          </p>
        </div>

        <div class="space-y-8">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.acceptance.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('terms.acceptance.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.useRestrictions.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed mb-4">
              ${t('terms.useRestrictions.intro')}
            </p>
            <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
              ${(() => {
                const list = t('terms.useRestrictions.list');
                if (Array.isArray(list)) {
                  return list.map(item => `<li>${item}</li>`).join('');
                } else {
                  return list.split(',').map(item => `<li>${item.trim()}</li>`).join('');
                }
              })()}
            </ul>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.intellectualProperty.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('terms.intellectualProperty.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.liability.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('terms.liability.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.indemnification.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('terms.indemnification.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.termination.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('terms.termination.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.changes.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('terms.changes.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.governingLaw.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('terms.governingLaw.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('terms.contact.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('terms.contact.content')}
            </p>
          </div>
        </div>

        <div class="text-center mt-12">
          <a href="#/contact" class="inline-flex items-center px-6 py-3 bg-[#22a7d0] text-white font-semibold rounded-lg hover:bg-[#1e96bc] transition-colors">
            ${t('terms.contactLink')}
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `;

  // Wrap it in a container with fade-in animation
  root.innerHTML = `<div class="opacity-0 transform translate-y-4 transition-all duration-700">${html}</div>`;

  // Trigger entrance animation
  setTimeout(() => {
    const container = root.querySelector('.opacity-0');
    if (container) {
      container.classList.remove('opacity-0', 'translate-y-4');
      container.classList.add('opacity-100', 'translate-y-0');
    }
  }, 50);

  console.log('✅ Terms page rendered');

  // Listen for language changes and re-render
  const handleLanguageChange = () => {
    renderTermsView();
  };

  // Remove any existing listener to avoid duplicates
  window.removeEventListener('languageChanged', handleLanguageChange);
  // Add new listener
  window.addEventListener('languageChanged', handleLanguageChange);
}
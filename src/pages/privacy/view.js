import { t, i18n } from '../../i18n/index.js';

export async function renderPrivacyView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  const html = `
    <div class="min-h-screen bg-gray-50 pt-20">
      <div class="max-w-4xl mx-auto px-6 py-12">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ${t('privacy.title')}
          </h1>
          <p class="text-gray-600">
            ${t('privacy.lastUpdated')}
          </p>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8 rounded-r-lg">
          <p class="text-blue-800">
            ${t('privacy.commitment')}
          </p>
        </div>

        <div class="space-y-8">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('privacy.collection.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed mb-4">
              ${t('privacy.collection.intro')}
            </p>

            <h3 class="text-xl font-semibold text-gray-800 mb-3">
              ${t('privacy.collection.personal.title')}
            </h3>
            <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-6">
              ${(() => {
                const list = t('privacy.collection.personal.list');
                if (Array.isArray(list)) {
                  return list.map(item => `<li>${item}</li>`).join('');
                } else {
                  return list.split(',').map(item => `<li>${item.trim()}</li>`).join('');
                }
              })()}
            </ul>

            <h3 class="text-xl font-semibold text-gray-800 mb-3">
              ${t('privacy.collection.technical.title')}
            </h3>
            <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
              ${(() => {
                const list = t('privacy.collection.technical.list');
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
              ${t('privacy.use.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed mb-4">
              ${t('privacy.use.intro')}
            </p>
            <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
              ${(() => {
                const list = t('privacy.use.list');
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
              ${t('privacy.protection.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed mb-4">
              ${t('privacy.protection.content')}
            </p>
            <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
              ${(() => {
                const list = t('privacy.protection.measures');
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
              ${t('privacy.sharing.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed mb-4">
              ${t('privacy.sharing.content')}
            </p>
            <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
              ${(() => {
                const list = t('privacy.sharing.exceptions');
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
              ${t('privacy.cookies.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed mb-6">
              ${t('privacy.cookies.content')}
            </p>

            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-300 rounded-lg">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                      ${t('privacy.cookies.table.type')}
                    </th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                      ${t('privacy.cookies.table.purpose')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="border border-gray-300 px-4 py-3">${t('privacy.cookies.essential.name')}</td>
                    <td class="border border-gray-300 px-4 py-3">${t('privacy.cookies.essential.desc')}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 px-4 py-3">${t('privacy.cookies.analytics.name')}</td>
                    <td class="border border-gray-300 px-4 py-3">${t('privacy.cookies.analytics.desc')}</td>
                  </tr>
                  <tr>
                    <td class="border border-gray-300 px-4 py-3">${t('privacy.cookies.preferences.name')}</td>
                    <td class="border border-gray-300 px-4 py-3">${t('privacy.cookies.preferences.desc')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('privacy.retention.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('privacy.retention.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('privacy.rights.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed mb-4">
              ${t('privacy.rights.intro')}
            </p>
            <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
              ${(() => {
                const list = t('privacy.rights.list');
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
              ${t('privacy.children.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('privacy.children.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('privacy.changes.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('privacy.changes.content')}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              ${t('privacy.contact.title')}
            </h2>
            <p class="text-gray-700 leading-relaxed">
              ${t('privacy.contact.content')}
            </p>
          </div>
        </div>

        <div class="text-center mt-12">
          <a href="#/contact" class="inline-flex items-center px-6 py-3 bg-[#22a7d0] text-white font-semibold rounded-lg hover:bg-[#1e96bc] transition-colors">
            ${t('privacy.contactLink')}
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

  console.log('✅ Privacy page rendered');

  // Listen for language changes and re-render
  const handleLanguageChange = () => {
    renderPrivacyView();
  };

  // Remove any existing listener to avoid duplicates
  window.removeEventListener('languageChanged', handleLanguageChange);
  // Add new listener
  window.addEventListener('languageChanged', handleLanguageChange);
}
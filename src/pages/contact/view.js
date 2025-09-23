import { t, i18n } from '../../i18n/index.js';

export async function renderContactView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  const html = `
    <div class="min-h-screen bg-gray-50 pt-20">
      <div class="max-w-6xl mx-auto px-6 py-12">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ${t('contact.title')}
          </h1>
          <p class="text-xl text-gray-600">
            ${t('contact.subtitle')}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <!-- Contact Form -->
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              ${t('contact.form.title')}
            </h2>

            <div id="success-message" class="hidden mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
              <p class="text-green-800">${t('contact.form.success')}</p>
            </div>

            <div id="error-message" class="hidden mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <p class="text-red-800">${t('contact.form.error')}</p>
            </div>

            <form id="contact-form" class="space-y-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  ${t('contact.form.name')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent transition-colors"
                >
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  ${t('contact.form.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent transition-colors"
                >
              </div>

              <div>
                <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                  ${t('contact.form.subject')}
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent transition-colors"
                >
                  <option value="">${t('contact.form.subject.choose')}</option>
                  <option value="support">${t('contact.form.subject.support')}</option>
                  <option value="sales">${t('contact.form.subject.sales')}</option>
                  <option value="partnership">${t('contact.form.subject.partnership')}</option>
                  <option value="bug">${t('contact.form.subject.bug')}</option>
                  <option value="other">${t('contact.form.subject.other')}</option>
                </select>
              </div>

              <div>
                <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                  ${t('contact.form.message')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows="5"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22a7d0] focus:border-transparent transition-colors resize-vertical"
                ></textarea>
              </div>

              <button
                type="submit"
                class="w-full bg-[#22a7d0] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1e96bc] transition-colors focus:ring-2 focus:ring-[#22a7d0] focus:ring-offset-2"
              >
                ${t('contact.form.submit')}
              </button>
            </form>
          </div>

          <!-- Contact Information -->
          <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">
                ${t('contact.info.title')}
              </h2>

              <div class="space-y-4">
                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 bg-[#22a7d0] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">${t('contact.info.email')}</h3>
                    <p class="text-gray-600">support@frostware.com</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 bg-[#22a7d0] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">Discord</h3>
                    <p class="text-gray-600">Frostware Community</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 bg-[#22a7d0] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">${t('contact.info.hours')}</h3>
                    <p class="text-gray-600">${t('contact.info.hours.detail')}</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 bg-[#22a7d0] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-[#22a7d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">${t('contact.info.location')}</h3>
                    <p class="text-gray-600">${t('contact.info.location.detail')}</p>
                  </div>
                </div>
              </div>

              <div class="mt-8 pt-6 border-t border-gray-200">
                <div class="flex space-x-4">
                  <a href="#" class="w-10 h-10 bg-[#22a7d0] text-white rounded-lg flex items-center justify-center hover:bg-[#1e96bc] transition-colors">
                    <span class="text-sm">💬</span>
                  </a>
                  <a href="#" class="w-10 h-10 bg-[#22a7d0] text-white rounded-lg flex items-center justify-center hover:bg-[#1e96bc] transition-colors">
                    <span class="text-sm">✈️</span>
                  </a>
                  <a href="#" class="w-10 h-10 bg-[#22a7d0] text-white rounded-lg flex items-center justify-center hover:bg-[#1e96bc] transition-colors">
                    <span class="text-sm">🐙</span>
                  </a>
                  <a href="#" class="w-10 h-10 bg-[#22a7d0] text-white rounded-lg flex items-center justify-center hover:bg-[#1e96bc] transition-colors">
                    <span class="text-sm">🐦</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">
            ${t('contact.faq.title')}
          </h2>

          <div class="space-y-6">
            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                ${t('contact.faq.q1')}
              </h3>
              <p class="text-gray-700">
                ${t('contact.faq.a1')}
              </p>
            </div>

            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                ${t('contact.faq.q2')}
              </h3>
              <p class="text-gray-700">
                ${t('contact.faq.a2')}
              </p>
            </div>

            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                ${t('contact.faq.q3')}
              </h3>
              <p class="text-gray-700">
                ${t('contact.faq.a3')}
              </p>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                ${t('contact.faq.q4')}
              </h3>
              <p class="text-gray-700">
                ${t('contact.faq.a4')}
              </p>
            </div>
          </div>
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

  // Initialize contact form
  initializeContactForm();

  console.log('✅ Contact page rendered');

  // Listen for language changes and re-render
  const handleLanguageChange = () => {
    renderContactView();
  };

  // Remove any existing listener to avoid duplicates
  window.removeEventListener('languageChanged', handleLanguageChange);
  // Add new listener
  window.addEventListener('languageChanged', handleLanguageChange);
}

function initializeContactForm() {
  const form = document.getElementById('contact-form');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      // Hide previous messages
      successMessage.classList.add('hidden');
      errorMessage.classList.add('hidden');

      // Simulate form submission
      setTimeout(() => {
        successMessage.classList.remove('hidden');
        form.reset();

        // Hide success message after 5 seconds
        setTimeout(() => {
          successMessage.classList.add('hidden');
        }, 5000);
      }, 1000);
    });
  }
}
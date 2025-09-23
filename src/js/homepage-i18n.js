import { t } from '../i18n/index.js';

export function updateHomepageTranslations() {
  // Update hero section
  const heroTitleElement = document.querySelector('[data-translate-key="hero_title"]');
  const heroSubtitle = document.querySelector('[data-translate-key="hero_subtitle"]');
  const heroCta = document.querySelector('[data-translate-key="hero_cta"]');

  if (heroTitleElement) {
    const spans = heroTitleElement.querySelectorAll('span');
    if (spans.length >= 2) {
      spans[0].textContent = t('homepage.heroTitle');
      spans[1].textContent = t('homepage.heroTitleHighlight');
    }
  }
  if (heroSubtitle) {
    heroSubtitle.textContent = t('homepage.heroSubtitle');
  }
  if (heroCta) {
    heroCta.textContent = t('homepage.heroCta');
  }

  // Update featured products section
  const featuredTagline = document.querySelector('[data-translate-key="featured_products_tagline"]');
  const featuredTitle = document.querySelector('[data-translate-key="featured_products_title"]');
  const featuredUpdate = document.querySelector('[data-translate-key="featured_products_update"]');

  if (featuredTagline) {
    featuredTagline.textContent = t('homepage.featuredProducts.tagline');
  }
  if (featuredTitle) {
    featuredTitle.textContent = t('homepage.featuredProducts.title');
  }
  if (featuredUpdate) {
    featuredUpdate.textContent = t('homepage.featuredProducts.updateNote');
  }

  // Update stats section
  const statsApps = document.querySelector('[data-translate-key="stats_apps"]');
  const statsUsers = document.querySelector('[data-translate-key="stats_users"]');
  const statsSatisfaction = document.querySelector('[data-translate-key="stats_satisfaction"]');

  if (statsApps) {
    statsApps.textContent = t('homepage.stats.apps');
  }
  if (statsUsers) {
    statsUsers.textContent = t('homepage.stats.users');
  }
  if (statsSatisfaction) {
    statsSatisfaction.textContent = t('homepage.stats.satisfaction');
  }

  // Update testimonials section
  const testimonialsTagline = document.querySelector('[data-translate-key="testimonials_tagline"]');
  const testimonialsTitle = document.querySelector('[data-translate-key="testimonials_title"]');

  if (testimonialsTagline) {
    testimonialsTagline.textContent = t('homepage.testimonials.tagline');
  }
  if (testimonialsTitle) {
    testimonialsTitle.textContent = t('homepage.testimonials.title');
  }

  // Update individual testimonials
  const testimonial1Content = document.querySelector('[data-translate-key="testimonial1_content"]');
  const testimonial1Name = document.querySelector('[data-translate-key="testimonial1_name"]');
  const testimonial1Title = document.querySelector('[data-translate-key="testimonial1_title"]');

  if (testimonial1Content) {
    testimonial1Content.textContent = `"${t('homepage.testimonials.testimonial1.content')}"`;
  }
  if (testimonial1Name) {
    testimonial1Name.textContent = t('homepage.testimonials.testimonial1.name');
  }
  if (testimonial1Title) {
    testimonial1Title.textContent = t('homepage.testimonials.testimonial1.title');
  }

  const testimonial2Content = document.querySelector('[data-translate-key="testimonial2_content"]');
  const testimonial2Name = document.querySelector('[data-translate-key="testimonial2_name"]');
  const testimonial2Title = document.querySelector('[data-translate-key="testimonial2_title"]');

  if (testimonial2Content) {
    testimonial2Content.textContent = `"${t('homepage.testimonials.testimonial2.content')}"`;
  }
  if (testimonial2Name) {
    testimonial2Name.textContent = t('homepage.testimonials.testimonial2.name');
  }
  if (testimonial2Title) {
    testimonial2Title.textContent = t('homepage.testimonials.testimonial2.title');
  }

  const testimonial3Content = document.querySelector('[data-translate-key="testimonial3_content"]');
  const testimonial3Name = document.querySelector('[data-translate-key="testimonial3_name"]');
  const testimonial3Title = document.querySelector('[data-translate-key="testimonial3_title"]');

  if (testimonial3Content) {
    testimonial3Content.textContent = `"${t('homepage.testimonials.testimonial3.content')}"`;
  }
  if (testimonial3Name) {
    testimonial3Name.textContent = t('homepage.testimonials.testimonial3.name');
  }
  if (testimonial3Title) {
    testimonial3Title.textContent = t('homepage.testimonials.testimonial3.title');
  }

  // Update CTA section
  const ctaTitle = document.querySelector('[data-translate-key="cta_title"]');
  const ctaSubtitle = document.querySelector('[data-translate-key="cta_subtitle"]');
  const ctaButton = document.querySelector('[data-translate-key="cta_button"]');

  if (ctaTitle) {
    ctaTitle.textContent = t('homepage.cta.title');
  }
  if (ctaSubtitle) {
    ctaSubtitle.textContent = t('homepage.cta.subtitle');
  }
  if (ctaButton) {
    ctaButton.textContent = t('homepage.cta.button');
  }

  // Update "Ver Todos los Productos" button
  const viewAllButton = document.querySelector('a[href="#/products"]:has(svg)');
  if (viewAllButton) {
    const buttonText = viewAllButton.childNodes[0];
    if (buttonText && buttonText.nodeType === Node.TEXT_NODE) {
      buttonText.textContent = t('homepage.featuredProducts.viewAll');
    }
  }

  // Load products with translations
  loadProductsWithTranslations();

  console.log('✅ Homepage translations updated');
}

function loadProductsWithTranslations() {
  const container = document.getElementById('latest-products');
  if (!container) return;

  // Clear existing products
  container.innerHTML = '';

  const latestProducts = [
    {
      id: 'nopac',
      image: "https://placehold.co/600x400/1e293b/FFFFFF?text=NOPAC+Procedures&font=inter",
      alt: "NOPAC North Operational Pacific Procedures",
      link: "apps/north-operational-pacific-procedures/guide.html",
      badge: "Q2 2025",
      badgeColor: "blue"
    },
    {
      id: 'gold',
      image: "https://placehold.co/600x400/d97706/FFFFFF?text=GOLD+Datalink&font=inter",
      alt: "GOLD Global Operational Datalink",
      link: "apps/gold-operational-datalink/guide.html",
      badge: "Q1 2025",
      badgeColor: "orange"
    },
    {
      id: 'calculator',
      image: "https://placehold.co/600x400/4c1d95/FFFFFF?text=Flight+Calculator&font=inter",
      alt: "Flight Performance Calculator",
      link: "apps/flight-performance-calculator/guide.html",
      badge: "Professional",
      badgeColor: "purple"
    }
  ];

  latestProducts.forEach(product => {
    const badgeClasses = {
      blue: 'text-blue-600 bg-blue-100',
      orange: 'text-orange-600 bg-orange-100',
      purple: 'text-purple-600 bg-purple-100'
    };

    const title = t(`homepage.products.${product.id}.title`);
    const description = t(`homepage.products.${product.id}.description`);
    const price = t('homepage.products.price');
    const getButton = t('homepage.products.getButton');
    const comingSoon = t('homepage.products.comingSoon');

    const productCard = `
      <div class="product-card bg-white shadow-lg border border-gray-200 flex flex-col hover:shadow-xl transition-shadow duration-300 cursor-pointer" style="border-radius: 14px; overflow: hidden; height: 720px;" onclick="window.location.href='${product.link}'">
        <div class="w-full h-1/2 overflow-hidden" style="border-radius: 14px 14px 0 0;">
          <img src="${product.image}" class="w-full h-full object-cover" alt="${product.alt}">
        </div>
        <div class="p-4 flex flex-col h-1/2 justify-between">
          <div class="flex-grow">
            <h3 class="text-lg font-bold mb-2 text-left">${title}</h3>
            <div class="flex items-center mb-2 star-rating justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span class="text-xs text-gray-500 ml-2">${comingSoon}</span>
            </div>
            <p class="text-gray-600 text-sm text-left line-clamp-2">${description}</p>
          </div>
          <div class="mt-auto">
            <div class="flex justify-between items-center mb-3">
              <span class="text-xl font-bold text-gray-900">${price}</span>
              <span class="text-xs px-2 py-1 rounded-full ${badgeClasses[product.badgeColor]}">${product.badge}</span>
            </div>
            <button class="product-action-button text-center bg-[#22a7d0] text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-[#1e96bc] w-full"
                    data-product-id="${title.toLowerCase().replace(/\s+/g, '-')}"
                    data-product='{"id":"${title.toLowerCase().replace(/\s+/g, '-')}","name":"${title}","description":"${description}","price":0,"image":"${product.image}","category":"aviation"}'>
              ${getButton}
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML += productCard;
  });

  // Reinitialize product buttons after loading
  setTimeout(() => {
    if (window.initializeHomeProductButtons) {
      window.initializeHomeProductButtons();
    }
  }, 100);
}

// Listen for language change events
window.addEventListener('languageChanged', () => {
  setTimeout(updateHomepageTranslations, 100);
});
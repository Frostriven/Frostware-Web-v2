class I18nManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'es';
    this.translations = {};
    this.fallbackLanguage = 'es';
    this.loadTranslations();
  }

  async loadTranslations() {
    try {
      // Cargar traducciones dinámicamente
      const esModule = await import('./languages/es.js');
      const enModule = await import('./languages/en.js');

      this.translations.es = esModule.default || esModule.es;
      this.translations.en = enModule.default || enModule.en;

      console.log('✅ Translations loaded successfully');
    } catch (error) {
      console.error('❌ Error loading translations:', error);
    }
  }

  t(key, params = {}) {
    try {
      // "dashboard.title" → ["dashboard", "title"]
      const keys = key.split('.');
      let value = this.translations[this.currentLanguage];

      // Navegar por las keys
      for (const k of keys) {
        value = value?.[k];
      }

      // Si no existe, intentar con fallback
      if (!value && this.currentLanguage !== this.fallbackLanguage) {
        let fallbackValue = this.translations[this.fallbackLanguage];
        for (const k of keys) {
          fallbackValue = fallbackValue?.[k];
        }
        value = fallbackValue;
      }

      // Si aún no existe, devolver la key
      if (!value) {
        console.warn(`🔸 Missing translation for key: ${key}`);
        return key;
      }

      // Reemplazar parámetros si existen
      if (typeof value === 'string' && Object.keys(params).length > 0) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey] || match;
        });
      }

      return value;
    } catch (error) {
      console.error(`❌ Error translating key: ${key}`, error);
      return key;
    }
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('selectedLanguage', lang);

      // Emitir evento para que las páginas se actualicen
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: lang }
      }));

      console.log(`🌐 Language changed to: ${lang}`);
      return true;
    } else {
      console.error(`❌ Language ${lang} not available`);
      return false;
    }
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return Object.keys(this.translations);
  }
}

// Crear instancia global
export const i18n = new I18nManager();

// Función helper para usar en templates
export const t = (key, params) => i18n.t(key, params);

// Función para cambiar idioma (usar en onclick)
window.changeLanguage = (lang) => {
  if (i18n.setLanguage(lang)) {
    // Recargar la página actual para aplicar nuevas traducciones
    window.location.reload();
  }
};

// Debug helper
window.i18n = i18n;
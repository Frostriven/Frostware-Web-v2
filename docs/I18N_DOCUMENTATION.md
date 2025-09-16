# 🌐 Sistema de Internacionalización (i18n) - Frostware

## 📋 Descripción General

Este sistema permite que el sitio web de Frostware soporte múltiples idiomas de forma dinámica. Actualmente soporta **Español** (predeterminado) e **Inglés**, con la capacidad de agregar más idiomas fácilmente.

## 🏗️ Estructura del Sistema

```
src/
├── i18n/
│   ├── index.js              # Sistema principal i18n
│   ├── flags.js              # SVGs de banderas
│   └── languages/
│       ├── es.js             # Traducciones en español
│       └── en.js             # Traducciones en inglés
└── js/
    ├── main.js               # Integración con header y navegación
    └── homepage-i18n.js      # Actualizaciones de página de inicio
```

## 🛠️ Componentes del Sistema

### 1. **Sistema Principal (`src/i18n/index.js`)**

```javascript
class I18nManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'es';
    this.translations = {};
    this.fallbackLanguage = 'es';
  }

  t(key, params = {}) {
    // Función para obtener traducciones
    // Ejemplo: t('navigation.home') → "Inicio" / "Home"
  }

  setLanguage(lang) {
    // Cambiar idioma y emitir evento
  }
}
```

**Funciones disponibles globalmente:**
- `t(key, params)` - Obtener traducción
- `i18n.setLanguage(lang)` - Cambiar idioma
- `changeLanguage(lang)` - Función para onclick en HTML

### 2. **Archivos de Traducciones**

#### Estructura de `es.js` y `en.js`:
```javascript
export const es = {
  navigation: {
    home: "Inicio",
    products: "Productos",
    // ...
  },
  homepage: {
    heroTitle: "El software no es el límite.",
    // ...
    products: {
      nopac: {
        title: "NOPAC North Operational Pacific Procedures",
        description: "Descripción del producto..."
      }
    }
  },
  cart: {
    title: "Carrito de Compras",
    // ...
  }
};
```

### 3. **Banderas (`src/i18n/flags.js`)**

```javascript
export const flags = {
  es: `<svg>...</svg>`, // Bandera de España
  en: `<svg>...</svg>`  // Bandera de Reino Unido
};

export const getFlagSVG = (language) => {
  return flags[language] || flags.es;
};
```

## 🔧 Cómo Usar el Sistema

### **Método 1: En JavaScript**
```javascript
import { t } from '../i18n/index.js';

// Usar en código
const title = t('homepage.heroTitle');
const description = t('homepage.products.nopac.description');

// Con parámetros
const message = t('welcome.message', { name: 'Usuario' });
// Texto: "Bienvenido {{name}}" → "Bienvenido Usuario"
```

### **Método 2: En HTML con JavaScript**
```html
<!-- En HTML -->
<h1 data-translate-key="hero_title">Texto por defecto</h1>

<!-- En JavaScript -->
const element = document.querySelector('[data-translate-key="hero_title"]');
if (element) {
  element.textContent = t('homepage.heroTitle');
}
```

### **Método 3: En Template Literals**
```javascript
const headerHTML = `
  <nav>
    <a href="#/">${t('navigation.home')}</a>
    <a href="#/products">${t('navigation.products')}</a>
  </nav>
`;
```

## 📝 Cómo Modificar Textos Existentes

### **1. Cambiar un texto específico:**

**Archivo: `src/i18n/languages/es.js`**
```javascript
export const es = {
  homepage: {
    heroTitle: "Mi nuevo slogan aquí", // ← Cambiar aquí
    heroSubtitle: "Nueva descripción..."
  }
};
```

**Archivo: `src/i18n/languages/en.js`**
```javascript
export const en = {
  homepage: {
    heroTitle: "My new slogan here", // ← Cambiar aquí también
    heroSubtitle: "New description..."
  }
};
```

### **2. Los cambios se aplican automáticamente:**
- Al cambiar idioma con el selector
- Al recargar la página
- No requiere reiniciar el servidor

## ➕ Cómo Agregar Nuevos Textos

### **Paso 1: Agregar a archivos de idioma**

**En `es.js`:**
```javascript
export const es = {
  // ... contenido existente
  newFeature: {
    title: "Nueva Funcionalidad",
    description: "Descripción de la nueva funcionalidad",
    button: "Probar Ahora"
  }
};
```

**En `en.js`:**
```javascript
export const en = {
  // ... contenido existente
  newFeature: {
    title: "New Feature",
    description: "Description of the new feature",
    button: "Try Now"
  }
};
```

### **Paso 2: Usar en el código**

**En JavaScript:**
```javascript
const title = t('newFeature.title');
const description = t('newFeature.description');
```

**En HTML con actualización automática:**
```html
<h2 data-translate-key="new_feature_title">Nueva Funcionalidad</h2>
```

**Agregar a función de actualización:**
```javascript
// En homepage-i18n.js o similar
const newTitle = document.querySelector('[data-translate-key="new_feature_title"]');
if (newTitle) {
  newTitle.textContent = t('newFeature.title');
}
```

## 🌍 Cómo Agregar un Nuevo Idioma

### **Paso 1: Crear archivo de idioma**

**Crear: `src/i18n/languages/fr.js`** (francés como ejemplo)
```javascript
export const fr = {
  navigation: {
    home: "Accueil",
    products: "Produits",
    pricing: "Prix",
    login: "Connexion",
    logout: "Déconnexion",
    myAccount: "Mon Compte",
    admin: "Admin"
  },
  homepage: {
    heroTitle: "Le logiciel n'est pas la limite.",
    heroTitleHighlight: "C'est le point de départ.",
    // ... todas las traducciones
  },
  // ... copiar estructura completa de es.js o en.js
};

export default fr;
```

### **Paso 2: Agregar bandera**

**En `src/i18n/flags.js`:**
```javascript
export const flags = {
  es: `<svg>...</svg>`,
  en: `<svg>...</svg>`,
  fr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16">
    <rect width="8" height="16" fill="#002395"/>
    <rect width="8" height="16" x="8" fill="#ffffff"/>
    <rect width="8" height="16" x="16" fill="#ed2939"/>
  </svg>` // ← Bandera de Francia
};
```

### **Paso 3: Actualizar sistema principal**

**En `src/i18n/index.js`:**
```javascript
async loadTranslations() {
  try {
    const esModule = await import('./languages/es.js');
    const enModule = await import('./languages/en.js');
    const frModule = await import('./languages/fr.js'); // ← Agregar

    this.translations.es = esModule.default || esModule.es;
    this.translations.en = enModule.default || enModule.en;
    this.translations.fr = frModule.default || frModule.fr; // ← Agregar
  } catch (error) {
    console.error('❌ Error loading translations:', error);
  }
}
```

### **Paso 4: Agregar al selector de idioma**

**En `src/js/main.js` (en la función renderHeader):**
```javascript
<div id="language-dropdown" class="hidden absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
  <!-- Botones existentes -->
  <button onclick="changeLanguage('es')" class="...">Español</button>
  <button onclick="changeLanguage('en')" class="...">English</button>

  <!-- Nuevo botón para francés -->
  <button onclick="changeLanguage('fr')" class="flex items-center w-full px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900 ${i18n.getCurrentLanguage() === 'fr' ? 'bg-blue-50 text-blue-700' : ''}">
    <div class="w-5 h-5 mr-3">${getFlagSVG('fr')}</div>
    <span class="font-medium">Français</span>
    ${i18n.getCurrentLanguage() === 'fr' ? '<svg class="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">...</svg>' : ''}
  </button>
</div>
```

## 🎯 Mejores Prácticas

### **1. Estructura de Claves**
```javascript
// ✅ BIEN: Jerarquía clara
{
  navigation: {
    home: "Inicio"
  },
  homepage: {
    hero: {
      title: "Título"
    }
  }
}

// ❌ MAL: Claves planas
{
  "nav_home": "Inicio",
  "homepage_hero_title": "Título"
}
```

### **2. Nombres Descriptivos**
```javascript
// ✅ BIEN
{
  buttons: {
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar"
  }
}

// ❌ MAL
{
  btn1: "Guardar",
  btn2: "Cancelar"
}
```

### **3. Consistencia entre Idiomas**
```javascript
// ✅ BIEN: Misma estructura
// es.js
{ user: { profile: { name: "Nombre" } } }
// en.js
{ user: { profile: { name: "Name" } } }

// ❌ MAL: Estructuras diferentes
// es.js
{ user: { profile: { name: "Nombre" } } }
// en.js
{ user: { name: "Name" } }
```

### **4. Parámetros en Traducciones**
```javascript
// En archivo de idioma
{
  welcome: "Bienvenido {{name}}, tienes {{count}} mensajes"
}

// En código
t('welcome', { name: 'Juan', count: 5 })
// Resultado: "Bienvenido Juan, tienes 5 mensajes"
```

## 🔍 Sistema de Fallback

El sistema incluye fallback automático:

1. **Idioma solicitado** (ej: francés)
2. **Idioma por defecto** (español) si no existe la traducción
3. **Clave original** si no existe en ningún idioma

```javascript
// Si no existe 'newFeature.title' en francés
t('newFeature.title')
// → Busca en español
// → Si no existe, devuelve 'newFeature.title'
```

## 🐛 Solución de Problemas

### **Problema: Texto no se actualiza**
```javascript
// ✅ Solución: Verificar que el elemento exista
const element = document.querySelector('[data-translate-key="my_key"]');
if (element) {
  element.textContent = t('my.key');
}
```

### **Problema: Traducción no encontrada**
```bash
# En consola aparece:
🔸 Missing translation for key: my.missing.key

# ✅ Solución: Agregar a archivos de idioma
```

### **Problema: Idioma no persiste**
```javascript
// ✅ Verificar que localStorage funciona
console.log(localStorage.getItem('selectedLanguage'));

// ✅ Verificar que el evento se emite
window.addEventListener('languageChanged', (e) => {
  console.log('Language changed to:', e.detail.language);
});
```

## 📊 Estado Actual

### **✅ Implementado:**
- Sistema base i18n con fallback
- Selector de idioma con banderas
- Español e inglés completos
- Página de inicio completamente traducida
- Navegación y carrito traducidos
- Persistencia en localStorage
- Eventos de cambio de idioma

### **🔄 Páginas Pendientes:**
- Páginas de autenticación (login, registro)
- Página de productos
- Página de administración
- Dashboard
- Páginas de detalle de productos

### **💡 Futuras Mejoras:**
- Detección automática de idioma del navegador
- Más idiomas (francés, portugués, etc.)
- Traducciones de productos dinámicas desde Firebase
- Pluralización automática
- Formato de fechas por idioma

## 🚀 Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# La página estará en: http://localhost:5174/

# Para ver cambios en traducciones:
# 1. Editar archivos en src/i18n/languages/
# 2. Cambiar idioma en la página
# 3. Los cambios se aplican inmediatamente
```

## 📞 Contacto y Soporte

Para dudas sobre la implementación del sistema i18n:
- Revisar esta documentación
- Verificar la consola del navegador para errores
- Comprobar que todos los archivos están importados correctamente

---

**💡 Nota:** Este sistema está diseñado para ser simple, eficiente y escalable. Mantén la consistencia en la estructura de traducciones para facilitar el mantenimiento.
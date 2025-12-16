# 🏗️ Arquitectura del Proyecto Frostware

## 📁 Estructura del Proyecto

```
Frostware-Web-v2/
├── docs/                      # Documentación del proyecto
├── public/                    # Archivos estáticos públicos
│   ├── css/                   # Estilos estáticos
│   │   └── logo.css          # Animaciones del logo
│   └── js/                    # Scripts estáticos (deprecado)
├── src/                       # Código fuente de la aplicación
│   ├── i18n/                  # Sistema de internacionalización
│   │   ├── languages/         # Archivos de traducción
│   │   │   ├── en.js         # Traducciones en inglés
│   │   │   └── es.js         # Traducciones en español
│   │   ├── flags.js          # SVGs de banderas
│   │   └── index.js          # Sistema i18n principal
│   ├── js/                    # JavaScript principal
│   │   ├── utils/            # Utilidades
│   │   │   ├── scrollObserver.js  # Observador de scroll para animaciones
│   │   │   └── toast.js      # Sistema de notificaciones
│   │   ├── auth.js           # Autenticación de usuarios
│   │   ├── cart.js           # Carrito de compras
│   │   ├── config.js         # Configuración global
│   │   ├── firebase.js       # Inicialización de Firebase
│   │   ├── homepage-i18n.js  # Traducciones de homepage
│   │   ├── main.js           # Punto de entrada principal
│   │   ├── router.js         # Enrutador SPA
│   │   └── userProfile.js    # Gestión de perfiles y productos
│   ├── pages/                 # Vistas de la aplicación
│   │   ├── admin/            # Panel de administración
│   │   ├── auth/             # Autenticación
│   │   │   ├── account/      # Cuenta de usuario
│   │   │   ├── login/        # Login
│   │   │   ├── register/     # Registro
│   │   │   └── reset/        # Recuperación de contraseña
│   │   ├── contact/          # Página de contacto
│   │   ├── dashboard/        # Dashboard de productos
│   │   ├── privacy/          # Política de privacidad
│   │   ├── product-detail/   # Detalle de producto
│   │   ├── products/         # Lista de productos
│   │   └── terms/            # Términos y condiciones
│   └── styles/                # Estilos CSS
│       ├── firebase-integration.css  # Estilos de Firebase
│       └── styles.css        # Estilos principales
├── index.html                 # HTML principal
├── package.json              # Dependencias del proyecto
└── vite.config.js            # Configuración de Vite
```

## 🎨 Sistema de Estilos

### Hover-Neon-Glow Effect

El efecto de glow azul neón se aplica a las tarjetas de productos.

**Ubicación:** `src/styles/styles.css` (líneas 268-287)

**Características:**
- Transición rápida: 250ms
- Glow suave y elegante (opacidades reducidas)
- Elevación sutil: -4px, scale(1.01)
- Color: Electric Blue #22a7d0

**Uso:**
```html
<div class="product-card hover-neon-glow relative bg-white shadow-lg border border-gray-200">
  <!-- Contenido -->
</div>
```

## 🔥 Firebase Firestore

### Estructura de Datos

#### Colección: `products`
```javascript
{
  id: string,
  name: { es: string, en: string },
  description: { es: string, en: string },
  longDescription: { es: string, en: string },
  price: number,
  image: string,
  category: string,
  badge: string,
  rating: number,
  reviews: number,
  detailedFeatures: Array<{
    icon: string,
    title: { es: string, en: string },
    description: { es: string, en: string }
  }>,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Colección: `users/{userId}/purchasedProducts`
```javascript
{
  id: string,  // productId
  name: { es: string, en: string },
  price: number,
  image: string,
  category: string,
  purchaseDate: string (ISO)
}
```

## 🌍 Sistema de Internacionalización (i18n)

**Ubicación:** `src/i18n/`

**Idiomas soportados:**
- Español (es) - Por defecto
- Inglés (en)

**Uso:**
```javascript
import { t, i18n } from '../i18n/index.js';

// Obtener traducción
const text = t('navigation.home');

// Obtener idioma actual
const lang = i18n.getCurrentLanguage();

// Cambiar idioma
i18n.setLanguage('en');
```

## 🛣️ Sistema de Rutas (SPA)

**Ubicación:** `src/js/router.js`

**Rutas disponibles:**
- `#/` - Homepage
- `#/products` - Lista de productos
- `#/product/:id` - Detalle de producto
- `#/auth` - Login
- `#/auth/register` - Registro
- `#/auth/reset` - Recuperar contraseña
- `#/account` - Cuenta de usuario
- `#/account/products` - Productos del usuario
- `#/admin` - Panel de administración
- `#/dashboard/:id` - Dashboard de producto
- `#/terms` - Términos y condiciones
- `#/privacy` - Política de privacidad
- `#/contact` - Contacto

## 🔐 Autenticación

**Ubicación:** `src/js/auth.js`

**Proveedor:** Firebase Authentication

**Métodos:**
- `watchAuthState(callback)` - Observa cambios en autenticación
- `login(email, password)` - Iniciar sesión
- `register(email, password)` - Registrar usuario
- `logout()` - Cerrar sesión
- `resetPassword(email)` - Recuperar contraseña

## 🛒 Carrito de Compras

**Ubicación:** `src/js/cart.js`

**Características:**
- Almacenamiento local (localStorage)
- Sincronización con productos comprados
- Validación de productos ya adquiridos
- Modal de carrito con animaciones

**API Principal:**
```javascript
cart.addToCart(product);
cart.removeFromCart(productId);
cart.isProductInCart(productId);
cart.isProductPurchased(productId);
cart.updateCartUI();
```

## 🎯 Flujo de Carga de la Aplicación

1. **Carga inicial** (`index.html`)
   - Header con skeleton loaders (opacity: 0)
   - Contenido estático de la homepage

2. **Inicialización JS** (`src/js/main.js`)
   - Espera por sistema i18n
   - Inicializa Firebase
   - Observa estado de autenticación
   - Renderiza header cuando Auth está listo (fade-in)

3. **Carga de productos** (`src/js/homepage-i18n.js`)
   - Carga productos desde Firebase
   - Aplica traducciones según idioma
   - Renderiza primeros 3 productos en homepage

4. **Interacción del usuario**
   - Click en producto → Vista de detalle
   - Agregar al carrito → Modal del carrito
   - Cambiar idioma → Re-renderiza contenido

## 📱 Responsive Design

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Sistema de Grid:**
```css
/* Mobile */
grid-cols-1

/* Tablet */
md:grid-cols-2

/* Desktop */
lg:grid-cols-3
```

## 🚀 Build y Deployment

**Herramienta:** Vite

**Comandos:**
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```

**Output:**
- `dist/` - Archivos compilados para producción
- Optimización automática de assets
- Code splitting
- Minificación de CSS/JS

## 🎨 Animaciones

**Scroll Observer:** `src/js/utils/scrollObserver.js`
- Detecta elementos al entrar en viewport
- Aplica clases de animación
- Clases soportadas: `.fade-in-up`, `.fade-in-down`, `.fade-in-scale`

**Transiciones CSS:**
- Todas las transiciones usan `cubic-bezier(0.4, 0, 0.2, 1)` para suavidad
- Duración estándar: 300ms (250ms para hover-neon-glow)

## 🔧 Configuración

**Archivo:** `src/js/config.js`

```javascript
export const isDevelopment = () =>
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const AUTO_DEMO_LOGIN = false; // Activar para login automático en dev
```

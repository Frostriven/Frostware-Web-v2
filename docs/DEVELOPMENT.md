# Guía de Desarrollo - Frostware® v2.0

Esta guía detalla el proceso de desarrollo, arquitectura y mejores prácticas para el proyecto Frostware® Website v2.0.

## 🏗️ Arquitectura del Proyecto

### Patrón de Diseño
- **SPA (Single Page Application)** con router personalizado
- **Modular JavaScript** con ES6+ modules
- **Component-based views** para autenticación
- **Firebase-first** para backend y datos

### Flujo de Datos
```
Usuario → Router → View Components → Firebase Services → Firestore
```

## 📋 Configuración de Desarrollo

### Variables de Entorno Requeridas

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Development Emulators
VITE_USE_FIREBASE_EMULATORS=true
VITE_EMULATOR_AUTH_HOST=127.0.0.1
VITE_EMULATOR_AUTH_PORT=9099
VITE_EMULATOR_FIRESTORE_HOST=127.0.0.1
VITE_EMULATOR_FIRESTORE_PORT=8080
VITE_EMULATOR_STORAGE_HOST=127.0.0.1
VITE_EMULATOR_STORAGE_PORT=9199
VITE_EMULATOR_FUNCTIONS_HOST=127.0.0.1
VITE_EMULATOR_FUNCTIONS_PORT=5001
VITE_FUNCTIONS_REGION=us-central1
```

### Configuración de Firebase Emulators

El archivo `firebase.json` debe estar en la raíz del proyecto:

```json
{
  "emulators": {
    "auth": {
      "host": "127.0.0.1",
      "port": 9099
    },
    "firestore": {
      "host": "127.0.0.1",
      "port": 8080
    },
    "hosting": {
      "port": 5050
    },
    "storage": {
      "port": 9199
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "host": "127.0.0.1",
      "port": 4000
    }
  }
}
```

## 🔧 Scripts de Desarrollo

### Scripts NPM
```bash
npm run dev        # Servidor de desarrollo con HMR
npm run build      # Build para producción
npm run preview    # Preview del build
```

### Scripts Firebase
```bash
firebase emulators:start    # Iniciar todos los emuladores
firebase emulators:ui       # Abrir UI de emuladores
firebase deploy            # Deploy a producción
```

## 📁 Estructura Detallada

```
src/
├── js/
│   ├── firebase.js          # Configuración y inicialización
│   ├── auth.js              # Servicios de autenticación
│   ├── userProfile.js       # Gestión de perfiles y productos
│   ├── router.js            # Enrutamiento SPA
│   └── main.js              # Entrada principal y configuración
├── pages/
│   ├── auth/
│   │   ├── login/view.js    # Lógica de vista de login
│   │   ├── register/view.js # Lógica de vista de registro
│   │   ├── reset/view.js    # Lógica de recuperación de contraseña
│   │   └── account/view.js  # Lógica de cuenta de usuario
│   ├── admin/view.js        # Panel de administración completo
│   ├── dashboard/view.js    # Dashboard de productos comprados
│   └── products/view.js     # Vista de productos disponibles
├── styles/
│   ├── styles.css           # Estilos principales
│   └── firebase-integration.css # Estilos específicos de Firebase
public/
├── pages/auth/              # Templates HTML
│   ├── login.html           # Template de login
│   ├── register.html        # Template de registro
│   ├── reset.html           # Template de recuperación
│   └── account.html         # Template de cuenta
├── css/
│   └── logo.css             # Estilos del logo animado
└── favicon.svg              # Icono del sitio
```

## 🔒 Servicios de Autenticación

### Auth.js - Funciones Principales

```javascript
// Registro con email/password
export async function registerWithEmail(name, email, password)

// Login con email/password
export async function loginWithEmail(email, password)

// Login con Google
export async function loginWithGoogle()

// Recuperación de contraseña
export async function resetPassword(email)

// Logout
export async function logout()

// Observer de estado de autenticación
export function watchAuthState(callback)
```

### UserProfile.js - Gestión de Datos

```javascript
// Obtener perfil del usuario
export async function getUserProfile(userId)

// Actualizar perfil
export async function updateUserProfile(userId, profileData)

// Obtener productos del usuario
export async function getUserProducts(userId)

// Agregar producto al usuario
export async function addUserProduct(userId, productData)
```

## 📊 Esquema de Base de Datos

### Colección: users/{userId}
```javascript
{
  name: string,           // Nombre completo
  phone: string,          // Teléfono
  country: string,        // Código de país
  company: string,        // Empresa (opcional)
  bio: string,           // Biografía (opcional)
  createdAt: timestamp,   // Fecha de creación
  updatedAt: timestamp    // Última actualización
}
```

### Colección: userProducts/{productId}
```javascript
{
  userId: string,         // ID del usuario
  productId: string,      // ID del producto
  productName: string,    // Nombre del producto
  productDescription: string, // Descripción
  productPrice: number,   // Precio
  productImage: string,   // URL de imagen
  purchaseDate: timestamp, // Fecha de compra
  status: string         // Estado (active, inactive)
}
```

### Colección: products/{productId}
```javascript
{
  id: string,            // ID único del producto
  name: string,          // Nombre del producto
  price: number,         // Precio actual
  originalPrice: number, // Precio original (opcional)
  rating: number,        // Rating (1-5)
  category: string,      // ID de categoría
  badge: string,         // ID de badge (opcional)
  offerId: string,       // ID de oferta activa (opcional)
  description: string,   // Descripción del producto
  image: string,         // URL de imagen
  appUrl: string,        // URL de acceso al producto
  reviews: number,       // Número de reviews
  features: array,       // Características del producto
  tags: array,           // Tags para búsqueda
  createdAt: timestamp,  // Fecha de creación
  updatedAt: timestamp   // Última actualización
}
```

### Colección: categories/{categoryId}
```javascript
{
  id: string,            // ID único de la categoría
  name: string,          // Nombre de la categoría
  color: string,         // Color hex (#RRGGBB)
  createdAt: timestamp,  // Fecha de creación
  updatedAt: timestamp   // Última actualización
}
```

### Colección: badges/{badgeId}
```javascript
{
  id: string,            // ID único del badge
  name: string,          // Nombre del badge
  color: string,         // Color hex (#RRGGBB)
  createdAt: timestamp,  // Fecha de creación
  updatedAt: timestamp   // Última actualización
}
```

### Colección: offers/{offerId}
```javascript
{
  id: string,            // ID único de la oferta
  productId: string,     // ID del producto
  originalPrice: number, // Precio original
  discountPrice: number, // Precio con descuento (0 = gratis)
  startDate: timestamp,  // Fecha de inicio
  endDate: timestamp,    // Fecha de fin
  indefinite: boolean,   // Si es por tiempo indefinido
  description: string,   // Descripción de la oferta
  active: boolean,       // Si está activa
  createdAt: timestamp,  // Fecha de creación
  updatedAt: timestamp   // Última actualización
}
```

## 🛠️ Router SPA

### Registro de Rutas
```javascript
// En main.js
registerRoute('#/', homeHandler);
registerRoute('#/auth', loginHandler);
registerRoute('#/auth/login', loginHandler);
registerRoute('#/auth/register', registerHandler);
registerRoute('#/auth/reset', resetHandler);
registerRoute('#/account', accountHandler);
```

### Navegación
- Las rutas usan hash routing (`#/ruta`)
- El router detecta cambios en `window.location.hash`
- Cada ruta tiene un handler que renderiza la vista correspondiente

## 🎨 Sistema de Vistas

### Patrón de Vista
Cada vista sigue este patrón:

1. **Fetch del template HTML**
2. **Parse y inserción en spa-root**
3. **Bind de event listeners**
4. **Manejo de estado local**

```javascript
export async function renderViewName() {
  const root = document.getElementById('spa-root');

  // 1. Cargar template
  const response = await fetch('/pages/template.html');
  const html = await response.text();

  // 2. Insertar contenido
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  root.innerHTML = doc.querySelector('main').innerHTML;

  // 3. Bind eventos
  const button = root.querySelector('#my-button');
  button.addEventListener('click', handleClick);
}
```

## 🔧 Herramientas de Desarrollo

### Hot Module Replacement (HMR)
- Vite proporciona HMR automático
- Los cambios en JS/CSS se reflejan instantáneamente
- No se pierde el estado de la aplicación

### DevTools Recomendadas
- **Firefox/Chrome DevTools** - Debugging y network
- **Firebase Emulator UI** - Gestión de datos locales
- **Vue DevTools** - Para debugging de estado (si se agrega Vue)

## 🚀 Proceso de Deployment

### Build de Producción
```bash
npm run build
```

### Deploy a Firebase Hosting
```bash
firebase deploy --only hosting
```

### Variables de Producción
- Cambiar `VITE_USE_FIREBASE_EMULATORS=false`
- Usar credenciales de Firebase de producción
- Configurar dominios autorizados en Firebase Auth

## 🧪 Testing y Debugging

### Logs de Desarrollo
Durante desarrollo, se pueden agregar logs para debugging:

```javascript
console.log('[ComponentName] Estado:', data);
console.error('[ComponentName] Error:', error);
```

### Firebase Emulator Data
Los datos del emulador se almacenan localmente y se reinician al restart.

### Network Debugging
- Verificar que las requests a `/pages/auth/*.html` se resuelvan correctamente
- Monitorear errores de Firebase en la consola

## 🔄 Flujo de Trabajo Git

### Branches Recomendados
- `main` - Producción estable
- `develop` - Desarrollo activo
- `feature/*` - Nuevas características
- `hotfix/*` - Correcciones urgentes

### Convenciones de Commit
```
feat: agregar sistema de productos
fix: corregir navegación en mobile
docs: actualizar README
style: mejorar estilos de botones
refactor: reorganizar estructura de archivos
```

## 📈 Métricas y Monitoreo

### Firebase Analytics
- Configurado con `VITE_FIREBASE_MEASUREMENT_ID`
- Tracking automático de page views
- Eventos personalizados para acciones importantes

### Performance Monitoring
- Core Web Vitals
- Tiempo de carga de Firebase
- Errores de JavaScript

---

## 🛠️ Panel de Administración

### Características Principales
- **Gestión de Productos**: CRUD completo de productos con soporte para imágenes, categorías, badges y ofertas
- **Gestión de Categorías**: Crear, editar y eliminar categorías con colores personalizados
- **Gestión de Badges**: Crear, editar y eliminar badges para destacar productos
- **Sistema de Ofertas**: Crear ofertas con descuentos o productos gratis, con fechas de inicio/fin

### Event Delegation System
El panel de administración utiliza un sistema centralizado de event delegation para manejar todas las interacciones:

```javascript
// Handler global que captura todos los clicks
function handleAdminPanelClick(e) {
  const button = e.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  // Maneja edit-product, delete-product, edit-category, etc.
}

// Se registra una sola vez en la fase de captura
document.addEventListener('click', handleAdminPanelClick, true);
```

### Modales Dinámicos
Los modales se manejan de forma especial para garantizar visibilidad:

1. **Remoción de clase `hidden`** de Tailwind antes de mostrar
2. **Movimiento a `document.body`** para evitar conflictos de z-index
3. **Aplicación de estilos inline** con flexbox para centrado
4. **Restauración de overflow** del body al cerrar

```javascript
// Patrón para mostrar modales
modal.classList.remove('hidden');
if (modal.parentElement !== document.body) {
  document.body.appendChild(modal);
}
modal.style.display = 'flex';
modal.style.position = 'fixed';
modal.style.inset = '0';
document.body.style.overflow = 'hidden';
```

### Confirmación Personalizada
Sistema de confirmación para operaciones destructivas (eliminación):

```javascript
function showCustomConfirm(title, details, onConfirm) {
  // Muestra modal con detalles específicos
  // Incluye lista de impactos (ej: productos afectados)
  // Botones de confirmar/cancelar
}
```

## 🆘 Troubleshooting

### Problema: Firebase no inicializa
**Solución:** Verificar archivo `.env` y que los emuladores estén corriendo

### Problema: Router no funciona
**Solución:** Verificar que `initRouter()` se llame después del DOM

### Problema: Estilos no cargan
**Solución:** Verificar conexión a TailwindCSS CDN

### Problema: Templates no se cargan
**Solución:** Verificar que los archivos HTML estén en `public/pages/`

### Problema: Modales no aparecen en admin panel
**Solución:**
- Verificar que la clase `hidden` se elimine antes de mostrar
- Comprobar que el modal se mueva a `document.body` si está dentro de otro contenedor
- Asegurar que `z-index` sea suficientemente alto (9999+)
- Revisar que no haya CSS conflictivo con `!important`
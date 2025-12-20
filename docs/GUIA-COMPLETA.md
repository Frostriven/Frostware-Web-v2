# Frostware® - Plataforma de Productos Digitales

[![Vite](https://img.shields.io/badge/Vite-7.1.5-646CFF?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-FFCA28?logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

Plataforma moderna de productos digitales con autenticación, perfiles de usuario, carrito de compras y gestión de productos desde Firebase.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase

Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de Firebase
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Desarrollo local (opcional - usa emuladores)
VITE_USE_FIREBASE_EMULATORS=true
VITE_EMULATOR_AUTH_HOST=127.0.0.1
VITE_EMULATOR_AUTH_PORT=9099
VITE_EMULATOR_FIRESTORE_HOST=127.0.0.1
VITE_EMULATOR_FIRESTORE_PORT=8080
```

### 3. Configurar reglas de Firestore

Ve a Firebase Console → Firestore Database → Rules y actualiza:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Productos - lectura pública, escritura autenticada
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Usuarios - solo el dueño puede leer/escribir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /purchasedProducts/{productId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 5. Inicializar productos en Firebase

1. Abre http://localhost:5173
2. Abre la consola del navegador (F12)
3. Ejecuta:
```javascript
await initFirebaseProducts()
```

---

## 📁 Estructura del Proyecto

```
Frostware-Web-v2/
├── src/
│   ├── i18n/                  # Sistema multilingüe (ES/EN)
│   │   └── languages/
│   ├── js/
│   │   ├── auth.js           # Autenticación Firebase
│   │   ├── cart.js           # Carrito de compras
│   │   ├── firebase.js       # Configuración Firebase
│   │   ├── main.js           # Punto de entrada
│   │   ├── router.js         # Router SPA
│   │   └── userProfile.js    # Gestión de productos y usuarios
│   ├── pages/                # Vistas de la aplicación
│   │   ├── auth/             # Login, registro, cuenta
│   │   ├── products/         # Listado de productos
│   │   ├── product-detail/   # Detalle de producto
│   │   ├── dashboard/        # Mis productos
│   │   └── admin/            # Panel admin
│   ├── styles/
│   └── utils/
│       └── firebase-init-helper.js  # Funciones de consola
├── public/
│   ├── css/
│   └── js/
├── docs/                     # Documentación
└── index.html
```

---

## 🔥 Firebase - Estructura de Datos

### Productos (`products`)

Los productos usan los siguientes campos:

```javascript
{
  id: "product-id",
  title: {
    es: "Título en Español",
    en: "English Title"
  },
  shortDescription: {
    es: "Descripción corta",
    en: "Short description"
  },
  longDescription: {
    es: "Descripción larga",
    en: "Long description"
  },
  price: 99,
  originalPrice: 150,
  imageURL: "https://...",
  category: "aviation",
  detailGradientColors: ["#1b1b25", "#190d36", "#1b1b25"],
  cardBgColor: "#1b1b25",
  badge: "Disponible",
  badgeColor: "blue",
  rating: 5.0,
  reviews: 342,
  features: ["Feature 1", "Feature 2"],
  detailedFeatures: [
    {
      icon: "radio",
      title: { es: "...", en: "..." },
      description: { es: "...", en: "..." }
    }
  ],
  tags: ["tag1", "tag2"],
  appUrl: "/apps/product/guide.html",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Usuarios (`users/{userId}`)

```javascript
{
  name: "Nombre Usuario",
  email: "usuario@email.com",
  phone: "+1234567890",
  country: "País",
  company: "Empresa",
  bio: "Biografía",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Productos comprados (`users/{userId}/purchasedProducts/{productId}`)

```javascript
{
  id: "product-id",
  title: { es: "...", en: "..." },
  price: 99,
  imageURL: "https://...",
  purchaseDate: "2025-01-15T10:30:00Z"
}
```

---

## 🛠️ Comandos Útiles de Consola

El proyecto incluye funciones helper disponibles globalmente en la consola del navegador:

### Ver productos actuales
```javascript
await checkFirebaseProducts()
```

### Inicializar/actualizar productos
```javascript
await initFirebaseProducts()
```

### Ver resumen completo
```javascript
await showFirebaseSummary()
```

### Detectar duplicados
```javascript
await cleanDuplicateProducts()
```

### Eliminar producto específico
```javascript
await deleteProductById("product-id")
```

---

## 🎨 Características

- ✅ **Autenticación completa** - Email/Password + Google Sign-in
- ✅ **Gestión de usuarios** - Perfiles editables con datos personales
- ✅ **Carrito de compras** - Agregar productos y procesar compras
- ✅ **Sistema multilingüe** - Español e Inglés (i18n)
- ✅ **Responsive design** - Optimizado para móvil, tablet y desktop
- ✅ **Firebase Integration** - Firestore para productos y usuarios
- ✅ **SPA Router** - Navegación fluida sin recargas
- ✅ **Admin panel** - Gestión de productos desde la UI

---

## 🧩 Tecnologías

- **Vite 7.1.5** - Build tool ultra rápido
- **Firebase 10.x** - Backend as a Service
  - Authentication
  - Firestore Database
- **TailwindCSS 3.x** - Framework CSS utility-first
- **Vanilla JavaScript ES6+** - Sin frameworks frontend
- **Custom i18n** - Sistema de internacionalización
- **Custom Router** - SPA routing

---

## 📝 Scripts NPM

```bash
npm run dev      # Servidor de desarrollo (puerto 5173)
npm run build    # Build para producción
npm run preview  # Preview del build
```

---

## 🔒 Configuración de Seguridad

### Reglas de Firestore (Producción)

Para producción, restringe la escritura de productos solo a administradores:

```javascript
match /products/{productId} {
  allow read: if true;
  allow write: if request.auth != null &&
               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

Luego agrega un campo `role: "admin"` al documento del usuario administrador en Firestore.

---

## 🐛 Solución de Problemas

### Error: "Missing or insufficient permissions"

**Solución:** Verifica que las reglas de Firestore permitan lectura pública en productos.

### Productos no se muestran

1. Abre la consola (F12)
2. Ejecuta `await checkFirebaseProducts()`
3. Si sale 0 productos, ejecuta `await initFirebaseProducts()`
4. Recarga la página (F5)

### Firebase no inicializado

1. Verifica que `.env` tenga las credenciales correctas
2. Asegúrate de tener conexión a internet
3. Revisa la consola por errores de Firebase

---

## 📚 Documentación Adicional

- [Arquitectura del Sistema](./docs/ARQUITECTURA.md)
- [Sistema i18n](./docs/I18N_DOCUMENTATION.md)
- [Guía de Desarrollo](./docs/DEVELOPMENT.md)
- [Changelog](./docs/CHANGELOG.md)

---

## 📄 Licencia

© 2025 Frostware. Todos los derechos reservados.

---

## 👤 Autor

**Frostriven** - Desarrollo y mantenimiento

---

⭐ **¿Te fue útil? Dale una estrella al proyecto!**

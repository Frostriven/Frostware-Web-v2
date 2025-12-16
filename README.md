# Frostware® Website v2.0

🚀 **Sitio web oficial de Frostware** - Una aplicación web moderna construida con tecnologías de vanguardia para ofrecer herramientas, cursos y simuladores de alta calidad.

![Frostware](https://img.shields.io/badge/Frostware-v2.09-blue)
![Vite](https://img.shields.io/badge/Vite-7.1.5-green)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-blue)

## 📋 Descripción

Frostware® v2.0 es una Single Page Application (SPA) que ofrece:

- **🛠️ Herramientas especializadas** - Calculadoras de rendimiento de vuelo, procedimientos NOPAC, GOLD Datalink
- **📚 Cursos y guías** - Contenido educativo interactivo
- **👤 Gestión de usuarios** - Perfiles personalizables y seguimiento de productos
- **🔒 Autenticación segura** - Firebase Auth con Google Sign-in
- **📱 Diseño responsive** - Optimizado para todos los dispositivos

## 📚 Documentación

La documentación completa del proyecto está disponible en la carpeta [docs/](./docs/):

- **[Arquitectura del Proyecto](./docs/ARQUITECTURA.md)** - Estructura completa y patrones técnicos
- **[Changelog](./docs/CHANGELOG.md)** - Registro de cambios y mejoras
- **[Sistema i18n](./docs/I18N_DOCUMENTATION.md)** - Documentación del sistema de traducciones
- **[Guía de Desarrollo](./docs/DEVELOPMENT.md)** - Flujo de desarrollo y arquitectura
- **[Roadmap](./docs/ROADMAP.md)** - Plan de desarrollo y fases completadas
- **[Guía de Contribución](./docs/CONTRIBUTING.md)** - Cómo contribuir al proyecto
- **[Demo Setup](./docs/DEMO_SETUP.md)** - Configuración del usuario demo
- **[Guía de Migración](./docs/MIGRATION_GUIDE.md)** - Mejoras de arquitectura Firebase

## ✨ Características

### 🎯 Funcionalidades Principales
- ✅ Sistema de autenticación completo (Email/Password + Google)
- ✅ Perfiles de usuario editables con datos personales
- ✅ Sistema de productos y compras
- ✅ Navegación SPA fluida
- ✅ Diseño moderno con animaciones
- ✅ Efecto hover-neon-glow en tarjetas de productos
- ✅ Sistema de internacionalización (i18n) - Español/Inglés
- ✅ Integración con Firebase Firestore
- ✅ Modo de desarrollo con emuladores

### 🛡️ Seguridad
- Autenticación Firebase Auth
- Validación de formularios
- Manejo seguro de datos personales
- Emuladores para desarrollo local

### 🎨 UI/UX
- Diseño responsive con TailwindCSS
- Animaciones fluidas con burbujas
- Interfaz intuitiva
- Feedback visual en tiempo real

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Firebase CLI (para emuladores)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Frostriven/Frostware-Web-v2.git
   cd Frostware-Web-v2
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales de Firebase
   ```

4. **Iniciar emuladores de Firebase** (en otra terminal)
   ```bash
   firebase emulators:start
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

## 📁 Estructura del Proyecto

```
Frostware-Web-v2/
├── docs/                      # 📚 Documentación del proyecto
│   ├── README.md
│   ├── ARQUITECTURA.md
│   ├── CHANGELOG.md
│   ├── HOVER-GLOW-FIX.md
│   └── AUTH-FLICKER-FIX.md
├── src/
│   ├── i18n/                  # 🌍 Sistema de internacionalización
│   │   ├── languages/         # Archivos de traducción
│   │   ├── flags.js
│   │   └── index.js
│   ├── js/                    # 💻 Código JavaScript
│   │   ├── utils/
│   │   ├── auth.js
│   │   ├── firebase.js
│   │   ├── router.js
│   │   ├── main.js
│   │   ├── cart.js
│   │   ├── homepage-i18n.js
│   │   └── userProfile.js
│   ├── pages/                 # 📄 Vistas de la aplicación
│   │   ├── auth/
│   │   ├── products/
│   │   ├── product-detail/
│   │   └── ...
│   └── styles/                # 🎨 Estilos CSS
│       ├── styles.css
│       └── firebase-integration.css
├── public/                    # 📦 Assets estáticos
│   ├── css/
│   └── js/
├── index.html                 # 🏠 Punto de entrada
└── vite.config.js

Ver [ARQUITECTURA.md](./docs/ARQUITECTURA.md) para más detalles.
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run preview` - Vista previa de la construcción

## 🌐 Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Configuración de Firebase
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Emuladores (para desarrollo)
VITE_USE_FIREBASE_EMULATORS=true
VITE_EMULATOR_AUTH_HOST=127.0.0.1
VITE_EMULATOR_AUTH_PORT=9099
VITE_EMULATOR_FIRESTORE_HOST=127.0.0.1
VITE_EMULATOR_FIRESTORE_PORT=8080
```

## 📊 Base de Datos

### Estructura de Firestore

```
users/{userId}
├── name: string
├── phone: string
├── country: string
├── company: string
├── bio: string
├── createdAt: timestamp
└── updatedAt: timestamp

userProducts/{productId}
├── userId: string
├── productId: string
├── productName: string
├── productDescription: string
├── productPrice: number
├── productImage: string
├── purchaseDate: timestamp
└── status: string
```

## 🛠️ Tecnologías Utilizadas

- **Frontend Framework**: Vanilla JavaScript ES6+
- **Build Tool**: Vite 7.1.5
- **Styling**: TailwindCSS (CDN) + CSS personalizado
- **Backend/Database**: Firebase v10
  - Authentication
  - Firestore
  - Emulators Suite
- **i18n**: Sistema personalizado de internacionalización
- **Routing**: Router SPA personalizado
- **Fonts**: Google Fonts (Inter)

## 🎨 Efectos y Animaciones

### Hover-Neon-Glow

Efecto de glow neón azul en tarjetas de productos con las siguientes características:
- Transición rápida: 250ms ease-out
- Glow suave y elegante (Electric Blue #22a7d0)
- Elevación sutil: -4px, scale(1.01)
- 3 capas de box-shadow para difusión gradual

Ver [HOVER-GLOW-FIX.md](./docs/HOVER-GLOW-FIX.md) para implementación completa.

### Scroll Animations

Sistema de animaciones al hacer scroll con clases como:
- `.fade-in-up` - Entrada desde abajo
- `.fade-in-down` - Entrada desde arriba
- `.fade-in-scale` - Entrada con escala

Ubicación: [src/js/utils/scrollObserver.js](./src/js/utils/scrollObserver.js)

## 🎨 Guía de Desarrollo

### Agregar Nueva Página

1. Crear HTML en `public/pages/`
2. Crear view.js en `src/pages/`
3. Registrar ruta en `src/js/main.js`

### Agregar Nueva Funcionalidad de Firebase

1. Importar funciones necesarias en el archivo correspondiente
2. Manejar errores apropiadamente
3. Actualizar interfaces de usuario

### Estilo y Diseño

- Usar clases de TailwindCSS
- Mantener consistencia con la paleta de colores
- Color principal: `#22a7d0`

## 🚀 Deployment

### Preparar para Producción

1. **Construir el proyecto**
   ```bash
   npm run build
   ```

2. **Configurar Firebase Hosting** (opcional)
   ```bash
   firebase init hosting
   firebase deploy
   ```

3. **Variables de entorno para producción**
   - Configurar `VITE_USE_FIREBASE_EMULATORS=false`
   - Usar credenciales de Firebase de producción

## 🐛 Debugging

### Problemas Comunes

1. **Firebase no inicializado**
   - Verificar archivo `.env`
   - Asegurar que los emuladores estén ejecutándose

2. **Navegación SPA no funciona**
   - Verificar que el router esté inicializado
   - Comprobar rutas registradas

3. **Estilos no cargan**
   - Verificar conexión a TailwindCSS CDN
   - Comprobar archivos CSS locales

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

© 2025 Frostware. Todos los derechos reservados.

## 👨‍💻 Autor

**Frostriven** - [GitHub](https://github.com/Frostriven)

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar a través del sitio web oficial

---

⭐ **¡Dale una estrella al proyecto si te resulta útil!**
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

## ✨ Características

### 🎯 Funcionalidades Principales
- ✅ Sistema de autenticación completo (Email/Password + Google)
- ✅ Perfiles de usuario editables con datos personales
- ✅ Sistema de productos y compras
- ✅ Navegación SPA fluida
- ✅ Diseño moderno con animaciones
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
src/
├── js/
│   ├── auth.js              # Funciones de autenticación
│   ├── firebase.js          # Configuración de Firebase
│   ├── router.js            # Router SPA
│   ├── main.js              # Punto de entrada principal
│   └── userProfile.js       # Gestión de perfiles y productos
├── pages/
│   └── auth/
│       ├── login/view.js    # Vista de inicio de sesión
│       ├── register/view.js # Vista de registro
│       ├── reset/view.js    # Vista de recuperación
│       └── account/view.js  # Vista de cuenta de usuario
├── styles/
│   ├── styles.css           # Estilos principales
│   └── firebase-integration.css # Estilos de Firebase
public/
├── pages/auth/              # Templates HTML
│   ├── login.html
│   ├── register.html
│   ├── reset.html
│   └── account.html
└── css/
    └── logo.css             # Estilos del logo
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
- **Styling**: TailwindCSS (CDN)
- **Backend/Database**: Firebase v10
  - Authentication
  - Firestore
  - Emulators Suite
- **Routing**: Router SPA personalizado
- **Fonts**: Google Fonts (Inter)

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
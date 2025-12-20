# Frostware® - Plataforma de Productos Digitales

[![Vite](https://img.shields.io/badge/Vite-7.1.5-646CFF?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-FFCA28?logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

Plataforma web moderna de productos digitales con autenticación Firebase, carrito de compras, sistema multilingüe (ES/EN) y gestión de productos en tiempo real.

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Firebase (.env)
cp .env.example .env
# Edita .env con tus credenciales

# 3. Iniciar servidor
npm run dev

# 4. Abrir http://localhost:5173
# 5. Inicializar productos en consola (F12):
await initFirebaseProducts()
```

---

## 📚 Documentación

Toda la documentación está en la carpeta **[`/docs`](./docs)**:

- **[Guía Completa](./docs/GUIA-COMPLETA.md)** - Setup detallado, Firebase, comandos útiles
- **[Documentación Técnica](./docs/README.md)** - Índice de todas las guías
- **[Arquitectura](./docs/ARQUITECTURA.md)** - Estructura del proyecto
- **[Sistema i18n](./docs/I18N_DOCUMENTATION.md)** - Internacionalización
- **[Desarrollo](./docs/DEVELOPMENT.md)** - Mejores prácticas
- **[Changelog](./docs/CHANGELOG.md)** - Historial de cambios

---

## 🔥 Estructura Firebase

### Productos (`products`)
```javascript
{
  title: { es: "...", en: "..." },
  shortDescription: { es: "...", en: "..." },
  imageURL: "https://...",
  price: 99,
  detailGradientColors: ["#...", "#...", "#..."],
  // ... más campos
}
```

Ver estructura completa en [Guía Completa](./docs/GUIA-COMPLETA.md#-firebase---estructura-de-datos)

---

## 🛠️ Comandos de Consola

```javascript
await checkFirebaseProducts()      // Ver productos
await initFirebaseProducts()       // Inicializar/actualizar
await showFirebaseSummary()        // Ver estadísticas
await cleanDuplicateProducts()     // Detectar duplicados
await deleteProductById("id")      // Eliminar producto
```

---

## 🎨 Stack Tecnológico

- **Vite 7.1.5** - Build tool
- **Firebase 10.x** - Backend (Auth + Firestore)
- **TailwindCSS 3.x** - Estilos
- **Vanilla JS ES6+** - Frontend
- **Custom i18n** - Español/Inglés
- **SPA Router** - Navegación sin recargas

---

## 📁 Estructura

```
Frostware-Web-v2/
├── docs/              # 📚 Documentación completa
├── src/
│   ├── i18n/         # 🌍 Traducciones (ES/EN)
│   ├── js/           # 💻 Lógica principal
│   ├── pages/        # 📄 Vistas de la app
│   └── utils/        # 🛠️ Funciones helper
├── public/           # 📦 Assets estáticos
└── index.html        # 🏠 Punto de entrada
```

---

## 🐛 Solución Rápida

**Productos no se ven:**
```javascript
await checkFirebaseProducts()  // Ver cuántos hay
await initFirebaseProducts()   // Inicializar si es 0
```

**Error de permisos Firebase:**
- Ve a Firebase Console → Firestore → Rules
- Actualiza reglas (ver [Guía Completa](./docs/GUIA-COMPLETA.md#3-configurar-reglas-de-firestore))

---

## 📄 Licencia

© 2025 Frostware. Todos los derechos reservados.

**Autor:** Frostriven

---

💡 **Para más información, consulta la [documentación completa](./docs)**

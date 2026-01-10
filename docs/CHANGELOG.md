# Changelog

Registro de cambios, fixes y mejoras implementadas en el proyecto Frostware.

---

## [Dashboard Financiero - Enero 10, 2026]

### Nueva funcionalidad: Panel de Finanzas

**Descripcion**: Dashboard financiero completo para administradores con estadisticas de ventas, usuarios y productos.

#### Caracteristicas principales

**Dashboard Financiero (`#/admin/finances`)**
- Cards de estadisticas: Ingresos totales, mes, usuarios registrados, activos
- Grafico de barras: Ingresos por dia/mes/ano con tabs interactivos
- Grafico donut: Distribucion de usuarios activos vs inactivos
- Tabla: Top 10 productos mas vendidos con barras de progreso
- Diseno dark mode con efectos glassmorphism

**Sistema de Ordenes Centralizado**
- Nueva coleccion `orders` en Firebase para tracking de ventas
- Funcion `createOrder()` ejecutada automaticamente al comprar
- Funciones `getFinancialStats()` y `getUserStats()` optimizadas
- Migracion de datos existentes con `migrateExistingPurchasesToOrders()`

**Archivos creados/modificados**
- `src/pages/finances/view.js` - Vista del dashboard
- `src/js/userProfile.js` - Funciones de orders
- `src/js/cart.js` - Integracion con createOrder
- `src/pages/admin/view.js` - Link "Finanzas" en tabs
- `src/js/main.js` - Ruta `#/admin/finances`
- `firestore.rules` - Reglas para coleccion orders
- `docs/FINANCIAL_DASHBOARD.md` - Documentacion

#### Reglas de Firestore para orders
```javascript
match /orders/{orderId} {
  allow create: if request.auth != null;
  allow read: if isAdmin();
  allow update, delete: if isAdmin();
}
```

---

## [Formulario de Productos Expandido - Enero 9, 2026]

### ✨ Formulario completo con todos los campos del producto

**Descripción**: Expansión masiva del formulario de productos para incluir TODOS los campos necesarios, organizados en 6 tabs con preview en tiempo real.

**Características principales**:

#### 📋 Estructura de 6 Tabs
1. **Información Básica**: ID, nombre simple, descripción, categoría, badge y color del badge
2. **Multilingüe (ES/EN)**: name, title, description, shortDescription, longDescription
3. **Visuales**: image, imageURL, paleta de colores (array), gradiente con preview en tiempo real
4. **Features**: Features simples (array) y features detalladas con iconos, títulos y descripciones multilingües
5. **Precios**: Precio actual, precio original, oferta, rating con estrellas clickeables, reviews
6. **Avanzado**: appUrl, databaseId, tags con chips removibles, showOnHomepage

#### 🎨 Selectores Visuales Implementados
- **Color Pickers**: Para colores del producto y gradientes, con preview hex + picker nativo
- **Icon Picker**: Select con 10 iconos (radio, map, cloud, warning, certificate, lightning, shield, star, globe, rocket)
- **Color Picker de Iconos**: Personalización individual del color de cada ícono con fallback a colores por defecto
- **Tag Input**: Sistema de chips para agregar/remover tags
- **Rating Stars**: 5 estrellas clickeables con valor numérico sincronizado

#### 🎯 Preview en Tiempo Real
- Panel lateral fijo que muestra:
  - Card del producto con imagen y badge
  - Paleta de colores como swatches
  - Gradiente generado dinámicamente
  - Features detalladas con iconos coloreados
- Actualización debounced (300ms) para performance
- Sincronización con todos los campos del formulario

#### 🌈 Sistema de Colores para Iconos
**Colores por defecto** por tipo de ícono:
- `radio` 📻: Púrpura (#8b5cf6) con fondo lavanda
- `map` 🗺️: Verde (#10b981) con fondo menta
- `cloud` ☁️: Azul (#3b82f6) con fondo celeste
- `warning` ⚠️: Naranja (#f59e0b) con fondo ámbar
- `certificate` 🎓: Teal (#14b8a6) con fondo aqua
- `lightning` ⚡: Amarillo (#eab308) con fondo lima
- `shield` 🛡️: Índigo (#6366f1) con fondo lavanda
- `star` ⭐: Naranja (#f59e0b) con fondo ámbar
- `globe` 🌐: Cyan (#06b6d4) con fondo aqua
- `rocket` 🚀: Rosa (#ec4899) con fondo rosa claro

**Color personalizado** opcional para cada ícono con:
- Color picker nativo + input hex
- Botón de reset para volver al color por defecto
- Preview instantáneo en formulario y vista previa

#### 📦 Estructura de Datos Completa
```javascript
{
  // Básicos
  id: "product-id",
  name: { es: "...", en: "..." },
  title: { es: "...", en: "..." },
  description: { es: "...", en: "..." },
  shortDescription: { es: "...", en: "..." },
  longDescription: { es: "...", en: "..." },

  // Visual
  image: "https://...",
  imageURL: "https://...",
  colors: ["#1b1b25", "#190d36", "#1b1b25"],
  detailGradientColors: ["#1b1b25", "#190d36", "#1b1b25"],

  // Categorización
  category: "aviation",
  badge: "Disponible",
  badgeColor: "blue",
  tags: ["aviation", "NAT", "oceanic"],

  // Precio
  price: 99,
  originalPrice: 150,
  offerId: null,
  rating: 5,
  reviews: 342,

  // Features
  features: ["Feature 1", "Feature 2", ...],
  detailedFeatures: [
    {
      icon: "radio",
      iconColor: "#ff0000", // Opcional
      title: { es: "...", en: "..." },
      description: { es: "...", en: "..." }
    }
  ],

  // Avanzado
  appUrl: "/apps/...",
  databaseId: "db-id",
  showOnHomepage: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Archivos modificados**:
- `src/pages/product-form/view.js` - Expandido de ~1500 a 2900+ líneas

**Funciones agregadas**:
- `getIconSVG()` - Retorna SVG del ícono seleccionado (global)
- `initializeTabs()` - Navegación entre tabs
- `initializeColorPickers()` - Sincronización de color pickers y hex inputs (incluye iconos)
- `initializeArrayManagers()` - Gestión de arrays dinámicos
- `updateGradientPreview()` - Preview del gradiente en tiempo real
- `updateLivePreview()` - Actualización del preview con colores y features

---

## 🔧 [Correcciones y Mejoras UI - Enero 9, 2026]

### ✅ Corrección de navegación en botones

**Problema**: Botones "Agregar Producto" y "Nuevo Usuario" no navegaban correctamente.

**Solución**: Implementación de llamadas directas a las funciones de render con import dinámico.

**Archivos modificados**:
- `src/pages/admin/view.js` (líneas 962-964)
- `src/pages/admin-users/view.js` (líneas 1780-1797)

---

### ✅ Rediseño de gestión de usuarios con estilo minimalista

**Descripción**: Rediseño completo de la página de gestión de usuarios para coincidir con el estilo de database-management.

**Mejoras**:
- Paleta de colores consistente: #f9fafb, #e5e7eb, #22a7d0
- Header limpio con botón "Volver"
- Tabla con bordes suaves y hover states elegantes
- Badges con colores consistentes
- Modo oscuro completo (#1a1a1a, #161b22, #c9d1d9)

**Archivos modificados**:
- `src/pages/admin-users/view.js` - Reducido de 2683 a 2359 líneas (estilos inline)

---

### ✅ Corrección de "[object Object]" en database management

**Problema**: Al seleccionar producto en database management aparecía "[object Object]" en lugar del nombre.

**Causa**: Campo `name` es objeto multilingüe `{es, en}` pero se mostraba como string.

**Solución**: Lógica de fallback para extraer nombre correcto:
```javascript
const displayName = typeof p.name === 'string'
  ? p.name
  : (p.name?.es || p.name?.en || p.title?.es || p.title?.en || p.id);
```

**Archivos modificados**:
- `src/pages/database-management/view.js` (líneas 1311-1318)

---

### ✅ Preview de iconos con actualización en tiempo real

**Problema**: Al cambiar el select de ícono, el preview no se actualizaba.

**Solución**:
- Agregados IDs a los selects de iconos (`detailed-feature-icon-${idx}`)
- Agregado atributo `data-icon-preview="${idx}"` a los divs de preview
- Event listener que detecta cambios y actualiza el SVG instantáneamente

**Archivos modificados**:
- `src/pages/product-form/view.js` (líneas 742-749, 484, 489)

---

### ✅ Vista previa HTML para galería de iconos

**Descripción**: Página HTML independiente para visualizar todos los iconos disponibles.

**Características**:
- Grid interactivo con los 10 iconos
- Ejemplos de uso en features
- Código de estructura de datos
- Selectores clickeables
- Diseño responsive

**Archivos nuevos**:
- `public/icon-preview.html` - Galería visual de iconos

---

**Commits relacionados**:
- `feat: expandir formulario de productos con todos los campos y preview completo`
- `fix: corregir navegación de botones y display de nombres en database management`
- `style: rediseñar gestión de usuarios con estilo minimalista consistente`
- `feat: agregar color picker personalizado para iconos de features`

---

## 🚀 [Nuevas Funcionalidades - Enero 2026]

### ✨ Sistema completo de gestión de usuarios

**Descripción**: Página dedicada para administración de usuarios con filtros, búsqueda y gestión de productos asociados.

**Características principales**:
- Vista de tabla con todos los usuarios del sistema
- Filtros por rol (admin/user) y estado de productos (con/sin productos)
- Búsqueda en tiempo real por nombre o email
- Modal para crear nuevos usuarios con asignación de productos
- Modal para editar usuarios existentes
- Modal para ver lista de productos asociados a cada usuario
- Sistema de notificaciones con toast elegante
- Contador de resultados filtrados
- Diseño minimalista y responsive

**Archivos nuevos**:
- `src/pages/admin-users/view.js` - Vista completa de gestión de usuarios (2380 líneas)
- `src/pages/user-form/view.js` - Formulario para crear/editar usuarios (800+ líneas)

**Rutas agregadas**:
- `#/admin/users` - Lista de usuarios
- `#/admin/user/new` - Crear nuevo usuario
- `#/admin/user/{userId}` - Editar usuario específico

**Commits relacionados**: feat: agregar gestión completa de usuarios con filtros y modales

---

### ✨ Sistema de gestión de bases de datos de preguntas

**Descripción**: Interfaz para administrar bases de datos de preguntas asociadas a productos, con vista de estadísticas y editor integrado.

**Características principales**:
- Vista de todas las bases de datos con estadísticas (cantidad de preguntas, última actualización)
- Búsqueda en tiempo real por nombre de producto o ID de base de datos
- Creación de nuevas bases de datos asociadas a productos
- Vista de preguntas de cada base de datos con paginación
- Editor de preguntas con soporte para:
  - Pregunta y 4 opciones de respuesta
  - Marcado de respuesta correcta
  - Explicación detallada
  - Topics/temas asociados
- Eliminación de preguntas con confirmación
- Diseño tipo Matrix (tema oscuro tecnológico)
- Estadísticas en tiempo real

**Archivos nuevos**:
- `src/pages/database-management/view.js` - Vista completa de gestión de bases de datos (1800+ líneas)

**Rutas agregadas**:
- `#/admin/databases` - Gestión de bases de datos

**Estructura Firebase**:
```javascript
// Colección dinámica: {productId}-questions
{
  question: "...",
  options: ["A", "B", "C", "D"],
  correctAnswer: "A",
  explanation: "...",
  topic: "tema-ejemplo",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Commits relacionados**: feat: agregar sistema de gestión de bases de datos de preguntas

---

### ✨ Mejoras en el formulario de productos

**Descripción**: Actualizaciones importantes en la creación y edición de productos.

**Mejoras implementadas**:
1. **Rating interactivo**: Sistema de estrellas clickeable que actualiza el preview en tiempo real
2. **Validación de tipos**: Prevención de "[object Object]" asegurando que name, description y title sean strings
3. **Soporte para productId como parámetro**: Función acepta productId directamente desde el router
4. **Mejor manejo de errores**: Try-catch mejorado con logs detallados

**Archivos modificados**:
- `src/pages/product-form/view.js` (líneas 18-69, 252-274, 549-570)

**Commits relacionados**: fix: agregar rating interactivo y validación de tipos en formulario de productos

---

### ✨ Mejoras en el router SPA

**Descripción**: Router mejorado con soporte para rutas dinámicas de administración.

**Nuevas rutas soportadas**:
- `#/admin/product/{productId}` - Edición de productos
- `#/admin/user/{userId}` - Edición de usuarios
- Manejo especial para rutas que empiezan con `/admin/`

**Archivos modificados**:
- `src/js/router.js` (líneas 52-66)
- `src/js/main.js` (líneas 507-537)

**Commits relacionados**: fix: agregar manejo de rutas dinámicas para admin

---

### ✨ Botón de configuración de admin

**Descripción**: Botón en el panel de administración para crear/actualizar el usuario admin en Firebase.

**Características**:
- Botón "🔧 Configurar Admin" en el header del panel
- Crea o actualiza el documento del usuario en Firestore
- Asigna rol de admin (role: 'admin', isAdmin: true)
- Notificaciones de éxito/error
- Feedback visual con cambio de texto del botón

**Función**:
```javascript
async function setupAdminUser() {
  // Crea/actualiza documento en users/{uid}
  // Asigna role: 'admin', isAdmin: true
  // Muestra toast de confirmación
}
```

**Archivos modificados**:
- `src/pages/admin/view.js` (líneas 77-83, 2567-2623)

**Commits relacionados**: feat: agregar botón de configuración de admin

---

### 🔒 Actualización de reglas de Firestore

**Descripción**: Reglas de seguridad actualizadas para soportar nuevas funcionalidades.

**Cambios principales**:
1. **Email de admin correcto**: Cambio de `demo@frostware.com` a `danyley2000@gmail.com`
2. **Reglas para sesiones de entrenamiento**: CRUD completo para usuarios autenticados
3. **Reglas para estadísticas**: Usuarios pueden leer/escribir sus propias estadísticas
4. **Reglas para bases de datos de preguntas**: Lectura para autenticados, escritura solo admins
5. **Reglas temporales para debugging**: Lectura de users permitida para todos los autenticados

**Archivos modificados**:
- `firestore.rules` (líneas 9, 40-89, 91-109)

**Commits relacionados**: security: actualizar reglas de Firestore con email correcto

---

### 🧹 Limpieza de código demo

**Descripción**: Eliminación de referencias hardcodeadas al usuario demo.

**Cambios realizados**:
1. **Botón de login demo eliminado**: Removido de la página de login
2. **Email de admin actualizado**: `ADMIN_EMAILS` ahora contiene `danyley2000@gmail.com`
3. **Código demo removido**: Eliminadas funciones de login demo del archivo login/view.js

**Archivos modificados**:
- `public/pages/auth/login.html` (líneas 55-62 eliminadas)
- `src/pages/auth/login/view.js` (líneas 46, 118-144 eliminadas)
- `src/js/userProfile.js` (línea 476)

**Commits relacionados**: refactor: eliminar referencias hardcodeadas a usuario demo

---

### 🎨 Mejoras de UX en el panel de administración

**Descripción**: Mejoras visuales y de usabilidad en diversas secciones del panel.

**Mejoras implementadas**:
1. **Alineación de buscador**: Filtros correctamente alineados en gestión de usuarios
2. **Mejor manejo de errores**: Try-catch en loadAllUsers con degradación elegante
3. **Mensaje de bienvenida dinámico**: Muestra el email del usuario actual
4. **Toast notifications**: Sistema de notificaciones consistente en todas las vistas

**Archivos modificados**:
- `src/pages/admin-users/view.js` (líneas 1261-1277, 322-360)
- `src/pages/admin/view.js` (línea 84)

**Commits relacionados**: fix: mejorar UX en panel de administración

---

### 📚 Nueva documentación

**Archivos de documentación creados**:
- `docs/NUEVA-PAGINA-USUARIOS.md` - Guía completa de gestión de usuarios
- `docs/FLUJO-USUARIO-PRODUCTO-DATABASE.md` - Flujo de usuario-producto-database
- `docs/MEJORAS-PANEL-ADMIN.md` - Lista de mejoras realizadas

**Commits relacionados**: docs: agregar documentación de nuevas funcionalidades

---

## 🔧 [Fixes - Diciembre 2025]

### ✅ Fix: Colores dinámicos para categorías y badges en el panel de administración

**Problema**: Las etiquetas de categoría y badge en la tabla de productos del panel de administración mostraban colores hardcodeados (gris para categorías, azul para badges) en lugar de usar los colores dinámicos definidos en Firebase.

**Causa raíz**:
- En `src/pages/admin/view.js`, las etiquetas usaban clases de Tailwind con colores fijos:
  - Categorías: `bg-gray-100 text-gray-800`
  - Badges: `bg-blue-100 text-blue-800`

**Solución**:
1. **Carga de datos**: Modificada función `renderAdminView()` para cargar categorías y badges desde Firebase al inicio
2. **Mapas de colores**: Creados objetos `categoryColorMap` y `badgeColorMap` para búsqueda rápida de colores por ID
3. **Estilos inline dinámicos**:
   - Categorías: `style="background-color: ${color}20; color: ${color}"`
   - Badges: `style="background-color: ${color}20; color: ${color}"`
   - Fondo con 20% de opacidad para buena legibilidad
4. **Consistencia visual**: Mismo patrón de colores usado en la lista de badges del panel

**Archivos modificados**:
- `src/pages/admin/view.js` (líneas 55-68, 295-304, 332-341)

**Resultado**: Las etiquetas de categoría y badge ahora muestran los colores correctos definidos en Firebase, mejorando la consistencia visual del panel de administración.

**Commits relacionados**: Fix: Dynamic colors for category and badge tags in admin panel

---

### ✅ Fix: Eliminado parpadeo del botón de login

**Problema**: Cuando el usuario estaba logueado, el botón "Iniciar Sesión" aparecía brevemente antes de cambiar al menú de usuario, causando un parpadeo visual molesto.

**Causa raíz**: En `src/js/main.js`, se llamaba a `renderHeader(null, true)` inmediatamente antes de que `watchAuthState` determinara el estado real de autenticación.

**Solución**:
- Eliminado el renderizado prematuro del header
- El header permanece oculto (`opacity: 0`) hasta que Firebase Auth determina el estado del usuario
- Los skeleton loaders del `index.html` se muestran durante la carga
- Fade-in suave cuando el header está listo

**Archivos modificados**:
- `src/js/main.js` (líneas 236-241)
- `index.html` (línea 19)

**Commits relacionados**: Auth Flicker Fix

---

### ✅ Fix: Implementado efecto hover-neon-glow en tarjetas de productos

**Problema**: El efecto de glow neón azul no aparecía en las tarjetas de productos ni en la homepage ni en la página de productos.

**Causa raíz (múltiples factores)**:
1. Uso de `::after` pseudo-elemento con `z-index: -1` colocaba el glow detrás del fondo blanco
2. Conflictos con las clases de Tailwind (`shadow-lg`)
3. `overflow: hidden` en el elemento `.hover-neon-glow` cortaba el box-shadow
4. Grid containers sin padding cortaban el glow que se extendía fuera de los límites de las tarjetas

**Solución**:
1. **CSS**: Cambio de pseudo-elemento a box-shadow directo en `:hover`
2. **CSS**: Agregado `!important` para sobrescribir estilos de Tailwind
3. **Estructura HTML**: Movido `overflow: hidden` al contenedor hijo interno
4. **Grid**: Agregado `p-4` padding a los contenedores de grid
5. **Performance**: Reducida transición a 250ms con `ease-out`
6. **Suavidad**: Reducidas opacidades del glow (0.4, 0.3, 0.2) para efecto más elegante

**Archivos modificados**:
- `src/styles/styles.css` (líneas 268-287)
- `src/pages/products/view.js` (líneas 109-115, 169)
- `src/js/homepage-i18n.js` (líneas 195-227)
- `index.html` (línea 87)

**Commits relacionados**: Hover Glow Effect Implementation

---

### ✅ Fix: Sincronización de productos entre homepage y página de productos

**Problema**: La homepage mostraba productos hardcodeados diferentes a los que se cargaban desde Firebase en la página de productos.

**Solución**:
- Modificada función `loadProductsWithTranslations()` en `homepage-i18n.js` para cargar productos desde Firebase
- Homepage ahora muestra los primeros 3 productos del array de Firebase
- Mantiene soporte multilingüe completo (ES/EN)
- Estructura idéntica a la página de productos

**Archivos modificados**:
- `src/js/homepage-i18n.js` (líneas 138-253)

**Commits relacionados**: Sync Homepage Products with Firebase

---

### 🗑️ Limpieza: Eliminados archivos de test obsoletos

**Archivos eliminados**:
- `test-glow.html` - Archivo de test creado para debugging del efecto glow, ya no necesario

---

## 📚 Mejoras en Documentación

### ✅ Organización de documentación en carpeta `docs/`

**Nuevos archivos**:
- `docs/README.md` - Índice principal de documentación
- `docs/ARQUITECTURA.md` - Arquitectura completa del proyecto
- `docs/CHANGELOG.md` - Este archivo
- `docs/HOVER-GLOW-FIX.md` - Guía técnica del efecto hover
- `docs/AUTH-FLICKER-FIX.md` - Guía del fix de autenticación

---

## 🎯 Próximas mejoras planificadas

- [ ] Implementar modo oscuro
- [ ] Optimizar carga de imágenes con lazy loading
- [ ] Agregar más idiomas (PT, FR)
- [ ] Implementar sistema de favoritos
- [ ] Mejorar SEO con meta tags dinámicas

---

## 📊 Estadísticas de cambios

| Categoría | Archivos modificados |
|-----------|---------------------|
| JavaScript | 3 |
| CSS | 1 |
| HTML | 1 |
| Documentación | 5 |
| **Total** | **10** |

---

**Última actualización**: Diciembre 2025

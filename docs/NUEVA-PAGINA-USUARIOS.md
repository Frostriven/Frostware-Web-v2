# 🎨 Nueva Página de Gestión de Usuarios y Productos

## 📍 Ubicación y Acceso

**Ruta:** `#/admin/users`
**Archivo:** `/src/pages/admin-users/view.js`
**Acceso:** Solo administradores

Desde el panel de admin principal (`#/admin`), hay un enlace en la navegación superior que dice **"Usuarios"** con un ícono de ventana externa.

---

## 🎨 Diseño y Estética

La página fue creada usando el **frontend-design skill** con las siguientes características:

### Estilo Editorial/Magazine Moderno
- **Tipografía:**
  - Display: `Newsreader` (serif elegante para títulos)
  - Body: `DM Sans` (sans-serif profesional)

- **Colores:**
  - Primario: `#22a7d0` (Cyan de Frostware)
  - Gradientes sutiles en avatares y botones
  - Paleta profesional en grises y azules

- **Efectos:**
  - Glassmorphism sutil en overlays
  - Animaciones smooth (fade-in, slide-in)
  - Shadows y transiciones cuidadas
  - Hover states pulidos

---

## 📐 Estructura de la Página

### 1. **Header Superior**
```
┌─────────────────────────────────────────────────────┐
│  ← Panel Admin / Gestión de Usuarios               │
│  [Logo] Gestión de Usuarios                        │
│  Administra usuarios, productos y bases de datos    │
│                              [🔄] [+ Nuevo Usuario] │
└─────────────────────────────────────────────────────┘
```

**Componentes:**
- Breadcrumb navegable
- Logo con gradiente
- Título principal con gradiente
- Botones de acción (Recargar, Nuevo Usuario)

### 2. **Sección de Filtros**
```
┌─────────────────────────────────────────────────────┐
│  🔍 [Buscar por nombre, email o empresa...]         │
│                                                      │
│  [Rol ▼]  [Estado ▼]  [Limpiar filtros]           │
└─────────────────────────────────────────────────────┘
```

**Filtros Disponibles:**
- **Búsqueda:** Texto libre (nombre/email/empresa)
- **Rol:** Todos / Administradores / Usuarios
- **Estado:** Todos / Suscripción activa / Inactivo

### 3. **Tabla de Usuarios**
```
┌────────────────────────────────────────────────────────────────────┐
│  5 usuarios encontrados                                            │
│                                                                     │
│  Usuario          Rol      Productos  Actividad  Suscripción  [👁] │
│  ─────────────────────────────────────────────────────────────────│
│  [JD] John Doe    Admin    3          Hace 2h    Activa       [👁] │
│  [MC] Maria C     Usuario  1          Hace 1d    Inactiva     [👁] │
└────────────────────────────────────────────────────────────────────┘
```

**Columnas:**
- Avatar circular con iniciales
- Nombre, email, empresa
- Badge de rol (Admin/Usuario)
- Contador de productos
- Última actividad (relativa)
- Estado de suscripción
- Botón para ver detalles

---

## 🎯 Panel Lateral de Detalles (Slide-in)

Al hacer clic en "Ver detalles" (👁), se desliza un panel desde la derecha:

```
┌────────────────────────────┐
│  [X]                       │
│  [JD] John Doe             │
│       john@email.com       │
│                            │
│  📋 Información del Usuario│
│  ┌──────────────────────┐ │
│  │ País: USA            │ │
│  │ Empresa: Tech Corp   │ │
│  │ Teléfono: +1234567   │ │
│  │ Rol: [Admin] [→User] │ │
│  └──────────────────────┘ │
│                            │
│  📦 Productos (3)          │
│       [+ Agregar Producto] │
│  ┌──────────────────────┐ │
│  │ NAT OPS              │ │
│  │ Comprado: 15 ene     │ │
│  │ ◉ Activo             │ │
│  │ ───────────────────  │ │
│  │ 📊 Sesiones: 12      │ │
│  │ ⭐ Score: 85%        │ │
│  │ 📝 Preguntas: 450    │ │
│  │ ───────────────────  │ │
│  │ [Gestionar Preguntas]│ │
│  │ [Eliminar]           │ │
│  └──────────────────────┘ │
└────────────────────────────┘
```

### Información Mostrada:

**Sección 1: Datos del Usuario**
- País, empresa, teléfono
- Rol actual con botón para cambiar (Admin ↔ Usuario)

**Sección 2: Productos del Usuario**
- Lista de todos los productos comprados
- Para cada producto:
  - Nombre
  - Fecha de compra
  - Toggle de estado (Activo/Inactivo)
  - Estadísticas:
    - Sesiones completadas
    - Score promedio
    - Preguntas respondidas
  - Botón "Gestionar Preguntas"
  - Botón "Eliminar"

**Botón "Agregar Producto":**
- Dropdown con todos los productos disponibles
- Click para asignar al usuario

---

## 🔧 Modal de Gestión de Preguntas

Al hacer clic en "Gestionar Preguntas" de un producto:

### Tab 1: Base de Datos
```
┌─────────────────────────────────────────────────┐
│  Gestión de Preguntas                      [X] │
│  NAT OPS • John Doe                            │
│                                                 │
│  [Base de Datos]  [Agregar Preguntas]         │
│  ───────────────────────────────────────────── │
│                                                 │
│  ID de Base de Datos                           │
│  [nat-ops-questions                      ]     │
│  Identificador único para la colección...      │
│                                                 │
│  ┌────────────────┐                           │
│  │ 📄 Preguntas   │                           │
│  │    Actuales    │                           │
│  │      450       │                           │
│  └────────────────┘                           │
│                                                 │
│  Preguntas en la Base de Datos                │
│  ┌────────────────────────────────────────┐  │
│  │ COMMUNICATIONS              #abc12345   │  │
│  │ ¿Cuál es la frecuencia HF principal?   │  │
│  │ A. 123.45 MHz                          │  │
│  │ B. 456.78 MHz ✓                        │  │
│  │ C. 789.01 MHz                          │  │
│  │ D. 012.34 MHz                          │  │
│  └────────────────────────────────────────┘  │
│  [Scroll para ver más...]                     │
└─────────────────────────────────────────────────┘
```

### Tab 2: Agregar Preguntas
```
┌─────────────────────────────────────────────────┐
│  Gestión de Preguntas                      [X] │
│  NAT OPS • John Doe                            │
│                                                 │
│  [Base de Datos]  [Agregar Preguntas]         │
│  ───────────────────────────────────────────── │
│                                                 │
│  ℹ️ Formato del JSON de preguntas              │
│  El JSON debe ser un array con: question,      │
│  options, correctAnswer, topic, explanation     │
│                                                 │
│  ┌──────────┐  ┌──────────┐                   │
│  │Actuales  │  │Detectadas│                   │
│  │   450    │  │    -     │                   │
│  └──────────┘  └──────────┘                   │
│                                                 │
│  JSON de Preguntas                             │
│  ┌────────────────────────────────────────┐  │
│  │[{"question": "¿...?",                  │  │
│  │  "options": ["A","B","C","D"],        │  │
│  │  "correctAnswer": 1,                  │  │
│  │  "topic": "Navigation"}]              │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                                 │
│  [✓ Procesar JSON]  [⬆ Insertar a Firebase]  │
└─────────────────────────────────────────────────┘
```

**Funcionalidad:**
1. Pegar JSON de preguntas
2. Click "Procesar JSON" → Valida formato
3. Si válido: Muestra mensaje de éxito + temas detectados
4. Click "Insertar a Firebase" → Guarda en Firestore
5. Actualiza contador de preguntas actuales

---

## 🔄 Flujo de Trabajo Completo

### Escenario 1: Ver Usuario y Sus Productos

```
1. Admin va a #/admin/users
2. Ve tabla con todos los usuarios
3. Click en 👁 de un usuario
4. Panel se desliza desde la derecha
5. Ve información + productos del usuario
6. Puede activar/desactivar productos con toggle
```

### Escenario 2: Agregar Preguntas a un Producto

```
1. En panel de usuario, click "Gestionar Preguntas"
2. Modal aparece con tabs
3. Tab "Base de Datos": Ver preguntas actuales
4. Tab "Agregar Preguntas":
   a. Pegar JSON con preguntas nuevas
   b. Click "Procesar JSON"
   c. Validación exitosa → botón verde se activa
   d. Click "Insertar a Firebase"
   e. Preguntas guardadas → contador actualizado
5. Cerrar modal
```

### Escenario 3: Cambiar Rol de Usuario

```
1. En panel de usuario
2. Ver sección "Información del Usuario"
3. Ver rol actual: [Admin] o [Usuario]
4. Click "Cambiar a Usuario" (o "Cambiar a Admin")
5. Confirmación + actualización en Firebase
6. Badge actualizado
```

---

## 💾 Datos en Firebase

### Estructura Afectada

#### Usuarios (`users/{userId}`)
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  country: "USA",
  company: "Tech Corp",
  role: "admin" | "user",
  isAdmin: true | false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Productos Comprados (`users/{userId}/purchasedProducts/{productId}`)
```javascript
{
  name: "NAT OPS",
  description: "...",
  price: 299,
  image: "https://...",
  category: "aviation",
  appUrl: "https://...",
  purchaseDate: Timestamp,
  status: "active" | "inactive"
}
```

#### Preguntas (`{databaseId}/{questionId}`)
```javascript
{
  question: "¿Pregunta?",
  options: ["A", "B", "C", "D"],
  correctAnswer: 1,
  topic: "Communications",
  explanation: "Porque...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Productos con DB ID (`products/{productId}`)
```javascript
{
  id: "nat-ops",
  name: "NAT OPS",
  databaseId: "nat-ops-questions", // ← Nuevo campo
  // ... otros campos
}
```

---

## 🎨 Componentes de UI

### Badges
- **Admin:** Fondo morado (`#f3e8ff`), texto morado (`#7c3aed`)
- **Usuario:** Fondo gris (`#e3e8ef`), texto gris (`#697386`)
- **Count:** Fondo cyan claro (`#e8f4f8`), texto cyan (`#22a7d0`)

### Status Indicators
- **Activa:** Fondo verde (`#d1fae5`), texto verde oscuro (`#065f46`)
- **Inactiva:** Fondo rojo (`#fee2e2`), texto rojo oscuro (`#991b1b`)

### Botones
- **Primario:** Gradiente cyan, sombra, hover con lift
- **Secundario:** Fondo gris claro, borde, hover oscurece
- **Success:** Gradiente verde, para "Insertar"
- **Ghost:** Transparente, hover con fondo

### Toggle Switch
- Inactivo: Gris (`#cbd2d9`)
- Activo: Cyan (`#22a7d0`)
- Animación suave del slider

### Toast Notifications
- Success: Borde izquierdo verde
- Error: Borde izquierdo rojo
- Info: Borde izquierdo cyan
- Slide-in desde la derecha
- Auto-dismiss después de 3s

---

## 📱 Responsive Design

### Desktop (> 768px)
- Panel lateral: 600px de ancho
- Modal: Max 1000px
- Tabla completa visible

### Mobile (< 768px)
- Panel lateral: 100% ancho
- Modal: 95% ancho, 95% altura
- Tabla con scroll horizontal
- Filtros apilados verticalmente
- Toasts ocupan todo el ancho

---

## 🔐 Permisos y Seguridad

- ✅ Solo usuarios admin pueden acceder
- ✅ Verificación en `renderAdminUsersView()`
- ✅ Redirect a `#/auth` si no autenticado
- ✅ Redirect a `#/admin` si no es admin
- ✅ Todas las operaciones verifican permisos

---

## 🚀 Funciones Principales

### `loadAllUsers()`
Carga todos los usuarios desde Firestore con sus productos

### `renderUsersTable()`
Renderiza la tabla de usuarios filtrados

### `applyFilters()`
Aplica búsqueda y filtros a la lista

### `viewUserDetails(userId)`
Abre el panel lateral con detalles del usuario

### `toggleUserRole(userId)`
Cambia rol Admin ↔ Usuario

### `toggleProductStatus(userId, productId, isActive)`
Activa/desactiva producto del usuario

### `manageProductQuestions(userId, productId, productName)`
Abre modal de gestión de preguntas

### `processQuestionsJSON()`
Valida JSON de preguntas pegado

### `insertQuestionsToFirebase()`
Inserta preguntas validadas a Firestore

### `loadQuestionsFromDB(databaseId)`
Carga y muestra preguntas actuales

### `showToast(message, type)`
Muestra notificación temporal

---

## 🎯 Mejoras vs. Versión Anterior

| Aspecto | Versión Anterior | Nueva Versión |
|---------|-----------------|---------------|
| **Ubicación** | Tab en panel admin | Página dedicada |
| **Espacio** | Limitado en modal | Página completa |
| **Diseño** | Básico TailwindCSS | Editorial/Magazine profesional |
| **Tipografía** | Inter/System | Newsreader + DM Sans |
| **Gestión de Productos** | ❌ No incluida | ✅ Panel completo |
| **Gestión de Preguntas** | ❌ Solo en productos | ✅ Por usuario/producto |
| **Filtros** | ❌ No | ✅ Búsqueda + 2 filtros |
| **Panel Lateral** | ❌ No | ✅ Slide-in suave |
| **Estadísticas** | ❌ No | ✅ Sesiones, score, preguntas |
| **Toggle Estado** | ❌ No | ✅ Switch animado |
| **Validación JSON** | ✅ Sí | ✅ Mejorada + preview |
| **Contadores** | ✅ Básicos | ✅ Diseñados + iconos |
| **Responsive** | ⚠️ Parcial | ✅ Completo |
| **Animaciones** | ⚠️ Básicas | ✅ Smooth + profesionales |

---

## 📚 Archivos Relacionados

```
src/pages/admin-users/view.js     → Página completa (nueva)
src/pages/admin/view.js            → Panel admin con enlace
src/js/main.js                     → Ruta registrada
docs/NUEVA-PAGINA-USUARIOS.md      → Esta documentación
docs/MEJORAS-PANEL-ADMIN.md        → Documentación original
```

---

## 🎬 Próximos Pasos Sugeridos

1. **Estadísticas Reales**
   - Conectar con `user_statistics/{userId}`
   - Mostrar datos reales de sesiones/score

2. **Gestión Completa de Productos**
   - CRUD completo desde el panel
   - Asignar múltiples productos a la vez

3. **Gestión de Preguntas Avanzada**
   - Editar preguntas existentes
   - Eliminar preguntas individuales
   - Búsqueda/filtro de preguntas

4. **Dashboard de Analytics**
   - Gráficos de actividad
   - Métricas de usuarios
   - Performance por producto

5. **Notificaciones**
   - Sistema de notificaciones push
   - Alertas para admins

---

## 🐛 Notas Técnicas

- Las 3 preguntas hardcodeadas en `training/view.js` deberían migrarse a Firebase
- El campo `databaseId` en productos es **opcional** (puede ser null)
- Los contadores se actualizan en tiempo real después de insertar
- El panel lateral usa `position: fixed` con overlay blur
- Todos los estilos están inline en el archivo (no CSS externo)

---

**Creado con:** Claude Code + Frontend Design Skill 🎨
**Fecha:** 2026-01-09

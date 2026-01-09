# 🔄 Flujo Usuario → Producto → Base de Datos

## 📋 Índice
1. [Resumen del Sistema](#resumen-del-sistema)
2. [Estructura de Datos en Firebase](#estructura-de-datos-en-firebase)
3. [Flujo Completo](#flujo-completo)
4. [Asociación Usuario-Producto-Database](#asociación-usuario-producto-database)
5. [Gestión de Preguntas](#gestión-de-preguntas)
6. [Casos de Uso](#casos-de-uso)

---

## 🎯 Resumen del Sistema

El sistema gestiona **usuarios** que compran **productos**, y cada producto tiene acceso a una **base de datos de preguntas** específica.

```
Usuario → Compra Producto → Accede a Base de Datos de Preguntas
```

### Componentes Principales:

1. **Usuarios**: Personas registradas en el sistema
2. **Productos**: Cursos/servicios que se venden
3. **Bases de Datos**: Colecciones de preguntas vinculadas a productos
4. **Productos Comprados**: Relación entre usuario y producto

---

## 🗄️ Estructura de Datos en Firebase

### 1. Colección `products`
Almacena todos los productos disponibles para la venta.

```javascript
products/{productId}
{
  id: "nat-ops",
  name: "NAT OPS",
  description: "Curso de operaciones NAT",
  price: 299,
  rating: 4.5,
  image: "https://...",
  category: "aviation",

  // Campo clave que vincula a la base de datos
  databaseId: "nat-ops-questions",  // ← Importante!

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Nota importante**: El campo `databaseId` es **el nombre de la colección** donde están las preguntas de este producto.

---

### 2. Colección `users`
Almacena información básica de usuarios.

```javascript
users/{userId}
{
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  country: "USA",
  company: "Tech Corp",
  role: "user",  // "user" o "admin"
  isAdmin: false,
  status: "active",  // "active" o "inactive"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 3. Subcolección `users/{userId}/purchasedProducts`
Almacena los productos que cada usuario ha comprado.

```javascript
users/{userId}/purchasedProducts/{productId}
{
  // Información del producto (copiada al momento de compra)
  name: "NAT OPS",
  description: "Curso de operaciones NAT",
  price: 299,
  image: "https://...",
  category: "aviation",
  appUrl: "https://...",

  // Información de la compra
  purchaseDate: Timestamp,
  status: "active",  // "active" o "inactive"

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Importante**:
- El `productId` en esta subcolección debe coincidir con el `id` del producto en la colección `products`
- Esto permite vincular el producto comprado con su base de datos original

---

### 4. Colección de Preguntas `{databaseId}`
Cada producto tiene su propia colección de preguntas, nombrada según su `databaseId`.

```javascript
{databaseId}/{questionId}
// Ejemplo: nat-ops-questions/abc123

{
  question: "¿Cuál es la frecuencia HF principal para NAT?",
  options: [
    "123.45 MHz",
    "456.78 MHz",
    "789.01 MHz",
    "012.34 MHz"
  ],
  correctAnswer: 1,  // Índice de la respuesta correcta (0-based)
  topic: "Communications",
  explanation: "La frecuencia correcta es...",

  // Timestamps para rastrear cambios
  createdAt: Timestamp,
  updatedAt: Timestamp  // Se actualiza cada vez que se edita
}
```

---

### 5. Colección `user_statistics/{userId}`
Almacena estadísticas de rendimiento del usuario.

```javascript
user_statistics/{userId}
{
  userId: "user123",
  totalSessions: 10,
  totalQuestions: 500,
  correctAnswers: 425,
  averageScore: 85,

  // Estadísticas por producto
  productStats: {
    "nat-ops": {
      sessions: 5,
      averageScore: 90,
      totalQuestions: 250,
      correctAnswers: 225,

      // Rendimiento por tema
      topicPerformance: {
        "HF Communications": { correct: 45, total: 50 },
        "RNAV Navigation": { correct: 38, total: 45 }
      }
    },
    "otro-producto": {
      sessions: 5,
      averageScore: 80,
      // ...
    }
  },

  updatedAt: Timestamp
}
```

---

## 🔄 Flujo Completo

### Paso 1: Crear Producto con Base de Datos

**Admin va a:** `#/admin/product/new`

1. Llena el formulario del producto
2. En la sección "Questions Database", especifica el `databaseId`:
   ```
   Database ID: nat-ops-questions
   ```
3. Guarda el producto

**Resultado en Firebase:**
```javascript
// Se crea en products/nat-ops
{
  id: "nat-ops",
  name: "NAT OPS",
  databaseId: "nat-ops-questions",
  // ... otros campos
}
```

---

### Paso 2: Agregar Preguntas a la Base de Datos

**Opción A: Desde el Formulario de Producto**

1. Al crear/editar producto, baja a "Questions Database"
2. Pega el JSON con preguntas:
```json
[
  {
    "question": "¿Pregunta?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 1,
    "topic": "Tema",
    "explanation": "Explicación opcional"
  }
]
```
3. Click "Procesar JSON" → Valida formato
4. Click "Insertar a Firebase" → Guarda

**Opción B: Desde Gestión de Bases de Datos**

**Admin va a:** `#/admin/databases`

1. Selecciona la base de datos "nat-ops-questions"
2. Ve todas las preguntas existentes
3. Puede:
   - **Editar pregunta individual**: Click "Edit" → Modifica → Guarda
   - **Eliminar pregunta**: Click "Delete"
   - **Ver última actualización** de cada pregunta

**Resultado en Firebase:**
```javascript
// Se crean documentos en nat-ops-questions/{questionId}
nat-ops-questions/abc123: { question: "...", updatedAt: Timestamp }
nat-ops-questions/def456: { question: "...", updatedAt: Timestamp }
```

---

### Paso 3: Usuario Compra el Producto

**Usuario en:** `#/products` → Click en producto → "Agregar al carrito" → "Procesar Pago"

**Resultado en Firebase:**
```javascript
// Se crea en users/{userId}/purchasedProducts/nat-ops
{
  name: "NAT OPS",
  description: "...",
  price: 299,
  purchaseDate: Timestamp,
  status: "active",
  // ... toda la info del producto
}
```

**Nota**: El `productId` ("nat-ops") es la clave que conecta todo.

---

### Paso 4: Usuario Accede al Producto

**Usuario en:** `#/account/products` → Click en "NAT OPS" → Abre dashboard

**Flujo interno:**
1. Sistema carga `users/{userId}/purchasedProducts/nat-ops`
2. Lee el `productId`: "nat-ops"
3. Busca en `products/nat-ops` para obtener el `databaseId`
4. Lee `databaseId`: "nat-ops-questions"
5. Carga preguntas desde `nat-ops-questions/*`

---

### Paso 5: Usuario Responde Preguntas

**Usuario en:** `#/training/nat-ops`

**Flujo:**
1. Se cargan preguntas aleatorias desde `nat-ops-questions`
2. Usuario responde
3. Se guardan estadísticas en `user_statistics/{userId}`

```javascript
// Se actualiza en user_statistics/{userId}
{
  productStats: {
    "nat-ops": {
      sessions: 6,  // +1
      totalQuestions: 300,  // +50
      correctAnswers: 270,  // +45
      averageScore: 90,
      // ...
    }
  }
}
```

---

## 🔗 Asociación Usuario-Producto-Database

### Diagrama de Relaciones

```
┌─────────────────┐
│  products       │
│  /nat-ops       │
├─────────────────┤
│ id: "nat-ops"   │
│ name: "NAT OPS" │
│ databaseId:     │───────┐
│ "nat-ops-       │       │
│  questions"     │       │
└─────────────────┘       │
                          │
                          ├──────────────────────────┐
                          │                          │
                          ▼                          │
┌─────────────────────────────────┐                  │
│  users/{userId}/purchasedProducts│                  │
│  /nat-ops                        │                  │
├─────────────────────────────────┤                  │
│ name: "NAT OPS"                  │                  │
│ purchaseDate: Timestamp          │                  │
│ status: "active"                 │                  │
└─────────────────────────────────┘                  │
                                                     │
                                                     │
                          ┌──────────────────────────┘
                          │
                          ▼
            ┌──────────────────────────┐
            │  nat-ops-questions       │
            │  (colección dinámica)    │
            ├──────────────────────────┤
            │  /abc123                 │
            │  { question: "...",      │
            │    updatedAt: Timestamp }│
            ├──────────────────────────┤
            │  /def456                 │
            │  { question: "...",      │
            │    updatedAt: Timestamp }│
            └──────────────────────────┘
```

### Código para Vincular Todo

```javascript
// 1. Obtener producto comprado por usuario
const purchasedProductRef = doc(
  db,
  'users',
  userId,
  'purchasedProducts',
  'nat-ops'  // productId
);
const purchasedProductSnap = await getDoc(purchasedProductRef);

// 2. Obtener info del producto original para databaseId
const productRef = doc(db, 'products', 'nat-ops');
const productSnap = await getDoc(productRef);
const databaseId = productSnap.data().databaseId;  // "nat-ops-questions"

// 3. Cargar preguntas desde la base de datos
const questionsRef = collection(db, databaseId);
const questionsSnap = await getDocs(questionsRef);

// 4. Procesar preguntas
const questions = [];
questionsSnap.forEach(doc => {
  questions.push({
    id: doc.id,
    ...doc.data()
  });
});

console.log(`Cargadas ${questions.length} preguntas`);
```

---

## 📝 Gestión de Preguntas

### Editar Pregunta Individual

**Admin en:** `#/admin/databases` → Selecciona DB → Click "Edit" en pregunta

**Antes:**
```javascript
nat-ops-questions/abc123
{
  question: "¿Pregunta original?",
  options: ["A", "B", "C", "D"],
  correctAnswer: 1,
  topic: "Communications",
  createdAt: Timestamp(2025-01-05),
  updatedAt: Timestamp(2025-01-05)
}
```

**Después de editar:**
```javascript
nat-ops-questions/abc123
{
  question: "¿Pregunta modificada?",
  options: ["A", "B", "C", "D", "E"],  // Agregó opción
  correctAnswer: 2,  // Cambió respuesta
  topic: "Communications",
  createdAt: Timestamp(2025-01-05),  // No cambia
  updatedAt: Timestamp(2025-01-09)   // ← Se actualiza!
}
```

**Ventajas:**
- ✅ Solo actualizas 1 pregunta, no todo el JSON
- ✅ `updatedAt` rastrea cuándo se editó
- ✅ `createdAt` preserva la fecha original
- ✅ Puedes ver en la lista qué preguntas fueron actualizadas recientemente

---

## 🎮 Casos de Uso

### Caso 1: Agregar Nuevo Producto con Preguntas

1. Admin crea producto "IFR Training" con `databaseId: "ifr-questions"`
2. Admin pega JSON con 500 preguntas
3. Admin guarda producto
4. Cliente compra "IFR Training"
5. Cliente accede y empieza a responder preguntas de `ifr-questions`

---

### Caso 2: Actualizar 1 Pregunta Específica

**Problema**: Una pregunta en NAT OPS tiene una respuesta incorrecta.

**Solución:**
1. Admin va a `#/admin/databases`
2. Selecciona "nat-ops-questions"
3. Busca la pregunta (por tema o texto)
4. Click "Edit"
5. Corrige la respuesta
6. Guarda → `updatedAt` se actualiza automáticamente

**Resultado**: Solo esa pregunta se modifica, no hay que re-insertar 500 preguntas.

---

### Caso 3: Ver Qué Preguntas Han Cambiado Recientemente

**Admin en:** `#/admin/databases` → Selecciona DB

- Las preguntas se ordenan por `updatedAt` (más reciente primero)
- Puede ver: "Updated: Today", "Updated: 2d ago"
- Filtra por tema si es necesario

---

### Caso 4: Admin Quiere Asignar Producto a Usuario

**Admin en:** `#/admin/users` → Selecciona usuario → Panel lateral → "Agregar Producto"

1. Selecciona producto del dropdown (ej: "NAT OPS")
2. Click "Agregar"
3. Sistema crea documento en `users/{userId}/purchasedProducts/nat-ops`
4. Usuario ahora tiene acceso al producto y sus preguntas

**Código:**
```javascript
await setDoc(
  doc(db, 'users', userId, 'purchasedProducts', productId),
  {
    ...productData,  // Toda la info del producto
    purchaseDate: serverTimestamp(),
    status: 'active'
  }
);
```

---

### Caso 5: Usuario Ya Compró Producto, ¿Cómo Se Vincula?

**Flujo Automático:**

```javascript
// 1. Dashboard carga producto comprado
const purchasedProduct = await getDoc(
  doc(db, 'users', userId, 'purchasedProducts', 'nat-ops')
);

// 2. Training page obtiene databaseId
const product = await getDoc(doc(db, 'products', 'nat-ops'));
const databaseId = product.data().databaseId;  // "nat-ops-questions"

// 3. Carga preguntas
const questions = await getDocs(collection(db, databaseId));
```

**No se necesita ninguna asociación manual** porque:
- El `productId` en `purchasedProducts` coincide con `products`
- El `databaseId` en `products` apunta a la colección correcta
- Todo está vinculado por IDs

---

## 🔧 Páginas del Sistema

### Para Admin

| Página | Ruta | Función |
|--------|------|---------|
| Panel Admin | `#/admin` | Vista general, gestión de productos/categorías/badges/ofertas |
| Gestión de Usuarios | `#/admin/users` | Ver usuarios, sus productos, estadísticas |
| Formulario de Producto | `#/admin/product/new` | Crear producto, especificar databaseId |
| Editar Producto | `#/admin/product/{id}` | Modificar producto existente |
| **Gestión de Bases de Datos** | **`#/admin/databases`** | **Ver/editar/eliminar preguntas individuales** |
| Crear Usuario | `#/admin/user/new` | Crear nuevo usuario en Firebase |

### Para Usuario

| Página | Ruta | Función |
|--------|------|---------|
| Mis Productos | `#/account/products` | Ver productos comprados |
| Dashboard Producto | `#/dashboard/{productId}` | Estadísticas del producto |
| Entrenamiento | `#/training/{productId}` | Responder preguntas |

---

## ✨ Resumen de Flujos Clave

### Flujo de Creación
```
Admin crea producto con databaseId
  ↓
Admin agrega preguntas (JSON o individual)
  ↓
Preguntas se guardan en colección {databaseId}
  ↓
Producto listo para venta
```

### Flujo de Compra
```
Usuario compra producto
  ↓
Se crea documento en purchasedProducts
  ↓
Usuario accede al dashboard
  ↓
Sistema vincula producto → databaseId → preguntas
  ↓
Usuario responde preguntas
```

### Flujo de Actualización
```
Admin va a gestión de bases de datos
  ↓
Selecciona base de datos del producto
  ↓
Edita pregunta específica
  ↓
updatedAt se actualiza automáticamente
  ↓
Cambios disponibles inmediatamente para usuarios
```

---

## 🎯 Puntos Importantes

### ✅ Lo Que Funciona Automáticamente

- Vinculación Usuario → Producto → Base de Datos
- Carga de preguntas correctas por producto
- Actualización de timestamps en ediciones
- Ordenamiento por fecha de actualización

### ⚠️ Lo Que Requiere Atención

- `databaseId` debe especificarse al crear producto
- `databaseId` debe ser único y descriptivo
- Productos sin `databaseId` no tendrán preguntas
- Eliminar producto no elimina su base de datos (seguridad)

### 🔐 Seguridad

- Solo admins pueden gestionar bases de datos
- Usuarios solo acceden a preguntas de productos comprados
- `status: "inactive"` en producto comprado bloquea acceso

---

## 📚 Archivos Relacionados

```
src/pages/
  ├── admin/view.js                    → Panel principal
  ├── admin-users/view.js              → Gestión usuarios
  ├── product-form/view.js             → Crear/editar productos
  ├── user-form/view.js                → Crear/editar usuarios
  ├── database-management/view.js      → Gestión de preguntas ⭐
  ├── dashboard/view.js                → Dashboard de producto
  └── training/view.js                 → Página de entrenamiento

docs/
  ├── GUIA-COMPLETA.md                 → Guía original del sistema
  ├── NUEVA-PAGINA-USUARIOS.md         → Doc de página usuarios
  ├── MEJORAS-PANEL-ADMIN.md           → Doc panel admin
  └── FLUJO-USUARIO-PRODUCTO-DATABASE.md → Este documento
```

---

**Fecha de creación:** 2026-01-09
**Última actualización:** 2026-01-09
**Creado con:** Claude Code 🤖

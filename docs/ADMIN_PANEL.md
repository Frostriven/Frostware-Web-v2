# 🔐 Panel de Administración - Frostware

## 📋 Descripción General

El panel de administración de Frostware permite gestionar productos de manera completa, incluyendo la capacidad de crear, editar, eliminar productos y controlar cuáles se muestran en la página principal.

---

## 🚀 Acceso al Panel

### Requisitos
1. Usuario autenticado en Firebase
2. Email registrado como administrador en Firestore
3. O email en la lista de administradores del código

### Acceder
1. Inicia sesión en la aplicación
2. Si eres administrador, verás "Admin" en el menú del header
3. Haz clic en "Admin" o navega a `#/admin`

---

## 🎯 Funcionalidades Principales

### 1. **Gestión de Productos**

#### Crear Producto
1. En el panel de administración, haz clic en "Nuevo Producto"
2. Completa el formulario:
   - **Nombre del Producto** (requerido)
   - **Descripción** (requerido)
   - **Precio** (número, requerido)
   - **Categoría** (selecciona de la lista)
   - **Imagen URL** (URL de la imagen del producto)
   - **Badge** (opcional: New, Hot, Sale)
   - **Mostrar en página principal** (checkbox para homepage)
3. Haz clic en "Guardar Producto"

#### Editar Producto
1. En la lista de productos, haz clic en "Editar" en el producto deseado
2. Modifica los campos necesarios
3. Haz clic en "Actualizar Producto"
4. El modal se cerrará automáticamente al guardar

#### Eliminar Producto
1. En la lista de productos, haz clic en "Eliminar"
2. Confirma la acción
3. El producto se eliminará de Firebase inmediatamente

### 2. **Control de Visibilidad en Homepage**

#### Marcar Productos para Homepage
- Al crear o editar un producto, marca el checkbox "Mostrar en página principal"
- Solo los productos marcados aparecerán en la homepage
- Si ningún producto está marcado, se mostrarán los últimos 3 agregados automáticamente

---

## 🔧 Comandos de Consola para Desarrollo

### Funciones Disponibles Globalmente

Todas estas funciones están disponibles en la consola del navegador (F12):

#### Ver Productos
```javascript
// Ver todos los productos en Firebase
await checkFirebaseProducts()

// Ver resumen completo con estadísticas
await showFirebaseSummary()
```

#### Inicializar Sistema
```javascript
// Inicializar categorías y badges
// NOTA: NO crea productos, solo inicializa el sistema
await initFirebaseProducts()
```

#### Crear Producto de Prueba
```javascript
// Crear un producto temporal para desarrollo
await createTestProduct()

// Este comando crea un producto llamado "Producto de Prueba" con:
// - ID: test-product-1
// - Precio: $9.99
// - Categoría: aviation
// - Marcado para homepage
// - Imagen placeholder
```

#### Gestión de Productos
```javascript
// Eliminar producto por ID
await deleteProductById("test-product-1")

// Eliminar productos por nombre (busca coincidencias)
await deleteProductsByName("Producto de Prueba", "Test Product")

// Detectar y listar productos duplicados
await cleanDuplicateProducts()
```

#### Sincronización de Campos
```javascript
// Sincronizar campos alias (name/title, description/shortDescription, etc.)
await syncProductFields()

// Marcar todos los productos para homepage
await markAllProductsForHomepage()

// Marcar productos específicos para homepage
await markProductsForHomepage("product-id-1", "product-id-2")
```

---

## 📊 Estructura de Datos de Productos

### Campos del Producto

```javascript
{
  // Campos principales (usados en página de productos)
  name: "Nombre del Producto",
  description: "Descripción completa del producto",
  image: "https://ejemplo.com/imagen.jpg",

  // Campos alias (usados en homepage)
  title: "Nombre del Producto",
  shortDescription: "Descripción completa del producto",
  imageURL: "https://ejemplo.com/imagen.jpg",

  // Metadatos
  price: 99.99,
  originalPrice: 149.99, // Opcional, para mostrar descuento
  rating: 4.5,
  reviews: 123,

  // Clasificación
  category: "aviation", // aviation, technology, business
  badge: "New", // New, Hot, Sale, o null
  tags: ["tag1", "tag2"],

  // Configuración
  showOnHomepage: true, // Controla si aparece en homepage

  // Características
  features: [
    "Característica 1",
    "Característica 2"
  ],

  // Detalles de página de producto
  detailGradientColors: ["#22a7d0", "#1e90ff", "#4169e1"],

  // URLs
  appUrl: "https://app.ejemplo.com", // URL de la app si aplica
  offerId: null, // ID de oferta especial si aplica

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Campos Requeridos vs Opcionales

**Requeridos:**
- `name` / `title`
- `description` / `shortDescription`
- `price`
- `category`

**Opcionales:**
- `image` / `imageURL` (se usa placeholder si no hay)
- `badge`
- `rating`
- `reviews`
- `features`
- `tags`
- `detailGradientColors`
- `originalPrice`
- `appUrl`
- `offerId`

---

## 🔍 Sistema de Campos Alias

### ¿Por qué existen campos duplicados?

El sistema usa campos alias para compatibilidad entre diferentes páginas:
- **Homepage** usa: `title`, `shortDescription`, `imageURL`
- **Página de Productos** usa: `name`, `description`, `image`

### Sincronización Automática

Al crear o editar un producto desde el panel de administración:
- Se guardan **AMBOS** conjuntos de campos automáticamente
- No necesitas preocuparte por la sincronización manual

### Sincronizar Productos Existentes

Si tienes productos creados antes de esta funcionalidad:
```javascript
await syncProductFields()
```

Esto agregará los campos faltantes a todos los productos.

---

## 🏠 Control de Homepage

### Sistema de Selección de Productos

#### Comportamiento Predeterminado
1. Se muestran productos con `showOnHomepage: true` (máximo 3)
2. Si no hay productos marcados, se muestran los últimos 3 agregados
3. Los productos se ordenan por fecha de creación (más recientes primero)

#### Marcar Productos
```javascript
// Opción 1: Desde el panel de administración
// - Edita el producto
// - Marca el checkbox "Mostrar en página principal"

// Opción 2: Desde la consola
await markProductsForHomepage("product-id-1", "product-id-2")

// Opción 3: Marcar todos
await markAllProductsForHomepage()
```

#### Ver Productos en Homepage
```javascript
await checkFirebaseProducts()
// En la tabla, verás cuáles tienen showOnHomepage: true
```

---

## 🐛 Solución de Problemas

### El modal no se cierra después de guardar
**Solución:** Ya está corregido en la última versión. Si persiste:
1. Recarga la página (Cmd+R / Ctrl+R)
2. Limpia caché del navegador

### Productos duplicados aparecen
**Detectar duplicados:**
```javascript
await cleanDuplicateProducts()
```

**Eliminar duplicados:**
```javascript
// Ve los IDs en la tabla que muestra cleanDuplicateProducts()
await deleteProductById("id-del-duplicado")
```

### Productos de prueba en producción
**Eliminar producto de prueba:**
```javascript
await deleteProductById("test-product-1")
```

**Eliminar por nombre:**
```javascript
await deleteProductsByName("Producto de Prueba")
```

### Productos no aparecen en homepage
**Verificar:**
```javascript
await checkFirebaseProducts()
// Verifica que showOnHomepage sea true
```

**Marcar para homepage:**
```javascript
await markProductsForHomepage("product-id")
```

### Productos aparecen en homepage pero no en página de productos
**Sincronizar campos:**
```javascript
await syncProductFields()
```

### Autenticación no persiste después de reload
**Ya está corregido en la última versión**
- El sistema ahora espera a que Firebase se inicialice antes de verificar el estado de autenticación
- El header se actualiza correctamente después de recargar la página

---

## 🔐 Seguridad

### Reglas de Firestore

Los productos solo pueden ser creados/editados/eliminados por administradores:

```javascript
// Firebase Firestore Rules
match /products/{productId} {
  allow read: if true; // Todos pueden leer
  allow create, update, delete: if isAdmin(); // Solo admins pueden modificar
}

function isAdmin() {
  return request.auth != null &&
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

### Administradores

Los administradores se definen en dos lugares:

1. **Firestore Collection `admins`:**
```javascript
{
  uid: "firebase-user-id",
  email: "admin@example.com",
  role: "admin"
}
```

2. **Código (fallback):**
```javascript
// En src/js/userProfile.js
export function isAdminEmail(email) {
  const adminEmails = ['admin@frostware.com', 'demo@frostware.com'];
  return adminEmails.includes(email.toLowerCase());
}
```

---

## 📝 Mejores Prácticas

### 1. Nombres de Productos
- Usa nombres descriptivos y únicos
- Evita nombres genéricos como "Producto 1"
- Mantén consistencia en el formato

### 2. Descripciones
- Escribe descripciones claras y concisas
- Destaca los beneficios principales
- Usa lenguaje profesional

### 3. Imágenes
- Usa URLs de imágenes estables (no temporales)
- Prefiere imágenes en CDN o Firebase Storage
- Tamaño recomendado: 600x400px o mayor
- Formato: JPG, PNG o WebP

### 4. Precios
- Usa números decimales para centavos (99.99)
- Mantén consistencia en la moneda
- Si hay descuento, usa `originalPrice`

### 5. Categorías
- Usa solo las categorías disponibles
- No crees categorías personalizadas sin agregarlas al sistema
- Categorías actuales: aviation, technology, business

### 6. Homepage
- Mantén máximo 3 productos destacados
- Actualiza regularmente los productos destacados
- Prioriza productos nuevos o en promoción

---

## 🚀 Flujo de Trabajo Recomendado

### Para Crear un Nuevo Producto

1. **Preparación:**
   - Ten lista la imagen del producto (URL)
   - Escribe la descripción en un editor de texto
   - Define el precio y categoría

2. **Creación:**
   - Accede al panel de administración
   - Haz clic en "Nuevo Producto"
   - Completa todos los campos requeridos
   - Marca "Mostrar en homepage" si es un producto destacado
   - Guarda el producto

3. **Verificación:**
   ```javascript
   await checkFirebaseProducts()
   ```
   - Verifica que el producto se creó correctamente
   - Revisa la página principal para ver si aparece
   - Prueba el producto en la página de productos

4. **Ajustes:**
   - Si necesitas modificar algo, edita el producto
   - El modal se cerrará automáticamente al guardar

### Para Desarrollo/Pruebas

1. **Crear producto de prueba:**
   ```javascript
   await createTestProduct()
   ```

2. **Probar funcionalidad:**
   - Verifica que aparece en homepage
   - Verifica que aparece en página de productos
   - Prueba edición y eliminación

3. **Limpiar después de pruebas:**
   ```javascript
   await deleteProductById("test-product-1")
   ```

---

## 📊 Estadísticas y Monitoreo

### Ver Resumen Completo
```javascript
await showFirebaseSummary()
```

Muestra:
- Total de productos
- Productos por categoría
- Rango de precios (mínimo, máximo, promedio)
- Lista detallada de productos

### Detectar Problemas
```javascript
// Detectar duplicados
await cleanDuplicateProducts()

// Ver estructura de productos
await checkFirebaseProducts()
```

---

## 🔄 Migración y Mantenimiento

### Migrar de Productos Hardcodeados a Firebase

**Nota:** Ya no hay productos hardcodeados en el sistema. Todos los productos se gestionan exclusivamente desde Firebase y el panel de administración.

Si tienes productos antiguos que necesitas migrar:

1. **Crear los productos manualmente:**
   - Usa el panel de administración
   - O crea un script de migración

2. **Script de ejemplo:**
```javascript
const oldProducts = [
  { name: "Producto 1", price: 99, ... },
  { name: "Producto 2", price: 149, ... }
];

for (const product of oldProducts) {
  await createProductFromScript(product);
}
```

### Sincronizar Campos Después de Actualizaciones

Después de cualquier actualización del sistema que agregue nuevos campos:
```javascript
await syncProductFields()
await markAllProductsForHomepage() // Si es necesario
```

---

## 💡 Consejos y Trucos

### 1. Desarrollo Rápido
```javascript
// Crear producto de prueba rápidamente
await createTestProduct()

// Eliminar todos los productos de prueba
await deleteProductsByName("Prueba")
```

### 2. Gestión Masiva
```javascript
// Marcar todos para homepage
await markAllProductsForHomepage()

// Sincronizar campos de todos
await syncProductFields()
```

### 3. Debugging
```javascript
// Ver estructura completa
await showFirebaseSummary()

// Ver solo IDs y nombres
await checkFirebaseProducts()

// Detectar inconsistencias
await cleanDuplicateProducts()
```

### 4. Backup Manual
```javascript
// Copiar productos a variable
const backup = await getProductsFromFirebase()
console.log(JSON.stringify(backup, null, 2))
// Copiar el JSON de la consola
```

---

## 🔧 Configuración Avanzada

### Personalizar Funciones de Consola

Todas las funciones están en:
- `src/utils/firebase-init-helper.js`

Para agregar nuevas funciones:
1. Agrégala al archivo
2. Expórtala
3. Agrégala a `window` al final del archivo

### Modificar Comportamiento de Homepage

En `src/js/homepage-i18n.js`:
```javascript
// Cambiar número de productos mostrados
homepageProducts = homepageProducts.slice(0, 3); // Cambiar 3 por otro número

// Cambiar ordenamiento
.sort((a, b) => {
  // Modificar lógica de ordenamiento
})
```

---

## 📚 Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa la consola del navegador** (F12) para errores
2. **Verifica el estado de Firebase:**
   ```javascript
   console.log(firebase.auth?.currentUser)
   console.log(firebase.db)
   ```
3. **Consulta esta documentación**
4. **Revisa las reglas de Firestore** en Firebase Console

---

**Última actualización:** 23 de diciembre de 2025

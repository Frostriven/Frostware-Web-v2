# 📦 Guía de Inserción de Productos en Firebase

Esta guía te ayudará a insertar productos en Firebase usando scripts desde la consola de Chrome.

## 🚀 Método 1: Usando el Script Completo desde la Consola

Este es el método más rápido y directo.

### Pasos:

1. **Abre tu sitio web** en Chrome
2. **Abre la consola de Chrome** (F12 o Cmd+Option+J en Mac)
3. **Abre el archivo** `insert-product-console.txt`
4. **Copia TODO el contenido** del archivo
5. **Pega en la consola** de Chrome
6. **Presiona Enter**
7. **Espera** a que se complete la inserción
8. **Recarga la página** para ver el producto

### Resultado:

Verás un mensaje como este en la consola:

```
✅ ¡PRODUCTO INSERTADO EXITOSAMENTE!
═══════════════════════════════════════════════════════════

📊 RESUMEN DEL PRODUCTO:
   🆔 ID: north-atlantic-ops
   📝 Nombre (ES): Procedimientos Operacionales del Atlántico Norte
   📝 Nombre (EN): North Atlantic Operational Procedures
   💰 Precio: $99 (antes $150)
   📁 Categoría: aviation
   ⭐ Rating: 5/5.0 (342 reviews)
   ✨ Features: 4 simples, 6 detalladas
   🎨 Colores: #1b1b25, #190d36, #1b1b25
```

---

## 📝 Método 2: Usando el Script como Módulo

Si prefieres importar el script desde el código:

```javascript
import '/src/utils/insert-nat-ops-product.js';
```

---

## 🎨 Cómo Personalizar el Producto

### 1. Abre el archivo `insert-product-console.txt`

### 2. Busca la sección "DATOS DEL PRODUCTO"

### 3. Modifica los campos según tu necesidad:

```javascript
const productData = {
  // Cambia el ID único
  id: 'mi-nuevo-producto',

  // Cambia los nombres
  name: {
    es: 'Mi Producto en Español',
    en: 'My Product in English'
  },

  // Cambia las descripciones
  description: {
    es: 'Descripción en español',
    en: 'Description in English'
  },

  // Cambia el precio
  price: 99,
  originalPrice: 150,

  // Cambia la imagen
  image: 'https://tu-imagen.com/imagen.jpg',
  imageURL: 'https://tu-imagen.com/imagen.jpg',

  // Cambia la categoría
  category: 'aviation', // o 'technology', 'education', etc.

  // Cambia el badge
  badge: 'Nuevo',
  badgeColor: 'blue', // o 'green', 'red', 'yellow'

  // Cambia rating y reviews
  rating: 5.0,
  reviews: 100,

  // Cambia los colores del gradiente
  colors: ['#1a202c', '#2d3748', '#4a5568'],
  detailGradientColors: ['#1a202c', '#2d3748', '#4a5568'],

  // Cambia las características simples
  features: [
    'Característica 1',
    'Característica 2',
    'Característica 3',
    'Característica 4'
  ],

  // Cambia las características detalladas
  detailedFeatures: [
    {
      icon: 'code', // Ver iconos disponibles abajo
      title: {
        es: 'Título de la característica',
        en: 'Feature title'
      },
      description: {
        es: 'Descripción de la característica en español',
        en: 'Feature description in English'
      }
    },
    // ... más características
  ]
};
```

---

## 🎯 Iconos Disponibles para `detailedFeatures`

Los siguientes iconos están disponibles para usar en `detailedFeatures`:

| Icono | Uso recomendado |
|-------|-----------------|
| `radio` | Comunicaciones, transmisiones |
| `map` | Navegación, ubicación, rutas |
| `cloud` | Clima, meteorología |
| `warning` | Advertencias, emergencias |
| `certificate` | Certificación, logros |
| `lightning` | Velocidad, rendimiento |
| `code` | Programación, desarrollo |
| `database` | Datos, almacenamiento |
| `shield` | Seguridad, protección |
| `default` | Información general |

---

## 🔧 Campos del Producto

### Campos Obligatorios

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | `string` | Identificador único | `'north-atlantic-ops'` |
| `name` | `object` | Nombre bilingüe | `{ es: '...', en: '...' }` |
| `title` | `object` | Título bilingüe | `{ es: '...', en: '...' }` |
| `description` | `object` | Descripción bilingüe | `{ es: '...', en: '...' }` |
| `price` | `number` | Precio actual | `99` |
| `image` | `string` | URL de imagen | `'https://...'` |
| `imageURL` | `string` | URL de imagen (alias) | `'https://...'` |
| `category` | `string` | Categoría | `'aviation'` |

### Campos Opcionales

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `originalPrice` | `number` | Precio original (descuento) | `150` |
| `shortDescription` | `object` | Descripción corta bilingüe | `{ es: '...', en: '...' }` |
| `longDescription` | `object` | Descripción larga bilingüe | `{ es: '...', en: '...' }` |
| `badge` | `string` | Etiqueta del producto | `'Disponible'` |
| `badgeColor` | `string` | Color del badge | `'blue'` |
| `rating` | `number` | Calificación (0-5) | `5.0` |
| `reviews` | `number` | Número de reseñas | `342` |
| `features` | `array` | Lista de características | `['Feature 1', ...]` |
| `detailedFeatures` | `array` | Características detalladas | `[{ icon, title, description }]` |
| `colors` | `array` | Colores del gradiente | `['#111', '#222', '#333']` |
| `detailGradientColors` | `array` | Colores del gradiente (alias) | `['#111', '#222', '#333']` |
| `tags` | `array` | Etiquetas para búsqueda | `['aviation', 'NAT']` |
| `appUrl` | `string` | URL de la aplicación | `'/apps/...'` |
| `showOnHomepage` | `boolean` | Mostrar en homepage | `true` |
| `offerId` | `string` | ID de oferta (si aplica) | `null` |

---

## 📋 Estructura de `detailedFeatures`

Cada característica detallada debe tener esta estructura:

```javascript
{
  icon: 'nombre-del-icono',  // Ver tabla de iconos arriba
  title: {
    es: 'Título en español',
    en: 'Title in English'
  },
  description: {
    es: 'Descripción en español (más detallada)',
    en: 'Description in English (more detailed)'
  }
}
```

---

## 🎨 Colores Recomendados para Gradientes

### Azul oscuro (profesional)
```javascript
colors: ['#1e293b', '#0f172a', '#334155']
```

### Púrpura (premium)
```javascript
colors: ['#1b1b25', '#190d36', '#1b1b25']
```

### Verde (éxito)
```javascript
colors: ['#064e3b', '#022c22', '#065f46']
```

### Naranja (energía)
```javascript
colors: ['#7c2d12', '#431407', '#9a3412']
```

### Rojo (urgente)
```javascript
colors: ['#7f1d1d', '#450a0a', '#991b1b']
```

---

## 🛠️ Comandos Útiles en la Consola

Una vez que el producto esté insertado, puedes usar estos comandos en la consola:

### Ver todos los productos
```javascript
checkFirebaseProducts()
```

### Ver resumen completo
```javascript
showFirebaseSummary()
```

### Eliminar un producto
```javascript
deleteProductById('north-atlantic-ops')
```

### Eliminar productos por nombre
```javascript
deleteProductsByName('North Atlantic')
```

### Marcar productos para homepage
```javascript
markProductsForHomepage('product-id-1', 'product-id-2')
```

### Sincronizar campos
```javascript
syncProductFields()
```

---

## ✅ Verificación del Producto

Después de insertar el producto, verifica que todo esté correcto:

1. **En la consola:** Revisa el resumen que aparece
2. **En la homepage:** Ve a `/#/` y busca el producto
3. **En la página de productos:** Ve a `/#/products` y verifica que aparezca
4. **En la página de detalles:** Ve a `/#/product/north-atlantic-ops` y verifica que:
   - Se muestre el gradiente correcto
   - Aparezcan todas las características detalladas
   - Los nombres estén en ambos idiomas
   - El precio sea correcto
   - Las imágenes se carguen bien

---

## 🐛 Solución de Problemas

### Error: "Firebase no está inicializado"
- Asegúrate de estar en tu sitio web (no en `localhost` si no lo has configurado)
- Verifica que Firebase esté configurado correctamente en `.env`

### Error: "Permission denied"
- Verifica los permisos de Firestore en Firebase Console
- Asegúrate de estar autenticado si es necesario

### El producto no aparece después de insertarlo
- Recarga la página con `Cmd+R` (Mac) o `Ctrl+R` (Windows)
- Limpia la caché del navegador
- Verifica en la consola con `checkFirebaseProducts()`

### Los colores no se ven bien
- Usa códigos hexadecimales válidos (ej: `#1a202c`)
- Usa 3 colores para un gradiente completo
- Prueba diferentes combinaciones

### Las características detalladas no aparecen
- Verifica que `detailedFeatures` sea un array
- Asegúrate de que cada feature tenga `icon`, `title`, `description`
- Usa iconos válidos de la tabla de iconos

---

## 📚 Ejemplo Completo Mínimo

Si quieres crear un producto simple rápidamente:

```javascript
const productData = {
  id: 'producto-ejemplo',
  name: { es: 'Producto de Ejemplo', en: 'Example Product' },
  title: { es: 'Producto de Ejemplo', en: 'Example Product' },
  description: {
    es: 'Este es un producto de ejemplo',
    en: 'This is an example product'
  },
  price: 50,
  image: 'https://placehold.co/600x400/22a7d0/FFFFFF?text=Ejemplo',
  imageURL: 'https://placehold.co/600x400/22a7d0/FFFFFF?text=Ejemplo',
  category: 'technology',
  showOnHomepage: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
```

---

## 📞 Soporte

Si tienes problemas o preguntas, revisa:
1. Los mensajes de error en la consola
2. La configuración de Firebase en `.env`
3. Los permisos de Firestore en Firebase Console

---

## 🎉 ¡Listo!

Ahora puedes crear productos fácilmente usando estos scripts. Solo modifica los datos del producto y ejecuta el script en la consola.

**Recuerda:** Siempre recarga la página después de insertar un producto para ver los cambios.

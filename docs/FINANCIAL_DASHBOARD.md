# Dashboard Financiero - Frostware

## Descripcion General

El Dashboard Financiero es una herramienta de administracion que permite visualizar estadisticas de ventas, usuarios y productos mas vendidos en tiempo real.

## Acceso

- **URL:** `#/admin/finances`
- **Permisos:** Solo administradores
- **Ubicacion:** Panel de Administracion > Finanzas

## Estructura de Datos

### Coleccion `orders` (Firebase)

```javascript
orders/{orderId}
├── userId: string           // ID del usuario que compro
├── userEmail: string        // Email del usuario
├── productId: string        // ID del producto
├── productName: string      // Nombre del producto (ya procesado, no bilingue)
├── productCategory: string  // Categoria del producto
├── price: number            // Precio de venta
├── originalPrice: number    // Precio original (antes de descuento)
├── currency: string         // "USD"
├── status: string           // "completed" | "pending" | "cancelled"
├── paymentMethod: string    // "demo" | "stripe" | "migrated"
├── createdAt: Timestamp     // Fecha de creacion
└── completedAt: Timestamp   // Fecha de completado
```

## Metricas Disponibles

### Cards de Estadisticas
- **Ingresos Totales:** Suma de todas las ordenes completadas
- **Este Mes:** Ingresos del mes actual
- **Usuarios Registrados:** Total de usuarios en la coleccion `users`
- **Usuarios Activos:** Usuarios con actividad en los ultimos 30 dias

### Graficos
- **Ingresos por Periodo:** Grafico de barras con vista de 7 dias, mes o ano
- **Distribucion de Usuarios:** Grafico donut (activos vs inactivos)

### Tabla de Productos
- Top 10 productos mas vendidos
- Numero de ventas por producto
- Ingresos generados por producto
- Barra de progreso visual

## Funciones del Sistema

### `createOrder(userId, userEmail, productData)`
Crea una nueva orden cuando un usuario compra un producto.

```javascript
import { createOrder } from './userProfile.js';

await createOrder(userId, userEmail, {
  id: 'product-123',
  name: 'Certificacion AWS',
  price: 49.99,
  category: 'aviation'
});
```

### `getFinancialStats()`
Obtiene estadisticas financieras desde la coleccion orders.

```javascript
import { getFinancialStats } from './userProfile.js';

const stats = await getFinancialStats();
// {
//   totalRevenue: 1500.00,
//   todayRevenue: 49.99,
//   monthRevenue: 500.00,
//   yearRevenue: 1500.00,
//   totalOrders: 30,
//   topProducts: [...],
//   revenueByDay: [...],
//   revenueByMonth: [...]
// }
```

### `getUserStats()`
Obtiene estadisticas de usuarios.

```javascript
import { getUserStats } from './userProfile.js';

const userStats = await getUserStats();
// { totalUsers: 150, activeUsers: 90 }
```

### `migrateExistingPurchasesToOrders()`
Migra compras existentes de `purchasedProducts` a la coleccion `orders`.

```javascript
// Ejecutar desde la consola del navegador
migrateExistingPurchasesToOrders()
```

## Reglas de Firestore

```javascript
match /orders/{orderId} {
  // Usuarios autenticados pueden crear ordenes
  allow create: if request.auth != null;

  // Solo admins pueden leer todas las ordenes
  allow read: if isAdmin();

  // Solo admins pueden actualizar/eliminar
  allow update, delete: if isAdmin();
}
```

## Archivos Relacionados

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/finances/view.js` | Vista del dashboard financiero |
| `src/js/userProfile.js` | Funciones de orders y estadisticas |
| `src/js/cart.js` | Proceso de compra (crea ordenes) |
| `src/pages/admin/view.js` | Link al dashboard en panel admin |
| `src/js/main.js` | Registro de ruta |
| `firestore.rules` | Reglas de seguridad |

## Flujo de Datos

```
Usuario compra producto
        │
        ▼
    cart.js
        │
        ├──► addUserProduct()  → users/{uid}/purchasedProducts/{productId}
        │
        └──► createOrder()     → orders/{orderId}
                                      │
                                      ▼
                            Dashboard Financiero
                                      │
                            getFinancialStats()
                                      │
                                      ▼
                            Visualizacion de datos
```

## TODO / Mejoras Futuras

- [ ] Agregar filtros por fecha en el dashboard
- [ ] Exportar reportes a CSV/PDF
- [ ] Graficos con Chart.js para mayor interactividad
- [ ] Notificaciones de ventas en tiempo real
- [ ] Comparativa mes a mes
- [ ] Integracion con pasarela de pagos real (Stripe)
- [ ] Dashboard de reembolsos y cancelaciones

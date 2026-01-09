# Mejoras al Panel de Administración

## Resumen de Cambios

Se ha implementado un sistema completo de gestión en el panel de administración que incluye:

### 1. **Nueva Pestaña de Usuarios** 👥

Se agregó una nueva pestaña "Usuarios" en el panel de administración que permite:

- **Ver todos los usuarios registrados** con información detallada
- **Tabla interactiva** con las siguientes columnas:
  - Usuario (nombre y empresa)
  - Email y país
  - Rol (Admin/Usuario)
  - Cantidad de productos comprados
  - Fecha de registro
  - Acciones (Ver productos, Gestionar)

**Ubicación:** `#/admin` → Tab "Usuarios"

**Funcionalidades:**
- Botón "Recargar" para actualizar la lista de usuarios
- Carga automática de productos comprados por usuario
- Indicadores visuales de roles (Admin en morado, Usuario en gris)
- Avatares con iniciales

---

### 2. **Sistema de Gestión de Preguntas** 📝

Se implementó un sistema completo para gestionar preguntas de productos educativos:

#### Campos Agregados al Formulario de Productos:

**a) ID de Base de Datos**
- Campo para especificar el identificador de la colección de preguntas
- Ejemplo: `nat-ops-questions`
- Este ID se usa para crear/acceder a la colección en Firebase

**b) Sección de Gestión de Preguntas**
Incluye:
- **Información del formato JSON** requerido
- **Contadores en tiempo real:**
  - Preguntas Actuales: Muestra cuántas preguntas hay en Firebase
  - Preguntas Detectadas: Muestra cuántas se detectaron en el JSON
- **Textarea para JSON:** Campo donde pegas el JSON con las preguntas
- **Botón "Procesar JSON":** Valida el formato y estructura del JSON
- **Botón "Insertar a Firebase":** Inserta las preguntas validadas

#### Formato del JSON de Preguntas:

```json
[
  {
    "question": "¿Cuál es la pregunta?",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctAnswer": 0,
    "topic": "Tema de la pregunta",
    "explanation": "Explicación opcional"
  }
]
```

#### Validaciones Implementadas:
- ✅ Verificar que sea un array válido
- ✅ Validar que cada pregunta tenga todos los campos requeridos
- ✅ Verificar que `options` sea un array con al menos 2 opciones
- ✅ Validar que `correctAnswer` sea un índice válido
- ✅ Mostrar temas detectados después de procesar

#### Flujo de Trabajo:
1. Especifica el "ID de Base de Datos" para el producto
2. Pega el JSON de preguntas en el textarea
3. Click en "Procesar JSON" → Se valida el formato
4. Si es válido, se muestra un mensaje de éxito con los temas detectados
5. Click en "Insertar a Firebase" → Las preguntas se guardan en Firestore
6. El contador de "Preguntas Actuales" se actualiza automáticamente

---

### 3. **Campo de Base de Datos en Productos** 🗄️

Se agregó el campo `databaseId` a la estructura de productos:

```javascript
{
  // ... otros campos del producto
  databaseId: "nat-ops-questions", // ID de la colección de preguntas
  // ... más campos
}
```

Este campo se guarda automáticamente cuando creas o editas un producto.

---

## Estructura de Datos en Firebase

### Colección de Preguntas
**Ruta:** `{databaseId}/{questionId}`

Ejemplo: `nat-ops-questions/abc123`

**Estructura de Documento:**
```javascript
{
  question: "¿Pregunta?",
  options: ["A", "B", "C", "D"],
  correctAnswer: 0,
  topic: "Tema",
  explanation: "Explicación opcional",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Productos con Database ID
**Ruta:** `products/{productId}`

```javascript
{
  id: "nat-ops",
  name: "NAT OPS",
  // ... otros campos
  databaseId: "nat-ops-questions", // Nuevo campo
  // ... más campos
}
```

### Usuarios
**Ruta:** `users/{userId}`

Los usuarios se muestran en el panel de admin con:
- Información de perfil
- Conteo de productos comprados
- Rol (admin/usuario)

---

## Funciones JavaScript Agregadas

### Gestión de Preguntas

#### `processQuestionsJSON()`
Procesa y valida el JSON de preguntas pegado en el textarea.

**Validaciones:**
- Formato JSON válido
- Es un array
- Cada pregunta tiene los campos requeridos
- `correctAnswer` es un índice válido de `options`

#### `insertQuestionsToFirebase()`
Inserta las preguntas validadas a Firebase en la colección especificada.

**Características:**
- Usa el `databaseId` del producto
- Agrega timestamps automáticamente
- Actualiza el contador de preguntas actuales
- Limpia el formulario después de insertar

#### `loadCurrentQuestionsCount(databaseId)`
Carga y muestra el conteo actual de preguntas en Firebase.

**Uso:**
- Se ejecuta automáticamente al editar un producto con `databaseId`
- Se ejecuta al cambiar el campo de ID de base de datos (evento `blur`)

### Gestión de Usuarios

#### `loadUsers()`
Carga todos los usuarios desde Firestore y los muestra en la tabla.

**Características:**
- Carga datos del usuario desde `users/{userId}`
- Cuenta productos comprados de cada usuario
- Formatea fechas en español
- Muestra roles con colores distintivos

#### `initializeUsersTab()`
Inicializa la pestaña de usuarios y sus event listeners.

#### `initializeQuestionsManagement()`
Inicializa todos los event listeners de la gestión de preguntas.

---

## Cómo Usar las Nuevas Funcionalidades

### Agregar Preguntas a un Producto

1. Ve al panel de admin: `#/admin`
2. Click en "Editar" de un producto existente o "Agregar Producto"
3. En el formulario:
   - **ID de Base de Datos:** Ingresa un ID único (ej: `nat-ops-questions`)
   - Llena los demás campos del producto
4. Scroll down a la sección "Gestión de Preguntas"
5. Pega tu JSON de preguntas en el textarea
6. Click en "Procesar JSON" → Verás las preguntas detectadas
7. Si todo está OK, click en "Insertar a Firebase"
8. ¡Listo! Las preguntas están ahora en Firestore

### Ver Usuarios

1. Ve al panel de admin: `#/admin`
2. Click en la pestaña "Usuarios"
3. Verás la tabla con todos los usuarios
4. Click en "Recargar" para actualizar la lista
5. Usa "Ver Productos" para ver los productos de un usuario
6. Usa "Gestionar" para administrar un usuario (próximamente)

---

## Mejoras Técnicas

### Performance
- Carga asíncrona de datos
- Validación del lado del cliente antes de insertar
- Contadores en tiempo real

### UX/UI
- Mensajes de validación detallados con colores
- Indicadores visuales de estado
- Botones deshabilitados cuando corresponde
- Animaciones y transiciones suaves

### Seguridad
- Verificación de permisos de admin
- Validación de datos antes de insertar
- Manejo de errores robusto

---

## Archivos Modificados

### `/src/pages/admin/view.js` (Cambios principales)

**Líneas agregadas:**
- Tab de Usuarios (HTML): ~30 líneas
- Sección de Gestión de Preguntas (HTML): ~90 líneas
- Funciones de preguntas: ~200 líneas
- Funciones de usuarios: ~100 líneas

**Total:** ~420 líneas de código nuevo

---

## Próximos Pasos Sugeridos

### Gestión de Usuarios
- [ ] Modal para editar información de usuario
- [ ] Asignar/remover productos a usuarios
- [ ] Cambiar roles (usuario ↔ admin)
- [ ] Ver estadísticas de usuario
- [ ] Gestionar suscripciones

### Gestión de Preguntas
- [ ] Ver todas las preguntas de un producto
- [ ] Editar preguntas individuales
- [ ] Eliminar preguntas
- [ ] Exportar preguntas a JSON
- [ ] Importar desde CSV/Excel

### Estadísticas
- [ ] Dashboard con métricas generales
- [ ] Gráficos de actividad de usuarios
- [ ] Preguntas más difíciles/fáciles
- [ ] Rendimiento por tema

---

## Notas Importantes

### Estructura de Estadísticas de Usuario

Las estadísticas de cada usuario se almacenan en:
`user_statistics/{userId}`

Y las estadísticas por producto están anidadas dentro:
```javascript
{
  userId: "user123",
  totalSessions: 10,
  totalQuestions: 500,
  correctAnswers: 425,
  averageScore: 85,
  productStats: {
    "nat-ops": {
      sessions: 5,
      averageScore: 90,
      totalQuestions: 250,
      correctAnswers: 225,
      topicPerformance: {
        "HF Communications": { correct: 45, total: 50 },
        "RNAV Navigation": { correct: 38, total: 45 }
      }
    }
  }
}
```

### Productos Comprados

Los productos comprados por cada usuario están en:
`users/{userId}/purchasedProducts/{productId}`

Esta es donde se deben gestionar:
- Fecha de compra
- Estado de suscripción
- Estadísticas específicas del producto para ese usuario

---

## Soporte

Para preguntas o problemas:
- Revisa los logs de la consola del navegador
- Verifica que Firebase esté correctamente configurado
- Confirma que el usuario tenga permisos de admin

**Desarrollado con:** Claude Code + Ultra Thinking Mode 🧠

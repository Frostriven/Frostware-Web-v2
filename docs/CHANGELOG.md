# 📝 Changelog

Registro de cambios, fixes y mejoras implementadas en el proyecto Frostware.

---

## 🔧 [Fixes - Diciembre 2025]

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

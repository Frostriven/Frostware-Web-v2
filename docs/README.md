# 📚 Documentación Técnica - Frostware®

Documentación completa para el desarrollo y mantenimiento del proyecto.

---

## 📖 Guías Principales

### 🚀 [GUIA-COMPLETA.md](./GUIA-COMPLETA.md)
**Guía principal del proyecto** - Setup completo, Firebase, estructura de datos, comandos útiles y troubleshooting.

### 🏗️ [ARQUITECTURA.md](./ARQUITECTURA.md)
Arquitectura técnica del sistema, estructura de archivos y patrones de diseño.

### 🌍 [I18N_DOCUMENTATION.md](./I18N_DOCUMENTATION.md)
Sistema de internacionalización (i18n) - Cómo funciona el sistema ES/EN y agregar nuevos idiomas.

### 💻 [DEVELOPMENT.md](./DEVELOPMENT.md)
Guía de desarrollo con mejores prácticas y flujo de trabajo.

### 📝 [CHANGELOG.md](./CHANGELOG.md)
Historial de cambios, mejoras y correcciones.

---

## 🔗 Enlaces Rápidos

- **README Principal**: [../README.md](../README.md)
- **Guía de Inicio**: [GUIA-COMPLETA.md](./GUIA-COMPLETA.md#-inicio-rápido)
- **Firebase Setup**: [GUIA-COMPLETA.md](./GUIA-COMPLETA.md#2-configurar-firebase)
- **Comandos de Consola**: [GUIA-COMPLETA.md](./GUIA-COMPLETA.md#-comandos-útiles-de-consola)

---

## 💡 Para Desarrolladores

### Agregar Nueva Página

1. Crear vista en `src/pages/nueva-pagina/view.js`
2. Crear HTML en `public/pages/nueva-pagina.html`
3. Registrar ruta en `src/js/main.js`
4. Agregar traducciones en `src/i18n/languages/`

### Agregar Nuevo Campo a Productos

1. Actualizar `initialProducts` en `src/js/userProfile.js`
2. Actualizar UI en los archivos correspondientes
3. Ejecutar `await initFirebaseProducts()` en consola

### Debugging

Usa las funciones globales de consola:
```javascript
await checkFirebaseProducts()    // Ver productos
await showFirebaseSummary()      // Ver estadísticas
```

---

## 📝 Convenciones de Código

- **Nombres de archivos**: kebab-case (`product-detail.js`)
- **Nombres de funciones**: camelCase (`getProductsFromFirebase`)
- **Nombres de clases CSS**: Tailwind utilities o kebab-case
- **Comentarios**: Español o inglés, concisos y útiles

---

## 🤝 Contribución

Este es un proyecto de desarrollo individual. Si deseas contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Envía un pull request con descripción detallada

---

## 📞 Contacto

**Frostriven**
GitHub: [@Frostriven](https://github.com/Frostriven)

---

⚡ **Última actualización**: Diciembre 2025

# Guía de Contribución - Frostware® v2.0

¡Gracias por tu interés en contribuir al proyecto Frostware®! Esta guía te ayudará a empezar.

## 🚀 Primeros Pasos

### Configuración del Entorno

1. **Fork del repositorio**
   ```bash
   # Clonar tu fork
   git clone https://github.com/tu-usuario/Frostware-Web-v2.git
   cd Frostware-Web-v2
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales de Firebase
   ```

4. **Configurar upstream**
   ```bash
   git remote add upstream https://github.com/Frostriven/Frostware-Web-v2.git
   ```

## 📋 Tipos de Contribución

### 🐛 Reportar Bugs
- Usa el template de issue para bugs
- Incluye pasos para reproducir
- Agrega capturas de pantalla si es necesario
- Especifica navegador y versión

### ✨ Sugerir Funcionalidades
- Usa el template de issue para features
- Describe claramente el problema que resuelve
- Propón una solución detallada
- Considera la compatibilidad con el diseño actual

### 🔧 Contribuir Código
- Fork el repositorio
- Crea un branch para tu feature
- Sigue las convenciones de código
- Agrega tests si es necesario
- Actualiza documentación

### 📚 Mejorar Documentación
- Corregir errores tipográficos
- Agregar ejemplos
- Clarificar instrucciones
- Traducir contenido

## 🌿 Flujo de Trabajo con Git

### Crear un Branch
```bash
git checkout -b feature/nombre-de-la-funcionalidad
# o
git checkout -b fix/descripcion-del-bug
# o
git checkout -b docs/mejora-en-documentacion
```

### Convenciones de Nombrado
- `feature/` - Nuevas funcionalidades
- `fix/` - Corrección de bugs
- `docs/` - Cambios en documentación
- `style/` - Cambios de formato/estilo
- `refactor/` - Refactorización de código
- `test/` - Agregar o modificar tests

### Mensajes de Commit
Usa el formato [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(alcance): descripción breve

Descripción más detallada si es necesaria.

Fixes #123
```

**Tipos válidos:**
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Formato, punto y coma faltantes, etc
- `refactor:` - Cambio de código que no corrige bug ni agrega feature
- `test:` - Agregar tests faltantes
- `chore:` - Cambios en build, tareas auxiliares, etc

**Ejemplos:**
```bash
git commit -m "feat(auth): agregar login con Google"
git commit -m "fix(router): corregir navegación en mobile"
git commit -m "docs(readme): actualizar instrucciones de instalación"
```

## 📏 Estándares de Código

### JavaScript
- Usar ES6+ features
- Preferir `const` y `let` sobre `var`
- Usar arrow functions cuando sea apropiado
- Manejar errores apropiadamente
- Agregar JSDoc para funciones públicas

```javascript
/**
 * Actualiza el perfil del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} profileData - Datos del perfil
 * @returns {Promise<Object>} Datos actualizados
 */
export async function updateUserProfile(userId, profileData) {
  // implementación
}
```

### CSS/Styling
- Usar TailwindCSS classes
- Mantener consistencia con el diseño existente
- Responsive design first
- Accesibilidad (a11y) considerada

### HTML
- Semántica correcta
- Atributos `alt` para imágenes
- Labels apropiados para formularios
- Estructura accesible

## 🧪 Testing

### Tests Manuales
Antes de enviar PR, verificar:
- [ ] La aplicación inicia sin errores
- [ ] Funcionalidad funciona en Chrome y Firefox
- [ ] Responsive en mobile y desktop
- [ ] No hay errores en consola
- [ ] Firebase emulators funcionan correctamente

### Tests Automatizados
```bash
# Ejecutar linting (cuando esté configurado)
npm run lint

# Ejecutar tests (cuando estén configurados)
npm run test

# Build de producción
npm run build
```

## 📤 Enviar Pull Request

### Preparación
1. **Actualizar branch con upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Verificar que todo funciona**
   ```bash
   npm run build
   npm run dev  # Probar localmente
   ```

3. **Push a tu fork**
   ```bash
   git push origin feature/tu-branch
   ```

### Template de PR
Usar el template proporcionado e incluir:
- [ ] Descripción clara de los cambios
- [ ] Referencias a issues relacionados
- [ ] Capturas de pantalla (si aplica)
- [ ] Checklist de testing completado
- [ ] Documentación actualizada (si aplica)

### Revisión de Código
- Responder a comentarios constructivamente
- Hacer cambios solicitados prontamente
- Mantener conversación respetuosa
- Consolidar commits si es necesario

## 🏷️ Labels y Issues

### Labels de Issues
- `bug` - Error confirmado
- `enhancement` - Mejora sugerida
- `documentation` - Relacionado con docs
- `good first issue` - Bueno para principiantes
- `help wanted` - Se busca ayuda
- `question` - Pregunta sobre el proyecto

### Priority Labels
- `priority: low` - Baja prioridad
- `priority: medium` - Prioridad media
- `priority: high` - Alta prioridad
- `priority: critical` - Crítico

## 🤝 Código de Conducta

### Comportamiento Esperado
- Ser respetuoso y constructivo
- Aceptar críticas constructivas
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía hacia otros miembros

### Comportamiento Inaceptable
- Lenguaje o imágenes ofensivas
- Ataques personales o políticos
- Acoso público o privado
- Publicar información privada sin permiso

## 📞 Obtener Ayuda

### Canales de Comunicación
- **GitHub Issues** - Para bugs y features
- **GitHub Discussions** - Para preguntas generales
- **Email** - Para asuntos privados

### Recursos Útiles
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Guía de Vite](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 🎉 Reconocimiento

Todos los contribuidores serán reconocidos en:
- README.md del proyecto
- Release notes
- Página de contributors

¡Gracias por hacer Frostware® mejor para todos! 🚀
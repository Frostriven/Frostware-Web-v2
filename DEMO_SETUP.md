# 🚀 Sistema de Usuario Demo - Guía de Configuración

## 📋 Resumen

Este sistema te permite trabajar con un usuario persistente sin tener que crear uno nuevo cada vez que abres el simulador.

## 🛠️ **Métodos de Acceso Demo**

### **Método 1: Botón "Login Demo" (Recomendado)**
1. Ve a la página de login (`#/auth/login`)
2. Haz clic en el botón verde **"Login Demo (Desarrollo)"**
3. Se creará automáticamente el usuario `demo@frostware.com` si no existe
4. Si ya existe, simplemente iniciará sesión

### **Método 2: Auto-Login Automático (Opcional)**
1. Abre `src/js/config.js`
2. Cambia `AUTO_DEMO_LOGIN` de `false` a `true`
3. Recarga la página - automáticamente iniciará sesión con el usuario demo

### **Método 3: Credenciales Manuales**
- **Email**: `demo@frostware.com`
- **Password**: `demo123456`

## 👤 **Usuario Demo Configurado**

### **Datos del Usuario:**
- **Email**: demo@frostware.com
- **Password**: demo123456
- **Nombre**: Usuario Demo

### **Productos Pre-configurados:**
- ✅ **Producto Demo 1** - Producto de prueba ($50)
- ✅ **North Atlantic Ops** - Producto principal ($99)

## ⚙️ **Configuración Avanzada**

### **Archivo: `src/js/config.js`**
```javascript
// Habilitar/deshabilitar auto-login
export const AUTO_DEMO_LOGIN = false; // Cambiar a true

// Datos del usuario demo (personalizable)
export const DEMO_USER = {
  email: 'demo@frostware.com',
  password: 'demo123456',
  products: [
    // Agregar más productos demo aquí
  ]
};
```

### **Detección de Entorno de Desarrollo:**
El sistema detecta automáticamente si estás en desarrollo:
- ✅ `localhost`
- ✅ `127.0.0.1`
- ✅ URLs que contengan `dev`
- ✅ URLs con parámetro `?dev=true`

## 🔧 **Funciones Disponibles**

### **En userProfile.js:**
```javascript
// Crear o hacer login del usuario demo
import { createDemoUser, quickDemoLogin } from './userProfile.js';

// Crear usuario si no existe
const user = await createDemoUser();

// Login rápido (crea si no existe)
const user = await quickDemoLogin();
```

### **Uso en Consola del Navegador:**
```javascript
// Login demo rápido desde consola
import('./src/js/userProfile.js').then(module => {
  module.quickDemoLogin();
});
```

## 📊 **Flujo del Sistema Demo**

1. **Primera vez:**
   - Crea usuario `demo@frostware.com` en Firebase Auth
   - Agrega productos demo a la biblioteca del usuario
   - Inicia sesión automáticamente

2. **Visitas posteriores:**
   - Detecta que el usuario ya existe
   - Inicia sesión directamente
   - Mantiene todos los productos comprados

3. **Persistencia:**
   - ✅ Usuario persiste en Firebase Auth
   - ✅ Productos persisten en Firestore
   - ✅ Configuraciones persisten en Firestore
   - ✅ Funciona en cualquier simulador/browser

## 🎯 **Casos de Uso**

### **Para Desarrollo:**
- Probar funcionalidades sin crear usuarios
- Testing de carrito con productos ya comprados
- Validar estados de botones ("Ya lo tienes")
- Testing de navegación entre páginas

### **Para Demos:**
- Mostrar funcionalidad completa a clientes
- Presentaciones sin setup previo
- Testing rápido de features nuevas

## 🚨 **Consideraciones**

### **Seguridad:**
- ⚠️ Solo usar en desarrollo/testing
- ⚠️ No usar credenciales demo en producción
- ⚠️ El botón demo solo aparece en desarrollo

### **Limpieza:**
- El usuario demo se mantiene en Firebase
- Para "reset" total: eliminar desde Firebase Console
- O cambiar email/password en `config.js`

## 🔄 **Reset/Limpieza**

### **Option 1: Firebase Console**
1. Ve a Firebase Console → Authentication
2. Elimina el usuario `demo@frostware.com`
3. Ve a Firestore → Collection `users`
4. Elimina el documento del usuario demo

### **Option 2: Cambiar Credenciales**
1. Modifica `DEMO_USER.email` en `config.js`
2. Cambia `DEMO_USER.password` en `config.js`
3. Recarga la aplicación

## 📝 **Logs y Debugging**

El sistema registra todas las acciones en consola:
```
🚀 Auto-login demo habilitado - iniciando sesión...
Usuario demo ya existe, sesión iniciada: demo@frostware.com
Usuario demo creado: demo@frostware.com
Productos demo agregados al usuario
```

## ✅ **Checklist de Verificación**

- [ ] Usuario `demo@frostware.com` se crea automáticamente
- [ ] Productos demo aparecen en "Mis Productos"
- [ ] Botones en páginas muestran "Ya lo tienes"
- [ ] Carrito funciona correctamente
- [ ] Navegación entre páginas mantiene estado
- [ ] Auto-login funciona si está habilitado

---

**Versión**: 1.0
**Última actualización**: [FECHA]
**Archivo**: DEMO_SETUP.md
# Project Customization Guide

Esta guía detalla todos los lugares que deben personalizarse cuando se utiliza este template para iniciar un nuevo proyecto Angular con Nx.

## 📋 **Checklist de Personalización**

### 🔧 **1. Configuración del Proyecto**

#### package.json
```json
{
  "name": "base-frontend-web", // ➡️ Cambiar por: "tu-proyecto-frontend"
  "version": "0.0.0" // ➡️ Cambiar por versión inicial deseada
}
```

#### tsconfig.base.json
```json
{
  "paths": {
    "shared-features": [ // ➡️ Cambiar por: "tu-proyecto-features"
      "libs/shared-features/src/index.ts" // ➡️ Actualizar ruta correspondiente
    ]
  }
}
```

### 🏗️ **2. Estructura de Directorios**

#### Renombrar Librerías
```bash
# Renombrar directorio principal
mv libs/shared-features libs/tu-proyecto-features

# Actualizar project.json
libs/tu-proyecto-features/project.json:
- "name": "tu-proyecto-features"
- "sourceRoot": "libs/tu-proyecto-features/src"

# Actualizar ng-package.json  
libs/tu-proyecto-features/ng-package.json:
- "dest": "../dist/tu-proyecto-features"
```

#### Renombrar Aplicación (Opcional)
```bash
# Si deseas un nombre más específico
mv apps/app-client apps/tu-proyecto-client

# Actualizar apps/tu-proyecto-client/project.json:
- "name": "tu-proyecto-client"
- Actualizar todas las rutas que contengan "app-client"
```

### 🎨 **3. Marca y Diseño**

#### Index.html
```html
<!-- apps/app-client/src/index.html -->
<title>Base Frontend Web</title> <!-- ➡️ Cambiar por: "Tu Proyecto" -->
<meta name="description" content="Template base para proyectos Angular"> <!-- ➡️ Personalizar -->

<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="favicon.ico"> <!-- ➡️ Reemplazar favicon -->
```

#### Assets e Imágenes
```bash
# Reemplazar logos y recursos
apps/app-client/src/assets/images/
├── logo.svg              # ➡️ Logo principal
├── logo-dark.svg         # ➡️ Logo para tema oscuro  
├── favicon.ico           # ➡️ Favicon del sitio
└── default-avatar.png    # ➡️ Avatar por defecto
```

#### Colores y Temas
```css
/* styles/global.css */
:root {
  --primary-color: #3b82f6;     /* ➡️ Color principal de tu marca */
  --secondary-color: #64748b;   /* ➡️ Color secundario */
  --accent-color: #10b981;      /* ➡️ Color de acento */
}
```

### 🔐 **4. Configuración de Aplicación**

#### Variables de Entorno
```typescript
// apps/app-client/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api', // ➡️ URL de tu API de desarrollo
  appName: 'Base Frontend Web',        // ➡️ Nombre de tu aplicación
  version: '1.0.0'                     // ➡️ Versión inicial
};

// apps/app-client/src/environments/environment.prod.ts  
export const environment = {
  production: true,
  apiUrl: 'https://api.tu-proyecto.com', // ➡️ URL de tu API de producción
  appName: 'Tu Proyecto',                // ➡️ Nombre de tu aplicación
  version: '1.0.0'                       // ➡️ Versión de producción
};
```

#### Configuración de Auth
```typescript
// apps/app-client/src/app/core/services/auth.service.ts
const AUTH_STORAGE_KEY = 'app-user-data'; // ➡️ Cambiar por: 'tu-proyecto-user-data'

// apps/app-client/src/app/app.config.ts - HTTP Interceptor
configureHttpInterceptor({
  authStorageKey: 'app-user-data', // ➡️ Cambiar por: 'tu-proyecto-user-data'
  defaultTimeout: 10000,
  enableLogging: true,
});
```

### 🧩 **5. Componentes y Prefijos**

#### Selector de Componentes
```typescript
// Buscar y reemplazar en toda la aplicación:
@Component({
  selector: 'app-*', // ➡️ Cambiar por: 'tu-proyecto-*'
})
```

#### Prefijo de Librería
```json
// libs/tu-proyecto-features/project.json
{
  "prefix": "app", // ➡️ Cambiar por: "tu-proyecto"
}
```

### 📝 **6. Textos y Contenido**

#### Bienvenida y Mensajes
```typescript
// apps/app-client/src/app/modules/home/pages/dashboard/home.html
<h1>Bienvenido a Base Frontend Web</h1> <!-- ➡️ Personalizar mensaje -->

// apps/app-client/src/app/modules/auth/pages/login/login.html  
<h2>Iniciar Sesión en Base</h2> <!-- ➡️ Personalizar título -->
```

#### Mensajes de Error/Éxito
```typescript
// Buscar en toda la aplicación mensajes como:
'Error en Base Frontend Web' // ➡️ Cambiar por mensajes específicos de tu proyecto
'Bienvenido a Base'          // ➡️ Personalizar saludos
```

### 🌐 **7. URLs y Rutas**

#### Rutas de API
```typescript
// libs/tu-proyecto-features/src/lib/shared/constants/api-endpoints.ts
export const API_ENDPOINTS = {
  auth: '/auth',
  users: '/users', // ➡️ Revisar y ajustar según tu API
  // ... otros endpoints específicos de tu proyecto
};
```

#### Rutas de Navegación
```typescript
// libs/tu-proyecto-features/src/lib/shared/constants/menu-items.ts
export const MENU_ITEMS = [
  { label: 'Inicio', icon: 'pi pi-home', routerLink: '/home' },
  { label: 'Usuarios', icon: 'pi pi-users', routerLink: '/users' }, // ➡️ Personalizar menú
  // ... agregar elementos específicos de tu proyecto
];
```

### 📊 **8. Configuración de Build**

#### Scripts de Package.json
```json
{
  "scripts": {
    "start": "nx serve app-client", // ➡️ Ajustar si renombraste la app
    "build": "nx build app-client", // ➡️ Ajustar si renombraste la app
    "build:libs": "nx build tu-proyecto-features" // ➡️ Actualizar nombre de librería
  }
}
```

#### Presupuestos de Build
```json
// apps/tu-proyecto-client/project.json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "1.8mb", // ➡️ Ajustar según necesidades
    "maximumError": "2.2mb"
  }
]
```

### 🧪 **9. Testing**

#### Configuración de Jest
```typescript
// apps/app-client/jest.config.ts
module.exports = {
  displayName: 'app-client', // ➡️ Cambiar por: 'tu-proyecto-client'
  coverageDirectory: '../../coverage/apps/app-client' // ➡️ Actualizar ruta
};
```

### 📄 **10. Documentación**

#### README.md Principal
```markdown
# Base Frontend Web - Monorepo  ➡️ Cambiar por: "# Tu Proyecto - Monorepo"

Este es un template base para proyectos Angular con Nx.
➡️ Actualizar descripción específica de tu proyecto
```

#### CLAUDE.md
```markdown
# Referencias del proyecto específico
- Cambiar todas las referencias de "Base Frontend Web" por tu proyecto
- Actualizar comandos de scripts específicos
- Documentar configuraciones particulares de tu proyecto
```

## 🔄 **Script de Personalización Automatizada**

Crea un script para automatizar algunos cambios:

```bash
#!/bin/bash
# customize-project.sh

PROJECT_NAME=$1
PROJECT_FEATURES="${PROJECT_NAME}-features"

if [ -z "$PROJECT_NAME" ]; then
    echo "Uso: ./customize-project.sh nombre-proyecto"
    exit 1
fi

echo "Personalizando proyecto para: $PROJECT_NAME"

# Renombrar librería
mv libs/shared-features libs/$PROJECT_FEATURES

# Actualizar package.json
sed -i "s/base-frontend-web/$PROJECT_NAME-frontend/g" package.json

# Actualizar tsconfig.base.json
sed -i "s/shared-features/$PROJECT_FEATURES/g" tsconfig.base.json

echo "Personalización básica completada!"
echo "Revisa la documentación para completar la personalización manual."
```

## ✅ **Lista de Verificación Final**

- [ ] Cambiar nombre del proyecto en package.json
- [ ] Actualizar variables de entorno
- [ ] Reemplazar logos y favicon
- [ ] Personalizar colores del tema
- [ ] Configurar URLs de API
- [ ] Actualizar mensajes de bienvenida
- [ ] Verificar configuración de auth storage
- [ ] Personalizar elementos del menú
- [ ] Actualizar documentación
- [ ] Probar build de producción
- [ ] Verificar todos los tests

## 🚨 **Importante**

1. **Siempre realizar estos cambios en una rama separada**
2. **Probar el build completo después de cada cambio importante**
3. **Mantener una copia del template original como respaldo**
4. **Documentar cambios específicos del proyecto en CLAUDE.md**

Esta guía asegura una personalización completa y sistemática del template para tu nuevo proyecto.
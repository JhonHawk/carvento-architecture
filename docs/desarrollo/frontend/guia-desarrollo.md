# Guía de Desarrollo - Angular Base Frontend Template

## 🚨 REGLAS CRÍTICAS (No Negociables)

1. **SOLO NUEVO FLUJO DE CONTROL**: Nunca uses `*ngIf`, `*ngFor`, `*ngSwitch`. Siempre usa `@if`, `@for`, `@switch`
2. **RESTRICCIÓN DE BARREL FILES**: Solo permitidos en la librería `customer-features`. Nunca crear archivos `index.ts` en aplicaciones

## Descripción General

Esta guía integral consolida todos los patrones de desarrollo esenciales, arquitecturas y prácticas para el monorepo Angular Base Frontend Template. Cubre la creación de componentes, organización de módulos, optimización de barrel files, sistemas de modales, referencia de comandos y consideraciones de rendimiento.

:::tip Arquitectura Moderna
Este proyecto utiliza Angular v20+ con componentes standalone, signals y control flow moderno para máximo rendimiento y mantenibilidad.
:::

---

## Referencia Rápida de Comandos

### Comandos Esenciales

| Categoría | Comando | Descripción |
|----------|---------|-------------|
| **Iniciar Desarrollo** | `npm start` | Iniciar app principal (puerto 4200) |
| | `npm run start:dev` | Iniciar app con watch de librerías |
| **Build & Test** | `npm run build` | Construir aplicación principal |
| | `npm run build:libs` | Construir solo librerías compartidas |
| | `npm run test:all` | Ejecutar todas las pruebas |
| | `npm run lint` | Lintear todos los proyectos |
| **Generación de Componentes** | `nx generate @nx/angular:component --path=libs/customer-features/src/lib/shared/components/<nombre>` | Componente compartido (standalone por defecto) |
| | `nx generate @nx/angular:component --path=apps/<app>/src/app/modules/<module>/pages/<nombre>` | Componente de página accesible por URL |
| **Aseguramiento de Calidad** | `npm run affected:build` | Construir solo proyectos afectados |
| | `npm run affected:test` | Probar solo proyectos afectados |
| | `npm run format` | Formatear código con Prettier |

### Pruebas de Proyectos Individuales

| Comando | Descripción |
|---------|-------------|
| `nx test app-client` | Probar aplicación principal |
| `nx test shared-features` | Probar librería consolidada |
| `nx test <nombre-proyecto> --coverage` | Ejecutar pruebas con reporte de cobertura |

### Flujo de Desarrollo Rápido

| Paso | Comando | Propósito |
|------|---------|-----------|
| 1 | `git pull origin development` | Obtener últimos cambios |
| 2 | `npm install` | Actualizar dependencias |
| 3 | `npm run start:all` | Iniciar ambas aplicaciones |
| 4 | `npm run lint` | Verificar calidad del código |
| 5 | `npm run build` | Construir aplicación principal |

---

## Visión General de la Arquitectura

### Estructura del Monorepo

Este es un **monorepo Nx** con dos aplicaciones Angular distintas y una librería compartida consolidada:

```
Angular Base Frontend Template/
├── apps/
│   └── app-client/              # Aplicación principal
├── libs/
│   └── shared-features/         # Librería compartida consolidada
├── docs/                        # Documentación integral
└── [archivos de configuración]
```

**Arquitectura**: Aplicación única con librería compartida consolidada para máxima reutilización de código y mantenibilidad.

:::info Librería Consolidada
Toda la funcionalidad compartida se ha consolidado en una **única librería** (`customer-features`) siguiendo patrones organizacionales específicos.
:::

### Arquitectura de Librería Consolidada

Toda la funcionalidad compartida se ha consolidado en una **única librería** (`customer-features`) siguiendo este patrón organizacional:

```
libs/shared-features/src/lib/
├── modules/                          # Módulos de lógica de negocio
│   ├── users/                        # Dominio de gestión de usuarios
│   ├── organization-management/      # Dominio de organización
│   └── profile-management/          # Dominio de perfil
├── shared/                          # Preocupaciones transversales
│   ├── components/                  # Componentes UI reutilizables
│   │   ├── layouts/                 # AuthenticatedLayout, UnauthenticatedLayout
│   │   ├── particles-background/    # Efectos de fondo animados
│   │   └── [NO archivos index.ts]   # Solo importaciones directas
│   ├── constants/                  # Constantes de aplicación
│   ├── types/                      # Interfaces TypeScript
│   ├── utils/                      # Servicios, utilidades, interceptor HTTP
│   ├── services/                   # Servicios transversales
│   └── forms/                      # Utilidades de formularios reutilizables
└── index.ts                        # ÚNICO BARREL FILE
```

---

## Arquitectura de Barrel File Único

### Visión General de la Arquitectura

La librería `shared-features` implementa un enfoque de **barrel files mínimos** con solo **un barrel file** en el nivel raíz.

:::warning Importante
Esta arquitectura permite una **reducción del 90%** en barrel files (de 10 a 1) con mejor tree-shaking y builds más rápidos.
:::

**Beneficios:**
- **90% de reducción** en barrel files (de 10 a 1)
- **Mejor tree-shaking** y bundles más pequeños
- **Builds más rápidos** con menos cascadas de re-exportación
- **Cero dependencias circulares** con importaciones directas
- **Mantenimiento más fácil** con un único punto de exportación

### Contenido del Barrel File Único

```typescript
// libs/shared-features/src/index.ts - ÚNICO BARREL FILE
// Este es el ÚNICO barrel file en la librería shared-features

// ===== COMPONENTES COMPARTIDOS =====
// Importaciones directas desde archivos de componentes (NO barrels intermedios)
export { AuthenticatedLayout } from './lib/shared/components/layouts/authenticated-layout/authenticated-layout';
export { UnauthenticatedLayout } from './lib/shared/components/layouts/unauthenticated-layout/unauthenticated-layout';
export { SidebarComponent } from './lib/shared/components/layouts/sidebar/sidebar.component';
export { ParticlesBackgroundComponent } from './lib/shared/components/particles-background/particles-background.component';

// ===== SERVICIOS COMPARTIDOS =====
export { MenuService } from './lib/shared/services/menu.service';
export { DarkModeService } from './lib/shared/utils/dark-mode.service';

// ===== TIPOS COMPARTIDOS =====
export type { UserData, LoginRequest, LoginResponse } from './lib/shared/types/shared-types';

// ===== MÓDULOS DE NEGOCIO =====
// Futuros módulos exportados directamente desde archivos de componentes
// Ejemplo: export { InfoGeneralComponent } from './lib/modules/organization/pages/info-general/info-general.component';
```

### Reglas de Importación y Prevención de Dependencias Circulares

#### Para Aplicaciones Externas (Consumidores)
```typescript
// ✅ CORRECTO: Importar desde barrel file único
import {
  AuthenticatedLayout,
  MenuService,
  UserData,
  ParticlesBackgroundComponent
} from 'shared-features';
```

#### Para Componentes Internos de la Librería
```typescript
// ✅ CORRECTO: Importaciones directas desde archivos específicos
import { DarkModeService } from '../utils/dark-mode.service';
import { MenuItem } from '../services/menu.service';

// ✅ CORRECTO: Usar internal.ts para prevención de dependencias circulares
import { MenuItem, MenuService } from '../../../internal';

// ❌ NUNCA: Importar desde barrel en librería (crea dependencia circular)
import { MenuItem } from 'customer-features'; // NO HACER ESTO
```

### Agregar Nuevos Componentes

#### Paso 1: Generar Componente
```bash
# Componentes compartidos (uso entre módulos)
nx generate @nx/angular:component --path=libs/shared-features/src/lib/shared/components/data-grid

# Componentes específicos de módulo
nx generate @nx/angular:component --path=libs/shared-features/src/lib/modules/users/components/user-profile
```

#### Paso 2: Exportar en Barrel Principal (ÚNICAMENTE)
```typescript
// libs/shared-features/src/index.ts (ÚNICO lugar para agregar exportaciones)
export { DataGridComponent } from './lib/shared/components/data-grid/data-grid.component';
export { UserProfileComponent } from './lib/modules/users/components/user-profile/user-profile.component';
```

#### Paso 3: Usar en Aplicaciones
```typescript
// Las aplicaciones ahora pueden importar directamente
import { DataGridComponent, UserProfileComponent } from 'shared-features';

@Component({
  standalone: true,
  imports: [DataGridComponent, UserProfileComponent],
  template: `
    <app-data-grid [data]="users"></app-data-grid>
    <app-user-profile [user]="selectedUser"></app-user-profile>
  `
})
export class UsersComponent {}
```

:::tip Rendimiento
La librería está marcada con `"sideEffects": false` para optimización de tree-shaking y bundles 83% más pequeños (1.15MB → 194KB gzipped).
:::

---

## Estructura y Organización de Módulos

### Organización Estándar de Módulos

Cada aplicación sigue una estructura `modules/` estandarizada con clara separación entre vistas accesibles por URL y componentes reutilizables:

```
modules/[nombre-modulo]/
├── pages/           # Vistas accesibles por URL desde navegación sidebar
│   ├── users-list/  # Listado principal usando nombres descriptivos (users-list, roles-list, org-chart)
│   ├── user-create/ # Creación - puede ser página O modal dependiendo de complejidad
│   └── user-edit/   # Edición - mismo componente/modal que crear con diferentes reglas
├── components/      # Componentes UI reutilizables (NO accesibles por URL)
│   └── modals/      # Componentes modales para creación/edición (formularios simples)
├── services/        # Servicios específicos del módulo
└── [module].routes.ts
```

### Distinciones Clave

- **`pages/`**: Componentes accesibles vía navegación URL del navegador (ej. `/users-list`, `/user-create`)
- **`components/`**: Piezas UI reutilizables sin acceso directo por URL (user-card, gráficos, modales)
- **Modal vs Página de Creación**: Formularios simples usan modales con DialogService, formularios complejos usan páginas dedicadas
- **Reutilización de Edición**: El mismo componente/modal de crear se usa para editar con diferentes reglas de validación

:::info Decisión de Ubicación
Usa `pages/` para vistas con URL propia, `components/` para elementos reutilizables, y la librería `shared-features` para funcionalidad entre aplicaciones.
:::

### Matriz de Decisión de Ubicación de Componentes

| Caso de Uso | Ubicación | Patrón de Importación | Ejemplo |
|----------|----------|----------------|---------|
| **Vistas accesibles por URL** | `apps/[app]/modules/[module]/pages/` | Importación local directa | `users-list`, `user-create` |
| **UI reutilizable específica de app** | `apps/[app]/modules/[module]/components/` | Importación local directa | `user-card`, modales de creación |
| **Componentes compartidos entre apps** | `libs/shared-features/shared/components/` | `import { Component } from 'shared-features'` | Layouts, UI común |
| **Lógica de negocio de dominio** | `libs/shared-features/modules/[domain]/` | `import { Service } from 'shared-features'` | Servicios de usuario, utilidades |
| **Creación/edición modal** | `apps/[app]/modules/[module]/components/modals/` | Importación local directa | Modales de formularios simples |

---

## Integración del Sistema de Modales

### Criterios de Decisión Modal vs Página

**Usar Modales para Formularios Simples:**
- Operaciones CRUD básicas con 1-5 campos
- Reglas de validación simples
- Flujos de trabajo de creación/edición rápida
- Formularios que no requieren layouts complejos

**Usar Páginas Dedicadas para Formularios Complejos:**
- Wizards multi-paso o formularios con múltiples secciones
- Dependencias complejas de validación
- Formularios que requieren carga de archivos o edición de texto enriquecido
- Formularios con generación dinámica de campos

:::tip Sistema Modal
El sistema de modales proporciona gestión centralizada a través de servicios core especializados para diferentes tipos de operaciones.
:::

### Arquitectura del Sistema de Modales

El sistema de modales proporciona gestión centralizada a través de estos servicios core:

1. **ModalManagerService**: Servicio central para abrir y gestionar modales
2. **ModalRegistryService**: Registra componentes modales con el sistema
3. **ModalInitializationService**: Maneja configuración completa del sistema
4. **ToastService**: Sistema unificado de notificaciones

### Crear Componentes Modales

```bash
# Crear componente modal para formularios simples
nx generate @nx/angular:component --path=apps/app-client/src/app/modules/users/components/modals/user-create-modal

# Estructura de ejemplo:
modules/users/components/modals/
├── user-create-modal/
│   ├── user-create-modal.ts
│   ├── user-create-modal.html
│   ├── user-create-modal.css
│   └── user-create-modal.spec.ts
```

### Integración con DialogService

```typescript
// En configuración de menú sidebar
const menuItems = [
  {
    name: 'Crear Usuario',  // Auto-genera tooltip desde nombre
    icon: 'pi pi-user-plus',
    command: () => this.openUserCreateModal()
  }
];

// Método del componente para abrir modal
private dialogService = inject(DialogService);

openUserCreateModal(): void {
  const dialogRef = this.dialogService.open(UserCreateModalComponent, {
    header: 'Crear Nuevo Usuario',
    width: '500px',
    modal: true,
    closable: true,
    data: {
      mode: 'create' // o 'edit' con datos de usuario para edición
    }
  });

  dialogRef.onClose.subscribe((result) => {
    if (result) {
      // Manejar creación/edición exitosa
      this.refreshUserList();
    }
  });
}
```

### Patrón de Reutilización para Edición

```typescript
// El mismo componente modal usado tanto para crear como para editar
@Component({
  selector: 'app-user-create-modal',
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <p-dialog-header>
        {{ isEditMode ? 'Editar Usuario' : 'Crear Usuario' }}
      </p-dialog-header>
      <!-- Campos del formulario -->
      <div class="flex justify-end gap-2 mt-4">
        <p-button
          label="Cancelar"
          severity="secondary"
          (click)="onCancel()">
        </p-button>
        <p-button
          label="{{ isEditMode ? 'Actualizar' : 'Crear' }}"
          type="submit"
          [disabled]="userForm.invalid">
        </p-button>
      </div>
    </form>
  `
})
export class UserCreateModalComponent {
  private dialogRef = inject(DynamicDialogRef);
  private data = inject(DynamicDialogConfig).data;

  isEditMode = signal(false);
  userForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email])
  });

  ngOnInit() {
    this.isEditMode.set(this.data?.mode === 'edit');
    if (this.isEditMode() && this.data?.user) {
      this.userForm.patchValue(this.data.user);
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
```

:::warning Referencia Cruzada
Para patrones avanzados de modales globales, consulta [Guía de Modales Globales](./modales-globales).
:::

---

## Patrones de Creación de Componentes

### Estándares de Angular v20+

Todos los componentes en este proyecto siguen estos patrones modernos de Angular:

- **Componentes standalone por defecto** (no se necesita flag `--standalone`)
- **Sin NgModules**: Todos los componentes son standalone
- Usar `ChangeDetectionStrategy.OnPush` para todos los componentes
- Preferir funciones `input()` y `output()` sobre decoradores
- Usar signals con `signal()`, `computed()`, y `update()/set()`

### Ejemplos de Creación de Componentes

#### Componentes de Aplicación (Páginas Accesibles por URL)

```bash
# Componentes de página usando nombres descriptivos
nx generate @nx/angular:component --path=apps/backoffice-client/src/app/modules/users/pages/users-list
nx generate @nx/angular:component --path=apps/backoffice-client/src/app/modules/users/pages/user-create
```

#### Componentes de Aplicación (UI Reutilizable)

```bash
# Componentes reutilizables dentro de una aplicación
nx generate @nx/angular:component --path=apps/backoffice-client/src/app/modules/users/components/user-card
```

#### Componentes Compartidos (Uso Entre Apps)

```bash
# Componentes usados en ambas aplicaciones
nx generate @nx/angular:component --path=libs/customer-features/src/lib/shared/components/data-table
```

#### Componentes Específicos de Dominio

```bash
# Componentes de lógica de negocio para dominios específicos
nx generate @nx/angular:component --path=libs/shared-features/src/lib/modules/users/components/user-profile
```

### Plantilla de Componente Moderno

```typescript
import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example-component',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4 bg-white dark:bg-zinc-800 rounded-lg">
      <h2 class="text-xl font-semibold text-zinc-900 dark:text-white">
        {{ title() }}
      </h2>

      <div class="flex items-center gap-2">
        <p-button
          label="Acción"
          (click)="handleAction()"
          [disabled]="disabled()"
          class="bg-blue-600 hover:bg-blue-700">
        </p-button>

        @if (showCounter()) {
          <span class="text-sm text-zinc-600 dark:text-zinc-300">
            Contador: {{ counter() }}
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";

    .custom-highlight {
      @apply bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg;
      @apply dark:bg-blue-900/20 dark:border-blue-300;
    }
  `]
})
export class ExampleComponent {
  // Funciones modernas de input/output
  title = input.required<string>();
  disabled = input(false);
  actionClicked = output<void>();

  // Gestión de estado basada en signals
  private counter = signal(0);
  private showCounter = signal(true);

  // Propiedades computadas
  displayValue = computed(() => {
    return this.counter() > 0 ? `Activo (${this.counter()})` : 'Inactivo';
  });

  handleAction() {
    this.counter.update(count => count + 1);
    this.actionClicked.emit();
  }
}
```

### Mejores Prácticas

**✅ Recomendado:**
- Crear componentes como **standalone** (por defecto en Angular 20+)
- Usar **detección de cambios OnPush** consistentemente
- Aplicar **gestión de estado basada en signals** para reactividad
- Implementar **patrones de limpieza apropiados** con `DestroyRef`
- Seguir **patrones explícitos de importación/exportación** para tree-shaking

**❌ Evitar:**
- NgModules (el proyecto usa componentes standalone)
- Inyección compleja en constructor (preferir función `inject()`)
- Exportaciones wildcard (`export *`) en barrel files
- Crear componentes compartidos para uso de una sola app

:::tip Control Flow Moderno
Recuerda usar SIEMPRE la nueva sintaxis de control flow: `@if`, `@for`, `@switch` en lugar de `*ngIf`, `*ngFor`, `*ngSwitch`.
:::

---

## Rendimiento y Optimización de Bundle

### Métricas de Rendimiento Actuales

**Tamaños de Bundle:**
- **App Client**: 1.15MB raw, 194.95kB gzipped
- **Librería Shared Features**: ~220KB módulos ESM2022 compilados

**Optimizaciones Clave:**
1. **Optimización de Memoria**: Detección de cambios OnPush + reactividad basada en signals
2. **Lazy Loading Eficiente**: División de código basada en rutas con payload mínimo
3. **Excelencia en Tree-Shaking**: Eliminación agresiva de código muerto
4. **Optimización para Navegadores Modernos**: Solo 34KB de polyfills

### Desglose de Rendimiento de Librería

```
Composición de Librería Shared-Features:
- Componentes: 116KB compilados
- Utils: 66KB compilados
- Servicios: 21KB compilados
- Types: 6KB compilados
- Constantes: Overhead mínimo
```

### Comandos de Rendimiento de Build

```bash
# Análisis de bundle
npm run build             # Analizar bundle de app principal
npm run build:libs        # Verificar compilación de librería

# Objetivos de monitoreo de rendimiento
# - Tamaño de bundle inicial: <200KB gzipped
# - Tamaños de chunks lazy: <100KB por chunk
# - Efectividad de tree-shaking: >95%
# - Uso de memoria: Optimización OnPush + signals
```

:::info Rendimiento
El proyecto mantiene bundles optimizados con 83% de ratio de compresión y lazy loading eficiente para excelente rendimiento en tiempo de ejecución.
:::

---

## Manejo de Errores y Solución de Problemas

### Problemas Comunes de Importación

```typescript
// ✅ Correcto para componentes compartidos (desde aplicaciones)
import { DataTableComponent } from 'shared-features';

// ✅ Correcto para componentes específicos de app
import { UsersList } from './pages/list/users-list';

// ✅ Correcto para componentes internos de librería
import { MenuItem, DarkModeService } from '../../internal';

// ❌ Incorrecto - evitar rutas relativas para código compartido (desde aplicaciones)
import { DataTableComponent } from '../../../libs/shared-features/...';

// ❌ Incorrecto - dependencia circular (dentro de librería)
import { MenuItem } from 'shared-features';
```

### Resolución de Dependencias Circulares

**Síntoma**: Build falla con "Entry point has a circular dependency on itself"

**Causa**: Componentes de librería importando desde punto de entrada principal (`customer-features`)

**Solución**: Usar importaciones internas dentro de componentes de librería
```typescript
// Dentro de componentes de librería, usar:
import { MenuItem, DarkModeService } from '../../../internal';

// En lugar de:
import { MenuItem } from 'customer-features'; // Causa dependencia circular
```

**Prevención**: Reglas ESLint detectan automáticamente estos casos durante desarrollo

### Problemas de Estructura de Módulos

**Problemas Comunes:**
- **pages/**: Componentes accesibles por URL (enrutamiento) - usar nombres descriptivos como `users-list`, `roles-list`
- **components/**: Piezas UI reutilizables (sin enrutamiento) - incluye modales para formularios simples
- **Decisión Modal vs Página**: Formularios simples → modales con DialogService; Formularios complejos → páginas dedicadas
- **Reutilización de Edición**: Mismo componente/modal de crear usado para editar con validación diferente

:::warning Solución de Problemas
Para errores de build después de cambios en barrel files, usa un enfoque sistemático: construir cada proyecto individualmente para aislar errores.
:::

---

## Estándares de Pruebas

### Patrones de Pruebas Modernas

El proyecto usa **Jest** para pruebas unitarias con prácticas modernas de testing de Angular:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

import { ExampleComponent } from './example.component';

describe('ExampleComponent', () => {
  let component: ExampleComponent;
  let fixture: ComponentFixture<ExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleComponent], // Componente standalone
      providers: [
        provideRouter([]), // Requerido para inyección de Router
        provideHttpClient() // Requerido para servicios HttpClient
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;

    // Establecer inputs requeridos
    fixture.componentRef.setInput('title', 'Título de Prueba');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle signal updates', () => {
    component.handleAction();
    expect(component.counter()).toBe(1);
  });

  it('should emit action events', () => {
    spyOn(component.actionClicked, 'emit');
    component.handleAction();
    expect(component.actionClicked.emit).toHaveBeenCalled();
  });
});
```

### Dependencias de Pruebas

**Providers Requeridos:**
- Componentes usando Router necesitan `provideRouter([])`
- Servicios HttpClient necesitan `provideHttpClient()`
- Componentes basados en signals funcionan perfectamente con TestBed

### Comandos de Pruebas

```bash
# Ejecutar todas las pruebas
npm run test:all

# Probar proyectos específicos
nx test app-client
nx test shared-features

# Probar con cobertura
nx test <nombre-proyecto> --coverage

# Ejecutar solo pruebas afectadas
npm run affected:test
```

:::tip Testing
El proyecto mantiene 97/97 pruebas pasando con patrones de testing modernos y cobertura integral.
:::

---

## Resumen

Esta guía integral de desarrollo proporciona todos los patrones esenciales para desarrollo exitoso en el monorepo Angular Base Frontend Template:

### Logros Clave
- **Arquitectura Consolidada**: Barrel file único con 90% de reducción en complejidad
- **Angular v20+ Moderno**: Componentes standalone con signals y patrones modernos
- **Optimización de Rendimiento**: 83% de ratio de compresión y tree-shaking óptimo
- **Integración de Sistema Modal**: Gestión centralizada de modales con type safety
- **Pruebas Integrales**: 97/97 pruebas pasando con patrones de testing modernos

### Flujo de Desarrollo
1. **Organización de Módulos**: Clara distinción páginas vs componentes con integración modal
2. **Creación de Componentes**: Ubicación óptima y flujos de trabajo de generación
3. **Optimización de Importaciones**: Patrón de barrel file único amigable para tree-shaking
4. **Monitoreo de Rendimiento**: Análisis de bundle y estrategias de optimización
5. **Resolución de Errores**: Solución sistemática de problemas para issues comunes

### Resumen de Mejores Prácticas
- **Usar componentes standalone** con detección de cambios OnPush
- **Seguir arquitectura de barrel file único** para importaciones
- **Aplicar criterios de decisión modal vs página** para interfaces de usuario
- **Implementar gestión de estado basada en signals** para reactividad
- **Mantener cobertura integral de pruebas** con patrones modernos

Seguir estos patrones asegura tamaños de bundle óptimos, estructura de código mantenible y excelente rendimiento en tiempo de ejecución en ambas aplicaciones.

---

## Autor

**Desarrollado por:** Tricell Software Solutions
**Proyecto Base:** Angular Base Frontend Template - Guía de Desarrollo
**Versión:** 1.0.0
**Fecha:** Enero 2025

*Este proyecto base fue creado para facilitar el desarrollo de aplicaciones Angular modernas con mejores prácticas y arquitectura consolidada.*
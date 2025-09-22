# Visión General del Frontend - Angular Base Template

## Descripción del Proyecto

Este Angular Base Frontend Template sirve como fundación para construir aplicaciones Angular modernas con mejores prácticas, arquitectura consolidada y patrones probados para la plataforma Carvento.

## Características Principales

### Arquitectura
- **Aplicación única**: Arquitectura simplificada con una aplicación principal
- **Librería consolidada**: Toda la funcionalidad compartida en la librería `shared-features`
- **Angular moderno**: Construido con Angular v20+ y las últimas mejores prácticas

### Stack Tecnológico
- **Angular 20.2.0**: Versión estable más reciente con signals y control flow moderno
- **PrimeNG 20.0.0+**: Librería de componentes con theming personalizado
- **Tailwind CSS v4**: Framework CSS utility-first con paleta de colores zinc
- **Nx Monorepo**: Herramientas de desarrollo y gestión de workspace
- **Jest**: Framework de testing unitario
- **TypeScript**: Modo strict habilitado

### Características Implementadas
- ✅ Soporte para modo oscuro con detección de preferencias del sistema
- ✅ Interceptor HTTP con enfoque funcional
- ✅ Sistema de notificaciones toast
- ✅ Efectos de partículas de fondo
- ✅ Guards de autenticación y routing
- ✅ Layouts y componentes responsivos
- ✅ Cobertura completa de testing (97/97 tests pasando)

## Estructura del Proyecto

```
Angular Base Frontend Template/
├── apps/
│   └── app-client/            # Aplicación principal
├── libs/
│   └── shared-features/       # Librería compartida consolidada
├── docs/                      # Documentación completa
├── tools/                     # Herramientas de workspace personalizadas
├── nx.json                    # Configuración de Nx
├── tsconfig.base.json         # Configuración base de TypeScript
└── package.json               # Dependencias del paquete
```

## Primeros Pasos

### Prerrequisitos
- Node.js 18+
- npm 9+

### Instalación y Desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start                  # App principal (puerto 4200)

# Build para producción
npm run build

# Ejecutar tests
npm run test:all

# Lint del código
npm run lint
```

## Patrón de Desarrollo de Módulos

### Estructura Estándar de Módulos
```
modules/[module-name]/
├── pages/           # Vistas accesibles por URL
├── components/      # Componentes UI reutilizables
├── services/        # Servicios específicos del módulo
└── [module].routes.ts
```

### Creación de Componentes
```bash
# Componentes compartidos
nx generate @nx/angular:component --path=libs/shared-features/src/lib/shared/components/<name>

# Componentes de aplicación
nx generate @nx/angular:component --path=apps/app-client/src/app/modules/<module>/components/<name>
```

## Estándares de Angular v20+

### Características Modernas Obligatorias
- **Componentes standalone** (sin NgModules)
- **Nuevo control flow**: `@if`, `@for`, `@switch` en lugar de directivas estructurales
- **Gestión de estado basada en signals**
- **Función `inject()`** en lugar de inyección por constructor
- **Estrategia de detección OnPush**

:::warning[Reglas Críticas]
1. **SOLO NUEVO CONTROL FLOW**: Nunca usar `*ngIf`, `*ngFor`, `*ngSwitch`. Siempre usar `@if`, `@for`, `@switch`
2. **RESTRICCIÓN DE BARREL FILES**: Solo permitidos en la librería `shared-features`. Nunca crear archivos `index.ts` en aplicaciones
:::

### Ejemplos de Código Moderno

```typescript
// ✅ CORRECTO - Angular v20+
@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vehicle(); as v) {
      <div class="vehicle-card">
        <h3>{{ v.make }} {{ v.model }}</h3>
        @for (photo of v.photos; track photo.id) {
          <img [src]="photo.url" [alt]="photo.description">
        }
        @switch (v.status) {
          @case ('available') {
            <span class="status-available">Disponible</span>
          }
          @case ('reserved') {
            <span class="status-reserved">Reservado</span>
          }
          @default {
            <span class="status-other">{{ v.status }}</span>
          }
        }
      </div>
    }
  `
})
export class VehicleCardComponent {
  private vehicleService = inject(VehicleService);

  vehicle = input.required<Vehicle>();
  onSelect = output<Vehicle>();

  isAvailable = computed(() =>
    this.vehicle()?.status === 'available'
  );
}
```

## Características Implementadas

### Sistema de Notificaciones Toast
```typescript
private toastService = inject(ToastService);
this.toastService.showSuccess('Éxito', 'Operación completada');
```

- **Toast global**: Un solo `<p-toast>` en `app.html` previene duplicados
- **ToastService**: Ubicado en `apps/app-client/src/app/services/toast.service.ts`

### Sistema de Interceptor HTTP
Interceptor funcional con 70-80% de reducción de memoria:

```typescript
// Configuración en main.ts
import { httpInterceptor, configureHttpInterceptor } from 'shared-features';

configureHttpInterceptor({
  authStorageKey: 'user-data',
  defaultTimeout: 10000,
  enableLogging: true,
});
```

### Implementación de Modo Oscuro
```typescript
private darkModeService = inject(DarkModeService);
isDarkMode = this.darkModeService.isDarkMode; // Signal
this.darkModeService.toggleTheme();

// Propiedades computed reactivas
backgroundColor = computed(() =>
  this.isDarkMode() ? '#0f0f0f' : '#ffffff'
);
```

### Sistema de Partículas de Fondo
```typescript
import { ParticlesBackgroundComponent } from 'shared-features';

<app-particles-background
  [backgroundColor]="backgroundColor()"
  [particleColor]="particleColor()">
  <div class="content"><!-- contenido --></div>
</app-particles-background>
```

## Estándares de CSS: Tailwind CSS v4

### Uso Primario
Clases utility de Tailwind con **paleta de colores zinc**:

```html
<div class="flex items-center p-4 bg-white rounded-lg dark:bg-zinc-800">
  <h2 class="text-xl font-semibold text-zinc-900 dark:text-white">Título</h2>
</div>
```

### CSS Personalizado (Fallback)
Solo cuando Tailwind no puede lograr el efecto:

```css
@reference "tailwindcss";

.sidebar-menu-item {
  @apply flex items-center gap-1 px-3 py-1 rounded-lg transition-all;
  @apply text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700;
}
```

:::tip[Estándar FloatLabel]
**OBLIGATORIO**: Todos los componentes FloatLabel DEBEN usar `variant="on"` para UX consistente:

```html
<!-- ✅ CORRECTO -->
<p-floatlabel variant="on">
  <input pInputText id="field" [(ngModel)]="value" />
  <label for="field">Etiqueta del Campo</label>
</p-floatlabel>
```
:::

:::caution[Restricción de Override de PrimeNG]
**NUNCA sobrescribir estilos nativos de PrimeNG** a menos que el usuario lo solicite explícitamente:

- Los componentes PrimeNG manejan sus propios estados de validación
- Los comportamientos nativos de focus, hover e interactivos deben permanecer intactos
- Evitar `::ng-deep` para sobrescribir estilos internos de PrimeNG
:::

## Comandos de Desarrollo

```bash
# Desarrollo y Build
npm start                  # Aplicación principal (puerto 4200)
npm run start:dev          # Modo desarrollo con watch de librerías
npm run build              # Build aplicación principal
npm run build:libs         # Build solo librerías compartidas

# Control de Calidad
npm run lint              # Lint todos los proyectos
npm run test:all          # Ejecutar todos los tests
npm run format            # Formatear código con Prettier

# Comandos affected (solo código cambiado)
npm run affected:build    # Build solo proyectos afectados
npm run affected:test     # Test solo proyectos afectados
```

## Arquitectura de Importaciones

### Desde Aplicaciones
```typescript
// ✅ CORRECTO - Usar exports externos
import { ButtonComponent, formatDate, UserType } from 'shared-features';
```

### Dentro de la Librería
```typescript
// ✅ CORRECTO - Usar exports internos
import { MenuItem, DarkModeService } from '../../../internal';

// ❌ INCORRECTO - Causa dependencias circulares
import { MenuItem } from 'shared-features';
```

## Convenciones de Estructura

### Estructura de Módulos
- **Pages**: Accesibles por URL vía routing
- **Components**: NO accesibles por URL, reutilizables
- **Formularios simples**: Usar modales con DialogService
- **Formularios complejos**: Usar páginas dedicadas

### Estructura de Librería
```
shared-features/src/lib/
├── modules/              # Lógica de negocio
├── shared/components/    # Componentes UI
├── shared/utils/         # Servicios, interceptors
├── shared/types/         # Interfaces TypeScript
├── shared/constants/     # Constantes de la app
└── shared/internal.ts    # Exports internos
```

---

:::info[Documentos Relacionados]
- **[Guía de Desarrollo](./guia-desarrollo)** - Creación de componentes y arquitectura
- **[Guía de Estilos](./guia-estilos)** - Tailwind CSS v4 y theming
- **[Interceptores HTTP](./interceptores-http)** - Implementación de interceptores
- **[Modales Globales](./modales-globales)** - Patrón de modales globales
:::

---

**Desarrollado por:** Tricell Software Solutions
**Proyecto Base:** Angular Base Frontend Template
**Versión:** 1.0.0
**Fecha:** Enero 2025
# Angular Base Frontend Template - Monorepo

This project is an Nx-powered monorepo template containing multiple Angular applications and consolidated shared libraries for enterprise frontend development.

## Autor

**Desarrollado por:** Tricell Software Solutions
**Proyecto Base:** Angular Base Frontend Template
**Versión:** 1.0.0
**Fecha:** Enero 2025

---

*Este proyecto base fue creado para facilitar el desarrollo de aplicaciones Angular modernas con mejores prácticas y arquitectura consolidada.*

## 🚨 CRITICAL RULES

1. **NEW CONTROL FLOW ONLY**: Never use `*ngIf`, `*ngFor`, `*ngSwitch`. Always use `@if`, `@for`, `@switch`
2. **BARREL FILES RESTRICTION**: Only allowed in `shared-features` library. Never create `index.ts` files in applications

## Contributor Guide & Documentation

- Contributor guide: see [AGENTS.md](./AGENTS.md)
- Development guide: [docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)
- Styling and Tailwind v4: [docs/STYLING_GUIDE.md](./docs/STYLING_GUIDE.md)
- HTTP interceptor details: [docs/HTTP_INTERCEPTOR_GUIDE.md](./docs/HTTP_INTERCEPTOR_GUIDE.md)
- Global modals implementation: [docs/GLOBAL_MODALS_GUIDE.md](./docs/GLOBAL_MODALS_GUIDE.md)
- Agent notes and common commands: [CLAUDE.md](./CLAUDE.md)
- Ongoing work log: [docs/DEVELOPMENT_TRACKING.md](./docs/DEVELOPMENT_TRACKING.md)

## Architecture

The monorepo follows a modular architecture with one main application and shared libraries:

### Application

- **app-client**: Main application for the system

### Consolidated Library Architecture

The `libs/` directory now contains a **single consolidated library** that eliminates code duplication and simplifies imports:

- **shared-features**: Centralized library containing all shared functionality organized by domain:
  - `modules/` - Business logic modules (users, organization-management, profile-management)
  - `shared/components/` - Reusable UI components, layouts, and design system elements
  - `shared/utils/` - Pure functions, utilities, HTTP interceptors, and helper services
  - `shared/types/` - TypeScript interfaces and types used across applications
  - `shared/constants/` - Application constants and configuration values
  - `shared/services/` - Cross-cutting services
  - `shared/forms/` - Reusable form components and utilities

**Benefits of Consolidation:**

- **Single Import Source**: All shared code imported from one location (`shared-features`)
- **Circular Dependency Prevention**: Stratified export architecture prevents build issues
- **Consistent Structure**: Same `modules/` + `shared/` pattern as application
- **Reduced Complexity**: Consolidated shared functionality in single library
- **Easier Maintenance**: Single library to manage instead of multiple dependencies

#### Circular Dependency Prevention

The library uses **stratified exports** to prevent circular dependencies:

- **External API** (`libs/shared-features/src/index.ts`): For application consumption
- **Internal API** (`libs/shared-features/src/lib/shared/internal.ts`): For library components only
- **ESLint Enforcement**: Automatic prevention of circular imports during development

```typescript
// ✅ Application
import { SidebarComponent } from 'shared-features';

// ✅ Library components
import { MenuItem } from '../../internal';

// ❌ Never (circular dependency)
import { MenuItem } from 'shared-features'; // Within library
```

### Application-Specific Modules

The application has its own `modules/` directory following a standardized structure:

#### Module Structure Convention

Every module follows this standardized organization:

```
modules/[module-name]/
├── pages/           # Views accessible by URL routes from sidebar
│   ├── users-list/  # Main listing using descriptive names (users-list, roles-list, org-chart)
│   ├── user-create/ # Creation - can be page OR modal depending on complexity
│   ├── user-edit/   # Edit - same component/modal as create with different rules
│   └── [other]/     # Additional route-accessible pages (profile-view, security-view)
├── components/      # Reusable components NOT accessible by URL
│   └── modals/      # Modal components for creation/editing (simple forms)
├── services/        # Module-specific services
└── [module].routes.ts
```

**Key Distinction:**

- **`pages/`**: Components accessible via browser URL navigation (e.g., `/users-list`, `/user-create`)
- **`components/`**: Reusable components that cannot be accessed directly via URL (e.g., user-card, charts, modals)
- **Modal vs Page Creation**: Simple forms use modals with DialogService, complex forms use dedicated pages
- **Edit Reuse**: The same create component/modal is used for editing with different validation rules

**Sidebar Navigation & Modals**:

- Some sidebar menu items open modals using the `command` property instead of routing
- MenuItem interface auto-generates tooltips from the `name` property (no separate tooltip parameter)
- App modules are placed in shared-features library for cross-app reuse

**Additional Components**: Components that don't appear in sidebar navigation include:

- Area creation modals, profile view, security view, notifications drawer

#### Example Module Structure

```typescript
// modules/users/users.routes.ts - Updated naming conventions
export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/users-list/users-list').then((m) => m.UsersListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/user-create/user-create').then((m) => m.UserCreateComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/user-edit/user-edit').then((m) => m.UserEditComponent),
  },
];

// Alternative: Modal-based creation using DialogService
// Some sidebar items use 'command' property to open modals instead of routing
const menuItems = [
  {
    name: 'Create User', // Auto-generates tooltip from name
    command: () => this.dialogService.open(UserCreateModalComponent),
  },
];
```

#### App Client (`apps/app-client/src/app/modules/`)

- **auth**: User authentication
- **home**: Dashboard with application metrics and quick actions
- **users**: User management (list/create/edit pages + reusable components)
- **organization**: Organization management tools
- **profile**: User profile management

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Features

### 🌙 Dark Mode Support

The application includes a comprehensive dark mode implementation with **zinc color palette**:

- **Toggle Button**: Dark mode toggle in top navigation with sun/moon icons
- **Signal-Based Reactivity**: Angular v20+ signals for reactive theme changes
- **System Preference Detection**: Automatically detects and respects user's OS theme preference
- **Persistent Storage**: Remembers user's theme choice across browser sessions using localStorage
- **Custom Selector**: Uses `.app-dark` selector (not PrimeNG's default `.p-dark`)
- **Comprehensive Integration**: Seamless PrimeNG, Tailwind CSS v4, and custom component theming
- **Zinc Color Palette**: Modernized from gray to zinc for better consistency (`bg-zinc-50`, `dark:bg-zinc-900`)

### 🔔 Global Toast Notifications

- **Unified System**: Single `<p-toast>` in app prevents duplicates with consistent `translateX(100%)` animation
- **Toast Service**: Injectable service with `showSuccess()`, `showError()`, `showInfo()`, `showWarning()` methods using PrimeNG Aura theme

### 🌐 HTTP Interceptor System

Modern functional HTTP interceptor with performance optimizations:

- **Functional Design**: Angular v20+ functional interceptors (70-80% memory reduction vs class-based)
- **Authentication**: Automatic Authorization header injection from localStorage
- **Request Logging**: Memory-conscious logging with configurable verbosity levels
- **Timeout Management**: Per-request and global timeout configuration
- **Performance**: 50-75% faster request processing with better tree-shaking
- **📖 Full Documentation**: [`docs/HTTP_INTERCEPTOR_GUIDE.md`](./docs/HTTP_INTERCEPTOR_GUIDE.md)

### 🎨 Particle Backgrounds

Animated particle effects for enhanced visual appeal:

- **Interactive Particles**: Mouse hover and click interactions with particle system
- **Theme-Reactive**: Particle colors automatically adjust to current theme (light/dark)
- **Configurable**: Customizable particle count, speed, colors, and link distances
- **Performance Optimized**: Efficient cleanup and memory management

## Available Commands

### Development Scripts

| Script                     | Command                                                                              | Description                    | Ports      |
| -------------------------- | ------------------------------------------------------------------------------------ | ------------------------------ | ---------- |
| `npm start`                | `nx serve app-client`                                                               | Start main app (default)      | 4200       |
| `npm run start:dev`        | `nx serve app-client --watch`                                                       | Start app with lib watch       | 4200       |

### Build Scripts

| Script                     | Command                                                                              | Description                                   |
| -------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| `npm run build`            | `nx build app-client`                                                               | Build main app (default)                     |
| `npm run build:libs`       | `nx build shared-features`                                                          | Build the consolidated shared library         |
| `npm run watch`            | `nx build app-client --watch --configuration development`                           | Build main app in watch mode                 |

### Testing Scripts

| Script                  | Command                           | Description                              |
| ----------------------- | --------------------------------- | ---------------------------------------- |
| `npm test`              | `nx test app-client`              | Run main app tests (default)            |
| `npm run test:all`      | `nx run-many --target=test --all` | Run tests for all projects (apps + libs) |
| `npm run affected:test` | `nx affected --target=test`       | Run tests only for affected projects     |

### Code Quality Scripts

| Script                  | Command                           | Description                         |
| ----------------------- | --------------------------------- | ----------------------------------- |
| `npm run lint`          | `nx run-many --target=lint --all` | Lint all projects with ESLint       |
| `npm run affected:lint` | `nx affected --target=lint`       | Lint only affected projects         |
| `npm run format`        | `nx format:write`                 | Format code with Prettier           |
| `npm run format:check`  | `nx format:check`                 | Check if code is properly formatted |

### Development Utilities

| Script                   | Command                      | Description                       |
| ------------------------ | ---------------------------- | --------------------------------- |
| `npm run ng`             | `ng`                         | Run Angular CLI commands          |
| `npm run graph`          | `nx graph`                   | View interactive dependency graph |
| `npm run affected:build` | `nx affected --target=build` | Build only affected projects      |

### Quick Start

```bash
# Install dependencies
npm install

# Start development
npm start              # Main app (port 4200)
# OR
npm run start:dev      # App with lib watch

# Run tests and lint
npm run test:all
npm run lint

# Build for production
npm run build
```

## Development Guide

### Consolidated Library Usage

All shared functionality is now available from a single import source:

```typescript
// BEFORE: Multiple library imports
import { AuthenticatedLayout, UnauthenticatedLayout, Header, Sidebar } from 'customer-features';
import { formatDate, AuthUtils } from 'utils-core';
import { UserData, LoginRequest } from 'shared-types';
import { API_ENDPOINTS, APP_CONFIG } from 'shared-constants';

// AFTER: Single consolidated import
import {
  AuthenticatedLayout,
  UnauthenticatedLayout,
  Header,
  Sidebar, // components
  formatDate,
  AuthUtils, // utils
  UserData,
  LoginRequest, // types
  API_ENDPOINTS,
  APP_CONFIG, // constants
} from 'shared-features';
```

### Available Shared Components

#### Layouts (from `shared-features`)

- `UnauthenticatedLayout` - Simple layout for login/register pages
- `AuthenticatedLayout` - Full layout with header, sidebar, and content area
- `Header` - Top navigation bar with user menu
- `Sidebar` - Configurable side navigation menu

#### Authentication Utilities (`utils-core`)

- `AuthUtils.hasUserData(storageKey)` - Check if user data exists in localStorage
- `AuthUtils.getUserData(storageKey)` - Get user data from localStorage
- `AuthUtils.setUserData(userData, storageKey)` - Save user data to localStorage
- `AuthUtils.isAuthenticated(storageKey)` - Check authentication status
- `AuthUtils.hasPermission(permission, storageKey)` - Check user permissions

### Creating Components

#### Application-Specific Components (Recommended)

Most components should be created within the specific application:

```bash
# Application components
npx nx generate @nx/angular:component login --path=apps/app-client/src/app/modules/auth/components --changeDetection=OnPush --style=css

# Dashboard components
npx nx generate @nx/angular:component dashboard --path=apps/app-client/src/app/modules/dashboard --changeDetection=OnPush --style=css

# Feature components
npx nx generate @nx/angular:component user-management --path=apps/app-client/src/app/modules/management/components --changeDetection=OnPush --style=css
npx nx generate @nx/angular:component profile --path=apps/app-client/src/app/modules/profile/components --changeDetection=OnPush --style=css
```

#### Shared Components (Only when truly reusable)

Only create shared components when they will be used by **both applications**:

```bash
# Add component to UI shared library (rare cases only)
npx nx generate @nx/angular:component libs/customer-features/src/lib/shared/components/modal --export --changeDetection=OnPush --style=css
npx nx generate @nx/angular:component libs/customer-features/src/lib/shared/components/data-table --export --changeDetection=OnPush --style=css
```

### Creating Services

#### Application-Specific Services (Recommended)

Services should typically be application-specific due to different APIs:

```bash
# Auth services
npx nx generate @nx/angular:service apps/app-client/src/app/modules/auth/services/auth

# Feature services
npx nx generate @nx/angular:service apps/app-client/src/app/modules/management/services/user-management
npx nx generate @nx/angular:service apps/app-client/src/app/modules/profile/services/profile
```

### Creating Guards

Guards are application-specific due to different localStorage keys:

```bash
# Create guards manually in app's core/guards directory
# Example structure:
# apps/app-client/src/app/core/guards/auth.guard.ts  (uses 'user-data')

# Import guards directly (no barrel exports for app-specific code)
import { authGuard } from './core/guards/auth.guard';
import { unauthGuard } from './core/guards/auth.guard';
```

### Creating New Shared Libraries (Advanced)

**⚠️ Important**: Only create shared libraries for code that will be used by **both applications**. Most features should remain application-specific.

```bash
# UI library (shared components and design system)
npx nx generate @nx/angular:library <name> --buildable --standalone

# Utility library (pure functions, no Angular dependencies)
npx nx generate @nx/js:library utils-<name> --buildable

# Types library (TypeScript interfaces and types)
npx nx generate @nx/js:library shared-<name> --buildable
```

### Working with Routes

#### Application Routes Structure

Each application has its own routing configuration:

```typescript
// apps/app-client/src/app/app.routes.ts
export const appRoutes: Route[] = [
  // Unauthenticated routes (login, forgot-password)
  {
    path: '',
    loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.authRoutes),
  },

  // Authenticated routes (dashboard, management)
  {
    path: 'dashboard',
    component: AuthenticatedLayout,
    canActivate: [authGuard],
    children: [
      // ... dashboard routes
    ],
  },
];
```

#### Adding New Routes

```bash
# Create new module routes file
touch apps/app-client/src/app/modules/management/management.routes.ts

# Example module routes structure:
```

```typescript
// apps/app-client/src/app/modules/management/management.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards';

export const managementRoutes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./components/user-list').then((m) => m.UserListComponent),
  },
  {
    path: 'roles',
    loadComponent: () => import('./components/role-list').then((m) => m.RoleListComponent),
  },
];
```

### Working with Forms

Use Angular's reactive forms with the new signal-based approach:

```typescript
// Example form component
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <input formControlName="email" type="email" placeholder="Email" />
      <input formControlName="password" type="password" placeholder="Password" />
      <button type="submit" [disabled]="loginForm.invalid || isLoading()">Login</button>
    </form>
  `,
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  isLoading = signal(false);

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      // Handle form submission
    }
  }
}
```

### Working with State Management

Use Angular signals for reactive state management:

```typescript
// Service with signals
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users = signal<User[]>([]);
  private isLoading = signal(false);

  // Read-only computed signals
  readonly usersSignal = this.users.asReadonly();
  readonly isLoadingSignal = this.isLoading.asReadonly();
  readonly activeUsersCount = computed(() => this.users().filter((user) => user.isActive).length);

  loadUsers() {
    this.isLoading.set(true);
    // Load users logic
  }

  addUser(user: User) {
    this.users.update((users) => [...users, user]);
  }
}
```

### Development Guidelines

1. **Standalone Components**: All components are standalone by default (no `--standalone` flag needed in Angular 20+)
2. **OnPush Change Detection**: Always use OnPush change detection strategy
3. **Signals**: Prefer signals over RxJS for simple reactive state
4. **Inject Function**: Use `inject()` instead of constructor injection
5. **CSS**: Use CSS for component styling
6. **Control Flow**: Use new `@if`, `@for`, `@switch` syntax instead of structural directives
7. **TypeScript Strict**: Maintain strict TypeScript configuration
8. **Path Mapping**: Use absolute imports via tsconfig paths (e.g., `import { AuthUtils } from 'utils-core'`)
9. **Import Strategy**: Direct imports for app code, path mappings for shared libraries

## CSS and Styling Standards

### Primary CSS Framework: Tailwind CSS v4

This project uses **Tailwind CSS v4** as the primary utility framework with **zinc color palette** as the standard. All development must follow these standards:

#### ✅ **Primary Approach: Tailwind CSS Classes**

Use Tailwind CSS utility classes as the primary method for styling components:

```html
<!-- ✅ PREFERRED: Tailwind utility classes with zinc palette -->
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md dark:bg-zinc-800">
  <h2 class="text-xl font-semibold text-zinc-900 dark:text-white">User Profile</h2>
  <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
    Edit Profile
  </button>
</div>

<!-- ✅ PREFERRED: Responsive design with zinc palette -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
  <div class="bg-zinc-50 dark:bg-zinc-700 p-4 rounded-lg">Content</div>
</div>
```

#### 🔄 **Fallback: Custom CSS Classes**

Custom CSS classes should **only** be used when Tailwind classes don't exist or can't accomplish the desired styling:

```css
/* ✅ ACCEPTABLE: When Tailwind can't achieve the desired effect */
.custom-gradient-border {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
  background-size: 300% 300%;
  animation: gradient-animation 4s ease infinite;
}

.complex-animation {
  transform-origin: center;
  animation: pulse-scale 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

#### 🎨 **CSS Mixins: Alternative Approach**

CSS mixins are also valid for reusable styling patterns:

```css
/* ✅ ACCEPTABLE: Reusable mixins for consistent patterns */
@mixin card-shadow {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
}

@mixin button-base {
  @apply px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2;
}
```

#### 🔧 **Essential Tailwind Directives: @apply and @reference**

**@reference Directive** - Critical for component-scoped CSS:

```css
/* ❌ WITHOUT @reference - @apply fails in component CSS */
.menu-item-base {
  display: flex; /* Manual CSS required */
  align-items: center;
}

/* ✅ WITH @reference - Enables @apply in component CSS */
@reference "tailwindcss";

.menu-item-base {
  @apply flex items-center gap-1 text-base rounded-lg transition-all;
  @apply text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700;
}
```

**@apply Directive** - Brings Tailwind utilities to custom CSS:

```css
@reference "tailwindcss";

/* ✅ RECOMMENDED: Complex component patterns */
.sidebar-menu-item {
  @apply flex items-center gap-1 px-3 py-1 rounded-lg transition-all;
  @apply text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700;

  /* Custom properties for advanced behavior */
  transform-origin: left center;
  animation: slideIn 0.3s ease-out;
}
```

**Critical Requirements:**

- **Always include `@reference "tailwindcss";`** at the top of component CSS files using @apply
- **Use zinc color palette** instead of gray (e.g., `bg-zinc-50`, `text-zinc-900`)
- **Prefer dark mode utilities** with `dark:` prefix over custom dark mode CSS

#### ❌ **Avoid: Unnecessary Custom Classes**

Don't create custom classes when Tailwind utilities can accomplish the same result:

```html
<!-- ❌ AVOID: Custom class when Tailwind exists -->
<div class="custom-flex-center">Content</div>

<!-- ✅ USE INSTEAD: Tailwind utilities -->
<div class="flex items-center justify-center">Content</div>
```

### Tailwind CSS v4 Context

This project uses **Tailwind CSS v4** as the standard utility framework with the following benefits:

#### **Advantages of Tailwind CSS v4:**

- **Consistent Design System**: Predefined spacing, colors, and sizing scales
- **Performance**: Better tree-shaking and smaller CSS bundles
- **Developer Experience**: IntelliSense support and rapid development
- **Maintainability**: Reduced custom CSS and standardized utility classes
- **Responsive Design**: Built-in responsive modifiers (sm:, md:, lg:, xl:)
- **Dark Mode**: Native dark mode support with `dark:` modifier

#### **Tailwind CSS v4 Configuration**

The project uses the modern Tailwind CSS v4 syntax with `@use` directives in `styles/global.css`:

```css
@use 'primeicons/primeicons.css';

/* Tailwind CSS v4 configuration */
@use 'tailwindcss';
@plugin "tailwindcss-primeui";
@custom-variant dark (&:where(.app-dark, .app-dark *));
```

This configuration provides:

- **@use "tailwindcss"**: Modern CSS module import for Tailwind CSS v4 (replaces old `@import` syntax)
- **@plugin "tailwindcss-primeui"**: PrimeNG integration plugin for seamless component styling
- **@custom-variant dark**: Custom dark mode variant using `.app-dark` selector instead of default `.dark`
- **Zinc Color Palette**: Standardized color scheme replacing gray for better consistency and modern aesthetics

#### **When to Use Each Approach:**

| Scenario                          | Approach             | Example                                 |
| --------------------------------- | -------------------- | --------------------------------------- |
| Standard layouts, spacing, colors | **Tailwind classes** | `flex items-center p-4 bg-blue-600`     |
| Complex animations or effects     | **Custom CSS**       | Keyframe animations, complex transforms |
| Reusable component patterns       | **CSS mixins**       | Button variants, card styles            |
| PrimeNG component overrides       | **Custom CSS**       | Deep component styling                  |

#### **Best Practices:**

1. **Tailwind First**: Always check if Tailwind utilities can achieve the desired styling
2. **Custom When Necessary**: Only write custom CSS for effects impossible with utilities
3. **Consistent Naming**: Use BEM methodology for custom classes when needed
4. **Component Scoping**: Prefer component-scoped styles over global CSS
5. **Responsive Design**: Use Tailwind's responsive modifiers for mobile-first design

### Component Styling Examples

```typescript
@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <!-- ✅ Primary: Tailwind utilities with zinc palette -->
    <div
      class="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div class="flex items-center space-x-4 mb-4">
        <img class="w-12 h-12 rounded-full" [src]="user.avatar" [alt]="user.name" />
        <div>
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">{{ user.name }}</h3>
          <p class="text-sm text-zinc-600 dark:text-zinc-300">{{ user.role }}</p>
        </div>
      </div>

      <!-- ✅ Fallback: Custom class for specialized styling -->
      <div class="status-indicator" [class.status-active]="user.isActive">
        {{ user.isActive ? 'Active' : 'Inactive' }}
      </div>
    </div>
  `,
  styles: [
    `
      /* ✅ Custom CSS with @reference for @apply support */
      @reference "tailwindcss";

      .status-indicator {
        @apply px-2 py-1 rounded-full text-xs font-medium;
        background-color: #fef3c7;
        color: #92400e;
      }

      .status-active {
        background-color: #d1fae5;
        color: #065f46;
      }
    `,
  ],
})
export class UserCardComponent {
  // Component logic
}
```

This approach ensures **consistency**, **maintainability**, and **performance** while providing flexibility for complex styling requirements that Tailwind utilities cannot address.

### Import Strategy & Barrel Exports

This project follows a **selective approach** to barrel exports (`index.ts` files):

#### ✅ **Keep Barrel Exports** for Shared Libraries

```typescript
// These are maintained for clean public APIs
import { AuthenticatedLayout, Header } from 'customer-features';
import { AuthUtils } from 'utils-core';
import { LoginRequest, UserData } from 'shared-types';
```

#### ❌ **Avoid Barrel Exports** for Application Code

```typescript
// Direct imports for better tree-shaking and performance
import { authGuard, unauthGuard } from './core/guards/auth.guard';
import { AuthService } from './modules/auth/services/auth.service';
import { LoginComponent } from './modules/auth/components/login';

// ❌ Don't create index.ts files in app directories like:
// - apps/*/src/app/core/guards/index.ts
// - apps/*/src/app/modules/*/index.ts
// - apps/*/src/app/shared/*/index.ts
```

#### **Why This Approach?**

- **Shared Libraries**: Need barrel exports as public API entry points
- **Application Code**: Direct imports improve tree-shaking and reduce bundle size
- **Performance**: Faster compilation and better dead code elimination
- **Clarity**: Explicit imports make dependencies more obvious

### Library Guidelines

1. **Shared Libraries**: Only for truly reusable code across multiple modules
2. **UI Components**: Generic, reusable components without business logic
3. **Utilities**: Pure functions without Angular dependencies
4. **Types**: Interfaces and types used across applications
5. **Constants**: Configuration values used by both apps

❌ **Avoid**: Creating shared libraries for authentication, business logic, or app-specific features  
✅ **Prefer**: Keep business logic in each application's `modules/` directory

### Authentication Implementation

Both applications have authentication systems with different storage keys:

```typescript
// Backoffice authentication
import { AuthUtils } from 'utils-core';
const user = AuthUtils.getUserData('backoffice-user-data');

// Customer authentication
import { AuthUtils } from 'utils-core';
const user = AuthUtils.getUserData('customer-user-data');
```

#### Using Layouts in Your Routes

```typescript
import { AuthenticatedLayout, UnauthenticatedLayout } from 'customer-features';

// For authenticated pages
{
  path: 'dashboard',
  component: AuthenticatedLayout,
  children: [
    // Your authenticated routes here
  ]
}

// For login/register pages
{
  path: 'auth',
  component: UnauthenticatedLayout,
  children: [
    // Your auth routes here
  ]
}
```

## Troubleshooting

### Common Issues

#### Build Errors

```bash
# If you encounter build errors, try:
npm run build:libs  # Build libraries first
npm run build:all   # Then build applications

# Clear Nx cache if needed
npx nx reset
npm install
```

#### Import Errors

```typescript
// ✅ Correct: Use path mappings for shared libraries
import { AuthUtils } from 'utils-core';
import { LoginRequest } from 'shared-types';
import { AuthenticatedLayout } from 'customer-features';

// ✅ Correct: Direct imports for app-specific code (no barrel exports)
import { authGuard } from './core/guards/auth.guard';
import { AuthService } from './modules/auth/services/auth.service';

// ❌ Incorrect: Relative paths for shared libraries
import { AuthUtils } from '../../libs/utils-core/src/lib/utils-core';

// ❌ Incorrect: Barrel exports for app-specific code (eliminated)
import { authGuard } from './core/guards';
```

#### Authentication Issues

```typescript
// Make sure you use the correct storage key for each app:
// Backoffice: 'backoffice-user-data'
// Customer:   'customer-user-data'

// Check localStorage in browser dev tools
localStorage.getItem('backoffice-user-data');
localStorage.getItem('customer-user-data');
```

#### Port Conflicts

If ports are already in use:

```bash
# Use different ports
npx nx serve app-client --port=4300

# Or kill processes using the ports (Windows)
netstat -ano | findstr :4200
taskkill /PID <PID> /F
```

#### Dependency Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency warnings
npm ls --depth=0
```

## Nx Commands Reference

```bash
# View dependency graph
npm run graph

# Run any Nx command
npx nx <command> <project>

# Show project details
npx nx show project <project-name>

# Build specific library
npx nx build <library-name>

# Test specific project
npx nx test <project-name>

# Lint specific project
npx nx lint <project-name>

# Generate new project/component (components are standalone by default)
npx nx generate @nx/angular:component <name>
npx nx generate @nx/angular:service <name>
npx nx generate @nx/angular:library <name>

# Show affected projects
npx nx affected:graph
npx nx print-affected

# Run commands only on affected projects
npx nx affected:build
npx nx affected:test
npx nx affected:lint

# Reset Nx cache
npx nx reset
```

## Environment Setup

### IDE Configuration

#### VS Code Extensions (Recommended)

- Angular Language Service
- Nx Console
- ESLint
- Prettier
- TypeScript Importer

#### VS Code Settings (.vscode/settings.json)

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "nx.enableTelemetry": false
}
```

### Git Workflow

#### Pre-commit Checklist

Before committing code, always run:

```bash
# 1. Build shared libraries
npm run build:libs

# 2. Lint all code
npm run lint

# 3. Run all tests
npm run test:all

# 4. Format code
npm run format

# 5. Build applications
npm run build:all
```

#### Branch Strategy

```bash
# Feature development
git checkout -b feature/auth-implementation
git checkout -b feature/user-management-ui
git checkout -b fix/login-validation-error

# Before merging, ensure all tests pass
npm run test:all && npm run lint && npm run build:all
```

#### Commit Message Convention

```bash
# Format: type(scope): description
git commit -m "feat(auth): implement login component for backoffice"
git commit -m "fix(shared-features): correct header dropdown positioning"
git commit -m "refactor(utils-core): improve AuthUtils type safety"
git commit -m "docs(readme): add troubleshooting section"

# Types: feat, fix, refactor, docs, test, chore, style
```

## Deployment

### Build for Production

```bash
# Build application for production
npm run build

# Build shared library
npm run build:libs

# Output directories:
# dist/app-client/  - Main application build
```

### Environment Configuration

Create environment files for each application:

```typescript
// apps/app-client/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api-dev.example.com',
  version: '1.0.0',
};

// apps/app-client/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',
  version: '1.0.0',
};
```

### Docker Configuration

Example Dockerfile for each application:

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/app-client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Project Structure

```
angular-base-frontend-template/
├── apps/
│   └── app-client/            # Main application
├── libs/
│   └── shared-features/       # Consolidated shared library with UI components & design system
├── docs/                      # Comprehensive documentation
├── tools/                     # Custom workspace tools
├── nx.json                    # Nx configuration
├── tsconfig.base.json         # Base TypeScript config
└── package.json               # Package dependencies
```

## Best Practices

### Architecture Organization

1. **Shared Libraries**: Only truly reusable code goes in `libs/`
2. **Application Modules**: Feature-specific code stays in each app's `modules/`
3. **Separate Concerns**: Each app has independent API domains and auth flows
4. **Import Boundaries**: Use Nx enforce-module-boundaries to prevent coupling

### Development Guidelines

1. **Standalone Components**: All components are standalone by default (no `--standalone` flag needed)
2. **Signal-based State**: Prefer Angular signals over RxJS for simple state
3. **Dependency Injection**: Use the new `inject()` function over constructor injection
4. **Testing**: Write tests alongside your code using Jest
5. **TypeScript Strict**: Maintain strict TypeScript configuration
6. **Linting**: Run lint and format before committing

### Performance Optimization

1. **Affected Commands**: Use `nx affected` to build/test only changed code
2. **Build Caching**: Leverage Nx caching for faster builds
3. **Code Splitting**: Use lazy loading for feature modules

## Documentation

### 📚 Documentation Index

This project maintains comprehensive documentation to help developers understand and work with the codebase effectively:

#### 📖 **Core Documentation**

| File                  | Purpose                                                    | When to Use                       |
| --------------------- | ---------------------------------------------------------- | --------------------------------- |
| **`README.md`**       | Main project overview, architecture, and development guide | First read for new developers     |
| **`CLAUDE.md`**       | Detailed development guidance for AI assistance            | When working with Claude Code     |
| **`instructions.md`** | Project activity definitions and task planning             | ⚠️ Only when explicitly requested |

#### 🛠️ **Development Guides** (`./docs/`)

| File                            | Purpose                                                                                                                                                  | When to Use                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **`DEVELOPMENT_GUIDE.md`**      | **⭐ CONSOLIDATED** - Complete development guide covering component creation, module structure, barrel file optimization, and performance analysis       | When creating components, organizing modules, or optimizing development workflow |
| **`STYLING_GUIDE.md`**          | **⭐ CONSOLIDATED** - Complete styling guide covering dark mode, Tailwind CSS v4, SCSS migration, @apply/@reference directives, and performance analysis | When working with styling, theming, CSS, or UI performance optimization          |
| **`HTTP_INTERCEPTOR_GUIDE.md`** | Comprehensive HTTP interceptor implementation with migration guide, performance analysis, and best practices                                             | When working with HTTP requests, authentication, or network optimization         |
| **`DEVELOPMENT_TRACKING.md`**   | Development task tracking board with completed features, ongoing work, and planned tasks                                                                 | When planning development work or tracking progress                              |

### 📋 **Documentation Guidelines**

- **For New Developers**: Start with `README.md` → `CLAUDE.md` → relevant guides in `docs/`
- **For Architecture/Components**: Reference `DEVELOPMENT_GUIDE.md` for component creation, modules, and performance
- **For HTTP/Networking**: Reference `HTTP_INTERCEPTOR_GUIDE.md` for comprehensive guidance
- **For Styling/Theming**: Reference `STYLING_GUIDE.md` for complete styling guide
- **For Task Tracking**: Reference `DEVELOPMENT_TRACKING.md` for progress tracking
- **For AI Assistance**: Refer to `CLAUDE.md` for development patterns

### 🔄 **Documentation Maintenance**

- Documentation is updated alongside code changes
- Each significant feature addition includes corresponding documentation
- Bug fixes are documented for future reference
- Architecture decisions are recorded in relevant guides

### External Resources

- **Angular v20+ Documentation**: [angular.dev](https://angular.dev)
- **Nx Monorepo Guide**: [nx.dev](https://nx.dev/concepts/more-concepts/monorepo-nx-enterprise)
- **Angular Signals**: [angular.dev/guide/signals](https://angular.dev/guide/signals)
- **Standalone Components**: [angular.dev/guide/components/importing](https://angular.dev/guide/components/importing)
- **TypeScript 5.8+**: [typescriptlang.org](https://www.typescriptlang.org/docs)

### Community & Support

- **Angular Community**: [angular.dev/community](https://angular.dev/community)
- **Nx Community**: [nx.dev/community](https://nx.dev/community)
- **PrimeNG Components**: [primeng.org](https://primeng.org) (v20+ compatible)

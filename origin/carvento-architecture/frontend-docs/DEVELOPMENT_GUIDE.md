# Development Guide - Angular Base Frontend Template

## 🚨 CRITICAL RULES (Non-negotiable)

1. **NEW CONTROL FLOW ONLY**: Never use `*ngIf`, `*ngFor`, `*ngSwitch`. Always use `@if`, `@for`, `@switch`
2. **BARREL FILES RESTRICTION**: Only allowed in `customer-features` library. Never create `index.ts` files in applications

## Overview

This comprehensive guide consolidates all essential development patterns, architectures, and practices for the Angular Base Frontend Template monorepo. It covers component creation, module organization, barrel file optimization, modal systems, commands reference, and performance considerations.

---

## Quick Command Reference

### Essential Commands

| Category | Command | Description |
|----------|---------|-------------|
| **Start Development** | `npm start` | Start main app (port 4200) |
| | `npm run start:dev` | Start app with lib watch |
| **Build & Test** | `npm run build` | Build main application |
| | `npm run build:libs` | Build shared libraries only |
| | `npm run test:all` | Run all tests |
| | `npm run lint` | Lint all projects |
| **Component Generation** | `nx generate @nx/angular:component --path=libs/customer-features/src/lib/shared/components/<name>` | Shared component (standalone by default) |
| | `nx generate @nx/angular:component --path=apps/<app>/src/app/modules/<module>/pages/<name>` | URL-accessible page component |
| **Quality Assurance** | `npm run affected:build` | Build only affected projects |
| | `npm run affected:test` | Test only affected projects |
| | `npm run format` | Format code with Prettier |

### Individual Project Testing

| Command | Description |
|---------|-------------|
| `nx test app-client` | Test main application |
| `nx test shared-features` | Test consolidated library |
| `nx test <project-name> --coverage` | Run tests with coverage report |

### Quick Development Workflow

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `git pull origin development` | Get latest changes |
| 2 | `npm install` | Update dependencies |
| 3 | `npm run start:all` | Start both applications |
| 4 | `npm run lint` | Check code quality |
| 5 | `npm run build` | Build main application |

---

## Architecture Overview

### Monorepo Structure

This is an **Nx monorepo** with two distinct Angular applications and a consolidated shared library:

```
Angular Base Frontend Template/
├── apps/
│   └── app-client/              # Main application
├── libs/
│   └── shared-features/         # Consolidated shared library
├── docs/                        # Comprehensive documentation
└── [configuration files]
```

**Architecture**: Single application with consolidated shared library for maximum code reuse and maintainability.

### Consolidated Library Architecture

All shared functionality has been consolidated into a **single library** (`customer-features`) following this organizational pattern:

```
libs/shared-features/src/lib/
├── modules/                          # Business logic modules
│   ├── users/                        # User management domain
│   ├── organization-management/      # Organization domain
│   └── profile-management/          # Profile domain
├── shared/                          # Cross-cutting concerns
│   ├── components/                  # Reusable UI components
│   │   ├── layouts/                 # AuthenticatedLayout, UnauthenticatedLayout
│   │   ├── particles-background/    # Animated background effects
│   │   └── [NO index.ts files]     # Direct imports only
│   ├── constants/                  # Application constants
│   ├── types/                      # TypeScript interfaces
│   ├── utils/                      # Services, utilities, HTTP interceptor
│   ├── services/                   # Cross-cutting services
│   └── forms/                      # Reusable form utilities
└── index.ts                        # SINGLE BARREL FILE ONLY
```

---

## Single Barrel File Architecture

### Architecture Overview

The `shared-features` library implements a **minimal barrel files** approach with only **one barrel file** at the root level.

**Benefits:**
- **90% reduction** in barrel files (from 10 to 1)
- **Better tree-shaking** and smaller bundles
- **Faster builds** with fewer re-export cascades
- **Zero circular dependencies** with direct imports
- **Easier maintenance** with single export point

### Single Barrel File Content

```typescript
// libs/shared-features/src/index.ts - ONLY BARREL FILE
// This is the ONLY barrel file in the shared-features library

// ===== SHARED COMPONENTS =====
// Direct imports from component files (NO intermediate barrels)
export { AuthenticatedLayout } from './lib/shared/components/layouts/authenticated-layout/authenticated-layout';
export { UnauthenticatedLayout } from './lib/shared/components/layouts/unauthenticated-layout/unauthenticated-layout';
export { SidebarComponent } from './lib/shared/components/layouts/sidebar/sidebar.component';
export { ParticlesBackgroundComponent } from './lib/shared/components/particles-background/particles-background.component';

// ===== SHARED SERVICES =====
export { MenuService } from './lib/shared/services/menu.service';
export { DarkModeService } from './lib/shared/utils/dark-mode.service';

// ===== SHARED TYPES =====
export type { UserData, LoginRequest, LoginResponse } from './lib/shared/types/shared-types';

// ===== BUSINESS MODULES =====
// Future modules exported directly from component files
// Example: export { InfoGeneralComponent } from './lib/modules/organization/pages/info-general/info-general.component';
```

### Import Rules and Circular Dependency Prevention

#### For External Applications (Consumers)
```typescript
// ✅ CORRECT: Import from single barrel file
import {
  AuthenticatedLayout,
  MenuService,
  UserData,
  ParticlesBackgroundComponent
} from 'shared-features';
```

#### For Internal Library Components
```typescript
// ✅ CORRECT: Direct imports from specific files
import { DarkModeService } from '../utils/dark-mode.service';
import { MenuItem } from '../services/menu.service';

// ✅ CORRECT: Use internal.ts for circular dependency prevention
import { MenuItem, MenuService } from '../../../internal';

// ❌ NEVER: Import from barrel in library (creates circular dependency)
import { MenuItem } from 'customer-features'; // DON'T DO THIS
```

### Adding New Components

#### Step 1: Generate Component
```bash
# Shared components (cross-module usage)
nx generate @nx/angular:component --path=libs/shared-features/src/lib/shared/components/data-grid

# Module-specific components
nx generate @nx/angular:component --path=libs/shared-features/src/lib/modules/users/components/user-profile
```

#### Step 2: Export in Main Barrel (ONLY)
```typescript
// libs/shared-features/src/index.ts (ONLY place to add exports)
export { DataGridComponent } from './lib/shared/components/data-grid/data-grid.component';
export { UserProfileComponent } from './lib/modules/users/components/user-profile/user-profile.component';
```

#### Step 3: Use in Applications
```typescript
// Applications can now import directly
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

### Performance Impact

**Bundle Size Optimization:**
- **Tree-Shaking Benefits**: Library marked with `"sideEffects": false`
- **Optimal lazy loading**: Components load individually (1.5-85KB chunks)
- **Bundle optimization**: 83% compression ratio (1.15MB → 194KB gzipped)

**Current Bundle Performance:**
- **Initial Bundle**: 1.15MB raw, ~195KB gzipped per application
- **Lazy Chunks**: 344 bytes to 85KB range
- **Shared Library**: ~220KB compiled ESM2022 modules

---

## Module Structure & Organization

### Standard Module Organization

Each application follows a standardized `modules/` structure with clear separation between URL-accessible views and reusable components:

```
modules/[module-name]/
├── pages/           # URL-accessible views from sidebar navigation
│   ├── users-list/  # Main listing using descriptive names (users-list, roles-list, org-chart)
│   ├── user-create/ # Creation - can be page OR modal depending on complexity
│   └── user-edit/   # Edit - same component/modal as create with different rules
├── components/      # Reusable UI components (NOT URL-accessible)
│   └── modals/      # Modal components for creation/editing (simple forms)
├── services/        # Module-specific services
└── [module].routes.ts
```

### Key Distinctions

- **`pages/`**: Components accessible via browser URL navigation (e.g., `/users-list`, `/user-create`)
- **`components/`**: Reusable UI pieces without direct URL access (user-card, charts, modals)
- **Modal vs Page Creation**: Simple forms use modals with DialogService, complex forms use dedicated pages
- **Edit Reuse**: The same create component/modal is used for editing with different validation rules

### Component Location Decision Matrix

| Use Case | Location | Import Pattern | Example |
|----------|----------|----------------|---------|
| **URL-accessible views** | `apps/[app]/modules/[module]/pages/` | Direct local import | `users-list`, `user-create` |
| **App-specific reusable UI** | `apps/[app]/modules/[module]/components/` | Direct local import | `user-card`, creation modals |
| **Cross-app shared components** | `libs/shared-features/shared/components/` | `import { Component } from 'shared-features'` | Layouts, common UI |
| **Domain business logic** | `libs/shared-features/modules/[domain]/` | `import { Service } from 'shared-features'` | User services, utilities |
| **Modal creation/editing** | `apps/[app]/modules/[module]/components/modals/` | Direct local import | Simple form modals |

---

## Modal System Integration

### Modal vs Page Decision Criteria

**Use Modals for Simple Forms:**
- Basic CRUD operations with 1-5 fields
- Simple validation rules
- Quick creation/editing workflows
- Forms that don't require complex layouts

**Use Dedicated Pages for Complex Forms:**
- Multi-step wizards or forms with multiple sections
- Complex validation dependencies
- Forms requiring file uploads or rich text editing
- Forms with dynamic field generation

### Modal System Architecture

The modal system provides centralized management through these core services:

1. **ModalManagerService**: Central service for opening and managing modals
2. **ModalRegistryService**: Registers modal components with the system
3. **ModalInitializationService**: Handles complete system setup
4. **ToastService**: Unified notification system

### Creating Modal Components

```bash
# Create modal component for simple forms
nx generate @nx/angular:component --path=apps/app-client/src/app/modules/users/components/modals/user-create-modal

# Example structure:
modules/users/components/modals/
├── user-create-modal/
│   ├── user-create-modal.ts
│   ├── user-create-modal.html
│   ├── user-create-modal.css
│   └── user-create-modal.spec.ts
```

### DialogService Integration

```typescript
// In sidebar menu configuration
const menuItems = [
  {
    name: 'Create User',  // Auto-generates tooltip from name
    icon: 'pi pi-user-plus',
    command: () => this.openUserCreateModal()
  }
];

// Component method to open modal
private dialogService = inject(DialogService);

openUserCreateModal(): void {
  const dialogRef = this.dialogService.open(UserCreateModalComponent, {
    header: 'Create New User',
    width: '500px',
    modal: true,
    closable: true,
    data: {
      mode: 'create' // or 'edit' with user data for editing
    }
  });

  dialogRef.onClose.subscribe((result) => {
    if (result) {
      // Handle successful creation/editing
      this.refreshUserList();
    }
  });
}
```

### Edit Mode Reuse Pattern

```typescript
// Same modal component used for both create and edit
@Component({
  selector: 'app-user-create-modal',
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <p-dialog-header>
        {{ isEditMode ? 'Edit User' : 'Create User' }}
      </p-dialog-header>
      <!-- Form fields -->
      <div class="flex justify-end gap-2 mt-4">
        <p-button 
          label="Cancel" 
          severity="secondary" 
          (click)="onCancel()">
        </p-button>
        <p-button 
          label="{{ isEditMode ? 'Update' : 'Create' }}" 
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

### Using Modal Manager Service

```typescript
import { Component, inject } from '@angular/core';
import { ModalManagerService, ModalResult } from 'shared-features';

@Component({
  // ...
})
export class MyComponent {
  private modalManager = inject(ModalManagerService);

  async openUserModal(): Promise<void> {
    const result: ModalResult = await this.modalManager.openUserCreateModal({
      isEditMode: false
    });

    if (result.success) {
      console.log('User created:', result.data);
      // Handle successful creation
      this.refreshUserList();
    } else {
      console.log('Modal was cancelled or failed');
    }
  }

  async editUser(user: User): Promise<void> {
    const result: ModalResult = await this.modalManager.openUserCreateModal({
      isEditMode: true,
      user: user
    });

    if (result.success) {
      // Update user in your data source
      this.updateUser(result.data);
    }
  }
}
```

---

## Component Creation Patterns

### Angular v20+ Standards

All components in this project follow these modern Angular patterns:

- **Standalone components by default** (no `--standalone` flag needed)
- **No NgModules**: All components are standalone
- Use `ChangeDetectionStrategy.OnPush` for all components
- Prefer `input()` and `output()` functions over decorators
- Use signals with `signal()`, `computed()`, and `update()/set()`

### Component Creation Examples

#### Application Components (URL-Accessible Pages)

```bash
# Page components using descriptive names
nx generate @nx/angular:component --path=apps/backoffice-client/src/app/modules/users/pages/users-list
nx generate @nx/angular:component --path=apps/backoffice-client/src/app/modules/users/pages/user-create
```

#### Application Components (Reusable UI)

```bash
# Reusable components within an application
nx generate @nx/angular:component --path=apps/backoffice-client/src/app/modules/users/components/user-card
```

#### Shared Components (Cross-App Usage)

```bash
# Components used across both applications
nx generate @nx/angular:component --path=libs/customer-features/src/lib/shared/components/data-table
```

#### Domain-Specific Components

```bash
# Business logic components for specific domains
nx generate @nx/angular:component --path=libs/shared-features/src/lib/modules/users/components/user-profile
```

### Modern Component Template

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
          label="Action" 
          (click)="handleAction()"
          [disabled]="disabled()"
          class="bg-blue-600 hover:bg-blue-700">
        </p-button>
        
        @if (showCounter()) {
          <span class="text-sm text-zinc-600 dark:text-zinc-300">
            Count: {{ counter() }}
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
  // Modern input/output functions
  title = input.required<string>();
  disabled = input(false);
  actionClicked = output<void>();

  // Signal-based state management
  private counter = signal(0);
  private showCounter = signal(true);

  // Computed properties
  displayValue = computed(() => {
    return this.counter() > 0 ? `Active (${this.counter()})` : 'Inactive';
  });

  handleAction() {
    this.counter.update(count => count + 1);
    this.actionClicked.emit();
  }
}
```

### Best Practices

**✅ Recommended:**
- Create components as **standalone** (Angular 20+ default)
- Use **OnPush change detection** consistently
- Apply **signal-based state management** for reactivity
- Implement proper **cleanup patterns** with `DestroyRef`
- Follow **explicit import/export** patterns for tree-shaking

**❌ Avoid:**
- NgModules (project uses standalone components)
- Complex constructor injection (prefer `inject()` function)
- Wildcard exports (`export *`) in barrel files
- Creating shared components for single-app usage

---

## Performance & Bundle Optimization

### Current Performance Metrics

**Bundle Sizes:**
- **App Client**: 1.15MB raw, 194.95kB gzipped
- **Shared Features Library**: ~220KB compiled ESM2022 modules

**Key Optimizations:**
1. **Memory Optimization**: OnPush change detection + signal-based reactivity
2. **Efficient Lazy Loading**: Route-based code splitting with minimal payload
3. **Tree-Shaking Excellence**: Aggressive dead code elimination
4. **Modern Browser Optimization**: Only 34KB polyfills

### Library Performance Breakdown

```
Shared-Features Library Composition:
- Components: 116KB compiled
- Utils: 66KB compiled
- Services: 21KB compiled
- Types: 6KB compiled
- Constants: Minimal overhead
```

### Build Performance Commands

```bash
# Bundle analysis
npm run build             # Analyze main app bundle
npm run build:libs        # Check library compilation

# Performance monitoring targets
# - Initial bundle size: <200KB gzipped
# - Lazy chunk sizes: <100KB per chunk
# - Tree-shaking effectiveness: >95%
# - Memory usage: OnPush + signals optimization
```

---

## Error Handling & Troubleshooting

### Common Import Issues

```typescript
// ✅ Correct for shared components (from applications)
import { DataTableComponent } from 'shared-features';

// ✅ Correct for app-specific components  
import { UsersList } from './pages/list/users-list';

// ✅ Correct for internal library components
import { MenuItem, DarkModeService } from '../../internal';

// ❌ Wrong - avoid relative paths for shared code (from applications)
import { DataTableComponent } from '../../../libs/shared-features/...';

// ❌ Wrong - circular dependency (within library)
import { MenuItem } from 'shared-features';
```

### Circular Dependency Resolution

**Symptom**: Build fails with "Entry point has a circular dependency on itself"

**Cause**: Library components importing from main entry point (`customer-features`)

**Solution**: Use internal imports within library components
```typescript
// Within library components, use:
import { MenuItem, DarkModeService } from '../../../internal';

// Instead of:
import { MenuItem } from 'customer-features'; // Causes circular dependency
```

**Prevention**: ESLint rules automatically catch these during development

### Module Structure Issues

**Common Problems:**
- **pages/**: URL-accessible components (routing) - use descriptive names like `users-list`, `roles-list`
- **components/**: Reusable UI pieces (no routing) - includes modals for simple forms
- **Modal vs Page Decision**: Simple forms → modals with DialogService; Complex forms → dedicated pages
- **Edit Reuse**: Same create component/modal used for editing with different validation

### Bundle Size Issues

**Troubleshooting Steps:**
1. Check for wildcard imports in barrel files
2. Verify `"sideEffects": false` in library package.json
3. Use webpack-bundle-analyzer to identify large chunks
4. Ensure lazy loading for feature modules

### Build Error Resolution Process

When encountering build errors after barrel file changes:

1. **Systematic Approach**: Build each project individually to isolate errors
2. **Read Error Messages**: Identify exactly which exports are missing
3. **Locate Source Files**: Find where the missing exports are defined
4. **Update Main Barrel**: Add missing exports using direct import paths
5. **Verify Fixes**: Re-run builds to confirm resolution

**Example Resolution:**
```bash
# 1. Detect errors
nx build app-client
# Error: TS2305: Module '"shared-features"' has no exported member 'AppPreset'

# 2. Find source
grep -r "AppPreset" libs/shared-features/src
# Found: libs/shared-features/src/lib/shared/styles/apppreset.ts

# 3. Add to barrel file
# export { default as AppPreset } from './lib/shared/styles/apppreset';

# 4. Verify fix
nx build app-client
# ✅ Build successful
```

---

## Testing Standards

### Modern Testing Patterns

The project uses **Jest** for unit testing with modern Angular testing practices:

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
      imports: [ExampleComponent], // Standalone component
      providers: [
        provideRouter([]), // Required for Router injection
        provideHttpClient() // Required for HttpClient services
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('title', 'Test Title');
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

### Test Dependencies

**Required Providers:**
- Components using Router need `provideRouter([])`
- HttpClient services need `provideHttpClient()`
- Signal-based components work seamlessly with TestBed

### Testing Commands

```bash
# Run all tests
npm run test:all

# Test specific projects
nx test app-client
nx test shared-features

# Test with coverage
nx test <project-name> --coverage

# Run affected tests only
npm run affected:test
```

---

## Summary

This comprehensive development guide provides all essential patterns for successful development in the Angular Base Frontend Template monorepo:

### Key Achievements
- **Consolidated Architecture**: Single barrel file with 90% reduction in complexity
- **Modern Angular v20+**: Standalone components with signals and modern patterns
- **Performance Optimization**: 83% compression ratio and optimal tree-shaking
- **Modal System Integration**: Centralized modal management with type safety
- **Comprehensive Testing**: 97/97 tests passing with modern testing patterns

### Development Workflow
1. **Module Organization**: Clear pages vs components distinction with modal integration
2. **Component Creation**: Optimal placement and generation workflows  
3. **Import Optimization**: Tree-shaking friendly single barrel file pattern
4. **Performance Monitoring**: Bundle analysis and optimization strategies
5. **Error Resolution**: Systematic troubleshooting for common issues

### Best Practices Summary
- **Use standalone components** with OnPush change detection
- **Follow single barrel file architecture** for imports
- **Apply modal vs page decision criteria** for user interfaces
- **Implement signal-based state management** for reactivity
- **Maintain comprehensive test coverage** with modern patterns

Following these patterns ensures optimal bundle sizes, maintainable code structure, and excellent runtime performance across both applications.

---

## Autor

**Desarrollado por:** Tricell Software Solutions
**Proyecto Base:** Angular Base Frontend Template - Development Guide
**Versión:** 1.0.0
**Fecha:** Enero 2025

*Este proyecto base fue creado para facilitar el desarrollo de aplicaciones Angular modernas con mejores prácticas y arquitectura consolidada.*
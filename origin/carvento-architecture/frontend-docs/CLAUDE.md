# CLAUDE.md - Development Guide

## Common Commands

```bash
# Development & Build
npm start                  # Main application (port 4200)
npm run start:dev          # Development mode with lib watch
npm run build              # Build main application
npm run build:libs         # Build shared libraries only

# Quality Assurance
npm run lint              # Lint all projects
npm run test:all          # Run all tests
npm run format            # Format code with Prettier

# Affected commands (only changed code)
npm run affected:build    # Build only affected projects
npm run affected:test     # Test only affected projects

# Component Generation
nx generate @nx/angular:component --path=libs/shared-features/src/lib/shared/components/<name>
nx generate @nx/angular:component --path=libs/shared-features/src/lib/modules/users/components/<name>

# Testing
nx test app-client
nx test shared-features
```

## Architecture Overview

**Nx monorepo** with single Angular application and consolidated shared library:

### Application

- **app-client**: Main application with configurable API endpoints (storage: `'user-data'`)

### Consolidated Library (`shared-features`)

Single library containing all shared functionality:

- `modules/` - Business logic (users, organization, profile management)
- `shared/components/` - UI components, layouts
- `shared/utils/` - Services, HTTP interceptors, dark mode
- `shared/types/` - TypeScript interfaces
- `shared/constants/` - App constants
- `shared/internal.ts` - Internal exports for circular dependency prevention

### Import Architecture

```typescript
// Applications use external exports
import { ButtonComponent, formatDate, UserType } from 'shared-features';

// Within library use internal exports (prevents circular dependencies)
import { MenuItem, DarkModeService } from '../../../internal';

// ❌ NEVER within library (causes circular dependency)
import { MenuItem } from 'shared-features';
```

### ESLint Prevention

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["shared-features"],
            "message": "Use relative imports or './shared/internal' within library"
          }
        ]
      }
    ]
  }
}
```

## Angular v20+ Standards

- **Standalone components** (no NgModules), `ChangeDetectionStrategy.OnPush`
- **Modern syntax**: `input()`, `output()`, `inject()` functions over decorators
- **Signals**: `signal()`, `computed()`, `update()/set()` (avoid `mutate()`)
- **Control flow**: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`, `*ngSwitch`) - **MANDATORY**
- **Binding**: Class/style bindings instead of `ngClass`/`ngStyle`

### 🚨 CRITICAL RULES (Non-negotiable)

1. **NEW CONTROL FLOW ONLY**: Never use `*ngIf`, `*ngFor`, `*ngSwitch`. Always use `@if`, `@for`, `@switch`
2. **BARREL FILES RESTRICTION**: Only allowed in `shared-features` library. Never create `index.ts` files in applications

## Implemented Features

### Toast Notification System

```typescript
private toastService = inject(ToastService);
this.toastService.showSuccess('Success', 'Operation completed');
```

- **Global toast:** Single `<p-toast>` in `app.html` prevents duplicates with `translateX(100%)` animation
- **ToastService:** Located in `apps/app-client/src/app/services/toast.service.ts`, uses PrimeNG with Aura theme

### HTTP Interceptor System

Functional interceptor with 70-80% memory reduction:

```typescript
// Configuration in main.ts
import { httpInterceptor, configureHttpInterceptor } from 'shared-features';

configureHttpInterceptor({
  authStorageKey: 'user-data',
  defaultTimeout: 10000,
  enableLogging: true,
});
```

See `docs/HTTP_INTERCEPTOR_GUIDE.md` for details.

### Dark Mode Implementation

```typescript
private darkModeService = inject(DarkModeService);
isDarkMode = this.darkModeService.isDarkMode; // Signal
this.darkModeService.toggleTheme();

// Reactive computed properties
backgroundColor = computed(() => this.isDarkMode() ? '#0f0f0f' : '#ffffff');
```

### Particle Background System

```typescript
import { ParticlesBackgroundComponent } from 'shared-features';

<app-particles-background
  [backgroundColor]="backgroundColor()"
  [particleColor]="particleColor()">
  <div class="content"><!-- content --></div>
</app-particles-background>
```

### FloatLabel Standard

**MANDATORY**: All FloatLabel components MUST use `variant="on"` for consistent UX:

```html
<!-- ✅ CORRECT - Always use variant="on" -->
<p-floatlabel variant="on">
  <input pInputText id="field" [(ngModel)]="value" />
  <label for="field">Field Label</label>
</p-floatlabel>

<p-floatlabel variant="on">
  <p-select id="select" [(ngModel)]="selectedValue" [options]="options" />
  <label for="select">Select Label</label>
</p-floatlabel>

<!-- ❌ INCORRECT - Never omit variant -->
<p-floatlabel>
  <input pInputText id="field" [(ngModel)]="value" />
  <label for="field">Field Label</label>
</p-floatlabel>
```

**Benefits of `variant="on"`:**

- Label always visible above input
- No superposition issues with complex controls
- Better accessibility and UX
- Consistent visual hierarchy
- Works perfectly with all PrimeNG components

## Development Patterns

### Component Creation

```bash
# Shared components (shared-features library)
nx generate @nx/angular:component --path=libs/shared-features/src/lib/shared/components/<name>

# Module components (shared-features library)
nx generate @nx/angular:component --path=libs/shared-features/src/lib/modules/users/components/<name>

# Application components
mkdir -p apps/app-client/src/app/modules/users/pages/users-list
```

### Adding to Library

1. **Generate component** with nx generate
2. **Export in main index.ts ONLY**: `export { ComponentName } from './lib/path/component';`
3. **Use in apps**: `import { ComponentName } from 'shared-features';`

### Module Structure Convention

```
modules/[module-name]/
├── pages/           # URL-accessible views (users-list, user-create)
├── components/      # Reusable components (user-card, modals)
├── services/        # Module services
└── [module].routes.ts
```

**Key Rules:**

- **Pages**: URL-accessible via routing
- **Components**: NOT URL-accessible, reusable
- **Simple forms**: Use modals with DialogService
- **Complex forms**: Use dedicated pages
- **Library structure**: `modules/`, `shared/components/`, `shared/utils/`, `shared/types/`

See `docs/DEVELOPMENT_GUIDE.md` for complete details.

## Token Optimization Protocol

## Claude Code Execution Rules

- **CRITICAL**: Read all files before editing (parallel reads)
- **Use MultiEdit** for multiple changes per file
- **Single build** verification at end only
- **Target**: < 5000 tokens per operation batch

### Efficient Workflow

```bash
# ✅ OPTIMAL (saves 40-60% tokens)
1. Grep/Glob to identify affected files
2. Read(file1, file2, file3, file4)  # Parallel
3. MultiEdit(file1, edits=[{old: "...", new: "..."}, {...}])
4. MultiEdit(file2, edits=[...])
5. Single build verification

# ❌ INEFFICIENT (high token cost)
Edit → Error → Read → Edit (wastes ~2000+ tokens per cycle)
```

### Build Protocol

- **Minimize builds**: Run ONCE after all edits
- **Build order**: shared-features → app-client
- **Use affected**: `nx affected:build` when possible

## Code Conventions

### Standards

- TypeScript strict mode, Prettier (100 chars, single quotes), ESLint
- Angular v20+: Standalone components, signals, OnPush change detection
- Jest for unit testing, Playwright for e2e

### CSS Standards: Tailwind CSS v4

**Primary**: Tailwind utility classes with **zinc color palette**

```html
<div class="flex items-center p-4 bg-white rounded-lg dark:bg-zinc-800">
  <h2 class="text-xl font-semibold text-zinc-900 dark:text-white">Title</h2>
</div>
```

**Fallback**: Custom CSS only when Tailwind can't achieve the effect

```css
@reference "tailwindcss";

.sidebar-menu-item {
  @apply flex items-center gap-1 px-3 py-1 rounded-lg transition-all;
  @apply text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700;
}
```

**Rules:**

- **Tailwind first** - use utilities before custom CSS
- **@reference "tailwindcss"** required for @apply in component CSS
- **zinc palette** instead of gray (`bg-zinc-50`, `text-zinc-900`)
- **dark: modifiers** for theme support

### 🚨 PRIMENG OVERRIDE RESTRICTION (Critical)

**NEVER override PrimeNG native styles unless explicitly requested by user:**

- PrimeNG components handle their own validation states (`.ng-invalid`, `.ng-touched`, etc.)
- Native focus, hover, and interactive behaviors should remain untouched
- Avoid `::ng-deep` to override PrimeNG internal styling
- Only use custom CSS for layout (margins, padding, positioning) that Tailwind cannot achieve
- Custom styles should complement, not replace PrimeNG's native implementations

```css
/* ❌ FORBIDDEN - Never override PrimeNG validation */
::ng-deep .p-inputtext.ng-invalid.ng-dirty {
  border-color: #ef4444;
}

/* ✅ ALLOWED - Layout styles that Tailwind can't achieve */
.custom-layout {
  @apply relative overflow-hidden;
  /* Custom positioning or complex layouts only */
}
```

**Performance:**

- Nx affected commands for incremental builds
- OnPush change detection mandatory
- Run `npm run lint` and `npm run test:all` before committing

## Documentation Structure

### Core Files

- **`README.md`**: Project overview and setup
- **`CLAUDE.md`**: This file - AI development guidance
- **`instructions.md`**: Activity planning (use only when requested)

### Detailed Guides (`./docs/`)

- **`DEVELOPMENT_GUIDE.md`**: Component creation, modules, architecture
- **`STYLING_GUIDE.md`**: Dark mode, Tailwind CSS v4, performance
- **`HTTP_INTERCEPTOR_GUIDE.md`**: HTTP implementation guide
- **`GLOBAL_MODALS_GUIDE.md`**: Global modal implementation pattern

## Dependencies & Troubleshooting

### Current Versions

- **Angular 20.2.0**, **PrimeNG 20.0.0+** (use `class` not `styleClass`)
- **Prettier 3.6.x**, Jest (removed Karma)

### Common Issues

1. **Test Dependencies**: Router needs `provideRouter([])`, HttpClient needs `provideHttpClient()`
2. **Build Order**: `nx build shared-features` → applications
3. **Import Errors**: Use `from 'shared-features'` for shared imports
4. **Component Structure**: Each component needs own directory with `.ts/.html/.css/.spec.ts`

## Specialized AI Agents

Claude Code provides specialized agents for complex development tasks:

### Available Agents

- **🏗️ angular-developer**: Angular v20+ components, signals, reactive forms
- **🧠 context-manager**: Multi-agent workflows, context preservation (10k+ tokens)
- **🎨 ui-ux-designer**: Interface design, accessibility, design systems
- **🏛️ architect-reviewer**: SOLID principles, maintainability, design patterns
- **📝 technical-writer**: Documentation, user guides, API docs
- **🧪 code-reviewer**: Code quality, security, performance optimization
- **⚡ performance-profiler**: Bundle optimization, memory leaks, load testing
- **🧪 test-engineer**: Test automation, coverage analysis, CI/CD testing

### Usage Guidelines

**Proactive Usage:**

- **code-reviewer**: After significant code changes
- **architect-reviewer**: For structural modifications
- **ui-ux-designer**: For interface improvements
- **test-engineer**: For new features requiring testing

**Complex Tasks:**

- Use **context-manager** for 10k+ token operations
- Coordinate multiple agents for comprehensive solutions
- Maintain consistency across agent recommendations

### Quality Gates

- Significant changes → **code-reviewer**
- Architectural changes → **architect-reviewer**
- New features → **test-engineer** coverage
- Performance-critical → **performance-profiler** analysis

---

## Autor

**Desarrollado por:** Tricell Software Solutions
**Proyecto Base:** Angular Base Frontend Template
**Versión:** 1.0.0
**Fecha:** Enero 2025

*Este proyecto base fue creado para facilitar el desarrollo de aplicaciones Angular modernas con mejores prácticas y arquitectura consolidada.*

# Guía de Implementación de Modales Globales

Esta guía documenta el patrón establecido para implementar modales que pueden ser invocados globalmente desde cualquier parte de la aplicación (como desde el sidebar), sin necesidad de navegación.

## Casos de Uso

Este patrón es ideal para:
- **Acciones rápidas desde sidebar**: Crear entidades sin salir de la página actual
- **Modales contextuales**: Abrir desde diferentes partes con comportamientos específicos
- **Experiencia fluida**: Evitar navegaciones innecesarias
- **Consistencia UX**: Misma experiencia en toda la aplicación

:::tip Experiencia de Usuario
Los modales globales mejoran significativamente la UX al permitir operaciones CRUD sin interrumpir el flujo de trabajo del usuario.
:::

## Patrón de Implementación

### 1. Configuración del ModalService

#### a) Agregar tipos e interfaces

```typescript
// En libs/shared-features/src/lib/shared/services/modal.service.ts

// Eventos de creación
export interface EntityCreatedEvent {
  entity: any; // Tipo específico de la entidad
  context: 'SIDEBAR' | 'ENTITY_LIST' | string;
}

// Estado del modal
private entityModalVisible = signal(false);
private entityModalContext = signal<string | null>(null);
private entityModalMetadata = signal<any>(null);

// Stream de eventos
private entityCreatedSubject = new Subject<EntityCreatedEvent>();
public entityCreated$ = this.entityCreatedSubject.asObservable();
```

#### b) Implementar métodos del modal

```typescript
/**
 * Abrir modal de entidad con contexto
 */
openEntityModal(context: string, metadata?: any) {
  console.log('ModalService.openEntityModal called with context:', context);
  this.entityModalContext.set(context);
  this.entityModalMetadata.set(metadata);
  this.entityModalVisible.set(true);
}

/**
 * Cerrar modal de entidad
 */
closeEntityModal() {
  console.log('ModalService.closeEntityModal called');
  this.entityModalVisible.set(false);
  this.entityModalContext.set(null);
  this.entityModalMetadata.set(null);
}

/**
 * Manejar creación exitosa
 */
handleEntityCreated(entity: any) {
  const context = this.entityModalContext();
  if (context) {
    this.entityCreatedSubject.next({ entity, context });
    this.closeEntityModal();
  }
}

// Getters para estado reactivo
isEntityModalVisible() {
  return this.entityModalVisible;
}

getCurrentEntityModalContext() {
  return this.entityModalContext;
}
```

:::info Estado Reactivo
El uso de signals permite que la UI se actualice automáticamente cuando el estado del modal cambia, siguiendo los patrones modernos de Angular v20+.
:::

### 2. Comando del Menú

#### Crear función de comando simple

```typescript
// En libs/shared-features/src/lib/shared/constants/menu-items.ts

function createEntityCommand() {
  return () => {
    console.log('createEntityCommand executed - modalService available:', !!modalService);
    if (modalService) {
      console.log('Opening Entity modal with SIDEBAR context');
      // Direct modal opening - no navigation needed!
      modalService.openEntityModal('SIDEBAR');
    } else {
      console.warn('createEntityCommand: ModalService not available');
    }
  };
}

// Usar en el menú
export const backofficeMenuItems: MenuItem[] = [
  {
    name: 'Gestión de Entidades',
    icon: 'pi pi-building',
    root: true,
    children: [
      {
        name: 'Crear entidad',
        icon: 'pi pi-plus',
        command: createEntityCommand(), // ← Comando directo
      },
    ],
  },
];
```

### 3. Modal Global en App

#### a) Agregar al app.ts

```typescript
// Importar el componente del modal
import { CreateEntityModalComponent } from './modules/entities/components/create-entity-modal/create-entity-modal.component';

@Component({
  // ...
  imports: [
    // ... otros imports
    CreateEntityModalComponent
  ],
})
export class App implements OnInit {
  // ViewChild para acceder al componente
  @ViewChild('entityModal') entityModal!: CreateEntityModalComponent;

  // Método para manejar cierre
  handleEntityModalClose() {
    // Reset del formulario
    if (this.entityModal) {
      this.entityModal.resetForm();
    }
    // Cerrar modal
    this.modalService.closeEntityModal();
  }
}
```

#### b) Agregar al app.html

```html
<!-- Global Entity Creation Modal -->
<p-dialog
  [visible]="modalService.isEntityModalVisible()()"
  (visibleChange)="!$event && handleEntityModalClose()"
  header="Crear Nueva Entidad"
  [modal]="true"
  [closable]="true"
  [draggable]="false"
  [resizable]="false"
  styleClass="w-full max-w-4xl">

  <app-create-entity-modal
    #entityModal
    (entityCreated)="modalService.handleEntityCreated($event)"
    (cancelled)="handleEntityModalClose()">
  </app-create-entity-modal>

</p-dialog>
```

:::warning Importante
Asegúrate de usar `styleClass` en lugar de `class` para componentes PrimeNG cuando uses la versión 20+.
:::

### 4. Componente del Modal

#### a) Outputs para eventos

```typescript
export class CreateEntityModalComponent {
  // Outputs para eventos
  entityCreated = output<Entity>();
  cancelled = output<void>();

  // Método público de reseteo
  public resetForm() {
    this.entityForm.reset({
      // Valores por defecto
      name: '',
      description: '',
      isActive: true,
      createdDate: new Date(),
      // ... otros campos
    });
  }

  // Método de guardado
  onSave() {
    if (this.entityForm.valid) {
      // Lógica de creación...
      this.entityService.createEntity(entityData).subscribe(entity => {
        this.toastService.showSuccess('Éxito', 'Entidad creada correctamente');

        // Emitir evento de creación
        if (this.dialogRef) {
          this.dialogRef.close(entity); // Modal interno
        } else {
          this.entityCreated.emit(entity); // Modal global
        }
      });
    }
  }

  onCancel() {
    if (this.dialogRef) {
      this.dialogRef.close(); // Modal interno
    } else {
      this.cancelled.emit(); // Modal global
    }
  }
}
```

### 5. Escuchar Eventos en Listas

#### Suscribirse a eventos de creación

```typescript
export class EntitiesListComponent implements OnInit, OnDestroy {
  private entityCreatedSubscription?: Subscription;

  ngOnInit() {
    this.loadEntities();

    // Escuchar eventos de creación (cualquier contexto)
    this.entityCreatedSubscription = this.modalService.entityCreated$.subscribe((event) => {
      // Refrescar lista cuando se crea una entidad
      this.loadEntities();
    });
  }

  ngOnDestroy() {
    if (this.entityCreatedSubscription) {
      this.entityCreatedSubscription.unsubscribe();
    }
  }
}
```

:::tip Gestión de Memoria
Siempre desuscribirse en `ngOnDestroy` para evitar memory leaks. Considera usar `takeUntilDestroyed()` para un patrón más moderno.
:::

## Lista de Verificación

### ✅ Checklist de Implementación

- [ ] **ModalService actualizado**
  - [ ] Interfaces y tipos agregados
  - [ ] Signals para estado del modal
  - [ ] Subject para eventos
  - [ ] Métodos open/close/handle implementados
  - [ ] Getters para estado reactivo

- [ ] **Comando de menú implementado**
  - [ ] Función de comando simple (sin navegación)
  - [ ] Solo llama a `modalService.openEntityModal()`
  - [ ] Manejo de errores incluido

- [ ] **Modal global en App**
  - [ ] Componente importado en app.ts
  - [ ] ViewChild agregado
  - [ ] Método handleModalClose implementado
  - [ ] p-dialog agregado en app.html
  - [ ] Binding de eventos configurado

- [ ] **Componente del modal**
  - [ ] Outputs para entityCreated y cancelled
  - [ ] Método público resetForm() implementado
  - [ ] Lógica dual (modal interno vs global)
  - [ ] Validaciones de formulario

- [ ] **Lista/componentes relacionados**
  - [ ] Suscripción a entityCreated$
  - [ ] Refresh automático de datos
  - [ ] Cleanup en ngOnDestroy

- [ ] **Testing y verificación**
  - [ ] TypeScript check sin errores
  - [ ] Build exitoso (ignorar warnings de bundle size)
  - [ ] Modal se abre desde sidebar sin navegación
  - [ ] Formulario se resetea al abrir/cerrar
  - [ ] Eventos se propagan correctamente

## Ejemplos Reales

### Implementación de "Crear Cliente"

```typescript
// 1. ModalService - clientCreated$ stream
this.clientCreatedSubject.next({ client, context });

// 2. Menu command - directo sin navegación
modalService.openClientModal('SIDEBAR');

// 3. Global modal en app.html
<app-create-client-modal
  (clientCreated)="modalService.handleClientCreated($event)">

// 4. Lista escucha eventos
this.modalService.clientCreated$.subscribe(event => this.loadClients());
```

### Implementación de "Crear Usuario Admin"

```typescript
// 1. ModalService con contextos tipados
modalService.openAdminUserModal(ADMIN_USER_MODAL_CONTEXTS.SIDEBAR);

// 2. Eventos específicos por contexto
if (event.context === ADMIN_USER_MODAL_CONTEXTS.SIDEBAR) {
  this.loadUsers();
}
```

## Ventajas del Patrón

### 🎯 **UX Mejorada**
- Sin navegaciones innecesarias
- Flujo de trabajo continuo
- Apertura instantánea del modal

### 🔧 **Mantenibilidad**
- Patrón consistente y reutilizable
- Centralización del estado en ModalService
- Fácil testing y debugging

### 🚀 **Escalabilidad**
- Fácil agregar nuevos modales globales
- Contextos múltiples soportados
- Metadatos customizables por contexto

### 📊 **Performance**
- Lazy loading preservado
- Sin cargas innecesarias de componentes
- Mejor gestión de memoria

:::info Arquitectura Escalable
Este patrón puede extenderse fácilmente para soportar múltiples tipos de modales con diferentes contextos y metadatos.
:::

## Solución de Problemas

### Problemas Comunes

#### Modal no se abre
- ✅ Verificar que modalService esté inyectado en menu-items.ts
- ✅ Confirmar que setModalService() se llame en sidebar constructor
- ✅ Revisar console logs para errores

#### Formulario no se resetea
- ✅ Verificar que resetForm() sea público en el componente
- ✅ Confirmar ViewChild en app.ts
- ✅ Asegurar que handleModalClose() llame al resetForm()

#### Eventos no se propagan
- ✅ Verificar suscripciones en ngOnInit
- ✅ Confirmar cleanup en ngOnDestroy
- ✅ Revisar que los outputs estén conectados correctamente

### Debug Tips

```typescript
// Agregar logs para debugging
console.log('Modal state:', {
  visible: this.modalService.isEntityModalVisible()(),
  context: this.modalService.getCurrentEntityModalContext()()
});

// Verificar suscripciones
this.modalService.entityCreated$.subscribe(event => {
  console.log('Entity created event:', event);
});
```

## Patrones Avanzados

### Modales con Metadatos

```typescript
// Abrir modal con datos específicos
modalService.openEntityModal('EDIT_MODE', {
  entityId: '123',
  initialData: existingEntity,
  permissions: ['read', 'write']
});

// En el componente modal
ngOnInit() {
  const metadata = this.modalService.getCurrentEntityModalMetadata();
  if (metadata) {
    this.initializeForEdit(metadata);
  }
}
```

### Validación Contextual

```typescript
// Diferentes validaciones según contexto
ngOnInit() {
  const context = this.modalService.getCurrentEntityModalContext();

  if (context === 'SIDEBAR') {
    // Validaciones simples para creación rápida
    this.setupSimpleValidation();
  } else if (context === 'ADMIN_PANEL') {
    // Validaciones completas para administradores
    this.setupAdvancedValidation();
  }
}
```

### Eventos Tipados

```typescript
// Definir tipos específicos para eventos
interface UserCreatedEvent extends EntityCreatedEvent {
  entity: User;
  context: 'SIDEBAR' | 'USER_MANAGEMENT' | 'ADMIN_PANEL';
}

// Usar en el servicio
private userCreatedSubject = new Subject<UserCreatedEvent>();
public userCreated$ = this.userCreatedSubject.asObservable();
```

:::tip Extensibilidad
Para casos más complejos, considera implementar un sistema de plugins de modales que permita registro dinámico de diferentes tipos de modales.
:::

## Referencias

- **Implementación de referencia**: `CreateClientModalComponent` y `CreateAdminUserModalComponent`
- **ModalService completo**: `libs/shared-features/src/lib/shared/services/modal.service.ts`
- **Menu items**: `libs/shared-features/src/lib/shared/constants/menu-items.ts`
- **App global**: `apps/app-client/src/app/app.html` y `app.ts`

Para patrones de modales simples dentro de páginas específicas, consulta la [Guía de Desarrollo](./guia-desarrollo#integración-del-sistema-de-modales).

---

## Autor

**Desarrollado por:** Tricell Software Solutions
**Proyecto Base:** Angular Base Frontend Template - Guía de Modales Globales
**Versión:** 1.0.0
**Fecha:** Enero 2025

*Este proyecto base fue creado para facilitar el desarrollo de aplicaciones Angular modernas con mejores prácticas y arquitectura consolidada.*
# Backoffice Administration

## Visión del Backoffice

El backoffice de Carvento es la interfaz administrativa centralizada que permite a los administradores, vendedores y personal interno gestionar todas las operaciones de la plataforma. Proporciona herramientas avanzadas para la administración de vehículos, leads de ventas, usuarios, contenido y análisis de negocio.

:::info
El backoffice constituye el centro neurálgico de la plataforma Carvento, proporcionando control total sobre todas las operaciones del negocio desde una interfaz unificada y segura.
:::

## Objetivos Principales

### Gestión Operacional
- **Administración de inventario** de vehículos completa
- **Gestión de leads** y seguimiento de ventas
- **Gestión de usuarios** y verificaciones
- **Moderación de contenido** y publicaciones
- **Configuración del sistema** y parámetros

### Análisis y Reportes
- **Dashboard ejecutivo** con KPIs en tiempo real
- **Reportes financieros** y de performance
- **Analytics de usuario** y comportamiento
- **Métricas de ventas** y conversión de leads
- **Alertas y notificaciones** automatizadas

### Operaciones de Negocio
- **Procesamiento de verificaciones** de identidad
- **Gestión de disputas** y reclamos
- **Control de calidad** de listados
- **Configuración de precios** y comisiones
- **Gestión de contenido** promocional

## Arquitectura del Backoffice

### Stack Tecnológico
- **Frontend**: Angular 20+ (aplicación separada del cliente público)
- **UI Library**: PrimeNG con tema administrativo personalizado
- **State Management**: NgRx para manejo de estado complejo
- **Charts**: Chart.js para visualizaciones
- **Real-time**: WebSockets para actualizaciones en vivo

:::tip Separación de Aplicaciones
El backoffice se desarrolla como aplicación Angular independiente para garantizar seguridad, optimización específica y despliegue separado del frontend público.
:::

### Estructura de Módulos

```
apps/backoffice/src/app/
├── core/
│   ├── auth/              # Autenticación administrativa
│   ├── guards/            # Guards de autorización por rol
│   ├── interceptors/      # HTTP interceptors específicos
│   └── services/          # Servicios core del backoffice
├── shared/
│   ├── components/        # Componentes UI reutilizables
│   ├── pipes/             # Pipes de transformación
│   ├── directives/        # Directivas personalizadas
│   └── models/            # Modelos de datos
├── modules/
│   ├── dashboard/         # Dashboard principal y KPIs
│   ├── vehicles/          # Gestión de inventario
│   ├── leads/             # Gestión de leads y ventas
│   ├── users/             # Gestión de usuarios
│   ├── content/           # Gestión de contenido
│   ├── reports/           # Reportes y analytics
│   ├── system/            # Configuración del sistema
│   └── notifications/     # Centro de notificaciones
└── layouts/
    ├── admin-layout/      # Layout principal administrativo
    ├── login-layout/      # Layout de login
    └── public-layout/     # Layout para páginas públicas del admin
```

## Módulos Principales

### 1. Dashboard Ejecutivo

El dashboard principal proporciona una vista de 360 grados del estado del negocio con métricas en tiempo real y alertas proactivas.

#### Componentes del Dashboard
```typescript
@Component({
  selector: 'app-executive-dashboard',
  template: `
    <div class="dashboard-grid">
      <!-- KPIs Principales -->
      <app-kpi-cards [metrics]="dashboardMetrics()" />

      <!-- Gráficos de Tendencias -->
      <div class="charts-section">
        <app-revenue-chart [data]="revenueData()" />
        <app-sales-performance-chart [data]="salesData()" />
        <app-user-growth-chart [data]="userGrowthData()" />
      </div>

      <!-- Actividad en Tiempo Real -->
      <div class="live-activity">
        <app-live-leads [leads]="activeLeads()" />
        <app-recent-registrations [users]="recentUsers()" />
        <app-system-alerts [alerts]="systemAlerts()" />
      </div>

      <!-- Tablas de Datos -->
      <div class="data-tables">
        <app-top-performing-vehicles />
        <app-pending-verifications />
        <app-recent-sales />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExecutiveDashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  // Signals para reactivity
  dashboardMetrics = computed(() => this.dashboardService.getMetrics());
  revenueData = computed(() => this.dashboardService.getRevenueData());
  auctionData = computed(() => this.dashboardService.getAuctionPerformance());
  userGrowthData = computed(() => this.dashboardService.getUserGrowthData());
  liveAuctions = computed(() => this.dashboardService.getLiveAuctions());
  recentUsers = computed(() => this.dashboardService.getRecentUsers());
  systemAlerts = computed(() => this.dashboardService.getSystemAlerts());
}
```

#### KPIs y Métricas Principales
```typescript
interface DashboardMetrics {
  // Métricas Financieras
  totalRevenue: MoneyMetric;
  monthlyRevenue: MoneyMetric;
  averageTransactionValue: MoneyMetric;
  commissionRevenue: MoneyMetric;

  // Métricas de Ventas y Leads
  activeLeads: CountMetric;
  totalLeads: CountMetric;
  leadConversionRate: PercentageMetric;
  averageLeadResponseTime: TimeMetric;
  testDrivesScheduled: CountMetric;
  vehiclesSold: CountMetric;

  // Métricas de Usuarios
  totalUsers: CountMetric;
  activeUsers: CountMetric;
  newRegistrations: CountMetric;
  userVerificationRate: PercentageMetric;

  // Métricas de Inventario
  totalVehicles: CountMetric;
  availableVehicles: CountMetric;
  averageTimeToSale: TimeMetric;
  inventoryTurnover: PercentageMetric;

  // Métricas de Sistema
  systemUptime: PercentageMetric;
  averageResponseTime: TimeMetric;
  errorRate: PercentageMetric;
  pendingTasks: CountMetric;
}
```

:::note Métricas Clave
El dashboard prioriza métricas que impactan directamente en la toma de decisiones: conversión de leads, performance de inventario, salud del sistema y satisfacción del usuario.
:::

### 2. Gestión de Inventario de Vehículos

Sistema completo para administrar el ciclo de vida de vehículos desde el registro hasta la venta, incluyendo herramientas avanzadas de moderación y aprovación.

#### Funcionalidades Principales
```typescript
@Component({
  selector: 'app-vehicle-management',
  template: `
    <div class="vehicle-management">
      <!-- Filtros y Búsqueda -->
      <app-vehicle-filters
        [filters]="filters()"
        (filtersChanged)="updateFilters($event)" />

      <!-- Acciones Masivas -->
      <app-bulk-actions
        [selectedItems]="selectedVehicles()"
        (actionExecuted)="handleBulkAction($event)" />

      <!-- Tabla de Vehículos -->
      <p-table
        [value]="vehicles()"
        [lazy]="true"
        [paginator]="true"
        [rows]="pageSize()"
        [totalRecords]="totalCount()"
        (onLazyLoad)="loadVehicles($event)"
        [selection]="selectedVehicles()"
        selectionMode="multiple">

        <ng-template pTemplate="header">
          <tr>
            <th><p-tableHeaderCheckbox /></th>
            <th pSortableColumn="vin">VIN</th>
            <th pSortableColumn="make">Marca</th>
            <th pSortableColumn="model">Modelo</th>
            <th pSortableColumn="year">Año</th>
            <th pSortableColumn="status">Estado</th>
            <th pSortableColumn="created_at">Fecha Registro</th>
            <th>Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-vehicle>
          <tr>
            <td><p-tableCheckbox [value]="vehicle" /></td>
            <td>{{ vehicle.vin }}</td>
            <td>{{ vehicle.make }}</td>
            <td>{{ vehicle.model }}</td>
            <td>{{ vehicle.year }}</td>
            <td>
              <app-status-badge [status]="vehicle.status" />
            </td>
            <td>{{ vehicle.createdAt | date:'short' }}</td>
            <td>
              <app-vehicle-actions
                [vehicle]="vehicle"
                (actionSelected)="handleVehicleAction($event)" />
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Panel de Detalles -->
      <p-sidebar
        [(visible)]="showDetailsPanel()"
        position="right"
        [style]="{ width: '60vw' }">
        <app-vehicle-details
          [vehicleId]="selectedVehicleId()"
          (vehicleUpdated)="onVehicleUpdated($event)" />
      </p-sidebar>
    </div>
  `
})
export class VehicleManagementComponent {
  private readonly vehicleService = inject(VehicleManagementService);

  // State signals
  vehicles = signal<Vehicle[]>([]);
  selectedVehicles = signal<Vehicle[]>([]);
  filters = signal<VehicleFilters>({});
  totalCount = signal(0);
  pageSize = signal(20);
  showDetailsPanel = signal(false);
  selectedVehicleId = signal<string | null>(null);

  handleBulkAction(action: BulkAction): void {
    switch (action.type) {
      case 'approve':
        this.approveBulkVehicles(this.selectedVehicles());
        break;
      case 'publish':
        this.publishVehicles(this.selectedVehicles());
        break;
      case 'change_status':
        this.changeVehiclesStatus(this.selectedVehicles(), action.payload.status);
        break;
      case 'export':
        this.exportVehicles(this.selectedVehicles());
        break;
    }
  }

  private async approveBulkVehicles(vehicles: Vehicle[]): Promise<void> {
    const approvalDialog = this.dialog.open(BulkApprovalDialogComponent, {
      data: { vehicles, action: 'approve' }
    });

    const result = await firstValueFrom(approvalDialog.afterClosed());
    if (result?.confirmed) {
      await this.vehicleService.bulkApprove(vehicles.map(v => v.id), result.notes);
      this.loadVehicles();
    }
  }
}
```

#### Gestión Avanzada de Fotos
```typescript
@Component({
  selector: 'app-vehicle-photo-manager',
  template: `
    <div class="photo-manager">
      <!-- Upload Area -->
      <p-fileUpload
        mode="advanced"
        [multiple]="true"
        accept="image/*"
        [maxFileSize]="10000000"
        (onUpload)="onPhotosUploaded($event)"
        [customUpload]="true">

        <ng-template pTemplate="content">
          <app-drag-drop-zone />
        </ng-template>
      </p-fileUpload>

      <!-- Photo Grid -->
      <div class="photo-grid">
        @for (photo of vehiclePhotos(); track photo.id) {
          <div class="photo-item" [class.primary]="photo.isPrimary">
            <img [src]="photo.thumbnailUrl" [alt]="photo.description" />

            <div class="photo-overlay">
              <div class="photo-actions">
                <button
                  pButton
                  icon="pi pi-star"
                  [class]="photo.isPrimary ? 'p-button-warning' : 'p-button-text'"
                  (click)="setPrimaryPhoto(photo)"
                  title="Establecer como principal" />

                <button
                  pButton
                  icon="pi pi-pencil"
                  class="p-button-text"
                  (click)="editPhoto(photo)"
                  title="Editar" />

                <button
                  pButton
                  icon="pi pi-trash"
                  class="p-button-text p-button-danger"
                  (click)="deletePhoto(photo)"
                  title="Eliminar" />
              </div>

              <div class="photo-info">
                <span class="photo-type">{{ photo.type | titlecase }}</span>
                <span class="photo-size">{{ photo.fileSize | fileSize }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class VehiclePhotoManagerComponent {
  vehiclePhotos = input.required<VehiclePhoto[]>();
  photoManagementEnabled = input(true);

  private readonly photoService = inject(PhotoManagementService);

  async onPhotosUploaded(event: FileUploadEvent): Promise<void> {
    const files = event.files;
    const vehicleId = this.vehicleId();

    // Crear loading indicators
    const uploadTasks = files.map(file => ({
      file,
      status: 'uploading' as const,
      progress: 0
    }));

    // Upload en paralelo con progress tracking
    const uploadPromises = files.map(async (file, index) => {
      try {
        const result = await this.photoService.uploadVehiclePhoto(
          vehicleId,
          file,
          this.determinePhotoType(file),
          (progress) => {
            uploadTasks[index].progress = progress;
          }
        );

        uploadTasks[index].status = 'completed';
        return result;
      } catch (error) {
        uploadTasks[index].status = 'error';
        throw error;
      }
    });

    await Promise.allSettled(uploadPromises);
    this.refreshPhotos();
  }

  async setPrimaryPhoto(photo: VehiclePhoto): Promise<void> {
    await this.photoService.setPrimaryPhoto(photo.vehicleId, photo.id);
    this.refreshPhotos();
  }

  private determinePhotoType(file: File): PhotoType {
    const fileName = file.name.toLowerCase();

    if (fileName.includes('exterior') || fileName.includes('outside')) {
      return PhotoType.EXTERIOR;
    } else if (fileName.includes('interior') || fileName.includes('inside')) {
      return PhotoType.INTERIOR;
    } else if (fileName.includes('engine') || fileName.includes('motor')) {
      return PhotoType.ENGINE;
    } else if (fileName.includes('dashboard') || fileName.includes('tablero')) {
      return PhotoType.DASHBOARD;
    }

    return PhotoType.OTHER;
  }
}
```

:::tip Gestión de Fotos
El sistema de gestión de fotos incluye categorización automática, optimización de imágenes, validación de calidad y herramientas de edición para garantizar listados atractivos y profesionales.
:::

### 3. Gestión de Leads y Ventas

Centro de operaciones para maximizar la conversión de leads a través de herramientas de seguimiento, programación automática y análisis de performance de ventas.

#### Centro de Gestión de Leads
```typescript
@Component({
  selector: 'app-lead-management-center',
  template: `
    <div class="lead-management-center">
      <!-- Vista de Leads Activos -->
      <div class="active-leads-section">
        <h2>Leads Activos</h2>

        @for (lead of activeLeads(); track lead.id) {
          <app-lead-card
            [lead]="lead"
            [vehicleInfo]="getVehicleInfo(lead.vehicleId)"
            (actionTriggered)="handleLeadAction($event)" />
        }
      </div>

      <!-- Panel de Seguimiento -->
      <div class="follow-up-section">
        <h2>Test Drives Programados</h2>

        <app-test-drive-scheduler
          [scheduledTestDrives]="scheduledTestDrives()"
          [availableAgents]="availableAgents()"
          (testDriveUpdated)="onTestDriveUpdated($event)" />
      </div>

      <!-- Métricas de Performance -->
      <div class="performance-metrics">
        <app-sales-metrics
          [metrics]="salesMetrics()"
          [timeframe]="selectedTimeframe()" />
      </div>

      <!-- Cola de Seguimiento -->
      <div class="follow-up-queue">
        <h2>Cola de Seguimiento</h2>

        <app-follow-up-queue
          [pendingFollowUps]="pendingFollowUps()"
          (followUpCompleted)="onFollowUpCompleted($event)" />
      </div>
    </div>
  `
})
export class LeadManagementCenterComponent {
  private readonly leadService = inject(LeadManagementService);
  private readonly realTimeService = inject(RealTimeDataService);

  // State
  activeLeads = signal<Lead[]>([]);
  scheduledTestDrives = signal<TestDrive[]>([]);
  availableAgents = signal<SalesAgent[]>([]);
  salesMetrics = signal<SalesMetrics>({});
  pendingFollowUps = signal<FollowUpTask[]>([]);
  selectedTimeframe = signal<TimeFrame>('today');

  ngOnInit(): void {
    this.setupRealTimeUpdates();
    this.loadInitialData();
  }

  handleLeadAction(action: LeadAction): void {
    switch (action.type) {
      case 'contact':
        this.contactLead(action.leadId);
        break;
      case 'schedule_test_drive':
        this.scheduleTestDrive(action.leadId);
        break;
      case 'mark_interested':
        this.markAsInterested(action.leadId);
        break;
      case 'close':
        this.closeLead(action.leadId, action.payload.reason);
        break;
      case 'assign_agent':
        this.assignAgent(action.leadId, action.payload.agentId);
        break;
    }
  }

  private async contactLead(leadId: string): Promise<void> {
    const contactDialog = this.dialog.open(ContactLeadDialogComponent, {
      data: { leadId }
    });

    const result = await firstValueFrom(contactDialog.afterClosed());
    if (result?.contacted) {
      await this.leadService.markAsContacted(leadId, result.notes);
      this.showSuccessMessage('Lead contactado exitosamente');
    }
  }

  getVehicleInfo(vehicleId: string): Observable<VehicleInfo> {
    return this.leadService.getVehicleInfo(vehicleId);
  }

  private setupRealTimeUpdates(): void {
    // WebSocket connection for real-time updates
    this.realTimeService.connect();

    // Subscribe to lead updates
    this.realTimeService.leadUpdates$.subscribe(update => {
      this.updateLeadInList(update);
    });

    // Subscribe to system alerts
    this.realTimeService.systemAlerts$.subscribe(alert => {
      this.handleSystemAlert(alert);
    });
  }
}
```

#### Herramientas de Seguimiento de Leads en Tiempo Real
```typescript
@Component({
  selector: 'app-lead-activity-tracker',
  template: `
    <div class="lead-tracker">
      <!-- Información del Vehículo -->
      <div class="vehicle-info">
        <h3>{{ vehicle().make }} {{ vehicle().model }}</h3>
        <div class="vehicle-stats">
          <span class="price">{{ vehicle().price | currency }}</span>
          <span class="lead-count">{{ totalLeads() }} leads</span>
          <span class="conversion-rate">{{ conversionRate() }}% conversión</span>
        </div>
      </div>

      <!-- Stream de Actividad de Leads -->
      <div class="leads-stream">
        <h4>Actividad Reciente de Leads</h4>

        <div class="lead-list" #leadContainer>
          @for (activity of recentActivity(); track activity.id) {
            <div class="activity-item" [class.priority]="activity.isPriority">
              <div class="activity-info">
                <span class="customer">{{ activity.customerInfo.displayName }}</span>
                <span class="action">{{ activity.action | titlecase }}</span>
                <span class="timestamp">{{ activity.timestamp | date:'short' }}</span>
              </div>

              <div class="activity-actions" *ngIf="activity.requiresAction">
                <button
                  pButton
                  icon="pi pi-phone"
                  class="p-button-text p-button-success"
                  (click)="callCustomer(activity)"
                  title="Llamar cliente" />

                <button
                  pButton
                  icon="pi pi-calendar"
                  class="p-button-text p-button-info"
                  (click)="scheduleTestDrive(activity)"
                  title="Programar test drive" />

                <button
                  pButton
                  icon="pi pi-envelope"
                  class="p-button-text"
                  (click)="sendEmail(activity)"
                  title="Enviar email" />
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Leads Activos por Vehículo -->
      <div class="active-leads">
        <h4>Leads Activos ({{ activeLeads().length }})</h4>

        @for (lead of activeLeads(); track lead.id) {
          <div class="lead-item" [class.hot]="lead.isHot">
            <div class="lead-info">
              <span class="name">{{ lead.customerName }}</span>
              <span class="status">{{ lead.status | titlecase }}</span>
              <span class="last-contact">{{ lead.lastContact | timeAgo }}</span>
            </div>

            <div class="lead-actions">
              <button
                pButton
                icon="pi pi-eye"
                class="p-button-text"
                (click)="viewLeadDetails(lead)"
                title="Ver detalles" />

              <button
                pButton
                icon="pi pi-user"
                class="p-button-text p-button-info"
                (click)="assignAgent(lead)"
                title="Asignar agente" />
            </div>
          </div>
        }
      </div>

      <!-- Controles de Gestión -->
      <div class="management-controls">
        <h4>Acciones de Gestión</h4>

        <div class="control-buttons">
          <button
            pButton
            label="Promocionar Vehículo"
            icon="pi pi-star"
            class="p-button-warning"
            (click)="promoteVehicle()"
            title="Destacar este vehículo" />

          <button
            pButton
            label="Programar Seguimientos"
            icon="pi pi-clock"
            class="p-button-info"
            (click)="scheduleFollowUps()" />

          <button
            pButton
            label="Generar Reporte"
            icon="pi pi-file"
            class="p-button-secondary"
            (click)="generateReport()" />
        </div>
      </div>
    </div>
  `
})
export class LeadActivityTrackerComponent {
  vehicle = input.required<Vehicle>();

  private readonly leadService = inject(LeadManagementService);
  private readonly websocketService = inject(WebSocketService);

  recentActivity = signal<LeadActivity[]>([]);
  activeLeads = signal<Lead[]>([]);
  totalLeads = signal(0);
  conversionRate = signal(0);

  ngOnInit(): void {
    this.subscribeToLeadUpdates();
    this.loadLeadMetrics();
  }

  async callCustomer(activity: LeadActivity): Promise<void> {
    const callDialog = this.dialog.open(CallCustomerDialogComponent, {
      data: { leadId: activity.leadId, customerInfo: activity.customerInfo }
    });

    const result = await firstValueFrom(callDialog.afterClosed());
    if (result?.called) {
      await this.leadService.recordCall(activity.leadId, result.notes);
      this.updateActivityStatus(activity.id, 'contacted');
    }
  }

  async scheduleTestDrive(activity: LeadActivity): Promise<void> {
    const scheduleDialog = this.dialog.open(ScheduleTestDriveDialogComponent, {
      data: { leadId: activity.leadId, vehicleId: this.vehicle().id }
    });

    const result = await firstValueFrom(scheduleDialog.afterClosed());
    if (result?.scheduled) {
      await this.leadService.scheduleTestDrive(activity.leadId, result.dateTime);
      this.showSuccessMessage('Test drive programado exitosamente');
    }
  }

  private subscribeToLeadUpdates(): void {
    this.websocketService.subscribe(`vehicle:${this.vehicle().id}:leads`)
      .subscribe(update => {
        this.addNewActivity(update);
        this.updateLeadMetrics();
      });

    this.websocketService.subscribe(`vehicle:${this.vehicle().id}:conversions`)
      .subscribe(conversion => {
        this.handleConversion(conversion);
      });
  }

  private updateLeadMetrics(): void {
    this.leadService.getVehicleLeadMetrics(this.vehicle().id)
      .subscribe(metrics => {
        this.totalLeads.set(metrics.totalLeads);
        this.conversionRate.set(metrics.conversionRate);
      });
  }
}
```

:::warning Tiempo de Respuesta Crítico
Los leads requieren respuesta rápida. El sistema prioriza leads "calientes" y proporciona alertas automáticas para garantizar seguimiento oportuno y maximizar conversiones.
:::

### 4. Gestión de Usuarios y Verificaciones

Sistema integral para administrar usuarios, procesar verificaciones de identidad y mantener la seguridad de la plataforma a través de herramientas automatizadas de análisis de documentos.

#### Panel de Verificaciones
```typescript
@Component({
  selector: 'app-verification-panel',
  template: `
    <div class="verification-panel">
      <!-- Filtros y Estado -->
      <div class="filters-section">
        <app-verification-filters
          [filters]="filters()"
          (filtersChanged)="updateFilters($event)" />

        <div class="status-summary">
          <div class="status-card">
            <span class="count">{{ pendingVerifications().length }}</span>
            <span class="label">Pendientes</span>
          </div>
          <div class="status-card">
            <span class="count">{{ inReviewVerifications().length }}</span>
            <span class="label">En Revisión</span>
          </div>
          <div class="status-card">
            <span class="count">{{ todayApproved() }}</span>
            <span class="label">Aprobadas Hoy</span>
          </div>
        </div>
      </div>

      <!-- Cola de Verificaciones -->
      <div class="verification-queue">
        @for (verification of filteredVerifications(); track verification.id) {
          <app-verification-card
            [verification]="verification"
            [expandedView]="selectedVerificationId() === verification.id"
            (verificationSelected)="selectVerification($event)"
            (actionTaken)="handleVerificationAction($event)" />
        }
      </div>

      <!-- Panel de Detalles -->
      <p-sidebar
        [(visible)]="showDetailsPanel()"
        position="right"
        [style]="{ width: '70vw' }">

        @if (selectedVerification(); as verification) {
          <app-verification-details
            [verification]="verification"
            [documentAnalysis]="getDocumentAnalysis(verification.id)"
            (decisionMade)="processVerificationDecision($event)" />
        }
      </p-sidebar>
    </div>
  `
})
export class VerificationPanelComponent {
  private readonly verificationService = inject(VerificationAdminService);

  filters = signal<VerificationFilters>({});
  allVerifications = signal<VerificationRecord[]>([]);
  selectedVerificationId = signal<string | null>(null);
  showDetailsPanel = signal(false);

  // Computed values
  filteredVerifications = computed(() =>
    this.applyFilters(this.allVerifications(), this.filters())
  );

  pendingVerifications = computed(() =>
    this.allVerifications().filter(v => v.status === 'pending')
  );

  inReviewVerifications = computed(() =>
    this.allVerifications().filter(v => v.status === 'in_review')
  );

  todayApproved = computed(() =>
    this.allVerifications().filter(v =>
      v.status === 'approved' && this.isToday(v.processedAt)
    ).length
  );

  selectedVerification = computed(() =>
    this.allVerifications().find(v => v.id === this.selectedVerificationId())
  );

  async processVerificationDecision(decision: VerificationDecision): Promise<void> {
    try {
      await this.verificationService.processDecision(decision);

      // Update local state
      this.updateVerificationStatus(decision.verificationId, decision.status);

      // Send notification to user
      await this.notifyUserOfDecision(decision);

      // Close details panel
      this.showDetailsPanel.set(false);
      this.selectedVerificationId.set(null);

      this.showSuccessMessage(`Verificación ${decision.status} exitosamente`);
    } catch (error) {
      this.showErrorMessage('Error al procesar la decisión');
    }
  }

  getDocumentAnalysis(verificationId: string): Observable<DocumentAnalysisResult[]> {
    return this.verificationService.getDocumentAnalysis(verificationId);
  }

  private async notifyUserOfDecision(decision: VerificationDecision): Promise<void> {
    const notification = {
      userId: decision.userId,
      type: decision.status === 'approved' ? 'verification_approved' : 'verification_rejected',
      title: decision.status === 'approved'
        ? 'Verificación Aprobada'
        : 'Verificación Rechazada',
      message: decision.notes || 'Su solicitud de verificación ha sido procesada.',
      metadata: {
        verificationId: decision.verificationId,
        processedBy: decision.processedBy
      }
    };

    await this.verificationService.sendNotification(notification);
  }
}
```

#### Herramientas de Análisis de Documentos
```typescript
@Component({
  selector: 'app-document-analyzer',
  template: `
    <div class="document-analyzer">
      <!-- Vista de Documentos -->
      <div class="documents-section">
        <h3>Documentos Subidos</h3>

        @for (document of documents(); track document.id) {
          <div class="document-item" [class.selected]="selectedDocumentId() === document.id">
            <div class="document-preview" (click)="selectDocument(document.id)">
              <img [src]="document.thumbnailUrl" [alt]="document.filename" />
              <div class="document-info">
                <span class="filename">{{ document.filename }}</span>
                <span class="type">{{ document.type | titlecase }}</span>
                <span class="size">{{ document.fileSize | fileSize }}</span>
              </div>
            </div>

            <div class="analysis-indicators">
              <div class="confidence-score" [class]="getConfidenceClass(document.analysisResult?.confidence)">
                {{ (document.analysisResult?.confidence || 0) * 100 | number:'1.0-0' }}%
              </div>

              @if (document.analysisResult?.anomalies?.length > 0) {
                <div class="anomaly-indicator" title="Anomalías detectadas">
                  <i class="pi pi-exclamation-triangle"></i>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Panel de Análisis Detallado -->
      @if (selectedDocument(); as document) {
        <div class="analysis-panel">
          <h3>Análisis de {{ document.filename }}</h3>

          <!-- Visualización Aumentada -->
          <div class="document-viewer">
            <app-document-viewer
              [documentUrl]="document.fullUrl"
              [annotations]="document.analysisResult?.annotations"
              [highlights]="document.analysisResult?.extractedFields" />
          </div>

          <!-- Datos Extraídos -->
          <div class="extracted-data">
            <h4>Datos Extraídos</h4>

            @if (document.analysisResult?.extractedData; as data) {
              <div class="data-grid">
                @for (field of getExtractedFields(data); track field.name) {
                  <div class="data-field" [class.verified]="field.isVerified">
                    <label>{{ field.label }}:</label>
                    <span class="value">{{ field.value }}</span>
                    <span class="confidence">({{ field.confidence * 100 | number:'1.0-0' }}%)</span>

                    <div class="field-actions">
                      <button
                        pButton
                        icon="pi pi-check"
                        class="p-button-text p-button-success"
                        (click)="verifyField(field)"
                        title="Verificar dato" />

                      <button
                        pButton
                        icon="pi pi-pencil"
                        class="p-button-text"
                        (click)="editField(field)"
                        title="Editar dato" />
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Análisis de Anomalías -->
          @if (document.analysisResult?.anomalies?.length > 0) {
            <div class="anomalies-section">
              <h4>Anomalías Detectadas</h4>

              @for (anomaly of document.analysisResult.anomalies; track anomaly.id) {
                <div class="anomaly-item" [class.severity]="anomaly.severity">
                  <div class="anomaly-header">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span class="type">{{ anomaly.type | titlecase }}</span>
                    <span class="severity">{{ anomaly.severity | titlecase }}</span>
                  </div>

                  <div class="anomaly-description">
                    {{ anomaly.description }}
                  </div>

                  @if (anomaly.recommendation) {
                    <div class="anomaly-recommendation">
                      <strong>Recomendación:</strong> {{ anomaly.recommendation }}
                    </div>
                  }

                  <div class="anomaly-actions">
                    <button
                      pButton
                      label="Marcar como Falso Positivo"
                      class="p-button-text"
                      (click)="markAsFalsePositive(anomaly)" />

                    <button
                      pButton
                      label="Investigar"
                      class="p-button-text p-button-warning"
                      (click)="investigateAnomaly(anomaly)" />
                  </div>
                </div>
              }
            </div>
          }

          <!-- Recomendación de Decisión -->
          <div class="decision-recommendation">
            <h4>Recomendación del Sistema</h4>

            <div class="recommendation-card" [class]="document.analysisResult?.recommendation?.action">
              <div class="recommendation-header">
                <i [class]="getRecommendationIcon(document.analysisResult?.recommendation?.action)"></i>
                <span class="action">{{ document.analysisResult?.recommendation?.action | titlecase }}</span>
                <span class="confidence">
                  Confianza: {{ (document.analysisResult?.recommendation?.confidence || 0) * 100 | number:'1.0-0' }}%
                </span>
              </div>

              <div class="recommendation-reasoning">
                {{ document.analysisResult?.recommendation?.reasoning }}
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DocumentAnalyzerComponent {
  documents = input.required<IdentityDocument[]>();

  selectedDocumentId = signal<string | null>(null);

  selectedDocument = computed(() =>
    this.documents().find(d => d.id === this.selectedDocumentId())
  );

  selectDocument(documentId: string): void {
    this.selectedDocumentId.set(documentId);
  }

  getConfidenceClass(confidence?: number): string {
    if (!confidence) return 'unknown';

    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }

  getExtractedFields(data: any): ExtractedField[] {
    return Object.entries(data).map(([key, value]: [string, any]) => ({
      name: key,
      label: this.getFieldLabel(key),
      value: value.text || value,
      confidence: value.confidence || 1,
      isVerified: value.isVerified || false
    }));
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      'fullName': 'Nombre Completo',
      'documentNumber': 'Número de Documento',
      'dateOfBirth': 'Fecha de Nacimiento',
      'issueDate': 'Fecha de Expedición',
      'expiryDate': 'Fecha de Vencimiento',
      'address': 'Dirección',
      'nationality': 'Nacionalidad'
    };

    return labels[fieldName] || fieldName;
  }

  async verifyField(field: ExtractedField): Promise<void> {
    await this.documentService.verifyExtractedField(
      this.selectedDocument()!.id,
      field.name,
      field.value
    );

    // Update local state
    field.isVerified = true;
  }

  async editField(field: ExtractedField): Promise<void> {
    const newValue = await this.promptForNewValue(field);
    if (newValue !== null) {
      await this.documentService.updateExtractedField(
        this.selectedDocument()!.id,
        field.name,
        newValue
      );

      field.value = newValue;
      field.isVerified = true;
    }
  }
}
```

:::tip Análisis de Documentos
El sistema utiliza OCR e IA para analizar automáticamente documentos de identidad, detectar anomalías y extraer datos, reduciendo significativamente el tiempo de procesamiento de verificaciones.
:::

### 5. Reportes y Analytics

Plataforma completa de inteligencia de negocio con reportes predefinidos, dashboard personalizable y herramientas de análisis avanzado para tomar decisiones basadas en datos.

#### Dashboard de Reportes
```typescript
@Component({
  selector: 'app-reports-dashboard',
  template: `
    <div class="reports-dashboard">
      <!-- Filtros Globales -->
      <div class="filters-section">
        <app-date-range-picker
          [(dateRange)]="dateRange"
          (dateRangeChanged)="refreshAllReports()" />

        <p-multiSelect
          [options]="reportCategories"
          [(ngModel)]="selectedCategories"
          placeholder="Seleccionar categorías"
          (onChange)="filterReportsByCategory()" />
      </div>

      <!-- Reportes Rápidos -->
      <div class="quick-reports">
        <h3>Reportes Rápidos</h3>

        <div class="report-cards">
          <app-quick-report-card
            title="Resumen Diario"
            icon="pi pi-calendar"
            [data]="dailySummary()"
            [loading]="loadingDailySummary()"
            (downloadRequested)="downloadReport('daily_summary')" />

          <app-quick-report-card
            title="Performance de Subastas"
            icon="pi pi-chart-line"
            [data]="auctionPerformance()"
            [loading]="loadingAuctionPerformance()"
            (downloadRequested)="downloadReport('auction_performance')" />

          <app-quick-report-card
            title="Análisis de Usuarios"
            icon="pi pi-users"
            [data]="userAnalytics()"
            [loading]="loadingUserAnalytics()"
            (downloadRequested)="downloadReport('user_analytics')" />
        </div>
      </div>

      <!-- Reportes Detallados -->
      <div class="detailed-reports">
        <p-tabView>
          <p-tabPanel header="Financieros">
            <app-financial-reports
              [dateRange]="dateRange()"
              [metrics]="financialMetrics()" />
          </p-tabPanel>

          <p-tabPanel header="Operacionales">
            <app-operational-reports
              [dateRange]="dateRange()"
              [metrics]="operationalMetrics()" />
          </p-tabPanel>

          <p-tabPanel header="Marketing">
            <app-marketing-reports
              [dateRange]="dateRange()"
              [metrics]="marketingMetrics()" />
          </p-tabPanel>

          <p-tabPanel header="Técnicos">
            <app-technical-reports
              [dateRange]="dateRange()"
              [metrics]="technicalMetrics()" />
          </p-tabPanel>
        </p-tabView>
      </div>

      <!-- Reportes Personalizados -->
      <div class="custom-reports">
        <h3>Reportes Personalizados</h3>

        <div class="report-builder">
          <app-report-builder
            [availableMetrics]="availableMetrics()"
            [savedTemplates]="savedReportTemplates()"
            (reportGenerated)="handleCustomReport($event)" />
        </div>
      </div>
    </div>
  `
})
export class ReportsDashboardComponent {
  private readonly reportsService = inject(ReportsService);

  // State
  dateRange = signal<DateRange>(this.getDefaultDateRange());
  selectedCategories = signal<string[]>([]);

  // Loading states
  loadingDailySummary = signal(false);
  loadingAuctionPerformance = signal(false);
  loadingUserAnalytics = signal(false);

  // Data signals
  dailySummary = signal<DailySummaryReport | null>(null);
  auctionPerformance = signal<AuctionPerformanceReport | null>(null);
  userAnalytics = signal<UserAnalyticsReport | null>(null);
  financialMetrics = signal<FinancialMetrics | null>(null);
  operationalMetrics = signal<OperationalMetrics | null>(null);
  marketingMetrics = signal<MarketingMetrics | null>(null);
  technicalMetrics = signal<TechnicalMetrics | null>(null);

  reportCategories = [
    { label: 'Financieros', value: 'financial' },
    { label: 'Operacionales', value: 'operational' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Técnicos', value: 'technical' }
  ];

  async downloadReport(reportType: string): Promise<void> {
    try {
      const reportData = await this.reportsService.generateReport(
        reportType,
        this.dateRange(),
        { format: 'pdf' }
      );

      // Download file
      this.downloadFile(reportData.url, reportData.filename);
    } catch (error) {
      this.showErrorMessage('Error al generar reporte');
    }
  }

  private downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }

  private getDefaultDateRange(): DateRange {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Últimos 30 días

    return { start, end };
  }
}
```

:::note Reportes Automatizados
El sistema genera reportes automatizados diarios, semanales y mensuales, enviándolos por email a stakeholders y manteniéndolos disponibles en el dashboard para análisis histórico.
:::

## Configuración y Deployment

### Configuración Específica del Backoffice
```typescript
// apps/backoffice/src/environments/environment.ts
export const environment = {
  production: false,

  api: {
    baseUrl: 'https://api.carvento.com/admin',
    timeout: 30000, // Timeouts más largos para reportes
    retryAttempts: 3
  },

  websocket: {
    url: 'wss://api.carvento.com/admin/ws',
    reconnectInterval: 5000,
    heartbeatInterval: 30000
  },

  features: {
    realTimeModeration: true,
    advancedAnalytics: true,
    bulkOperations: true,
    documentAnalysis: true,
    exportFunctionality: true
  },

  security: {
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 horas
    mfaRequired: true,
    ipWhitelisting: true,
    auditLogging: true
  },

  ui: {
    theme: 'admin-dark',
    language: 'es',
    dateFormat: 'dd/mm/yyyy',
    currency: 'MXN',
    pagination: {
      defaultPageSize: 25,
      pageSizeOptions: [10, 25, 50, 100]
    }
  }
};
```

### Dockerfile Específico
```dockerfile
# apps/backoffice/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:backoffice

FROM nginx:alpine
COPY --from=builder /app/dist/backoffice /usr/share/nginx/html
COPY apps/backoffice/nginx.conf /etc/nginx/nginx.conf

# Security headers específicos para backoffice
RUN echo 'add_header X-Frame-Options "DENY";' >> /etc/nginx/conf.d/security.conf
RUN echo 'add_header X-Content-Type-Options "nosniff";' >> /etc/nginx/conf.d/security.conf
RUN echo 'add_header Referrer-Policy "strict-origin-when-cross-origin";' >> /etc/nginx/conf.d/security.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Seguridad del Backoffice

### Control de Acceso
- **Autenticación MFA obligatoria** para todos los usuarios administrativos
- **Whitelist de IPs** para acceso a funciones críticas
- **Roles granulares** con permisos específicos por módulo
- **Sesiones con timeout** automático por inactividad
- **Auditoría completa** de todas las acciones administrativas

### Protección de Datos
- **Encriptación end-to-end** para datos sensibles
- **Anonimización** de datos personales en reportes
- **Backup automatizado** de configuraciones
- **Logs de auditoría** inmutables
- **Compliance** con regulaciones de protección de datos

:::danger Seguridad Crítica
El backoffice maneja datos sensibles y operaciones críticas del negocio. Todas las funcionalidades incluyen múltiples capas de seguridad, auditoría completa y sistemas de backup automático.
:::

## Referencias y Documentos Relacionados

- [Autenticación y Autorización](./usuarios-autenticacion) - Sistema de seguridad y roles
- **Subastas en Tiempo Real** - Gestión de subastas desde el backoffice
- [Gestión de Usuarios](./usuarios-autenticacion) - Administración de cuentas y verificaciones
- **Configuración del Sistema** - Parámetros y configuración global

---

Este backoffice proporciona una plataforma administrativa completa y segura para gestionar todos los aspectos de la plataforma Carvento, desde la operación diaria hasta el análisis estratégico de negocio. Su arquitectura modular y herramientas especializadas garantizan eficiencia operacional y toma de decisiones informada.
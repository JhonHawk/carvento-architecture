# Dominio: Inventario de Vehículos - Marketplace de Venta Directa

## Visión del Dominio

El dominio de Inventario de Vehículos es el núcleo central de la plataforma Carvento, responsable de gestionar todo el ciclo de vida de los vehículos en un marketplace de venta directa similar a KAVAK. Este dominio maneja la información detallada de vehículos, documentos asociados, fotografías, especificaciones técnicas, pricing dinámico y gestión de leads de compradores interesados.

## Contexto del Negocio

### Responsabilidades Principales
- **Registro y catalogación** de vehículos para venta directa
- **Gestión de medios** (fotografías profesionales, documentos, videos 360°)
- **Control de estados** del vehículo (disponible, reservado, vendido, en inspección)
- **Validación de información** técnica y legal
- **Pricing dinámico** con integración AutoMétricas
- **Gestión de leads** e interesados por vehículo
- **Scheduling de test drives** y citas de inspección

### Usuarios del Dominio
- **Administradores**: Registro y gestión completa de inventario
- **Vendedores/Dealers**: Publicación y gestión de sus vehículos
- **Compradores**: Búsqueda, filtrado y visualización de vehículos
- **Agentes de Ventas**: Gestión de leads y coordinación de test drives
- **Inspectores**: Validación técnica y certificación de vehículos

## Modelo de Dominio

### Entidades Principales

#### 1. Vehicle (Agregado Raíz)
```typescript
export class Vehicle {
  private constructor(
    public readonly id: VehicleId,
    public readonly vin: VIN,
    private specifications: VehicleSpecifications,
    private status: VehicleStatus,
    private pricing: VehiclePricing,
    private media: VehicleMedia,
    private history: VehicleHistory,
    private documents: VehicleDocuments
  ) {}

  // Factory method para crear vehículos
  static create(specifications: VehicleSpecifications): Vehicle {
    const id = VehicleId.generate();
    const status = VehicleStatus.PENDING_VALIDATION;

    return new Vehicle(
      id,
      specifications.vin,
      specifications,
      status,
      VehiclePricing.empty(),
      VehicleMedia.empty(),
      VehicleHistory.create(),
      VehicleDocuments.empty()
    );
  }

  // Métodos de negocio
  public validateSpecifications(): ValidationResult {
    return this.specifications.validate();
  }

  public markAsAvailable(): void {
    if (!this.canBeMarkedAsAvailable()) {
      throw new InvalidStateTransitionError('Cannot mark vehicle as available');
    }

    this.status = VehicleStatus.AVAILABLE;
    this.recordEvent(new VehicleMarkedAsAvailableEvent(this.id));
  }

  public reserveForCustomer(customerId: UserId, reservationDuration: Duration): void {
    if (this.status !== VehicleStatus.AVAILABLE) {
      throw new VehicleNotAvailableError();
    }

    this.status = VehicleStatus.RESERVED;
    this.reservationExpiry = new Date(Date.now() + reservationDuration.toMilliseconds());
    this.recordEvent(new VehicleReservedEvent(this.id, customerId, this.reservationExpiry));
  }

  public addPhoto(photo: VehiclePhoto): void {
    if (this.media.photoCount >= VehicleMedia.MAX_PHOTOS) {
      throw new MaxPhotosExceededError();
    }

    this.media.addPhoto(photo);
    this.recordEvent(new PhotoAddedToVehicleEvent(this.id, photo.id));
  }

  public updatePricing(suggestedPrice: Money, marketValue: Money): void {
    this.pricing = new VehiclePricing(suggestedPrice, marketValue);
    this.recordEvent(new VehiclePricingUpdatedEvent(this.id, this.pricing));
  }

  private canBeMarkedAsAvailable(): boolean {
    return this.specifications.isValid() &&
           this.documents.hasRequiredDocuments() &&
           this.media.hasMinimumPhotos() &&
           this.status === VehicleStatus.PENDING_VALIDATION;
  }
}
```

#### 2. Value Objects

**VehicleSpecifications**:
```typescript
export class VehicleSpecifications {
  constructor(
    public readonly vin: VIN,
    public readonly make: Make,
    public readonly model: Model,
    public readonly year: Year,
    public readonly mileage: Mileage,
    public readonly engineType: EngineType,
    public readonly transmission: Transmission,
    public readonly fuelType: FuelType,
    public readonly color: Color,
    public readonly features: VehicleFeature[]
  ) {
    this.validateInvariants();
  }

  public validate(): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.vin.isValid()) {
      errors.push(new ValidationError('Invalid VIN format'));
    }

    if (this.year.value > new Date().getFullYear()) {
      errors.push(new ValidationError('Year cannot be in the future'));
    }

    if (this.mileage.value < 0) {
      errors.push(new ValidationError('Mileage cannot be negative'));
    }

    return ValidationResult.from(errors);
  }

  public isValid(): boolean {
    return this.validate().isValid;
  }

  private validateInvariants(): void {
    if (!this.vin || !this.make || !this.model) {
      throw new InvalidVehicleSpecificationsError('Required fields missing');
    }
  }
}
```

**VehicleStatus (Enum)**:
```typescript
export enum VehicleStatus {
  PENDING_VALIDATION = 'pending_validation',
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
  WITHDRAWN = 'withdrawn',
  UNDER_MAINTENANCE = 'under_maintenance'
}

export class VehicleStatusTransitions {
  private static readonly VALID_TRANSITIONS = new Map<VehicleStatus, VehicleStatus[]>([
    [VehicleStatus.PENDING_VALIDATION, [VehicleStatus.AVAILABLE, VehicleStatus.WITHDRAWN]],
    [VehicleStatus.AVAILABLE, [VehicleStatus.RESERVED, VehicleStatus.UNDER_MAINTENANCE, VehicleStatus.WITHDRAWN]],
    [VehicleStatus.RESERVED, [VehicleStatus.SOLD, VehicleStatus.AVAILABLE]],
    [VehicleStatus.UNDER_MAINTENANCE, [VehicleStatus.AVAILABLE, VehicleStatus.WITHDRAWN]],
  ]);

  static isValidTransition(from: VehicleStatus, to: VehicleStatus): boolean {
    const validTargets = this.VALID_TRANSITIONS.get(from) || [];
    return validTargets.includes(to);
  }
}
```

**VehicleMedia**:
```typescript
export class VehicleMedia {
  public static readonly MAX_PHOTOS = 20;
  public static readonly MIN_PHOTOS = 5;

  private photos: VehiclePhoto[] = [];
  private documents: VehicleDocument[] = [];

  static empty(): VehicleMedia {
    return new VehicleMedia();
  }

  public addPhoto(photo: VehiclePhoto): void {
    if (this.photos.length >= VehicleMedia.MAX_PHOTOS) {
      throw new MaxPhotosExceededError();
    }

    this.photos.push(photo);
  }

  public removePhoto(photoId: PhotoId): void {
    this.photos = this.photos.filter(photo => !photo.id.equals(photoId));
  }

  public hasMinimumPhotos(): boolean {
    return this.photos.length >= VehicleMedia.MIN_PHOTOS;
  }

  public get photoCount(): number {
    return this.photos.length;
  }

  public getPrimaryPhoto(): VehiclePhoto | null {
    return this.photos.find(photo => photo.isPrimary) || this.photos[0] || null;
  }

  public getPhotosByType(type: PhotoType): VehiclePhoto[] {
    return this.photos.filter(photo => photo.type === type);
  }
}
```

### Domain Services

#### VehicleValidationService
```typescript
@Injectable()
export class VehicleValidationService {
  constructor(
    private readonly vinValidator: VINValidatorService,
    private readonly marketDataService: MarketDataService
  ) {}

  async validateVehicle(vehicle: Vehicle): Promise<ValidationResult> {
    const validationResults = await Promise.all([
      this.validateVIN(vehicle.vin),
      this.validateSpecifications(vehicle.specifications),
      this.validateMarketData(vehicle.specifications)
    ]);

    return ValidationResult.combine(validationResults);
  }

  private async validateVIN(vin: VIN): Promise<ValidationResult> {
    const isValidFormat = this.vinValidator.validateFormat(vin.value);
    if (!isValidFormat) {
      return ValidationResult.error('Invalid VIN format');
    }

    const vinData = await this.vinValidator.decodeVIN(vin.value);
    if (!vinData) {
      return ValidationResult.error('VIN not found in database');
    }

    return ValidationResult.success();
  }

  private validateSpecifications(specs: VehicleSpecifications): Promise<ValidationResult> {
    return Promise.resolve(specs.validate());
  }

  private async validateMarketData(specs: VehicleSpecifications): Promise<ValidationResult> {
    try {
      const marketData = await this.marketDataService.getVehicleData(
        specs.make.value,
        specs.model.value,
        specs.year.value
      );

      if (!marketData) {
        return ValidationResult.warning('No market data available for this vehicle');
      }

      return ValidationResult.success();
    } catch (error) {
      return ValidationResult.warning('Could not verify market data');
    }
  }
}
```

#### VehicleLeadService
```typescript
@Injectable()
export class VehicleLeadService {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly leadRepository: VehicleLeadRepository,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService
  ) {}

  async createLead(vehicleId: VehicleId, userId: UserId, leadType: LeadType): Promise<VehicleLead> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new VehicleNotAvailableError();
    }

    const lead = VehicleLead.create(vehicleId, userId, leadType);
    await this.leadRepository.save(lead);

    // Notify seller about new lead
    await this.notificationService.notifyNewLead(vehicle.ownerId, lead);

    return lead;
  }

  async scheduleTestDrive(leadId: LeadId, scheduledDate: Date): Promise<void> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    lead.scheduleTestDrive(scheduledDate);
    await this.leadRepository.save(lead);

    await this.notificationService.notifyTestDriveScheduled(lead);
  }

  async getLeadsByVehicle(vehicleId: VehicleId): Promise<VehicleLead[]> {
    return this.leadRepository.findByVehicleId(vehicleId);
  }

  async markLeadAsContacted(leadId: LeadId, notes: string): Promise<void> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    lead.markAsContacted(notes);
    await this.leadRepository.save(lead);
  }
}
```

#### VehiclePricingService
```typescript
@Injectable()
export class VehiclePricingService {
  constructor(
    private readonly autoMetricasApi: AutoMetricasApiService,
    private readonly marketAnalysisService: MarketAnalysisService
  ) {}

  async calculateSuggestedPricing(vehicle: Vehicle): Promise<VehiclePricing> {
    const [marketValue, historicalData, conditionAdjustment] = await Promise.all([
      this.getMarketValue(vehicle.specifications),
      this.getHistoricalPricing(vehicle.specifications),
      this.calculateConditionAdjustment(vehicle)
    ]);

    const basePrice = marketValue.multiply(conditionAdjustment);
    const suggestedPrice = this.applyMarketTrends(basePrice, historicalData);

    return new VehiclePricing(
      suggestedPrice,
      marketValue,
      this.calculatePriceRange(suggestedPrice),
      new Date()
    );
  }

  private async getMarketValue(specs: VehicleSpecifications): Promise<Money> {
    const marketData = await this.autoMetricasApi.getVehicleValue({
      make: specs.make.value,
      model: specs.model.value,
      year: specs.year.value,
      mileage: specs.mileage.value
    });

    return Money.fromNumber(marketData.averagePrice, 'USD');
  }

  private calculateConditionAdjustment(vehicle: Vehicle): number {
    // Lógica para ajustar precio basado en condición del vehículo
    // Considera factores como: mileage, accidentes, mantenimiento, etc.
    let adjustment = 1.0;

    // Ajuste por millaje
    const mileageAdjustment = this.calculateMileageAdjustment(vehicle.specifications.mileage);
    adjustment *= mileageAdjustment;

    // Ajuste por historial de accidentes
    const accidentAdjustment = this.calculateAccidentAdjustment(vehicle.history);
    adjustment *= accidentAdjustment;

    return adjustment;
  }

  private calculateMileageAdjustment(mileage: Mileage): number {
    const averageMileagePerYear = 12000;
    const actualMileagePerYear = mileage.value / (new Date().getFullYear() -
      /* vehicle year */);

    if (actualMileagePerYear < averageMileagePerYear * 0.8) {
      return 1.1; // Bajo millaje: +10%
    } else if (actualMileagePerYear > averageMileagePerYear * 1.5) {
      return 0.85; // Alto millaje: -15%
    }

    return 1.0; // Millaje promedio: sin ajuste
  }
}
```

### Value Objects and Entities for Lead Management

#### VehicleLead Entity
```typescript
export class VehicleLead {
  private constructor(
    public readonly id: LeadId,
    public readonly vehicleId: VehicleId,
    public readonly userId: UserId,
    public readonly type: LeadType,
    private status: LeadStatus,
    private contactedAt?: Date,
    private testDriveScheduledFor?: Date,
    private notes?: string,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(vehicleId: VehicleId, userId: UserId, type: LeadType): VehicleLead {
    return new VehicleLead(
      LeadId.generate(),
      vehicleId,
      userId,
      type,
      LeadStatus.NEW
    );
  }

  scheduleTestDrive(scheduledDate: Date): void {
    if (this.status === LeadStatus.CLOSED) {
      throw new InvalidLeadOperationError('Cannot schedule test drive for closed lead');
    }

    this.testDriveScheduledFor = scheduledDate;
    this.status = LeadStatus.TEST_DRIVE_SCHEDULED;
  }

  markAsContacted(notes: string): void {
    this.contactedAt = new Date();
    this.notes = notes;
    this.status = LeadStatus.CONTACTED;
  }

  close(): void {
    this.status = LeadStatus.CLOSED;
  }

  get isActive(): boolean {
    return this.status !== LeadStatus.CLOSED;
  }
}

export enum LeadType {
  INQUIRY = 'inquiry',
  TEST_DRIVE_REQUEST = 'test_drive_request',
  PRICE_INQUIRY = 'price_inquiry',
  PHONE_CALL_REQUEST = 'phone_call_request'
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  TEST_DRIVE_SCHEDULED = 'test_drive_scheduled',
  CLOSED = 'closed'
}
```

## Arquitectura del Módulo

### Estructura de Capas

```
src/modules/vehicles/
├── domain/
│   ├── entities/
│   │   ├── vehicle.entity.ts
│   │   ├── vehicle-photo.entity.ts
│   │   └── vehicle-document.entity.ts
│   ├── value-objects/
│   │   ├── vin.vo.ts
│   │   ├── vehicle-specifications.vo.ts
│   │   ├── vehicle-pricing.vo.ts
│   │   └── vehicle-status.vo.ts
│   ├── services/
│   │   ├── vehicle-validation.service.ts
│   │   ├── vehicle-pricing.service.ts
│   │   └── vin-decoder.service.ts
│   ├── repositories/
│   │   ├── vehicle.repository.ts
│   │   └── vehicle-media.repository.ts
│   └── events/
│       ├── vehicle-created.event.ts
│       ├── vehicle-status-changed.event.ts
│       └── vehicle-pricing-updated.event.ts
├── application/
│   ├── commands/
│   │   ├── create-vehicle.command.ts
│   │   ├── update-vehicle-status.command.ts
│   │   ├── add-vehicle-photo.command.ts
│   │   └── update-vehicle-pricing.command.ts
│   ├── queries/
│   │   ├── get-vehicle-by-id.query.ts
│   │   ├── search-vehicles.query.ts
│   │   └── get-vehicle-pricing-history.query.ts
│   ├── handlers/
│   │   ├── command-handlers/
│   │   └── query-handlers/
│   └── dtos/
│       ├── create-vehicle.dto.ts
│       ├── vehicle-search-filter.dto.ts
│       └── vehicle-response.dto.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── migrations/
│   ├── external-services/
│   │   ├── autometricas-api.service.ts
│   │   ├── vin-decoder-api.service.ts
│   │   └── image-upload.service.ts
│   └── mappers/
│       ├── vehicle.mapper.ts
│       └── vehicle-specifications.mapper.ts
└── presentation/
    ├── controllers/
    │   ├── vehicles.controller.ts
    │   ├── vehicle-media.controller.ts
    │   └── vehicle-pricing.controller.ts
    ├── guards/
    └── decorators/
```

### Casos de Uso Principales

#### 1. Registrar Nuevo Vehículo

**Command Handler**:
```typescript
@CommandHandler(CreateVehicleCommand)
export class CreateVehicleHandler implements ICommandHandler<CreateVehicleCommand> {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly validationService: VehicleValidationService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateVehicleCommand): Promise<VehicleId> {
    // 1. Crear especificaciones del vehículo
    const specifications = new VehicleSpecifications(
      new VIN(command.vin),
      new Make(command.make),
      new Model(command.model),
      new Year(command.year),
      new Mileage(command.mileage),
      command.engineType,
      command.transmission,
      command.fuelType,
      new Color(command.color),
      command.features
    );

    // 2. Crear vehículo
    const vehicle = Vehicle.create(specifications);

    // 3. Validar vehículo
    const validationResult = await this.validationService.validateVehicle(vehicle);
    if (!validationResult.isValid) {
      throw new VehicleValidationError(validationResult.errors);
    }

    // 4. Guardar en repositorio
    await this.vehicleRepository.save(vehicle);

    // 5. Publicar eventos
    this.eventBus.publishAll(vehicle.getUncommittedEvents());

    return vehicle.id;
  }
}
```

#### 2. Búsqueda Avanzada de Vehículos

**Query Handler**:
```typescript
@QueryHandler(SearchVehiclesQuery)
export class SearchVehiclesHandler implements IQueryHandler<SearchVehiclesQuery> {
  constructor(
    private readonly vehicleRepository: VehicleRepository
  ) {}

  async execute(query: SearchVehiclesQuery): Promise<VehicleSearchResult> {
    const searchCriteria = new VehicleSearchCriteria({
      make: query.make,
      model: query.model,
      yearRange: query.yearRange,
      priceRange: query.priceRange,
      mileageRange: query.mileageRange,
      location: query.location,
      features: query.features,
      status: [VehicleStatus.AVAILABLE],
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    });

    const [vehicles, totalCount] = await Promise.all([
      this.vehicleRepository.findByCriteria(searchCriteria, query.pagination),
      this.vehicleRepository.countByCriteria(searchCriteria)
    ]);

    return new VehicleSearchResult(
      vehicles.map(vehicle => VehicleSearchResultDto.fromEntity(vehicle)),
      totalCount,
      query.pagination
    );
  }
}
```

#### 3. Carga de Fotos y Documentos

**Upload Service**:
```typescript
@Injectable()
export class VehicleMediaUploadService {
  constructor(
    private readonly s3Service: S3UploadService,
    private readonly vehicleRepository: VehicleRepository,
    private readonly imageProcessor: ImageProcessorService
  ) {}

  async uploadVehiclePhoto(
    vehicleId: VehicleId,
    photoFile: Express.Multer.File,
    photoType: PhotoType
  ): Promise<VehiclePhoto> {
    // 1. Validar vehículo existe
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new VehicleNotFoundError(vehicleId);
    }

    // 2. Procesar imagen
    const processedImage = await this.imageProcessor.processVehiclePhoto(photoFile);

    // 3. Generar múltiples resoluciones
    const imageVariants = await this.imageProcessor.generateVariants(processedImage, [
      { width: 1920, height: 1080, quality: 90 }, // Original
      { width: 800, height: 600, quality: 85 },   // Thumbnail
      { width: 300, height: 200, quality: 80 }    // Preview
    ]);

    // 4. Subir a S3
    const uploadPromises = imageVariants.map(variant =>
      this.s3Service.uploadFile(variant.buffer, {
        bucket: 'carvento-vehicle-photos',
        key: `vehicles/${vehicleId.value}/photos/${variant.resolution}.jpg`,
        contentType: 'image/jpeg',
        metadata: {
          vehicleId: vehicleId.value,
          photoType: photoType,
          resolution: variant.resolution
        }
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    // 5. Crear objeto VehiclePhoto
    const vehiclePhoto = new VehiclePhoto(
      PhotoId.generate(),
      vehicleId,
      photoType,
      uploadResults,
      new Date()
    );

    // 6. Agregar foto al vehículo
    vehicle.addPhoto(vehiclePhoto);

    // 7. Guardar cambios
    await this.vehicleRepository.save(vehicle);

    return vehiclePhoto;
  }
}
```

## API Endpoints

### Controlador Principal

```typescript
@Controller('vehicles')
@ApiTags('Vehicles')
export class VehiclesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, type: VehicleResponseDto })
  async createVehicle(@Body() createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const command = new CreateVehicleCommand(createVehicleDto);
    const vehicleId = await this.commandBus.execute(command);

    const query = new GetVehicleByIdQuery(vehicleId);
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  async getVehicle(@Param('id') id: string): Promise<VehicleResponseDto> {
    const query = new GetVehicleByIdQuery(new VehicleId(id));
    return await this.queryBus.execute(query);
  }

  @Get()
  @ApiOperation({ summary: 'Search vehicles with filters' })
  @ApiResponse({ status: 200, type: VehicleSearchResultDto })
  async searchVehicles(@Query() searchDto: VehicleSearchDto): Promise<VehicleSearchResultDto> {
    const query = new SearchVehiclesQuery(searchDto);
    return await this.queryBus.execute(query);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update vehicle status' })
  async updateVehicleStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateVehicleStatusDto
  ): Promise<void> {
    const command = new UpdateVehicleStatusCommand(new VehicleId(id), updateStatusDto.status);
    await this.commandBus.execute(command);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Upload vehicle photo' })
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadPhotoDto
  ): Promise<VehiclePhotoDto> {
    const command = new AddVehiclePhotoCommand(
      new VehicleId(id),
      file,
      uploadDto.photoType
    );
    return await this.commandBus.execute(command);
  }

  @Get(':id/pricing-history')
  @ApiOperation({ summary: 'Get vehicle pricing history' })
  async getPricingHistory(@Param('id') id: string): Promise<VehiclePricingHistoryDto> {
    const query = new GetVehiclePricingHistoryQuery(new VehicleId(id));
    return await this.queryBus.execute(query);
  }

  @Post(':id/leads')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a lead for a vehicle' })
  @ApiResponse({ status: 201, type: VehicleLeadDto })
  async createLead(
    @Param('id') id: string,
    @Body() createLeadDto: CreateLeadDto,
    @Req() request: any
  ): Promise<VehicleLeadDto> {
    const command = new CreateVehicleLeadCommand(
      new VehicleId(id),
      new UserId(request.user.id),
      createLeadDto.type,
      createLeadDto.message
    );
    return await this.commandBus.execute(command);
  }

  @Get(':id/leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Get leads for a vehicle' })
  async getVehicleLeads(@Param('id') id: string): Promise<VehicleLeadDto[]> {
    const query = new GetVehicleLeadsQuery(new VehicleId(id));
    return await this.queryBus.execute(query);
  }

  @Put(':vehicleId/leads/:leadId/schedule-test-drive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Schedule test drive for a lead' })
  async scheduleTestDrive(
    @Param('vehicleId') vehicleId: string,
    @Param('leadId') leadId: string,
    @Body() scheduleDto: ScheduleTestDriveDto
  ): Promise<void> {
    const command = new ScheduleTestDriveCommand(
      new LeadId(leadId),
      scheduleDto.scheduledDate
    );
    await this.commandBus.execute(command);
  }

  @Put(':id/reserve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reserve vehicle for customer' })
  async reserveVehicle(
    @Param('id') id: string,
    @Body() reserveDto: ReserveVehicleDto,
    @Req() request: any
  ): Promise<void> {
    const command = new ReserveVehicleCommand(
      new VehicleId(id),
      new UserId(request.user.id),
      Duration.fromHours(reserveDto.durationHours || 48)
    );
    await this.commandBus.execute(command);
  }
}
```

## Esquema de Base de Datos

```sql
-- Tabla principal de vehículos
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW())),
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    engine_type VARCHAR(50),
    transmission VARCHAR(20),
    fuel_type VARCHAR(20),
    color VARCHAR(30),
    status vehicle_status_enum NOT NULL DEFAULT 'pending_validation',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    CONSTRAINT valid_year_mileage CHECK (
        (EXTRACT(YEAR FROM NOW()) - year) * 15000 >= mileage
    )
);

-- Enum para estados de vehículo
CREATE TYPE vehicle_status_enum AS ENUM (
    'pending_validation',
    'available',
    'reserved',
    'sold',
    'withdrawn',
    'under_maintenance'
);

-- Tabla para características del vehículo
CREATE TABLE vehicle_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL,
    feature_value VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla para fotos del vehículo
CREATE TABLE vehicle_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    photo_type photo_type_enum NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT one_primary_photo_per_vehicle
        EXCLUDE (vehicle_id WITH =) WHERE (is_primary = TRUE)
);

CREATE TYPE photo_type_enum AS ENUM (
    'exterior_front',
    'exterior_rear',
    'exterior_side_left',
    'exterior_side_right',
    'interior_front',
    'interior_rear',
    'dashboard',
    'engine',
    'trunk',
    'wheels',
    'damage',
    'other'
);

-- Tabla para documentos del vehículo
CREATE TABLE vehicle_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type document_type_enum NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id)
);

CREATE TYPE document_type_enum AS ENUM (
    'title',
    'registration',
    'inspection_report',
    'maintenance_records',
    'insurance_history',
    'accident_report',
    'other'
);

-- Tabla para historial de precios
CREATE TABLE vehicle_pricing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    suggested_price DECIMAL(10,2),
    market_value DECIMAL(10,2),
    price_source VARCHAR(50), -- 'autometricas', 'manual', 'calculated'
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    factors JSONB -- Factores que influyeron en el precio
);

-- Tabla para cambios de estado
CREATE TABLE vehicle_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    previous_status vehicle_status_enum,
    new_status vehicle_status_enum NOT NULL,
    reason VARCHAR(500),
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla para leads de vehículos
CREATE TABLE vehicle_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    type lead_type_enum NOT NULL,
    status lead_status_enum NOT NULL DEFAULT 'new',
    message TEXT,
    contacted_at TIMESTAMP,
    test_drive_scheduled_for TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE lead_type_enum AS ENUM (
    'inquiry',
    'test_drive_request',
    'price_inquiry',
    'phone_call_request'
);

CREATE TYPE lead_status_enum AS ENUM (
    'new',
    'contacted',
    'test_drive_scheduled',
    'closed'
);

-- Tabla para reservas de vehículos
CREATE TABLE vehicle_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_vehicle_reservation UNIQUE (vehicle_id)
);

-- Índices para optimización
CREATE INDEX idx_vehicles_status_created ON vehicles (status, created_at);
CREATE INDEX idx_vehicles_make_model_year ON vehicles (make, model, year);
CREATE INDEX idx_vehicles_vin ON vehicles (vin);
CREATE INDEX idx_vehicles_search ON vehicles USING gin (
    to_tsvector('english', make || ' ' || model || ' ' || color)
);

-- Índices para búsquedas de fotos y documentos
CREATE INDEX idx_vehicle_photos_vehicle_type ON vehicle_photos (vehicle_id, photo_type);
CREATE INDEX idx_vehicle_documents_vehicle_type ON vehicle_documents (vehicle_id, document_type);

-- Índices para leads y reservas
CREATE INDEX idx_vehicle_leads_vehicle_status ON vehicle_leads (vehicle_id, status);
CREATE INDEX idx_vehicle_leads_user ON vehicle_leads (user_id, created_at);
CREATE INDEX idx_vehicle_reservations_expires ON vehicle_reservations (expires_at);
CREATE INDEX idx_vehicle_reservations_user ON vehicle_reservations (user_id);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Integración con Servicios Externos

### AutoMétricas API Integration

```typescript
@Injectable()
export class AutoMetricasApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheManager: CacheManager
  ) {}

  async getVehicleValue(vehicleData: VehicleMarketRequest): Promise<VehicleMarketValue> {
    const cacheKey = this.generateCacheKey(vehicleData);

    // Verificar cache (24 horas)
    const cachedValue = await this.cacheManager.get<VehicleMarketValue>(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    try {
      const response = await this.httpService.axiosRef.post(
        `${this.configService.get('AUTOMETRICAS_API_URL')}/vehicle-value`,
        {
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          mileage: vehicleData.mileage,
          country: 'MX' // México
        },
        {
          headers: {
            'Authorization': `Bearer ${this.configService.get('AUTOMETRICAS_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos
        }
      );

      const marketValue = new VehicleMarketValue(
        Money.fromNumber(response.data.averagePrice, 'MXN'),
        Money.fromNumber(response.data.minPrice, 'MXN'),
        Money.fromNumber(response.data.maxPrice, 'MXN'),
        response.data.dataPoints,
        new Date()
      );

      // Cache por 24 horas
      await this.cacheManager.set(cacheKey, marketValue, 86400);

      return marketValue;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new VehicleDataNotFoundError('Vehicle not found in market database');
      }

      throw new ExternalServiceError('AutoMétricas API error', error);
    }
  }

  private generateCacheKey(vehicleData: VehicleMarketRequest): string {
    return `autometricas:${vehicleData.make}:${vehicleData.model}:${vehicleData.year}:${vehicleData.mileage}`;
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('Vehicle Domain', () => {
  describe('Vehicle Entity', () => {
    it('should create vehicle with valid specifications', () => {
      const specifications = createValidSpecifications();
      const vehicle = Vehicle.create(specifications);

      expect(vehicle.id).toBeDefined();
      expect(vehicle.status).toBe(VehicleStatus.PENDING_VALIDATION);
    });

    it('should not allow marking as available without minimum photos', () => {
      const vehicle = createVehicleWithoutPhotos();

      expect(() => vehicle.markAsAvailable())
        .toThrow('Cannot mark vehicle as available');
    });

    it('should reserve vehicle for customer when available', () => {
      const vehicle = createAvailableVehicle();
      const customerId = new UserId('customer-123');
      const duration = Duration.fromHours(48);

      vehicle.reserveForCustomer(customerId, duration);

      expect(vehicle.status).toBe(VehicleStatus.RESERVED);
    });
  });
});
```

### Integration Tests
```typescript
describe('Vehicle Repository', () => {
  let repository: VehicleRepository;
  let testDataSource: DataSource;

  beforeEach(async () => {
    testDataSource = await createTestDatabase();
    repository = new TypeormVehicleRepository(testDataSource);
  });

  it('should save and retrieve vehicle', async () => {
    const vehicle = createTestVehicle();

    await repository.save(vehicle);
    const retrieved = await repository.findById(vehicle.id);

    expect(retrieved).toBeDefined();
    expect(retrieved.vin.value).toBe(vehicle.vin.value);
  });

  it('should find vehicles by search criteria', async () => {
    await seedTestVehicles(repository);

    const criteria = new VehicleSearchCriteria({
      make: 'Toyota',
      yearRange: { min: 2015, max: 2020 }
    });

    const results = await repository.findByCriteria(criteria);

    expect(results).toHaveLength(3);
    expect(results.every(v => v.specifications.make.value === 'Toyota')).toBe(true);
  });
});
```

Este dominio de Inventario de Vehículos forma la base fundamental de la plataforma Carvento, proporcionando una gestión robusta y escalable de toda la información relacionada con los vehículos, desde su registro hasta su venta final.
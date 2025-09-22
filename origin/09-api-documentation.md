# Documentación de APIs - Plataforma Carvento

## Visión General de las APIs

La plataforma Carvento expone un conjunto completo de APIs RESTful con documentación OpenAPI/Swagger, diseñadas para soportar tanto las aplicaciones frontend como integraciones de terceros. Las APIs están organizadas por dominio de negocio y siguen estándares industriales para autenticación, versionado y manejo de errores.

## Arquitectura de APIs

### Stack Tecnológico
- **Framework**: NestJS con decoradores OpenAPI
- **Documentación**: Swagger UI automática
- **Versionado**: Header-based versioning
- **Autenticación**: JWT con refresh tokens
- **Rate Limiting**: Redis-based throttling
- **Validación**: Class-validator con DTOs

### Estructura Base
```
https://api.carvento.com/
├── v1/
│   ├── auth/           # Autenticación y autorización
│   ├── users/          # Gestión de usuarios
│   ├── vehicles/       # Inventario de vehículos
│   ├── leads/          # Gestión de leads de ventas
│   ├── notifications/  # Sistema de notificaciones
│   ├── admin/          # APIs administrativas
│   └── webhooks/       # Webhooks para integraciones
├── health/             # Health checks
└── docs/               # Documentación Swagger
```

## APIs por Dominio

### 1. Authentication & Authorization APIs

#### POST /auth/login
```yaml
summary: Authenticate user and obtain tokens
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [email, password]
        properties:
          email:
            type: string
            format: email
            example: "user@example.com"
          password:
            type: string
            minLength: 8
            example: "SecurePass123!"
          rememberMe:
            type: boolean
            default: false

responses:
  200:
    description: Authentication successful
    content:
      application/json:
        schema:
          type: object
          properties:
            accessToken:
              type: string
              description: JWT access token (15 min expiry)
            refreshToken:
              type: string
              description: Refresh token (7 days expiry)
            user:
              $ref: '#/components/schemas/UserProfile'
            expiresIn:
              type: number
              description: Access token expiry in seconds

  401:
    description: Invalid credentials
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'

  423:
    description: Account locked due to multiple failed attempts
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
            lockoutDuration:
              type: number
              description: Remaining lockout time in seconds
```

#### POST /auth/mfa/verify
```yaml
summary: Complete MFA authentication
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [mfaToken, verificationCode]
        properties:
          mfaToken:
            type: string
            description: MFA token from initial login
          verificationCode:
            type: string
            pattern: '^[0-9]{6}$'
            description: 6-digit verification code

responses:
  200:
    description: MFA verification successful
    content:
      application/json:
        schema:
          type: object
          properties:
            accessToken:
              type: string
            refreshToken:
              type: string
            user:
              $ref: '#/components/schemas/UserProfile'
```

### 2. Vehicle Management APIs

#### GET /vehicles
```yaml
summary: Search vehicles with advanced filters
parameters:
  - name: make
    in: query
    schema:
      type: string
    example: "Toyota"
  - name: model
    in: query
    schema:
      type: string
    example: "Camry"
  - name: yearMin
    in: query
    schema:
      type: integer
      minimum: 1900
    example: 2015
  - name: yearMax
    in: query
    schema:
      type: integer
      maximum: 2024
    example: 2023
  - name: priceMin
    in: query
    schema:
      type: number
      minimum: 0
    example: 15000
  - name: priceMax
    in: query
    schema:
      type: number
    example: 50000
  - name: mileageMax
    in: query
    schema:
      type: integer
      minimum: 0
    example: 100000
  - name: status
    in: query
    schema:
      type: array
      items:
        type: string
        enum: [available, reserved]
    example: ["available"]
  - name: location
    in: query
    schema:
      type: string
    description: City or region
    example: "Bogotá"
  - name: sortBy
    in: query
    schema:
      type: string
      enum: [price, year, mileage, created_at]
      default: created_at
  - name: sortOrder
    in: query
    schema:
      type: string
      enum: [asc, desc]
      default: desc
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20

responses:
  200:
    description: Vehicle search results
    content:
      application/json:
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/Vehicle'
            pagination:
              $ref: '#/components/schemas/PaginationInfo'
            filters:
              type: object
              description: Applied filters summary
            totalCount:
              type: integer
              description: Total vehicles matching criteria
```

#### POST /vehicles
```yaml
summary: Create new vehicle listing
security:
  - BearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateVehicleDto'

responses:
  201:
    description: Vehicle created successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Vehicle'

  400:
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationError'

  403:
    description: Insufficient permissions
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

#### POST /vehicles/{id}/photos
```yaml
summary: Upload vehicle photos
security:
  - BearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid

requestBody:
  required: true
  content:
    multipart/form-data:
      schema:
        type: object
        properties:
          photos:
            type: array
            items:
              type: string
              format: binary
            maxItems: 20
          photoTypes:
            type: array
            items:
              type: string
              enum: [exterior_front, exterior_rear, interior, engine, dashboard]
            description: Photo type for each uploaded image

responses:
  201:
    description: Photos uploaded successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            uploadedPhotos:
              type: array
              items:
                $ref: '#/components/schemas/VehiclePhoto'
            totalPhotos:
              type: integer
            processingStatus:
              type: string
              enum: [completed, processing]

  413:
    description: File too large
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

### 3. Lead Management APIs

#### POST /vehicles/{id}/leads
```yaml
summary: Create a lead for a vehicle
security:
  - BearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Vehicle ID

requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [type]
        properties:
          type:
            type: string
            enum: [inquiry, test_drive_request, price_inquiry, phone_call_request]
          message:
            type: string
            maxLength: 1000
            description: Optional message from the customer
          preferredContactTime:
            type: string
            enum: [morning, afternoon, evening, anytime]
          phoneNumber:
            type: string
            pattern: '^[+]?[0-9\s\-\(\)]+$'
            description: Optional phone number for contact

responses:
  201:
    description: Lead created successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            lead:
              $ref: '#/components/schemas/Lead'
            estimatedResponseTime:
              type: string
              description: Estimated time for seller response
            nextSteps:
              type: array
              items:
                type: string

  400:
    description: Invalid request
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'

  409:
    description: Duplicate lead within time window
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
            existingLeadId:
              type: string
            cooldownPeriod:
              type: integer
              description: Seconds until new lead can be created
```

#### GET /leads/my-leads
```yaml
summary: Get user's leads
security:
  - BearerAuth: []
parameters:
  - name: status
    in: query
    schema:
      type: array
      items:
        type: string
        enum: [new, contacted, test_drive_scheduled, closed]
  - name: vehicleType
    in: query
    schema:
      type: string
      enum: [car, truck, motorcycle, other]
  - name: createdAfter
    in: query
    schema:
      type: string
      format: date-time
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20

responses:
  200:
    description: List of user's leads
    content:
      application/json:
        schema:
          type: object
          properties:
            leads:
              type: array
              items:
                $ref: '#/components/schemas/LeadWithVehicle'
            pagination:
              $ref: '#/components/schemas/Pagination'
            summary:
              type: object
              properties:
                total:
                  type: integer
                byStatus:
                  type: object
                  properties:
                    new:
                      type: integer
                    contacted:
                      type: integer
                    testDriveScheduled:
                      type: integer
                    closed:
                      type: integer
```

#### PUT /leads/{id}/schedule-test-drive
```yaml
summary: Schedule test drive for a lead
security:
  - BearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid

requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [scheduledDate]
        properties:
          scheduledDate:
            type: string
            format: date-time
            description: Preferred date and time for test drive
          notes:
            type: string
            maxLength: 500
            description: Additional notes or requirements
          meetingLocation:
            type: string
            maxLength: 200
            description: Preferred meeting location

responses:
  200:
    description: Test drive scheduled successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            testDrive:
              $ref: '#/components/schemas/TestDrive'
            confirmationCode:
              type: string
            sellerContact:
              type: object
              properties:
                name:
                  type: string
                phone:
                  type: string
                email:
                  type: string

  409:
    description: Scheduling conflict
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
            availableSlots:
              type: array
              items:
                type: string
                format: date-time
```

### 4. WebSocket Events API

#### Connection
```yaml
# WebSocket connection endpoint
ws://api.carvento.com/leads

# Authentication
# Send JWT token in connection query parameter or Authorization header

# Connection events:
connect:
  description: Successful connection
  payload:
    type: object
    properties:
      userId:
        type: string
      connectionId:
        type: string
      timestamp:
        type: string
        format: date-time

auth_error:
  description: Authentication failed
  payload:
    type: object
    properties:
      message:
        type: string
      code:
        type: string
```

#### Lead Events
```yaml
# Subscribe to lead updates
subscribeLead:
  description: Subscribe to updates for a specific lead
  request:
    type: object
    required: [leadId]
    properties:
      leadId:
        type: string
        format: uuid

  response:
    type: object
    properties:
      success:
        type: boolean
      leadStatus:
        $ref: '#/components/schemas/LeadStatus'

# Lead status updates
leadStatusUpdate:
  description: Lead status has changed
  payload:
    type: object
    properties:
      leadId:
        type: string
      previousStatus:
        type: string
      newStatus:
        type: string
        enum: [new, contacted, test_drive_scheduled, closed]
      updatedBy:
        type: string
        description: Who updated the status
      timestamp:
        type: string
        format: date-time
      notes:
        type: string

# New message on lead
leadMessage:
  description: New message received for lead
  payload:
    type: object
    properties:
      leadId:
        type: string
      messageId:
        type: string
      from:
        type: string
        enum: [customer, seller, system]
      message:
        type: string
      timestamp:
        type: string
        format: date-time
      attachments:
        type: array
        items:
          type: object
          properties:
            type:
              type: string
            url:
              type: string

# Test drive reminder
testDriveReminder:
  description: Reminder for upcoming test drive
  payload:
    type: object
    properties:
      leadId:
        type: string
      testDriveId:
        type: string
      scheduledTime:
        type: string
        format: date-time
      reminderType:
        type: string
        enum: [24_hours, 2_hours, 30_minutes]
      location:
        type: string
      contactInfo:
        type: object
```

### 5. Administrative APIs

#### GET /admin/dashboard/metrics
```yaml
summary: Get dashboard metrics for admin panel
security:
  - BearerAuth: []
  - AdminRole: []

parameters:
  - name: timeframe
    in: query
    schema:
      type: string
      enum: [today, week, month, quarter, year]
      default: today
  - name: metrics
    in: query
    schema:
      type: array
      items:
        type: string
        enum: [revenue, leads, users, vehicles, performance]
    description: Specific metrics to retrieve

responses:
  200:
    description: Dashboard metrics
    content:
      application/json:
        schema:
          type: object
          properties:
            timeframe:
              type: string
            generatedAt:
              type: string
              format: date-time
            metrics:
              type: object
              properties:
                revenue:
                  type: object
                  properties:
                    total:
                      type: number
                    change:
                      type: number
                      description: Percentage change from previous period
                    breakdown:
                      type: object
                      properties:
                        commissions:
                          type: number
                        premiumFeatures:
                          type: number
                leads:
                  type: object
                  properties:
                    active:
                      type: integer
                    total:
                      type: integer
                    conversionRate:
                      type: number
                    averageResponseTime:
                      type: number
                      description: Average response time in hours
                users:
                  type: object
                  properties:
                    total:
                      type: integer
                    active:
                      type: integer
                    newRegistrations:
                      type: integer
                    verificationRate:
                      type: number
```

#### PUT /admin/leads/{id}/assign-agent
```yaml
summary: Assign sales agent to lead
security:
  - BearerAuth: []
  - AdminRole: []

parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid

requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [agentId]
        properties:
          agentId:
            type: string
            format: uuid
            description: ID of the sales agent to assign
          notes:
            type: string
            maxLength: 500
            description: Assignment notes or special instructions
          priority:
            type: string
            enum: [low, normal, high, urgent]
            default: normal

responses:
  200:
    description: Agent assigned successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            leadId:
              type: string
            agentId:
              type: string
            assignedBy:
              type: string
            timestamp:
              type: string
              format: date-time
            estimatedResponseTime:
              type: string
              description: Expected time for agent to contact customer

  404:
    description: Lead or agent not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

## Schemas y Modelos de Datos

### Core Schemas
```yaml
components:
  schemas:
    Vehicle:
      type: object
      required: [id, vin, make, model, year, status]
      properties:
        id:
          type: string
          format: uuid
        vin:
          type: string
          pattern: '^[A-HJ-NPR-Z0-9]{17}$'
        make:
          type: string
          maxLength: 50
        model:
          type: string
          maxLength: 100
        year:
          type: integer
          minimum: 1900
          maximum: 2024
        mileage:
          type: integer
          minimum: 0
        color:
          type: string
          maxLength: 30
        engineType:
          type: string
          enum: [gasoline, diesel, hybrid, electric]
        transmission:
          type: string
          enum: [manual, automatic, cvt]
        fuelType:
          type: string
          enum: [gasoline, diesel, hybrid, electric, flex]
        status:
          type: string
          enum: [pending_validation, available, reserved, sold, withdrawn]
        pricing:
          type: object
          properties:
            suggestedPrice:
              type: number
            marketValue:
              type: number
            lastUpdated:
              type: string
              format: date-time
        photos:
          type: array
          items:
            $ref: '#/components/schemas/VehiclePhoto'
        features:
          type: array
          items:
            type: string
        location:
          type: object
          properties:
            city:
              type: string
            state:
              type: string
            country:
              type: string
              default: "CO"
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Lead:
      type: object
      required: [id, vehicleId, userId, type, status, createdAt]
      properties:
        id:
          type: string
          format: uuid
        vehicleId:
          type: string
          format: uuid
        vehicle:
          $ref: '#/components/schemas/Vehicle'
        userId:
          type: string
          format: uuid
        userInfo:
          type: object
          properties:
            displayName:
              type: string
            email:
              type: string
              format: email
            phone:
              type: string
        type:
          type: string
          enum: [inquiry, test_drive_request, price_inquiry, phone_call_request]
        status:
          type: string
          enum: [new, contacted, test_drive_scheduled, closed]
        message:
          type: string
          maxLength: 1000
        preferredContactTime:
          type: string
          enum: [morning, afternoon, evening, anytime]
        contactedAt:
          type: string
          format: date-time
        lastUpdated:
          type: string
          format: date-time
        assignedAgent:
          type: object
          properties:
            id:
              type: string
              format: uuid
            name:
              type: string
            email:
              type: string
              format: email
        notes:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
                format: uuid
              content:
                type: string
              addedBy:
                type: string
              addedAt:
                type: string
                format: date-time
        createdAt:
          type: string
          format: date-time

    TestDrive:
      type: object
      required: [id, leadId, scheduledDate, status]
      properties:
        id:
          type: string
          format: uuid
        leadId:
          type: string
          format: uuid
        vehicleId:
          type: string
          format: uuid
        customerId:
          type: string
          format: uuid
        agentId:
          type: string
          format: uuid
        scheduledDate:
          type: string
          format: date-time
        actualStartTime:
          type: string
          format: date-time
        actualEndTime:
          type: string
          format: date-time
        status:
          type: string
          enum: [scheduled, confirmed, in_progress, completed, cancelled, no_show]
        meetingLocation:
          type: string
          maxLength: 200
        notes:
          type: string
          maxLength: 1000
        confirmationCode:
          type: string
        remindersSent:
          type: array
          items:
            type: object
            properties:
              type:
                type: string
                enum: [24_hours, 2_hours, 30_minutes]
              sentAt:
                type: string
                format: date-time
        feedback:
          type: object
          properties:
            rating:
              type: integer
              minimum: 1
              maximum: 5
            comments:
              type: string
            interested:
              type: boolean

    UserProfile:
      type: object
      required: [id, email, firstName, lastName]
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        firstName:
          type: string
          maxLength: 100
        lastName:
          type: string
          maxLength: 100
        phone:
          type: string
          pattern: '^\+?[1-9]\d{1,14}$'
        avatar:
          type: string
          format: uri
        roles:
          type: array
          items:
            type: string
            enum: [visitor, customer, verified_customer, seller, admin]
        verification:
          type: object
          properties:
            emailVerified:
              type: boolean
            phoneVerified:
              type: boolean
            identityVerified:
              type: boolean
            verificationLevel:
              type: string
              enum: [none, email_verified, phone_verified, identity_verified, payment_verified]
        preferences:
          type: object
          properties:
            language:
              type: string
              default: "es"
            currency:
              type: string
              default: "MXN"
            timezone:
              type: string
              default: "America/Mexico_City"
            notifications:
              type: object
              properties:
                email:
                  type: boolean
                sms:
                  type: boolean
                push:
                  type: boolean

    ErrorResponse:
      type: object
      required: [error, message, timestamp]
      properties:
        error:
          type: string
        message:
          type: string
        timestamp:
          type: string
          format: date-time
        path:
          type: string
        details:
          type: object
        correlationId:
          type: string
          format: uuid

    ValidationError:
      type: object
      required: [error, message, validationErrors]
      properties:
        error:
          type: string
          example: "Validation Failed"
        message:
          type: string
        validationErrors:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string
              value:
                type: string
        timestamp:
          type: string
          format: date-time

    PaginationInfo:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
        limit:
          type: integer
          minimum: 1
        totalPages:
          type: integer
        totalCount:
          type: integer
        hasNext:
          type: boolean
        hasPrev:
          type: boolean
```

## Autenticación y Seguridad

### JWT Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "roles": ["customer", "verified_customer"],
    "permissions": ["lead:create", "vehicle:view"],
    "iat": 1641234567,
    "exp": 1641235467,
    "iss": "carvento-api",
    "aud": "carvento-client"
  }
}
```

### Rate Limiting
```yaml
Rate Limits:
  Authentication:
    login: 5 requests/minute per IP
    mfa: 3 requests/minute per user
    refresh: 10 requests/hour per user

  General APIs:
    vehicles: 100 requests/minute per user
    leads: 60 requests/minute per user
    test-drives: 10 requests/minute per user (scheduling limitation)

  Admin APIs:
    dashboard: 30 requests/minute per admin
    moderation: 20 requests/minute per moderator
    reports: 10 requests/minute per admin
```

### Error Handling Standards
```yaml
HTTP Status Codes:
  200: Success
  201: Created
  204: No Content
  400: Bad Request (validation errors)
  401: Unauthorized (authentication required)
  403: Forbidden (insufficient permissions)
  404: Not Found
  409: Conflict (business logic conflict)
  422: Unprocessable Entity (business rule violation)
  429: Too Many Requests (rate limiting)
  500: Internal Server Error
  503: Service Unavailable

Error Response Format:
  error: Human-readable error type
  message: Detailed error description
  timestamp: ISO 8601 timestamp
  path: Request path that caused error
  correlationId: Unique ID for error tracking
  details: Additional context (optional)
```

## Versionado de APIs

### Strategy
- **Header-based versioning**: `API-Version: v1`
- **Backward compatibility**: Minimum 2 versions supported
- **Deprecation timeline**: 6 months notice for breaking changes
- **Documentation**: Separate docs for each version

### Example Migration
```yaml
# V1 - Current
GET /v1/vehicles/{id}
Response:
  vehicle:
    id: string
    basicInfo: object

# V2 - Enhanced
GET /v2/vehicles/{id}
Response:
  vehicle:
    id: string
    specifications: object  # Renamed from basicInfo
    marketData: object      # New field
    sustainability: object  # New field
```

Esta documentación de APIs proporciona una referencia completa para desarrolladores, integradores y equipos de testing, facilitando el desarrollo y mantenimiento de la plataforma Carvento.
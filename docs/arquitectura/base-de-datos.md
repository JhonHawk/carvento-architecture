# Database Selection

## Resumen Ejecutivo

**Decisión**: PostgreSQL como base de datos principal para la plataforma Carvento.

**Justificación Principal**: La naturaleza relacional de los datos del dominio automotriz, la necesidad de transacciones ACID para transacciones financieras, y los requisitos de consistencia de leads hacen de PostgreSQL la opción óptima para este proyecto.

## Análisis Comparativo Detallado

### 1. Características del Dominio Carvento

#### Datos Altamente Relacionales
```sql
-- Ejemplo de relaciones complejas en Carvento
Vehicle -> Leads -> Users
Vehicle -> Photos -> S3_Metadata
User -> Profile -> Verification_Documents
Lead -> TestDrive -> Payment -> Transaction_History
```

**Características**:
- Relaciones estrictas entre entidades (vehículos, usuarios, leads, test drives)
- Integridad referencial crítica (no se puede tener test drive sin lead válido)
- Consultas complejas con múltiples JOINs para reportes y análisis
- Transacciones que afectan múltiples entidades simultáneamente

#### Consistencia Transaccional Crítica
En el contexto de leads y transacciones financieras:
- **Atomicidad**: Un lead debe actualizar el estado del vehículo Y registrar la interacción
- **Consistencia**: El estado del lead debe ser coherente en todo momento
- **Aislamiento**: Interacciones simultáneas no deben crear condiciones de carrera
- **Durabilidad**: Datos financieros deben persistir garantizadamente

### 2. PostgreSQL - Análisis Detallado

#### Fortalezas para Carvento

**1. ACID Transactions**
```sql
BEGIN;
  -- Actualizar estado del vehículo
  UPDATE vehicles SET status = 'reserved', reserved_at = NOW()
  WHERE id = 'vehicle_123' AND status = 'available';

  -- Crear nuevo lead
  INSERT INTO leads (vehicle_id, user_id, type, status, created_at)
  VALUES ('vehicle_123', 'user_456', 'test_drive_request', 'new', NOW());

  -- Notificar al vendedor
  INSERT INTO notifications (user_id, type, message)
  SELECT v.owner_id, 'new_lead', 'New lead for your vehicle'
  FROM vehicles v WHERE v.id = 'vehicle_123';
COMMIT;
```

**2. Esquemas Estructurados**
```sql
-- Esquema robusto para vehículos
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW())),
    mileage INTEGER CHECK (mileage >= 0),
    engine_type VARCHAR(50),
    transmission VARCHAR(20),
    fuel_type VARCHAR(20),
    status vehicle_status_enum NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices optimizados para búsquedas frecuentes
CREATE INDEX idx_vehicles_make_model_year ON vehicles (make, model, year);
CREATE INDEX idx_vehicles_status_created ON vehicles (status, created_at);
CREATE INDEX idx_vehicles_price_range ON vehicles USING BTREE (price) WHERE status = 'available';
```

**3. Consultas Complejas Optimizadas**
```sql
-- Consulta compleja para dashboard administrativo
SELECT
    v.make,
    v.model,
    COUNT(l.id) as total_leads,
    AVG(v.price) as avg_price,
    MAX(v.price) as max_price,
    COUNT(DISTINCT l.user_id) as unique_prospects,
    COUNT(CASE WHEN l.status = 'contacted' THEN 1 END) as contacted_leads
FROM vehicles v
LEFT JOIN leads l ON v.id = l.vehicle_id
WHERE v.created_at >= NOW() - INTERVAL '30 days'
GROUP BY v.make, v.model
ORDER BY avg_price DESC;
```

**4. Extensibilidad con JSON**
```sql
-- Flexibilidad para datos semi-estructurados
ALTER TABLE vehicles ADD COLUMN specifications JSONB;

-- Búsquedas eficientes en datos JSON
CREATE INDEX idx_vehicles_specs_gin ON vehicles USING GIN (specifications);

-- Consulta de características específicas
SELECT * FROM vehicles
WHERE specifications @> '{"airbags": true, "sunroof": true}';
```

#### Ventajas Técnicas Específicas

**Performance para Carvento**:
- **Índices Especializados**: B-tree, Hash, GIN para diferentes tipos de consulta
- **Particionado**: Tablas de auditoria por fecha para mejor performance
- **Concurrent Connections**: Manejo eficiente de múltiples conexiones durante picos de tráfico
- **Query Planner**: Optimizador avanzado para consultas complejas

**Escalabilidad**:
- **Read Replicas**: Para consultas de solo lectura (búsquedas de vehículos)
- **Connection Pooling**: PgBouncer para optimizar conexiones
- **Sharding Futuro**: Posibilidad de particionar por región geográfica

### 3. MongoDB - Análisis y Limitaciones

#### Fortalezas Teóricas
- **Flexibilidad de Esquema**: Documentos pueden variar en estructura
- **Escalabilidad Horizontal**: Sharding nativo
- **Consultas Anidadas**: Documentos embebidos eficientes
- **JSON Nativo**: Sin impedance mismatch

#### Limitaciones Críticas para Carvento

**1. Transacciones Multi-Documento**
```javascript
// MongoDB - Complejidad para transacciones
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    // Actualizar vehículo
    await Vehicle.updateOne(
      { _id: vehicleId, status: 'available' },
      { status: 'reserved', reservedAt: new Date() }
    ).session(session);

    // Crear lead
    await Lead.create([{
      vehicleId,
      userId,
      type: 'test_drive_request',
      timestamp: new Date()
    }], { session });

    // Notificaciones (requiere lógica adicional)
  });
} finally {
  await session.endSession();
}
```

**Problemas**:
- Transacciones multi-documento son costosas en performance
- Limitaciones en consultas durante transacciones
- Complejidad en manejo de errores y rollbacks

**2. Relaciones y Consistencia**
```javascript
// MongoDB - Problemas de consistencia
// Si se elimina un usuario, las pujas quedan órfanas
await User.deleteOne({ _id: userId });
// Las pujas en otra colección siguen existiendo sin validación
```

**3. Consultas Complejas**
```javascript
// MongoDB - Aggregation Pipeline complejo y menos eficiente
const result = await Vehicle.aggregate([
  {
    $lookup: {
      from: 'leads',
      localField: '_id',
      foreignField: 'vehicleId',
      as: 'leads'
    }
  },
  {
    $lookup: {
      from: 'testdrives',
      localField: 'leads._id',
      foreignField: 'leadId',
      as: 'testdrives'
    }
  },
  // Pipeline muy complejo para consultas simples en SQL
]);
```

### 4. Análisis de Casos de Uso Específicos

#### Caso 1: Sistema de Lead Management en Tiempo Real

**PostgreSQL**:
```sql
-- Operación atómica para nuevo lead
BEGIN;
  UPDATE vehicles SET
    status = 'reserved',
    lead_count = lead_count + 1,
    last_activity = NOW(),
    reserved_until = CASE
      WHEN NOW() + INTERVAL '48 hours' > reserved_until
      THEN NOW() + INTERVAL '48 hours'
      ELSE reserved_until
    END
  WHERE id = $1 AND status = 'available';

  INSERT INTO leads (vehicle_id, user_id, type, status) VALUES ($1, $2, $3, 'new');
COMMIT;
```
**Ventajas**: Operación atómica, sin condiciones de carrera, reserva automática por tiempo

**MongoDB**:
```javascript
// Requiere lógica de aplicación compleja para garantizar consistencia
const session = await startSession();
// Múltiples operaciones con validaciones manuales
```

#### Caso 2: Reportes Financieros y Analytics

**PostgreSQL**:
```sql
-- Reporte complejo en una sola consulta
SELECT
  DATE_TRUNC('month', v.sold_at) as month,
  SUM(v.price) as total_revenue,
  COUNT(*) as total_sales,
  AVG(v.price) as avg_price,
  SUM(v.price * 0.05) as commission_revenue
FROM vehicles v
WHERE v.status = 'sold'
  AND v.sold_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', v.sold_at)
ORDER BY month;
```

**MongoDB**:
```javascript
// Aggregation pipeline complejo y menos performante
const pipeline = [
  { $match: { status: 'completed', endTime: { $gte: /* 12 months ago */ } } },
  { $group: { /* complex grouping logic */ } },
  // Pipeline extenso para lograr el mismo resultado
];
```

#### Caso 3: Búsqueda y Filtrado de Vehículos

**PostgreSQL**:
```sql
-- Búsqueda optimizada con full-text search
SELECT v.*, ts_rank(search_vector, plainto_tsquery('toyota camry')) as rank
FROM vehicles v
WHERE search_vector @@ plainto_tsquery('toyota camry')
  AND price BETWEEN 10000 AND 30000
  AND year >= 2015
  AND status = 'available'
ORDER BY rank DESC, price ASC
LIMIT 20;
```

**MongoDB**:
```javascript
// Búsqueda menos optimizada
const results = await Vehicle.find({
  $text: { $search: 'toyota camry' },
  price: { $gte: 10000, $lte: 30000 },
  year: { $gte: 2015 },
  status: 'available'
}).limit(20);
```

### 5. Consideraciones Operacionales

#### PostgreSQL
**Ventajas Operacionales**:
- **Backup/Restore**: Herramientas maduras (pg_dump, PITR)
- **Monitoring**: Herramientas robustas (pg_stat_*, CloudWatch)
- **Performance Tuning**: Décadas de optimización y mejores prácticas
- **Ecosystem**: Extensiones maduras (PostGIS para geolocalización futura)

**Herramientas de Monitoreo**:
```sql
-- Monitoreo de performance en tiempo real
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE calls > 100
ORDER BY total_time DESC;
```

#### MongoDB
**Desventajas Operacionales**:
- **Backup Consistency**: Más complejo en entornos de alta transaccionalidad
- **Memory Usage**: Uso intensivo de memoria para working sets grandes
- **Sharding Complexity**: Configuración y mantenimiento complejo

### 6. Análisis de Costo y Performance

#### PostgreSQL en AWS RDS
```yaml
Configuración Recomendada:
  Instance: db.r5.xlarge (4 vCPU, 32 GB RAM)
  Storage: GP2 SSD con 1000 IOPS provisioned
  Multi-AZ: Sí (para alta disponibilidad)
  Read Replicas: 2 (para distribución de carga de lectura)

Costo Estimado Mensual: ~$800-1200
Performance Esperada:
  - Conexiones concurrentes: 500+
  - Queries/segundo: 5000+
  - Latencia promedio: <5ms
```

#### MongoDB Atlas
```yaml
Configuración Equivalente:
  Cluster: M30 (2 vCPU, 8 GB RAM)
  Storage: SSD
  Replication: 3-member replica set

Costo Estimado Mensual: ~$600-900
Performance:
  - Conexiones concurrentes: 500+
  - Operaciones/segundo: 3000+
  - Latencia promedio: 10-15ms para queries complejas
```

### 7. Extensibilidad Futura

#### PostgreSQL Extensions para Carvento
```sql
-- Geolocalización para búsquedas por ubicación
CREATE EXTENSION postgis;
ALTER TABLE vehicles ADD COLUMN location geometry(POINT,4326);

-- Full-text search avanzado
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_vehicles_description_trgm ON vehicles USING gin (description gin_trgm_ops);

-- Encriptación de datos sensibles
CREATE EXTENSION pgcrypto;
```

#### Futuras Capacidades
- **Machine Learning**: PostgreSQL + TimescaleDB para analytics predictivos
- **Time Series**: Para tracking de precios históricos
- **Graph Queries**: Para recomendaciones basadas en comportamiento

## Decisión Final y Justificación

### PostgreSQL es la elección óptima para Carvento por:

1. **Integridad Transaccional**: ACID completo esencial para transacciones financieras
2. **Modelo Relacional**: Mapeo natural al dominio de marketplace automotriz
3. **Performance Comprobada**: Para consultas complejas y reportes en tiempo real
4. **Ecosistema Maduro**: Herramientas, monitoring y mejores prácticas establecidas
5. **Flexibilidad de Desarrollo**: Esquema evolutivo para nuevas características
6. **Costo-Efectividad**: Mejor ROI para casos de uso relacionales
7. **Escalabilidad Probada**: Read replicas y particionado para crecimiento futuro

### Estrategia de Implementación
```sql
-- Arquitectura de base de datos recomendada
Primary Database: PostgreSQL 13+ en AWS RDS Multi-AZ
Read Replicas: 2 instancias para consultas de solo lectura
Cache Layer: Redis para sesiones y datos frecuentemente accedidos
Backup Strategy: PITR con retención de 30 días
```

---

Esta decisión proporciona la base más sólida para el crecimiento sostenible de la plataforma Carvento, garantizando consistencia de datos, performance óptima y facilidad de mantenimiento a largo plazo.

:::info[Documentos Relacionados]
- [Arquitectura General](./arquitectura-general) - Visión completa del sistema
- [Estrategia de Despliegue](./estrategia-despliegue) - Implementación en AWS
- [Inventario de Vehículos](../dominios/inventario-vehiculos) - Implementación específica del dominio
:::
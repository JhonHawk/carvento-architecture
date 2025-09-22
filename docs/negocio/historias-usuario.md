# User Stories

Esta sección presenta las historias de usuario principales del proyecto Carvento, organizadas por roles y módulos funcionales. Estas historias están diseñadas para facilitar la comprensión del valor de negocio y guiar las decisiones de priorización del desarrollo.

---

## Compradores de Vehículos

### Búsqueda y Descubrimiento

:::tip[Historia de Usuario - HU001]
**Como** comprador interesado en vehículos usados
**Quiero** buscar y filtrar vehículos por marca, modelo, año, precio y ubicación
**Para** encontrar rápidamente opciones que se ajusten a mis necesidades y presupuesto

**Criterios de Aceptación:**
- Filtros múltiples funcionales (marca, modelo, año, precio, ubicación)
- Resultados se actualizan en tiempo real
- Ordenamiento por precio, año, kilometraje
- Vista de lista y vista de galería
:::

:::tip[Historia de Usuario - HU002]
**Como** comprador potencial
**Quiero** ver fotos detalladas, especificaciones técnicas e historial del vehículo
**Para** evaluar la calidad y condición antes de solicitar información adicional

**Criterios de Aceptación:**
- Galería con hasta 20 fotos de alta resolución
- Especificaciones técnicas completas
- Historial de mantenimiento y accidentes
- Calificación de condición del vehículo
:::

### Interacción y Contacto

:::tip[Historia de Usuario - HU003]
**Como** comprador interesado
**Quiero** contactar al vendedor o solicitar una cita para ver el vehículo
**Para** obtener más información y programar una prueba de manejo

**Criterios de Aceptación:**
- Formulario de contacto con datos del comprador
- Sistema de programación de citas
- Chat en tiempo real con ejecutivos de venta
- Confirmación automática por email/SMS
:::

:::tip[Historia de Usuario - HU004]
**Como** comprador decidido
**Quiero** apartar un vehículo temporalmente
**Para** asegurar mi interés mientras coordino financiamiento o documentación

**Criterios de Aceptación:**
- Apartado temporal por 24-48 horas
- Notificación al vendedor del apartado
- Sistema de liberación automática por tiempo
- Posibilidad de extender el apartado
:::

## Participantes en Subastas

### Registro y Participación

:::tip[Historia de Usuario - HU005]
**Como** postor registrado
**Quiero** recibir notificaciones cuando vehículos de mi interés entren en subasta
**Para** no perder oportunidades de pujar por vehículos que me interesan

**Criterios de Aceptación:**
- Configuración de alertas por marca/modelo/precio
- Notificaciones por email y SMS
- Recordatorios antes del inicio de subasta
- Calendario de próximas subastas
:::

:::tip[Historia de Usuario - HU006]
**Como** participante en subasta
**Quiero** pujar en tiempo real con actualizaciones inmediatas
**Para** competir efectivamente por el vehículo que deseo

**Criterios de Aceptación:**
- Interface de pujas en tiempo real
- Actualización instantánea de pujas
- Indicador visual de puja líder
- Contador regresivo visible
- Auto-puja con límite máximo
:::

:::tip[Historia de Usuario - HU007]
**Como** ganador de subasta
**Quiero** recibir confirmación inmediata y próximos pasos
**Para** proceder con la compra y documentación requerida

**Criterios de Aceptación:**
- Notificación inmediata de ganador
- Resumen de la subasta y precio final
- Instrucciones para pago y documentación
- Información de contacto del vendedor
:::

## Vendedores y Propietarios

### Publicación de Vehículos

:::tip[Historia de Usuario - HU008]
**Como** propietario que quiere vender
**Quiero** registrar mi vehículo con toda la información relevante
**Para** atraer compradores serios y obtener el mejor precio

**Criterios de Aceptación:**
- Formulario guiado de registro
- Carga múltiple de fotos
- Validación automática de VIN
- Sugerencia de precio basada en AutoMétricas
:::

:::tip[Historia de Usuario - HU009]
**Como** vendedor
**Quiero** elegir entre venta directa o subasta
**Para** utilizar la estrategia que mejor se adapte a mi vehículo y urgencia

**Criterios de Aceptación:**
- Opción clara entre venta directa y subasta
- Explicación de ventajas de cada modalidad
- Estimación de tiempo de venta
- Configuración de precio base para subasta
:::

### Gestión de Leads

:::tip[Historia de Usuario - HU010]
**Como** vendedor
**Quiero** recibir y gestionar consultas de compradores interesados
**Para** responder eficientemente y cerrar la venta

**Criterios de Aceptación:**
- Notificaciones de nuevas consultas
- Dashboard de leads activos
- Historial de interacciones
- Sistema de seguimiento de prospectos
:::

## Administradores del Sistema

### Gestión de Inventario

:::tip[Historia de Usuario - HU011]
**Como** administrador
**Quiero** supervisar y moderar todas las publicaciones de vehículos
**Para** mantener la calidad y confiabilidad de la plataforma

**Criterios de Aceptación:**
- Dashboard de vehículos pendientes de aprobación
- Herramientas de validación de información
- Sistema de aprobación/rechazo
- Comunicación con vendedores sobre cambios
:::

### Control de Subastas

:::tip[Historia de Usuario - HU012]
**Como** administrador de subastas
**Quiero** programar, monitorear y gestionar eventos de subasta
**Para** asegurar procesos transparentes y sin conflictos

**Criterios de Aceptación:**
- Calendario de programación de subastas
- Monitoreo en tiempo real de pujas
- Herramientas de moderación
- Resolución de disputas
:::

### Analytics y Reportes

:::tip[Historia de Usuario - HU013]
**Como** administrador ejecutivo
**Quiero** acceder a métricas y reportes de rendimiento de la plataforma
**Para** tomar decisiones informadas sobre el negocio

**Criterios de Aceptación:**
- Dashboard con KPIs principales
- Reportes de ventas y conversión
- Análisis de comportamiento de usuarios
- Métricas de rendimiento técnico
:::

## Usuarios del Sistema

### Autenticación y Perfil

:::tip[Historia de Usuario - HU014]
**Como** usuario nuevo
**Quiero** registrarme de forma rápida y segura
**Para** acceder a todas las funcionalidades de la plataforma

**Criterios de Aceptación:**
- Registro con email y verificación
- Autenticación de doble factor opcional
- Validación de identidad para postores
- Perfil completable gradualmente
:::

:::tip[Historia de Usuario - HU015]
**Como** usuario registrado
**Quiero** gestionar mi perfil y preferencias
**Para** personalizar mi experiencia en la plataforma

**Criterios de Aceptación:**
- Edición de datos personales
- Configuración de notificaciones
- Historial de actividades
- Gestión de métodos de pago
:::

---

## Métricas de Éxito

### Indicadores de Adopción
- **Registro de Usuarios**: 1,000+ usuarios en primeros 3 meses
- **Publicaciones Activas**: 500+ vehículos publicados mensualmente
- **Subastas Exitosas**: 80%+ de subastas con al menos 3 pujas

### Indicadores de Satisfacción
- **Net Promoter Score (NPS)**: > 50
- **Tiempo Promedio de Venta**: < 30 días
- **Tasa de Conversión**: 15%+ de visitantes a leads

### Indicadores Técnicos
- **Tiempo de Respuesta**: < 2 segundos para páginas principales
- **Disponibilidad**: 99.9% uptime
- **Usuarios Simultáneos**: Soporte para 1,000+ usuarios en subastas

---

:::info[Priorización para Dirección]
Las historias marcadas como **HU001, HU006, HU008, HU011, HU013** son consideradas críticas para el MVP y deben priorizarse para demostrar valor de negocio temprano.
:::

:::warning[Dependencias Críticas]
- **HU006**: Requiere implementación completa de WebSockets
- **HU008**: Necesita integración con API de AutoMétricas
- **HU013**: Depende de implementación de sistema de analytics
:::
---
sidebar_position: 1
---

# Bienvenido a Carvento

**Carvento** es una plataforma digital integral, moderna y escalable para la compra y venta de vehículos usados. Diseñada desde cero como un marketplace directo similar a KAVAK, la plataforma aprovecha tecnologías de vanguardia para ofrecer una experiencia superior a compradores, vendedores y administradores.

## Visión del Proyecto

Carvento representa una **innovación disruptiva** en el mercado de vehículos usados, creada con tecnologías de vanguardia y un modelo de negocio optimizado para:

- **Escalabilidad Nativa**: Soporte para crecimiento exponencial desde el primer día
- **Seguridad Empresarial**: Protección de datos y transacciones financieras
- **Experiencia Premium**: Interfaz moderna que supera a la competencia tradicional
- **Eficiencia Operacional**: Procesos automatizados y analytics avanzados

## Arquitectura Tecnológica

### Stack Principal

- **Frontend**: Angular 20+ con PrimeNG y Tailwind CSS v4
- **Backend**: NestJS con TypeScript y PostgreSQL
- **Infraestructura**: AWS Fargate con servicios cloud-native
- **Tiempo Real**: WebSockets para sistema de subastas

### Módulos Principales

1. **[Gestión de Inventario](./dominios/inventario-vehiculos)** - Registro y control de vehículos
2. **[Sistema de Usuarios](./dominios/usuarios-autenticacion)** - Autenticación y roles
3. **[Backoffice](./dominios/backoffice-administracion)** - Panel administrativo
4. **Sistema de Subastas** - Pujas en tiempo real

## Navegación de la Documentación

Esta documentación está organizada en las siguientes secciones:

- **[Negocio y Requerimientos](./negocio/resumen-ejecutivo)** - Visión, objetivos y requerimientos del proyecto
- **[Arquitectura Técnica](./arquitectura/arquitectura-general)** - Diseño técnico y decisiones de arquitectura
- **[Dominios del Negocio](./dominios/inventario-vehiculos)** - Implementación de las áreas de negocio
- **[Guías de Desarrollo](./desarrollo/frontend/vision-general)** - Documentación técnica para desarrolladores

## Para Ejecutivos y Dirección

:::tip[Para Dirección]
Las secciones de **Negocio y Requerimientos** y **Sistema de Subastas** contienen información específicamente preparada para presentación ejecutiva, incluyendo historias de usuario, reglas de negocio y métricas de ROI.
:::

## Getting Started para Desarrolladores

Si eres un desarrollador trabajando en el proyecto, comienza con:

1. **[Arquitectura General](./arquitectura/arquitectura-general)** - Entender el diseño del sistema
2. **[Guías de Desarrollo](./desarrollo/frontend/vision-general)** - Patrones y mejores prácticas
3. **[Frontend](./desarrollo/frontend/vision-general)** - Específico para desarrollo Angular

:::info[Tecnologías Requeridas]
- **Node.js** 18+ para desarrollo
- **Angular** 20+ con Signals
- **NestJS** para APIs
- **PostgreSQL** como base de datos principal
:::

---

Esta documentación está viva y se actualiza constantemente conforme evoluciona el proyecto Carvento.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Carvento is a comprehensive used car sales and auction platform that includes:
- **Frontend**: Angular 20+ with PrimeNG and Nx monorepo
- **Backend**: NestJS API
- **Database**: PostgreSQL
- **Infrastructure**: AWS Fargate deployment

This project is a complete rewrite/modernization of an existing Odoo module, designed to be scalable and technology-independent.

## Common Commands

### Development
```bash
# Start all services for development
npm run dev                    # Start both frontend and backend in dev mode
npm run dev:frontend          # Start only frontend (port 4200)
npm run dev:backend           # Start only backend (port 3000)

# Frontend specific (Angular/Nx based)
npm run start                 # Main client app (port 4200)
npm run start:backoffice     # Backoffice admin app (port 4201)
npm run build                # Build client app
npm run build:backoffice     # Build admin app
npm run build:libs           # Build shared libraries
npm run start:dev            # Development with lib watch

# Backend specific (NestJS)
npm run backend:dev          # Start backend in watch mode
npm run backend:build        # Build backend
npm run backend:test         # Run backend tests
npm run backend:test:e2e     # Run backend e2e tests
```

### Quality Assurance
```bash
# Linting and formatting
npm run lint                 # Lint all projects (frontend + backend)
npm run lint:frontend        # Lint only frontend
npm run lint:backend         # Lint only backend
npm run format              # Format all code

# Testing
npm run test                # Run all tests (frontend + backend)
npm run test:frontend       # Run frontend tests
npm run test:backend        # Run backend tests
npm run test:e2e            # Run end-to-end tests

# Type checking
npm run typecheck           # TypeScript type checking for all projects
```

### Database Operations
```bash
# Database migrations and seeding
npm run db:migrate          # Run database migrations
npm run db:seed            # Seed database with initial data
npm run db:reset           # Reset database (drop, migrate, seed)
npm run db:generate        # Generate new migration
```

### Deployment
```bash
# Docker operations
npm run docker:build       # Build Docker containers
npm run docker:up          # Start services with Docker Compose
npm run docker:down        # Stop Docker services

# AWS deployment
npm run deploy:staging     # Deploy to staging environment
npm run deploy:prod        # Deploy to production environment
```

## Architecture Overview

### Monorepo Structure
```
carvento-platform/
├── apps/
│   ├── client/              # Public customer-facing app
│   ├── backoffice/          # Admin panel for managing platform
│   └── api/                 # NestJS backend API
├── libs/
│   ├── shared/              # Shared utilities and types
│   ├── ui-components/       # Reusable UI components
│   └── api-interfaces/      # Shared API interfaces
├── docs/
│   ├── architecture/        # Architecture documentation
│   ├── api/                # API documentation
│   └── deployment/         # Deployment guides
└── infrastructure/
    ├── docker/             # Docker configurations
    ├── aws/               # AWS CDK/CloudFormation
    └── k8s/               # Kubernetes manifests
```

### Frontend Architecture
- **Technology**: Angular 20+ with standalone components
- **UI Library**: PrimeNG 20+ with custom theme
- **Build System**: Nx monorepo with shared libraries
- **Styling**: Tailwind CSS v4 with zinc color palette
- **State Management**: Angular signals
- **Authentication**: JWT with role-based access control

### Backend Architecture
- **Technology**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with refresh tokens
- **API Design**: RESTful with OpenAPI documentation
- **Real-time**: WebSockets for auction bidding
- **External APIs**: AutoMétricas integration for market pricing

### Core Modules

#### Vehicle Inventory Module
- Vehicle registration with photos and technical specs
- Document management and history tracking
- Classification: direct sale vs auction
- Status management: available, reserved, sold

#### Auction Module
- Real-time bidding system using WebSockets
- Automatic auction scheduling and closure
- Email/SMS notifications for active bidders
- Bidding history and winner management

#### Market Pricing Module
- AutoMétricas API integration
- Market value calculation and comparison
- Price suggestion algorithms
- Historical pricing data

#### User Management
- Role-based authentication (visitor, bidder, client, admin)
- Email/SMS verification
- Profile management
- Permission system

#### Administrative Panel
- Inventory management dashboard
- User and role administration
- Auction management and monitoring
- Sales statistics and analytics
- System configuration

## Development Guidelines

### Frontend Development
- Use Angular 20+ features: signals, inject(), standalone components
- **CRITICAL**: Always use new control flow syntax (`@if`, `@for`, `@switch`)
- Follow the existing Angular template base patterns from `./frontend-docs/`
- Implement responsive design with Tailwind CSS v4
- Use zinc color palette for consistency
- Apply OnPush change detection strategy

### Backend Development
- Use NestJS decorators and dependency injection
- Implement proper error handling and validation
- Follow RESTful API design principles
- Use TypeORM entities with proper relationships
- Implement comprehensive logging
- Create OpenAPI documentation for all endpoints

### Database Design
- Use PostgreSQL with proper indexing
- Implement database migrations for schema changes
- Follow naming conventions: snake_case for tables/columns
- Create proper foreign key relationships
- Implement soft deletes for important entities

### Real-time Features
- Use WebSockets for auction bidding
- Implement proper connection management
- Handle connection drops gracefully
- Add rate limiting for bid submissions
- Maintain bidding state consistency

### Integration Guidelines
- AutoMétricas API integration for vehicle pricing
- Email service integration for notifications
- SMS service integration for verification
- File upload handling for vehicle photos
- Image optimization and CDN integration

## Security Requirements

### Authentication & Authorization
- JWT token-based authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Email/SMS two-factor authentication
- Session management and logout

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting for API endpoints

### Infrastructure Security
- HTTPS enforcement
- Security headers implementation
- Environment variable management
- Database encryption at rest
- Backup and disaster recovery

## Testing Strategy

### Unit Testing
- Frontend: Jest with Angular Testing Library
- Backend: Jest with NestJS testing utilities
- Minimum 80% code coverage requirement
- Mock external API dependencies

### Integration Testing
- API endpoint testing with test database
- Database operation testing
- External service integration testing
- WebSocket connection testing

### End-to-End Testing
- Playwright for frontend E2E tests
- Critical user journey testing
- Auction bidding flow testing
- Cross-browser compatibility testing

### Performance Testing
- Load testing for auction scenarios
- Database query optimization
- API response time monitoring
- Frontend bundle size optimization

## Deployment Architecture

### AWS Infrastructure
- **Compute**: ECS Fargate for containerized applications
- **Database**: RDS PostgreSQL with Multi-AZ
- **Storage**: S3 for vehicle photos and documents
- **CDN**: CloudFront for static assets
- **Load Balancer**: Application Load Balancer
- **Monitoring**: CloudWatch for logs and metrics

### Environment Configuration
- **Development**: Local Docker Compose setup
- **Staging**: AWS ECS with test database
- **Production**: AWS ECS with production database
- **Environment variables**: AWS Parameter Store

### CI/CD Pipeline
- GitHub Actions for automated testing
- Docker image building and scanning
- Automated deployment to staging
- Manual approval for production deployment
- Database migration automation

## External Integrations

### AutoMétricas API
- Vehicle valuation and market pricing
- Historical price data retrieval
- Real-time market analysis
- API key management and rate limiting

### Notification Services
- Email service for auction notifications
- SMS service for verification codes
- Push notifications for mobile users
- Template management for communications

### Payment Processing (Future)
- Payment gateway integration
- Secure transaction handling
- Refund and dispute management
- Financial reporting and reconciliation

## Monitoring and Analytics

### Application Monitoring
- Error tracking and alerting
- Performance monitoring
- User activity analytics
- Business metrics dashboard

### Infrastructure Monitoring
- Server health and resource usage
- Database performance monitoring
- Network and security monitoring
- Cost optimization tracking

## Documentation Requirements

### Technical Documentation
- API documentation with OpenAPI/Swagger
- Database schema documentation
- Architecture decision records (ADRs)
- Deployment and configuration guides

### User Documentation
- Admin panel user guide
- Customer platform guide
- Auction participation guide
- Troubleshooting documentation

## Migration Considerations

### From Odoo Module
- Data migration strategy from existing Odoo system
- User account migration and verification
- Historical auction data preservation
- Photo and document migration to S3

### Gradual Rollout
- Feature flag implementation
- A/B testing capabilities
- Rollback procedures
- User training and support

## Performance Requirements

### Response Times
- API responses: < 200ms for 95% of requests
- Page load times: < 2s for initial load
- Real-time bidding: < 100ms latency
- Database queries: < 50ms for complex queries

### Scalability Targets
- Support 1000+ concurrent auction participants
- Handle 10,000+ vehicle listings
- Process 100+ simultaneous auctions
- Scale to 50,000+ registered users

## Specialized Development Roles

When working on this project, leverage these specialized agents:

- **angular-developer**: For frontend component development
- **architect-reviewer**: For system design decisions
- **ui-ux-designer**: For user interface improvements
- **test-engineer**: For comprehensive testing strategies
- **code-reviewer**: For code quality assurance
- **technical-writer**: For documentation creation

## Common Issues and Solutions

### Frontend Issues
- Import path resolution in Nx monorepo
- PrimeNG theme customization
- Angular signal reactivity
- Performance optimization for large vehicle lists

### Backend Issues
- TypeORM relationship configuration
- WebSocket connection management
- Rate limiting for auction bidding
- External API integration reliability

### Infrastructure Issues
- AWS ECS task definition configuration
- Database connection pooling
- CDN cache invalidation
- SSL certificate management

## Quick Reference

### File Structure Conventions
- Components: PascalCase (VehicleListComponent)
- Services: PascalCase with Service suffix
- Interfaces: PascalCase with I prefix
- Database tables: snake_case
- API endpoints: kebab-case

### Naming Conventions
- Frontend: Angular style guide compliance
- Backend: NestJS conventions
- Database: PostgreSQL naming standards
- APIs: RESTful resource naming

### Git Workflow
- Feature branches: `feature/module-name-description`
- Bug fixes: `fix/issue-description`
- Hotfixes: `hotfix/urgent-issue`
- Releases: `release/version-number`

Remember to follow the existing patterns from the Angular frontend template base located in `./frontend-docs/` when developing frontend components.
# BuscAdis Backend Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Structure](#module-structure)
3. [Database Schema](#database-schema)
4. [Authentication](#authentication)
5. [Search Engine](#search-engine)
6. [API Documentation](#api-documentation)
7. [Development Guide](#development-guide)

## Architecture Overview

The BuscAdis backend is built with NestJS and follows a modular, domain-driven design pattern. It uses Fastify as the HTTP engine for improved performance and PostgreSQL as the primary database, with Elasticsearch for advanced search capabilities.

### Key Technologies

- **NestJS**: Modern Node.js framework
- **Fastify**: High-performance web framework
- **PostgreSQL**: Primary database
- **TypeORM**: ORM for database interactions
- **Elasticsearch**: Search engine
- **JWT**: Token-based authentication
- **Passport.js**: Authentication middleware
- **class-validator**: Input validation
- **Swagger**: API documentation

## Module Structure

```
src/
├── config/           # Configuration modules
├── modules/          # Feature modules
│   ├── auth/         # Authentication
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── strategies/
│   │   └── guards/
│   ├── users/        # User management
│   │   ├── dto/
│   │   ├── entities/
│   │   └── subscribers/
│   ├── categories/   # Category management
│   │   ├── dto/
│   │   └── entities/
│   └── products/     # Product management (Coming soon)
└── common/           # Shared code
    ├── decorators/
    ├── filters/
    ├── guards/
    ├── interfaces/
    └── pipes/
```

## Database Schema

### Users Table
- UUID primary key
- Authentication fields (email, phone, password)
- Profile information
- Role-based access control
- Social login integration
- Timestamps

### Categories Table
- UUID primary key
- Hierarchical structure (closure table)
- SEO-friendly slugs
- Metadata support
- Elasticsearch integration
- Timestamps

### Products Table (Coming soon)
- UUID primary key
- Rich media support
- Dynamic attributes
- Category relationships
- Search optimization
- Inventory management

## Authentication

The authentication system supports multiple strategies:

### JWT Authentication
```typescript
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SecureController {
  // Protected routes
}
```

### Social Authentication
- Google OAuth2.0
- Facebook OAuth2.0
- Phone number verification (Twilio)

### Role-Based Access Control
```typescript
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
export class AdminController {
  // Admin-only routes
}
```

## Search Engine

Elasticsearch is used for advanced search capabilities:

### Features
- Full-text search
- Fuzzy matching
- Faceted search
- Geolocation support
- Real-time indexing

### Integration
```typescript
@Injectable()
export class SearchService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService
  ) {}

  async search(query: string) {
    return this.elasticsearchService.search({
      index: 'your_index',
      body: {
        query: {
          multi_match: {
            query,
            fields: ['title', 'description'],
            fuzziness: 'AUTO'
          }
        }
      }
    });
  }
}
```

## API Documentation

The API is documented using Swagger/OpenAPI. Access the documentation at:
- Development: http://localhost:3001/api
- Production: https://api.buscadis.com/api

### Authentication Endpoints
- POST /auth/register
- POST /auth/login
- GET /auth/google
- GET /auth/facebook
- POST /auth/phone/verify

### User Endpoints
- GET /users
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id

### Category Endpoints
- GET /categories
- GET /categories/tree
- POST /categories
- PATCH /categories/:id
- DELETE /categories/:id

## Development Guide

### Prerequisites
- Node.js v20+
- PostgreSQL v15+
- Elasticsearch v8+
- Redis (optional)

### Environment Setup
1. Copy environment file:
```bash
cp .env.example .env
```

2. Configure variables:
```env
# Application
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=buscadis

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=1d

# OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

### Development Workflow
1. Start dependencies:
```bash
docker-compose up -d
```

2. Install dependencies:
```bash
npm install
```

3. Run migrations:
```bash
npm run typeorm migration:run
```

4. Start development server:
```bash
npm run start:dev
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Style
The project uses ESLint and Prettier for code formatting:
```bash
# Format code
npm run format

# Lint code
npm run lint
``` 
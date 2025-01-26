# BuscAdis Backend API

Backend service for BuscAdis platform, built with NestJS, Fastify, PostgreSQL, and Elasticsearch.

## Features

- 🔐 Advanced Authentication System
  - JWT-based authentication
  - Social login (Google, Facebook)
  - Phone number verification
  - Role-based access control

- 🔍 Powerful Search Engine
  - Elasticsearch integration
  - Advanced filtering and sorting
  - Real-time search suggestions

- 🎯 High Performance
  - Fastify as HTTP engine
  - Optimized database queries
  - Caching system
  - Rate limiting

## Prerequisites

- Node.js (v20.x)
- PostgreSQL (v15+)
- Elasticsearch (v8.x)
- Redis (optional, for caching)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
4. Configure your environment variables in `.env`

## Development

```bash
# Start in development mode
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build
```

## API Documentation

Once the application is running, visit `/api` for the Swagger documentation.

## Project Structure

```
src/
├── config/           # Configuration modules
├── modules/          # Feature modules
│   ├── auth/         # Authentication
│   ├── users/        # User management
│   ├── search/       # Search functionality
│   └── categories/   # Category management
└── common/           # Shared code
    ├── decorators/
    ├── filters/
    ├── guards/
    ├── interfaces/
    └── pipes/
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

[MIT Licensed](LICENSE) 
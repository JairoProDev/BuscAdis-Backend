# Buscadis Backend

Backend service for the Buscadis marketplace application.

## Description

This is a NestJS-based backend service that provides all the necessary APIs for the Buscadis marketplace, including:

- User authentication and authorization
- Category management
- Publication management
- Advanced search functionality
- Messaging system
- Favorites management
- Report system
- Notification system

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- Elasticsearch (v8 or later)
- Redis (v6 or later)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/buscadis.git
cd buscadis/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration values.

## Database Setup

1. Create a PostgreSQL database:
```bash
createdb buscadis
```

2. Run database migrations:
```bash
npm run migration:run
```

3. (Optional) Seed the database with initial data:
```bash
npm run seed
```

## Elasticsearch Setup

1. Make sure Elasticsearch is running and accessible.

2. Initialize the Elasticsearch index:
```bash
npm run init
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

The application will be available at `http://localhost:3000` by default.

## API Documentation

Once the application is running, you can access the Swagger API documentation at:
```
http://localhost:3000/api/docs
```

## Available Scripts

- `npm run build` - Build the application
- `npm run format` - Format code using Prettier
- `npm run start` - Start the application
- `npm run start:dev` - Start the application in watch mode
- `npm run start:debug` - Start the application in debug mode
- `npm run start:prod` - Start the production build
- `npm run lint` - Lint the code
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:debug` - Run tests in debug mode
- `npm run test:e2e` - Run end-to-end tests
- `npm run migration:create` - Create a new migration
- `npm run migration:generate` - Generate migrations from entity changes
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration
- `npm run seed` - Seed the database with initial data
- `npm run init` - Initialize Elasticsearch index and other setup tasks

## Project Structure

```
src/
├── config/             # Configuration files
├── database/          # Database migrations and seeds
├── modules/           # Feature modules
│   ├── auth/         # Authentication module
│   ├── users/        # User management
│   ├── categories/   # Category management
│   ├── publications/     # Publication management
│   ├── search/       # Search functionality
│   ├── favorites/    # Favorites management
│   ├── messages/     # Messaging system
│   ├── reports/      # Report system
│   └── notifications/# Notification system
├── scripts/          # Utility scripts
├── app.module.ts     # Main application module
└── main.ts          # Application entry point
```

## Features

### Authentication
- JWT-based authentication
- OAuth2 support (Google, Facebook)
- Role-based access control

### User Management
- User registration and profile management
- Email verification
- Password reset

### Category Management
- Hierarchical categories
- Category CRUD operations
- Category metadata

### Publication Management
- Create and manage publications
- Image upload
- Publication status management
- Featured publications

### Search
- Full-text search
- Geolocation-based search
- Advanced filtering
- Faceted search

### Messaging
- Real-time messaging
- Conversation management
- Message notifications

### Favorites
- Save favorite publications
- Manage favorite lists
- Favorite notifications

### Reports
- Report inappropriate publications
- Report management
- Moderation tools

### Notifications
- Real-time notifications
- Email notifications
- Notification preferences

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
# Quiz App Backend

This is the backend service for the Quiz application built with NestJS, providing authentication and quiz management functionalities.

## Features

- User authentication (signup, login)
- JWT-based authorization
- User profile management
- Swagger API documentation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/quiz
```

### Development

```bash
# Start development server
npm run dev

# Build the application
npm run build

# Start production server
npm run start
```

### Database Migrations

We use TypeORM for database migrations. Here's how to work with migrations:

```bash
# Generate a new migration
npm run migration:generate src/migrations/MigrationName

# Create an empty migration file
npm run migration:create src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

Make sure to replace `MigrationName` with a descriptive name for your migration (e.g., CreateUserTable, AddEmailColumn).

## Testing

The application uses Jest as the testing framework. Tests are organized into unit tests and e2e tests.

### Running Tests

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### Writing Unit Tests

We follow these best practices for writing unit tests:

1. **Test File Organization**
   - Test files should be placed next to the file they test
   - Use the `.spec.ts` suffix for test files
   - Example: `auth.service.ts` → `auth.service.spec.ts`

2. **Test Suite Structure**
   ```typescript
   describe('ServiceName', () => {
     describe('methodName', () => {
       it('should do something specific', () => {
         // Test case
       });
     });
   });
   ```

3. **Mocking Dependencies**
   - Use Jest's mock functions for dependencies
   - Create mock implementations for external services
   - Example:
   ```typescript
   const mockUserService = {
     findByEmail: jest.fn(),
     create: jest.fn()
   };
   ```

4. **Test Setup**
   - Use `beforeEach` to reset mocks and create fresh instances
   - Use `afterEach` for cleanup if needed
   - Mock external services and repositories

5. **Testing Async Code**
   - Use async/await for asynchronous tests
   - Test both success and error cases
   - Verify error handling and edge cases

6. **Test Coverage**
   - Aim for high test coverage (80% or higher)
   - Focus on testing business logic and edge cases
   - Use coverage reports to identify untested code

## API Documentation

The API documentation is available through Swagger UI at `/swagger` when the server is running.

### Authentication Endpoints

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Authenticate user and get token
- `GET /auth/me` - Get current user profile (protected)

## Project Structure

```
src/
├── auth/           # Authentication module
├── user/           # User module
├── config/         # Configuration
├── migrations/     # Database migrations
└── main.ts         # Application entry point
```
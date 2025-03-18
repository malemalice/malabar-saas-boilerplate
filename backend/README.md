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

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run test coverage
npm run test:cov
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License.
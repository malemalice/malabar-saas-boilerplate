# Quiz Application

A full-stack quiz application featuring a React frontend and NestJS backend for creating and managing interactive quizzes.

## Project Overview

This project consists of two main components:

### Frontend
- Built with React and TypeScript
- Uses Vite for build tooling
- Styled with Tailwind CSS
- React Router for navigation
- Axios for API requests

### Backend
- NestJS framework
- TypeORM for database operations
- Handlebars for email templating
- Jest for testing
- Swagger for API documentation

## Project Structure
```
├── frontend/     # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React context providers
│   │   ├── pages/      # Application routes
│   │   └── lib/        # Utility functions
│   
└── backend/      # NestJS backend service
    ├── src/
    │   ├── auth/       # Authentication module
    │   ├── user/       # User management
    │   ├── team/       # Team management
    │   └── mail/       # Email services
```

## Getting Started

### Prerequisites
- Node.js
- npm or yarn

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env-example` to `.env` and configure your environment variables
4. Start the development server:
   ```bash
   npm run start:dev
   ```
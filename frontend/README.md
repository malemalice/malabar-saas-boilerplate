# Quiz App Frontend

This is the frontend application for the Quiz platform built with React, Vite, and TypeScript, providing an interactive user interface for quiz management and participation.

## Features

- User authentication
- Interactive quiz interface
- Responsive design
- Theme customization

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── App.tsx         # Main application component
├── contexts/       # React context providers
├── pages/          # Application pages/routes
├── main.tsx        # Application entry point
└── theme.ts        # Theme configuration
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_URL=http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error handling

### State Management

- Use React Context for global state
- Implement proper data fetching strategies
- Handle loading and error states

### Component Structure

- Keep components small and focused
- Use proper component composition
- Implement proper prop typing

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License.
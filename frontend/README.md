# Quiz App Frontend

This is the frontend application for the Quiz platform built with React, Vite, and TypeScript, providing an interactive user interface for quiz management and participation.

## Features

- **Robust User Authentication** with automatic token refresh
- **Advanced Error Handling** for expired/invalid tokens
- **Authentication Debug Tools** with environment controls
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

## Authentication System

### Enhanced Token Management
The application implements a robust authentication system that handles:
- ✅ **Automatic Token Refresh**: Seamless token renewal in background
- ✅ **Invalid Token Handling**: Proper cleanup when both access and refresh tokens are expired
- ✅ **Error Recovery**: No more infinite loading on authentication failures
- ✅ **Cross-tab Synchronization**: Token state synchronized across browser tabs

### Authentication Debug Tools
A comprehensive debug panel is available for troubleshooting authentication flows:

**Features:**
- Real-time token status display
- Authentication state monitoring
- Test buttons for simulating token scenarios
- Environment variable viewer

**Test Scenarios:**
- Test expired access token only
- Test both tokens expired/invalid
- Clear all authentication data

### Environment Controls for Debug Panel

The debug panel visibility can be controlled via environment variables:

| Variable | Values | Priority | Description |
|----------|--------|----------|-------------|
| `VITE_SHOW_AUTH_DEBUG` | `'true'`/`'false'` | Highest | Force show/hide regardless of environment |
| `VITE_DEBUG_MODE` | `'true'` | High | Enable debug mode and features |
| `NODE_ENV` | `'development'` | Medium | Auto-enable in development |
| `VITE_APP_ENV` | `'staging'`/`'testing'` | Low | Environment-specific control |

**Usage Examples:**

```bash
# Development (auto-enabled)
npm run dev

# Staging with debug panel
VITE_APP_ENV=staging npm run build

# Production with debug (troubleshooting)
VITE_SHOW_AUTH_DEBUG=true npm run build

# Disable in development
VITE_SHOW_AUTH_DEBUG=false npm run dev

# Testing environment
VITE_DEBUG_MODE=true npm run build
```

## Project Structure

```
src/
├── App.tsx                    # Main application component
├── features/                  # Feature-based architecture
│   ├── auth/                 # Authentication feature
│   │   ├── api/              # Auth services & types
│   │   ├── hooks/            # Auth React Query hooks
│   │   ├── contexts/         # AuthContext & provider
│   │   ├── components/       # Auth-specific components
│   │   └── pages/            # Auth pages (login, signup, etc.)
│   ├── team/                 # Team management feature
│   ├── billing/              # Billing & plans feature
│   └── user/                 # User profile feature
├── components/               # Shared UI components
│   ├── ui/                   # Shadcn/ui components
│   ├── layout/               # Layout components
│   ├── modals/               # Shared modals
│   └── AuthDebugInfo.tsx     # Authentication debug panel
├── lib/                      # Shared utilities
│   └── axios.ts              # HTTP client with token handling
├── pages/                    # Shared pages
├── main.tsx                  # Application entry point
└── theme.ts                  # Theme configuration
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Debug Controls (optional)
VITE_SHOW_AUTH_DEBUG=true    # Force show debug panel
VITE_DEBUG_MODE=true         # Enable debug features
VITE_APP_ENV=staging         # Environment designation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Authentication Troubleshooting

### Common Issues & Solutions

**Infinite Loading on Login:**
- ✅ **Fixed**: Invalid tokens are now detected and cleared immediately
- **Test**: Use debug panel "Test Both Tokens Expired" button

**Token Refresh Failures:**
- ✅ **Enhanced**: Automatic fallback and cleanup when refresh tokens are invalid
- **Debug**: Check console logs for token refresh attempts

**Cross-tab Authentication:**
- ✅ **Improved**: Storage events properly synchronize auth state
- **Test**: Login/logout in one tab, observe changes in another

### Debug Panel Usage

1. **Enable Debug Panel**: Set appropriate environment variables
2. **Monitor State**: Watch real-time authentication status
3. **Test Scenarios**: Use test buttons to simulate edge cases
4. **Check Environment**: View current environment variables
5. **Verify Fixes**: Confirm no infinite loading occurs

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error handling

### Authentication Patterns

- Use `useAuth()` hook for authentication state
- Import from feature exports: `import { useAuth } from '@/features/auth'`
- Handle loading states properly in components
- Use React Query for API state management

### State Management

- Use React Context for global state
- Implement feature-based architecture
- Use React Query for server state
- Handle loading and error states consistently

### Component Structure

- Keep components small and focused
- Use proper component composition
- Implement proper prop typing
- Co-locate feature-specific components

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License.
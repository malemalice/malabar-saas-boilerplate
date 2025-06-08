import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';

/**
 * AuthDebugInfo Component - Authentication Debug Panel
 * 
 * This component provides debugging tools for authentication flows and can be controlled
 * via environment variables for different deployment environments.
 * 
 * ENVIRONMENT VARIABLES (in order of priority):
 * 
 * 1. VITE_SHOW_AUTH_DEBUG (highest priority)
 *    - 'true': Force show debug panel regardless of environment
 *    - 'false': Force hide debug panel even in development
 *    - Example: VITE_SHOW_AUTH_DEBUG=true
 * 
 * 2. VITE_DEBUG_MODE
 *    - 'true': Enable debug panel and other debug features
 *    - Example: VITE_DEBUG_MODE=true
 * 
 * 3. Development Environment (default behavior)
 *    - Automatically enabled when NODE_ENV=development or DEV=true
 * 
 * 4. VITE_APP_ENV
 *    - 'staging': Enable debug panel in staging environment
 *    - 'testing': Enable debug panel in testing environment
 *    - Example: VITE_APP_ENV=staging
 * 
 * USAGE EXAMPLES:
 * 
 * Development (auto-enabled):
 *   No additional env vars needed
 * 
 * Staging with debug:
 *   VITE_APP_ENV=staging
 * 
 * Production with debug (for troubleshooting):
 *   VITE_SHOW_AUTH_DEBUG=true
 * 
 * Disable in development:
 *   VITE_SHOW_AUTH_DEBUG=false
 * 
 * Testing environment:
 *   VITE_APP_ENV=testing
 *   # or
 *   VITE_DEBUG_MODE=true
 */

// Type-safe environment variable access
const getEnvVar = (key: string): string | undefined => {
  return (import.meta as any).env[key];
};

const AuthDebugInfo = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');
  const hasRefreshToken = !!localStorage.getItem('refreshToken');

  // Check multiple environment conditions for showing debug info
  const shouldShowDebug = () => {
    // Option 1: Explicit debug flag (highest priority)
    if (getEnvVar('VITE_SHOW_AUTH_DEBUG') === 'true') {
      return true;
    }
    
    // Option 2: Explicit disable flag (overrides development mode)
    if (getEnvVar('VITE_SHOW_AUTH_DEBUG') === 'false') {
      return false;
    }
    
    // Option 3: General debug mode flag
    if (getEnvVar('VITE_DEBUG_MODE') === 'true') {
      return true;
    }
    
    // Option 4: Development environment (default behavior)
    if (getEnvVar('DEV') === 'true' || process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Option 5: Staging/testing environments
    const appEnv = getEnvVar('VITE_APP_ENV');
    if (appEnv === 'staging' || appEnv === 'testing') {
      return true;
    }
    
    return false;
  };

  if (!shouldShowDebug()) {
    return null;
  }

  const simulateExpiredToken = () => {
    // Set an obviously expired/invalid token to test the flow
    localStorage.setItem('accessToken', 'expired.invalid.token');
    localStorage.removeItem('refreshToken');
    
    // Trigger storage event to notify components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      oldValue: localStorage.getItem('accessToken'),
      newValue: 'expired.invalid.token',
      storageArea: localStorage
    }));
    
    // Force page reload to simulate the scenario
    window.location.reload();
  };

  const simulateExpiredBothTokens = () => {
    // Set both invalid tokens to test the refresh failure scenario
    localStorage.setItem('accessToken', 'expired.invalid.access.token');
    localStorage.setItem('refreshToken', 'expired.invalid.refresh.token');
    
    // Trigger storage events to notify components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      oldValue: localStorage.getItem('accessToken'),
      newValue: 'expired.invalid.access.token',
      storageArea: localStorage
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'refreshToken',
      oldValue: localStorage.getItem('refreshToken'),
      newValue: 'expired.invalid.refresh.token',
      storageArea: localStorage
    }));
    
    // Force page reload to simulate the scenario
    window.location.reload();
  };

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      oldValue: localStorage.getItem('accessToken'),
      newValue: null,
      storageArea: localStorage
    }));
    
    window.location.reload();
  };

  const currentEnv = getEnvVar('VITE_APP_ENV') || 
                    (getEnvVar('DEV') === 'true' ? 'development' : 'production') ||
                    process.env.NODE_ENV || 
                    'unknown';

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs font-mono opacity-90 z-50 max-w-xs">
      <h4 className="font-bold mb-2 text-yellow-400">Auth Debug Info</h4>
      <div className="text-xs text-gray-300 mb-2">
        Env: {currentEnv}
      </div>
      <div className="space-y-1">
        <div>Access Token: {hasToken ? '✅' : '❌'}</div>
        <div>Refresh Token: {hasRefreshToken ? '✅' : '❌'}</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
        <div>User: {user?.email || 'None'}</div>
      </div>
      
      <details className="mt-2">
        <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
          Environment Variables
        </summary>
        <div className="mt-1 text-xs text-gray-400 space-y-1">
          <div>SHOW_AUTH_DEBUG: {getEnvVar('VITE_SHOW_AUTH_DEBUG') || 'unset'}</div>
          <div>DEBUG_MODE: {getEnvVar('VITE_DEBUG_MODE') || 'unset'}</div>
          <div>APP_ENV: {getEnvVar('VITE_APP_ENV') || 'unset'}</div>
          <div>DEV: {getEnvVar('DEV') || 'unset'}</div>
          <div>NODE_ENV: {process.env.NODE_ENV || 'unset'}</div>
        </div>
      </details>
      
      <div className="mt-3 space-y-1">
        <Button 
          size="sm" 
          variant="destructive" 
          className="w-full text-xs"
          onClick={simulateExpiredToken}
        >
          Test Expired Access Token
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          className="w-full text-xs bg-red-700"
          onClick={simulateExpiredBothTokens}
        >
          Test Both Tokens Expired
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs text-black"
          onClick={clearTokens}
        >
          Clear All Tokens
        </Button>
      </div>
    </div>
  );
};

export default AuthDebugInfo; 
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check if there's a token in localStorage for debugging
  const hasToken = !!localStorage.getItem('accessToken');

  // Debug info for development
  if (process.env.NODE_ENV === 'development') {
    console.log('PublicRoute state:', {
      hasToken,
      isAuthenticated,
      isLoading,
    });
  }

  // Show loading only if we're actually authenticating (not for expired tokens)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show the public route content (login, signup, etc.)
  return <>{children}</>;
};

export default PublicRoute;
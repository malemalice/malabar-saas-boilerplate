import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging
  console.log('PublicRoute state:', { isAuthenticated, isLoading, user });

  if (isLoading) {
    console.log('PublicRoute: Showing loading spinner');
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isAuthenticated) {
    console.log('PublicRoute: Redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('PublicRoute: Showing public content');
  return <>{children}</>;
};

export default PublicRoute;
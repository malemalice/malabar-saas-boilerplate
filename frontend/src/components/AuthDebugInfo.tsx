import { useAuth } from '@/features/auth';

const AuthDebugInfo = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs font-mono opacity-80 z-50">
      <div>Token: {hasToken ? '✅' : '❌'}</div>
      <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
      <div>Loading: {isLoading ? '⏳' : '✅'}</div>
      <div>User: {user?.email || 'None'}</div>
    </div>
  );
};

export default AuthDebugInfo; 
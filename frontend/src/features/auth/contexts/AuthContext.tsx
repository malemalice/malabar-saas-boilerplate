import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useCurrentUser, useLogout, type User } from '@/features/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: user, isLoading, error } = useCurrentUser();
  const logout = useLogout();
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('accessToken'));
  const [hasRefreshToken, setHasRefreshToken] = useState(!!localStorage.getItem('refreshToken'));

  // Listen for token changes to update authentication state
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessToken') {
        setHasToken(!!event.newValue);
      }
      if (event.key === 'refreshToken') {
        setHasRefreshToken(!!event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check initial token states
    setHasToken(!!localStorage.getItem('accessToken'));
    setHasRefreshToken(!!localStorage.getItem('refreshToken'));

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Determine authentication state
  // If there's no access token, definitely not authenticated
  // If there's an error (like 401), not authenticated unless we're refreshing
  // If there's an access token and user data, authenticated
  const isAuthenticated = hasToken && !!user && !error;
  
  // Only show loading if:
  // 1. We have an access token AND we're loading AND no error, OR
  // 2. We have a refresh token but no access token (refresh in progress)
  const actuallyLoading = (hasToken && isLoading && !error) || 
                          (!hasToken && hasRefreshToken && isLoading);

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated,
    isLoading: actuallyLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
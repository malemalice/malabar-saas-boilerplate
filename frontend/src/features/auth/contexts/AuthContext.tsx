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

  // Listen for token changes to update authentication state
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessToken') {
        setHasToken(!!event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check initial token state
    setHasToken(!!localStorage.getItem('accessToken'));

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // If there's no token, user is definitely not authenticated
  const isAuthenticated = hasToken && !!user && !error;

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated,
    isLoading: hasToken ? isLoading : false, // Only show loading if we have a token
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
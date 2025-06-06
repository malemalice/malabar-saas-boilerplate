import { createContext, useContext, ReactNode } from 'react';
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

  // Debug logging
  console.log('AuthProvider state:', { user, isLoading, error, hasToken: !!localStorage.getItem('accessToken') });

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
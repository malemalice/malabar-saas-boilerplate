import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resendVerification: () => Promise<{ message: string; nextResendTime: Date }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      setUser(data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    await fetchUser();
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data } = await axios.post('/api/auth/signup', { email, password, name });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const { data: updatedUser } = await axios.patch('/api/auth/profile', data);
    setUser(updatedUser);
  };

  const [lastVerificationTime, setLastVerificationTime] = useState<Date | null>(null);

  const resendVerification = async () => {
    const now = new Date();
    if (lastVerificationTime) {
      const timeDiff = (now.getTime() - lastVerificationTime.getTime()) / 1000;
      if (timeDiff < 300) { // 5 minutes in seconds
        const nextResendTime = new Date(lastVerificationTime.getTime() + 300000);
        const error = new Error('Please wait before requesting another verification email');
        Object.assign(error, {
          response: {
            data: {
              message: 'Please wait before requesting another verification email',
              nextResendTime
            }
          }
        });
        throw error;
      }
    }

    const { data } = await axios.post('/api/auth/resend-verification', {
      email: user?.email
    });
    setLastVerificationTime(now);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
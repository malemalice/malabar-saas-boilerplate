import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import authService from '../api/auth.service';
import type { User, LoginRequest, SignupRequest } from '../api/auth.service';

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// Get current user
export const useCurrentUser = () => {
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('accessToken'));
  
  useEffect(() => {
    // Update hasToken state when localStorage changes
    const checkToken = () => {
      setHasToken(!!localStorage.getItem('accessToken'));
    };
    
    // Listen for storage events (from other tabs)
    window.addEventListener('storage', checkToken);
    
    // Check token on mount
    checkToken();
    
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, []);
  
  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: hasToken, // Only fetch if we have a token
  });
  
  // When no token, return immediately with no loading state
  if (!hasToken) {
    return {
      data: undefined,
      isLoading: false,
      error: null,
    };
  }
  
  return query;
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Update query cache
      queryClient.setQueryData(authKeys.me(), data.user);
      
      // Navigate to dashboard
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

// Signup mutation
export const useSignup = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (userData: SignupRequest) => authService.signup(userData),
    onSuccess: (data) => {
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Update query cache
      queryClient.setQueryData(authKeys.me(), data.user);
      
      // Navigate to verification pending if not verified
      if (!data.user.isVerified) {
        navigate('/verify-pending');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      console.error('Signup failed:', error);
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update query cache
      queryClient.setQueryData(authKeys.me(), updatedUser);
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
};

// Logout function
export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    // Get old token value before clearing
    const oldToken = localStorage.getItem('accessToken');
    
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('activeTeamId');
    localStorage.removeItem('activeTeamName');
    localStorage.removeItem('activeTeamRole');
    
    // Trigger storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      oldValue: oldToken,
      newValue: null,
      storageArea: localStorage
    }));
    
    // First set the user query data to null to immediately update auth state
    queryClient.setQueryData(authKeys.me(), null);
    
    // Clear the entire query cache
    queryClient.clear();
    
    // Force redirect to login page (this ensures we bypass any React Router state issues)
    window.location.href = '/login';
  };
};

// Resend verification mutation
export const useResendVerification = () => {
  return useMutation({
    mutationFn: (email: string) => authService.resendVerification({ email }),
    onError: (error) => {
      console.error('Resend verification failed:', error);
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword({ email }),
    onError: (error) => {
      console.error('Forgot password failed:', error);
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => 
      authService.resetPassword({ token, password }),
    onSuccess: () => {
      navigate('/login');
    },
    onError: (error) => {
      console.error('Reset password failed:', error);
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => 
      authService.changePassword({ currentPassword, newPassword }),
    onError: (error) => {
      console.error('Change password failed:', error);
    },
  });
}; 
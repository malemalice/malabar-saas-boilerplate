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
  const [hasRefreshToken, setHasRefreshToken] = useState(!!localStorage.getItem('refreshToken'));
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Update token states when localStorage changes
    const checkTokens = () => {
      const accessTokenExists = !!localStorage.getItem('accessToken');
      const refreshTokenExists = !!localStorage.getItem('refreshToken');
      
      setHasToken(accessTokenExists);
      setHasRefreshToken(refreshTokenExists);
      
      // If both tokens were removed, immediately clear user data from cache
      if (!accessTokenExists && !refreshTokenExists) {
        queryClient.setQueryData(authKeys.me(), null);
        queryClient.removeQueries({ queryKey: authKeys.me() });
      }
    };
    
    // Listen for storage events (from other tabs and manual dispatches)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessToken' || event.key === 'refreshToken') {
        checkTokens();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check tokens on mount
    checkTokens();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);
  
  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: authService.getCurrentUser,
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors - these indicate invalid/expired tokens
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      if (error?.statusCode === 401 || error?.statusCode === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: hasToken, // Only fetch if we have an access token
  });

  // Handle authentication errors - this runs on every render when there's an error
  useEffect(() => {
    if (query.error && hasToken) {
      const error = query.error as any;
      
      // Handle authentication errors
      if (error?.response?.status === 401 || error?.statusCode === 401) {
        console.log('User authentication failed - access token invalid');
        
        // If we have a refresh token, the axios interceptor will handle the refresh
        // If the refresh also fails, it will clear both tokens
        if (!hasRefreshToken) {
          console.log('No refresh token available, clearing auth state');
          
          // Clear tokens immediately if no refresh token
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setHasToken(false);
          setHasRefreshToken(false);
          
          // Clear query cache
          queryClient.setQueryData(authKeys.me(), null);
          queryClient.removeQueries({ queryKey: authKeys.me() });
          
          // Trigger storage event to notify other components
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'accessToken',
            oldValue: localStorage.getItem('accessToken'),
            newValue: null,
            storageArea: localStorage
          }));
        }
        // If we have a refresh token, let the axios interceptor handle it
        // It will either succeed and retry, or fail and clear both tokens
      }
    }
  }, [query.error, hasToken, hasRefreshToken, queryClient]);
  
  // When no access token, return immediately with no loading state
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
      
      // Update query cache with user data
      queryClient.setQueryData(authKeys.me(), data.user);
      
      // Trigger storage event to notify useCurrentUser hook
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'accessToken',
        oldValue: null,
        newValue: data.accessToken,
        storageArea: localStorage
      }));
      
      // Force invalidate the query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
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
      
      // Trigger storage event to notify useCurrentUser hook
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'accessToken',
        oldValue: null,
        newValue: data.accessToken,
        storageArea: localStorage
      }));
      
      // Update query cache
      queryClient.setQueryData(authKeys.me(), data.user);
      
      // Force invalidate the query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      
      // Navigate to verification pending if not verified
      if (!data.user.isVerified) {
        navigate('/verify-pending', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
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
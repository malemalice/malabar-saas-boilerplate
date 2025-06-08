import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
});

// Queue to store pending requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Centralized function to handle auth cleanup
const clearAuthState = (reason = 'Authentication failed') => {
  console.log(`Clearing auth state: ${reason}`);
  
  // Get old token value for storage event
  const oldToken = localStorage.getItem('accessToken');
  
  // Clear all auth-related data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('activeTeamId');
  localStorage.removeItem('activeTeamName');
  localStorage.removeItem('activeTeamRole');
  
  // Clear axios headers
  delete axiosInstance.defaults.headers.common['Authorization'];
  
  // Trigger storage event to notify all components immediately
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'accessToken',
    oldValue: oldToken,
    newValue: null,
    storageArea: localStorage
  }));
  
  // Also trigger refresh token storage event to ensure all hooks are notified
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'refreshToken',
    oldValue: localStorage.getItem('refreshToken'),
    newValue: null,
    storageArea: localStorage
  }));
};

// Handle token changes across tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'accessToken') {
    if (!event.newValue) {
      // Token was removed, clear headers and redirect to login
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // Only redirect if we're not already on a public route
      const currentPath = window.location.pathname;
      const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/verify-pending'];
      
      if (!publicRoutes.includes(currentPath)) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else {
      // Update axios headers with new token
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${event.newValue}`;
    }
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loops
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.log('Refresh token is invalid, clearing auth state');
        clearAuthState('Refresh token expired/invalid');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If token refresh is in progress, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('Attempting to refresh access token...');
        
        // Attempt to refresh the token
        const { data } = await axiosInstance.post('/auth/refresh', {
          refreshToken,
        });

        console.log('Token refresh successful');
        
        // Update tokens
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        // Update axios headers
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Trigger storage events to notify all components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'accessToken',
          oldValue: localStorage.getItem('accessToken'),
          newValue: data.accessToken,
          storageArea: localStorage
        }));

        // Process queued requests
        processQueue();
        
        // Retry the original request
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        
        // Process queued requests with error
        processQueue(refreshError);
        
        // Clear auth state - both tokens are invalid
        clearAuthState('Both access and refresh tokens are invalid');
        
        // Small delay to allow React state updates, then redirect
        setTimeout(() => {
          const currentPath = window.location.pathname;
          const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/verify-pending'];
          
          if (!publicRoutes.includes(currentPath)) {
            window.location.href = '/login';
          }
        }, 100);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
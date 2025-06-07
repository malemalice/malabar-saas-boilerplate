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

// Handle token changes across tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'accessToken') {
    if (!event.newValue) {
      // Token was removed, redirect to login
      window.location.href = '/login';
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

    if (error.response?.status === 401 && !originalRequest._retry) {
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

        const { data } = await axiosInstance.post('/auth/refresh', {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Trigger storage event to notify all components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'accessToken',
          oldValue: localStorage.getItem('accessToken'),
          newValue: data.accessToken,
          storageArea: localStorage
        }));

        processQueue();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        
        // Clear all auth-related data
        const oldToken = localStorage.getItem('accessToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('activeTeamId');
        localStorage.removeItem('activeTeamName');
        localStorage.removeItem('activeTeamRole');
        
        // Trigger storage event to notify all components immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'accessToken',
          oldValue: oldToken,
          newValue: null,
          storageArea: localStorage
        }));
        
        // Small delay to allow React state updates, then redirect
        setTimeout(() => {
          window.location.href = '/login';
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
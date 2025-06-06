import apiClient from '@/lib/api-client';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

// Auth Service
const BASE_URL = '/auth';

const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`${BASE_URL}/login`, credentials);
  },

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`${BASE_URL}/signup`, userData);
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(`${BASE_URL}/me`);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>(`${BASE_URL}/profile`, data);
  },

  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`${BASE_URL}/refresh`, request);
  },

  async forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${BASE_URL}/forgot-password`, request);
  },

  async resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${BASE_URL}/reset-password`, request);
  },

  async changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${BASE_URL}/change-password`, request);
  },

  async verifyEmail(request: VerifyEmailRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${BASE_URL}/verify-email`, request);
  },

  async resendVerification(request: ResendVerificationRequest): Promise<{ message: string; nextResendTime: Date }> {
    return apiClient.post<{ message: string; nextResendTime: Date }>(`${BASE_URL}/resend-verification`, request);
  },
};

export default authService; 
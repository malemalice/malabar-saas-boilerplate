import axios from '@/lib/axios';

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
    const response = await axios.post(`${BASE_URL}/login`, credentials);
    return response.data;
  },

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await axios.post(`${BASE_URL}/signup`, userData);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await axios.get(`${BASE_URL}/me`);
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await axios.patch(`${BASE_URL}/profile`, data);
    return response.data;
  },

  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await axios.post(`${BASE_URL}/refresh`, request);
    return response.data;
  },

  async forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await axios.post(`${BASE_URL}/forgot-password`, request);
    return response.data;
  },

  async resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await axios.post(`${BASE_URL}/reset-password`, request);
    return response.data;
  },

  async changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await axios.post(`${BASE_URL}/change-password`, request);
    return response.data;
  },

  async verifyEmail(request: VerifyEmailRequest): Promise<{ message: string }> {
    const response = await axios.post(`${BASE_URL}/verify-email`, request);
    return response.data;
  },

  async resendVerification(request: ResendVerificationRequest): Promise<{ message: string; nextResendTime: Date }> {
    const response = await axios.post(`${BASE_URL}/resend-verification`, request);
    return response.data;
  },
};

export default authService; 
// Auth Feature Exports
export { default as authService } from './api/auth.service';

// Auth Types
export type {
  User,
  LoginRequest,
  SignupRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from './api/auth.service';

// Auth Hooks
export {
  useCurrentUser,
  useLogin,
  useSignup,
  useUpdateProfile,
  useLogout,
  useResendVerification,
  useForgotPassword,
  useResetPassword,
  useChangePassword,
  authKeys,
} from './hooks/useAuth';

// Auth Context
export { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth Components
export { default as PublicRoute } from './components/PublicRoute';

// Auth Pages
export { default as LoginPage } from './pages/Login';
export { default as SignUpPage } from './pages/SignUp';
export { default as ForgotPasswordPage } from './pages/ForgotPassword';
export { default as ResetPasswordPage } from './pages/ResetPassword';
export { default as VerifyEmailPage } from './pages/VerifyEmail';
export { default as VerifyPendingPage } from './pages/VerifyPending'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';

import ErrorBoundary from './components/ErrorBoundary';
import QueryErrorBoundary from './components/QueryErrorBoundary';
import { AuthProvider, useAuth, PublicRoute } from '@/features/auth';
import { TeamProvider } from '@/features/team';
import RootLayout from './components/layout/root-layout';

// Lazy load pages for code splitting
const Login = lazy(() => import('./features/auth/pages/Login'));
const SignUp = lazy(() => import('./features/auth/pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./features/user/pages/Profile'));
const Team = lazy(() => import('./features/team/pages/Team'));
const VerifyEmail = lazy(() => import('./features/auth/pages/VerifyEmail'));
const VerifyPending = lazy(() => import('./features/auth/pages/VerifyPending'));
const ForgotPassword = lazy(() => import('./features/auth/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./features/auth/pages/ResetPassword'));
const Billing = lazy(() => import('./features/billing/pages/Billing'));
const Plans = lazy(() => import('./features/billing/pages/Plans'));
const PaymentSummary = lazy(() => import('./features/billing/pages/PaymentSummary'));
const PaymentSuccess = lazy(() => import('./features/billing/pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./features/billing/pages/PaymentFailed'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnReconnect: true, // Refetch on network reconnect
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <TeamProvider>
      <QueryErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </QueryErrorBoundary>
    </TeamProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
          <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Login />
                    </Suspense>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <SignUp />
                    </Suspense>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <ForgotPassword />
                    </Suspense>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/reset-password" 
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <ResetPassword />
                    </Suspense>
                  </PublicRoute>
                } 
              />
              <Route path="/verify-email" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <VerifyEmail />
                </Suspense>
              } />
              <Route path="/verify-pending" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <VerifyPending />
                </Suspense>
              } />

              {/* Private Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <RootLayout>
                    <Dashboard />
                  </RootLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <RootLayout>
                    <Profile />
                  </RootLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/team"
              element={
                <PrivateRoute>
                  <RootLayout>
                    <Team />
                  </RootLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <PrivateRoute>
                  <RootLayout>
                    <Billing />
                  </RootLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <PrivateRoute>
                  <RootLayout>
                    <Plans />
                  </RootLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/payment-summary"
              element={
                <PrivateRoute>
                  <RootLayout>
                    <PaymentSummary />
                  </RootLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/billing/success"
              element={
                <PrivateRoute>
                  <RootLayout>
                  <PaymentSuccess />
                  </RootLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/billing/failed"
              element={
                <PrivateRoute>
                  <RootLayout>
                  <PaymentFailed />
                  </RootLayout>
                </PrivateRoute>
              }
            />
              
              {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
          </AuthProvider>
        </Router>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
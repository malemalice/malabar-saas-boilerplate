import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, resendVerification } = useAuth();
  const [showVerificationAlert, setShowVerificationAlert] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string; nextResendTime?: Date } | null>(null);
  const [timeUntilResend, setTimeUntilResend] = useState<number | null>(null);

  useEffect(() => {
    if (resendStatus?.nextResendTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const target = new Date(resendStatus.nextResendTime!).getTime();
        const diff = Math.max(0, Math.ceil((target - now) / 1000));
        
        if (diff === 0) {
          setTimeUntilResend(null);
          setResendStatus(null);
          clearInterval(interval);
        } else {
          setTimeUntilResend(diff);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [resendStatus?.nextResendTime]);

  return (
    <div className="container mx-auto px-4 py-8">
      {user && !user.isVerified && showVerificationAlert && (
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-500 dark:border-yellow-900/20">
          <AlertCircle className="h-5 w-5" />
          <div className="flex-1">
            Please verify your email address to access all features. Check your inbox for the verification link.
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    setIsResending(true);
                    setResendStatus(null);
                    const { message, nextResendTime } = await resendVerification();
                    setResendStatus({
                      type: 'success',
                      message,
                      nextResendTime
                    });
                  } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
                    const nextResendTime = error.response?.data?.nextResendTime;
                    setResendStatus({
                      type: 'error',
                      message: errorMessage,
                      ...(nextResendTime && { nextResendTime })
                    });
                  } finally {
                    setIsResending(false);
                  }
                }}
                disabled={isResending || timeUntilResend !== null}
                className="text-yellow-800 hover:text-yellow-900 dark:text-yellow-500 dark:hover:text-yellow-400 underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : timeUntilResend ? `Wait ${timeUntilResend}s to resend` : 'Resend verification email'}
              </button>
              {resendStatus && (
                <span className={`text-sm ${resendStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {resendStatus.message}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowVerificationAlert(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span className="sr-only">Dismiss</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Quick Stats</h3>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Quizzes</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-medium">0</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Create New Quiz
            </button>
            <button className="w-full rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90">
              Browse Quizzes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
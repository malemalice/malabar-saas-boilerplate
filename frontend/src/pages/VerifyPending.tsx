import { useLocation, Link as RouterLink } from 'react-router-dom';

const VerifyPending = () => {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="container mx-auto max-w-md px-6 py-8">
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Check Your Email</h1>
        
        <div className="w-full rounded-md bg-blue-100 p-3 text-sm text-blue-600">
          <p>We've sent a verification link to <strong>{email}</strong>.</p>
          <p className="mt-2">Please check your email and click the verification link to complete your registration.</p>
        </div>

        <div className="text-center text-sm">
          <RouterLink to="/login" className="text-primary hover:underline">
            Back to Login
          </RouterLink>
        </div>
      </div>
    </div>
  );
};

export default VerifyPending;
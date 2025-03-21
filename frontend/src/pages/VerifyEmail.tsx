import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await axios.post('/api/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="container mx-auto max-w-md px-6 py-8">
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Email Verification</h1>
        
        {status === 'verifying' && (
          <div className="w-full rounded-md bg-blue-100 p-3 text-sm text-blue-600">
            Verifying your email address...
          </div>
        )}

        {status === 'success' && (
          <div className="w-full rounded-md bg-green-100 p-3 text-sm text-green-600">
            {message}
            <div className="mt-2">
              Redirecting to login page...
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="w-full rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
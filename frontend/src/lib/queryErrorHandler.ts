import { toast } from '@/components/ui/use-toast';

export const handleQueryError = (error: any) => {
  if (error?.response?.status === 401) {
    // Authentication error - let axios interceptor handle the redirect
    console.log('Authentication error detected');
    return;
  }
  
  if (error?.response?.status === 403) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to perform this action',
      variant: 'destructive',
    });
    return;
  }
  
  if (error?.response?.status >= 500) {
    toast({
      title: 'Server Error',
      description: 'Server error. Please try again later.',
      variant: 'destructive',
    });
    return;
  }
  
  // Default error message
  const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
};

export default handleQueryError; 
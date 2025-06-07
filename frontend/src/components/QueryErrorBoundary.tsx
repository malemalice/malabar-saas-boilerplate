import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ErrorBoundary from './ErrorBoundary';

interface QueryErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const QueryErrorFallback: React.FC<QueryErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-orange-600">Unable to Load Data</CardTitle>
          <CardDescription>
            There was a problem loading the requested data. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <details className="text-sm text-orange-800">
                <summary className="cursor-pointer font-medium">
                  Error Details (Development)
                </summary>
                <div className="mt-2 font-mono text-xs">
                  {error.message}
                </div>
              </details>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button onClick={resetErrorBoundary} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<QueryErrorFallbackProps>;
}

const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({ 
  children, 
  fallback: CustomFallback = QueryErrorFallback 
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={
            <CustomFallback 
              error={new Error('Query error')} 
              resetErrorBoundary={reset} 
            />
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

export default QueryErrorBoundary;
export { QueryErrorFallback }; 
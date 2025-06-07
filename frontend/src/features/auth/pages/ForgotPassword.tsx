import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import axios from '@/lib/axios';

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setError('');
      setSuccess('');
      await axios.post('/auth/forgot-password', { email: data.email });
      setSuccess('Password reset instructions have been sent to your email');
    } catch (err: any) {
      const response = err.response?.data;
      if (response?.error === 'RATE_LIMIT_EXCEEDED' && response?.nextAllowedAttempt) {
        const nextAttempt = new Date(response.nextAllowedAttempt);
        const waitMinutes = Math.ceil((nextAttempt.getTime() - Date.now()) / (1000 * 60));
        setError(`Too many reset attempts. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.`);
      } else {
        setError(response?.message || 'Failed to process request');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-md px-6 py-8">
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
        
        {error && (
          <div className="w-full rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="w-full rounded-md bg-green-100 p-3 text-sm text-green-600">
            {success}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
            </Button>

            <div className="text-center text-sm">
              <RouterLink to="/login" className="text-primary hover:underline">
                Back to Sign In
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPassword;
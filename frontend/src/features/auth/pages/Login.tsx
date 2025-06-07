import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useLogin } from '@/features/auth';
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

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof formSchema>;

const Login = () => {
  const loginMutation = useLogin();
  const [error, setError] = useState('');
  const form = useForm<LoginForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginForm) => {
    setError('');
    loginMutation.mutate(data, {
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Failed to login');
      }
    });
  };

  return (
    <div className="container mx-auto max-w-md px-6 py-8">
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        
        {error && (
          <div className="w-full rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your password"
                      type="password"
                      autoComplete="current-password"
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
              disabled={loginMutation.isLoading}
            >
              {loginMutation.isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm space-y-2">
              <RouterLink to="/signup" className="text-primary hover:underline block">
                Don't have an account? Sign Up
              </RouterLink>
              <RouterLink to="/forgot-password" className="text-primary hover:underline block">
                Forgot your password?
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Login;
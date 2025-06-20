import { useState, useEffect } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import axios from '@/lib/axios';
import { useForm } from 'react-hook-form';
import { useSignup } from '@/features/auth';
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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof formSchema>;

const SignUp = () => {
  const signupMutation = useSignup();
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [_isLoading, setIsLoading] = useState(false);
  const token = searchParams.get('token');
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const { data } = await axios.get(`/teams/invitations/${token}`);
        form.setValue('email', data.email);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or expired invitation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  const form = useForm<SignUpForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: SignUpForm) => {
    setError('');
    signupMutation.mutate({
      email: data.email,
      password: data.password,
      name: data.name
    }, {
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Failed to create account');
      }
    });
  };

  return (
    <div className="container mx-auto max-w-md px-6 py-8">
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
        
        {error && (
          <div className="w-full rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      type="text"
                      autoComplete="name"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      autoComplete="email"
                      disabled={!!token}
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
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Confirm your password"
                      type="password"
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
              disabled={signupMutation.isLoading}
            >
              {signupMutation.isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <div className="text-center text-sm">
              <RouterLink to="/login" className="text-primary hover:underline">
                Already have an account? Sign in
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SignUp;
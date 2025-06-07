import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import billingService from '../api/billing.service';
import type { CreateSubscriptionRequest } from '../api/billing.service';

// Query Keys
export const billingKeys = {
  all: ['billing'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
  plan: (id: number) => [...billingKeys.all, 'plans', id] as const,
  subscription: (teamId: string) => [...billingKeys.all, 'subscription', teamId] as const,
  activePlan: (teamId: string) => [...billingKeys.all, 'active-plan', teamId] as const,
  invoices: (teamId: string, page: number) => [...billingKeys.all, 'invoices', teamId, page] as const,
};

// Get all plans
export const usePlans = () => {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: billingService.getPlans,
    staleTime: 10 * 60 * 1000, // 10 minutes - plans don't change often
  });
};

// Get plan by ID
export const usePlanById = (planId: number) => {
  return useQuery({
    queryKey: billingKeys.plan(planId),
    queryFn: () => billingService.getPlanById(planId),
    enabled: !!planId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get team subscription
export const useTeamSubscription = (teamId: string) => {
  return useQuery({
    queryKey: billingKeys.subscription(teamId),
    queryFn: () => billingService.getTeamSubscription(teamId),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get active plan for team
export const useActivePlan = (teamId: string) => {
  return useQuery({
    queryKey: billingKeys.activePlan(teamId),
    queryFn: () => billingService.getActivePlan(teamId),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get team invoices with pagination
export const useTeamInvoices = (teamId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: billingKeys.invoices(teamId, page),
    queryFn: () => billingService.getTeamInvoices(teamId, page, limit),
    enabled: !!teamId,
    staleTime: 1 * 60 * 1000, // 1 minute
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

// Create subscription mutation
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionRequest) => billingService.createSubscription(data),
    onSuccess: (_, variables) => {
      // Invalidate subscription and plan data for the team
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.activePlan(variables.teamId) });
    },
    onError: (error) => {
      console.error('Create subscription failed:', error);
    },
  });
};

// Cancel subscription mutation
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) => billingService.cancelSubscription(subscriptionId),
    onSuccess: () => {
      // Invalidate all billing data
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
    onError: (error) => {
      console.error('Cancel subscription failed:', error);
    },
  });
};

// Update subscription mutation
export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, planId }: { subscriptionId: string; planId: number }) => 
      billingService.updateSubscription(subscriptionId, planId),
    onSuccess: () => {
      // Invalidate all billing data
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
    onError: (error) => {
      console.error('Update subscription failed:', error);
    },
  });
};

// Repay invoice mutation
export const useRepayInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, paymentMethodId }: { invoiceId: string; paymentMethodId?: string }) => 
      billingService.repayInvoice(invoiceId, { paymentMethodId }),
    onSuccess: () => {
      // Invalidate invoice queries
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
    onError: (error) => {
      console.error('Repay invoice failed:', error);
    },
  });
}; 
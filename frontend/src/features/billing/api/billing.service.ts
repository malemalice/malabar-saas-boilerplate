import apiClient from '@/lib/api-client';

// Types
export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features?: Array<{
    label: string;
    metric: string;
    value: number;
  }>;
  stripePriceId: string;
  stripeProductId: string;
}

export interface Subscription {
  id: string;
  teamId: string;
  planId: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  plan: Plan;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'draft' | 'uncollectible' | 'void';
  invoiceDate: Date;
  dueDate: Date;
  paidAt?: Date;
  stripeInvoiceId: string;
}

export interface CreateSubscriptionRequest {
  planId: number;
  teamId: string;
}

export interface RepayInvoiceRequest {
  paymentMethodId?: string;
}

// Billing Service
class BillingService {
  private readonly baseUrl = '/api/billing';

  async getPlans(): Promise<Plan[]> {
    return apiClient.get<Plan[]>(`${this.baseUrl}/plans`);
  }

  async getPlanById(planId: number): Promise<Plan> {
    return apiClient.get<Plan>(`${this.baseUrl}/plans/${planId}`);
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<{ clientSecret: string; subscriptionId: string }> {
    return apiClient.post<{ clientSecret: string; subscriptionId: string }>(`${this.baseUrl}/subscriptions`, data);
  }

  async getTeamSubscription(teamId: string): Promise<Subscription | null> {
    return apiClient.get<Subscription | null>(`${this.baseUrl}/teams/${teamId}/subscription`);
  }

  async getActivePlan(teamId: string): Promise<Plan | null> {
    return apiClient.get<Plan | null>(`${this.baseUrl}/teams/${teamId}/active-plan`);
  }

  async getTeamInvoices(teamId: string, page: number = 1, limit: number = 10): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return apiClient.get<{
      invoices: Invoice[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${this.baseUrl}/teams/${teamId}/invoices?page=${page}&limit=${limit}`);
  }

  async repayInvoice(invoiceId: string, data: RepayInvoiceRequest = {}): Promise<{ clientSecret: string }> {
    return apiClient.post<{ clientSecret: string }>(`${this.baseUrl}/invoices/${invoiceId}/repay`, data);
  }

  async cancelSubscription(subscriptionId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/subscriptions/${subscriptionId}/cancel`);
  }

  async updateSubscription(subscriptionId: string, planId: number): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(`${this.baseUrl}/subscriptions/${subscriptionId}`, { planId });
  }
}

export default new BillingService(); 
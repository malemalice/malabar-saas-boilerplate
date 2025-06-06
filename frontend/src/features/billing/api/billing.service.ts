import axios from '@/lib/axios';

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
const BASE_URL = '/billing';

const billingService = {
  async getPlans(): Promise<Plan[]> {
    const response = await axios.get(`${BASE_URL}/plans`);
    return response.data;
  },

  async getPlanById(planId: number): Promise<Plan> {
    const response = await axios.get(`${BASE_URL}/plans/${planId}`);
    return response.data;
  },

  async createSubscription(data: CreateSubscriptionRequest): Promise<{ clientSecret: string; subscriptionId: string }> {
    const response = await axios.post(`${BASE_URL}/subscriptions`, data);
    return response.data;
  },

  async getTeamSubscription(teamId: string): Promise<Subscription | null> {
    const response = await axios.get(`${BASE_URL}/teams/${teamId}/subscription`);
    return response.data;
  },

  async getActivePlan(teamId: string): Promise<Plan | null> {
    const response = await axios.get(`${BASE_URL}/teams/${teamId}/active-plan`);
    return response.data;
  },

  async getTeamInvoices(teamId: string, page: number = 1, limit: number = 10): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await axios.get(`${BASE_URL}/teams/${teamId}/invoices?page=${page}&limit=${limit}`);
    return response.data;
  },

  async repayInvoice(invoiceId: string, data: RepayInvoiceRequest = {}): Promise<{ clientSecret: string }> {
    const response = await axios.post(`${BASE_URL}/invoices/${invoiceId}/repay`, data);
    return response.data;
  },

  async cancelSubscription(subscriptionId: string): Promise<{ message: string }> {
    const response = await axios.post(`${BASE_URL}/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  },

  async updateSubscription(subscriptionId: string, planId: number): Promise<{ message: string }> {
    const response = await axios.patch(`${BASE_URL}/subscriptions/${subscriptionId}`, { planId });
    return response.data;
  },
};

export default billingService; 
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

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
}

interface UsePlansResult {
  plans: Plan[];
  loading: boolean;
  error: string | null;
}

export const usePlans = (): UsePlansResult => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get('/api/billing/plans');
        setPlans(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, loading, error };
};
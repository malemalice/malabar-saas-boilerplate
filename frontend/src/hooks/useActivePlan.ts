import { useState, useEffect } from 'react';
import { useTeam } from '@/contexts/TeamContext';
import axios from '@/lib/axios';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features?: {
    maxUsers: number;
    maxSubmissionsPerMonth: number;
  };
}

export function useActivePlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeTeam } = useTeam();

  useEffect(() => {
    const fetchActivePlan = async () => {
      if (!activeTeam?.id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/billing/teams/${activeTeam.id}/active-plan`);
        setPlan(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch active plan');
      } finally {
        setLoading(false);
      }
    };

    fetchActivePlan();
  }, [activeTeam?.id]);

  return { plan, loading, error };
}
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useTeam } from '@/contexts/TeamContext';

interface Invoice {
  id: string;
  teamId: string;
  subscriptionId: string;
  amount: number;
  status: string;
  issuedDate: string;
  dueDate: string;
}

interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  meta: PaginationMeta | null;
  fetchInvoices: (page: number, limit: number) => Promise<void>;
}

export function useInvoices(): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const { activeTeam } = useTeam();

  const fetchInvoices = async (page: number, limit: number) => {
    if (!activeTeam?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/billing/teams/${activeTeam.id}/invoices`, {
        params: { page, limit }
      });

      setInvoices(response.data.items);
      setMeta(response.data.meta);
    } catch (err) {
      setError('Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    invoices,
    loading,
    error,
    meta,
    fetchInvoices
  };
}
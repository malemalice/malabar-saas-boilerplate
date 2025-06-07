import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamInvoices, useActivePlan } from '@/features/billing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { useTeam } from '@/features/team';
import { TEAM_ROLES } from '@/constants/teamRoles';
import { toast } from '@/components/ui/use-toast';
import axios from '@/lib/axios';

const Billing = () => {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const { activeTeam } = useTeam();
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useTeamInvoices(
    activeTeam?.id || '', 
    currentPage, 
    parseInt(rowsPerPage)
  );
  const { data: plan, isLoading: planLoading, error: planError } = useActivePlan(activeTeam?.id || '');

  const invoices = invoicesData?.invoices || [];
  const meta = {
    total: invoicesData?.total || 0,
    page: invoicesData?.page || 1,
    limit: invoicesData?.limit || 10,
    totalPages: invoicesData?.totalPages || 1
  };

  useEffect(() => {
    const hasAccess = activeTeam?.role === TEAM_ROLES.OWNER || activeTeam?.role === TEAM_ROLES.BILLING;
    if (!hasAccess) {
      navigate('/dashboard');
    }
  }, [activeTeam, navigate]);

  const handlePay = async (invoiceId: string) => {
    try {
      const response = await axios.post(`/billing/invoices/${invoiceId}/repay`);
      toast({
        title: 'Success',
        description: 'You will be redirected to the payment page, and will return here after payment is complete.',
      });
      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = (invoiceId: string) => {
    // Handle cancel logic here
    console.log('Cancel invoice:', invoiceId);
  };

  const invoiceColumns: DataTableColumn<any>[] = [
    {
      key: 'issuedAt',
      header: 'Issued At',
      render: (invoice) => new Date(invoice.invoiceDate).toLocaleDateString(),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (invoice) => invoice.subscriptionId,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (invoice) => new Date(invoice.dueDate).toLocaleDateString(),
    },
    {
      key: 'total',
      header: 'Total',
      render: (invoice) => `$${invoice.amount}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice) => (
        <span className={`capitalize ${invoice.status.toLowerCase() === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
          {invoice.status}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (invoice) => (
        invoice.status.toLowerCase() === 'unpaid' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handlePay(invoice.id)}>Pay</Button>
            <Button size="sm" variant="outline" onClick={() => handleCancel(invoice.id)}>Cancel</Button>
          </div>
        )
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Billing</h1>
      <p className="text-muted-foreground mb-8">manage your billing</p>

      <div className="grid gap-8 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Loading...</h3>
                  <p className="text-sm text-muted-foreground">Please wait</p>
                </div>
              </div>
            ) : planError ? (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-1 text-red-600">Error</h3>
                  <p className="text-sm text-muted-foreground">Failed to load plan</p>
                </div>
              </div>
            ) : plan ? (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  {plan.features?.map((feature, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      {feature.label}
                    </p>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold mb-2">${plan.price}</p>
                  <Button onClick={() => navigate('/plans')}>Upgrade</Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Free</h3>
                  <p className="text-sm text-muted-foreground">5 Users</p>
                  <p className="text-sm text-muted-foreground">100 Submissions/Month</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold mb-2">$0</p>
                  <Button onClick={() => navigate('/plans')}>Upgrade</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <div className="flex justify-center py-4">
                <p className="text-muted-foreground">Loading plan details...</p>
              </div>
            ) : planError ? (
              <div className="flex justify-center py-4">
                <p className="text-red-600">Failed to load plan details</p>
              </div>
            ) : plan ? (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium mb-1">{plan.name} Plan</h3>
                  <p className="text-sm text-muted-foreground">Unlimited Users</p>
                  <p className="text-sm text-muted-foreground">Unlimited Submissions/Month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Next Reset: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <p className="text-muted-foreground">No active plan found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={invoices}
            columns={invoiceColumns}
            isLoading={invoicesLoading}
            error={!!invoicesError}
            emptyMessage="No invoices found"
            showPagination={true}
            currentPage={meta.page}
            totalPages={meta.totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={meta.total}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
            getRowKey={(invoice) => invoice.id}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
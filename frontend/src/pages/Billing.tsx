import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeam } from '@/contexts/TeamContext';
import { TEAM_ROLES } from '@/constants/teamRoles';

const Billing = () => {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const { invoices, loading, error, meta, fetchInvoices } = useInvoices();
  const {activeTeam} = useTeam();

  useEffect(() => {
    fetchInvoices(currentPage, parseInt(rowsPerPage));
  }, [currentPage, rowsPerPage]);

  useEffect(() => {
    const hasAccess = activeTeam?.role === TEAM_ROLES.OWNER || activeTeam?.role === TEAM_ROLES.BILLING;
    if (!hasAccess) {
      navigate('/dashboard');
    }
  }, [activeTeam, navigate]);

  const handlePay = (invoiceId: string) => {
    // Handle payment logic here
    console.log('Pay invoice:', invoiceId);
  };

  const handleCancel = (invoiceId: string) => {
    // Handle cancel logic here
    console.log('Cancel invoice:', invoiceId);
  };

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
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold mb-1">Free</h3>
                <p className="text-sm text-muted-foreground">5 User</p>
                <p className="text-sm text-muted-foreground">100 Submissions/Month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold mb-2">$0</p>
                <Button>Upgrade</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium mb-1">Feature</h3>
                <p className="text-sm text-muted-foreground">3 User</p>
                <p className="text-sm text-muted-foreground">60 Submissions</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Next Reset: 2025-10-20</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issued At</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-red-600">{error}</TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No invoices found</TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{new Date(invoice.issuedDate).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.subscriptionId}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>${invoice.amount}</TableCell>
                    <TableCell>
                      <span className={`capitalize ${invoice.status.toLowerCase() === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {invoice.status.toLowerCase() === 'unpaid' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handlePay(invoice.id)}>Pay</Button>
                          <Button size="sm" variant="outline" onClick={() => handleCancel(invoice.id)}>Cancel</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Page {meta?.currentPage || 1} of {meta?.totalPages || 1}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!meta?.hasPreviousPage}
                >
                  &lt;
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!meta?.hasNextPage}
                >
                  &gt;
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
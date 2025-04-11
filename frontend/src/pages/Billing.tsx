import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Invoice {
  id: string;
  issuedAt: string;
  plan: string;
  dueDate: string;
  total: number;
  status: 'paid' | 'unpaid';
}

const Billing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      issuedAt: '2025-04-20',
      plan: 'Premium',
      dueDate: '2025-04-27',
      total: 10,
      status: 'unpaid'
    },
    {
      id: '2',
      issuedAt: '2025-03-20',
      plan: 'Premium',
      dueDate: '2025-04-27',
      total: 10,
      status: 'paid'
    },
    {
      id: '3',
      issuedAt: '2025-03-20',
      plan: 'Free',
      dueDate: '2025-04-27',
      total: 0,
      status: 'paid'
    }
  ]);

  useEffect(() => {
    // Check if user has required role
    // const hasAccess = user?.role === 'owner' || user?.role === 'billing';
    const hasAccess = true;
    if (!hasAccess) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.issuedAt}</TableCell>
                  <TableCell>{invoice.plan}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>${invoice.total}</TableCell>
                  <TableCell>
                    <span className={`capitalize ${invoice.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {invoice.status === 'unpaid' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handlePay(invoice.id)}>Pay</Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancel(invoice.id)}>Cancel</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
              <span className="text-sm">Page 1 of 10</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === 10}
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
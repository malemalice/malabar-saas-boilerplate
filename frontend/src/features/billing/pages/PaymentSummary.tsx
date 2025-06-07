import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Plan } from '@/features/billing';
import { useAuth } from '@/features/auth';
import axios from '@/lib/axios';
import { toast } from '@/components/ui/use-toast';
import { useTeam } from '@/features/team';

const PaymentSummary = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('midtrans');
  const { user } = useAuth();
  const { activeTeam } = useTeam();
  const [billingInfo, setBillingInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedPlan = localStorage.getItem('selectedPlan');
    if (storedPlan) {
      setSelectedPlan(JSON.parse(storedPlan));
    } else {
      navigate('/plans');
    }

    if (user) {
      setBillingInfo({
        name: user.name,
        email: user.email,
        phone: ''
      });
    }
  }, [navigate, user]);

  // handleInputChange removed as inputs are disabled

  const handlePayment = async () => {
    if (!selectedPlan) return;
    
    try {
      setIsLoading(true);
      const response = await axios.post('/billing/subscriptions', {
        teamId: activeTeam?.id,
        planId: selectedPlan.id,
        paymentMethod
      });
      
      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Payment</h1>
      <p className="text-muted-foreground mb-8">Complete your subscription</p>

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Selected Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold mb-1">{selectedPlan?.name || 'Free'}</h3>
                {selectedPlan?.features ? (
                  selectedPlan.features.map((feature,i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {feature.label}
                    </p>
                  ))
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">5 Users</p>
                    <p className="text-sm text-muted-foreground">100 Submissions/Month</p>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${selectedPlan?.price || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="midtrans" id="midtrans" />
                <Label htmlFor="midtrans">Midtrans</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe">Stripe</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={billingInfo.name}
                disabled
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={billingInfo.email}
                disabled
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={billingInfo.phone}
                disabled
                placeholder="Enter your phone number"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end md:col-start-2">
          <Button
            onClick={handlePayment}
            size="lg"
            className="px-8 bg-yellow-400 hover:bg-yellow-500 text-black"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'PAY >>'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
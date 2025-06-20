import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlans, type Plan } from '@/features/billing';
import { Loader2 } from 'lucide-react';

const Plans = () => {
  const navigate = useNavigate();

  const { data: plans, isLoading, error } = usePlans();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load plans</p>
      </div>
    );
  }

  if (!plans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No plans available</p>
      </div>
    );
  }

  // planFeatures removed as features come from API data

  const handleSelect = (planName: string) => {
    const selectedPlan = plans.find((p: Plan) => p.name === planName);
    if (selectedPlan) {
      localStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
      navigate('/payment-summary');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">Select the perfect plan for your team's needs</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan: Plan) => (
          <Card key={plan.name} className="relative overflow-hidden flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </div>
              <ul className="space-y-3 flex-1">
                {plan.features?.map((feature: any, i: number) => (
                  <li key={`plan-${i}`} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature.label}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button
                  className="w-full"
                  variant={plan.name === 'Premium' ? 'default' : 'outline'}
                  onClick={() => handleSelect(plan.name)}
                >
                  Select Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Plans;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Sorry, Your payment is failed.<br />
            please try again.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => navigate("/billing")}
              className="bg-green-500 hover:bg-green-600"
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
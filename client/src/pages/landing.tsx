import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Calendar, ShoppingCart, Sparkles } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <UtensilsCrossed className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4" data-testid="text-app-title">
            Stock2Table
          </h1>
          <p className="text-xl text-muted-foreground mb-8" data-testid="text-app-subtitle">
            Transform your pantry into delicious meals with AI-powered meal planning
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Smart Meal Planning</CardTitle>
              <CardDescription>
                AI-powered weekly meal plans tailored to your family's preferences and dietary needs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Recipe Discovery</CardTitle>
              <CardDescription>
                Get personalized recipe recommendations based on ingredients you already have
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <ShoppingCart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Shopping Lists</CardTitle>
              <CardDescription>
                Automatically generate shopping lists from your meal plans and pantry inventory
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Join thousands of families making meal planning easier
          </p>
        </div>
      </div>
    </div>
  );
}

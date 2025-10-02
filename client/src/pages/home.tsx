import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, UtensilsCrossed, Calendar, ShoppingCart, ScanLine } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0]?.toUpperCase() || "U";
    }
    return "U";
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback data-testid="text-user-initials">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-welcome">
                Welcome back, {user?.firstName || user?.email || "User"}!
              </h1>
              <p className="text-muted-foreground">
                Let's plan some delicious meals
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/scanner">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-scanner">
            <CardHeader>
              <ScanLine className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Scan Ingredients</CardTitle>
              <CardDescription>
                Add items to your pantry using your camera
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/planner">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-planner">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Meal Planner</CardTitle>
              <CardDescription>
                Plan your weekly meals with AI assistance
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/shopping">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-shopping">
            <CardHeader>
              <ShoppingCart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Shopping Lists</CardTitle>
              <CardDescription>
                Manage your grocery shopping lists
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-recipes">
            <CardHeader>
              <UtensilsCrossed className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Recipe Discovery</CardTitle>
              <CardDescription>
                Find recipes based on your pantry
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with these helpful features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <p className="font-medium">AI Recipe Suggestions</p>
              <p className="text-sm text-muted-foreground">
                Get personalized recipe recommendations
              </p>
            </div>
            <Link href="/">
              <Button data-testid="button-view-recipes">View Recipes</Button>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <p className="font-medium">Weekly Meal Plan</p>
              <p className="text-sm text-muted-foreground">
                Generate a complete meal plan for the week
              </p>
            </div>
            <Link href="/planner">
              <Button data-testid="button-create-plan">Create Plan</Button>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <p className="font-medium">Shopping List</p>
              <p className="text-sm text-muted-foreground">
                Generate a list from your meal plan
              </p>
            </div>
            <Link href="/shopping">
              <Button data-testid="button-view-list">View List</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

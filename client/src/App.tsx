import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

// Pages
import Dashboard from "@/pages/dashboard";
import ScannerPage from "@/pages/scanner";
import PlannerPage from "@/pages/planner";
import ShoppingPage from "@/pages/shopping";
import StandardListsPage from "@/pages/standard-lists";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { ChatInterface } from "@/components/chat-interface";
import { InstallPrompt } from "@/components/install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/scanner" component={ScannerPage} />
      <Route path="/planner" component={PlannerPage} />
      <Route path="/shopping" component={ShoppingPage} />
      <Route path="/lists" component={StandardListsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  
  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-6 bg-background">
                  <Router />
                </main>
              </div>
            </div>
            
            {/* AI Chat Assistant - Floating interface */}
            <ChatInterface 
              isMinimized={isChatMinimized}
              onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
            />
            
            {/* PWA Features */}
            <InstallPrompt />
            <OfflineIndicator />
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

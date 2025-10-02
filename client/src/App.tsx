import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
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
import { VoiceIndicator } from "@/components/voice-indicator";
import { PermissionBanner } from "@/components/permission-banner";
import { VoiceProvider, useVoice } from "@/contexts/voice-context";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/scanner" component={ScannerPage} />
          <Route path="/planner" component={PlannerPage} />
          <Route path="/shopping" component={ShoppingPage} />
          <Route path="/lists" component={StandardListsPage} />
          <Route path="/profile" component={ProfilePage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const { isListening, speaking, setOnVoiceMessage } = useVoice();
  const { isAuthenticated, isLoading } = useAuth();
  
  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  // Handle voice messages from voice commands
  const handleVoiceMessage = (message: string) => {
    // Voice message will be handled by chat interface
    console.log('Voice message received:', message);
  };

  // Register voice message handler
  useEffect(() => {
    setOnVoiceMessage(handleVoiceMessage);
  }, [setOnVoiceMessage]);

  // Show landing page without sidebar when not authenticated or loading
  if (isLoading || !isAuthenticated) {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  return (
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
      <VoiceIndicator isListening={isListening} isSpeaking={speaking} />
      <PermissionBanner />
      <Toaster />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <VoiceProvider>
            <AppContent />
          </VoiceProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/language-context";
import SplashScreen from "@/components/SplashScreen";
import Home from "@/pages/Home";
import Calculator from "@/pages/Calculator";
import ProRata from "@/pages/ProRata";
import Assistant from "@/pages/Assistant";
import Docs from "@/pages/Docs";
import NotFound from "@/pages/not-found";
import ChatWidget from "@/components/ChatWidget";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/pro-rata" component={ProRata} />
      <Route path="/assistant" component={Assistant} />
      <Route path="/docs" component={Docs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash only on first visit
    const hasVisited = sessionStorage.getItem("orange-tool-visited");
    return !hasVisited;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("orange-tool-visited", "true");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            {!showSplash && <Router />}
            {!showSplash && <ChatWidget />}
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

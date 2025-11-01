import { useEffect, useState } from "react";
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
import CommandPalette from "@/components/CommandPalette";
import Quality from "@/pages/Quality";

const experimentsEnabled = import.meta.env.VITE_CHAT_EXPERIMENTS !== "0";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/pro-rata" component={ProRata} />
      <Route path="/assistant" component={Assistant} />
      <Route path="/docs" component={Docs} />
      {experimentsEnabled && <Route path="/quality" component={Quality} />}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const hasVisited = sessionStorage.getItem("orange-tool-visited");
    return !hasVisited;
  });
  const [commandOpen, setCommandOpen] = useState(false);

  const handleSplashComplete = () => {
    sessionStorage.setItem("orange-tool-visited", "true");
    setShowSplash(false);
  };

  useEffect(() => {
    if (!experimentsEnabled) return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [experimentsEnabled]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <SplashScreen
              show={showSplash}
              onComplete={handleSplashComplete}
            />
            {!showSplash && (
              <>
                <Router />
                <ChatWidget />
                {experimentsEnabled && (
                  <CommandPalette
                    open={commandOpen}
                    onOpenChange={setCommandOpen}
                  />
                )}
              </>
            )}
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

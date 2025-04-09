import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import Dashboard from "@/pages/dashboard";
import Workout from "@/pages/workout";
import History from "@/pages/history";
import Progress from "@/pages/progress";
import Exercises from "@/pages/exercises";
import Routines from "@/pages/routines";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();

  return (
    <>
      <Header />
      <main className="pb-16 min-h-screen max-w-md mx-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/workout" component={Workout} />
          <Route path="/edit-workout/:id" component={Workout} />
          <Route path="/history" component={History} />
          <Route path="/progress" component={Progress} />
          <Route path="/exercises" component={Exercises} />
          <Route path="/routines" component={Routines} />
          <Route path="/workout/:id" component={Workout} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation currentPath={location} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

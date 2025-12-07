import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Preloader from "@/components/Preloader";
import { Suspense, lazy } from "react";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Contact = lazy(() => import("./pages/Contact"));
const WebService = lazy(() => import("./pages/services/Web"));
const SupportService = lazy(() => import("./pages/services/Support"));
const SupportCenter = lazy(() => import("./pages/SupportCenter"));
const NetworkService = lazy(() => import("./pages/services/Network"));
const About = lazy(() => import("./pages/About"));
const Imprint = lazy(() => import("@/pages/Imprint"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const NewsDetail = lazy(() => import("@/pages/NewsDetail"));
const Calculator = lazy(() => import("@/pages/Calculator"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/contact"} component={Contact} />
        <Route path={"/services/web"} component={WebService} />
        <Route path={"/services/support"} component={SupportService} />
        <Route path={"/support-center"} component={SupportCenter} />
        <Route path={"/services/network"} component={NetworkService} />
        <Route path={"/about"} component={About} />
        <Route path="/imprint" component={Imprint} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/news/:id" component={NewsDetail} />
        <Route path="/calculator" component={Calculator} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider
          defaultTheme="dark"
          switchable
        >
          <LanguageProvider>
            <TooltipProvider>
              <Preloader />
              <Toaster />
              <Router />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;

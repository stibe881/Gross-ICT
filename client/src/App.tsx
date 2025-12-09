import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { LoadingScreen } from "@/components/LoadingScreen";
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
const AdminDashboardMain = lazy(() => import("@/pages/AdminDashboardMain"));
const TicketManagement = lazy(() => import("@/pages/TicketManagement"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const TemplateManagement = lazy(() => import("@/pages/TemplateManagement"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const PublicKnowledgeBase = lazy(() => import("@/pages/PublicKnowledgeBase"));
const Accounting = lazy(() => import("@/pages/Accounting"));
const CRM = lazy(() => import("@/pages/CRM"));
const Contracts = lazy(() => import("@/pages/Contracts"));
const ContractDashboard = lazy(() => import("@/pages/ContractDashboard"));
const SLAMonitoring = lazy(() => import("@/pages/SLAMonitoring"));
const Products = lazy(() => import("@/pages/Products"));
const RecurringInvoices = lazy(() => import("@/pages/RecurringInvoices"));
const AccountingSettings = lazy(() => import("@/pages/AccountingSettings"));
const AccountingDashboard = lazy(() => import("@/pages/AccountingDashboard"));
const CustomerPortal = lazy(() => import("@/pages/CustomerPortal"));
const ReportingDashboard = lazy(() => import("@/pages/ReportingDashboard"));
const FinancialDashboard = lazy(() => import("@/pages/FinancialDashboard"));
const ReminderLog = lazy(() => import("@/pages/ReminderLog"));
const InvoiceTemplateEditor = lazy(() => import("@/pages/InvoiceTemplateEditor"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const AutomationRules = lazy(() => import("@/pages/AutomationRules"));
const SLAManagement = lazy(() => import("@/pages/SLAManagement"));
const SLADashboard = lazy(() => import("@/pages/SLADashboard"));
const EmailTemplateEditor = lazy(() => import("@/pages/EmailTemplateEditor"));
const EmailLogDashboard = lazy(() => import("@/pages/EmailLogDashboard"));
const NewsletterDashboard = lazy(() => import("@/pages/NewsletterDashboard"));
const CampaignEditor = lazy(() => import("@/pages/CampaignEditor"));
const AccessibilityStatement = lazy(() => import("@/pages/AccessibilityStatement"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
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
        <Route path="/admin" component={AdminDashboardMain} />
        <Route path="/admin/tickets" component={TicketManagement} />
        <Route path="/admin/users" component={UserManagement} />
        <Route path="/admin/templates" component={TemplateManagement} />
        <Route path="/admin/knowledge-base" component={KnowledgeBase} />
        <Route path="/knowledge-base" component={PublicKnowledgeBase} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/crm" component={CRM} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/contract-dashboard" component={ContractDashboard} />
        <Route path="/fernwartung/sla-monitoring" component={SLAMonitoring} />
              <Route path="/fernwartung/sla-management" component={SLAManagement} />
              <Route path="/fernwartung/sla-dashboard" component={SLADashboard} />
              <Route path="/email-templates" component={EmailTemplateEditor} />
              <Route path="/email-logs" component={EmailLogDashboard} />
              <Route path="/newsletter" component={NewsletterDashboard} />
              <Route path="/newsletter/campaigns/:id" component={CampaignEditor} />
              <Route path="/accessibility-statement" component={AccessibilityStatement} />
        <Route path="/products" component={Products} />
        <Route path="/recurring-invoices" component={RecurringInvoices} />
        <Route path={"/accounting-settings"} component={AccountingSettings} />
        <Route path={"/invoice-template-editor"} component={InvoiceTemplateEditor} />
        <Route path="/accounting-dashboard" component={AccountingDashboard} />
        <Route path="/customer-portal" component={CustomerPortal} />
        <Route path="/reporting" component={ReportingDashboard} />
        <Route path={"/financial-dashboard"} component={FinancialDashboard} />
        <Route path={"/reminder-log"} component={ReminderLog} />
        <Route path={"/notification-settings"} component={NotificationSettings} />
        <Route path={"/automation-rules"} component={AutomationRules} />
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
            <WebSocketProvider>
              <TooltipProvider>
                <LoadingScreen />
                <Toaster />
                <Router />
              </TooltipProvider>
            </WebSocketProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;

import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./authRouter";
import { ticketRouter } from "./ticketRouter";
import { commentRouter } from "./commentRouter";
import { userRouter } from "./userRouter";
import { templateRouter } from "./templateRouter";
import { kbRouter } from "./kbRouter";
import { customerRouter } from "./customerRouter";
import { invoiceRouter, quoteRouter } from "./invoiceRouter";
import { invoiceFromTicketRouter } from "./invoiceFromTicketRouter";
import { pdfRouter } from "./pdfRouter";
import { productRouter } from "./productRouter";
import { emailRouter } from "./emailRouter";
import { recurringInvoiceRouter } from "./recurringInvoiceRouter";
import { accountingSettingsRouter } from "./accountingSettingsRouter";
import { financialDashboardRouter } from "./financialDashboardRouter";
import { exportRouter } from "./exportRouter";
import { reminderLogRouter } from "./reminderLogRouter";
import { favoritesRouter } from "./favoritesRouter";
import { activitiesRouter } from "./activitiesRouter";
import { filterPresetsRouter } from "./filterPresetsRouter";
import { automationRouter } from "./automationRouter";
import { slaRouter } from "./slaRouter";
import { dashboardStatsRouter } from "./dashboardStatsRouter";
import { analyticsRouter } from "./analyticsRouter";
import { contractRouter } from "./contractRouter";
import { contractTemplateRouter } from "./contractTemplateRouter";
import { contractDashboardRouter } from "./contractDashboardRouter";
import { slaMonitoringRouter } from "./slaMonitoringRouter";
import { contractPdfRouter } from "./contractPdfRouter";
import { contractSignatureRouter } from "./contractSignatureRouter";
import { emailTemplateRouter } from "./emailTemplateRouter";
import { emailLogRouter } from "./emailLogRouter";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  tickets: ticketRouter,
  comments: commentRouter,
  users: userRouter,
  templates: templateRouter,
  kb: kbRouter,
  customers: customerRouter,
  invoices: invoiceRouter,
  quotes: quoteRouter,
  invoiceFromTicket: invoiceFromTicketRouter,
  pdf: pdfRouter,
  products: productRouter,
  email: emailRouter,
  recurringInvoices: recurringInvoiceRouter,
  accountingSettings: accountingSettingsRouter,
  financialDashboard: financialDashboardRouter,
  export: exportRouter,
  reminderLog: reminderLogRouter,
  favorites: favoritesRouter,
  activities: activitiesRouter,
  filterPresets: filterPresetsRouter,
  automation: automationRouter,
  sla: slaRouter,
  dashboardStats: dashboardStatsRouter,
  analytics: analyticsRouter,
  contracts: contractRouter,
  contractTemplates: contractTemplateRouter,
  contractDashboard: contractDashboardRouter,
  slaMonitoring: slaMonitoringRouter,
  contractPdf: contractPdfRouter,
  contractSignature: contractSignatureRouter,
  emailTemplates: emailTemplateRouter,
  emailLogs: emailLogRouter,
});

export type AppRouter = typeof appRouter;

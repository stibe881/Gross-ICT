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
});

export type AppRouter = typeof appRouter;

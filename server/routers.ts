import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./authRouter";
import { ticketRouter } from "./ticketRouter";
import { commentRouter } from "./commentRouter";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  tickets: ticketRouter,
  comments: commentRouter,
});

export type AppRouter = typeof appRouter;

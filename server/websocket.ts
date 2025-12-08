import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join user-specific room for targeted updates
    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Export singleton instance
let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialized. Call setupWebSocket first.");
  }
  return ioInstance;
}

export function setIO(io: SocketIOServer) {
  ioInstance = io;
}

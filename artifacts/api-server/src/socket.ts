import { Server as HttpServer } from "http";
import { Server as IoServer } from "socket.io";

interface RegisteredUser {
  socketId: string;
  role: "customer" | "delivery" | "cs";
  pushToken?: string;
}

// In-memory store: userId → socket registration
const users: Record<string, RegisteredUser> = {};

export function initSocket(httpServer: HttpServer) {
  const io = new IoServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    // Route through the /api proxy path
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    console.log("[Socket.IO] User connected:", socket.id);

    // ── Register user (customer or delivery) ────────────────────────────────
    socket.on("register", ({ userId, role, pushToken }: {
      userId: string; role: string; pushToken?: string;
    }) => {
      try {
        users[userId] = {
          socketId: socket.id,
          role: role as RegisteredUser["role"],
          pushToken,
        };
        socket.data.userId = userId;
        console.log(`[Socket.IO] ${role} registered: ${userId}`);
      } catch (e) {
        console.error("[Socket.IO] register error:", e);
      }
    });

    // ── Join a chat room ─────────────────────────────────────────────────────
    socket.on("joinRoom", ({ roomId }: { roomId: string }) => {
      try {
        socket.join(roomId);
        console.log(`[Socket.IO] Socket ${socket.id} joined room: ${roomId}`);
      } catch (e) {
        console.error("[Socket.IO] joinRoom error:", e);
      }
    });

    // ── Send a chat message to everyone in the room ──────────────────────────
    socket.on("sendMessage", async ({ roomId, message }: {
      roomId: string;
      message: {
        id: string; senderId: string; senderName: string;
        content: string; timestamp: string; isCustomerService: boolean;
      };
    }) => {
      try {
        // Broadcast to everyone in the room except the sender
        socket.to(roomId).emit("receiveMessage", { roomId, message });

        // Send Expo push notification to any registered user in the room
        // who isn't the sender and has a push token
        for (const [uid, reg] of Object.entries(users)) {
          if (uid !== message.senderId && reg.pushToken) {
            sendExpoPush(reg.pushToken, message.senderName, message.content).catch(() => {});
          }
        }
      } catch (e) {
        console.error("[Socket.IO] sendMessage error:", e);
      }
    });

    // ── Typing indicator ─────────────────────────────────────────────────────
    socket.on("typing", ({ roomId, senderName }: { roomId: string; senderName: string }) => {
      try {
        socket.to(roomId).emit("userTyping", { roomId, senderName });
      } catch {}
    });

    socket.on("stopTyping", ({ roomId }: { roomId: string }) => {
      try {
        socket.to(roomId).emit("userStoppedTyping", { roomId });
      } catch {}
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId && users[userId]?.socketId === socket.id) {
        delete users[userId];
      }
      console.log("[Socket.IO] User disconnected:", socket.id);
    });
  });

  console.log("[Socket.IO] Server initialised at path /api/socket.io");
  return io;
}

// ── Expo Push Notification helper ─────────────────────────────────────────────
async function sendExpoPush(token: string, title: string, body: string) {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: token, sound: "default", title, body }),
    });
  } catch (e) {
    console.warn("[Socket.IO] Push notification failed:", e);
  }
}

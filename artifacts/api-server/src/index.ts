import { createServer } from "http";
import app from "./app";
import { initSocket } from "./socket";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ── Create HTTP server and attach Express app ──────────────────────────────
const httpServer = createServer(app);

// ── Attach Socket.IO for real-time chat ────────────────────────────────────
initSocket(httpServer);

// ── Start listening ────────────────────────────────────────────────────────
httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});

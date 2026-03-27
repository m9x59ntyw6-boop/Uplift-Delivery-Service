/**
 * Socket.IO client singleton for Uplift real-time chat.
 * Uses the /api/socket.io path which goes through Replit's proxy
 * to the API server at port 8080.
 *
 * Falls back gracefully when offline or server is unreachable.
 */

import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;
let _isConnected = false;
let _lastUserId: string | null = null;
let _lastRole: string | null = null;
let _lastPushToken: string | null | undefined = null;

function getServerUrl(): string {
  // Uses the same domain as the REST API
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return domain ? `https://${domain}` : "http://localhost:8080";
}

export function getSocket(): Socket {
  if (!_socket) {
    const url = getServerUrl();
    _socket = io(url, {
      // Goes through Replit's /api proxy to port 8080
      path: "/api/socket.io",
      // Start with polling (works everywhere), upgrade to WebSocket
      transports: ["polling", "websocket"],
      // Reconnect automatically on disconnect
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      // Timeout for initial connection attempt
      timeout: 10000,
      // Don't auto-connect — we connect manually when user logs in
      autoConnect: false,
    });

    _socket.on("connect", () => {
      _isConnected = true;
      console.log("[Socket] Connected:", _socket?.id);
      // Re-register user on every connect (covers background reconnects)
      if (_lastUserId && _lastRole) {
        _socket?.emit("register", { userId: _lastUserId, role: _lastRole, pushToken: _lastPushToken ?? undefined });
      }
    });

    _socket.on("disconnect", (reason) => {
      _isConnected = false;
      console.log("[Socket] Disconnected:", reason);
    });

    let _connectErrorCount = 0;
    _socket.on("connect_error", (err) => {
      _isConnected = false;
      _connectErrorCount++;
      // Log first error, then silence — chat works offline via local storage
      if (_connectErrorCount <= 1) {
        console.log("[Socket] Offline mode — chat messages saved locally:", err.message);
      }
    });
    _socket.on("connect", () => { _connectErrorCount = 0; });
  }
  return _socket;
}

/**
 * Connect the socket and register the user.
 * Call this after the user logs in.
 */
export function connectSocket(userId: string, role: string, pushToken?: string | null) {
  try {
    // Save user info so the connect handler can re-register on any reconnect
    _lastUserId = userId;
    _lastRole = role;
    _lastPushToken = pushToken;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    } else {
      // Already connected — register immediately
      socket.emit("register", { userId, role, pushToken: pushToken ?? undefined });
    }
  } catch (e) {
    console.warn("[Socket] Connect error:", e);
  }
}

/**
 * Join a specific chat room.
 */
export function joinRoom(roomId: string) {
  try {
    const socket = getSocket();
    if (socket.connected) socket.emit("joinRoom", { roomId });
    else socket.once("connect", () => socket.emit("joinRoom", { roomId }));
  } catch (e) {
    console.warn("[Socket] joinRoom error:", e);
  }
}

/**
 * Send a message to a room via socket.
 * Returns true if sent via socket, false if offline (caller saves locally).
 */
export function emitMessage(roomId: string, message: {
  id: string; senderId: string; senderName: string;
  content: string; timestamp: string; isCustomerService: boolean;
}): boolean {
  try {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("sendMessage", { roomId, message });
      return true;
    }
    return false;
  } catch (e) {
    console.warn("[Socket] emitMessage error:", e);
    return false;
  }
}

export function emitTyping(roomId: string, senderName: string) {
  try {
    const socket = getSocket();
    if (socket.connected) socket.emit("typing", { roomId, senderName });
  } catch {}
}

export function emitStopTyping(roomId: string) {
  try {
    const socket = getSocket();
    if (socket.connected) socket.emit("stopTyping", { roomId });
  } catch {}
}

/**
 * Disconnect and clean up the socket.
 * Call this when the user logs out.
 */
export function disconnectSocket() {
  try {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    _lastUserId = null;
    _lastRole = null;
    _lastPushToken = null;
    console.log("[Socket] Disconnected and cleaned up");
  } catch {}
}

export function isSocketConnected(): boolean {
  return _isConnected;
}

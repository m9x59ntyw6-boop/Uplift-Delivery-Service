import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { connectSocket, disconnectSocket, emitMessage, emitStopTyping, emitTyping, getSocket, isSocketConnected, joinRoom } from "@/utils/socket";
import { getPushToken, registerForPushNotifications, showLocalNotification } from "@/utils/notifications";
import { useAuth } from "./AuthContext";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isCustomerService: boolean;
  isReview?: boolean;
  rating?: number;
}

export interface ChatRoom {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  messages: ChatMessage[];
  lastMessage: string;
  lastTimestamp: string;
  unread: number;
}

interface ChatContextValue {
  rooms: ChatRoom[];
  isOnline: boolean;
  typingIn: Record<string, string>;
  sendMessage: (roomId: string, senderId: string, senderName: string, content: string, isCustomerService?: boolean) => void;
  sendReview: (roomId: string, senderId: string, senderName: string, content: string, rating: number) => void;
  getOrCreateRoom: (orderId: string, userId: string, userName: string) => ChatRoom;
  getRoomMessages: (roomId: string) => ChatMessage[];
  markRead: (roomId: string) => void;
  openRoom: (roomId: string) => void;
  sendTyping: (roomId: string, senderName: string) => void;
  stopTyping: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);
const CHAT_KEY = "@uplift_chats_v2";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [typingIn, setTypingIn] = useState<Record<string, string>>({});
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Load saved chats from storage ────────────────────────────────────────
  useEffect(() => {
    loadChats();
  }, []);

  // ── Delivery staff: auto-join all rooms for real-time updates ───────────
  useEffect(() => {
    if (!user || user.role !== "delivery" || rooms.length === 0) return;
    rooms.forEach(r => {
      try { joinRoom(r.id); } catch {}
    });
  }, [user?.id, rooms.length]);

  // ── Connect socket when user logs in, disconnect on logout ───────────────
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setIsOnline(false);
      return;
    }

    // Request push notification permission
    registerForPushNotifications().catch(() => {});

    // Connect socket
    const pushToken = getPushToken();
    connectSocket(user.id, user.role, pushToken);

    // Track connection state
    const socket = getSocket();
    const onConnect = () => setIsOnline(true);
    const onDisconnect = () => setIsOnline(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setIsOnline(isSocketConnected());

    // ── Receive real-time messages ────────────────────────────────────────
    const onReceiveMessage = ({ roomId, message }: { roomId: string; message: ChatMessage }) => {
      try {
        setRooms(prev => {
          const updated = prev.map(r => {
            if (r.id !== roomId) return r;
            // Skip if already have this message (dedup by id)
            if (r.messages.find(m => m.id === message.id)) return r;
            return {
              ...r,
              messages: [...r.messages, message],
              lastMessage: message.content,
              lastTimestamp: message.timestamp,
              unread: r.unread + 1,
            };
          });
          AsyncStorage.setItem(CHAT_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });

        // Show local notification when message received
        showLocalNotification(message.senderName, message.content).catch(() => {});
      } catch (e) {
        console.warn("[Chat] receiveMessage error:", e);
      }
    };

    // ── Typing indicators ─────────────────────────────────────────────────
    const onTyping = ({ roomId, senderName }: { roomId: string; senderName: string }) => {
      setTypingIn(prev => ({ ...prev, [roomId]: senderName }));
      // Auto-clear after 3 seconds if no stopTyping event
      clearTimeout(typingTimers.current[roomId]);
      typingTimers.current[roomId] = setTimeout(() => {
        setTypingIn(prev => { const n = { ...prev }; delete n[roomId]; return n; });
      }, 3000);
    };

    const onStopTyping = ({ roomId }: { roomId: string }) => {
      clearTimeout(typingTimers.current[roomId]);
      setTypingIn(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    };

    socket.on("receiveMessage", onReceiveMessage);
    socket.on("userTyping", onTyping);
    socket.on("userStoppedTyping", onStopTyping);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("userTyping", onTyping);
      socket.off("userStoppedTyping", onStopTyping);
    };
  }, [user?.id]);

  // ── Storage ──────────────────────────────────────────────────────────────
  const loadChats = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_KEY);
      if (stored) {
        try { setRooms(JSON.parse(stored)); } catch { console.warn("[Chat] Could not parse stored chats"); }
      }
    } catch (e) {
      console.warn("[Chat] Failed to load chats:", e);
    }
  };

  const saveRooms = async (r: ChatRoom[]) => {
    setRooms(r);
    try {
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(r));
    } catch (e) {
      console.warn("[Chat] Failed to save chats:", e);
    }
  };

  // ── Join a room (connects to Socket.IO room) ─────────────────────────────
  const openRoom = (roomId: string) => {
    try {
      joinRoom(roomId);
    } catch {}
  };

  // ── Get or create a chat room ────────────────────────────────────────────
  const getOrCreateRoom = (orderId: string, userId: string, userName: string): ChatRoom => {
    const existing = rooms.find(r => r.id === orderId);
    if (existing) return existing;
    const room: ChatRoom = {
      id: orderId,
      orderId,
      userId,
      userName,
      messages: [
        {
          id: "welcome-" + orderId,
          senderId: "cs",
          senderName: "Customer Service",
          content: "Hi! Welcome to Uplift by Lyft Deliveries. How can we assist you today?",
          timestamp: new Date().toISOString(),
          isCustomerService: true,
        }
      ],
      lastMessage: "Hi! Welcome to Uplift...",
      lastTimestamp: new Date().toISOString(),
      unread: 1,
    };
    const updated = [room, ...rooms];
    saveRooms(updated);
    return room;
  };

  // ── Send a message ───────────────────────────────────────────────────────
  const sendMessage = (roomId: string, senderId: string, senderName: string, content: string, isCustomerService = false) => {
    try {
      const msg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        senderId,
        senderName,
        content,
        timestamp: new Date().toISOString(),
        isCustomerService,
      };

      // Save locally immediately (works offline)
      // Cap at 150 messages per room to prevent AsyncStorage bloat
      const MSG_CAP = 150;
      setRooms(prev => {
        const updated = prev.map(r => {
          if (r.id !== roomId) return r;
          const msgs = [...r.messages, msg];
          const trimmed = msgs.length > MSG_CAP ? msgs.slice(msgs.length - MSG_CAP) : msgs;
          return { ...r, messages: trimmed, lastMessage: content, lastTimestamp: msg.timestamp, unread: r.unread + (isCustomerService ? 1 : 0) };
        });
        AsyncStorage.setItem(CHAT_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      // Also broadcast via socket (real-time to other devices)
      emitMessage(roomId, msg);

      // Auto-reply from Customer Service only if student/staff sent it (not delivery)
      if (!isCustomerService && user?.role !== "delivery") {
        setTimeout(() => {
          const autoReply: ChatMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            senderId: "cs",
            senderName: "Customer Service",
            content: getAutoReply(content),
            timestamp: new Date().toISOString(),
            isCustomerService: true,
          };
          setRooms(prev => {
            const r2 = prev.map(r => {
              if (r.id !== roomId) return r;
              const msgs = [...r.messages, autoReply];
              const trimmed = msgs.length > MSG_CAP ? msgs.slice(msgs.length - MSG_CAP) : msgs;
              return { ...r, messages: trimmed, lastMessage: autoReply.content, lastTimestamp: autoReply.timestamp, unread: r.unread + 1 };
            });
            AsyncStorage.setItem(CHAT_KEY, JSON.stringify(r2)).catch(() => {});
            return r2;
          });
          // Send auto-reply via socket too
          emitMessage(roomId, autoReply);
          // Notify if not in the chat room
          showLocalNotification("Customer Service", autoReply.content).catch(() => {});
        }, 1500);
      }
    } catch (e) {
      console.warn("[Chat] sendMessage error:", e);
    }
  };

  // ── Send a review ────────────────────────────────────────────────────────
  const sendReview = (roomId: string, senderId: string, senderName: string, content: string, rating: number) => {
    try {
      const msg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        senderId,
        senderName,
        content,
        timestamp: new Date().toISOString(),
        isCustomerService: false,
        isReview: true,
        rating,
      };
      setRooms(prev => {
        const updated = prev.map(r => {
          if (r.id !== roomId) return r;
          return { ...r, messages: [...r.messages, msg], lastMessage: `Rated ${rating} stars`, lastTimestamp: msg.timestamp };
        });
        AsyncStorage.setItem(CHAT_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      emitMessage(roomId, msg);
    } catch (e) {
      console.warn("[Chat] sendReview error:", e);
    }
  };

  const getRoomMessages = (roomId: string): ChatMessage[] => {
    return rooms.find(r => r.id === roomId)?.messages ?? [];
  };

  const markRead = (roomId: string) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, unread: 0 } : r);
    saveRooms(updated);
  };

  const sendTyping = (roomId: string, senderName: string) => {
    emitTyping(roomId, senderName);
  };

  const stopTyping = (roomId: string) => {
    emitStopTyping(roomId);
  };

  const value = useMemo(() => ({
    rooms, isOnline, typingIn,
    sendMessage, sendReview, getOrCreateRoom, getRoomMessages, markRead, openRoom, sendTyping, stopTyping,
  }), [rooms, isOnline, typingIn]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

// ── Auto-reply logic ─────────────────────────────────────────────────────────
function getAutoReply(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("where") || m.includes("location") || m.includes("track")) return "Your order is on its way! You can track it live in the Orders tab.";
  if (m.includes("cancel")) return "To cancel, please contact us quickly. Once accepted, cancellation may not be possible.";
  if (m.includes("late") || m.includes("delay")) return "We apologize for any delay. Your delivery person is on the way as fast as possible!";
  if (m.includes("price") || m.includes("cost")) return "Small meals: J$750, Medium: J$850, Large: J$1,000. Snacks and drinks vary. Check the menu for details.";
  if (m.includes("streak") || m.includes("discount")) return "Order 2 days in a row for 5% off, and 3+ days straight for 10% off!";
  if (m.includes("hello") || m.includes("hi") || m.includes("hey")) return "Hello! How can I help you today? 😊";
  if (m.includes("thank")) return "You're welcome! Is there anything else I can help you with?";
  return "Thank you for reaching out! A support agent will assist you shortly. Estimated response time: under 5 minutes.";
}

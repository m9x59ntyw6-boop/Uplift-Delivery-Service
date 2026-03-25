import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  sendMessage: (roomId: string, senderId: string, senderName: string, content: string, isCustomerService?: boolean) => void;
  sendReview: (roomId: string, senderId: string, senderName: string, content: string, rating: number) => void;
  getOrCreateRoom: (orderId: string, userId: string, userName: string) => ChatRoom;
  getRoomMessages: (roomId: string) => ChatMessage[];
  markRead: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);
const CHAT_KEY = "@uplift_chats";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_KEY);
      if (stored) setRooms(JSON.parse(stored));
    } catch {}
  };

  const saveRooms = async (r: ChatRoom[]) => {
    setRooms(r);
    await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(r));
  };

  const getOrCreateRoom = (orderId: string, userId: string, userName: string): ChatRoom => {
    const existing = rooms.find(r => r.orderId === orderId);
    if (existing) return existing;
    const room: ChatRoom = {
      id: orderId,
      orderId,
      userId,
      userName,
      messages: [
        {
          id: "welcome",
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

  const sendMessage = (roomId: string, senderId: string, senderName: string, content: string, isCustomerService = false) => {
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      isCustomerService,
    };
    const updated = rooms.map(r => {
      if (r.id !== roomId) return r;
      return { ...r, messages: [...r.messages, msg], lastMessage: content, lastTimestamp: msg.timestamp, unread: r.unread + (isCustomerService ? 1 : 0) };
    });
    saveRooms(updated);

    if (!isCustomerService) {
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
          const r2 = prev.map(r => r.id !== roomId ? r : { ...r, messages: [...r.messages, autoReply], lastMessage: autoReply.content, lastTimestamp: autoReply.timestamp, unread: r.unread + 1 });
          AsyncStorage.setItem(CHAT_KEY, JSON.stringify(r2));
          return r2;
        });
      }, 1500);
    }
  };

  const sendReview = (roomId: string, senderId: string, senderName: string, content: string, rating: number) => {
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
    const updated = rooms.map(r => {
      if (r.id !== roomId) return r;
      return { ...r, messages: [...r.messages, msg], lastMessage: `Rated ${rating} stars`, lastTimestamp: msg.timestamp };
    });
    saveRooms(updated);
  };

  const getRoomMessages = (roomId: string): ChatMessage[] => {
    return rooms.find(r => r.id === roomId)?.messages ?? [];
  };

  const markRead = (roomId: string) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, unread: 0 } : r);
    saveRooms(updated);
  };

  const value = useMemo(() => ({ rooms, sendMessage, sendReview, getOrCreateRoom, getRoomMessages, markRead }), [rooms]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

function getAutoReply(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("where") || m.includes("location") || m.includes("track")) return "Your order is on its way! You can track it live in the Orders tab.";
  if (m.includes("cancel")) return "To cancel, please contact us quickly. Once accepted, cancellation may not be possible.";
  if (m.includes("late") || m.includes("delay")) return "We apologize for any delay. Your delivery person is on the way as fast as possible!";
  if (m.includes("price") || m.includes("cost")) return "Small meals: J$750, Medium: J$850, Large: J$1,000. Snacks and drinks vary. Check the menu for details.";
  if (m.includes("streak") || m.includes("discount")) return "Order 2 days in a row for 5% off, and 3+ days straight for 10% off!";
  return "Thank you for reaching out! A support agent will assist you shortly. Estimated response time: under 5 minutes.";
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "student_staff" | "delivery";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  streakDays: number;
  lastOrderDate: string | null;
  agreedToTerms: boolean;
  avatar?: string;
}

// ─── Delivery Personnel Security Codes ───────────────────────────────────────
// Last 4 digits of each staff member's ID. Gurvin controls access expansion.
export const DELIVERY_STAFF: {
  id: string;
  name: string;
  email: string;
  code: string;
  initials: string;
  color: string;
}[] = [
  { id: "u1", name: "Tiamoy Johnson",   email: "tiamoy@school.edu",   code: "1773", initials: "TJ", color: "#1A73E8" },
  { id: "u2", name: "Mickii French",    email: "mickii@school.edu",    code: "0904", initials: "MF", color: "#FF6B35" },
  { id: "u3", name: "Benjamin Haye",    email: "benjamin@school.edu",  code: "0630", initials: "BH", color: "#22C55E" },
  { id: "u4", name: "Gurvin Leachman",  email: "gurvin@school.edu",    code: "0874", initials: "GL", color: "#A855F7" },
];

// Gurvin (u4) can toggle this to allow new staff to be added
export const GURVIN_LOCK = true; // true = locked to 4 staff until Gurvin approves

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  loginDelivery: (staffId: string, code: string) => Promise<"success" | "wrong_code" | "not_found">;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  agreeToTerms: () => void;
  updateStreak: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "@uplift_user_v2";
const USERS_KEY   = "@uplift_users_v2";

const DEMO_USERS: User[] = DELIVERY_STAFF.map(s => ({
  id: s.id, name: s.name, email: s.email,
  role: "delivery" as UserRole,
  streakDays: 0, lastOrderDate: null, agreedToTerms: true,
}));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.warn("[Auth] Failed to load user:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (u: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      setUser(u);
    } catch (e) {
      console.warn("[Auth] Failed to save user:", e);
      setUser(u);
    }
  };

  const getUsers = async (): Promise<User[]> => {
    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const registered: User[] = stored ? JSON.parse(stored) : [];
      return [...DEMO_USERS, ...registered];
    } catch {
      return DEMO_USERS;
    }
  };

  const saveUsers = async (users: User[]) => {
    try {
      const nonDemo = users.filter(u => !DEMO_USERS.find(d => d.id === u.id));
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(nonDemo));
    } catch (e) {
      console.warn("[Auth] Failed to save users:", e);
    }
  };

  // ── Standard email/password login (students & staff) ──────────────────────
  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      if (role === "delivery") return false; // delivery uses loginDelivery
      const users = await getUsers();
      const found = users.find(u =>
        u.email.toLowerCase() === email.toLowerCase() && u.role === role
      );
      if (found) { await saveUser(found); return true; }
      return false;
    } catch (e) {
      console.warn("[Auth] Login error:", e);
      return false;
    }
  };

  // ── Delivery PIN login ─────────────────────────────────────────────────────
  const loginDelivery = async (
    staffId: string, code: string
  ): Promise<"success" | "wrong_code" | "not_found"> => {
    try {
      const staff = DELIVERY_STAFF.find(s => s.id === staffId);
      if (!staff) return "not_found";
      if (staff.code !== code.trim()) return "wrong_code";
      const users = await getUsers();
      const found = users.find(u => u.id === staffId) ?? {
        id: staff.id, name: staff.name, email: staff.email,
        role: "delivery" as UserRole,
        streakDays: 0, lastOrderDate: null, agreedToTerms: true,
      };
      await saveUser(found);
      return "success";
    } catch (e) {
      console.warn("[Auth] Delivery login error:", e);
      return "not_found";
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      if (role === "delivery") return false; // delivery staff are pre-registered only
      const users = await getUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return false;
      const newUser: User = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name, email, role,
        streakDays: 0, lastOrderDate: null, agreedToTerms: false,
      };
      await saveUsers([...users, newUser]);
      await saveUser(newUser);
      return true;
    } catch (e) {
      console.warn("[Auth] Register error:", e);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await saveUser(updated);
  };

  const agreeToTerms = async () => {
    if (!user) return;
    await saveUser({ ...user, agreedToTerms: true });
  };

  const updateStreak = async () => {
    if (!user) return;
    try {
      const today = new Date().toDateString();
      if (user.lastOrderDate === today) return;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = user.lastOrderDate === yesterday ? user.streakDays + 1 : 1;
      await saveUser({ ...user, streakDays: newStreak, lastOrderDate: today });
    } catch (e) {
      console.warn("[Auth] Streak update error:", e);
    }
  };

  const value = useMemo(() => ({
    user, isLoading, login, loginDelivery, register, logout, updateUser, agreeToTerms, updateStreak,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

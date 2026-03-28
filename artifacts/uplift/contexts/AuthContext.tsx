import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "student_staff" | "delivery";

export interface SavedAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  savedAt: string;
  staffId?: string;
  avatarColor: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  streakDays: number;
  lastOrderDate: string | null;
  streakAchievedAt: string | null;
  agreedToTerms: boolean;
  avatar?: string;
}

// ─── Delivery Personnel Security Codes ───────────────────────────────────────
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

export const GURVIN_LOCK = true;

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  loginDelivery: (staffId: string, code: string) => Promise<"success" | "wrong_code" | "not_found">;
  loginWithSavedAccount: (account: SavedAccount) => Promise<"ok" | "bad_creds" | "error">;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  agreeToTerms: () => void;
  updateStreak: () => void;
  getSavedEmail: () => Promise<string>;
  getSavedAccounts: () => Promise<SavedAccount[]>;
  removeSavedAccount: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY        = "@uplift_user_v2";
const USERS_KEY          = "@uplift_users_v2";
const CREDENTIALS_KEY    = "@uplift_credentials_v2";     // { email: password }
const LAST_EMAIL_KEY     = "@uplift_last_email_v2";      // last successful login email
const SAVED_ACCOUNTS_KEY = "@uplift_saved_accounts_v2";  // Instagram-style saved accounts

const AVATAR_COLORS = [
  "#1A73E8", "#FF6B35", "#8B5CF6", "#10B981", "#F59E0B",
  "#EC4899", "#06B6D4", "#84CC16", "#EF4444", "#F97316",
];
function avatarColorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const DEMO_USERS: User[] = DELIVERY_STAFF.map(s => ({
  id: s.id, name: s.name, email: s.email,
  role: "delivery" as UserRole,
  streakDays: 0, lastOrderDate: null, streakAchievedAt: null, agreedToTerms: true,
}));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  // ── 2-hour streak reset when 5-day streak is achieved ─────────────────────
  useEffect(() => {
    if (!user || user.streakDays < 5 || !user.streakAchievedAt) return;
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const achievedAt = new Date(user.streakAchievedAt).getTime();
    const elapsed = Date.now() - achievedAt;
    if (elapsed >= TWO_HOURS) {
      const reset = { ...user, streakDays: 0, streakAchievedAt: null };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset)).catch(() => {});
      setUser(reset);
      return;
    }
    const remaining = TWO_HOURS - elapsed;
    const timer = setTimeout(() => {
      setUser(prev => {
        if (!prev) return prev;
        const reset = { ...prev, streakDays: 0, streakAchievedAt: null };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset)).catch(() => {});
        return reset;
      });
    }, remaining);
    return () => clearTimeout(timer);
  }, [user?.streakDays, user?.streakAchievedAt]);

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

  // ── Credentials store (email → password) ──────────────────────────────────
  const getCredentials = async (): Promise<Record<string, string>> => {
    try {
      const stored = await AsyncStorage.getItem(CREDENTIALS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveCredential = async (email: string, password: string) => {
    try {
      const creds = await getCredentials();
      creds[email.toLowerCase()] = password;
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    } catch (e) {
      console.warn("[Auth] Failed to save credential:", e);
    }
  };

  // ── Remember last used email ───────────────────────────────────────────────
  const saveLastEmail = async (email: string) => {
    try { await AsyncStorage.setItem(LAST_EMAIL_KEY, email.toLowerCase()); } catch {}
  };

  const getSavedEmail = async (): Promise<string> => {
    try {
      return (await AsyncStorage.getItem(LAST_EMAIL_KEY)) ?? "";
    } catch {
      return "";
    }
  };

  // ── Saved accounts (Instagram-style) ──────────────────────────────────────
  const getSavedAccounts = async (): Promise<SavedAccount[]> => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const upsertSavedAccount = async (account: SavedAccount) => {
    try {
      const existing = await getSavedAccounts();
      const filtered = existing.filter(a => a.id !== account.id);
      const updated = [account, ...filtered]; // most-recently-used first
      await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("[Auth] Failed to save account:", e);
    }
  };

  const removeSavedAccount = async (id: string) => {
    try {
      const existing = await getSavedAccounts();
      await AsyncStorage.setItem(
        SAVED_ACCOUNTS_KEY,
        JSON.stringify(existing.filter(a => a.id !== id))
      );
    } catch (e) {
      console.warn("[Auth] Failed to remove account:", e);
    }
  };

  const loginWithSavedAccount = async (
    account: SavedAccount
  ): Promise<"ok" | "bad_creds" | "error"> => {
    try {
      if (account.role === "delivery") {
        const staff = DELIVERY_STAFF.find(s => s.id === account.staffId);
        if (!staff) return "bad_creds";
        const result = await loginDelivery(staff.id, staff.code);
        return result === "success" ? "ok" : "bad_creds";
      } else {
        const creds = await getCredentials();
        const password = creds[account.email.toLowerCase()];
        if (!password) return "bad_creds";
        const ok = await login(account.email, password, "student_staff");
        return ok ? "ok" : "bad_creds";
      }
    } catch (e) {
      console.warn("[Auth] loginWithSavedAccount error:", e);
      return "error";
    }
  };

  // ── Standard email/password login (students & staff) ──────────────────────
  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      if (role === "delivery") return false;
      const users = await getUsers();
      const found = users.find(u =>
        u.email.toLowerCase() === email.toLowerCase() && u.role === role
      );
      if (!found) return false;

      // Verify password — if credentials exist for this email, check them
      const creds = await getCredentials();
      const storedPw = creds[email.toLowerCase()];
      if (storedPw && storedPw !== password) return false;

      await saveUser(found);
      await saveLastEmail(email);
      // Persist to saved-accounts list
      await upsertSavedAccount({
        id: found.id, name: found.name, email: found.email,
        role: "student_staff", savedAt: new Date().toISOString(),
        avatarColor: avatarColorFor(found.name),
      });
      return true;
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
        streakDays: 0, lastOrderDate: null, streakAchievedAt: null, agreedToTerms: true,
      };
      await saveUser(found);
      // Persist to saved-accounts list
      await upsertSavedAccount({
        id: found.id, name: found.name, email: found.email,
        role: "delivery", staffId: found.id,
        savedAt: new Date().toISOString(),
        avatarColor: avatarColorFor(found.name),
      });
      return "success";
    } catch (e) {
      console.warn("[Auth] Delivery login error:", e);
      return "not_found";
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      if (role === "delivery") return false;
      const users = await getUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return false;
      const newUser: User = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name, email, role,
        streakDays: 0, lastOrderDate: null, streakAchievedAt: null, agreedToTerms: false,
      };
      await saveUsers([...users, newUser]);
      // Save the password so they can log back in later
      await saveCredential(email, password);
      await saveUser(newUser);
      await saveLastEmail(email);
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
    // Note: we do NOT remove LAST_EMAIL_KEY or CREDENTIALS_KEY —
    // those stay so the login screen can pre-fill on next visit
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
      const alreadyAt5 = (user.streakDays ?? 0) >= 5;
      const streakAchievedAt =
        newStreak >= 5 && !alreadyAt5
          ? new Date().toISOString()
          : (user.streakAchievedAt ?? null);
      await saveUser({ ...user, streakDays: newStreak, lastOrderDate: today, streakAchievedAt });
    } catch (e) {
      console.warn("[Auth] Streak update error:", e);
    }
  };

  const value = useMemo(() => ({
    user, isLoading, login, loginDelivery, loginWithSavedAccount, register, logout,
    updateUser, agreeToTerms, updateStreak, getSavedEmail,
    getSavedAccounts, removeSavedAccount,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

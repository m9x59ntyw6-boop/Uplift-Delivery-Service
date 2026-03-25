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

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  agreeToTerms: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "@uplift_user";
const USERS_KEY = "@uplift_users";

const DEMO_USERS: User[] = [
  { id: "u1", name: "Tiamoy Johnson", email: "tiamoy@school.edu", role: "delivery", streakDays: 0, lastOrderDate: null, agreedToTerms: true },
  { id: "u2", name: "Mickii French", email: "mickii@school.edu", role: "delivery", streakDays: 0, lastOrderDate: null, agreedToTerms: true },
  { id: "u3", name: "Benjamin Haye", email: "benjamin@school.edu", role: "delivery", streakDays: 0, lastOrderDate: null, agreedToTerms: true },
  { id: "u4", name: "Gurvin Leachman", email: "gurvin@school.edu", role: "delivery", streakDays: 0, lastOrderDate: null, agreedToTerms: true },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  };

  const saveUser = async (u: User) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
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
    const nonDemo = users.filter(u => !DEMO_USERS.find(d => d.id === u.id));
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(nonDemo));
  };

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    const users = await getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (found) {
      await saveUser(found);
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    const users = await getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return false;
    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      streakDays: 0,
      lastOrderDate: null,
      agreedToTerms: false,
    };
    const updated = [...users, newUser];
    await saveUsers(updated);
    await saveUser(newUser);
    return true;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await saveUser(updated);
  };

  const agreeToTerms = async () => {
    if (!user) return;
    const updated = { ...user, agreedToTerms: true };
    await saveUser(updated);
  };

  const value = useMemo(() => ({
    user, isLoading, login, register, logout, updateUser, agreeToTerms,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

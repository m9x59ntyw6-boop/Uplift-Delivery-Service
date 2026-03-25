import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

export type FoodSize = "small" | "medium" | "large";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: "food" | "snack" | "drink";
  prices: { small: number; medium: number; large: number };
  available: boolean;
}

export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  size: FoodSize;
  price: number;
  quantity: number;
}

export type OrderStatus = "pending" | "accepted" | "preparing" | "on_the_way" | "delivered" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  userName: string;
  deliveryPersonId: string | null;
  deliveryPersonName: string | null;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  location: string;
  estimatedMinutes: number | null;
  discountApplied: number;
  streakDiscount: boolean;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  rating: number;
  ratingCount: number;
  totalEarnings: number;
  ordersCompleted: number;
  isAvailable: boolean;
}

interface OrderContextValue {
  menuItems: MenuItem[];
  cart: CartItem[];
  orders: Order[];
  deliveryPersons: DeliveryPerson[];
  addToCart: (item: MenuItem, size: FoodSize) => void;
  removeFromCart: (menuItemId: string, size: FoodSize) => void;
  clearCart: () => void;
  placeOrder: (deliveryPersonId: string, location: string) => Promise<Order | null>;
  acceptOrder: (orderId: string, deliveryPersonId: string, deliveryPersonName: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateMenuItems: (items: MenuItem[]) => Promise<void>;
  rateDelivery: (orderId: string, rating: number, review: string) => Promise<void>;
  getStreakDiscount: () => number;
  cartTotal: number;
  cartCount: number;
}

const OrderContext = createContext<OrderContextValue | null>(null);

const MENU_KEY = "@uplift_menu";
const ORDERS_KEY = "@uplift_orders";
const DELIVERY_KEY = "@uplift_delivery_persons";

const DEFAULT_MENU: MenuItem[] = [
  { id: "m1", name: "Jerk Chicken Meal", description: "Authentic Jamaican jerk chicken with rice & peas", emoji: "🍗", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m2", name: "Ackee & Saltfish", description: "Jamaica's national dish served with breadfruit", emoji: "🥘", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m3", name: "Curry Chicken", description: "Slow cooked curry chicken with white rice", emoji: "🍛", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m4", name: "Oxtail Stew", description: "Tender braised oxtail with butter beans", emoji: "🍲", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m5", name: "Veggie Patty", description: "Flaky Jamaican-style vegetable patty", emoji: "🥟", category: "snack", prices: { small: 400, medium: 500, large: 650 }, available: true },
  { id: "m6", name: "Beef Patty", description: "Spicy beef Jamaican patty with coco bread", emoji: "🥪", category: "snack", prices: { small: 450, medium: 550, large: 700 }, available: true },
  { id: "m7", name: "Sorrel Juice", description: "Sweet hibiscus and spice Jamaican drink", emoji: "🧃", category: "drink", prices: { small: 200, medium: 300, large: 400 }, available: true },
  { id: "m8", name: "Coconut Water", description: "Fresh chilled coconut water", emoji: "🥥", category: "drink", prices: { small: 150, medium: 250, large: 350 }, available: true },
  { id: "m9", name: "D&G Soda", description: "Ting, Cream Soda, or Kola Champagne", emoji: "🥤", category: "drink", prices: { small: 100, medium: 150, large: 200 }, available: true },
];

const DEFAULT_DELIVERY_PERSONS: DeliveryPerson[] = [
  { id: "u1", name: "Tiamoy Johnson", rating: 4.8, ratingCount: 42, totalEarnings: 25000, ordersCompleted: 38, isAvailable: true },
  { id: "u2", name: "Mickii French", rating: 4.9, ratingCount: 67, totalEarnings: 41000, ordersCompleted: 61, isAvailable: true },
  { id: "u3", name: "Benjamin Haye", rating: 4.7, ratingCount: 31, totalEarnings: 18000, ordersCompleted: 29, isAvailable: true },
  { id: "u4", name: "Gurvin Leachman", rating: 4.6, ratingCount: 55, totalEarnings: 32000, ordersCompleted: 50, isAvailable: false },
];

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>(DEFAULT_DELIVERY_PERSONS);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menuStored, ordersStored, dpStored] = await Promise.all([
        AsyncStorage.getItem(MENU_KEY),
        AsyncStorage.getItem(ORDERS_KEY),
        AsyncStorage.getItem(DELIVERY_KEY),
      ]);
      if (menuStored) setMenuItems(JSON.parse(menuStored));
      if (ordersStored) setOrders(JSON.parse(ordersStored));
      if (dpStored) setDeliveryPersons(JSON.parse(dpStored));
    } catch {}
  };

  const saveOrders = async (o: Order[]) => {
    setOrders(o);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(o));
  };

  const saveDeliveryPersons = async (dp: DeliveryPerson[]) => {
    setDeliveryPersons(dp);
    await AsyncStorage.setItem(DELIVERY_KEY, JSON.stringify(dp));
  };

  const addToCart = (item: MenuItem, size: FoodSize) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id && c.size === size);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id && c.size === size ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, menuItemName: item.name, size, price: item.prices[size], quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string, size: FoodSize) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === menuItemId && c.size === size);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.menuItemId === menuItemId && c.size === size ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => !(c.menuItemId === menuItemId && c.size === size));
    });
  };

  const clearCart = () => setCart([]);

  const getStreakDiscount = (): number => {
    if (!user) return 0;
    if (user.streakDays >= 3) return 0.10;
    if (user.streakDays >= 2) return 0.05;
    return 0;
  };

  const placeOrder = async (deliveryPersonId: string, location: string): Promise<Order | null> => {
    if (!user || cart.length === 0) return null;
    const dp = deliveryPersons.find(d => d.id === deliveryPersonId);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountRate = getStreakDiscount();
    const discount = Math.floor(subtotal * discountRate);
    const total = subtotal - discount;

    const order: Order = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      deliveryPersonId,
      deliveryPersonName: dp?.name ?? null,
      items: [...cart],
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location,
      estimatedMinutes: 15 + Math.floor(Math.random() * 20),
      discountApplied: discount,
      streakDiscount: discountRate > 0,
    };
    const updated = [order, ...orders];
    await saveOrders(updated);
    clearCart();
    return order;
  };

  const acceptOrder = async (orderId: string, deliveryPersonId: string, deliveryPersonName: string) => {
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status: "accepted" as OrderStatus, deliveryPersonId, deliveryPersonName, updatedAt: new Date().toISOString() } : o
    );
    await saveOrders(updated);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );
    await saveOrders(updated);
  };

  const updateMenuItems = async (items: MenuItem[]) => {
    setMenuItems(items);
    await AsyncStorage.setItem(MENU_KEY, JSON.stringify(items));
  };

  const rateDelivery = async (orderId: string, rating: number, review: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order?.deliveryPersonId) return;
    const dpId = order.deliveryPersonId;
    const updated = deliveryPersons.map(dp => {
      if (dp.id !== dpId) return dp;
      const newCount = dp.ratingCount + 1;
      const newRating = (dp.rating * dp.ratingCount + rating) / newCount;
      return { ...dp, rating: Math.round(newRating * 10) / 10, ratingCount: newCount };
    });
    await saveDeliveryPersons(updated);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(() => ({
    menuItems, cart, orders, deliveryPersons, addToCart, removeFromCart, clearCart,
    placeOrder, acceptOrder, updateOrderStatus, updateMenuItems, rateDelivery,
    getStreakDiscount, cartTotal, cartCount,
  }), [menuItems, cart, orders, deliveryPersons, user]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
}

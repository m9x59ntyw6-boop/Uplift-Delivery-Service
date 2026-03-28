import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "./AuthContext";

export const OPENING_HOURS = { openHour: 9, openMin: 0, closeHour: 15, closeMin: 30 };

export function isShopCurrentlyOpen(): boolean {
  const now = new Date();
  const total = now.getHours() * 60 + now.getMinutes();
  const open  = OPENING_HOURS.openHour  * 60 + OPENING_HOURS.openMin;
  const close = OPENING_HOURS.closeHour * 60 + OPENING_HOURS.closeMin;
  return total >= open && total < close;
}

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

export type OrderStatus =
  | "order_placed"
  | "restaurant_preparing"
  | "driver_assigned"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "declined";

export type PaymentMethod = "cash" | "ncb_mobile" | "scotia_mobile" | "card";

export interface JamaicaLocation {
  id: string;
  label: string;
  area: string;
  deliveryFee: number;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  deliveryPersonId: string | null;
  deliveryPersonName: string | null;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; message: string }[];
  createdAt: string;
  updatedAt: string;
  location: string;
  locationData: JamaicaLocation | null;
  estimatedMinutes: number | null;
  discountApplied: number;
  streakDiscount: boolean;
  driverLat?: number;
  driverLng?: number;
  declinedBy: string[];
  preferredDriverId?: string | null;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  rating: number;
  ratingCount: number;
  totalEarnings: number;
  ordersCompleted: number;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
}

export const JAMAICA_LOCATIONS: JamaicaLocation[] = [
  { id: "loc1", label: "Half Way Tree (HWT)", area: "Kingston", deliveryFee: 50, latitude: 17.9972, longitude: -76.7940, distanceKm: 3.2 },
  { id: "loc2", label: "Portmore", area: "St. Catherine", deliveryFee: 50, latitude: 17.9516, longitude: -76.8716, distanceKm: 12.5 },
  { id: "loc3", label: "New Kingston", area: "Kingston", deliveryFee: 50, latitude: 17.9940, longitude: -76.7900, distanceKm: 4.1 },
  { id: "loc4", label: "Constant Spring", area: "Kingston", deliveryFee: 50, latitude: 18.0372, longitude: -76.7970, distanceKm: 6.8 },
  { id: "loc5", label: "Liguanea", area: "Kingston", deliveryFee: 50, latitude: 18.0069, longitude: -76.7649, distanceKm: 2.1 },
  { id: "loc6", label: "Spanish Town", area: "St. Catherine", deliveryFee: 50, latitude: 17.9906, longitude: -76.9565, distanceKm: 18.3 },
  { id: "loc7", label: "Crossroads", area: "Kingston", deliveryFee: 50, latitude: 17.9927, longitude: -76.7975, distanceKm: 3.5 },
  { id: "loc8", label: "Barbican", area: "Kingston", deliveryFee: 50, latitude: 18.0214, longitude: -76.7620, distanceKm: 4.9 },
  { id: "loc9", label: "Papine", area: "Kingston", deliveryFee: 50, latitude: 18.0179, longitude: -76.7438, distanceKm: 1.2 },
  { id: "loc10", label: "Matilda's Corner", area: "Kingston", deliveryFee: 50, latitude: 18.0020, longitude: -76.7620, distanceKm: 2.6 },
  { id: "loc11", label: "Maxfield Avenue", area: "Kingston", deliveryFee: 50, latitude: 17.9870, longitude: -76.8010, distanceKm: 4.4 },
  { id: "loc12", label: "Three Miles", area: "Kingston", deliveryFee: 50, latitude: 17.9820, longitude: -76.8200, distanceKm: 5.8 },
  { id: "loc13", label: "UWI Mona Campus", area: "Kingston", deliveryFee: 50, latitude: 18.0029, longitude: -76.7481, distanceKm: 0.8 },
  { id: "loc14", label: "Meadowbrook", area: "Kingston", deliveryFee: 50, latitude: 18.0200, longitude: -76.7830, distanceKm: 4.0 },
  { id: "loc15", label: "Stony Hill", area: "Kingston", deliveryFee: 50, latitude: 18.0647, longitude: -76.7711, distanceKm: 9.1 },
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; description: string }[] = [
  { id: "cash", label: "Cash on Delivery", icon: "💵", description: "Pay when your order arrives" },
  { id: "ncb_mobile", label: "NCB Mobile Money", icon: "📱", description: "Pay via NCB Lynk" },
  { id: "scotia_mobile", label: "Scotia Mobile", icon: "🏦", description: "Pay via Scotiabank mobile" },
  { id: "card", label: "Card (VISA/MC)", icon: "💳", description: "Credit or debit card" },
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  order_placed: "Order Placed",
  restaurant_preparing: "Restaurant Preparing",
  driver_assigned: "Driver Assigned",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  declined: "Declined",
};

export const STATUS_MESSAGES: Record<OrderStatus, string> = {
  order_placed: "Your order has been placed successfully",
  restaurant_preparing: "The restaurant is preparing your food",
  driver_assigned: "A driver has accepted your order",
  out_for_delivery: "Your driver is on the way to you",
  delivered: "Your order has been delivered!",
  cancelled: "Your order was cancelled",
  declined: "No driver available, please try again",
};

const STATUS_FLOW: OrderStatus[] = [
  "order_placed",
  "restaurant_preparing",
  "driver_assigned",
  "out_for_delivery",
  "delivered",
];

interface OrderContextValue {
  menuItems: MenuItem[];
  cart: CartItem[];
  orders: Order[];
  deliveryPersons: DeliveryPerson[];
  isShopOpen: boolean;
  addToCart: (item: MenuItem, size: FoodSize) => void;
  removeFromCart: (menuItemId: string, size: FoodSize) => void;
  clearCart: () => void;
  placeOrder: (locationId: string, paymentMethod: PaymentMethod, customLabel?: string, preferredDriverId?: string) => Promise<Order | null>;
  acceptOrder: (orderId: string, deliveryPersonId: string, deliveryPersonName: string) => Promise<void>;
  declineOrder: (orderId: string, deliveryPersonId: string) => Promise<void>;
  advanceOrderStatus: (orderId: string) => Promise<void>;
  updateMenuItems: (items: MenuItem[]) => Promise<void>;
  rateDelivery: (orderId: string, rating: number, review: string) => Promise<void>;
  getStreakDiscount: () => number;
  getDeliveryFee: (locationId: string) => number;
  cartTotal: number;
  cartCount: number;
}

const OrderContext = createContext<OrderContextValue | null>(null);

const MENU_KEY = "@uplift_menu_v2";
const ORDERS_KEY = "@uplift_orders_v3";
const DELIVERY_KEY = "@uplift_delivery_persons_v2";

const DEFAULT_MENU: MenuItem[] = [
  { id: "m1", name: "Jerk Chicken Meal", description: "Authentic Jamaican jerk chicken with rice & peas", emoji: "🍗", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m2", name: "Ackee & Saltfish", description: "Jamaica's national dish served with breadfruit", emoji: "🥘", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m3", name: "Curry Chicken", description: "Slow cooked curry chicken with white rice", emoji: "🍛", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m4", name: "Oxtail Stew", description: "Tender braised oxtail with butter beans", emoji: "🍲", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m5", name: "Jerk Pork", description: "Slow-pit jerk pork with festival", emoji: "🥩", category: "food", prices: { small: 750, medium: 850, large: 1000 }, available: true },
  { id: "m6", name: "Veggie Patty", description: "Flaky Jamaican-style vegetable patty", emoji: "🥟", category: "snack", prices: { small: 400, medium: 500, large: 650 }, available: true },
  { id: "m7", name: "Beef Patty & Coco Bread", description: "Spicy beef Jamaican patty with coco bread", emoji: "🥪", category: "snack", prices: { small: 450, medium: 550, large: 700 }, available: true },
  { id: "m8", name: "Bammy & Cheese", description: "Cassava bammy with cheddar cheese", emoji: "🧀", category: "snack", prices: { small: 350, medium: 450, large: 600 }, available: true },
  { id: "m9", name: "Sorrel Juice", description: "Sweet hibiscus and spice Jamaican drink", emoji: "🧃", category: "drink", prices: { small: 200, medium: 300, large: 400 }, available: true },
  { id: "m10", name: "Coconut Water", description: "Fresh chilled coconut water", emoji: "🥥", category: "drink", prices: { small: 150, medium: 250, large: 350 }, available: true },
  { id: "m11", name: "D&G Soda", description: "Ting, Cream Soda, or Kola Champagne", emoji: "🥤", category: "drink", prices: { small: 100, medium: 150, large: 200 }, available: true },
  { id: "m12", name: "Sea Moss Shake", description: "Natural Jamaican sea moss health shake", emoji: "🥛", category: "drink", prices: { small: 250, medium: 350, large: 450 }, available: true },
];

const DEFAULT_DELIVERY_PERSONS: DeliveryPerson[] = [
  { id: "u1", name: "Tiamoy Johnson", rating: 4.8, ratingCount: 42, totalEarnings: 25000, ordersCompleted: 38, isAvailable: true, currentLat: 18.0050, currentLng: -76.7500 },
  { id: "u2", name: "Mickii French", rating: 4.9, ratingCount: 67, totalEarnings: 41000, ordersCompleted: 61, isAvailable: true, currentLat: 18.0020, currentLng: -76.7460 },
  { id: "u3", name: "Benjamin Haye", rating: 4.7, ratingCount: 31, totalEarnings: 18000, ordersCompleted: 29, isAvailable: true, currentLat: 18.0000, currentLng: -76.7520 },
  { id: "u4", name: "Gurvin Leachman", rating: 4.6, ratingCount: 55, totalEarnings: 32000, ordersCompleted: 50, isAvailable: false, currentLat: 18.0100, currentLng: -76.7480 },
];

function makeStatusHistory(status: OrderStatus): { status: OrderStatus; timestamp: string; message: string }[] {
  return [{ status, timestamp: new Date().toISOString(), message: STATUS_MESSAGES[status] }];
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>(DEFAULT_DELIVERY_PERSONS);
  const [isShopOpen, setIsShopOpen] = useState(isShopCurrentlyOpen());

  useEffect(() => {
    const id = setInterval(() => setIsShopOpen(isShopCurrentlyOpen()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { loadData(); }, []);

  // ── Reload orders/data when app returns to foreground ──────────────────────
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        loadData();
        setIsShopOpen(isShopCurrentlyOpen());
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  const loadData = async () => {
    try {
      const [menuStored, ordersStored, dpStored] = await Promise.all([
        AsyncStorage.getItem(MENU_KEY).catch(() => null),
        AsyncStorage.getItem(ORDERS_KEY).catch(() => null),
        AsyncStorage.getItem(DELIVERY_KEY).catch(() => null),
      ]);

      // Always check before parsing — malformed data should not crash the app
      if (menuStored) {
        try { setMenuItems(JSON.parse(menuStored)); } catch { console.warn("[Orders] Could not parse menu data"); }
      }
      if (ordersStored) {
        try { setOrders(JSON.parse(ordersStored)); } catch { console.warn("[Orders] Could not parse orders data"); }
      }
      if (dpStored) {
        try { setDeliveryPersons(JSON.parse(dpStored)); } catch { console.warn("[Orders] Could not parse delivery persons data"); }
      }
    } catch (e) {
      console.warn("[Orders] Failed to load data:", e);
    }
  };

  const saveOrders = async (o: Order[]) => {
    // Always update state immediately — storage failure should not block the UI
    setOrders(o);
    try {
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(o));
    } catch (e) {
      console.warn("[Orders] Failed to save orders:", e);
    }
  };

  const saveDeliveryPersons = async (dp: DeliveryPerson[]) => {
    setDeliveryPersons(dp);
    try {
      await AsyncStorage.setItem(DELIVERY_KEY, JSON.stringify(dp));
    } catch (e) {
      console.warn("[Orders] Failed to save delivery persons:", e);
    }
  };

  const addToCart = (item: MenuItem, size: FoodSize) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id && c.size === size);
      if (existing) return prev.map(c => c.menuItemId === item.id && c.size === size ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, menuItemName: item.name, size, price: item.prices[size], quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string, size: FoodSize) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === menuItemId && c.size === size);
      if (existing && existing.quantity > 1) return prev.map(c => c.menuItemId === menuItemId && c.size === size ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => !(c.menuItemId === menuItemId && c.size === size));
    });
  };

  const clearCart = () => setCart([]);

  const getStreakDiscount = (): number => 0;

  const getDeliveryFee = (_locationId: string): number => {
    if (user && user.streakDays >= 5) return 0;
    return 50;
  };

  const placeOrder = async (locationId: string, paymentMethod: PaymentMethod, customLabel?: string, preferredDriverId?: string): Promise<Order | null> => {
    try {
    if (!user || cart.length === 0) return null;
    const isCustom = locationId === "custom";
    const locationData = isCustom ? null : (JAMAICA_LOCATIONS.find(l => l.id === locationId) ?? null);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountRate = getStreakDiscount();
    const discount = Math.floor(subtotal * discountRate);
    const deliveryFee = getDeliveryFee(locationId);
    const total = subtotal - discount + deliveryFee;

    const order: Order = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      deliveryPersonId: null,
      deliveryPersonName: null,
      items: [...cart],
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      status: "order_placed",
      statusHistory: makeStatusHistory("order_placed"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: locationId === "custom" ? (customLabel ?? "Custom Address") : (locationData?.label ?? locationId),
      locationData,
      estimatedMinutes: 15 + Math.floor(Math.random() * 20),
      discountApplied: discount,
      streakDiscount: discountRate > 0,
      declinedBy: [],
      preferredDriverId: preferredDriverId ?? null,
    };
    await saveOrders([order, ...orders]);
    clearCart();
    return order;
    } catch (e) {
      console.warn("[Orders] Failed to place order:", e);
      return null;
    }
  };

  const acceptOrder = async (orderId: string, deliveryPersonId: string, deliveryPersonName: string) => {
    const newStatus: OrderStatus = "driver_assigned";
    const updated = orders.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: newStatus,
        deliveryPersonId,
        deliveryPersonName,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...(o.statusHistory ?? []),
          { status: "restaurant_preparing" as OrderStatus, timestamp: new Date().toISOString(), message: STATUS_MESSAGES["restaurant_preparing"] },
          { status: newStatus, timestamp: new Date(Date.now() + 1000).toISOString(), message: `${deliveryPersonName} has accepted your order` },
        ],
      };
    });
    await saveOrders(updated);
    const updatedDPs = deliveryPersons.map(dp =>
      dp.id === deliveryPersonId ? { ...dp, isAvailable: false } : dp
    );
    await saveDeliveryPersons(updatedDPs);
  };

  const declineOrder = async (orderId: string, deliveryPersonId: string) => {
    const updated = orders.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, declinedBy: [...(o.declinedBy ?? []), deliveryPersonId], updatedAt: new Date().toISOString() };
    });
    await saveOrders(updated);
  };

  const advanceOrderStatus = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const currentIdx = STATUS_FLOW.indexOf(order.status as any);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    const updated = orders.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
        statusHistory: [...(o.statusHistory ?? []), { status: nextStatus, timestamp: new Date().toISOString(), message: STATUS_MESSAGES[nextStatus] }],
      };
    });
    await saveOrders(updated);
    if (nextStatus === "delivered" && order.deliveryPersonId) {
      const updatedDPs = deliveryPersons.map(dp =>
        dp.id === order.deliveryPersonId ? { ...dp, isAvailable: true } : dp
      );
      await saveDeliveryPersons(updatedDPs);
    }
  };

  const updateMenuItems = async (items: MenuItem[]) => {
    setMenuItems(items);
    await AsyncStorage.setItem(MENU_KEY, JSON.stringify(items));
  };

  const rateDelivery = async (orderId: string, rating: number, _review: string) => {
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
    menuItems, cart, orders, deliveryPersons, isShopOpen,
    addToCart, removeFromCart, clearCart,
    placeOrder, acceptOrder, declineOrder, advanceOrderStatus,
    updateMenuItems, rateDelivery, getStreakDiscount, getDeliveryFee,
    cartTotal, cartCount,
  }), [menuItems, cart, orders, deliveryPersons, user, isShopOpen]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
}

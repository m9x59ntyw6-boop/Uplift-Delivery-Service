import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Order, OrderStatus, STATUS_LABELS, STATUS_MESSAGES, useOrders } from "@/contexts/OrderContext";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MapErrorBoundary } from "@/components/SafeMapView";

const STATUS_FLOW: OrderStatus[] = [
  "order_placed",
  "restaurant_preparing",
  "driver_assigned",
  "out_for_delivery",
  "delivered",
];

const STATUS_ICONS: Record<string, string> = {
  order_placed: "receipt",
  restaurant_preparing: "restaurant",
  driver_assigned: "person",
  out_for_delivery: "bicycle",
  delivered: "checkmark-circle",
};

const STATUS_COLORS: Record<string, string> = {
  order_placed: Colors.primary,
  restaurant_preparing: Colors.accent,
  driver_assigned: Colors.deliveryBlue,
  out_for_delivery: Colors.warning,
  delivered: Colors.success,
  cancelled: Colors.danger,
  declined: Colors.danger,
};

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.pulseDot, { backgroundColor: color, transform: [{ scale: pulse }] }]} />
  );
}

export default function OrderTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const { orders, rateDelivery } = useOrders();
  const { user } = useAuth();
  const { getOrCreateRoom } = useChat();
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const order = orders.find(o => o.id === orderId);

  const currentIdx = STATUS_FLOW.indexOf((order?.status ?? "order_placed") as any);
  const isTerminal = order?.status === "delivered" || order?.status === "cancelled" || order?.status === "declined";

  const openChat = () => {
    if (!user || !order) return;
    getOrCreateRoom(order.id, user.id, user.name);
    router.push({ pathname: "/(student)/chat-room", params: { orderId: order.id } });
  };

  const handleRate = async (r: number) => {
    if (!order) return;
    setRating(r);
    await rateDelivery(order.id, r, "");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowRating(false);
  };

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Pressable onPress={() => router.replace("/(student)/orders")} style={styles.backToOrdersBtn}>
            <Text style={styles.backToOrdersText}>Back to Orders</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[order.status] ?? Colors.primary;
  const driverLat = order.driverLat ?? (order.locationData?.latitude ?? 18.0179) + 0.005;
  const driverLng = order.driverLng ?? (order.locationData?.longitude ?? -76.8099) + 0.003;
  const destLat = order.locationData?.latitude ?? 18.0179;
  const destLng = order.locationData?.longitude ?? -76.8099;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/(student)/orders")} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Tracking Order</Text>
          <Text style={styles.headerSub}>#{order.id.slice(-6).toUpperCase()}</Text>
        </View>
        <Pressable onPress={openChat} style={styles.chatBtn}>
          <Feather name="message-circle" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapErrorBoundary style={styles.map}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (driverLat + destLat) / 2,
                longitude: (driverLng + destLng) / 2,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              }}
            >
              {order.deliveryPersonName && (
                <Marker coordinate={{ latitude: driverLat, longitude: driverLng }} title={order.deliveryPersonName} description="Your driver">
                  <View style={styles.driverMarker}>
                    <Ionicons name="bicycle" size={18} color="#fff" />
                  </View>
                </Marker>
              )}
              <Marker coordinate={{ latitude: destLat, longitude: destLng }} title="Delivery Location" description={order.location} pinColor={Colors.primary} />
              {order.deliveryPersonName && (
                <Polyline
                  coordinates={[
                    { latitude: driverLat, longitude: driverLng },
                    { latitude: (driverLat + destLat) / 2, longitude: (driverLng + destLng) / 2 - 0.002 },
                    { latitude: destLat, longitude: destLng },
                  ]}
                  strokeColor={Colors.primary}
                  strokeWidth={3}
                  lineDashPattern={[6, 3]}
                />
              )}
            </MapView>
          </MapErrorBoundary>
          {/* Live indicator */}
          {order.status === "out_for_delivery" && (
            <View style={styles.liveChip}>
              <PulsingDot color={Colors.success} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
        </View>

        {/* Current Status Banner */}
        <View style={[styles.statusBanner, { borderColor: `${statusColor}50`, backgroundColor: `${statusColor}12` }]}>
          <Ionicons name={STATUS_ICONS[order.status] as any ?? "time"} size={24} color={statusColor} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusBannerTitle, { color: statusColor }]}>{STATUS_LABELS[order.status]}</Text>
            <Text style={styles.statusBannerSub}>{order.statusHistory?.[order.statusHistory.length - 1]?.message ?? STATUS_MESSAGES[order.status]}</Text>
          </View>
          {order.status === "out_for_delivery" && order.estimatedMinutes && (
            <View style={styles.etaBox}>
              <Text style={styles.etaNum}>{order.estimatedMinutes}</Text>
              <Text style={styles.etaUnit}>min</Text>
            </View>
          )}
        </View>

        {/* Driver info */}
        {order.deliveryPersonName && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>{order.deliveryPersonName.charAt(0)}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{order.deliveryPersonName}</Text>
              <Text style={styles.driverSub}>Your delivery driver</Text>
            </View>
            <View style={styles.driverActions}>
              <Pressable style={styles.driverActionBtn} onPress={openChat}>
                <Feather name="message-circle" size={18} color={Colors.primary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Status Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Order Journey</Text>
          {STATUS_FLOW.map((s, i) => {
            const done = currentIdx >= i;
            const active = currentIdx === i && !isTerminal;
            const color = done ? (active ? statusColor : Colors.success) : Colors.border;
            const hist = order.statusHistory?.find(h => h.status === s);
            return (
              <View key={s} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: done ? color : Colors.backgroundElevated, borderColor: color }]}>
                    {done
                      ? (active
                        ? <PulsingDot color={color} />
                        : <Feather name="check" size={12} color="#fff" />)
                      : <View style={[styles.innerDot, { backgroundColor: Colors.border }]} />
                    }
                  </View>
                  {i < STATUS_FLOW.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: currentIdx > i ? Colors.success : Colors.border }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, done && { color: Colors.text }, active && { color }]}>{STATUS_LABELS[s]}</Text>
                  {hist && <Text style={styles.timelineTime}>{new Date(hist.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>}
                  {active && <Text style={[styles.timelineMsg, { color }]}>{STATUS_MESSAGES[s]}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Order Details */}
        <View style={styles.orderDetailsCard}>
          <Text style={styles.timelineTitle}>Order Details</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.quantity}x {item.menuItemName} ({item.size})</Text>
              <Text style={styles.orderItemPrice}>J${(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.orderItem}><Text style={styles.orderItemLabel}>Subtotal</Text><Text style={styles.orderItemPrice}>J${order.subtotal?.toLocaleString() ?? order.total.toLocaleString()}</Text></View>
          {order.discountApplied > 0 && (
            <View style={styles.orderItem}>
              <Text style={[styles.orderItemLabel, { color: Colors.streakOrange }]}>Streak Discount</Text>
              <Text style={[styles.orderItemPrice, { color: Colors.streakOrange }]}>-J${order.discountApplied.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.orderItem}><Text style={styles.orderItemLabel}>Delivery Fee</Text><Text style={styles.orderItemPrice}>J${order.deliveryFee?.toLocaleString() ?? "200"}</Text></View>
          <View style={[styles.orderItem, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>J${order.total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Rate Delivery */}
        {order.status === "delivered" && (
          <View style={styles.rateCard}>
            <Text style={styles.rateTitle}>Rate your delivery</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Pressable key={s} onPress={() => handleRate(s)}>
                  <Ionicons name={s <= rating ? "star" : "star-outline"} size={36} color={s <= rating ? Colors.ratingYellow : Colors.textMuted} />
                </Pressable>
              ))}
            </View>
            {rating > 0 && <Text style={styles.ratedText}>Thanks for rating {order.deliveryPersonName?.split(" ")[0]}!</Text>}
          </View>
        )}

        {/* Cancelled / Declined */}
        {(order.status === "cancelled" || order.status === "declined") && (
          <Pressable style={styles.reorderBtn} onPress={() => router.replace("/(student)")}>
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.reorderText}>Browse Menu Again</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  backToOrdersBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backToOrdersText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  chatBtn: { padding: 8 },
  scrollContent: { paddingHorizontal: 20, gap: 14 },
  mapContainer: { height: 220, borderRadius: 18, overflow: "hidden", position: "relative" },
  map: { flex: 1 },
  liveChip: {
    position: "absolute", top: 10, right: 10,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(10,15,30,0.85)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.success },
  driverMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  statusBannerTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statusBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  etaBox: { alignItems: "center", backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 10, padding: 8, minWidth: 50 },
  etaNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.warning },
  etaUnit: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  driverCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.backgroundCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  driverAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  driverInitial: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  driverSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  driverActions: { flexDirection: "row", gap: 8 },
  driverActionBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(26,115,232,0.12)", alignItems: "center", justifyContent: "center" },
  timelineCard: { backgroundColor: Colors.backgroundCard, borderRadius: 16, padding: 16, gap: 0, borderWidth: 1, borderColor: Colors.border },
  timelineTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 14 },
  timelineRow: { flexDirection: "row", gap: 14, minHeight: 50 },
  timelineLeft: { alignItems: "center", width: 24 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  innerDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLine: { flex: 1, width: 2, marginTop: 2, minHeight: 16 },
  timelineContent: { flex: 1, paddingBottom: 12 },
  timelineLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
  timelineTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  timelineMsg: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  orderDetailsCard: { backgroundColor: Colors.backgroundCard, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.border },
  orderItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderItemName: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
  orderItemLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  orderItemPrice: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  totalRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.primary },
  rateCard: { backgroundColor: Colors.backgroundCard, borderRadius: 16, padding: 16, alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" },
  rateTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  starsRow: { flexDirection: "row", gap: 8 },
  ratedText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.ratingYellow },
  reorderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, borderRadius: 14, height: 52 },
  reorderText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

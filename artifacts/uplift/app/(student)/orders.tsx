import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Order, OrderStatus, STATUS_LABELS, useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  order_placed: Colors.primary,
  restaurant_preparing: Colors.accent,
  driver_assigned: Colors.deliveryBlue,
  out_for_delivery: Colors.warning,
  delivered: Colors.success,
  cancelled: Colors.danger,
  declined: Colors.danger,
};

const STATUS_ICONS: Record<string, any> = {
  order_placed: "receipt",
  restaurant_preparing: "restaurant",
  driver_assigned: "person-circle",
  out_for_delivery: "bicycle",
  delivered: "checkmark-circle",
  cancelled: "close-circle",
  declined: "close-circle",
};

const PAYMENT_ICONS: Record<string, string> = {
  cash: "💵",
  ncb_mobile: "📱",
  scotia_mobile: "🏦",
  card: "💳",
};

function OrderCard({ order }: { order: Order }) {
  const color = STATUS_COLORS[order.status] ?? Colors.textMuted;
  const icon = STATUS_ICONS[order.status] ?? "time";
  const isActive = !["delivered", "cancelled", "declined"].includes(order.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/(student)/order-tracking", params: { orderId: order.id } });
      }}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString("en-JM", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${color}18`, borderColor: `${color}50` }]}>
          <Ionicons name={icon} size={13} color={color} />
          <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[order.status]}</Text>
        </View>
      </View>

      {/* Mini Timeline (active orders only) */}
      {isActive && (
        <View style={styles.miniTimeline}>
          {(["order_placed", "restaurant_preparing", "driver_assigned", "out_for_delivery", "delivered"] as OrderStatus[]).map((s, i) => {
            const statusIdx = ["order_placed", "restaurant_preparing", "driver_assigned", "out_for_delivery", "delivered"].indexOf(order.status);
            const done = statusIdx >= i;
            return (
              <React.Fragment key={s}>
                <View style={[styles.miniDot, done && { backgroundColor: STATUS_COLORS[s] ?? Colors.primary }]} />
                {i < 4 && <View style={[styles.miniLine, done && i < statusIdx && { backgroundColor: Colors.success }]} />}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {/* Items */}
      <View style={styles.itemsPreview}>
        {order.items.slice(0, 2).map((item, i) => (
          <Text key={i} style={styles.itemText}>{item.quantity}x {item.menuItemName} ({item.size})</Text>
        ))}
        {order.items.length > 2 && <Text style={styles.moreText}>+{order.items.length - 2} more</Text>}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.locationRow}>
            <Ionicons name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>{order.location}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentIcon}>{PAYMENT_ICONS[order.paymentMethod] ?? "💵"}</Text>
            <Text style={styles.paymentText}>{order.paymentMethod === "cash" ? "Cash on Delivery" : order.paymentMethod === "card" ? "Card" : "Mobile Money"}</Text>
          </View>
        </View>
        <View style={styles.footerRight}>
          {order.discountApplied > 0 && (
            <View style={styles.discountTag}>
              <Ionicons name="flame" size={10} color={Colors.streakOrange} />
              <Text style={styles.discountTagText}>Discount applied</Text>
            </View>
          )}
          <Text style={styles.totalAmount}>J${order.total.toLocaleString()}</Text>
          <Pressable
            style={styles.trackBtn}
            onPress={() => router.push({ pathname: "/(student)/order-tracking", params: { orderId: order.id } })}
          >
            <Text style={styles.trackBtnText}>{isActive ? "Track" : "Details"}</Text>
            <Feather name="arrow-right" size={12} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Driver banner for active */}
      {order.deliveryPersonName && isActive && (
        <View style={styles.driverBanner}>
          <View style={styles.driverAvatarSmall}>
            <Text style={styles.driverInitial}>{order.deliveryPersonName.charAt(0)}</Text>
          </View>
          <Text style={styles.driverBannerText}>{order.deliveryPersonName} is your driver</Text>
          {order.status === "out_for_delivery" && order.estimatedMinutes && (
            <View style={styles.etaBadge}>
              <Ionicons name="time" size={11} color={Colors.warning} />
              <Text style={styles.etaText}>~{order.estimatedMinutes} min</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { orders } = useOrders();
  const { user } = useAuth();
  const myOrders = orders.filter(o => o.userId === user?.id);
  const active = myOrders.filter(o => !["delivered", "cancelled", "declined"].includes(o.status));
  const past = myOrders.filter(o => ["delivered", "cancelled", "declined"].includes(o.status));

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        {active.length > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{active.length} active</Text>
          </View>
        )}
      </View>

      <FlatList
        data={myOrders}
        keyExtractor={o => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={active.length > 0 ? (
          <Text style={styles.sectionLabel}>Active Orders</Text>
        ) : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Browse the menu and place your first order</Text>
            <Pressable style={styles.browseBtn} onPress={() => router.replace("/(student)")}>
              <Text style={styles.browseBtnText}>Browse Menu</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  activeBadge: { backgroundColor: "rgba(34,197,94,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(34,197,94,0.3)" },
  activeBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.success },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 0,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14, paddingBottom: 10 },
  orderId: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text },
  orderDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  miniTimeline: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 10, gap: 0 },
  miniDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  miniLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 3 },
  itemsPreview: { paddingHorizontal: 14, paddingBottom: 10, gap: 3 },
  itemText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  moreText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  cardFooter: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14 },
  footerLeft: { flex: 1, gap: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, flex: 1 },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  paymentIcon: { fontSize: 12 },
  paymentText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  footerRight: { alignItems: "flex-end", gap: 4 },
  discountTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  discountTagText: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.streakOrange },
  totalAmount: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.primary },
  trackBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  trackBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  driverBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(26,115,232,0.08)",
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  driverAvatarSmall: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  driverInitial: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  driverBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.text },
  etaBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  etaText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.warning },
  empty: { alignItems: "center", paddingTop: 70, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },
  browseBtn: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { Colors } from "@/constants/colors";
import { Order, OrderStatus, useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  accepted: Colors.primary,
  preparing: Colors.accent,
  on_the_way: Colors.success,
  delivered: Colors.success,
  cancelled: Colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "New Order",
  accepted: "Accepted",
  preparing: "Preparing",
  on_the_way: "Delivering",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: "preparing",
  preparing: "on_the_way",
  on_the_way: "delivered",
};

const NEXT_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  accepted: "Mark Preparing",
  preparing: "Out for Delivery",
  on_the_way: "Mark Delivered",
};

function OrderDeliveryCard({ order }: { order: Order }) {
  const { acceptOrder, updateOrderStatus } = useOrders();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const insets = useSafeAreaInsets();

  const color = STATUS_COLORS[order.status] ?? Colors.textMuted;

  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);
    await acceptOrder(order.id, user.id, user.name);
    setLoading(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleNext = async () => {
    const next = NEXT_STATUS[order.status as OrderStatus];
    if (!next) return;
    setLoading(true);
    await updateOrderStatus(order.id, next);
    setLoading(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderTime}>{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${color}22`, borderColor: `${color}60` }]}>
          <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[order.status] ?? order.status}</Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <Ionicons name="person-circle" size={16} color={Colors.primary} />
        <Text style={styles.customerName}>{order.userName}</Text>
        <Feather name="map-pin" size={13} color={Colors.textMuted} />
        <Text style={styles.locationText} numberOfLines={1}>{order.location}</Text>
      </View>

      <View style={styles.itemsSummary}>
        <Feather name="package" size={14} color={Colors.textMuted} />
        <Text style={styles.itemsSummaryText}>{totalItems} item{totalItems !== 1 ? "s" : ""}</Text>
        {order.items.slice(0, 2).map((item, i) => (
          <Text key={i} style={styles.itemChip}>{item.menuItemName}</Text>
        ))}
        {order.items.length > 2 && <Text style={styles.moreItems}>+{order.items.length - 2}</Text>}
      </View>

      <View style={styles.orderBottom}>
        <View>
          <Text style={styles.orderAmount}>J${order.total.toLocaleString()}</Text>
          {order.streakDiscount && (
            <Text style={styles.discountNote}>Discount applied</Text>
          )}
        </View>
        <View style={styles.actionRow}>
          {order.status === "accepted" || order.status === "on_the_way" ? (
            <Pressable
              style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
              onPress={() => setShowNav(true)}
            >
              <Feather name="navigation" size={14} color="#fff" />
            </Pressable>
          ) : null}
          {order.status === "pending" ? (
            <Pressable
              style={({ pressed }) => [styles.acceptBtn, loading && styles.disabled, pressed && styles.pressed]}
              onPress={handleAccept}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <>
                <Feather name="check" size={14} color="#fff" />
                <Text style={styles.acceptBtnText}>Accept</Text>
              </>}
            </Pressable>
          ) : NEXT_STATUS[order.status as OrderStatus] ? (
            <Pressable
              style={({ pressed }) => [styles.nextBtn, loading && styles.disabled, pressed && styles.pressed]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={styles.nextBtnText}>{NEXT_STATUS_LABELS[order.status as OrderStatus]}</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      <Modal visible={showNav} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowNav(false)}>
        <View style={[styles.navModal, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 10, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom }]}>
          <View style={styles.navHeader}>
            <Text style={styles.navTitle}>Navigation</Text>
            <Pressable onPress={() => setShowNav(false)}>
              <Feather name="x" size={22} color={Colors.text} />
            </Pressable>
          </View>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 18.0179,
              longitude: -76.8099,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
          >
            <Marker
              coordinate={{ latitude: 18.0179, longitude: -76.8099 }}
              title="Delivery Location"
              description={order.location}
              pinColor="blue"
            />
            <Marker
              coordinate={{ latitude: 18.0210, longitude: -76.8050 }}
              title="Your Location"
              pinColor="green"
            />
          </MapView>
          <View style={styles.navInfo}>
            <View style={styles.navInfoRow}>
              <Ionicons name="person" size={16} color={Colors.primary} />
              <Text style={styles.navInfoText}>{order.userName}</Text>
            </View>
            <View style={styles.navInfoRow}>
              <Feather name="map-pin" size={16} color={Colors.accent} />
              <Text style={styles.navInfoText}>{order.location}</Text>
            </View>
            <View style={styles.navInfoRow}>
              <Ionicons name="time" size={16} color={Colors.warning} />
              <Text style={styles.navInfoText}>Est. {order.estimatedMinutes} minutes</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function DeliveryOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { orders } = useOrders();
  const { user } = useAuth();

  const activeOrders = orders.filter(o =>
    o.status === "pending" ||
    (o.deliveryPersonId === user?.id && ["accepted", "preparing", "on_the_way"].includes(o.status))
  );

  const recentDelivered = orders.filter(o =>
    o.deliveryPersonId === user?.id && o.status === "delivered"
  ).slice(0, 5);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ready to deliver,</Text>
          <Text style={styles.headerTitle}>{user?.name?.split(" ")[0] ?? "Driver"}</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      <FlatList
        data={[...activeOrders]}
        keyExtractor={o => o.id}
        renderItem={({ item }) => <OrderDeliveryCard order={item} />}
        ListHeaderComponent={
          activeOrders.length > 0 ? (
            <Text style={styles.sectionHeader}>Active Orders ({activeOrders.length})</Text>
          ) : null
        }
        ListFooterComponent={
          recentDelivered.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionHeader}>Recent Deliveries</Text>
              {recentDelivered.map(o => (
                <View key={o.id} style={[styles.orderCard, { opacity: 0.6 }]}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>#{o.id.slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.4)" }]}>
                      <Text style={[styles.statusText, { color: Colors.success }]}>Delivered</Text>
                    </View>
                  </View>
                  <Text style={styles.customerName}>{o.userName} · J${o.total.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No active orders</Text>
            <Text style={styles.emptySubtitle}>New orders will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.success },
  listContent: { paddingHorizontal: 20, gap: 10 },
  sectionHeader: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  orderCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  orderTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  customerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  customerName: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  locationText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, flex: 1 },
  itemsSummary: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  itemsSummaryText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  itemChip: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  moreItems: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderAmount: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.success },
  discountNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 8 },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.deliveryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  acceptBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  nextBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  nextBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  navModal: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  navHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  navTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  map: { flex: 1, borderRadius: 16, overflow: "hidden" },
  navInfo: { paddingVertical: 14, gap: 10 },
  navInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  navInfoText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text },
});

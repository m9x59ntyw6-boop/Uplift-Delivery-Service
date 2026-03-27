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
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MapErrorBoundary } from "@/components/SafeMapView";
import { Colors } from "@/constants/colors";
import { Order, STATUS_LABELS, useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";

const SCHOOL_LAT = 18.0029;
const SCHOOL_LNG = -76.7481;

const DRIVER_EARNINGS_RATE = 0.15;

function OfferCard({ order, driverId, driverName }: { order: Order; driverId: string; driverName: string }) {
  const { acceptOrder, declineOrder, advanceOrderStatus } = useOrders();
  const [loading, setLoading] = useState<"accept" | "decline" | "advance" | null>(null);
  const [showNav, setShowNav] = useState(false);
  const insets = useSafeAreaInsets();

  const isMyOrder = order.deliveryPersonId === driverId;
  const distanceKm = order.locationData?.distanceKm ?? 3.0;
  const earnings = Math.round(order.total * DRIVER_EARNINGS_RATE + (order.deliveryFee ?? 150));
  const estimatedMin = Math.round(distanceKm * 4 + 8);

  const destLat = order.locationData?.latitude ?? 18.0100;
  const destLng = order.locationData?.longitude ?? -76.8000;

  const handleAccept = async () => {
    setLoading("accept");
    await acceptOrder(order.id, driverId, driverName);
    setLoading(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDecline = async () => {
    setLoading("decline");
    await declineOrder(order.id, driverId);
    setLoading(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAdvance = async () => {
    setLoading("advance");
    await advanceOrderStatus(order.id);
    setLoading(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getNextLabel = () => {
    switch (order.status) {
      case "driver_assigned": return "Mark Preparing";
      case "restaurant_preparing": return "Out for Delivery";
      case "out_for_delivery": return "Mark Delivered ✓";
      default: return "Update Status";
    }
  };

  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  const isPending = order.status === "order_placed" && !isMyOrder;

  return (
    <View style={[styles.offerCard, isMyOrder && styles.myOrderCard]}>
      {/* Header */}
      <View style={styles.offerHeader}>
        <View style={styles.offerHeaderLeft}>
          <Text style={styles.offerOrderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.offerCustomer}>{order.userName}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: isPending ? "rgba(245,158,11,0.15)" : "rgba(26,115,232,0.15)" }]}>
          <Text style={[styles.statusPillText, { color: isPending ? Colors.warning : Colors.primary }]}>
            {isPending ? "New Order" : STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {order.items.slice(0, 3).map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={styles.itemQtyBadge}><Text style={styles.itemQtyText}>{item.quantity}</Text></View>
            <Text style={styles.itemName}>{item.menuItemName}</Text>
            <Text style={styles.itemSize}>{item.size}</Text>
          </View>
        ))}
        {order.items.length > 3 && <Text style={styles.moreItems}>+{order.items.length - 3} more items</Text>}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="map-pin" size={14} color={Colors.primary} />
          <Text style={styles.statLabel}>{order.location}</Text>
        </View>
        <View style={styles.statItem}>
          <Feather name="navigation" size={14} color={Colors.accent} />
          <Text style={styles.statLabel}>{distanceKm} km</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={14} color={Colors.warning} />
          <Text style={styles.statLabel}>~{estimatedMin} min</Text>
        </View>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsAmount}>+J${earnings.toLocaleString()}</Text>
          <Text style={styles.earningsLabel}>earnings</Text>
        </View>
      </View>

      {/* Pending order: Accept / Decline */}
      {isPending && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.8 }, loading === "decline" && { opacity: 0.5 }]}
            onPress={handleDecline}
            disabled={!!loading}
          >
            {loading === "decline" ? <ActivityIndicator color={Colors.danger} size="small" /> : (
              <><Feather name="x" size={16} color={Colors.danger} /><Text style={styles.declineBtnText}>Decline</Text></>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.8 }, loading === "accept" && { opacity: 0.5 }]}
            onPress={handleAccept}
            disabled={!!loading}
          >
            {loading === "accept" ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Feather name="check" size={16} color="#fff" /><Text style={styles.acceptBtnText}>Accept Order</Text></>
            )}
          </Pressable>
        </View>
      )}

      {/* My order: status controls */}
      {isMyOrder && ["driver_assigned", "restaurant_preparing", "out_for_delivery"].includes(order.status) && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.85 }]}
            onPress={() => setShowNav(true)}
          >
            <Feather name="map" size={16} color={Colors.deliveryBlue} />
            <Text style={styles.navBtnText}>Open Map</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.advanceBtn, pressed && { opacity: 0.85 }, loading === "advance" && { opacity: 0.5 }]}
            onPress={handleAdvance}
            disabled={loading === "advance"}
          >
            {loading === "advance" ? <ActivityIndicator color="#fff" size="small" /> : (
              <Text style={styles.advanceBtnText}>{getNextLabel()}</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Navigation Modal */}
      <Modal visible={showNav} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowNav(false)}>
        <View style={[styles.navModal, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
          <View style={styles.navModalHeader}>
            <View>
              <Text style={styles.navModalTitle}>Navigation</Text>
              <Text style={styles.navModalSub}>{order.location} • {distanceKm} km</Text>
            </View>
            <Pressable onPress={() => setShowNav(false)}>
              <Feather name="x" size={22} color={Colors.text} />
            </Pressable>
          </View>
          <MapErrorBoundary style={styles.map}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (SCHOOL_LAT + destLat) / 2,
                longitude: (SCHOOL_LNG + destLng) / 2,
                latitudeDelta: Math.max(0.02, Math.abs(SCHOOL_LAT - destLat) * 2.5),
                longitudeDelta: Math.max(0.02, Math.abs(SCHOOL_LNG - destLng) * 2.5),
              }}
            >
              <Marker coordinate={{ latitude: SCHOOL_LAT, longitude: SCHOOL_LNG }} title="Pickup (School)" pinColor="blue" />
              <Marker coordinate={{ latitude: destLat, longitude: destLng }} title={`Drop-off: ${order.location}`} description={order.userName} />
              <Polyline
                coordinates={[
                  { latitude: SCHOOL_LAT, longitude: SCHOOL_LNG },
                  { latitude: (SCHOOL_LAT + destLat) / 2 + 0.002, longitude: (SCHOOL_LNG + destLng) / 2 },
                  { latitude: destLat, longitude: destLng },
                ]}
                strokeColor={Colors.accent}
                strokeWidth={4}
                lineDashPattern={[8, 4]}
              />
            </MapView>
          </MapErrorBoundary>
          <View style={styles.navInfoCards}>
            <View style={styles.navInfoCard}>
              <Ionicons name="navigate" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.navInfoTitle}>Destination</Text>
                <Text style={styles.navInfoValue}>{order.location}</Text>
              </View>
            </View>
            <View style={styles.navInfoCard}>
              <Feather name="user" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.navInfoTitle}>Customer</Text>
                <Text style={styles.navInfoValue}>{order.userName}</Text>
              </View>
            </View>
            <View style={styles.navInfoCard}>
              <Ionicons name="time" size={18} color={Colors.warning} />
              <View>
                <Text style={styles.navInfoTitle}>Est. Time</Text>
                <Text style={styles.navInfoValue}>~{estimatedMin} minutes</Text>
              </View>
            </View>
            <View style={styles.navInfoCard}>
              <Ionicons name="cash" size={18} color={Colors.success} />
              <View>
                <Text style={styles.navInfoTitle}>Your Earnings</Text>
                <Text style={[styles.navInfoValue, { color: Colors.success }]}>J${earnings.toLocaleString()}</Text>
              </View>
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

  const pendingOrders = orders.filter(o =>
    o.status === "order_placed" &&
    !(o.declinedBy ?? []).includes(user?.id ?? "")
  );

  const myActiveOrders = orders.filter(o =>
    o.deliveryPersonId === user?.id &&
    ["driver_assigned", "restaurant_preparing", "out_for_delivery"].includes(o.status)
  );

  const myCompleted = orders.filter(o =>
    o.deliveryPersonId === user?.id && o.status === "delivered"
  ).slice(0, 3);

  const allDisplayed = [...myActiveOrders, ...pendingOrders];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</Text>
          <Text style={styles.headerTitle}>{user?.name?.split(" ")[0] ?? "Driver"}</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statsBarItem}>
          <Text style={styles.statsBarNum}>{myActiveOrders.length}</Text>
          <Text style={styles.statsBarLabel}>Active</Text>
        </View>
        <View style={styles.statsBarDivider} />
        <View style={styles.statsBarItem}>
          <Text style={styles.statsBarNum}>{pendingOrders.length}</Text>
          <Text style={styles.statsBarLabel}>Waiting</Text>
        </View>
        <View style={styles.statsBarDivider} />
        <View style={styles.statsBarItem}>
          <Text style={[styles.statsBarNum, { color: Colors.success }]}>
            J${myCompleted.reduce((s, o) => s + Math.round(o.total * 0.15 + (o.deliveryFee ?? 150)), 0).toLocaleString()}
          </Text>
          <Text style={styles.statsBarLabel}>Today's Earnings</Text>
        </View>
      </View>

      <FlatList
        data={allDisplayed}
        keyExtractor={o => o.id}
        renderItem={({ item }) => (
          <OfferCard
            order={item}
            driverId={user?.id ?? ""}
            driverName={user?.name ?? ""}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          myActiveOrders.length > 0 ? (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>My Active Orders ({myActiveOrders.length})</Text>
            </View>
          ) : pendingOrders.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={14} color={Colors.warning} />
              <Text style={[styles.sectionTitle, { color: Colors.warning }]}>New Orders — Tap to Accept</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🛵</Text>
            <Text style={styles.emptyTitle}>No orders right now</Text>
            <Text style={styles.emptySubtitle}>New orders will appear here automatically</Text>
          </View>
        }
        ListFooterComponent={
          myCompleted.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={styles.sectionTitle}>Recently Completed</Text>
              {myCompleted.map(o => (
                <View key={o.id} style={styles.completedCard}>
                  <View>
                    <Text style={styles.completedId}>#{o.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.completedCustomer}>{o.userName} • {o.location}</Text>
                  </View>
                  <Text style={styles.completedEarnings}>+J${Math.round(o.total * 0.15 + (o.deliveryFee ?? 150)).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 14 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(34,197,94,0.3)" },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.success },
  statsBar: { flexDirection: "row", marginHorizontal: 20, marginBottom: 14, backgroundColor: Colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  statsBarItem: { flex: 1, alignItems: "center", paddingVertical: 12 },
  statsBarNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  statsBarLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  statsBarDivider: { width: 1, backgroundColor: Colors.border },
  list: { paddingHorizontal: 20, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  offerCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  myOrderCard: { borderColor: Colors.primary + "60" },
  offerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14, paddingBottom: 10 },
  offerHeaderLeft: {},
  offerOrderId: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  offerCustomer: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  itemsList: { paddingHorizontal: 14, paddingBottom: 10, gap: 6 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemQtyBadge: { width: 22, height: 22, borderRadius: 6, backgroundColor: Colors.backgroundElevated, alignItems: "center", justifyContent: "center" },
  itemQtyText: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.text },
  itemName: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text },
  itemSize: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, textTransform: "capitalize" },
  moreItems: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.backgroundElevated, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, flexWrap: "wrap" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1, minWidth: 80 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, flex: 1 },
  earningsBox: { alignItems: "flex-end" },
  earningsAmount: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.success },
  earningsLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  actionRow: { flexDirection: "row", gap: 10, padding: 14, paddingTop: 10 },
  declineBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 12, backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  declineBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.danger },
  acceptBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 12, backgroundColor: Colors.success },
  acceptBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  navBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "rgba(59,130,246,0.12)", borderWidth: 1, borderColor: Colors.deliveryBlue + "50" },
  navBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.deliveryBlue },
  advanceBtn: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 12, backgroundColor: Colors.accent },
  advanceBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  navModal: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  navModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  navModalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  navModalSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  map: { flex: 1, borderRadius: 16, overflow: "hidden", marginBottom: 14 },
  navInfoCards: { gap: 10 },
  navInfoCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.backgroundCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  navInfoTitle: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  navInfoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 70, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },
  completedSection: { marginTop: 20, gap: 10 },
  completedCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.backgroundCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  completedId: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  completedCustomer: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  completedEarnings: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.success },
});

import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";

const DRIVER_EARNINGS_RATE = 0.15;

function calcEarnings(total: number, deliveryFee: number | undefined): number {
  return Math.round(total * DRIVER_EARNINGS_RATE + (deliveryFee ?? 50));
}

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { orders, deliveryPersons } = useOrders();
  const { user } = useAuth();

  const myDeliveries = orders.filter(o => o.deliveryPersonId === user?.id && o.status === "delivered");
  const totalEarned = myDeliveries.reduce((s, o) => s + calcEarnings(o.total, o.deliveryFee), 0);
  const dp = deliveryPersons.find(d => d.id === user?.id);

  const todayOrders = myDeliveries.filter(o => {
    const today = new Date();
    const orderDate = new Date(o.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });
  const todayEarnings = todayOrders.reduce((s, o) => s + calcEarnings(o.total, o.deliveryFee), 0);

  const weekOrders = myDeliveries.filter(o => {
    const now = Date.now();
    const orderTime = new Date(o.createdAt).getTime();
    return now - orderTime < 7 * 24 * 60 * 60 * 1000;
  });
  const weekEarnings = weekOrders.reduce((s, o) => s + calcEarnings(o.total, o.deliveryFee), 0);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 90 : insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <LinearGradient
        colors={["rgba(255,107,53,0.3)", "rgba(255,107,53,0.05)"]}
        style={styles.totalCard}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <Text style={styles.totalLabel}>Total Earned</Text>
        <Text style={styles.totalAmount}>J${totalEarned.toLocaleString()}</Text>
        <Text style={styles.totalSub}>{myDeliveries.length} deliveries completed</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        {[
          { label: "Today", amount: todayEarnings, count: todayOrders.length, color: Colors.primary },
          { label: "This Week", amount: weekEarnings, count: weekOrders.length, color: Colors.success },
        ].map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statCardLabel}>{stat.label}</Text>
            <Text style={[styles.statCardAmount, { color: stat.color }]}>J${stat.amount.toLocaleString()}</Text>
            <Text style={styles.statCardCount}>{stat.count} deliveries</Text>
          </View>
        ))}
      </View>

      <View style={styles.ratingSection}>
        <View style={styles.ratingSectionHeader}>
          <Text style={styles.sectionTitle}>Your Rating</Text>
        </View>
        <View style={styles.ratingCard}>
          <View style={styles.ratingMain}>
            <Text style={styles.ratingNumber}>{dp?.rating?.toFixed(1) ?? "—"}</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons
                  key={s}
                  name={s <= Math.round(dp?.rating ?? 0) ? "star" : "star-outline"}
                  size={18}
                  color={Colors.ratingYellow}
                />
              ))}
            </View>
            <Text style={styles.ratingCount}>{dp?.ratingCount ?? 0} reviews</Text>
          </View>
          <View style={styles.ratingStats}>
            {[5, 4, 3, 2, 1].map(n => {
              const percentage = dp ? Math.max(0, 100 - Math.abs(n - dp.rating) * 15) : 0;
              return (
                <View key={n} style={styles.ratingBarRow}>
                  <Text style={styles.ratingBarNum}>{n}</Text>
                  <Ionicons name="star" size={10} color={Colors.ratingYellow} />
                  <View style={styles.ratingBarBg}>
                    <View style={[styles.ratingBarFill, { width: `${percentage}%` as any }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Delivery History</Text>
        {myDeliveries.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="package" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No deliveries yet</Text>
          </View>
        ) : (
          myDeliveries.map(o => (
            <View key={o.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyOrder}>#{o.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.historyCustomer}>{o.userName}</Text>
                <Text style={styles.historyDate}>{new Date(o.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.historyAmount}>+J${calcEarnings(o.total, o.deliveryFee).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  header: { paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  totalCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginBottom: 8 },
  totalAmount: { fontSize: 42, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -1 },
  totalSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 6 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  statCardAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statCardCount: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  ratingSection: { gap: 10 },
  ratingSectionHeader: { flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  ratingCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingMain: { alignItems: "center", gap: 4, minWidth: 80 },
  ratingNumber: { fontSize: 36, fontFamily: "Inter_700Bold", color: Colors.text },
  ratingStars: { flexDirection: "row", gap: 2 },
  ratingCount: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  ratingStats: { flex: 1, gap: 6 },
  ratingBarRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingBarNum: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, width: 10 },
  ratingBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  ratingBarFill: { height: 6, backgroundColor: Colors.ratingYellow, borderRadius: 3 },
  historySection: { gap: 10 },
  historyCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyLeft: { gap: 2 },
  historyOrder: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  historyCustomer: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  historyDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  historyAmount: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.success },
  empty: { alignItems: "center", gap: 10, paddingVertical: 30 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

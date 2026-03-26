import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
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
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BarChart({ data, maxVal, color, labelKey, valueKey, prefix }: {
  data: { label: string; value: number }[];
  maxVal: number;
  color: string;
  labelKey?: string;
  valueKey?: string;
  prefix?: string;
}) {
  const max = Math.max(maxVal, 1);
  return (
    <View style={chartStyles.container}>
      {data.map((item, i) => (
        <View key={i} style={chartStyles.barGroup}>
          <Text style={chartStyles.barValue}>{item.value > 0 ? `${prefix ?? ""}${item.value}` : ""}</Text>
          <View style={chartStyles.barBg}>
            <View style={[chartStyles.barFill, { height: `${Math.round((item.value / max) * 100)}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={chartStyles.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 120, paddingTop: 20 },
  barGroup: { flex: 1, alignItems: "center", gap: 4 },
  barValue: { fontSize: 9, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  barBg: { flex: 1, width: "100%", backgroundColor: Colors.backgroundElevated, borderRadius: 6, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center" },
});

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { orders, menuItems } = useOrders();
  const { user } = useAuth();

  const myDeliveries = orders.filter(o => o.deliveryPersonId === user?.id && o.status === "delivered");

  const { weeklyEarnings, peakHours, topItems, weeklyTotal, totalOrders } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Weekly earnings (last 7 days)
    const weeklyEarnings = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dayOrders = myDeliveries.filter(o => {
        const od = new Date(o.createdAt);
        return od.toDateString() === d.toDateString();
      });
      const earned = dayOrders.reduce((s, o) => s + Math.round(o.total * DRIVER_EARNINGS_RATE + (o.deliveryFee ?? 150)), 0);
      return { label: DAYS[d.getDay()], value: earned };
    });

    // Peak hours (orders by hour buckets: 6-9, 9-12, 12-15, 15-18, 18-21)
    const hourBuckets = [
      { label: "6-9am", range: [6, 9] },
      { label: "9-12", range: [9, 12] },
      { label: "12-3pm", range: [12, 15] },
      { label: "3-6pm", range: [15, 18] },
      { label: "6-9pm", range: [18, 21] },
    ];
    const peakHours = hourBuckets.map(b => {
      const count = myDeliveries.filter(o => {
        const h = new Date(o.createdAt).getHours();
        return h >= b.range[0] && h < b.range[1];
      }).length;
      return { label: b.label, value: count };
    });

    // Top ordered items across all orders (not just mine)
    const itemCounts: Record<string, { name: string; count: number; emoji: string }> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!itemCounts[item.menuItemId]) {
          const mi = menuItems.find(m => m.id === item.menuItemId);
          itemCounts[item.menuItemId] = { name: item.menuItemName, count: 0, emoji: mi?.emoji ?? "🍽" };
        }
        itemCounts[item.menuItemId].count += item.quantity;
      });
    });
    const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    const weeklyTotal = weeklyEarnings.reduce((s, d) => s + d.value, 0);
    const totalOrders = myDeliveries.length;

    return { weeklyEarnings, peakHours, topItems, weeklyTotal, totalOrders };
  }, [orders, myDeliveries, menuItems]);

  const maxWeekly = Math.max(...weeklyEarnings.map(d => d.value), 1);
  const maxPeak = Math.max(...peakHours.map(d => d.value), 1);
  const maxItems = topItems[0]?.count ?? 1;

  const todayEarnings = myDeliveries.filter(o => {
    const today = new Date();
    return new Date(o.createdAt).toDateString() === today.toDateString();
  }).reduce((s, o) => s + Math.round(o.total * DRIVER_EARNINGS_RATE + (o.deliveryFee ?? 150)), 0);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 90 : insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.headerSub}>
          <Feather name="bar-chart-2" size={14} color={Colors.textSecondary} />
          <Text style={styles.headerSubText}>Your performance</Text>
        </View>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Today</Text>
          <Text style={[styles.kpiValue, { color: Colors.success }]}>J${todayEarnings.toLocaleString()}</Text>
          <Text style={styles.kpiSub}>earned</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>This Week</Text>
          <Text style={[styles.kpiValue, { color: Colors.primary }]}>J${weeklyTotal.toLocaleString()}</Text>
          <Text style={styles.kpiSub}>earned</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Deliveries</Text>
          <Text style={[styles.kpiValue, { color: Colors.accent }]}>{totalOrders}</Text>
          <Text style={styles.kpiSub}>total</Text>
        </View>
      </View>

      {/* Weekly Earnings Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Weekly Earnings</Text>
          <Text style={styles.chartValue}>J${weeklyTotal.toLocaleString()}</Text>
        </View>
        {weeklyEarnings.every(d => d.value === 0) ? (
          <View style={styles.noData}>
            <Feather name="bar-chart" size={28} color={Colors.textMuted} />
            <Text style={styles.noDataText}>Complete deliveries to see earnings</Text>
          </View>
        ) : (
          <BarChart data={weeklyEarnings} maxVal={maxWeekly} color={Colors.success} prefix="J$" />
        )}
      </View>

      {/* Peak Hours Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Peak Delivery Hours</Text>
          <View style={styles.peakBadge}>
            <Ionicons name="flame" size={12} color={Colors.accent} />
            <Text style={styles.peakBadgeText}>
              {peakHours.reduce((best, h) => h.value > best.value ? h : best, peakHours[0])?.label ?? "12-3pm"}
            </Text>
          </View>
        </View>
        {peakHours.every(d => d.value === 0) ? (
          <View style={styles.noData}>
            <Feather name="clock" size={28} color={Colors.textMuted} />
            <Text style={styles.noDataText}>No delivery data yet</Text>
          </View>
        ) : (
          <BarChart data={peakHours} maxVal={maxPeak} color={Colors.accent} />
        )}
        <Text style={styles.chartNote}>Orders delivered by time of day</Text>
      </View>

      {/* Most Ordered Items */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Most Ordered Items</Text>
        {topItems.length === 0 ? (
          <View style={styles.noData}>
            <Text style={{ fontSize: 32 }}>🍽</Text>
            <Text style={styles.noDataText}>No orders placed yet</Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {topItems.map((item, i) => (
              <View key={i} style={styles.topItemRow}>
                <Text style={styles.topItemRank}>#{i + 1}</Text>
                <Text style={styles.topItemEmoji}>{item.emoji}</Text>
                <Text style={styles.topItemName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.topItemBarWrap}>
                  <View style={[styles.topItemBar, { width: `${Math.round((item.count / maxItems) * 100)}%` as any }]} />
                </View>
                <Text style={styles.topItemCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Delivery Locations */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Top Delivery Areas</Text>
        {myDeliveries.length === 0 ? (
          <View style={styles.noData}>
            <Ionicons name="map" size={28} color={Colors.textMuted} />
            <Text style={styles.noDataText}>No deliveries completed yet</Text>
          </View>
        ) : (() => {
          const areaCounts: Record<string, number> = {};
          myDeliveries.forEach(o => {
            const area = o.locationData?.area ?? o.location;
            areaCounts[area] = (areaCounts[area] ?? 0) + 1;
          });
          const sorted = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const maxCount = sorted[0]?.[1] ?? 1;
          return (
            <View style={styles.itemsList}>
              {sorted.map(([area, count], i) => (
                <View key={area} style={styles.topItemRow}>
                  <Ionicons name="map-pin" size={14} color={Colors.primary} />
                  <Text style={[styles.topItemName, { flex: 1 }]}>{area}</Text>
                  <View style={styles.topItemBarWrap}>
                    <View style={[styles.topItemBar, { width: `${Math.round((count / maxCount) * 100)}%` as any, backgroundColor: Colors.primary }]} />
                  </View>
                  <Text style={styles.topItemCount}>{count}</Text>
                </View>
              ))}
            </View>
          );
        })()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  headerSub: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerSubText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  kpiRow: { flexDirection: "row", gap: 10 },
  kpiCard: { flex: 1, backgroundColor: Colors.backgroundCard, borderRadius: 14, padding: 14, alignItems: "center", gap: 2, borderWidth: 1, borderColor: Colors.border },
  kpiLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  kpiValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
  kpiSub: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  chartCard: { backgroundColor: Colors.backgroundCard, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  chartValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.success },
  chartNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  peakBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,107,53,0.12)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  peakBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  noData: { alignItems: "center", paddingVertical: 20, gap: 8 },
  noDataText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  itemsList: { gap: 10 },
  topItemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  topItemRank: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.textMuted, width: 20 },
  topItemEmoji: { fontSize: 18 },
  topItemName: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.text, width: 100 },
  topItemBarWrap: { flex: 1, height: 8, backgroundColor: Colors.backgroundElevated, borderRadius: 4, overflow: "hidden" },
  topItemBar: { height: 8, backgroundColor: Colors.accent, borderRadius: 4 },
  topItemCount: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.text, width: 24, textAlign: "right" },
});

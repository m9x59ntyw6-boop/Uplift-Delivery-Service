import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";

export default function DeliveryProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { orders, deliveryPersons } = useOrders();

  const dp = deliveryPersons.find(d => d.id === user?.id);
  const myDeliveries = orders.filter(o => o.deliveryPersonId === user?.id && o.status === "delivered");
  const totalEarned = myDeliveries.reduce((s, o) => s + o.total, 0);
  const activeOrders = orders.filter(o =>
    o.deliveryPersonId === user?.id && ["driver_assigned", "restaurant_preparing", "out_for_delivery"].includes(o.status)
  ).length;

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
    router.replace("/(auth)/welcome");
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 90 : insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />

      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={[Colors.accent, "#FF4500"]} style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "D"}</Text>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="bicycle" size={12} color={Colors.accent} />
            <Text style={styles.roleText}>Delivery Personnel</Text>
          </View>
        </View>
      </View>

      <View style={styles.ratingHighlight}>
        <View style={styles.ratingScore}>
          <Ionicons name="star" size={22} color={Colors.ratingYellow} />
          <Text style={styles.ratingNum}>{dp?.rating?.toFixed(1) ?? "—"}</Text>
        </View>
        <View style={styles.ratingDetails}>
          <Text style={styles.ratingTitle}>Your Rating</Text>
          <Text style={styles.ratingSubtitle}>{dp?.ratingCount ?? 0} reviews from customers</Text>
        </View>
        <View style={styles.ratingLevel}>
          <Text style={styles.ratingLevelText}>
            {(dp?.rating ?? 0) >= 4.8 ? "Top Rated" : (dp?.rating ?? 0) >= 4.5 ? "Excellent" : "Good"}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { label: "Total Deliveries", value: myDeliveries.length.toString(), icon: "package" as const, color: Colors.primary },
          { label: "Active Now", value: activeOrders.toString(), icon: "navigation" as const, color: Colors.success },
          { label: "Total Earned", value: `J$${Math.round(totalEarned / 1000)}k`, icon: "dollar-sign" as const, color: Colors.accent },
          { label: "Rating Count", value: (dp?.ratingCount ?? 0).toString(), icon: "star" as const, color: Colors.ratingYellow },
        ].map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <Feather name={stat.icon} size={20} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {[
          { icon: "edit-2" as const, label: "Edit Menu & Prices", onPress: () => router.push("/(delivery)/menu-editor") },
          { icon: "file-text" as const, label: "View Terms & Conditions", onPress: () => router.push("/(auth)/terms") },
          { icon: "help-circle" as const, label: "Help Center", onPress: () => {} },
        ].map(item => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={item.onPress}
          >
            <View style={styles.menuIcon}>
              <Feather name={item.icon} size={18} color={Colors.accent} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={Colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  roleText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.accent },
  ratingHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251,191,36,0.08)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    gap: 12,
  },
  ratingScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251,191,36,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ratingNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  ratingDetails: { flex: 1 },
  ratingTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  ratingSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  ratingLevel: {
    backgroundColor: "rgba(251,191,36,0.2)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingLevelText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.ratingYellow },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,107,53,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  pressed: { opacity: 0.85 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.danger },
});

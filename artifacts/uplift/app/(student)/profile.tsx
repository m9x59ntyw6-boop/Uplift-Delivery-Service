import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  FlatList,
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { orders, getStreakDiscount } = useOrders();

  const myOrders = orders.filter(o => o.userId === user?.id);
  const totalSpent = myOrders.reduce((s, o) => s + o.total, 0);
  const completedOrders = myOrders.filter(o => o.status === "delivered").length;
  const streakDays = user?.streakDays ?? 0;
  const discount = getStreakDiscount();

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
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "U"}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="school" size={12} color={Colors.primary} />
            <Text style={styles.roleText}>Student / Staff</Text>
          </View>
        </View>
      </View>

      <View style={styles.streakCard}>
        <LinearGradient
          colors={["rgba(249,115,22,0.2)", "rgba(245,158,11,0.1)"]}
          style={styles.streakGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <View>
            <View style={styles.streakHeader}>
              <Ionicons name="flame" size={22} color={Colors.streakOrange} />
              <Text style={styles.streakTitle}>Order Streak</Text>
            </View>
            <Text style={styles.streakDays}>
              {streakDays} day{streakDays !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.streakSubtitle}>
              {streakDays === 0
                ? "Order today to start your streak!"
                : streakDays === 1
                ? "Order tomorrow for 5% off!"
                : streakDays >= 3
                ? "10% discount active!"
                : "Order again for 5% off!"}
            </Text>
          </View>
          <View style={styles.streakProgress}>
            {[1, 2, 3].map(day => (
              <View key={day} style={[styles.streakDot, streakDays >= day && styles.streakDotActive]}>
                {streakDays >= day
                  ? <Feather name="check" size={12} color="#fff" />
                  : <Text style={styles.streakDotNum}>{day}</Text>
                }
              </View>
            ))}
          </View>
          {discount > 0 && (
            <View style={styles.discountActive}>
              <Ionicons name="pricetag" size={14} color={Colors.streakGold} />
              <Text style={styles.discountActiveText}>{Math.round(discount * 100)}% discount on your next order!</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: "Total Orders", value: myOrders.length.toString(), icon: "shopping-bag" as const },
          { label: "Completed", value: completedOrders.toString(), icon: "check-circle" as const },
          { label: "Total Spent", value: `J$${(totalSpent / 1000).toFixed(1)}k`, icon: "dollar-sign" as const },
        ].map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <Feather name={stat.icon} size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {[
          { icon: "file-text" as const, label: "View Terms & Conditions", onPress: () => router.push("/(auth)/terms") },
          { icon: "star" as const, label: "Rate the App", onPress: () => {} },
          { icon: "help-circle" as const, label: "Help & Support", onPress: () => router.push("/(student)/chat") },
        ].map(item => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={item.onPress}
          >
            <View style={styles.menuIcon}>
              <Feather name={item.icon} size={18} color={Colors.primary} />
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
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(26,115,232,0.1)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  roleText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.primary },
  streakCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.3)",
  },
  streakGradient: { padding: 16, gap: 12 },
  streakHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  streakTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.streakOrange },
  streakDays: { fontSize: 32, fontFamily: "Inter_700Bold", color: Colors.text },
  streakSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  streakProgress: { flexDirection: "row", gap: 10 },
  streakDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  streakDotActive: { backgroundColor: Colors.streakOrange, borderColor: Colors.streakOrange },
  streakDotNum: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
  discountActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderRadius: 8,
    padding: 8,
  },
  discountActiveText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.streakGold },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
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
    backgroundColor: "rgba(26,115,232,0.1)",
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

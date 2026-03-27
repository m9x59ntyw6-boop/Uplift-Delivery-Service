import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";

const DRIVER_EARNINGS_RATE = 0.15;

const APP_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "uplift.app"}`;

export default function DeliveryProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { orders, deliveryPersons } = useOrders();
  const [showQR, setShowQR] = useState(false);

  const dp = deliveryPersons.find(d => d.id === user?.id);
  const myDeliveries = orders.filter(o => o.deliveryPersonId === user?.id && o.status === "delivered");
  const totalEarned = myDeliveries.reduce((s, o) => s + Math.round(o.total * DRIVER_EARNINGS_RATE + (o.deliveryFee ?? 50)), 0);
  const activeOrders = orders.filter(o =>
    o.deliveryPersonId === user?.id && ["driver_assigned", "restaurant_preparing", "out_for_delivery"].includes(o.status)
  ).length;

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
    router.replace("/(auth)/welcome");
  };

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: "Uplift by Lyft Deliveries",
        message: `Order food from school with Uplift by Lyft Deliveries!\n\nDownload the app and get your food delivered right to you.\n\n${APP_URL}`,
        url: APP_URL,
      });
    } catch {}
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 + 90 : insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />

      {/* ── Profile card ── */}
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

      {/* ── Rating highlight ── */}
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

      {/* ── Stats grid ── */}
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

      {/* ── Share App section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Share App</Text>
        <View style={styles.shareCard}>
          <LinearGradient
            colors={["rgba(26,115,232,0.12)", "rgba(255,107,53,0.08)"]}
            style={styles.shareCardGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.shareCardTop}>
              <View style={styles.shareCardText}>
                <Text style={styles.shareCardTitle}>Invite Classmates</Text>
                <Text style={styles.shareCardSub}>
                  Share the app with students, teachers & staff so they can order food on campus.
                </Text>
              </View>
              {/* Mini QR preview — tap to enlarge */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowQR(true); }}
                style={({ pressed }) => [styles.qrPreviewWrap, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.qrPreview}>
                  <QRCode
                    value={APP_URL}
                    size={80}
                    color="#FFFFFF"
                    backgroundColor="transparent"
                  />
                </View>
                <Text style={styles.qrPreviewHint}>Tap to enlarge</Text>
              </Pressable>
            </View>

            <View style={styles.shareActions}>
              <Pressable
                style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
                onPress={handleShare}
              >
                <Feather name="share-2" size={15} color="#fff" />
                <Text style={styles.shareBtnText}>Share Link</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.qrBtn, pressed && { opacity: 0.85 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowQR(true); }}
              >
                <Feather name="maximize" size={15} color={Colors.primary} />
                <Text style={styles.qrBtnText}>Full QR Code</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* ── Settings ── */}
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

      {/* ── Full-screen QR modal ── */}
      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowQR(false)}>
          <View style={styles.modalCard}>
            <LinearGradient colors={["#111827", "#1A2332"]} style={StyleSheet.absoluteFill} />

            {/* Close */}
            <Pressable style={styles.modalClose} onPress={() => setShowQR(false)}>
              <Feather name="x" size={20} color={Colors.textMuted} />
            </Pressable>

            {/* Header */}
            <View style={styles.modalHeader}>
              <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.modalAppIcon}>
                <Ionicons name="bicycle" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.modalTitle}>Uplift by Lyft</Text>
              <Text style={styles.modalSub}>Scan to open the app</Text>
            </View>

            {/* QR Code */}
            <View style={styles.qrBox}>
              <QRCode
                value={APP_URL}
                size={220}
                color="#0A0F1E"
                backgroundColor="#FFFFFF"
                logo={{ uri: "https://cdn-icons-png.flaticon.com/512/3448/3448636.png" }}
                logoSize={44}
                logoBackgroundColor="#FFFFFF"
                logoBorderRadius={8}
              />
            </View>

            {/* URL label */}
            <View style={styles.urlRow}>
              <Feather name="link" size={13} color={Colors.textMuted} />
              <Text style={styles.urlText} numberOfLines={1}>{APP_URL}</Text>
            </View>

            {/* Driver info */}
            <View style={styles.driverRow}>
              <LinearGradient colors={[Colors.accent, "#FF4500"]} style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>{user?.name?.charAt(0) ?? "D"}</Text>
              </LinearGradient>
              <View>
                <Text style={styles.driverName}>{user?.name}</Text>
                <Text style={styles.driverRole}>Delivery Personnel · Uplift</Text>
              </View>
            </View>

            {/* Share button */}
            <Pressable
              style={({ pressed }) => [styles.modalShareBtn, pressed && { opacity: 0.85 }]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={16} color="#fff" />
              <Text style={styles.modalShareText}>Share App Link</Text>
            </Pressable>

            <Text style={styles.modalDismiss}>Tap anywhere outside to close</Text>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, gap: 16 },

  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16 },
  avatarWrap: { position: "relative" },
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2, borderColor: Colors.background,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,107,53,0.1)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start", marginTop: 4,
  },
  roleText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.accent },

  ratingHighlight: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(251,191,36,0.08)", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "rgba(251,191,36,0.2)", gap: 12,
  },
  ratingScore: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(251,191,36,0.15)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  ratingNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  ratingDetails: { flex: 1 },
  ratingTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  ratingSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  ratingLevel: { backgroundColor: "rgba(251,191,36,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  ratingLevelText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.ratingYellow },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47%", backgroundColor: Colors.backgroundCard,
    borderRadius: 14, padding: 14, alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },

  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
  },

  shareCard: {
    borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(26,115,232,0.25)",
  },
  shareCardGradient: { padding: 16, gap: 14 },
  shareCardTop: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  shareCardText: { flex: 1, gap: 6 },
  shareCardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  shareCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },

  qrPreviewWrap: { alignItems: "center", gap: 6 },
  qrPreview: {
    width: 96, height: 96, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    padding: 6,
  },
  qrPreviewHint: { fontSize: 9, fontFamily: "Inter_400Regular", color: Colors.textMuted },

  shareActions: { flexDirection: "row", gap: 10 },
  shareBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 11,
  },
  shareBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  qrBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "rgba(26,115,232,0.12)", borderRadius: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: "rgba(26,115,232,0.3)",
  },
  qrBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary },

  menuItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.backgroundCard, borderRadius: 12, padding: 14, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,107,53,0.1)", alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  pressed: { opacity: 0.85 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.danger },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  modalCard: {
    width: "100%", maxWidth: 360, borderRadius: 28, overflow: "hidden",
    padding: 28, gap: 20, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  modalClose: {
    position: "absolute", top: 16, right: 16, zIndex: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center", justifyContent: "center",
  },
  modalHeader: { alignItems: "center", gap: 10 },
  modalAppIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 0.3 },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },

  qrBox: {
    padding: 16, borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },

  urlRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.backgroundElevated, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
    alignSelf: "stretch",
  },
  urlText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },

  driverRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.backgroundElevated, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border, alignSelf: "stretch",
  },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  driverAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  driverName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  driverRole: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },

  modalShareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 13,
    alignSelf: "stretch",
  },
  modalShareText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  modalDismiss: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

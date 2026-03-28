import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { makeShadow } from "@/utils/shadow";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { SavedAccount, useAuth } from "@/contexts/AuthContext";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { getSavedAccounts, removeSavedAccount, loginWithSavedAccount } = useAuth();

  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [loggingInId, setLoggingInId] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    const accts = await getSavedAccounts();
    setSavedAccounts(accts);
  }, []);

  useEffect(() => {
    loadAccounts();
    const sub = AppState.addEventListener("change", s => {
      if (s === "active") loadAccounts();
    });
    return () => sub.remove();
  }, []);

  const handleQuickLogin = async (account: SavedAccount) => {
    setLoggingInId(account.id);
    const result = await loginWithSavedAccount(account);
    setLoggingInId(null);
    if (result === "ok") {
      if (account.role === "delivery") router.replace("/(delivery)");
      else router.replace("/(student)");
    } else {
      router.push({
        pathname: "/(auth)/login",
        params: { role: account.role === "delivery" ? "delivery" : "student_staff" },
      });
    }
  };

  const handleRemove = async (id: string) => {
    await removeSavedAccount(id);
    setSavedAccounts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <LinearGradient
      colors={["#0A0F1E", "#0D1B3E", "#0A0F1E"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          {
            paddingTop: Platform.OS === "web" ? 67 + 20 : insets.top + 20,
            paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, "#6C63FF"]}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="arrow-up" size={36} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>uplift</Text>
          <Text style={styles.tagline}>by Lyft Deliveries</Text>
          <Text style={styles.slogan}>Let us lift your experience</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.featuresRow}>
          {[
            { icon: "map-pin" as const, label: "Live Tracking" },
            { icon: "star" as const, label: "Rated Drivers" },
            { icon: "percent" as const, label: "Streak Deals" },
          ].map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        {savedAccounts.length > 0 && (
          <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.savedSection}>
            <View style={styles.savedHeader}>
              <Text style={styles.savedTitle}>Saved accounts</Text>
              <Text style={styles.savedSubtitle}>Tap to sign in instantly</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.savedScroll}
            >
              {savedAccounts.map(account => {
                const isLoading = loggingInId === account.id;
                const initial = account.name.charAt(0).toUpperCase();
                const isDelivery = account.role === "delivery";
                return (
                  <View key={account.id} style={styles.savedCardWrapper}>
                    <Pressable
                      style={({ pressed }) => [styles.savedCard, pressed && styles.pressed]}
                      onPress={() => handleQuickLogin(account)}
                      disabled={!!loggingInId}
                    >
                      {isLoading ? (
                        <View style={[styles.savedAvatar, { backgroundColor: account.avatarColor }]}>
                          <ActivityIndicator color="#fff" size="small" />
                        </View>
                      ) : (
                        <View style={[styles.savedAvatar, { backgroundColor: account.avatarColor }]}>
                          <Text style={styles.savedAvatarText}>{initial}</Text>
                        </View>
                      )}
                      <Text style={styles.savedName} numberOfLines={1}>
                        {account.name.split(" ")[0]}
                      </Text>
                      <View style={[styles.savedRoleBadge, isDelivery ? styles.savedRoleBadgeDelivery : styles.savedRoleBadgeStudent]}>
                        <Ionicons
                          name={isDelivery ? "bicycle" : "school"}
                          size={9}
                          color={isDelivery ? Colors.accent : Colors.primary}
                        />
                        <Text style={[styles.savedRoleText, { color: isDelivery ? Colors.accent : Colors.primary }]}>
                          {isDelivery ? "Staff" : "Student"}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable style={styles.removeBtn} onPress={() => handleRemove(account.id)}>
                      <Feather name="x" size={11} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                );
              })}
              <Pressable
                style={({ pressed }) => [styles.addAccountCard, pressed && styles.pressed]}
                onPress={() => router.push("/(auth)/login")}
              >
                <View style={styles.addAccountIcon}>
                  <Feather name="plus" size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.addAccountLabel}>Add{"\n"}account</Text>
              </Pressable>
            </ScrollView>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in as</Text>
              <View style={styles.dividerLine} />
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.buttonsSection}>
          {savedAccounts.length === 0 && <Text style={styles.chooseLabel}>I am a...</Text>}

          <Pressable
            style={({ pressed }) => [styles.roleBtn, styles.studentBtn, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "student_staff" } })}
          >
            <View style={styles.roleBtnContent}>
              <View style={styles.roleBtnIcon}>
                <Ionicons name="school" size={22} color={Colors.primary} />
              </View>
              <View style={styles.roleBtnText}>
                <Text style={styles.roleBtnTitle}>Student / Teacher / Staff</Text>
                <Text style={styles.roleBtnSub}>Order food & track delivery</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textMuted} />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.roleBtn, styles.deliveryBtn, pressed && styles.pressed]}
            onPress={() => router.push("/(auth)/delivery-login")}
          >
            <View style={styles.roleBtnContent}>
              <View style={[styles.roleBtnIcon, { backgroundColor: "rgba(255,107,53,0.15)" }]}>
                <Ionicons name="bicycle" size={22} color={Colors.accent} />
              </View>
              <View style={styles.roleBtnText}>
                <Text style={styles.roleBtnTitle}>Delivery Personnel</Text>
                <Text style={styles.roleBtnSub}>Accept orders & earn money</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textMuted} />
            </View>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Uplift? </Text>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.footerLink}>Create account</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 24, gap: 28 },
  heroSection: { alignItems: "center", paddingTop: 20 },
  logoContainer: { marginBottom: 16 },
  logoCircle: {
    width: 84, height: 84, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    ...makeShadow(Colors.primary, 8, 0.4, 20, 12),
  },
  appName: { fontSize: 48, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -2 },
  tagline: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary,
    letterSpacing: 1, textTransform: "uppercase", marginTop: 4,
  },
  slogan: {
    fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.primary,
    fontStyle: "italic", marginTop: 6, letterSpacing: 0.2,
  },
  featuresRow: { flexDirection: "row", justifyContent: "center", gap: 24 },
  featureItem: { alignItems: "center", gap: 8 },
  featureIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(26,115,232,0.12)", alignItems: "center", justifyContent: "center",
  },
  featureLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },

  savedSection: { gap: 14 },
  savedHeader: { gap: 2 },
  savedTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  savedSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  savedScroll: { gap: 10, paddingRight: 4 },
  savedCardWrapper: { alignItems: "center", position: "relative" },
  savedCard: {
    width: 76, alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  savedAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  savedAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  savedName: {
    fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.text,
    textAlign: "center", width: "100%",
  },
  savedRoleBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  savedRoleBadgeStudent: { backgroundColor: "rgba(26,115,232,0.12)" },
  savedRoleBadgeDelivery: { backgroundColor: "rgba(255,107,53,0.12)" },
  savedRoleText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  removeBtn: {
    position: "absolute", top: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  addAccountCard: {
    width: 76, alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    borderStyle: "dashed",
  },
  addAccountIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  addAccountLabel: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted,
    textAlign: "center",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },

  buttonsSection: { gap: 12 },
  chooseLabel: {
    fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted,
    textAlign: "center", marginBottom: 4,
  },
  roleBtn: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  studentBtn: { backgroundColor: "rgba(26,115,232,0.08)", borderColor: "rgba(26,115,232,0.3)" },
  deliveryBtn: { backgroundColor: "rgba(255,107,53,0.08)", borderColor: "rgba(255,107,53,0.3)" },
  pressed: { opacity: 0.8 },
  roleBtnContent: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  roleBtnIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(26,115,232,0.15)", alignItems: "center", justifyContent: "center",
  },
  roleBtnText: { flex: 1 },
  roleBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  roleBtnSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8, alignItems: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
});

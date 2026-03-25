import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { makeShadow } from "@/utils/shadow";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#0A0F1E", "#0D1B3E", "#0A0F1E"]}
      style={styles.container}
    >
      <View
        style={[
          styles.inner,
          {
            paddingTop: Platform.OS === "web" ? 67 + 20 : insets.top + 20,
            paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20,
          },
        ]}
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

        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.buttonsSection}>
          <Text style={styles.chooseLabel}>I am a...</Text>

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
            onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "delivery" } })}
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
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  heroSection: { alignItems: "center", paddingTop: 20 },
  logoContainer: { marginBottom: 16 },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...makeShadow(Colors.primary, 8, 0.4, 20, 12),
  },
  appName: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  featureItem: { alignItems: "center", gap: 8 },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(26,115,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  buttonsSection: { gap: 12 },
  chooseLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 4,
  },
  roleBtn: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  studentBtn: {
    backgroundColor: "rgba(26,115,232,0.08)",
    borderColor: "rgba(26,115,232,0.3)",
  },
  deliveryBtn: {
    backgroundColor: "rgba(255,107,53,0.08)",
    borderColor: "rgba(255,107,53,0.3)",
  },
  pressed: { opacity: 0.8 },
  roleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  roleBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(26,115,232,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleBtnText: { flex: 1 },
  roleBtnTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  roleBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
});

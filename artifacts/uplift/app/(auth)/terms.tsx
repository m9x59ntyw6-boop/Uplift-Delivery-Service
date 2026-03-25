import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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

const TERMS = [
  { title: "Service Agreement", body: "By using Uplift, you agree to use our delivery services responsibly and in accordance with Lyft Deliveries' policies." },
  { title: "Location & GPS", body: "You consent to allow Uplift to access your device's GPS location for real-time delivery tracking and accurate delivery coordination." },
  { title: "Payment Terms", body: "All prices are in Jamaican Dollars (JMD). Payment is accepted upon order confirmation. Streak discounts are automatically applied." },
  { title: "Privacy Policy", body: "Your data is stored securely and never sold to third parties. Your order history and personal information is used only to enhance your delivery experience." },
  { title: "Streak Mechanics", body: "Order 2 consecutive days to earn 5% off. Order 3+ consecutive days to earn 10% off. Streaks reset if you miss a day." },
  { title: "Reviews & Ratings", body: "You may rate and review delivery personnel after each completed order. Reviews must be honest, respectful, and constructive." },
  { title: "User Conduct", body: "Users are expected to treat delivery personnel with respect. Abuse, harassment, or fraudulent orders will result in account suspension." },
];

export default function TermsScreen() {
  const { user, agreeToTerms } = useAuth();
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);

  const handleAgree = async () => {
    if (!agreed) return;
    await agreeToTerms();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (user?.role === "delivery") router.replace("/(delivery)");
    else router.replace("/(student)");
  };

  return (
    <LinearGradient colors={["#0A0F1E", "#111827"]} style={{ flex: 1 }}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === "web" ? 67 + 16 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Feather name="file-text" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>User Agreement</Text>
          <Text style={styles.subtitle}>Please read and agree to continue</Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
        >
          {TERMS.map((term, i) => (
            <View key={i} style={styles.termCard}>
              <Text style={styles.termTitle}>{term.title}</Text>
              <Text style={styles.termBody}>{term.body}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={styles.checkRow}
            onPress={() => {
              setAgreed(v => !v);
              Haptics.selectionAsync();
            }}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Feather name="check" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkLabel}>
              I have read and agree to all terms and conditions
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.agreeBtn, !agreed && styles.agreeBtnDisabled, pressed && styles.pressed]}
            onPress={handleAgree}
            disabled={!agreed}
          >
            <Text style={styles.agreeBtnText}>Continue to Uplift</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { alignItems: "center", marginBottom: 20 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(26,115,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  scrollArea: { flex: 1 },
  termCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  termTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  termBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  footer: { gap: 14, paddingTop: 14 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, flex: 1, lineHeight: 22 },
  agreeBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  agreeBtnDisabled: { backgroundColor: Colors.backgroundElevated, opacity: 0.5 },
  pressed: { opacity: 0.85 },
  agreeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

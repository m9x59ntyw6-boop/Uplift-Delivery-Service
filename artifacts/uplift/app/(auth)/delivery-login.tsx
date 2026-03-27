import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { DELIVERY_STAFF, useAuth } from "@/contexts/AuthContext";
import { makeShadow } from "@/utils/shadow";

const MAX_ATTEMPTS = 5;

function PinDot({ filled, shake }: { filled: boolean; shake: Animated.Value }) {
  return (
    <Animated.View
      style={[
        styles.pinDot,
        filled && styles.pinDotFilled,
        { transform: [{ translateX: shake }] },
      ]}
    />
  );
}

function NumKey({ label, sub, onPress, disabled }: {
  label: string; sub?: string; onPress: () => void; disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  return (
    <Pressable onPress={press} disabled={disabled} style={({ pressed }) => [styles.numKey, pressed && { opacity: 0.7 }]}>
      <Animated.View style={[styles.numKeyInner, { transform: [{ scale }] }]}>
        <Text style={styles.numKeyLabel}>{label}</Text>
        {sub && <Text style={styles.numKeySub}>{sub}</Text>}
      </Animated.View>
    </Pressable>
  );
}

export default function DeliveryLoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginDelivery } = useAuth();

  const [step, setStep] = useState<"select" | "pin">("select");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const selectedStaff = DELIVERY_STAFF.find(s => s.id === selectedStaffId);

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSelectStaff = (id: string) => {
    setSelectedStaffId(id);
    setPin("");
    setError("");
    setAttempts(0);
    setLocked(false);
    setStep("pin");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDigit = (d: string) => {
    if (locked || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) {
      setTimeout(() => verifyPin(next), 150);
    }
  };

  const handleDelete = () => {
    if (locked) return;
    setPin(p => p.slice(0, -1));
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const verifyPin = async (code: string) => {
    if (!selectedStaffId) return;
    setLoading(true);
    const result = await loginDelivery(selectedStaffId, code);
    setLoading(false);

    if (result === "success") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(delivery)");
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin("");
      triggerShake();

      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setError(`Too many failed attempts. Please contact Gurvin Leachman.`);
      } else {
        setError(`Wrong code. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`);
      }
    }
  };

  const numKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"],
  ];

  return (
    <LinearGradient colors={["#0A0F1E", "#0D1428", "#0A0F1E"]} style={styles.container}>
      <View style={[styles.inner, {
        paddingTop: Platform.OS === "web" ? 67 + 16 : insets.top + 16,
        paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 16,
      }]}>

        {/* Back button */}
        <View style={styles.topRow}>
          <Pressable
            onPress={() => {
              if (step === "pin") { setStep("select"); setPin(""); setError(""); }
              else router.back();
            }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={Colors.text} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.topTitle}>
              {step === "select" ? "Select Your Name" : "Enter Security Code"}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Lock icon & title */}
        <View style={styles.heroSection}>
          <View style={[styles.lockCircle, { backgroundColor: step === "pin" && selectedStaff ? selectedStaff.color + "22" : "rgba(26,115,232,0.12)" }]}>
            {step === "select"
              ? <Ionicons name="people" size={32} color={Colors.primary} />
              : <View style={[styles.staffInitialsCircle, { backgroundColor: selectedStaff?.color ?? Colors.accent }]}>
                  <Text style={styles.staffInitialsText}>{selectedStaff?.initials}</Text>
                </View>
            }
          </View>
          {step === "select" ? (
            <>
              <Text style={styles.heroTitle}>Delivery Staff Login</Text>
              <Text style={styles.heroSub}>Select your name to continue</Text>
              <Text style={styles.slogan}>Let us lift your experience</Text>
            </>
          ) : (
            <>
              <Text style={styles.heroTitle}>{selectedStaff?.name}</Text>
              <Text style={styles.heroSub}>Enter your 4-digit security code</Text>
            </>
          )}
        </View>

        {/* STEP 1: Staff Selection */}
        {step === "select" && (
          <View style={styles.staffGrid}>
            {DELIVERY_STAFF.map(staff => (
              <Pressable
                key={staff.id}
                style={({ pressed }) => [styles.staffCard, { borderColor: staff.color + "50" }, pressed && { opacity: 0.85 }]}
                onPress={() => handleSelectStaff(staff.id)}
              >
                <View style={[styles.staffAvatar, { backgroundColor: staff.color + "22" }]}>
                  <Text style={[styles.staffAvatarText, { color: staff.color }]}>{staff.initials}</Text>
                </View>
                <Text style={styles.staffName} numberOfLines={2}>{staff.name.split(" ")[0]}</Text>
                <Text style={styles.staffSurname} numberOfLines={1}>{staff.name.split(" ")[1]}</Text>
                <View style={[styles.staffArrow, { backgroundColor: staff.color + "15" }]}>
                  <Feather name="arrow-right" size={12} color={staff.color} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* STEP 2: PIN Entry */}
        {step === "pin" && (
          <View style={styles.pinSection}>
            {/* PIN dots */}
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map(i => (
                <PinDot key={i} filled={i < pin.length} shake={shakeAnim} />
              ))}
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name={locked ? "lock-closed" : "alert-circle"} size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Hint (masked code for dev guidance — production would remove this) */}
            {!locked && (
              <View style={styles.hintRow}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
                <Text style={styles.hintText}>Enter the 4-digit code assigned to you</Text>
              </View>
            )}

            {/* Numpad */}
            {!locked && (
              <View style={styles.numpad}>
                {numKeys.map((row, ri) => (
                  <View key={ri} style={styles.numRow}>
                    {row.map((key, ki) => {
                      if (key === "") return <View key={ki} style={styles.numKey} />;
                      if (key === "⌫") return (
                        <NumKey key={ki} label="⌫" onPress={handleDelete} disabled={loading || pin.length === 0} />
                      );
                      return (
                        <NumKey key={ki} label={key} onPress={() => handleDigit(key)} disabled={loading || pin.length >= 4} />
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {/* Locked state */}
            {locked && (
              <View style={styles.lockedBox}>
                <Ionicons name="lock-closed" size={32} color={Colors.danger} />
                <Text style={styles.lockedTitle}>Access Locked</Text>
                <Text style={styles.lockedSub}>Contact Gurvin Leachman to reset your access.</Text>
                <Pressable style={styles.switchBtn} onPress={() => { setStep("select"); setLocked(false); setAttempts(0); setPin(""); setError(""); }}>
                  <Text style={styles.switchBtnText}>Try a different name</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.textMuted} />
            <Text style={styles.securityText}>
              {DELIVERY_STAFF.length} authorised staff • Managed by Gurvin Leachman
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, gap: 0 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: { width: 40 },
  topTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  heroSection: { alignItems: "center", marginBottom: 28, gap: 6 },
  lockCircle: {
    width: 76, height: 76, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1, borderColor: "rgba(26,115,232,0.2)",
  },
  staffInitialsCircle: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  staffInitialsText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  slogan: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.primary, fontStyle: "italic", marginTop: 2 },
  // Staff grid
  staffGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", flex: 1, alignContent: "center" },
  staffCard: {
    width: "46%",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    gap: 8,
    ...makeShadow("#000", 4, 0.15, 8, 4),
  },
  staffAvatar: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  staffAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  staffName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, textAlign: "center" },
  staffSurname: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },
  staffArrow: { borderRadius: 20, padding: 4 },
  // PIN section
  pinSection: { flex: 1, alignItems: "center", gap: 18 },
  pinDots: { flexDirection: "row", gap: 16, marginTop: 8 },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: "transparent",
  },
  pinDotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 10, padding: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.25)",
    width: "100%",
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.danger, flex: 1 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hintText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  // Numpad
  numpad: { gap: 10, width: "100%" },
  numRow: { flexDirection: "row", justifyContent: "center", gap: 14 },
  numKey: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  numKeyInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
    ...makeShadow("#000", 2, 0.12, 6, 3),
  },
  numKeyLabel: { fontSize: 24, fontFamily: "Inter_500Medium", color: Colors.text },
  numKeySub: { fontSize: 9, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  // Locked
  lockedBox: { alignItems: "center", gap: 10, padding: 20, backgroundColor: "rgba(239,68,68,0.06)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", width: "100%" },
  lockedTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.danger },
  lockedSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },
  switchBtn: { marginTop: 6, backgroundColor: Colors.backgroundElevated, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  switchBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  // Footer
  footer: { alignItems: "center", paddingTop: 12 },
  securityNotice: { flexDirection: "row", alignItems: "center", gap: 5 },
  securityText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

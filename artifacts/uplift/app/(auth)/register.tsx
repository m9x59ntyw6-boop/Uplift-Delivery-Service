import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth, UserRole } from "@/contexts/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [role, setRole] = useState<UserRole>("student_staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    setError("");
    const success = await register(name.trim(), email.trim(), password, role);
    setLoading(false);
    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(auth)/terms");
    } else {
      setError("Email already registered. Please login instead.");
    }
  };

  return (
    <LinearGradient colors={["#0A0F1E", "#111827"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Platform.OS === "web" ? 67 + 16 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Uplift by Lyft Deliveries</Text>
        </View>

        <View style={styles.roleSelector}>
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleRow}>
            {([
              { value: "student_staff" as UserRole, label: "Student / Staff", icon: "school" as const },
              { value: "delivery" as UserRole, label: "Delivery Person", icon: "bicycle" as const },
            ]).map(r => (
              <Pressable
                key={r.value}
                style={[styles.roleOption, role === r.value && styles.roleOptionActive]}
                onPress={() => setRole(r.value)}
              >
                <Ionicons name={r.icon} size={18} color={role === r.value ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.roleOptionText, role === r.value && styles.roleOptionTextActive]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.form}>
          {[
            { key: "name", label: "Full Name", value: name, setter: setName, icon: "user" as const, placeholder: "Your full name", kb: "default" as const },
            { key: "email", label: "Email", value: email, setter: setEmail, icon: "mail" as const, placeholder: "your@email.com", kb: "email-address" as const },
            { key: "password", label: "Password", value: password, setter: setPassword, icon: "lock" as const, placeholder: "••••••••", kb: "default" as const, secure: true },
            { key: "confirm", label: "Confirm Password", value: confirmPw, setter: setConfirmPw, icon: "lock" as const, placeholder: "••••••••", kb: "default" as const, secure: true },
          ].map(field => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrap}>
                <Feather name={field.icon} size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={field.kb}
                  autoCapitalize={field.kb === "email-address" ? "none" : "words"}
                  secureTextEntry={field.secure}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.registerBtn, pressed && styles.pressed, loading && styles.disabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.registerBtnText}>Create Account</Text>
            }
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 24, width: 40 },
  header: { marginBottom: 28 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  roleSelector: { marginBottom: 20, gap: 10 },
  roleRow: { flexDirection: "row", gap: 12 },
  roleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleOptionActive: { borderColor: Colors.primary, backgroundColor: "rgba(26,115,232,0.1)" },
  roleOptionText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  roleOptionTextActive: { color: Colors.primary },
  form: { gap: 14 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.danger, flex: 1 },
  registerBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  registerBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    alignItems: "center",
  },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
});

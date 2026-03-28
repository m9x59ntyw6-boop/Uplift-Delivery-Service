import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
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
import { SavedAccount, useAuth, UserRole } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role?: UserRole }>();
  const role: UserRole = roleParam === "delivery" ? "delivery" : "student_staff";
  const { login, getSavedEmail, getSavedAccounts, removeSavedAccount, loginWithSavedAccount } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [loggingInId, setLoggingInId] = useState<string | null>(null);

  useEffect(() => {
    getSavedEmail().then(saved => {
      if (saved) setEmail(saved);
    });
    getSavedAccounts().then(accts => {
      setSavedAccounts(accts.filter(a => a.role === role));
    });
  }, []);

  const handleQuickLogin = async (account: SavedAccount) => {
    setLoggingInId(account.id);
    const result = await loginWithSavedAccount(account);
    setLoggingInId(null);
    if (result === "ok") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(student)");
    } else {
      setEmail(account.email);
      setError("Could not sign in automatically. Please enter your password.");
    }
  };

  const handleRemove = async (id: string) => {
    await removeSavedAccount(id);
    setSavedAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    setError("");
    const success = await login(email.trim(), password, role);
    setLoading(false);
    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (role === "delivery") router.replace("/(delivery)");
      else router.replace("/(student)");
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("No account found with those details. Check your email and password, or register a new account.");
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
          <View style={styles.roleIcon}>
            <Ionicons name="school" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Student / Staff Login</Text>
          <Text style={styles.subtitle}>Welcome back</Text>
          <Text style={styles.slogan}>Let us lift your experience</Text>
        </View>

        {savedAccounts.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedLabel}>Continue as</Text>
            <View style={styles.savedList}>
              {savedAccounts.map(account => {
                const isLoading = loggingInId === account.id;
                return (
                  <Pressable
                    key={account.id}
                    style={({ pressed }) => [styles.savedRow, pressed && styles.pressed]}
                    onPress={() => handleQuickLogin(account)}
                    disabled={!!loggingInId}
                  >
                    <View style={[styles.savedAvatar, { backgroundColor: account.avatarColor }]}>
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.savedAvatarText}>
                          {account.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.savedInfo}>
                      <Text style={styles.savedName}>{account.name}</Text>
                      <Text style={styles.savedEmail} numberOfLines={1}>{account.email}</Text>
                    </View>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <View style={styles.savedRight}>
                        <Feather name="chevron-right" size={16} color={Colors.primary} />
                      </View>
                    )}
                    <Pressable style={styles.savedRemove} onPress={() => handleRemove(account.id)}>
                      <Feather name="x" size={13} color={Colors.textMuted} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in manually</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={16} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={v => { setEmail(v); setError(""); }}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!email && (
                <Pressable onPress={() => setEmail("")} style={styles.clearBtn}>
                  <Feather name="x" size={14} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={v => { setPassword(v); setError(""); }}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPw}
              />
              <Pressable onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
                <Feather name={showPw ? "eye-off" : "eye"} size={16} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && styles.pressed, loading && styles.disabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.loginBtnText}>Sign In</Text>
            }
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>Register</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 24, width: 40 },
  header: { alignItems: "center", marginBottom: 28 },
  roleIcon: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16, backgroundColor: "rgba(26,115,232,0.15)",
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  slogan: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.primary, fontStyle: "italic", marginTop: 4 },

  savedSection: { gap: 12, marginBottom: 8 },
  savedLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  savedList: { gap: 8 },
  savedRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.backgroundCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 12,
    paddingRight: 38,
  },
  savedAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  savedAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  savedInfo: { flex: 1, gap: 2 },
  savedName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  savedEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  savedRight: {},
  savedRemove: {
    position: "absolute", right: 12, top: 12,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },

  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.backgroundCard, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  clearBtn: { padding: 4, marginLeft: 4 },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.danger, flex: 1 },
  loginBtn: {
    height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.primary, marginTop: 8,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, alignItems: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
});

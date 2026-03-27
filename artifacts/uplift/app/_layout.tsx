import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { setupGlobalErrorHandlers } from "@/utils/errorGuard";

// ─── Step 1: Install global crash guards at the very top ──────────────────────
setupGlobalErrorHandlers();

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      // Don't crash the app on query failure — return stale data
      throwOnError: false,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(delivery)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ─── Step 2: Safe startup loading ─────────────────────────────────────────
  // A lot of Expo crashes happen when data loads too early.
  // We wait for fonts + a brief async init before rendering the app.
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Fonts must be ready before anything renders
        if (!fontsLoaded && !fontError) return;

        // Hide the splash screen safely
        await SplashScreen.hideAsync().catch(() => {});

        // Brief pause to let all providers stabilise before rendering
        await new Promise<void>(resolve => setTimeout(resolve, 100));

        setAppReady(true);
      } catch (e) {
        console.warn("[Uplift] Startup error:", e);
        // Still mark as ready so the app doesn't stay on a blank screen
        setAppReady(true);
      }
    };

    initApp();
  }, [fontsLoaded, fontError]);

  // ─── Step 3: Safe loading screen ──────────────────────────────────────────
  // Show a spinner instead of a white/blank screen during startup
  if (!appReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Uplift</Text>
        <Text style={styles.loadingSlogan}>Let us lift your experience</Text>
      </View>
    );
  }

  // ─── Step 4: Fully wrapped app with error protection ─────────────────────
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <OrderProvider>
                  <ChatProvider>
                    <RootLayoutNav />
                  </ChatProvider>
                </OrderProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0A0F1E",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  loadingSlogan: {
    fontSize: 14,
    color: "#1A73E8",
    fontStyle: "italic",
  },
});

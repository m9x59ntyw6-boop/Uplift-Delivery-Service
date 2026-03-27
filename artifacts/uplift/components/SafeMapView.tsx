/**
 * SafeMapView — wraps react-native-maps in an error boundary.
 * If the Maps native module fails to initialize (no API key on Android,
 * unsupported device, etc.), shows a styled fallback instead of crashing.
 */
import React, { Component } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

// Forward all react-native-maps exports so callers can use a single import
export { Marker, Polyline, Circle, Callout } from "react-native-maps";
export { default } from "react-native-maps";

interface MapErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class MapErrorBoundary extends Component<
  { children: React.ReactNode; style?: object },
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, errorMessage: error.message ?? "Map unavailable" };
  }

  componentDidCatch(error: Error) {
    // Downgrade to log-level — map errors are non-fatal
    console.log("[MapView] Native map failed to render:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.fallback, this.props.style]}>
          <Feather name="map" size={32} color={Colors.textMuted} />
          <Text style={styles.fallbackTitle}>Map Unavailable</Text>
          <Text style={styles.fallbackSub}>
            {Platform.OS === "android"
              ? "Google Maps requires an API key on Android"
              : "Map could not be loaded on this device"}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  fallbackSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 220,
  },
});

import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

export default function MapViewStub({ style, children }: { style?: any; children?: React.ReactNode }) {
  return (
    <View style={[styles.stub, style]}>
      <Feather name="map" size={40} color={Colors.textMuted} />
      <Text style={styles.text}>GPS Map (mobile only)</Text>
      <Text style={styles.sub}>Live tracking available on iOS/Android</Text>
    </View>
  );
}

export function Marker({ title, description }: { title?: string; description?: string; coordinate?: any; pinColor?: string }) {
  return null;
}

const styles = StyleSheet.create({
  stub: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 200,
  },
  text: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

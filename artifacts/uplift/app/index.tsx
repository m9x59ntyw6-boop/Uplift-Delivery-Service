import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/(auth)/welcome");
    } else if (!user.agreedToTerms) {
      router.replace("/(auth)/terms");
    } else if (user.role === "delivery") {
      router.replace("/(delivery)");
    } else {
      router.replace("/(student)");
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});

import { Stack } from "expo-router";
import React from "react";
import { Colors } from "@/constants/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="delivery-login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}

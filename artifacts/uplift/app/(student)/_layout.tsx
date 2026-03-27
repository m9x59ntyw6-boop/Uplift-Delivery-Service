import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/colors";

function renderIcon(featherName: string, sfName: string, color: string) {
  if (Platform.OS === "ios") {
    try {
      const { SymbolView } = require("expo-symbols");
      return <SymbolView name={sfName} tintColor={color} size={22} />;
    } catch {
      return <Feather name={featherName as any} size={22} color={color} />;
    }
  }
  return <Feather name={featherName as any} size={22} color={color} />;
}

export default function StudentTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Menu",
          tabBarIcon: ({ color }) => renderIcon("grid", "fork.knife", color),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => renderIcon("shopping-bag", "bag", color),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Support",
          tabBarIcon: ({ color }) => renderIcon("message-circle", "bubble.left", color),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => renderIcon("user", "person", color),
        }}
      />
      <Tabs.Screen name="cart" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="chat-room" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="order-tracking" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}

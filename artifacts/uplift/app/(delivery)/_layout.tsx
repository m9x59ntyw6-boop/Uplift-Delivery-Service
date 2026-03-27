import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/colors";
import { useChat } from "@/contexts/ChatContext";

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

export default function DeliveryTabLayout() {
  const { rooms } = useChat();
  const totalUnread = rooms.reduce((s, r) => s + r.unread, 0);
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
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
          title: "Orders",
          tabBarIcon: ({ color }) => renderIcon("list", "list.bullet", color),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color }) => renderIcon("dollar-sign", "banknote", color),
        }}
      />
      <Tabs.Screen
        name="delivery-chat"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => renderIcon("message-circle", "bubble.left.and.bubble.right", color),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.accent, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => renderIcon("bar-chart-2", "chart.bar", color),
        }}
      />
      <Tabs.Screen
        name="delivery-profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => renderIcon("user", "person", color),
        }}
      />
      <Tabs.Screen name="delivery-chat-room" options={{ href: null }} />
      <Tabs.Screen name="menu-editor" options={{ href: null }} />
    </Tabs>
  );
}

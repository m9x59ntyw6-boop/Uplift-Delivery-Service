import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/colors";
import { useChat } from "@/contexts/ChatContext";

function NativeTabLayout() {
  const { rooms } = useChat();
  const totalUnread = rooms.reduce((s, r) => s + r.unread, 0);

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
        <Label>Orders</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="earnings">
        <Icon sf={{ default: "banknote", selected: "banknote.fill" }} />
        <Label>Earnings</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="delivery-chat">
        <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} />
        <Label>Chats{totalUnread > 0 ? ` (${totalUnread})` : ""}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="analytics">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Analytics</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="delivery-profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const { rooms } = useChat();
  const totalUnread = rooms.reduce((s, r) => s + r.unread, 0);

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const renderIcon = (sfName: string, featherName: string, color: string) => {
    if (isIOS) {
      try {
        const { SymbolView } = require("expo-symbols");
        return <SymbolView name={sfName} tintColor={color} size={22} />;
      } catch {
        return <Feather name={featherName as any} size={22} color={color} />;
      }
    }
    return <Feather name={featherName as any} size={22} color={color} />;
  };

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
          tabBarIcon: ({ color }) => renderIcon("list.bullet", "list", color),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color }) => renderIcon("banknote", "dollar-sign", color),
        }}
      />
      <Tabs.Screen
        name="delivery-chat"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => renderIcon("bubble.left.and.bubble.right", "message-circle", color),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.accent, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => renderIcon("chart.bar", "bar-chart-2", color),
        }}
      />
      <Tabs.Screen
        name="delivery-profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => renderIcon("person", "user", color),
        }}
      />
      {/* Hidden screens — navigable but not in tab bar */}
      <Tabs.Screen name="delivery-chat-room" options={{ href: null }} />
      <Tabs.Screen name="menu-editor" options={{ href: null }} />
    </Tabs>
  );
}

export default function DeliveryTabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

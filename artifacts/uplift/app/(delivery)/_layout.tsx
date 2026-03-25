import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/colors";

function NativeTabLayout() {
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
      <NativeTabs.Trigger name="menu-editor">
        <Icon sf={{ default: "square.and.pencil", selected: "square.and.pencil" }} />
        <Label>Menu</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="delivery-profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
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
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="list.bullet" tintColor={color} size={22} /> : <Feather name="list" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="banknote" tintColor={color} size={22} /> : <Feather name="dollar-sign" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu-editor"
        options={{
          title: "Menu",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="square.and.pencil" tintColor={color} size={22} /> : <Feather name="edit-2" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="delivery-profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person" tintColor={color} size={22} /> : <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function DeliveryTabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";
import { makeShadow } from "@/utils/shadow";

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DeliveryChatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { rooms, isOnline } = useChat();
  const { orders } = useOrders();

  // Show ALL rooms — delivery staff can see every customer's conversation
  const allRooms = useMemo(() => {
    return [...rooms].sort((a, b) =>
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  }, [rooms]);

  const totalUnread = allRooms.reduce((s, r) => s + r.unread, 0);

  const openRoom = (roomId: string, userName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(delivery)/delivery-chat-room",
      params: { roomId, userName },
    });
  };

  const renderRoom = ({ item: room }: { item: typeof allRooms[0] }) => {
    const isSupport = room.id.startsWith("support-");
    const linkedOrder = orders.find(o => o.id === room.orderId);
    const hasUnread = room.unread > 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.roomCard, pressed && { opacity: 0.88 }]}
        onPress={() => openRoom(room.id, room.userName)}
      >
        <View style={[styles.avatarCircle, { backgroundColor: isSupport ? "rgba(168,85,247,0.15)" : "rgba(26,115,232,0.15)" }]}>
          <Text style={[styles.avatarText, { color: isSupport ? "#A855F7" : Colors.primary }]}>
            {room.userName.charAt(0).toUpperCase()}
          </Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{room.unread > 9 ? "9+" : room.unread}</Text>
            </View>
          )}
        </View>

        <View style={styles.roomInfo}>
          <View style={styles.roomTopRow}>
            <Text style={[styles.roomName, hasUnread && styles.roomNameUnread]}>
              {room.userName}
            </Text>
            <Text style={styles.roomTime}>{timeAgo(room.lastTimestamp)}</Text>
          </View>

          {linkedOrder && (
            <View style={styles.orderTag}>
              <Ionicons name="receipt" size={10} color={Colors.accent} />
              <Text style={styles.orderTagText}>
                {linkedOrder.items[0]?.menuItemName ?? "Order"} • J${linkedOrder.total.toLocaleString()}
              </Text>
            </View>
          )}

          <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
            {room.lastMessage}
          </Text>
        </View>

        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Customer Chats</Text>
          <Text style={styles.headerSub}>
            {allRooms.length} conversation{allRooms.length !== 1 ? "s" : ""}
            {totalUnread > 0 ? ` • ${totalUnread} unread` : ""}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isOnline ? "rgba(34,197,94,0.12)" : "rgba(107,114,128,0.12)" }]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? Colors.success : Colors.textMuted }]} />
          <Text style={[styles.statusText, { color: isOnline ? Colors.success : Colors.textMuted }]}>
            {isOnline ? "Live" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={14} color={Colors.primary} />
        <Text style={styles.infoBannerText}>
          You are responding as <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold" }}>{user?.name}</Text> — all customers can see your replies
        </Text>
      </View>

      {/* Chat list */}
      <FlatList
        data={allRooms}
        keyExtractor={r => r.id}
        renderItem={renderRoom}
        contentContainerStyle={[styles.listContent, {
          paddingBottom: Platform.OS === "web" ? 34 + 90 : insets.bottom + 90
        }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="message-circle" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No customer chats yet</Text>
            <Text style={styles.emptySub}>When customers start conversations, they'll appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "rgba(26,115,232,0.08)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(26,115,232,0.2)",
  },
  infoBannerText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, flex: 1 },
  listContent: { paddingHorizontal: 20, gap: 10 },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...makeShadow("#000", 3, 0.12, 6, 3),
  },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  unreadBadge: {
    position: "absolute",
    top: -2, right: -2,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: Colors.backgroundCard,
  },
  unreadBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  roomInfo: { flex: 1, gap: 3 },
  roomTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roomName: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  roomNameUnread: { fontFamily: "Inter_700Bold", color: Colors.text },
  roomTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  orderTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  orderTagText: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.accent },
  lastMessage: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  lastMessageUnread: { color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  emptyState: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.backgroundCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center", maxWidth: 240 },
});

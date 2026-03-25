import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
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

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { rooms, getOrCreateRoom } = useChat();
  const { orders } = useOrders();

  const myOrders = orders.filter(o => o.userId === user?.id);
  const myRooms = rooms.filter(r => r.userId === user?.id);

  const openOrCreateChat = (orderId: string) => {
    if (!user) return;
    getOrCreateRoom(orderId, user.id, user.name);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/(student)/chat-room", params: { orderId } });
  };

  const openSupportChat = () => {
    if (!user) return;
    const supportRoomId = `support-${user.id}`;
    const existing = rooms.find(r => r.id === supportRoomId);
    if (!existing) {
      getOrCreateRoom(supportRoomId, user.id, user.name);
    }
    router.push({ pathname: "/(student)/chat-room", params: { orderId: supportRoomId } });
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support & Chat</Text>
      </View>

      <View style={styles.supportCard}>
        <View style={styles.supportIcon}>
          <Feather name="headphones" size={22} color={Colors.primary} />
        </View>
        <View style={styles.supportInfo}>
          <Text style={styles.supportTitle}>Customer Service</Text>
          <Text style={styles.supportSubtitle}>Available 24/7 · Fast response</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.chatBtn, pressed && styles.pressed]}
          onPress={openSupportChat}
        >
          <Text style={styles.chatBtnText}>Chat</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Order Chats</Text>

      <FlatList
        data={myOrders}
        keyExtractor={o => o.id}
        renderItem={({ item: order }) => {
          const room = myRooms.find(r => r.orderId === order.id);
          return (
            <Pressable
              style={({ pressed }) => [styles.orderChatCard, pressed && styles.pressed]}
              onPress={() => openOrCreateChat(order.id)}
            >
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>
                  {order.deliveryPersonName?.charAt(0) ?? "#"}
                </Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.chatPreview} numberOfLines={1}>
                  {room?.lastMessage ?? "Tap to start chat"}
                </Text>
              </View>
              <View style={styles.chatMeta}>
                {(room?.unread ?? 0) > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{room!.unread}</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={16} color={Colors.textMuted} />
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!myOrders.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No order chats yet</Text>
            <Text style={styles.emptySubText}>Place an order to start chatting</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "rgba(26,115,232,0.1)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(26,115,232,0.3)",
    gap: 12,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(26,115,232,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  supportInfo: { flex: 1 },
  supportTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  supportSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  chatBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  pressed: { opacity: 0.85 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listContent: { paddingHorizontal: 20, gap: 10 },
  orderChatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  chatAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  chatInfo: { flex: 1 },
  chatTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  chatPreview: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  chatMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

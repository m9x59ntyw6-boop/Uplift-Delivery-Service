import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { ChatMessage, useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { clearNotifications } from "@/utils/notifications";

function MessageBubble({ message, isMe }: { message: ChatMessage; isMe: boolean }) {
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isCS = message.isCustomerService;

  return (
    <View style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isMe && (
        <View style={[styles.senderAvatar, { backgroundColor: isCS ? "rgba(26,115,232,0.15)" : "rgba(255,107,53,0.15)" }]}>
          {isCS
            ? <Feather name="headphones" size={13} color={Colors.primary} />
            : <Text style={[styles.senderAvatarText, { color: Colors.accent }]}>{(message.senderName || "?").charAt(0)}</Text>
          }
        </View>
      )}
      <View style={[
        styles.bubble,
        isMe ? styles.bubbleMe : isCS ? styles.bubbleCS : styles.bubbleCustomer,
      ]}>
        {!isMe && <Text style={[styles.senderName, { color: isCS ? Colors.primary : Colors.accent }]}>{message.senderName}</Text>}
        {message.isReview && (
          <View style={styles.reviewRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <Ionicons key={s} name={s <= (message.rating ?? 0) ? "star" : "star-outline"} size={14} color={Colors.ratingYellow} />
            ))}
          </View>
        )}
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.content}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
      </View>
    </View>
  );
}

function TypingBubble({ name }: { name: string }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const dots = [dot1, dot2, dot3];
  useEffect(() => {
    dots.forEach((d, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ])).start();
    });
  }, []);
  return (
    <View style={styles.typingWrap}>
      <View style={styles.senderAvatar}>
        <Text style={styles.senderAvatarText}>{name.charAt(0)}</Text>
      </View>
      <View style={styles.typingBubble}>
        <Text style={styles.typingName}>{name} is typing</Text>
        <View style={styles.typingDots}>
          {dots.map((d, i) => <Animated.View key={i} style={[styles.typingDot, { opacity: d }]} />)}
        </View>
      </View>
    </View>
  );
}

export default function DeliveryChatRoomScreen() {
  const { roomId, userName } = useLocalSearchParams<{ roomId: string; userName: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { rooms, sendMessage, markRead, openRoom, sendTyping, stopTyping, isOnline, typingIn } = useChat();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const room = rooms.find(r => r.id === roomId);
  const messages = room?.messages ?? [];
  const whoIsTyping = roomId ? typingIn[roomId] : null;

  useEffect(() => {
    if (roomId) {
      markRead(roomId);
      openRoom(roomId);
      clearNotifications().catch(() => {});
    }
  }, [roomId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim() || !user || !roomId) return;
    // Delivery person sends as themselves (NOT as customer service auto-reply)
    sendMessage(roomId, user.id, user.name, text.trim(), false);
    setText("");
    if (roomId) stopTyping(roomId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (!roomId || !user) return;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (val.trim()) {
      sendTyping(roomId, user.name);
      typingTimeout.current = setTimeout(() => stopTyping(roomId), 2000);
    } else {
      stopTyping(roomId);
    }
  };

  const displayName = userName ?? room?.userName ?? "Customer";

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.topInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.topName}>{displayName}</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.success : Colors.textMuted }]} />
              <Text style={[styles.onlineText, { color: isOnline ? Colors.success : Colors.textMuted }]}>
                {isOnline ? "Real-time chat" : "Offline — saved locally"}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.connBadge, { backgroundColor: isOnline ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)" }]}>
          <Ionicons name={isOnline ? "wifi" : "cloud-offline"} size={13} color={isOnline ? Colors.success : Colors.textMuted} />
        </View>
      </View>

      {/* Delivery person identity banner */}
      <View style={styles.identityBanner}>
        <Ionicons name="bicycle" size={13} color={Colors.accent} />
        <Text style={styles.identityText}>
          Replying as <Text style={{ color: Colors.accent, fontFamily: "Inter_600SemiBold" }}>{user?.name}</Text>
        </Text>
      </View>

      <KeyboardAvoidingView style={styles.kav} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.senderId === user?.id} />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={whoIsTyping ? <TypingBubble name={whoIsTyping} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
        />

        {/* Quick replies for delivery staff */}
        <View style={styles.quickReplies}>
          {[
            "On my way! 🚴",
            "Arrived at pickup",
            "Your order is ready",
            "Be there in 5 mins",
          ].map(reply => (
            <Pressable
              key={reply}
              style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.75 }]}
              onPress={() => {
                setText(reply);
                Haptics.selectionAsync();
              }}
            >
              <Text style={styles.quickBtnText}>{reply}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Reply to customer..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
          />
          <Pressable
            style={({ pressed }) => [styles.sendBtn, !text.trim() && styles.sendBtnDisabled, pressed && { opacity: 0.85 }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Feather name="send" size={18} color={text.trim() ? "#fff" : Colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 12 },
  topInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  customerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  customerAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.accent },
  topName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  connBadge: { borderRadius: 8, padding: 6, alignItems: "center", justifyContent: "center" },
  identityBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,107,53,0.07)",
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,107,53,0.15)",
  },
  identityText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  kav: { flex: 1 },
  messageList: { paddingHorizontal: 16, paddingVertical: 10 },
  bubbleWrap: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 6 },
  bubbleLeft: { justifyContent: "flex-start" },
  bubbleRight: { justifyContent: "flex-end" },
  senderAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  senderAvatarText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  bubble: { maxWidth: "75%", borderRadius: 16, padding: 10, gap: 3 },
  bubbleMe: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleCS: { backgroundColor: Colors.backgroundCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleCustomer: { backgroundColor: Colors.backgroundElevated, borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  reviewRow: { flexDirection: "row", gap: 2, marginBottom: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 20 },
  bubbleTextMe: { color: "#fff" },
  bubbleTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted, alignSelf: "flex-end" },
  bubbleTimeMe: { color: "rgba(255,255,255,0.65)" },
  // Typing indicator
  typingWrap: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 12, paddingHorizontal: 16 },
  typingBubble: {
    backgroundColor: Colors.backgroundCard, borderRadius: 16, borderBottomLeftRadius: 4,
    padding: 10, gap: 4, borderWidth: 1, borderColor: Colors.border,
  },
  typingName: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  typingDots: { flexDirection: "row", gap: 4, alignItems: "center", height: 16 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textSecondary },
  // Quick replies
  quickReplies: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    paddingHorizontal: 12, paddingTop: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  quickBtn: {
    backgroundColor: "rgba(255,107,53,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,107,53,0.25)",
  },
  quickBtnText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.accent },
  // Input
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 12, paddingTop: 8,
    backgroundColor: Colors.backgroundSecondary,
    gap: 8,
  },
  input: {
    flex: 1, backgroundColor: Colors.backgroundCard,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontFamily: "Inter_400Regular",
    color: Colors.text, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: Colors.backgroundElevated },
  emptyState: { paddingTop: 60, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

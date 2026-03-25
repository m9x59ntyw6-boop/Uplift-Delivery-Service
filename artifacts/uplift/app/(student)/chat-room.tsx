import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
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

function MessageBubble({ message, isMe }: { message: ChatMessage; isMe: boolean }) {
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <View style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isMe && (
        <View style={styles.senderAvatar}>
          <Text style={styles.senderAvatarText}>{message.senderName.charAt(0)}</Text>
        </View>
      )}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : message.isCustomerService ? styles.bubbleCS : styles.bubbleOther]}>
        {!isMe && <Text style={styles.senderName}>{message.senderName}</Text>}
        {message.isReview && (
          <View style={styles.reviewBubble}>
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons key={s} name={s <= (message.rating ?? 0) ? "star" : "star-outline"} size={14} color={Colors.ratingYellow} />
              ))}
            </View>
          </View>
        )}
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.content}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
      </View>
    </View>
  );
}

export default function ChatRoomScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { rooms, sendMessage, markRead } = useChat();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const room = rooms.find(r => r.id === orderId);
  const messages = room?.messages ?? [];

  useEffect(() => {
    if (orderId) markRead(orderId);
  }, [orderId, messages.length]);

  const handleSend = () => {
    if (!text.trim() || !user || !orderId) return;
    sendMessage(orderId, user.id, user.name, text.trim());
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.topInfo}>
          <View style={styles.csAvatar}>
            <Feather name="headphones" size={16} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.topName}>Customer Service</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.kav} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.senderId === user?.id} />
          )}
          contentContainerStyle={[styles.messageList, { paddingTop: 10, paddingBottom: 10 }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Feather name="message-circle" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Start the conversation</Text>
            </View>
          }
        />
        <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
          />
          <Pressable
            style={({ pressed }) => [styles.sendBtn, !text.trim() && styles.sendBtnDisabled, pressed && styles.pressed]}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 12 },
  topInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  csAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(26,115,232,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  topName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.success },
  kav: { flex: 1 },
  messageList: { paddingHorizontal: 16 },
  bubbleWrap: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 6,
  },
  bubbleLeft: { justifyContent: "flex-start" },
  bubbleRight: { justifyContent: "flex-end" },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  senderAvatarText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 10,
    gap: 3,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleCS: {
    backgroundColor: Colors.backgroundCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleOther: {
    backgroundColor: Colors.backgroundElevated,
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.primary, marginBottom: 2 },
  reviewBubble: { marginBottom: 4 },
  reviewStars: { flexDirection: "row", gap: 2 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 20 },
  bubbleTextMe: { color: "#fff" },
  bubbleTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted, alignSelf: "flex-end" },
  bubbleTimeMe: { color: "rgba(255,255,255,0.6)" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: Colors.backgroundElevated },
  pressed: { opacity: 0.85 },
  emptyMessages: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

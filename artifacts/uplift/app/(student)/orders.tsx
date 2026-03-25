import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Order, useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import MapView, { Marker } from "react-native-maps";

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  accepted: Colors.primary,
  preparing: Colors.accent,
  on_the_way: Colors.success,
  delivered: Colors.success,
  cancelled: Colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "clock",
  accepted: "check-circle",
  preparing: "package",
  on_the_way: "navigation",
  delivered: "check-circle",
  cancelled: "x-circle",
};

function StarRating({ rating, setRating }: { rating: number; setRating: (r: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(s => (
        <Pressable key={s} onPress={() => { setRating(s); Haptics.selectionAsync(); }}>
          <Ionicons name={s <= rating ? "star" : "star-outline"} size={32} color={s <= rating ? Colors.ratingYellow : Colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { rateDelivery } = useOrders();
  const { getOrCreateRoom, sendReview } = useChat();
  const [showMap, setShowMap] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const color = STATUS_COLORS[order.status] ?? Colors.textMuted;
  const label = STATUS_LABELS[order.status] ?? order.status;
  const icon = STATUS_ICONS[order.status] ?? "circle";

  const handleReview = async () => {
    if (!rating || !user) return;
    await rateDelivery(order.id, rating, reviewText);
    const room = getOrCreateRoom(order.id, user.id, user.name);
    sendReview(room.id, user.id, user.name, reviewText || `Rated ${rating} stars`, rating);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReviewed(true);
    setShowReview(false);
  };

  const handleChat = () => {
    if (!user) return;
    getOrCreateRoom(order.id, user.id, user.name);
    router.push({ pathname: "/(student)/chat-room", params: { orderId: order.id } });
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${color}20`, borderColor: `${color}50` }]}>
          <Feather name={icon as any} size={12} color={color} />
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.slice(0, 3).map((item, i) => (
          <Text key={i} style={styles.orderItem}>
            {item.quantity}x {item.menuItemName} ({item.size}) — J${(item.price * item.quantity).toLocaleString()}
          </Text>
        ))}
        {order.items.length > 3 && (
          <Text style={styles.orderItemMore}>+{order.items.length - 3} more items</Text>
        )}
      </View>

      {order.deliveryPersonName && (
        <View style={styles.driverRow}>
          <Ionicons name="person-circle" size={16} color={Colors.primary} />
          <Text style={styles.driverName}>{order.deliveryPersonName}</Text>
          {order.estimatedMinutes && order.status === "on_the_way" && (
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>~{order.estimatedMinutes} min</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.orderFooter}>
        <View>
          {order.streakDiscount && (
            <View style={styles.discountTag}>
              <Ionicons name="flame" size={12} color={Colors.streakOrange} />
              <Text style={styles.discountTagText}>Streak deal applied</Text>
            </View>
          )}
          <Text style={styles.orderTotal}>J${order.total.toLocaleString()}</Text>
        </View>
        <View style={styles.actionBtns}>
          {(order.status === "on_the_way" || order.status === "accepted") && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.mapBtn, pressed && styles.pressed]}
              onPress={() => setShowMap(true)}
            >
              <Feather name="map-pin" size={14} color="#fff" />
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.chatBtn, pressed && styles.pressed]}
            onPress={handleChat}
          >
            <Feather name="message-circle" size={14} color="#fff" />
          </Pressable>
          {order.status === "delivered" && !reviewed && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.reviewBtn, pressed && styles.pressed]}
              onPress={() => setShowReview(true)}
            >
              <Ionicons name="star" size={14} color="#fff" />
            </Pressable>
          )}
          {reviewed && (
            <View style={[styles.actionBtn, { backgroundColor: Colors.success }]}>
              <Feather name="check" size={14} color="#fff" />
            </View>
          )}
        </View>
      </View>

      <Modal visible={showMap} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowMap(false)}>
        <View style={[styles.mapModal, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 10 }]}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Live Tracking</Text>
            <Pressable onPress={() => setShowMap(false)}>
              <Feather name="x" size={22} color={Colors.text} />
            </Pressable>
          </View>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 18.0179,
              longitude: -76.8099,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: (order.deliveryLatitude ?? 18.0179) + (Math.random() - 0.5) * 0.002,
                longitude: (order.deliveryLongitude ?? -76.8099) + (Math.random() - 0.5) * 0.002,
              }}
              title={order.deliveryPersonName ?? "Delivery"}
              description="On the way to you"
            />
            <Marker
              coordinate={{ latitude: 18.0179, longitude: -76.8099 }}
              title="Your Location"
              pinColor="blue"
            />
          </MapView>
          <View style={styles.mapInfo}>
            <View style={styles.mapInfoRow}>
              <Ionicons name="bicycle" size={18} color={Colors.primary} />
              <Text style={styles.mapInfoText}>{order.deliveryPersonName} is on the way</Text>
            </View>
            <View style={styles.mapInfoRow}>
              <Ionicons name="time" size={18} color={Colors.warning} />
              <Text style={styles.mapInfoText}>Est. {order.estimatedMinutes ?? "15"} minutes</Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showReview} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowReview(false)}>
        <View style={[styles.reviewModal, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 10, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 10 }]}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Rate Delivery</Text>
            <Pressable onPress={() => setShowReview(false)}>
              <Feather name="x" size={22} color={Colors.text} />
            </Pressable>
          </View>
          <View style={styles.reviewContent}>
            <Text style={styles.reviewDriverName}>{order.deliveryPersonName}</Text>
            <Text style={styles.reviewSubtitle}>How was your delivery experience?</Text>
            <StarRating rating={rating} setRating={setRating} />
            <TextInput
              style={styles.reviewInput}
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Share your experience (optional)..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
            />
            <Pressable
              style={({ pressed }) => [styles.submitReviewBtn, !rating && styles.orderBtnDisabled, pressed && styles.pressed]}
              onPress={handleReview}
              disabled={!rating}
            >
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={styles.submitReviewText}>Submit Review</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { orders } = useOrders();
  const { user } = useAuth();
  const myOrders = orders.filter(o => o.userId === user?.id);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      <FlatList
        data={myOrders}
        keyExtractor={o => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!myOrders.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="shopping-bag" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Start by adding items to your cart</Text>
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
  listContent: { paddingHorizontal: 20, gap: 12 },
  orderCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  orderDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  orderItems: { gap: 3 },
  orderItem: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  orderItemMore: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  driverName: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  etaBadge: {
    marginLeft: "auto",
    backgroundColor: "rgba(34,197,94,0.1)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  etaText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.success },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  discountTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  discountTagText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.streakOrange },
  orderTotal: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.primary },
  actionBtns: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mapBtn: { backgroundColor: Colors.deliveryBlue },
  chatBtn: { backgroundColor: Colors.primary },
  reviewBtn: { backgroundColor: Colors.ratingYellow },
  pressed: { opacity: 0.85 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  mapModal: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mapTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  map: { flex: 1, borderRadius: 16, overflow: "hidden" },
  mapInfo: { paddingVertical: 16, gap: 10 },
  mapInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mapInfoText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text },
  reviewModal: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  reviewContent: { flex: 1, gap: 16, paddingTop: 10 },
  reviewDriverName: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  reviewSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  starRow: { flexDirection: "row", gap: 8 },
  reviewInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    height: 120,
    textAlignVertical: "top",
  },
  submitReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.ratingYellow,
    borderRadius: 14,
    height: 52,
    marginTop: 8,
  },
  submitReviewText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  orderBtnDisabled: { backgroundColor: Colors.backgroundElevated, opacity: 0.5 },
});

import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { CartItem, useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { makeShadow } from "@/utils/shadow";

function CartItemRow({ item }: { item: CartItem }) {
  const { addToCart, removeFromCart, menuItems } = useOrders();
  const menuItem = menuItems.find(m => m.id === item.menuItemId);

  return (
    <View style={styles.cartItemRow}>
      <View style={styles.cartItemEmoji}>
        <Text style={{ fontSize: 22 }}>{menuItem?.emoji ?? ""}</Text>
      </View>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.menuItemName}</Text>
        <Text style={styles.cartItemSize}>{item.size.charAt(0).toUpperCase() + item.size.slice(1)} • J${item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.qtyRow}>
        <Pressable
          style={styles.qtyBtn}
          onPress={() => { removeFromCart(item.menuItemId, item.size); Haptics.selectionAsync(); }}
        >
          <Feather name="minus" size={14} color={Colors.text} />
        </Pressable>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <Pressable
          style={styles.qtyBtn}
          onPress={() => {
            if (menuItem) addToCart(menuItem, item.size);
            Haptics.selectionAsync();
          }}
        >
          <Feather name="plus" size={14} color={Colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { cart, cartTotal, cartCount, deliveryPersons, placeOrder, getStreakDiscount, clearCart } = useOrders();
  const { user } = useAuth();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const discount = getStreakDiscount();
  const discountAmount = Math.floor(cartTotal * discount);
  const finalTotal = cartTotal - discountAmount;

  const handleOrder = async () => {
    if (!selectedDriver) { return; }
    if (!location.trim()) { return; }
    setLoading(true);
    const order = await placeOrder(selectedDriver, location.trim());
    setLoading(false);
    if (order) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(student)/orders");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Your Cart</Text>
        {cart.length > 0 && (
          <Pressable onPress={() => { clearCart(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Feather name="shopping-bag" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from the menu</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.back()}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items ({cartCount})</Text>
            <View style={styles.card}>
              {cart.map((item, i) => <CartItemRow key={`${item.menuItemId}-${item.size}`} item={item} />)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Delivery Person</Text>
            <View style={styles.driversGrid}>
              {deliveryPersons.filter(d => d.isAvailable).map(d => (
                <Pressable
                  key={d.id}
                  style={[styles.driverCard, selectedDriver === d.id && styles.driverCardActive]}
                  onPress={() => { setSelectedDriver(d.id); Haptics.selectionAsync(); }}
                >
                  <View style={[styles.driverAvatar, selectedDriver === d.id && styles.driverAvatarActive]}>
                    <Text style={styles.driverInitial}>{d.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.driverName} numberOfLines={1}>{d.name.split(" ")[0]}</Text>
                  <View style={styles.driverRating}>
                    <Ionicons name="star" size={12} color={Colors.ratingYellow} />
                    <Text style={styles.driverRatingText}>{d.rating}</Text>
                  </View>
                  {selectedDriver === d.id && (
                    <View style={styles.checkMark}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
            {deliveryPersons.filter(d => !d.isAvailable).map(d => (
              <View key={d.id} style={[styles.driverCard, styles.driverCardDisabled]}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitial}>{d.name.charAt(0)}</Text>
                </View>
                <Text style={[styles.driverName, { opacity: 0.5 }]} numberOfLines={1}>{d.name.split(" ")[0]}</Text>
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Location</Text>
            <View style={styles.locationInput}>
              <Feather name="map-pin" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.locationText}
                value={location}
                onChangeText={setLocation}
                placeholder="Room/Building/Location..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>J${cartTotal.toLocaleString()}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <View style={styles.discountLabel}>
                    <Ionicons name="flame" size={14} color={Colors.streakOrange} />
                    <Text style={[styles.summaryLabel, { color: Colors.streakOrange }]}>Streak Discount</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: Colors.streakOrange }]}>-J${discountAmount.toLocaleString()}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>J${finalTotal.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.orderBtn,
              (!selectedDriver || !location.trim()) && styles.orderBtnDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleOrder}
            disabled={loading || !selectedDriver || !location.trim()}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.orderBtnText}>Place Order • J${finalTotal.toLocaleString()}</Text>
              </>
            }
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { marginRight: 12 },
  topTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  clearText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.danger },
  emptyCart: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  browseBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scrollContent: { paddingHorizontal: 20, gap: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cartItemEmoji: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  cartItemSize: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, minWidth: 20, textAlign: "center" },
  driversGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  driverCard: {
    width: "22%",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  driverCardActive: { borderColor: Colors.primary, backgroundColor: "rgba(26,115,232,0.1)" },
  driverCardDisabled: { opacity: 0.5 },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  driverAvatarActive: { borderColor: Colors.primary },
  driverInitial: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  driverName: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.text, textAlign: "center" },
  driverRating: { flexDirection: "row", alignItems: "center", gap: 2 },
  driverRatingText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  offlineText: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  checkMark: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  locationText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text },
  summaryCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  discountLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.primary },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    ...makeShadow(Colors.primary, 4, 0.4, 12, 8),
  },
  orderBtnDisabled: { backgroundColor: Colors.backgroundElevated },
  pressed: { opacity: 0.85 },
  orderBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

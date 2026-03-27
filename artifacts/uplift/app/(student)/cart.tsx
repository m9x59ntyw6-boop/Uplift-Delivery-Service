import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { CartItem, JAMAICA_LOCATIONS, PAYMENT_METHODS, PaymentMethod, useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { makeShadow } from "@/utils/shadow";

const STEPS = ["Cart", "Location", "Payment", "Confirm"];

function CartItemRow({ item }: { item: CartItem }) {
  const { addToCart, removeFromCart, menuItems } = useOrders();
  const menuItem = menuItems.find(m => m.id === item.menuItemId);
  return (
    <View style={styles.cartRow}>
      <View style={styles.cartEmoji}>
        <Text style={{ fontSize: 22 }}>{menuItem?.emoji ?? "🍽"}</Text>
      </View>
      <View style={styles.cartInfo}>
        <Text style={styles.cartName}>{item.menuItemName}</Text>
        <Text style={styles.cartSize}>{item.size.charAt(0).toUpperCase() + item.size.slice(1)} • J${item.price.toLocaleString()} each</Text>
      </View>
      <View style={styles.qtyControls}>
        <Pressable style={styles.qtyBtn} onPress={() => { removeFromCart(item.menuItemId, item.size); Haptics.selectionAsync(); }}>
          <Feather name="minus" size={14} color={Colors.text} />
        </Pressable>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <Pressable style={styles.qtyBtn} onPress={() => { if (menuItem) addToCart(menuItem, item.size); Haptics.selectionAsync(); }}>
          <Feather name="plus" size={14} color={Colors.text} />
        </Pressable>
      </View>
      <Text style={styles.cartItemTotal}>J${(item.price * item.quantity).toLocaleString()}</Text>
    </View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { cart, cartTotal, cartCount, getStreakDiscount, getDeliveryFee, placeOrder, clearCart } = useOrders();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [customLocationText, setCustomLocationText] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);
  const customInputRef = useRef<TextInput>(null);

  const discount = getStreakDiscount();
  const discountAmount = Math.floor(cartTotal * discount);
  const deliveryFee = selectedLocation ? getDeliveryFee(selectedLocation) : 0;
  const total = cartTotal - discountAmount + deliveryFee;
  const locationData = JAMAICA_LOCATIONS.find(l => l.id === selectedLocation);
  const displayLocationLabel = selectedLocation === "custom"
    ? (customLocationText.trim() || "Custom Address")
    : locationData?.label ?? "";

  const canProceed = () => {
    if (step === 0) return cart.length > 0;
    if (step === 1) {
      if (!selectedLocation) return false;
      if (selectedLocation === "custom") return customLocationText.trim().length > 0;
      return true;
    }
    if (step === 2) return true;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
    else router.back();
  };

  const handleConfirmOrder = async () => {
    if (!selectedLocation) return;
    setLoading(true);
    const order = await placeOrder(
      selectedLocation,
      selectedPayment,
      selectedLocation === "custom" ? customLocationText.trim() : undefined,
    );
    setLoading(false);
    if (order) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/(student)/order-tracking", params: { orderId: order.id } });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{STEPS[step]}</Text>
        {step === 0 && cart.length > 0 && (
          <Pressable onPress={() => { clearCart(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.progressStep}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive, i < step && styles.progressDotDone]}>
              {i < step
                ? <Feather name="check" size={12} color="#fff" />
                : <Text style={[styles.progressNum, i === step && styles.progressNumActive]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]}>{s}</Text>
            {i < STEPS.length - 1 && <View style={[styles.progressLine, i < step && styles.progressLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 0: Cart Items */}
        {step === 0 && (
          <>
            {cart.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>🛒</Text>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Pressable style={styles.browseBtn} onPress={() => router.back()}>
                  <Text style={styles.browseBtnText}>Browse Menu</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                {cart.map(item => <CartItemRow key={`${item.menuItemId}-${item.size}`} item={item} />)}
              </View>
            )}
            {cart.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{cartCount} item{cartCount !== 1 ? "s" : ""}</Text>
                  <Text style={styles.summaryValue}>J${cartTotal.toLocaleString()}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="flame" size={14} color={Colors.streakOrange} />
                      <Text style={[styles.summaryLabel, { color: Colors.streakOrange }]}>Streak Discount</Text>
                    </View>
                    <Text style={[styles.summaryValue, { color: Colors.streakOrange }]}>-J${discountAmount.toLocaleString()}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Select location →</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* STEP 1: Location */}
        {step === 1 && (
          <>
            <Text style={styles.stepHint}>Where should we deliver?</Text>
            {JAMAICA_LOCATIONS.map(loc => (
              <Pressable
                key={loc.id}
                style={[styles.locationCard, selectedLocation === loc.id && styles.locationCardActive]}
                onPress={() => { setSelectedLocation(loc.id); Haptics.selectionAsync(); }}
              >
                <View style={styles.locationLeft}>
                  <Ionicons name="location" size={18} color={selectedLocation === loc.id ? Colors.primary : Colors.textMuted} />
                  <View>
                    <Text style={[styles.locationLabel, selectedLocation === loc.id && { color: Colors.primary }]}>{loc.label}</Text>
                    <Text style={styles.locationArea}>{loc.area} • {loc.distanceKm} km away</Text>
                  </View>
                </View>
                <View style={styles.locationRight}>
                  <Text style={[styles.locationFee, selectedLocation === loc.id && { color: Colors.primary }]}>J${loc.deliveryFee}</Text>
                  {selectedLocation === loc.id && <Feather name="check-circle" size={16} color={Colors.primary} />}
                </View>
              </Pressable>
            ))}

            {/* Custom location option */}
            <Pressable
              style={[styles.locationCard, styles.customLocationCard, selectedLocation === "custom" && styles.locationCardActive]}
              onPress={() => {
                setSelectedLocation("custom");
                Haptics.selectionAsync();
                setTimeout(() => customInputRef.current?.focus(), 150);
              }}
            >
              <View style={styles.locationLeft}>
                <Feather name="edit-2" size={18} color={selectedLocation === "custom" ? Colors.primary : Colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locationLabel, selectedLocation === "custom" && { color: Colors.primary }]}>
                    Somewhere else...
                  </Text>
                  <Text style={styles.locationArea}>Type your own address or landmark</Text>
                </View>
              </View>
              <View style={styles.locationRight}>
                <Text style={[styles.locationFee, selectedLocation === "custom" && { color: Colors.primary }]}>J$50</Text>
                {selectedLocation === "custom" && <Feather name="check-circle" size={16} color={Colors.primary} />}
              </View>
            </Pressable>

            {selectedLocation === "custom" && (
              <View style={styles.customInputContainer}>
                <Feather name="map-pin" size={15} color={Colors.primary} style={{ marginTop: 2 }} />
                <TextInput
                  ref={customInputRef}
                  style={styles.customInput}
                  placeholder="e.g. Gate 2, near the cricket field…"
                  placeholderTextColor={Colors.textMuted}
                  value={customLocationText}
                  onChangeText={setCustomLocationText}
                  returnKeyType="done"
                  multiline={false}
                  maxLength={120}
                />
                {customLocationText.length > 0 && (
                  <Pressable onPress={() => setCustomLocationText("")}>
                    <Feather name="x" size={16} color={Colors.textMuted} />
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        {/* STEP 2: Payment */}
        {step === 2 && (
          <>
            <Text style={styles.stepHint}>How would you like to pay?</Text>
            {PAYMENT_METHODS.map(pm => (
              <Pressable
                key={pm.id}
                style={[styles.paymentCard, selectedPayment === pm.id && styles.paymentCardActive]}
                onPress={() => { setSelectedPayment(pm.id); Haptics.selectionAsync(); }}
              >
                <Text style={styles.paymentIcon}>{pm.icon}</Text>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentLabel, selectedPayment === pm.id && { color: Colors.primary }]}>{pm.label}</Text>
                  <Text style={styles.paymentDesc}>{pm.description}</Text>
                </View>
                {selectedPayment === pm.id && <Feather name="check-circle" size={18} color={Colors.primary} />}
              </Pressable>
            ))}
          </>
        )}

        {/* STEP 3: Order Confirmation */}
        {step === 3 && (
          <>
            <Text style={styles.stepHint}>Review your order</Text>
            <View style={styles.confirmSection}>
              <Text style={styles.confirmSectionTitle}>Items</Text>
              {cart.map(item => (
                <View key={`${item.menuItemId}-${item.size}`} style={styles.confirmItem}>
                  <Text style={styles.confirmItemName}>{item.quantity}x {item.menuItemName} ({item.size})</Text>
                  <Text style={styles.confirmItemPrice}>J${(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <View style={styles.confirmSection}>
              <Text style={styles.confirmSectionTitle}>Delivery</Text>
              <View style={styles.confirmItem}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="location" size={14} color={Colors.primary} />
                  <Text style={styles.confirmItemName}>{displayLocationLabel}</Text>
                </View>
                <Text style={styles.confirmItemPrice}>J${deliveryFee.toLocaleString()}</Text>
              </View>
              <View style={styles.confirmItem}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="time" size={14} color={Colors.warning} />
                  <Text style={styles.confirmItemName}>Est. 15–35 min</Text>
                </View>
              </View>
            </View>

            <View style={styles.confirmSection}>
              <Text style={styles.confirmSectionTitle}>Payment</Text>
              <View style={styles.confirmItem}>
                <Text style={styles.confirmItemName}>{PAYMENT_METHODS.find(p => p.id === selectedPayment)?.label}</Text>
                <Text style={{ fontSize: 20 }}>{PAYMENT_METHODS.find(p => p.id === selectedPayment)?.icon}</Text>
              </View>
            </View>

            <View style={styles.totalBreakdown}>
              <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>J${cartTotal.toLocaleString()}</Text></View>
              {discountAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: Colors.streakOrange }]}>Streak Discount</Text>
                  <Text style={[styles.totalValue, { color: Colors.streakOrange }]}>-J${discountAmount.toLocaleString()}</Text>
                </View>
              )}
              <View style={styles.totalRow}><Text style={styles.totalLabel}>Delivery Fee</Text><Text style={styles.totalValue}>J${deliveryFee.toLocaleString()}</Text></View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>J${total.toLocaleString()}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Action */}
      {cart.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 84 + 12 : insets.bottom + 12 }]}>
          {step < 3 ? (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, !canProceed() && styles.actionBtnDisabled, pressed && { opacity: 0.85 }]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.actionBtnText}>{step === 0 ? `Continue • J${cartTotal.toLocaleString()}` : "Continue"}</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.confirmBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
              onPress={handleConfirmOrder}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Place Order • J${total.toLocaleString()}</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  clearText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.danger },
  progressRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  progressStep: { alignItems: "center", gap: 4, flex: 1, position: "relative" },
  progressDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  progressDotActive: { borderColor: Colors.primary, backgroundColor: "rgba(26,115,232,0.15)" },
  progressDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  progressNum: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
  progressNumActive: { color: Colors.primary },
  progressLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  progressLabelActive: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  progressLine: { position: "absolute", top: 13, left: "60%", right: "-60%", height: 2, backgroundColor: Colors.border, zIndex: -1 },
  progressLineActive: { backgroundColor: Colors.primary },
  content: { paddingHorizontal: 20, gap: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 14 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  card: { backgroundColor: Colors.backgroundCard, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  cartRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cartEmoji: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.backgroundElevated, alignItems: "center", justifyContent: "center" },
  cartInfo: { flex: 1 },
  cartName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  cartSize: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.backgroundElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  qtyText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, minWidth: 18, textAlign: "center" },
  cartItemTotal: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.primary, minWidth: 70, textAlign: "right" },
  summaryCard: { backgroundColor: Colors.backgroundCard, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  stepHint: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 4 },
  locationCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.backgroundCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  locationCardActive: { borderColor: Colors.primary, backgroundColor: "rgba(26,115,232,0.08)" },
  customLocationCard: { borderStyle: "dashed" },
  customInputContainer: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary,
    paddingHorizontal: 14, paddingVertical: 12,
    marginTop: -4,
  },
  customInput: {
    flex: 1, fontSize: 14, fontFamily: "Inter_400Regular",
    color: Colors.text,
    paddingVertical: 0,
  },
  locationLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  locationLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  locationArea: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  locationRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationFee: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.textSecondary },
  paymentCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.backgroundCard, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  paymentCardActive: { borderColor: Colors.primary, backgroundColor: "rgba(26,115,232,0.08)" },
  paymentIcon: { fontSize: 28 },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  paymentDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  confirmSection: { backgroundColor: Colors.backgroundCard, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border },
  confirmSectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  confirmItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  confirmItemName: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text },
  confirmItemPrice: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  totalBreakdown: { backgroundColor: Colors.backgroundCard, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  totalValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  grandTotalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  grandTotalLabel: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  grandTotalValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.primary },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, height: 54,
    ...makeShadow(Colors.primary, 4, 0.4, 12, 8),
  },
  actionBtnDisabled: { backgroundColor: Colors.backgroundElevated, ...makeShadow("#000", 0, 0, 0, 0) },
  confirmBtn: { backgroundColor: Colors.success },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

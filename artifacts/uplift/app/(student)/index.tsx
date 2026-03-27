import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { FoodSize, MenuItem, useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { makeShadow } from "@/utils/shadow";

type Category = "all" | "food" | "snack" | "drink";

const SIZE_LABELS: Record<FoodSize, string> = { small: "S", medium: "M", large: "L" };
const SIZE_NAMES: Record<FoodSize, string> = { small: "Small", medium: "Medium", large: "Large" };

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const { addToCart, cart } = useOrders();
  const [selectedSize, setSelectedSize] = useState<FoodSize>("medium");
  const scale = useSharedValue(1);

  const cartCount = cart.filter(c => c.menuItemId === item.id).reduce((s, c) => s + c.quantity, 0);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleAdd = async () => {
    scale.value = withSpring(0.92, {}, () => { scale.value = withSpring(1); });
    addToCart(item, selectedSize);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={animStyle}>
      <View style={styles.menuCard}>
        <View style={styles.menuCardTop}>
          <View style={styles.menuEmoji}>
            <Text style={styles.emojiText}>{item.emoji}</Text>
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuName}>{item.name}</Text>
            <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
          </View>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.sizeRow}>
          {(["small", "medium", "large"] as FoodSize[]).map(s => (
            <Pressable
              key={s}
              style={[styles.sizeBtn, selectedSize === s && styles.sizeBtnActive]}
              onPress={() => { setSelectedSize(s); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.sizeBtnLabel, selectedSize === s && styles.sizeBtnLabelActive]}>
                {SIZE_LABELS[s]}
              </Text>
              <Text style={[styles.sizeBtnPrice, selectedSize === s && styles.sizeBtnPriceActive]}>
                J${(item.prices?.[s] ?? 0).toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          onPress={handleAdd}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add {SIZE_NAMES[selectedSize]}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { menuItems, cartCount, cartTotal, getStreakDiscount } = useOrders();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>("all");

  const filtered = category === "all" ? menuItems.filter(m => m.available) : menuItems.filter(m => m.category === category && m.available);
  const discount = getStreakDiscount();
  const streakDays = user?.streakDays ?? 0;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hey, {user?.name?.split(" ")[0] ?? "there"}</Text>
          <Text style={styles.headerTitle}>What are you having?</Text>
        </View>
        {streakDays >= 2 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={Colors.streakOrange} />
            <Text style={styles.streakText}>{streakDays}d streak</Text>
          </View>
        )}
      </View>

      {discount > 0 && (
        <Animated.View entering={FadeInDown.delay(50)} style={styles.discountBanner}>
          <Ionicons name="pricetag" size={16} color={Colors.streakGold} />
          <Text style={styles.discountText}>
            {Math.round(discount * 100)}% streak discount applied!
          </Text>
        </Animated.View>
      )}

      <View style={styles.catRow}>
        {(["all", "food", "snack", "drink"] as Category[]).map(c => (
          <Pressable
            key={c}
            style={[styles.catBtn, category === c && styles.catBtnActive]}
            onPress={() => { setCategory(c); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.catBtnText, category === c && styles.catBtnTextActive]}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <MenuCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="coffee" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No items available</Text>
          </View>
        }
      />

      {cartCount > 0 && (
        <Pressable
          style={({ pressed }) => [styles.cartBar, pressed && { opacity: 0.9 }]}
          onPress={() => router.push("/(student)/cart")}
        >
          <View style={styles.cartBarLeft}>
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarText}>View Cart</Text>
          </View>
          <Text style={styles.cartBarPrice}>J${cartTotal.toLocaleString()}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249,115,22,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.3)",
  },
  streakText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.streakOrange },
  discountBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  discountText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.streakGold },
  catRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  catBtnTextActive: { color: "#fff" },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  menuCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  menuCardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  menuEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emojiText: { fontSize: 28 },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 4 },
  menuDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  cartBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  sizeRow: { flexDirection: "row", gap: 8 },
  sizeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sizeBtnActive: { borderColor: Colors.primary, backgroundColor: "rgba(26,115,232,0.12)" },
  sizeBtnLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
  sizeBtnLabelActive: { color: Colors.primary },
  sizeBtnPrice: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  sizeBtnPriceActive: { color: Colors.primary },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.85 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  cartBar: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 84 + 12 : 88,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    ...makeShadow(Colors.primary, 4, 0.4, 16, 10),
  },
  cartBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartCount: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartCountText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  cartBarText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cartBarPrice: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});

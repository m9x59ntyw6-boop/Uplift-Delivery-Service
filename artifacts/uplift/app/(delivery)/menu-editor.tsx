import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { FoodSize, MenuItem, useOrders } from "@/contexts/OrderContext";

function EditableMenuItem({ item, onSave }: { item: MenuItem; onSave: (updated: MenuItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(item.name);
  const [desc, setDesc] = useState(item.description);
  const [smallPrice, setSmallPrice] = useState(item.prices.small.toString());
  const [medPrice, setMedPrice] = useState(item.prices.medium.toString());
  const [largePrice, setLargePrice] = useState(item.prices.large.toString());
  const [available, setAvailable] = useState(item.available);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    const updated: MenuItem = {
      ...item,
      name: name.trim() || item.name,
      description: desc.trim() || item.description,
      prices: {
        small: parseInt(smallPrice) || item.prices.small,
        medium: parseInt(medPrice) || item.prices.medium,
        large: parseInt(largePrice) || item.prices.large,
      },
      available,
    };
    onSave(updated);
    setDirty(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExpanded(false);
  };

  return (
    <View style={[styles.menuItem, !item.available && styles.menuItemDisabled]}>
      <Pressable
        style={styles.menuItemHeader}
        onPress={() => setExpanded(v => !v)}
      >
        <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemPrices}>
            J${item.prices.small} / J${item.prices.medium} / J${item.prices.large}
          </Text>
        </View>
        <View style={styles.menuItemRight}>
          <Switch
            value={available}
            onValueChange={v => { setAvailable(v); markDirty(); }}
            trackColor={{ false: Colors.border, true: `${Colors.success}80` }}
            thumbColor={available ? Colors.success : Colors.textMuted}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.textMuted} />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.editForm}>
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Name</Text>
            <TextInput
              style={styles.editInput}
              value={name}
              onChangeText={v => { setName(v); markDirty(); }}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Description</Text>
            <TextInput
              style={[styles.editInput, styles.multilineInput]}
              value={desc}
              onChangeText={v => { setDesc(v); markDirty(); }}
              multiline
              numberOfLines={2}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <Text style={styles.editLabel}>Prices (JMD)</Text>
          <View style={styles.priceRow}>
            {[
              { label: "Small", value: smallPrice, setter: setSmallPrice },
              { label: "Medium", value: medPrice, setter: setMedPrice },
              { label: "Large", value: largePrice, setter: setLargePrice },
            ].map(p => (
              <View key={p.label} style={styles.priceField}>
                <Text style={styles.priceSizeLabel}>{p.label}</Text>
                <TextInput
                  style={styles.priceInput}
                  value={p.value}
                  onChangeText={v => { p.setter(v.replace(/[^0-9]/g, "")); markDirty(); }}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}
          </View>

          {dirty && (
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
              onPress={handleSave}
            >
              <Feather name="save" size={14} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function MenuEditorScreen() {
  const insets = useSafeAreaInsets();
  const { menuItems, updateMenuItems } = useOrders();
  const [items, setItems] = useState<MenuItem[]>(menuItems);

  const handleSave = async (updated: MenuItem) => {
    const newItems = items.map(i => i.id === updated.id ? updated : i);
    setItems(newItems);
    await updateMenuItems(newItems);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Editor</Text>
        <View style={styles.editBadge}>
          <Feather name="edit-2" size={12} color={Colors.accent} />
          <Text style={styles.editBadgeText}>Delivery only</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Feather name="info" size={14} color={Colors.primary} />
        <Text style={styles.noticeText}>
          Tap any item to edit its name, description, and prices. Toggle availability with the switch.
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <EditableMenuItem item={item} onSave={handleSave} />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled
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
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
  },
  editBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.accent },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "rgba(26,115,232,0.08)",
    borderRadius: 10,
    padding: 10,
  },
  noticeText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  listContent: { paddingHorizontal: 20, gap: 10 },
  menuItem: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItemDisabled: { opacity: 0.6 },
  menuItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuItemEmoji: { fontSize: 26 },
  menuItemInfo: { flex: 1 },
  menuItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  menuItemPrices: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  menuItemRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  editForm: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  editField: { gap: 6 },
  editLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  editInput: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  multilineInput: { height: 68, textAlignVertical: "top" },
  priceRow: { flexDirection: "row", gap: 8 },
  priceField: { flex: 1, gap: 4 },
  priceSizeLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textMuted, textAlign: "center" },
  priceInput: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
    textAlign: "center",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  pressed: { opacity: 0.85 },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

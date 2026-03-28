import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
  const [smallPrice, setSmallPrice] = useState((item.prices?.small ?? 750).toString());
  const [medPrice, setMedPrice] = useState((item.prices?.medium ?? 850).toString());
  const [largePrice, setLargePrice] = useState((item.prices?.large ?? 1000).toString());
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
            J${item.prices?.small ?? 750} / J${item.prices?.medium ?? 850} / J${item.prices?.large ?? 1000}
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

const CATEGORY_OPTIONS: { id: MenuItem["category"]; label: string; emoji: string }[] = [
  { id: "food", label: "Food", emoji: "🍽" },
  { id: "snack", label: "Snack", emoji: "🍿" },
  { id: "drink", label: "Drink", emoji: "🥤" },
];

const BLANK_ITEM = {
  name: "", desc: "", emoji: "", category: "food" as MenuItem["category"],
  small: "750", medium: "850", large: "1000",
};

export default function MenuEditorScreen() {
  const insets = useSafeAreaInsets();
  const { menuItems, updateMenuItems } = useOrders();
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK_ITEM);

  const handleSave = async (updated: MenuItem) => {
    const newItems = items.map(i => i.id === updated.id ? updated : i);
    setItems(newItems);
    await updateMenuItems(newItems);
  };

  const resetForm = () => setForm(BLANK_ITEM);

  const handleAddItem = async () => {
    const name = form.name.trim();
    if (!name) { Alert.alert("Name required", "Please enter a name for the item."); return; }
    const emoji = form.emoji.trim() || "🍽";
    const small = parseInt(form.small) || 750;
    const medium = parseInt(form.medium) || 850;
    const large = parseInt(form.large) || 1000;
    const newItem: MenuItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      name,
      description: form.desc.trim() || name,
      emoji,
      category: form.category,
      prices: { small, medium, large },
      available: true,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    await updateMenuItems(newItems);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    setShowAdd(false);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={["#0A0F1E", "#111827"]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Editor</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          onPress={() => { setShowAdd(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Item</Text>
        </Pressable>
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

      {/* ── Add New Item Modal ── */}
      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowAdd(false); resetForm(); }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <Pressable style={styles.modalOverlay} onPress={() => { setShowAdd(false); resetForm(); }}>
            <Pressable style={[styles.modalCard, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
              <LinearGradient colors={["#111827", "#1A2332"]} style={StyleSheet.absoluteFill} />
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>Add New Item</Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Name */}
                <Text style={styles.fieldLabel}>Item Name *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.name}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                  placeholder="e.g. Brown Stew Chicken"
                  placeholderTextColor={Colors.textMuted}
                />

                {/* Emoji */}
                <Text style={styles.fieldLabel}>Emoji Icon</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.emoji}
                  onChangeText={v => setForm(f => ({ ...f, emoji: v }))}
                  placeholder="🍗"
                  placeholderTextColor={Colors.textMuted}
                />

                {/* Description */}
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMulti]}
                  value={form.desc}
                  onChangeText={v => setForm(f => ({ ...f, desc: v }))}
                  placeholder="Brief description of the item..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={2}
                />

                {/* Category */}
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.categoryRow}>
                  {CATEGORY_OPTIONS.map(cat => (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryBtn, form.category === cat.id && styles.categoryBtnActive]}
                      onPress={() => { setForm(f => ({ ...f, category: cat.id })); Haptics.selectionAsync(); }}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.categoryLabel, form.category === cat.id && { color: Colors.accent }]}>{cat.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Prices */}
                <Text style={styles.fieldLabel}>Prices (JMD)</Text>
                <View style={styles.priceRow}>
                  {[
                    { label: "Small", key: "small" as const },
                    { label: "Medium", key: "medium" as const },
                    { label: "Large", key: "large" as const },
                  ].map(p => (
                    <View key={p.label} style={styles.priceField}>
                      <Text style={styles.priceSizeLabel}>{p.label}</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={form[p.key]}
                        onChangeText={v => setForm(f => ({ ...f, [p.key]: v.replace(/[^0-9]/g, "") }))}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                  ))}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.saveItemBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleAddItem}
                >
                  <Feather name="plus-circle" size={16} color="#fff" />
                  <Text style={styles.saveItemBtnText}>Add to Menu</Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    maxHeight: "90%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },

  fieldLabel: {
    fontSize: 12, fontFamily: "Inter_500Medium",
    color: Colors.textSecondary, marginBottom: 4, marginTop: 8,
  },
  fieldInput: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  fieldInputMulti: { height: 72, textAlignVertical: "top" },

  categoryRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  categoryBtn: {
    flex: 1, alignItems: "center", gap: 4,
    borderRadius: 12, paddingVertical: 10,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryBtnActive: { borderColor: Colors.accent, backgroundColor: "rgba(255,107,53,0.1)" },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },

  saveItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  saveItemBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});

const primary = "#1A73E8";
const primaryDark = "#0D47A1";
const accent = "#FF6B35";
const success = "#22C55E";
const warning = "#F59E0B";
const danger = "#EF4444";

export const Colors = {
  primary,
  primaryDark,
  accent,
  success,
  warning,
  danger,

  background: "#0A0F1E",
  backgroundSecondary: "#111827",
  backgroundCard: "#1C2333",
  backgroundElevated: "#232E44",

  text: "#FFFFFF",
  textSecondary: "#9BA3AF",
  textMuted: "#6B7280",
  textOnPrimary: "#FFFFFF",

  border: "#2A3548",
  borderLight: "#374151",

  tabBar: "rgba(10, 15, 30, 0.95)",
  tabBarBorder: "#1C2333",
  tabActive: primary,
  tabInactive: "#6B7280",

  streakGold: "#F59E0B",
  streakOrange: "#F97316",
  ratingYellow: "#FBBF24",

  deliveryBlue: "#3B82F6",
  jamaicaGold: "#FFD700",
  jamaicaGreen: "#009B3A",
  jamaicaBlack: "#000000",
} as const;

export default { light: { text: Colors.text, background: Colors.background, tint: primary, tabIconDefault: "#6B7280", tabIconSelected: primary } };

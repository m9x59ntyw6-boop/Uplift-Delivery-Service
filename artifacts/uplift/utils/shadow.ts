import { Platform } from "react-native";

export function makeShadow(color: string, offsetY: number, opacity: number, radius: number, elevation?: number) {
  if (Platform.OS === "web") {
    const hex = color.startsWith("#") ? color : "#000000";
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return {
      boxShadow: `0px ${offsetY}px ${radius}px rgba(${r},${g},${b},${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation ?? Math.round(offsetY * 2),
  };
}

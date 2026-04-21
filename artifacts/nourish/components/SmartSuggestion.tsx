import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  body: string;
  tone?: "primary" | "warn" | "neutral";
  icon?: keyof typeof Feather.glyphMap;
};

export function SmartSuggestion({ title, body, tone = "primary", icon = "zap" }: Props) {
  const colors = useColors();
  const bg =
    tone === "primary"
      ? colors.primaryLight
      : tone === "warn"
        ? "#fbe6d8"
        : colors.muted;
  const fg =
    tone === "primary"
      ? colors.primaryDark
      : tone === "warn"
        ? colors.warn
        : colors.foreground;

  return (
    <View style={[styles.card, { backgroundColor: bg, borderRadius: colors.radius }]}>
      <View style={[styles.iconWrap, { backgroundColor: "#ffffff80" }]}>
        <Feather name={icon} size={18} color={fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: fg }]}>{title}</Text>
        <Text style={[styles.body, { color: fg }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 2 },
  body: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18, opacity: 0.92 },
});

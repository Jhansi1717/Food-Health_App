import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  glasses: number;
  target: number;
  onAdd: () => void;
  onRemove: () => void;
};

export function WaterTracker({ glasses, target, onAdd, onRemove }: Props) {
  const colors = useColors();
  const dots = Array.from({ length: target });

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderRadius: colors.radius },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: "#dceaf2" }]}>
          <Feather name="droplet" size={18} color={colors.water} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Water</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {glasses} of {target} glasses
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: colors.muted,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </Pressable>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }
            onAdd();
          }}
          hitSlop={10}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: colors.water,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="plus" size={16} color="#fff" />
        </Pressable>
      </View>
      <View style={styles.dots}>
        {dots.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < glasses ? colors.water : colors.muted,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  sub: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 2 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dot: { flex: 1, minWidth: 14, height: 10, borderRadius: 999 },
});

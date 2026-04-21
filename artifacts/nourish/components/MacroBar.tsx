import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
};

export function MacroBar({ label, value, target, color, unit = "g" }: Props) {
  const colors = useColors();
  const pct = target > 0 ? Math.min(value / target, 1) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.mutedForeground }]}>
          {Math.round(value)}
          <Text style={{ color: colors.mutedForeground }}>
            {" "}/ {target}
            {unit}
          </Text>
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  value: { fontFamily: "Inter_500Medium", fontSize: 13 },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});

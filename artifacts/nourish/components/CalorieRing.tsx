import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

type Props = {
  size?: number;
  stroke?: number;
  consumed: number;
  target: number;
};

export function CalorieRing({ size = 220, stroke = 18, consumed, target }: Props) {
  const colors = useColors();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const dashOffset = circumference * (1 - pct);
  const remaining = Math.max(0, target - consumed);
  const over = consumed > target;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.muted}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={over ? colors.destructive : colors.primary}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={dashOffset}
          />
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.big, { color: colors.foreground }]}>
          {Math.round(remaining)}
        </Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {over ? "over goal" : "kcal left"}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {Math.round(consumed)} / {target}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  big: {
    fontFamily: "Inter_700Bold",
    fontSize: 52,
    letterSpacing: -1.5,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sub: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginTop: 6,
  },
});

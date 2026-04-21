import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { MealEntry } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  meal: MealEntry;
  onRemove?: (id: string) => void;
};

const CATEGORY_ICON: Record<MealEntry["category"], keyof typeof Feather.glyphMap> = {
  breakfast: "sunrise",
  lunch: "sun",
  dinner: "moon",
  snack: "coffee",
  drink: "droplet",
};

const CATEGORY_LABEL: Record<MealEntry["category"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  drink: "Drink",
};

export function MealCard({ meal, onRemove }: Props) {
  const colors = useColors();
  const healthColor =
    meal.health >= 4 ? colors.primary : meal.health >= 3 ? colors.accent : colors.destructive;
  const healthLabel =
    meal.health >= 4 ? "Great choice" : meal.health >= 3 ? "Balanced" : "Treat";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Feather name={CATEGORY_ICON[meal.category]} size={20} color={colors.primaryDark} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {meal.name}
          </Text>
          <Text style={[styles.kcal, { color: colors.foreground }]}>
            {Math.round(meal.calories)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
            {CATEGORY_LABEL[meal.category]} · {meal.serving}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>kcal</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.macro, { color: colors.mutedForeground }]}>
            P {Math.round(meal.protein)}g
          </Text>
          <Text style={[styles.macro, { color: colors.mutedForeground }]}>
            C {Math.round(meal.carbs)}g
          </Text>
          <Text style={[styles.macro, { color: colors.mutedForeground }]}>
            F {Math.round(meal.fat)}g
          </Text>
          <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
          <Text style={[styles.macro, { color: healthColor, fontFamily: "Inter_600SemiBold" }]}>
            {healthLabel}
          </Text>
        </View>
      </View>
      {onRemove ? (
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }
            onRemove(meal.id);
          }}
          hitSlop={12}
          style={({ pressed }) => [styles.remove, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16, flex: 1, marginRight: 8 },
  kcal: { fontFamily: "Inter_700Bold", fontSize: 16 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12 },
  macro: { fontFamily: "Inter_500Medium", fontSize: 12 },
  healthDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  remove: { padding: 6 },
});

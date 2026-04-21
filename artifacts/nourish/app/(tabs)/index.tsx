import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { MealCard } from "@/components/MealCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SmartSuggestion } from "@/components/SmartSuggestion";
import { WaterTracker } from "@/components/WaterTracker";
import { sumDay, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { generateInsights, recommendNextMeals } from "@/lib/insights";

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, meals, water, todayKey, addMeal, removeMeal, addWater } = useApp();
  const isWeb = Platform.OS === "web";

  const todayMeals = useMemo(
    () => meals.filter((m) => m.date === todayKey),
    [meals, todayKey],
  );
  const totals = useMemo(() => sumDay(meals, todayKey), [meals, todayKey]);
  const todayWater = water.find((w) => w.date === todayKey)?.glasses ?? 0;
  const hour = new Date().getHours();

  const insights = useMemo(
    () => generateInsights(profile, todayMeals, totals, hour),
    [profile, todayMeals, totals, hour],
  );

  const remaining = {
    calories: profile.calorieTarget - totals.calories,
    protein: profile.proteinTarget - totals.protein,
    carbs: profile.carbsTarget - totals.carbs,
    fat: profile.fatTarget - totals.fat,
  };

  const recs = useMemo(
    () => recommendNextMeals(remaining, profile.diet, hour),
    [remaining.calories, remaining.protein, profile.diet, hour],
  );

  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (isWeb ? 67 : 12),
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              {dateLabel}
            </Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {greeting}
              {profile.name ? `, ${profile.name}` : ""}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/scan")}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="maximize" size={18} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/log")}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>

        <LinearGradient
          colors={[colors.primaryLight, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.ringCard, { borderRadius: colors.radius + 6 }]}
        >
          <CalorieRing
            consumed={totals.calories}
            target={profile.calorieTarget}
            size={220}
          />
          <View style={styles.macros}>
            <MacroBar
              label="Protein"
              value={totals.protein}
              target={profile.proteinTarget}
              color={colors.protein}
            />
            <MacroBar
              label="Carbs"
              value={totals.carbs}
              target={profile.carbsTarget}
              color={colors.carbs}
            />
            <MacroBar
              label="Fat"
              value={totals.fat}
              target={profile.fatTarget}
              color={colors.fat}
            />
          </View>
        </LinearGradient>

        <WaterTracker
          glasses={todayWater}
          target={profile.waterTargetGlasses}
          onAdd={() => addWater(1)}
          onRemove={() => addWater(-1)}
        />

        {insights.length > 0 ? (
          <View style={{ gap: 10 }}>
            <SectionHeader title="For you" caption="Smart nudges based on today" />
            {insights.map((i) => (
              <SmartSuggestion
                key={i.id}
                title={i.title}
                body={i.body}
                tone={i.tone}
                icon={i.icon}
              />
            ))}
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <SectionHeader
            title="Today's meals"
            caption={
              todayMeals.length === 0
                ? "Nothing logged yet"
                : `${todayMeals.length} entr${todayMeals.length === 1 ? "y" : "ies"} · ${Math.round(totals.calories)} kcal`
            }
            right={
              <Pressable
                onPress={() => router.push("/(tabs)/log")}
                hitSlop={10}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>Log</Text>
              </Pressable>
            }
          />
          {todayMeals.length === 0 ? (
            <View
              style={[
                styles.empty,
                { backgroundColor: colors.card, borderRadius: colors.radius },
              ]}
            >
              <Feather name="coffee" size={26} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Log your first meal
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Tap the + above to capture what you ate. Nourish learns and suggests smarter swaps.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {todayMeals.map((m) => (
                <MealCard key={m.id} meal={m} onRemove={removeMeal} />
              ))}
            </View>
          )}
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader
            title="Try next"
            caption="Picked to fit what you have left today"
          />
          <View style={styles.recGrid}>
            {recs.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => addMeal(f)}
                style={({ pressed }) => [
                  styles.recCard,
                  {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={[styles.recIcon, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="plus" size={16} color={colors.primaryDark} />
                </View>
                <Text
                  numberOfLines={2}
                  style={[styles.recTitle, { color: colors.foreground }]}
                >
                  {f.name}
                </Text>
                <Text style={[styles.recMeta, { color: colors.mutedForeground }]}>
                  {f.calories} kcal · {f.protein}g P
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 22 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  greeting: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCard: {
    padding: 20,
    alignItems: "center",
    gap: 22,
  },
  macros: { width: "100%", gap: 14 },
  empty: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 6 },
  emptyBody: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  recGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: 14,
    gap: 8,
    minHeight: 110,
  },
  recIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  recTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  recMeta: { fontFamily: "Inter_500Medium", fontSize: 12 },
});

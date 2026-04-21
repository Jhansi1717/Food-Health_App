import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { FOODS, Food, FoodCategory } from "@/data/foods";
import { useColors } from "@/hooks/useColors";

const TABS: { key: "all" | FoodCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "all", label: "All", icon: "list" },
  { key: "breakfast", label: "Breakfast", icon: "sunrise" },
  { key: "lunch", label: "Lunch", icon: "sun" },
  { key: "dinner", label: "Dinner", icon: "moon" },
  { key: "snack", label: "Snack", icon: "coffee" },
  { key: "drink", label: "Drink", icon: "droplet" },
];

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addMeal } = useApp();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | FoodCategory>("all");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const isWeb = Platform.OS === "web";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FOODS.filter((f) => {
      if (tab !== "all" && f.category !== tab) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || f.tags?.some((t) => t.includes(q));
    });
  }, [query, tab]);

  const handleAdd = (f: Food) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    addMeal(f);
    setJustAdded(f.id);
    setTimeout(() => setJustAdded((cur) => (cur === f.id ? null : cur)), 1200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (isWeb ? 67 : 12),
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Log a meal</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Tap to log instantly, or build your own.
        </Text>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.card, borderRadius: colors.radius },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search foods, tags, or meals"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.searchInput,
              { color: colors.foreground, fontFamily: "Inter_500Medium" },
            ]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={({ pressed }) => [
                  styles.tab,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather
                  name={t.icon}
                  size={14}
                  color={active ? "#fff" : colors.foreground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? "#fff" : colors.foreground },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.push("/scan")}
            style={({ pressed }) => [
              styles.quickBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#ffffff30" }]}>
              <Feather name="maximize" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: "#fff" }]}>
                Scan barcode
              </Text>
              <Text style={[styles.quickBody, { color: "#ffffffd0" }]}>
                Point at a packaged food
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push("/add-meal")}
            style={({ pressed }) => [
              styles.quickBtn,
              {
                backgroundColor: colors.primaryLight,
                borderRadius: colors.radius,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#ffffff80" }]}>
              <Feather name="edit-3" size={18} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: colors.primaryDark }]}>
                Custom meal
              </Text>
              <Text style={[styles.quickBody, { color: colors.primaryDark, opacity: 0.8 }]}>
                Enter your own macros
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {filtered.length === 0 ? (
            <View
              style={[
                styles.empty,
                { backgroundColor: colors.card, borderRadius: colors.radius },
              ]}
            >
              <Feather name="search" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Nothing matches
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Try a different search or add a custom meal.
              </Text>
            </View>
          ) : (
            filtered.map((f) => {
              const added = justAdded === f.id;
              const healthColor =
                f.health >= 4 ? colors.primary : f.health >= 3 ? colors.accent : colors.destructive;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => handleAdd(f)}
                  style={({ pressed }) => [
                    styles.foodRow,
                    {
                      backgroundColor: colors.card,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.foodName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {f.name}
                    </Text>
                    <Text style={[styles.foodMeta, { color: colors.mutedForeground }]}>
                      {f.serving} · {f.calories} kcal · P {f.protein}g · C {f.carbs}g · F {f.fat}g
                    </Text>
                    <View style={styles.tagRow}>
                      <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
                      <Text style={[styles.tagText, { color: healthColor }]}>
                        {f.health >= 4 ? "Great choice" : f.health >= 3 ? "Balanced" : "Treat"}
                      </Text>
                      {f.swapForId ? (
                        <>
                          <View
                            style={[styles.dot, { backgroundColor: colors.mutedForeground }]}
                          />
                          <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                            Swap available
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.addBtn,
                      {
                        backgroundColor: added ? colors.primaryDark : colors.primary,
                      },
                    ]}
                  >
                    <Feather
                      name={added ? "check" : "plus"}
                      size={18}
                      color="#fff"
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: -8 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  tabRow: { gap: 8, paddingVertical: 4 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  tabLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  quickRow: { flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1,
    padding: 14,
    gap: 10,
    minHeight: 110,
    justifyContent: "space-between",
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  quickBody: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  foodName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  foodMeta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  tagText: { fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  dot: { width: 3, height: 3, borderRadius: 999 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { padding: 24, alignItems: "center", gap: 6 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 4 },
  emptyBody: { fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center" },
});

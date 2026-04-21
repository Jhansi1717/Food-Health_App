import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { FoodCategory } from "@/data/foods";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: { key: FoodCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "breakfast", label: "Breakfast", icon: "sunrise" },
  { key: "lunch", label: "Lunch", icon: "sun" },
  { key: "dinner", label: "Dinner", icon: "moon" },
  { key: "snack", label: "Snack", icon: "coffee" },
  { key: "drink", label: "Drink", icon: "droplet" },
];

export default function AddMeal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addMeal } = useApp();

  const [name, setName] = useState("");
  const [serving, setServing] = useState("1 serving");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [category, setCategory] = useState<FoodCategory>("snack");

  const cal = parseInt(calories, 10) || 0;
  const p = parseInt(protein, 10) || 0;
  const c = parseInt(carbs, 10) || 0;
  const f = parseInt(fat, 10) || 0;

  // Estimate health score from macro mix
  const macroCal = p * 4 + c * 4 + f * 9;
  const proteinPct = macroCal > 0 ? (p * 4) / macroCal : 0;
  const fatPct = macroCal > 0 ? (f * 9) / macroCal : 0;
  let health: 1 | 2 | 3 | 4 | 5 = 3;
  if (proteinPct > 0.25 && fatPct < 0.4) health = 5;
  else if (proteinPct > 0.15) health = 4;
  else if (cal > 600 && proteinPct < 0.1) health = 1;
  else if (cal > 400 && fatPct > 0.5) health = 2;

  const valid = name.trim().length > 0 && cal > 0;

  const submit = () => {
    if (!valid) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    addMeal({
      name: name.trim(),
      serving: serving.trim() || "1 serving",
      calories: cal,
      protein: p,
      carbs: c,
      fat: f,
      category,
      health,
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 12,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Custom meal
          </Text>
          <Pressable
            onPress={submit}
            disabled={!valid}
            hitSlop={10}
            style={({ pressed }) => [{ opacity: !valid ? 0.4 : pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.save, { color: colors.primary }]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 30 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field label="Name">
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. Mom's lasagna"
              autoFocus
            />
          </Field>

          <Field label="Serving">
            <Input value={serving} onChangeText={setServing} placeholder="1 plate" />
          </Field>

          <Field label="Category">
            <View style={styles.catRow}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    style={({ pressed }) => [
                      styles.catChip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={cat.icon}
                      size={14}
                      color={active ? "#fff" : colors.foreground}
                    />
                    <Text
                      style={[
                        styles.catLabel,
                        { color: active ? "#fff" : colors.foreground },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Calories">
            <Input
              value={calories}
              onChangeText={setCalories}
              placeholder="0"
              keyboardType="number-pad"
              suffix="kcal"
            />
          </Field>

          <View style={styles.macroGrid}>
            <Field label="Protein" style={styles.macroField}>
              <Input
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                keyboardType="number-pad"
                suffix="g"
              />
            </Field>
            <Field label="Carbs" style={styles.macroField}>
              <Input
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                keyboardType="number-pad"
                suffix="g"
              />
            </Field>
            <Field label="Fat" style={styles.macroField}>
              <Input
                value={fat}
                onChangeText={setFat}
                placeholder="0"
                keyboardType="number-pad"
                suffix="g"
              />
            </Field>
          </View>

          {cal > 0 ? (
            <View
              style={[
                styles.preview,
                { backgroundColor: colors.primaryLight, borderRadius: colors.radius },
              ]}
            >
              <Feather name="zap" size={16} color={colors.primaryDark} />
              <Text style={[styles.previewText, { color: colors.primaryDark }]}>
                Estimated as {health >= 4 ? "a great choice" : health >= 3 ? "balanced" : "a treat"} based on macros.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  const colors = useColors();
  return (
    <View style={[{ gap: 8 }, style]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function Input({
  suffix,
  ...rest
}: React.ComponentProps<typeof TextInput> & { suffix?: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.inputWrap,
        { backgroundColor: colors.card, borderRadius: colors.radius },
      ]}
    >
      <TextInput
        {...rest}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          { color: colors.foreground, fontFamily: "Inter_500Medium" },
        ]}
      />
      {suffix ? (
        <Text style={[styles.suffix, { color: colors.mutedForeground }]}>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  save: { fontFamily: "Inter_700Bold", fontSize: 16 },
  content: { padding: 20, gap: 18 },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
  suffix: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginLeft: 8,
  },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  catLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  macroGrid: { flexDirection: "row", gap: 10 },
  macroField: { flex: 1 },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  previewText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
});

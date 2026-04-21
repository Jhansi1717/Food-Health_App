import { Feather } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BadgeShelf } from "@/components/BadgeShelf";
import { SectionHeader } from "@/components/SectionHeader";
import {
  DietPref,
  Goal,
  streakDays,
  targetsForGoal,
  useApp,
} from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { ensurePermission } from "@/lib/notifications";

const GOALS: { key: Goal; label: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "lose", label: "Lose weight", desc: "Calorie deficit", icon: "trending-down" },
  { key: "maintain", label: "Maintain", desc: "Hold steady", icon: "minus" },
  { key: "gain", label: "Build muscle", desc: "Surplus + protein", icon: "trending-up" },
  { key: "healthier", label: "Eat healthier", desc: "Better choices", icon: "heart" },
];

const DIETS: { key: DietPref; label: string }[] = [
  { key: "none", label: "No restrictions" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "pescatarian", label: "Pescatarian" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, meals, setProfile, resetAll } = useApp();
  const isWeb = Platform.OS === "web";
  const streak = streakDays(meals);
  const [ageText, setAgeText] = useState(profile.age?.toString() ?? "");

  useEffect(() => {
    setAgeText(profile.age?.toString() ?? "");
  }, [profile.age]);

  const commitAge = () => {
    const n = parseInt(ageText, 10);
    const valid = !isNaN(n) && n >= 5 && n <= 120 ? n : null;
    if (valid === profile.age) return;
    setProfile((p) => ({
      ...p,
      age: valid,
      ...targetsForGoal(p.goal, valid),
    }));
  };

  const setGoal = (g: Goal) => {
    const t = targetsForGoal(g, profile.age);
    setProfile((p) => ({ ...p, goal: g, ...t }));
  };

  const setDiet = (d: DietPref) => setProfile((p) => ({ ...p, diet: d }));

  const toggleReminders = async (val: boolean) => {
    if (val && Platform.OS !== "web") {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert(
          "Permission needed",
          "Enable notifications in your device settings to receive reminders.",
        );
        return;
      }
    }
    setProfile((p) => ({ ...p, reminders: { ...p.reminders, enabled: val } }));
  };

  const handleReset = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Reset all data and start over?")) resetAll();
      return;
    }
    Alert.alert(
      "Start over?",
      "This clears your goals, meals, and water log.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetAll },
      ],
    );
  };

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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Tune your goals and Nourish updates everything else.
        </Text>

        <View style={{ gap: 10 }}>
          <SectionHeader
            title="Streak rewards"
            caption={
              streak > 0
                ? `${streak} ${streak === 1 ? "day" : "days"} in a row`
                : "Log a meal to start your streak"
            }
          />
          <BadgeShelf streak={streak} />
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="About you" />
          <View
            style={[
              styles.fieldGroup,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.fieldRow}>
              <Feather name="user" size={18} color={colors.mutedForeground} />
              <TextInput
                value={profile.name}
                onChangeText={(t) => setProfile((p) => ({ ...p, name: t }))}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.fieldInput,
                  { color: colors.foreground, fontFamily: "Inter_500Medium" },
                ]}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.fieldRow}>
              <Feather name="calendar" size={18} color={colors.mutedForeground} />
              <TextInput
                value={ageText}
                onChangeText={(t) => setAgeText(t.replace(/[^0-9]/g, "").slice(0, 3))}
                onBlur={commitAge}
                onSubmitEditing={commitAge}
                placeholder="Age (optional)"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                style={[
                  styles.fieldInput,
                  { color: colors.foreground, fontFamily: "Inter_500Medium" },
                ]}
              />
              <Text style={[styles.fieldUnit, { color: colors.mutedForeground }]}>
                years
              </Text>
            </View>
          </View>
          {profile.age ? (
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              Targets are tuned for your age.
            </Text>
          ) : null}
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Goal" caption="Picks reasonable starting targets" />
          <View style={styles.grid}>
            {GOALS.map((g) => {
              const active = profile.goal === g.key;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => setGoal(g.key)}
                  style={({ pressed }) => [
                    styles.goalCard,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Feather
                    name={g.icon}
                    size={20}
                    color={active ? "#fff" : colors.primary}
                  />
                  <Text
                    style={[
                      styles.goalLabel,
                      { color: active ? "#fff" : colors.foreground },
                    ]}
                  >
                    {g.label}
                  </Text>
                  <Text
                    style={[
                      styles.goalDesc,
                      {
                        color: active ? "#fff" : colors.mutedForeground,
                        opacity: active ? 0.85 : 1,
                      },
                    ]}
                  >
                    {g.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Daily targets" caption="Adjust to match your plan" />
          <View
            style={[
              styles.targetCard,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <NumberRow
              label="Calories"
              unit="kcal"
              value={profile.calorieTarget}
              step={50}
              onChange={(v) =>
                setProfile((p) => ({ ...p, calorieTarget: Math.max(800, v) }))
              }
            />
            <NumberRow
              label="Protein"
              unit="g"
              value={profile.proteinTarget}
              step={5}
              onChange={(v) =>
                setProfile((p) => ({ ...p, proteinTarget: Math.max(20, v) }))
              }
            />
            <NumberRow
              label="Carbs"
              unit="g"
              value={profile.carbsTarget}
              step={10}
              onChange={(v) =>
                setProfile((p) => ({ ...p, carbsTarget: Math.max(20, v) }))
              }
            />
            <NumberRow
              label="Fat"
              unit="g"
              value={profile.fatTarget}
              step={5}
              onChange={(v) =>
                setProfile((p) => ({ ...p, fatTarget: Math.max(20, v) }))
              }
            />
            <NumberRow
              label="Water"
              unit="glasses"
              value={profile.waterTargetGlasses}
              step={1}
              onChange={(v) =>
                setProfile((p) => ({ ...p, waterTargetGlasses: Math.max(1, v) }))
              }
            />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader
            title="Reminders"
            caption="Gentle nudges so you never forget to log"
          />
          <View
            style={[
              styles.fieldGroup,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.fieldRow}>
              <Feather name="bell" size={18} color={colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                  Enable reminders
                </Text>
                <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                  {Platform.OS === "web"
                    ? "Available on iOS and Android"
                    : profile.reminders.enabled
                      ? "We'll buzz you at meal times"
                      : "Switch on to schedule daily nudges"}
                </Text>
              </View>
              <Switch
                value={profile.reminders.enabled}
                onValueChange={toggleReminders}
                disabled={Platform.OS === "web"}
                trackColor={{ true: colors.primary, false: colors.muted }}
                thumbColor="#fff"
              />
            </View>
            {profile.reminders.enabled && Platform.OS !== "web" ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <ReminderRow
                  icon="sunrise"
                  label="Breakfast"
                  hour={profile.reminders.breakfastHour}
                  enabled={profile.reminders.breakfast}
                  onToggle={(v) =>
                    setProfile((p) => ({
                      ...p,
                      reminders: { ...p.reminders, breakfast: v },
                    }))
                  }
                  onHour={(h) =>
                    setProfile((p) => ({
                      ...p,
                      reminders: { ...p.reminders, breakfastHour: h },
                    }))
                  }
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <ReminderRow
                  icon="sun"
                  label="Lunch"
                  hour={profile.reminders.lunchHour}
                  enabled={profile.reminders.lunch}
                  onToggle={(v) =>
                    setProfile((p) => ({
                      ...p,
                      reminders: { ...p.reminders, lunch: v },
                    }))
                  }
                  onHour={(h) =>
                    setProfile((p) => ({
                      ...p,
                      reminders: { ...p.reminders, lunchHour: h },
                    }))
                  }
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <ReminderRow
                  icon="moon"
                  label="Dinner"
                  hour={profile.reminders.dinnerHour}
                  enabled={profile.reminders.dinner}
                  onToggle={(v) =>
                    setProfile((p) => ({
                      ...p,
                      reminders: { ...p.reminders, dinner: v },
                    }))
                  }
                  onHour={(h) =>
                    setProfile((p) => ({
                      ...p,
                      reminders: { ...p.reminders, dinnerHour: h },
                    }))
                  }
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.fieldRow}>
                  <Feather name="droplet" size={18} color={colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                      Water nudges
                    </Text>
                    <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                      Every 2 hours, 10 AM – 8 PM
                    </Text>
                  </View>
                  <Switch
                    value={profile.reminders.water}
                    onValueChange={(v) =>
                      setProfile((p) => ({
                        ...p,
                        reminders: { ...p.reminders, water: v },
                      }))
                    }
                    trackColor={{ true: colors.primary, false: colors.muted }}
                    thumbColor="#fff"
                  />
                </View>
              </>
            ) : null}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Diet" caption="Filters smart suggestions" />
          <View
            style={[
              styles.dietCard,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            {DIETS.map((d, i) => {
              const active = profile.diet === d.key;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => setDiet(d.key)}
                  style={({ pressed }) => [
                    styles.dietRow,
                    {
                      borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.dietLabel, { color: colors.foreground }]}>
                    {d.label}
                  </Text>
                  {active ? (
                    <Feather name="check" size={18} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.dangerBtn,
            {
              borderColor: colors.destructive,
              opacity: pressed ? 0.7 : 1,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="rotate-ccw" size={16} color={colors.destructive} />
          <Text style={[styles.dangerLabel, { color: colors.destructive }]}>
            Reset everything
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function NumberRow({
  label,
  unit,
  value,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.numberRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.numberLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.numberMeta, { color: colors.mutedForeground }]}>{unit}</Text>
      </View>
      <Pressable
        onPress={() => onChange(value - step)}
        hitSlop={10}
        style={({ pressed }) => [
          styles.stepBtn,
          { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Feather name="minus" size={14} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.numberValue, { color: colors.foreground }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + step)}
        hitSlop={10}
        style={({ pressed }) => [
          styles.stepBtn,
          { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather name="plus" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

function ReminderRow({
  icon,
  label,
  hour,
  enabled,
  onToggle,
  onHour,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  hour: number;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onHour: (h: number) => void;
}) {
  const colors = useColors();
  const display = hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
  return (
    <View style={styles.fieldRow}>
      <Feather name={icon} size={18} color={colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        <View style={styles.hourRow}>
          <Pressable
            onPress={() => onHour(Math.max(0, hour - 1))}
            disabled={!enabled}
            hitSlop={8}
            style={({ pressed }) => [
              styles.hourBtn,
              {
                backgroundColor: colors.muted,
                opacity: !enabled ? 0.4 : pressed ? 0.6 : 1,
              },
            ]}
          >
            <Feather name="minus" size={12} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.hourText, { color: enabled ? colors.foreground : colors.mutedForeground }]}>
            {display}
          </Text>
          <Pressable
            onPress={() => onHour(Math.min(23, hour + 1))}
            disabled={!enabled}
            hitSlop={8}
            style={({ pressed }) => [
              styles.hourBtn,
              {
                backgroundColor: colors.muted,
                opacity: !enabled ? 0.4 : pressed ? 0.6 : 1,
              },
            ]}
          >
            <Feather name="plus" size={12} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ true: colors.primary, false: colors.muted }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 22 },
  title: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: -16 },
  fieldGroup: { paddingHorizontal: 16 },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  fieldInput: { flex: 1, fontSize: 15, padding: 0 },
  fieldUnit: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth },
  helper: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginLeft: 4,
  },
  toggleLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  toggleSub: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  hourRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  hourBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  hourText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    minWidth: 56,
    textAlign: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  goalCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: 16,
    gap: 6,
  },
  goalLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 4 },
  goalDesc: { fontFamily: "Inter_500Medium", fontSize: 12 },
  targetCard: { padding: 8, paddingHorizontal: 16 },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  numberLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  numberMeta: { fontFamily: "Inter_500Medium", fontSize: 12 },
  numberValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    minWidth: 56,
    textAlign: "center",
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dietCard: { paddingHorizontal: 16 },
  dietRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  dietLabel: { fontFamily: "Inter_500Medium", fontSize: 15 },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
  },
  dangerLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

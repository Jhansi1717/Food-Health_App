import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

import {
  DietPref,
  Goal,
  targetsForGoal,
  useApp,
} from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const GOALS: { key: Goal; label: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "lose", label: "Lose weight", desc: "A gentle calorie deficit", icon: "trending-down" },
  { key: "maintain", label: "Maintain", desc: "Hold a steady weight", icon: "minus" },
  { key: "gain", label: "Build muscle", desc: "Surplus with high protein", icon: "trending-up" },
  { key: "healthier", label: "Eat healthier", desc: "Better choices, no scale", icon: "heart" },
];

const DIETS: { key: DietPref; label: string; desc: string }[] = [
  { key: "none", label: "No restrictions", desc: "Anything goes" },
  { key: "vegetarian", label: "Vegetarian", desc: "No meat" },
  { key: "vegan", label: "Vegan", desc: "Plant-based only" },
  { key: "pescatarian", label: "Pescatarian", desc: "Fish, no meat" },
];

export default function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState<Goal>("healthier");
  const [diet, setDiet] = useState<DietPref>("none");

  const TOTAL_STEPS = 5;

  const next = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else finish();
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    const ageNum = parseInt(age, 10);
    const validAge = !isNaN(ageNum) && ageNum >= 5 && ageNum <= 120 ? ageNum : null;
    const t = targetsForGoal(goal, validAge);
    completeOnboarding({
      name: name.trim(),
      age: validAge,
      goal,
      diet,
      ...t,
    });
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={[colors.primaryLight, colors.background]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i <= step ? colors.primary : colors.muted,
                    flex: i === step ? 2 : 1,
                  },
                ]}
              />
            ))}
          </View>

          {step === 0 ? (
            <View style={styles.stepContent}>
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Feather name="feather" size={20} color="#fff" />
              </View>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                Welcome to Nourish
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                Better food choices, one meal at a time. We'll set you up in 30 seconds — no scales, no guilt.
              </Text>
              <View style={styles.bullets}>
                <BulletRow icon="target" text="Personalized daily targets" />
                <BulletRow icon="zap" text="Smart swaps and gentle nudges" />
                <BulletRow icon="bar-chart-2" text="See your real habits emerge" />
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.stepContent}>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                What can we call you?
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                Just so things feel a little more personal.
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.card, borderRadius: colors.radius },
                ]}
              >
                <Feather name="user" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                  autoFocus
                  style={[
                    styles.input,
                    { color: colors.foreground, fontFamily: "Inter_500Medium" },
                  ]}
                />
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.stepContent}>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                How old are you?
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                Optional — but it lets us tune your calorie target to your metabolism. Skip if you'd rather not say.
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.card, borderRadius: colors.radius },
                ]}
              >
                <Feather name="calendar" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={age}
                  onChangeText={(t) => setAge(t.replace(/[^0-9]/g, "").slice(0, 3))}
                  placeholder="e.g. 28"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  autoFocus
                  style={[
                    styles.input,
                    { color: colors.foreground, fontFamily: "Inter_500Medium" },
                  ]}
                />
                <Text style={[styles.unit, { color: colors.mutedForeground }]}>
                  years
                </Text>
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.stepContent}>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                What's your goal?
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                We'll calibrate calories and macros from here. You can change it any time.
              </Text>
              <View style={styles.optionList}>
                {GOALS.map((g) => {
                  const active = goal === g.key;
                  return (
                    <Pressable
                      key={g.key}
                      onPress={() => setGoal(g.key)}
                      style={({ pressed }) => [
                        styles.option,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderRadius: colors.radius,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          {
                            backgroundColor: active ? "#ffffff30" : colors.primaryLight,
                          },
                        ]}
                      >
                        <Feather
                          name={g.icon}
                          size={18}
                          color={active ? "#fff" : colors.primaryDark}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: active ? "#fff" : colors.foreground },
                          ]}
                        >
                          {g.label}
                        </Text>
                        <Text
                          style={[
                            styles.optionDesc,
                            {
                              color: active ? "#fff" : colors.mutedForeground,
                              opacity: active ? 0.85 : 1,
                            },
                          ]}
                        >
                          {g.desc}
                        </Text>
                      </View>
                      {active ? (
                        <Feather name="check" size={18} color="#fff" />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.stepContent}>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                Any dietary preference?
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                We'll only suggest meals that fit.
              </Text>
              <View style={styles.optionList}>
                {DIETS.map((d) => {
                  const active = diet === d.key;
                  return (
                    <Pressable
                      key={d.key}
                      onPress={() => setDiet(d.key)}
                      style={({ pressed }) => [
                        styles.option,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderRadius: colors.radius,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: active ? "#fff" : colors.foreground },
                          ]}
                        >
                          {d.label}
                        </Text>
                        <Text
                          style={[
                            styles.optionDesc,
                            {
                              color: active ? "#fff" : colors.mutedForeground,
                              opacity: active ? 0.85 : 1,
                            },
                          ]}
                        >
                          {d.desc}
                        </Text>
                      </View>
                      {active ? (
                        <Feather name="check" size={18} color="#fff" />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            {step > 0 ? (
              <Pressable
                onPress={back}
                style={({ pressed }) => [
                  styles.secondary,
                  {
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Feather name="chevron-left" size={18} color={colors.foreground} />
                <Text style={[styles.secondaryLabel, { color: colors.foreground }]}>
                  Back
                </Text>
              </Pressable>
            ) : (
              <View style={{ flex: 0 }} />
            )}
            <Pressable
              onPress={next}
              style={({ pressed }) => [
                styles.primary,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.primaryLabel}>
                {step === TOTAL_STEPS - 1 ? "Get started" : step === 2 && !age ? "Skip" : "Continue"}
              </Text>
              <Feather
                name={step === TOTAL_STEPS - 1 ? "check" : "arrow-right"}
                size={18}
                color="#fff"
              />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function BulletRow({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.bullet}>
      <View style={[styles.bulletIcon, { backgroundColor: "#ffffff" }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.bulletText, { color: colors.foreground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, gap: 28, flexGrow: 1 },
  progressRow: { flexDirection: "row", gap: 6 },
  progressDot: { height: 6, borderRadius: 999 },
  stepContent: { gap: 16, flex: 1 },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -0.5 },
  body: { fontFamily: "Inter_500Medium", fontSize: 15, lineHeight: 22 },
  bullets: { gap: 12, marginTop: 12 },
  bullet: { flexDirection: "row", alignItems: "center", gap: 12 },
  bulletIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    marginTop: 12,
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
  unit: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginLeft: 8,
  },
  optionList: { gap: 10, marginTop: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: { fontFamily: "Inter_700Bold", fontSize: 15 },
  optionDesc: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: "auto",
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    gap: 4,
  },
  secondaryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  primary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  primaryLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});

import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BadgeShelf } from "@/components/BadgeShelf";
import { SectionHeader } from "@/components/SectionHeader";
import { SmartSuggestion } from "@/components/SmartSuggestion";
import { streakDays, useApp, lastNDays } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  aggregateByDate,
  habitScore,
  topSwapSuggestions,
} from "@/lib/insights";

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, meals } = useApp();
  const isWeb = Platform.OS === "web";

  const dates = useMemo(() => lastNDays(7), []);
  const weekly = useMemo(() => aggregateByDate(meals, dates), [meals, dates]);
  const score = useMemo(() => habitScore(weekly, profile), [weekly, profile]);
  const streak = useMemo(() => streakDays(meals), [meals]);
  const swaps = useMemo(() => topSwapSuggestions(meals), [meals]);

  const maxCal = Math.max(profile.calorieTarget, ...weekly.map((d) => d.calories), 1);
  const avg7 = Math.round(
    weekly.reduce((acc, d) => acc + d.calories, 0) / Math.max(weekly.filter((d) => d.count > 0).length, 1),
  );

  const scoreLabel =
    score >= 80 ? "Thriving" : score >= 60 ? "On the rise" : score >= 40 ? "Building" : "Just starting";

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
        <Text style={[styles.title, { color: colors.foreground }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          The shape of your week
        </Text>

        <View style={styles.statRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.statHead}>
              <Feather name="award" size={16} color="#fff" />
              <Text style={[styles.statLabel, { color: "#fff", opacity: 0.9 }]}>
                Habit score
              </Text>
            </View>
            <Text style={[styles.statBig, { color: "#fff" }]}>{score}</Text>
            <Text style={[styles.statSub, { color: "#fff", opacity: 0.85 }]}>
              {scoreLabel}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.statHead}>
              <Feather name="zap" size={16} color={colors.accent} />
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Streak
              </Text>
            </View>
            <Text style={[styles.statBig, { color: colors.foreground }]}>
              {streak}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              {streak === 1 ? "day" : "days"} in a row
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.card, borderRadius: colors.radius },
          ]}
        >
          <SectionHeader
            title="Calories this week"
            caption={`Avg ${avg7} kcal · target ${profile.calorieTarget}`}
          />
          <View style={styles.chart}>
            {weekly.map((d, i) => {
              const dayLabel = new Date(d.date).toLocaleDateString(undefined, {
                weekday: "short",
              });
              const h = (d.calories / maxCal) * 130;
              const overTarget = d.calories > profile.calorieTarget;
              const empty = d.count === 0;
              return (
                <View key={d.date} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(h, empty ? 4 : 10),
                          backgroundColor: empty
                            ? colors.muted
                            : overTarget
                              ? colors.destructive
                              : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                    {dayLabel.slice(0, 1)}
                  </Text>
                  <Text style={[styles.barValue, { color: colors.foreground }]}>
                    {d.count > 0 ? Math.round(d.calories) : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
          <View
            style={[
              styles.targetLine,
              { backgroundColor: colors.border },
            ]}
          />
          <View style={styles.legendRow}>
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                On track
              </Text>
            </View>
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                Over target
              </Text>
            </View>
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: colors.muted }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                Unlogged
              </Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader
            title="Streak rewards"
            caption="Earn a badge for every milestone"
          />
          <BadgeShelf streak={streak} />
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader
            title="Smart swaps"
            caption="Easy wins based on what you actually eat"
          />
          {swaps.length === 0 ? (
            <View
              style={[
                styles.empty,
                { backgroundColor: colors.card, borderRadius: colors.radius },
              ]}
            >
              <Feather name="repeat" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No swap ideas yet
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Log a few meals and Nourish will spot easy upgrades automatically.
              </Text>
            </View>
          ) : (
            swaps.map((s, i) => (
              <SmartSuggestion
                key={i}
                title={`Try ${s.toName}`}
                body={`Instead of ${s.fromName}. Save ~${s.savedCalories} kcal — ${s.note}`}
                tone="primary"
                icon="zap"
              />
            ))
          )}
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Macro mix" caption="Average split this week" />
          {(() => {
            const total = weekly.reduce(
              (a, d) => ({
                p: a.p + d.protein * 4,
                c: a.c + d.carbs * 4,
                f: a.f + d.fat * 9,
              }),
              { p: 0, c: 0, f: 0 },
            );
            const sum = total.p + total.c + total.f;
            const p = sum > 0 ? Math.round((total.p / sum) * 100) : 0;
            const c = sum > 0 ? Math.round((total.c / sum) * 100) : 0;
            const f = sum > 0 ? 100 - p - c : 0;
            return (
              <View
                style={[
                  styles.mixCard,
                  { backgroundColor: colors.card, borderRadius: colors.radius },
                ]}
              >
                <View style={styles.mixBar}>
                  <View
                    style={{
                      width: `${Math.max(p, 1)}%`,
                      backgroundColor: colors.protein,
                    }}
                  />
                  <View
                    style={{
                      width: `${Math.max(c, 1)}%`,
                      backgroundColor: colors.carbs,
                    }}
                  />
                  <View
                    style={{
                      width: `${Math.max(f, 1)}%`,
                      backgroundColor: colors.fat,
                    }}
                  />
                </View>
                <View style={styles.mixLegend}>
                  <View style={styles.legend}>
                    <View
                      style={[styles.legendDot, { backgroundColor: colors.protein }]}
                    />
                    <Text style={[styles.legendText, { color: colors.foreground }]}>
                      Protein {p}%
                    </Text>
                  </View>
                  <View style={styles.legend}>
                    <View
                      style={[styles.legendDot, { backgroundColor: colors.carbs }]}
                    />
                    <Text style={[styles.legendText, { color: colors.foreground }]}>
                      Carbs {c}%
                    </Text>
                  </View>
                  <View style={styles.legend}>
                    <View style={[styles.legendDot, { backgroundColor: colors.fat }]} />
                    <Text style={[styles.legendText, { color: colors.foreground }]}>
                      Fat {f}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 22 },
  title: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: -16 },
  statRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 16, gap: 6, minHeight: 130, justifyContent: "space-between" },
  statHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  statLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statBig: { fontFamily: "Inter_700Bold", fontSize: 44, letterSpacing: -1 },
  statSub: { fontFamily: "Inter_500Medium", fontSize: 13 },
  chartCard: { padding: 16, gap: 16 },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 170,
    gap: 8,
  },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: {
    width: "100%",
    height: 130,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: { width: "70%", borderRadius: 8 },
  barLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  barValue: { fontFamily: "Inter_500Medium", fontSize: 10 },
  targetLine: { height: 1, marginTop: -8 },
  legendRow: { flexDirection: "row", justifyContent: "space-between" },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  empty: { padding: 24, alignItems: "center", gap: 6 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 4 },
  emptyBody: { fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center" },
  mixCard: { padding: 16, gap: 14 },
  mixBar: {
    flexDirection: "row",
    height: 16,
    borderRadius: 999,
    overflow: "hidden",
  },
  mixLegend: { flexDirection: "row", justifyContent: "space-between" },
});

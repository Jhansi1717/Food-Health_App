import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Badge, STREAK_BADGES, earnedBadges, nextBadge } from "@/lib/badges";

type Props = {
  streak: number;
};

const COLOR_KEYS = {
  sage: { bg: "primaryLight", fg: "primaryDark" },
  amber: { bg: "#fbe6ad", fg: "#a36a14" },
  rose: { bg: "#f6d6d6", fg: "#a83838" },
  sky: { bg: "#dceaf2", fg: "#3e6d87" },
} as const;

export function BadgeShelf({ streak }: Props) {
  const colors = useColors();
  const earned = earnedBadges(streak);
  const next = nextBadge(streak);

  const palette = (b: Badge) => {
    const key = COLOR_KEYS[b.color];
    if (b.color === "sage") {
      return { bg: colors.primaryLight, fg: colors.primaryDark };
    }
    return { bg: (key.bg as string), fg: (key.fg as string) };
  };

  return (
    <View style={{ gap: 12 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {STREAK_BADGES.map((b) => {
          const isEarned = earned.some((e) => e.id === b.id);
          const p = palette(b);
          return (
            <View key={b.id} style={styles.col}>
              <View
                style={[
                  styles.tile,
                  {
                    backgroundColor: isEarned ? p.bg : colors.muted,
                    opacity: isEarned ? 1 : 0.55,
                  },
                ]}
              >
                <Feather
                  name={b.icon}
                  size={22}
                  color={isEarned ? p.fg : colors.mutedForeground}
                />
                {!isEarned ? (
                  <View
                    style={[
                      styles.lock,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Feather name="lock" size={10} color={colors.mutedForeground} />
                  </View>
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tileLabel,
                  { color: isEarned ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {b.title}
              </Text>
              <Text style={[styles.tileSub, { color: colors.mutedForeground }]}>
                {b.threshold}d
              </Text>
            </View>
          );
        })}
      </ScrollView>
      {next ? (
        <View
          style={[
            styles.nextCard,
            { backgroundColor: colors.card, borderRadius: colors.radius },
          ]}
        >
          <View style={[styles.nextIcon, { backgroundColor: colors.primaryLight }]}>
            <Feather name={next.icon} size={18} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nextTitle, { color: colors.foreground }]}>
              {next.threshold - streak === 1
                ? "1 day to "
                : `${next.threshold - streak} days to `}
              {next.title}
            </Text>
            <Text style={[styles.nextDesc, { color: colors.mutedForeground }]}>
              {next.desc}
            </Text>
          </View>
          <Text style={[styles.nextCount, { color: colors.primary }]}>
            {streak}/{next.threshold}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.nextCard,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Feather name="award" size={18} color="#fff" />
          <Text style={[styles.allDone, { color: "#fff" }]}>
            Every badge earned. You're a Nourish legend.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, paddingVertical: 4, paddingHorizontal: 2 },
  col: { alignItems: "center", width: 78, gap: 6 },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  lock: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textAlign: "center",
  },
  tileSub: { fontFamily: "Inter_500Medium", fontSize: 10 },
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nextTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  nextDesc: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  nextCount: { fontFamily: "Inter_700Bold", fontSize: 14 },
  allDone: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
});

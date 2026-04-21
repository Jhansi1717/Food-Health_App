import { Feather } from "@expo/vector-icons";

export type Badge = {
  id: string;
  threshold: number;
  title: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
  color: "sage" | "amber" | "rose" | "sky";
};

export const STREAK_BADGES: Badge[] = [
  {
    id: "first-step",
    threshold: 1,
    title: "First step",
    desc: "Logged your first day",
    icon: "feather",
    color: "sage",
  },
  {
    id: "consistent",
    threshold: 3,
    title: "Three in a row",
    desc: "Three days of logging",
    icon: "trending-up",
    color: "sage",
  },
  {
    id: "week-warrior",
    threshold: 7,
    title: "Week warrior",
    desc: "A full week of habits",
    icon: "award",
    color: "amber",
  },
  {
    id: "fortnight",
    threshold: 14,
    title: "Fortnight",
    desc: "Two solid weeks",
    icon: "star",
    color: "amber",
  },
  {
    id: "month-master",
    threshold: 30,
    title: "Month master",
    desc: "Thirty days strong",
    icon: "shield",
    color: "rose",
  },
  {
    id: "two-month",
    threshold: 60,
    title: "Stayer",
    desc: "Sixty days running",
    icon: "zap",
    color: "rose",
  },
  {
    id: "century",
    threshold: 100,
    title: "Century club",
    desc: "One hundred days",
    icon: "anchor",
    color: "sky",
  },
];

export function earnedBadges(streak: number): Badge[] {
  return STREAK_BADGES.filter((b) => streak >= b.threshold);
}

export function nextBadge(streak: number): Badge | null {
  return STREAK_BADGES.find((b) => streak < b.threshold) ?? null;
}

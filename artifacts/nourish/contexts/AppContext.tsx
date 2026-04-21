import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Food, findFood } from "@/data/foods";
import { DEFAULT_REMINDERS, ReminderSettings, scheduleReminders } from "@/lib/notifications";

export type Goal = "lose" | "maintain" | "gain" | "healthier";
export type DietPref = "none" | "vegetarian" | "vegan" | "pescatarian";

export type Profile = {
  name: string;
  age: number | null;
  goal: Goal;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  waterTargetGlasses: number;
  diet: DietPref;
  reminders: ReminderSettings;
  onboarded: boolean;
  createdAt: string;
};

export type MealEntry = {
  id: string;
  foodId?: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: Food["category"];
  health: 1 | 2 | 3 | 4 | 5;
  date: string; // YYYY-MM-DD
  loggedAt: string; // ISO
};

export type WaterLog = {
  date: string;
  glasses: number;
};

type State = {
  profile: Profile;
  meals: MealEntry[];
  water: WaterLog[];
};

const DEFAULT_PROFILE: Profile = {
  name: "",
  age: null,
  goal: "healthier",
  calorieTarget: 2000,
  proteinTarget: 110,
  carbsTarget: 230,
  fatTarget: 70,
  waterTargetGlasses: 8,
  diet: "none",
  reminders: DEFAULT_REMINDERS,
  onboarded: false,
  createdAt: new Date().toISOString(),
};

const STORAGE_KEY = "@nourish/state/v1";

type Ctx = {
  ready: boolean;
  profile: Profile;
  meals: MealEntry[];
  water: WaterLog[];
  todayKey: string;
  setProfile: (updater: (p: Profile) => Profile) => void;
  completeOnboarding: (p: Partial<Profile>) => void;
  addMeal: (food: Food | Omit<MealEntry, "id" | "date" | "loggedAt">) => void;
  removeMeal: (id: string) => void;
  addWater: (delta: number) => void;
  resetAll: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function todayString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function newId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function targetsForGoal(
  goal: Goal,
  age: number | null = null,
): {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
} {
  let base: { calorieTarget: number; proteinTarget: number; carbsTarget: number; fatTarget: number };
  switch (goal) {
    case "lose":
      base = { calorieTarget: 1700, proteinTarget: 120, carbsTarget: 170, fatTarget: 60 };
      break;
    case "gain":
      base = { calorieTarget: 2600, proteinTarget: 150, carbsTarget: 320, fatTarget: 85 };
      break;
    case "maintain":
      base = { calorieTarget: 2200, proteinTarget: 110, carbsTarget: 250, fatTarget: 75 };
      break;
    case "healthier":
    default:
      base = { calorieTarget: 2000, proteinTarget: 110, carbsTarget: 230, fatTarget: 70 };
  }

  // Tune by age: metabolism slows ~2% per decade after 30, faster needs in teens.
  if (age != null && age > 0) {
    let mult = 1;
    if (age < 18) mult = 1.1;
    else if (age >= 30 && age < 50) mult = 0.97;
    else if (age >= 50 && age < 65) mult = 0.93;
    else if (age >= 65) mult = 0.88;
    base = {
      calorieTarget: Math.round((base.calorieTarget * mult) / 50) * 50,
      proteinTarget: age >= 50 ? base.proteinTarget + 10 : base.proteinTarget,
      carbsTarget: Math.round((base.carbsTarget * mult) / 10) * 10,
      fatTarget: Math.round((base.fatTarget * mult) / 5) * 5,
    };
  }

  return base;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [water, setWater] = useState<WaterLog[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: State = JSON.parse(raw);
          setProfileState({ ...DEFAULT_PROFILE, ...parsed.profile });
          setMeals(parsed.meals ?? []);
          setWater(parsed.water ?? []);
        }
      } catch {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const state: State = { profile, meals, water };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [ready, profile, meals, water]);

  useEffect(() => {
    if (!ready) return;
    scheduleReminders(profile.reminders, profile.name).catch(() => {});
  }, [
    ready,
    profile.name,
    profile.reminders.enabled,
    profile.reminders.breakfast,
    profile.reminders.lunch,
    profile.reminders.dinner,
    profile.reminders.water,
    profile.reminders.breakfastHour,
    profile.reminders.lunchHour,
    profile.reminders.dinnerHour,
  ]);

  const todayKey = todayString();

  const setProfile = useCallback((updater: (p: Profile) => Profile) => {
    setProfileState((prev) => updater(prev));
  }, []);

  const completeOnboarding = useCallback((p: Partial<Profile>) => {
    setProfileState((prev) => ({
      ...prev,
      ...p,
      onboarded: true,
      createdAt: prev.createdAt || new Date().toISOString(),
    }));
  }, []);

  const addMeal = useCallback(
    (input: Food | Omit<MealEntry, "id" | "date" | "loggedAt">) => {
      const date = todayString();
      const loggedAt = new Date().toISOString();
      const base: MealEntry =
        "id" in input && (input as Food).id && findFood((input as Food).id)
          ? {
              id: newId(),
              foodId: (input as Food).id,
              name: (input as Food).name,
              serving: (input as Food).serving,
              calories: (input as Food).calories,
              protein: (input as Food).protein,
              carbs: (input as Food).carbs,
              fat: (input as Food).fat,
              category: (input as Food).category,
              health: (input as Food).health,
              date,
              loggedAt,
            }
          : {
              id: newId(),
              ...(input as Omit<MealEntry, "id" | "date" | "loggedAt">),
              date,
              loggedAt,
            };
      setMeals((prev) => [base, ...prev]);
    },
    [],
  );

  const removeMeal = useCallback((id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addWater = useCallback((delta: number) => {
    const date = todayString();
    setWater((prev) => {
      const existing = prev.find((w) => w.date === date);
      if (existing) {
        return prev.map((w) =>
          w.date === date
            ? { ...w, glasses: Math.max(0, w.glasses + delta) }
            : w,
        );
      }
      return [{ date, glasses: Math.max(0, delta) }, ...prev];
    });
  }, []);

  const resetAll = useCallback(() => {
    setProfileState({ ...DEFAULT_PROFILE, createdAt: new Date().toISOString() });
    setMeals([]);
    setWater([]);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      profile,
      meals,
      water,
      todayKey,
      setProfile,
      completeOnboarding,
      addMeal,
      removeMeal,
      addWater,
      resetAll,
    }),
    [
      ready,
      profile,
      meals,
      water,
      todayKey,
      setProfile,
      completeOnboarding,
      addMeal,
      removeMeal,
      addWater,
      resetAll,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

// Selectors
export function sumDay(meals: MealEntry[], date: string) {
  return meals
    .filter((m) => m.date === date)
    .reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
        count: acc.count + 1,
        avgHealth: acc.avgHealth + m.health,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0, avgHealth: 0 },
    );
}

export function streakDays(meals: MealEntry[]): number {
  if (meals.length === 0) return 0;
  const dates = new Set(meals.map((m) => m.date));
  let count = 0;
  const d = new Date();
  while (dates.has(todayString(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    out.push(todayString(dd));
  }
  return out;
}

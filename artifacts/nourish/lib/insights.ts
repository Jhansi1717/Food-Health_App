import { MealEntry, Profile } from "@/contexts/AppContext";
import { FOODS, findFood } from "@/data/foods";

export type Insight = {
  id: string;
  title: string;
  body: string;
  tone: "primary" | "warn" | "neutral";
  icon: "zap" | "heart" | "trending-up" | "alert-circle" | "award" | "target" | "sun";
};

export function generateInsights(
  profile: Profile,
  todayMeals: MealEntry[],
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  hour: number,
): Insight[] {
  const out: Insight[] = [];
  const remaining = profile.calorieTarget - consumed.calories;
  const proteinLeft = profile.proteinTarget - consumed.protein;

  // Time-of-day hint
  if (todayMeals.length === 0 && hour >= 9) {
    out.push({
      id: "no-meals",
      title: "Start your day with fuel",
      body:
        "You haven't logged anything yet. Logging breakfast within an hour of waking helps stabilize energy.",
      tone: "warn",
      icon: "sun",
    });
  }

  // Protein nudge
  if (consumed.calories > 800 && proteinLeft / profile.proteinTarget > 0.5) {
    out.push({
      id: "protein-low",
      title: "Aim for more protein",
      body: `You're ${Math.round(proteinLeft)}g short on protein. A handful of almonds or Greek yogurt closes the gap fast.`,
      tone: "primary",
      icon: "target",
    });
  }

  // Heavy meal warning
  const heavy = todayMeals.find((m) => m.calories > 700 && m.health <= 2);
  if (heavy && heavy.foodId) {
    const swap = heavy.foodId ? findFood(heavy.foodId)?.swapForId : undefined;
    const swapFood = swap ? findFood(swap) : undefined;
    if (swapFood) {
      const saved = heavy.calories - swapFood.calories;
      out.push({
        id: `swap-${heavy.id}`,
        title: `Swap idea: ${swapFood.name}`,
        body: `Next time try ${swapFood.name} instead of ${heavy.name}. Save ~${Math.round(saved)} kcal — ${findFood(heavy.foodId!)?.swapNote ?? ""}`.trim(),
        tone: "primary",
        icon: "zap",
      });
    }
  }

  // Calorie pacing
  if (hour >= 18 && remaining > 600) {
    out.push({
      id: "under-eating",
      title: "Don't skimp on dinner",
      body: `You still have ${Math.round(remaining)} kcal to go. A balanced plate of protein + veggies + grains will hit the mark.`,
      tone: "neutral",
      icon: "heart",
    });
  }
  if (remaining < -150) {
    out.push({
      id: "over",
      title: "Slightly over today",
      body: `You're ${Math.round(-remaining)} kcal over goal. A short walk and a lighter dinner tomorrow will balance things out.`,
      tone: "warn",
      icon: "alert-circle",
    });
  }

  // Streak encouragement
  if (todayMeals.length >= 3 && remaining >= 0 && remaining <= 400) {
    out.push({
      id: "on-track",
      title: "You're on track today",
      body: "Great pacing — three meals in and within your calorie window. Keep that momentum.",
      tone: "primary",
      icon: "award",
    });
  }

  // Morning suggestion
  if (out.length === 0 && hour < 11 && todayMeals.length === 0) {
    out.push({
      id: "morning",
      title: "Good morning",
      body: "Plan your day in 30 seconds — log what you're having and Nourish will steer the rest.",
      tone: "primary",
      icon: "sun",
    });
  }

  return out;
}

export type DailyMacros = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
  avgHealth: number;
};

export function aggregateByDate(meals: MealEntry[], dates: string[]): DailyMacros[] {
  return dates.map((date) => {
    const day = meals.filter((m) => m.date === date);
    const total = day.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
        avgHealth: acc.avgHealth + m.health,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, avgHealth: 0 },
    );
    return {
      date,
      ...total,
      count: day.length,
      avgHealth: day.length > 0 ? total.avgHealth / day.length : 0,
    };
  });
}

export function habitScore(daily: DailyMacros[], profile: Profile): number {
  if (daily.length === 0) return 0;
  let total = 0;
  let weight = 0;
  for (const d of daily) {
    if (d.count === 0) continue;
    const calorieFit =
      1 - Math.min(Math.abs(d.calories - profile.calorieTarget) / profile.calorieTarget, 1);
    const proteinFit = Math.min(d.protein / profile.proteinTarget, 1);
    const healthFit = d.avgHealth / 5;
    total += (calorieFit * 0.4 + proteinFit * 0.3 + healthFit * 0.3) * 100;
    weight += 1;
  }
  return weight > 0 ? Math.round(total / weight) : 0;
}

export function topSwapSuggestions(meals: MealEntry[]): {
  fromName: string;
  toName: string;
  note: string;
  savedCalories: number;
}[] {
  const counts = new Map<string, number>();
  for (const m of meals) {
    if (!m.foodId) continue;
    const f = findFood(m.foodId);
    if (f?.swapForId) counts.set(m.foodId, (counts.get(m.foodId) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return sorted
    .map(([id]) => {
      const from = findFood(id);
      const to = from?.swapForId ? findFood(from.swapForId) : undefined;
      if (!from || !to) return null;
      return {
        fromName: from.name,
        toName: to.name,
        note: from.swapNote ?? "",
        savedCalories: Math.max(0, from.calories - to.calories),
      };
    })
    .filter(Boolean) as {
    fromName: string;
    toName: string;
    note: string;
    savedCalories: number;
  }[];
}

export function recommendNextMeals(
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  diet: Profile["diet"],
  hour: number,
) {
  const category =
    hour < 11 ? "breakfast" : hour < 15 ? "lunch" : hour < 21 ? "dinner" : "snack";

  return FOODS.filter((f) => {
    if (f.category === "drink") return false;
    if (diet === "vegetarian" && ["saladchicken", "wrap", "salmon", "steak"].includes(f.id))
      return false;
    if (
      diet === "vegan" &&
      ["yogurt", "saladchicken", "wrap", "salmon", "steak", "alfredo"].includes(f.id)
    )
      return false;
    if (diet === "pescatarian" && ["saladchicken", "wrap", "steak"].includes(f.id)) return false;
    return true;
  })
    .map((f) => {
      const fits = f.calories <= remaining.calories + 100 ? 1 : 0;
      const proteinScore =
        remaining.protein > 0 ? Math.min(f.protein / Math.max(remaining.protein, 1), 1) : 0.5;
      const healthScore = f.health / 5;
      const categoryFit = f.category === category ? 0.3 : 0;
      return { food: f, score: fits * 0.3 + proteinScore * 0.3 + healthScore * 0.3 + categoryFit };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.food);
}

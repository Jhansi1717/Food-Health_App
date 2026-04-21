import { Food, FoodCategory } from "@/data/foods";

export type ScannedProduct = Omit<Food, "id"> & {
  barcode: string;
  brand?: string;
  imageUrl?: string;
};

function pick<T>(value: T | undefined | null, fallback: T): T {
  return value === undefined || value === null || (value as unknown) === "" ? fallback : value;
}

function inferCategory(name: string, categoriesTags: string[] = []): FoodCategory {
  const haystack = (name + " " + categoriesTags.join(" ")).toLowerCase();
  if (/(beverage|drink|juice|soda|water|coffee|tea|milk)/.test(haystack)) return "drink";
  if (/(breakfast|cereal|granola|oat|pancake|yogurt)/.test(haystack)) return "breakfast";
  if (/(snack|cookie|chip|cracker|bar|chocolate|candy|nut)/.test(haystack)) return "snack";
  if (/(dinner|pasta|pizza|rice|noodle|soup)/.test(haystack)) return "dinner";
  if (/(sandwich|wrap|salad|burger|lunch)/.test(haystack)) return "lunch";
  return "snack";
}

function healthFromMacros(cal: number, p: number, f: number, sugars: number, sat: number): 1 | 2 | 3 | 4 | 5 {
  const macroCal = p * 4 + f * 9 || 1;
  const proteinPct = (p * 4) / macroCal;
  if (sugars > 20 || sat > 8) return 1;
  if (cal > 500 && proteinPct < 0.1) return 2;
  if (proteinPct > 0.25 && sugars < 8) return 5;
  if (proteinPct > 0.15) return 4;
  return 3;
}

export async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json?fields=product_name,brands,nutriments,serving_size,categories_tags,image_small_url`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { "User-Agent": "Nourish/1.0" } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};
  const name = pick(p.product_name, "Unknown product").trim();
  const brand = (p.brands ?? "").split(",")[0]?.trim() || undefined;
  const serving = pick(p.serving_size, "100 g");

  // OFF often gives per-100g; prefer per-serving when available.
  const calories = Math.round(
    pick(n["energy-kcal_serving"], pick(n["energy-kcal_100g"], 0)),
  );
  const protein = Math.round(pick(n.proteins_serving, pick(n.proteins_100g, 0)));
  const carbs = Math.round(
    pick(n.carbohydrates_serving, pick(n.carbohydrates_100g, 0)),
  );
  const fat = Math.round(pick(n.fat_serving, pick(n.fat_100g, 0)));
  const sugars = pick(n.sugars_serving, pick(n.sugars_100g, 0));
  const sat = pick(n["saturated-fat_serving"], pick(n["saturated-fat_100g"], 0));

  if (!calories && !protein && !carbs && !fat) return null;

  return {
    barcode,
    name,
    brand,
    serving,
    calories,
    protein,
    carbs,
    fat,
    category: inferCategory(name, p.categories_tags ?? []),
    health: healthFromMacros(calories, protein, fat, sugars, sat),
    imageUrl: p.image_small_url,
  };
}

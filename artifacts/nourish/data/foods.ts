export type FoodCategory = "breakfast" | "lunch" | "dinner" | "snack" | "drink";

export type Food = {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: FoodCategory;
  health: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  swapForId?: string;
  swapNote?: string;
};

export const FOODS: Food[] = [
  { id: "oats", name: "Oatmeal with berries", serving: "1 bowl", calories: 320, protein: 12, carbs: 54, fat: 6, category: "breakfast", health: 5, tags: ["vegan", "high-fiber"] },
  { id: "yogurt", name: "Greek yogurt & honey", serving: "1 cup", calories: 220, protein: 18, carbs: 24, fat: 5, category: "breakfast", health: 4, tags: ["vegetarian"] },
  { id: "avotoast", name: "Avocado toast", serving: "2 slices", calories: 380, protein: 10, carbs: 38, fat: 22, category: "breakfast", health: 4, tags: ["vegetarian"] },
  { id: "pancakes", name: "Pancakes with syrup", serving: "3 cakes", calories: 590, protein: 9, carbs: 92, fat: 18, category: "breakfast", health: 1, tags: ["sweet"], swapForId: "oats", swapNote: "Half the calories, triple the fiber." },
  { id: "bagel", name: "Bagel with cream cheese", serving: "1 bagel", calories: 460, protein: 14, carbs: 62, fat: 17, category: "breakfast", health: 2, swapForId: "avotoast", swapNote: "More healthy fats, less refined carbs." },

  { id: "saladchicken", name: "Grilled chicken salad", serving: "1 plate", calories: 420, protein: 38, carbs: 18, fat: 22, category: "lunch", health: 5, tags: ["high-protein"] },
  { id: "buddha", name: "Buddha bowl", serving: "1 bowl", calories: 480, protein: 18, carbs: 62, fat: 16, category: "lunch", health: 5, tags: ["vegan"] },
  { id: "wrap", name: "Turkey wrap", serving: "1 wrap", calories: 450, protein: 28, carbs: 44, fat: 18, category: "lunch", health: 4 },
  { id: "burger", name: "Cheeseburger & fries", serving: "1 combo", calories: 980, protein: 32, carbs: 92, fat: 52, category: "lunch", health: 1, swapForId: "saladchicken", swapNote: "Same protein, half the calories." },
  { id: "pizza", name: "Pepperoni pizza", serving: "2 slices", calories: 680, protein: 24, carbs: 78, fat: 28, category: "lunch", health: 2, swapForId: "wrap", swapNote: "Lighter on refined carbs and saturated fat." },

  { id: "salmon", name: "Salmon & quinoa", serving: "1 plate", calories: 540, protein: 38, carbs: 42, fat: 22, category: "dinner", health: 5, tags: ["omega-3"] },
  { id: "tofu", name: "Tofu stir-fry", serving: "1 bowl", calories: 420, protein: 22, carbs: 44, fat: 16, category: "dinner", health: 5, tags: ["vegan"] },
  { id: "pasta", name: "Pasta marinara", serving: "1 plate", calories: 560, protein: 18, carbs: 88, fat: 12, category: "dinner", health: 3 },
  { id: "steak", name: "Steak & potatoes", serving: "1 plate", calories: 760, protein: 48, carbs: 52, fat: 38, category: "dinner", health: 3 },
  { id: "alfredo", name: "Fettuccine alfredo", serving: "1 plate", calories: 920, protein: 22, carbs: 96, fat: 48, category: "dinner", health: 1, swapForId: "pasta", swapNote: "Tomato base saves ~360 calories." },

  { id: "apple", name: "Apple", serving: "1 medium", calories: 95, protein: 0, carbs: 25, fat: 0, category: "snack", health: 5 },
  { id: "almonds", name: "Almonds", serving: "1 handful", calories: 170, protein: 6, carbs: 6, fat: 15, category: "snack", health: 5 },
  { id: "hummus", name: "Hummus & carrots", serving: "1 serving", calories: 200, protein: 6, carbs: 22, fat: 10, category: "snack", health: 5 },
  { id: "chips", name: "Potato chips", serving: "1 bag", calories: 320, protein: 4, carbs: 36, fat: 18, category: "snack", health: 1, swapForId: "almonds", swapNote: "Real fats and protein keep you fuller." },
  { id: "cookie", name: "Chocolate cookie", serving: "1 large", calories: 280, protein: 3, carbs: 38, fat: 14, category: "snack", health: 1, swapForId: "apple", swapNote: "Skip the sugar spike." },

  { id: "water", name: "Water", serving: "1 glass", calories: 0, protein: 0, carbs: 0, fat: 0, category: "drink", health: 5 },
  { id: "coffee", name: "Black coffee", serving: "1 cup", calories: 5, protein: 0, carbs: 0, fat: 0, category: "drink", health: 5 },
  { id: "latte", name: "Oat milk latte", serving: "12 oz", calories: 180, protein: 4, carbs: 28, fat: 6, category: "drink", health: 3 },
  { id: "soda", name: "Soda", serving: "1 can", calories: 150, protein: 0, carbs: 39, fat: 0, category: "drink", health: 1, swapForId: "water", swapNote: "Skip 39g of added sugar." },
  { id: "juice", name: "Orange juice", serving: "1 glass", calories: 120, protein: 2, carbs: 28, fat: 0, category: "drink", health: 2, swapForId: "coffee", swapNote: "Less sugar, more focus." },
];

export function findFood(id: string): Food | undefined {
  return FOODS.find((f) => f.id === id);
}

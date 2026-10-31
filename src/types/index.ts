export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type IngredientCategory = 'meat_fish' | 'vegetable' | 'dairy_egg' | 'seasoning' | 'staple' | 'other';

export type DishCategory = 'main' | 'sub' | 'soup' | 'dessert';

export interface IngredientItem {
  name: string;
  category: IngredientCategory;
}

export interface RecipeItem {
  id: string;
  name: string;
  type: DishCategory;
  genre: 'japanese' | 'western' | 'chinese' | 'quick' | 'healthy' | 'sweet';
  ingredients: IngredientItem[];
  cookTimeMinutes?: number;
  tip?: string;
  isCustom?: boolean; // ユーザーが任意登録したメニューかどうか
  createdAt?: number;
}

export interface DayMenu {
  dayId: DayId;
  dayLabel: string;
  shortLabel: string;
  theme: string;
  mainDish: string;
  subDish: string;
  soupDish: string;
  dessertDish: string; // デザート枠
  ingredients: IngredientItem[];
  memo: string;
}

export interface WeekPlan {
  id: string;
  title: string;
  days: Record<DayId, DayMenu>;
  updatedAt: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: IngredientCategory;
  checked: boolean;
  daySources?: string[];
}

export interface SavedTemplate {
  id: string;
  title: string;
  description: string;
  isPreset?: boolean;
  days: Record<DayId, DayMenu>;
  createdAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: 'sm' | 'md' | 'lg'; // 文字の大きさ: 小・標準・大
  notifyEnabled: boolean; // 通知の有無
  notifyTime: string; // リマインダー通知時間 (例: "17:00")
  weekStart: 'mon' | 'sun'; // 週の開始曜日
}

export type NavTabType = 'plan' | 'menu' | 'favorites' | 'stats' | 'settings';

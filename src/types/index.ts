export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type IngredientCategory = 'meat_fish' | 'vegetable' | 'dairy_egg' | 'seasoning' | 'staple' | 'other';

export type DishCategory = 'main' | 'sub' | 'soup' | 'dessert' | 'other';

export interface IngredientItem {
  name: string;
  category: IngredientCategory;
  amount?: number; // 基準人数あたりの数量（例: 200, 1, 0.5）
  unit?: string; // 単位（例: 'g', '個', '本', '丁', '大さじ' 等）
  servings?: number; // 何人分基準か（デフォルト: 2）
}

export interface DishEntry {
  id: string;
  name: string;
  type: DishCategory;
  ingredients?: IngredientItem[];
  servings?: number;
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
  dishes?: DishEntry[]; // 複数メニュー対応（何品でも追加可能）
  ingredients: IngredientItem[];
  servings?: number; // この日の基準人数（デフォルト: 2）
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
  amount?: number; // 計算後の合計数量
  unit?: string; // 単位
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

// カレンダーに記録する日別の献立・実績
export interface CalendarRecord {
  date: string; // 'YYYY-MM-DD'
  dishes: DishEntry[];
  servings: number;
  memo?: string;
  rating?: number; // 1-5
  cooked?: boolean; // 作ったかどうか
  updatedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: 'sm' | 'md' | 'lg'; // 文字の大きさ: 小・標準・大
  notifyEnabled: boolean; // 通知の有無
  notifyTime: string; // リマインダー通知時間 (例: "17:00")
  weekStart: 'mon' | 'sun'; // 週の開始曜日
  defaultServings: number; // デフォルト人数（例: 2人分）
}

export type NavTabType = 'plan' | 'calendar' | 'menu' | 'favorites' | 'stats' | 'settings';

import type {
  DayId,
  DayMenu,
  ShoppingItem,
  SavedTemplate,
  RecipeItem,
  AppSettings,
  IngredientCategory,
  CalendarRecord,
  DishEntry,
  IngredientItem,
} from '../types';
import {
  DEFAULT_WEEK_DAYS,
  PRESET_RECIPES,
  PRESET_TEMPLATES,
  guessCategory,
  parseIngredientText,
} from '../data/presetRecipes';

// データ構造のバージョン（上げると旧バージョンの保存データを自動で最新の分量・分類データへアップグレードする）
const CURRENT_DATA_VERSION = 3;

const STORAGE_KEYS = {
  DATA_VERSION: 'kondate_data_version',
  WEEK_PLAN: 'kondate_weekly_plan_v2',
  SHOPPING_LIST: 'kondate_shopping_list_v2',
  FAVORITES: 'kondate_saved_templates_v2',
  CUSTOM_RECIPES: 'kondate_custom_recipes_v2',
  SETTINGS: 'kondate_app_settings_v2',
  HISTORY: 'kondate_plan_history_v2',
  CALENDAR: 'kondate_calendar_records_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontSize: 'md',
  notifyEnabled: false,
  notifyTime: '17:30',
  weekStart: 'mon',
  defaultServings: 2,
};

// 献立の各曜日にdishes配列とingredients配列を補完・同期するヘルパー
export const ensureDayDishes = (day: DayMenu, customRecipes?: RecipeItem[]): DayMenu => {
  const servings = day.servings || 2;
  const allRecipes = customRecipes ? [...customRecipes, ...PRESET_RECIPES] : getAllRecipes();
  const recipeMap = new Map<string, RecipeItem>();
  allRecipes.forEach((r) => recipeMap.set(r.name.trim(), r));

  let dishes = day.dishes ? [...day.dishes] : [];

  // もしdishesが未定義（undefined）なら、従来の4枠から構築（空配列[]にされた場合は全削除として扱う）
  if (day.dishes === undefined) {
    if (day.mainDish) {
      dishes.push({
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: day.mainDish,
        type: 'main',
        ingredients: recipeMap.get(day.mainDish.trim())?.ingredients,
        servings,
      });
    }
    if (day.subDish) {
      dishes.push({
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: day.subDish,
        type: 'sub',
        ingredients: recipeMap.get(day.subDish.trim())?.ingredients,
        servings,
      });
    }
    if (day.soupDish) {
      dishes.push({
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: day.soupDish,
        type: 'soup',
        ingredients: recipeMap.get(day.soupDish.trim())?.ingredients,
        servings,
      });
    }
    if (day.dessertDish) {
      dishes.push({
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: day.dessertDish,
        type: 'dessert',
        ingredients: recipeMap.get(day.dessertDish.trim())?.ingredients,
        servings,
      });
    }
  } else {
    // 既存のdishに分量付きレシピ情報があれば補完
    dishes = dishes.map((d) => {
      const matched = recipeMap.get(d.name.trim());
      return {
        ...d,
        ingredients: matched?.ingredients || d.ingredients,
        servings,
      };
    });
  }

  // dishesからその日の材料一覧を再構築（料理を削除・変更したら古い材料も消えるようにする）
  const ingMap = new Map<string, IngredientItem>();
  dishes.forEach((d) => {
    const ings = d.ingredients || recipeMap.get(d.name.trim())?.ingredients || [];
    ings.forEach((ing) => {
      if (ing.name === '味噌・和風だし') return;
      const existing = ingMap.get(ing.name);
      if (existing && existing.amount !== undefined && ing.amount !== undefined && existing.unit === ing.unit) {
        existing.amount = Math.round((existing.amount + ing.amount) * 10) / 10;
      } else if (!existing) {
        ingMap.set(ing.name, { ...ing });
      }
    });
  });

  // 従来のフィールドも互換性のために同期
  const main = dishes.find((d) => d.type === 'main')?.name || '';
  const sub = dishes.find((d) => d.type === 'sub')?.name || '';
  const soup = dishes.find((d) => d.type === 'soup')?.name || '';
  const dessert = dishes.find((d) => d.type === 'dessert')?.name || '';

  return {
    ...day,
    servings,
    dishes,
    ingredients: Array.from(ingMap.values()),
    mainDish: main,
    subDish: sub,
    soupDish: soup,
    dessertDish: dessert,
  };
};

// 献立の読み込み（旧バージョンのデータが残っている場合は自動でv3の分量付きデータへ移行する）
export const loadWeekPlan = (): Record<DayId, DayMenu> => {
  try {
    const savedVer = Number(localStorage.getItem(STORAGE_KEYS.DATA_VERSION) || '0');
    const data = localStorage.getItem(STORAGE_KEYS.WEEK_PLAN);

    if (data) {
      const parsed = JSON.parse(data) as Record<DayId, DayMenu>;
      const keys = Object.keys(parsed) as DayId[];
      keys.forEach((d) => {
        parsed[d] = ensureDayDishes(parsed[d]);
      });

      if (savedVer < CURRENT_DATA_VERSION) {
        localStorage.setItem(STORAGE_KEYS.WEEK_PLAN, JSON.stringify(parsed));
        localStorage.removeItem(STORAGE_KEYS.SHOPPING_LIST);
        localStorage.setItem(STORAGE_KEYS.DATA_VERSION, String(CURRENT_DATA_VERSION));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load week plan:', e);
  }

  // 初期値にもdishesを設定
  const initial = { ...DEFAULT_WEEK_DAYS };
  (Object.keys(initial) as DayId[]).forEach((d) => {
    initial[d] = ensureDayDishes(initial[d]);
  });
  try {
    localStorage.setItem(STORAGE_KEYS.DATA_VERSION, String(CURRENT_DATA_VERSION));
  } catch {
    // ignore
  }
  return initial;
};

// 献立の保存
export const saveWeekPlan = (plan: Record<DayId, DayMenu>): void => {
  try {
    // 保存前にdishesを確実に同期
    const normalized: Record<DayId, DayMenu> = {} as Record<DayId, DayMenu>;
    (Object.keys(plan) as DayId[]).forEach((d) => {
      normalized[d] = ensureDayDishes(plan[d]);
    });
    localStorage.setItem(STORAGE_KEYS.WEEK_PLAN, JSON.stringify(normalized));
    recordPlanHistory(normalized);
  } catch (e) {
    console.error('Failed to save week plan:', e);
  }
};

// 履歴の記録
const recordPlanHistory = (plan: Record<DayId, DayMenu>): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const history: Record<DayId, DayMenu>[] = raw ? JSON.parse(raw) : [];
    history.unshift(plan);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 4)));
  } catch {
    // ignore
  }
};

// 買い物リストの読み込み
export const loadShoppingItems = (): ShoppingItem[] => {
  const settings = loadAppSettings();
  const defaultServings = settings.defaultServings || 2;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
    if (data) {
      const saved: ShoppingItem[] = JSON.parse(data);
      // 献立データと再同期して、最新の分量・チェック状態を反映する
      return generateShoppingListFromPlan(loadWeekPlan(), saved, defaultServings);
    }
  } catch (e) {
    console.error('Failed to load shopping list:', e);
  }
  return generateShoppingListFromPlan(loadWeekPlan(), [], defaultServings);
};

// 買い物リストの保存
export const saveShoppingItems = (items: ShoppingItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save shopping list:', e);
  }
};

// ユーザー登録カスタムメニューの読み込み（材料の分類・分量を最新のルールで正規化する）
export const loadCustomRecipes = (): RecipeItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_RECIPES);
    if (data) {
      const list = JSON.parse(data) as RecipeItem[];
      return list.map((r) => ({
        ...r,
        ingredients: (r.ingredients || []).map((ing) => {
          if (ing.amount === undefined) {
            const parsed = parseIngredientText(ing.name);
            return { ...ing, ...parsed };
          }
          return { ...ing, category: guessCategory(ing.name) };
        }),
      }));
    }
  } catch (e) {
    console.error('Failed to load custom recipes:', e);
  }
  return [];
};

// ユーザー登録カスタムメニューの保存
export const saveCustomRecipes = (recipes: RecipeItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_RECIPES, JSON.stringify(recipes));
  } catch (e) {
    console.error('Failed to save custom recipes:', e);
  }
};

// 全レシピの取得（プリセット＋ユーザー自作）
export const getAllRecipes = (): RecipeItem[] => {
  const custom = loadCustomRecipes();
  return [...custom, ...PRESET_RECIPES];
};

// お気に入りテンプレートの読み込み
export const loadSavedTemplates = (): SavedTemplate[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (data) {
      const userTemplates: SavedTemplate[] = JSON.parse(data);
      return [...PRESET_TEMPLATES, ...userTemplates];
    }
  } catch (e) {
    console.error('Failed to load templates:', e);
  }
  return PRESET_TEMPLATES;
};

// お気に入りテンプレートの保存
export const saveUserTemplate = (template: SavedTemplate): void => {
  try {
    const current = loadSavedTemplates().filter((t) => !t.isPreset);
    current.unshift(template);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save template:', e);
  }
};

// お気に入りテンプレートの削除
export const deleteUserTemplate = (templateId: string): void => {
  try {
    const current = loadSavedTemplates().filter((t) => !t.isPreset && t.id !== templateId);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to delete template:', e);
  }
};

// カレンダー記録の読み込み
export const loadCalendarRecords = (): Record<string, CalendarRecord> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CALENDAR);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load calendar records:', e);
  }
  return {};
};

// カレンダー記録の保存
export const saveCalendarRecords = (records: Record<string, CalendarRecord>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save calendar records:', e);
  }
};

// 設定の読み込み
export const loadAppSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
};

// 設定の保存
export const saveAppSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    applyVisualSettings(settings);
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

// 画面表示・文字サイズの即時適用
export const applyVisualSettings = (settings: AppSettings): void => {
  document.documentElement.setAttribute('data-theme', settings.theme);
  document.documentElement.setAttribute('data-font-size', settings.fontSize);

  const fontSizes = {
    sm: '14px',
    md: '16px',
    lg: '18px',
  };
  document.documentElement.style.fontSize = fontSizes[settings.fontSize] || '16px';
};

// --------------------------------------------------------------------------
// 「玉ねぎ・人参」のようにまとめて書かれた食材を、買い物用に1品ずつ分解する
// （「A または B」は選択肢なので分解しない／数量付きの食材も分解しない）
// --------------------------------------------------------------------------
const SKIP_SHOPPING_NAMES = new Set(['水', 'お湯', '湯']);

export const splitCompoundIngredient = (ing: IngredientItem): IngredientItem[] => {
  const name = ing.name.trim();
  if (!name) return [];
  if (name.includes('または') || ing.amount !== undefined || !name.includes('・')) {
    return [ing];
  }
  const parts = name
    .split('・')
    .map((p) => p.trim())
    .filter((p) => p && !SKIP_SHOPPING_NAMES.has(p));
  if (parts.length <= 1) return parts.length === 1 ? [{ ...ing, name: parts[0] }] : [];
  return parts.map((p) => ({ name: p, category: guessCategory(p) }));
};

// --------------------------------------------------------------------------
// 献立・人数から買い物リストを自動抽出・計算生成する関数
// --------------------------------------------------------------------------
export const generateShoppingListFromPlan = (
  plan: Record<DayId, DayMenu>,
  existingItems: ShoppingItem[] = [],
  targetServings: number = 2
): ShoppingItem[] => {
  // 既存のチェック状態を記憶
  const checkedMap = new Map<string, boolean>();
  existingItems.forEach((item) => {
    checkedMap.set(item.name.toLowerCase().trim(), item.checked);
  });

  const allRecipes = getAllRecipes();
  const recipeMap = new Map<string, RecipeItem>();
  allRecipes.forEach((r) => recipeMap.set(r.name.trim(), r));

  // 食材名 -> { category, totalAmount, unit, daySources }
  interface AggregatedIng {
    category: IngredientCategory;
    amount?: number;
    unit?: string;
  }

  const ingMap = new Map<string, AggregatedIng>();

  const dayOrder: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  dayOrder.forEach((dayKey) => {
    const day = plan[dayKey];
    if (!day) return;

    // その日の人数（指定がなければ targetServings）
    const dayServings = day.servings || targetServings;

    // 料理リストから食材を集約
    const fallbackDishes: DishEntry[] = [
      day.mainDish ? { id: '1', name: day.mainDish, type: 'main' as const } : null,
      day.subDish ? { id: '2', name: day.subDish, type: 'sub' as const } : null,
      day.soupDish ? { id: '3', name: day.soupDish, type: 'soup' as const } : null,
      day.dessertDish ? { id: '4', name: day.dessertDish, type: 'dessert' as const } : null,
    ].filter(Boolean) as DishEntry[];

    const dishes: DishEntry[] = day.dishes !== undefined ? day.dishes : fallbackDishes;

    dishes.forEach((dish) => {
      if (!dish.name) return;
      // レシピDBから最新の分量付き食材を優先取得、なければdishに付随している食材を使う
      const matchedRecipe = recipeMap.get(dish.name.trim());
      const ingredients: IngredientItem[] = (
        matchedRecipe?.ingredients ||
        dish.ingredients ||
        []
      ).flatMap(splitCompoundIngredient);

      ingredients.forEach((ing) => {
        const name = ing.name.trim();
        if (!name) return;

        const baseServings = ing.servings || 2;
        // 人数倍率で数量を計算
        const scaled = ing.amount !== undefined ? (ing.amount * dayServings) / baseServings : undefined;

        if (ingMap.has(name)) {
          const current = ingMap.get(name)!;
          // 単位が同じなら合算、片方だけ分量がある場合は分量ありを優先
          if (scaled !== undefined && current.amount !== undefined && current.unit === ing.unit) {
            current.amount = Math.round((current.amount + scaled) * 10) / 10;
          } else if (scaled !== undefined && current.amount === undefined) {
            current.amount = Math.round(scaled * 10) / 10;
            current.unit = ing.unit;
          }
        } else {
          ingMap.set(name, {
            category: ing.category || guessCategory(name),
            amount: scaled !== undefined ? Math.round(scaled * 10) / 10 : undefined,
            unit: ing.unit,
          });
        }
      });
    });

    // dishesが未定義の旧データの場合のみday.ingredientsを取り込む
    if (day.dishes === undefined) {
      day.ingredients.flatMap(splitCompoundIngredient).forEach((ing) => {
        const name = ing.name.trim();
        if (!name) return;
        if (!ingMap.has(name)) {
          ingMap.set(name, {
            category: ing.category || guessCategory(name),
            amount: ing.amount,
            unit: ing.unit,
          });
        }
      });
    }
  });

  const result: ShoppingItem[] = [];

  ingMap.forEach((info, name) => {
    result.push({
      id: 'shop_' + Math.random().toString(36).substring(2, 9),
      name,
      category: info.category,
      amount: info.amount,
      unit: info.unit,
      checked: checkedMap.get(name.toLowerCase().trim()) || false,
    });
  });

  // ユーザーが手動追加した買い物アイテム（献立外の食材・日用品など）を維持
  // ※ 以前に自動生成された項目（shop_〜）は再計算結果で置き換える
  existingItems.forEach((oldItem) => {
    if (oldItem.id.startsWith('custom_shop_') && !ingMap.has(oldItem.name.trim())) {
      result.push({
        ...oldItem,
        daySources: undefined,
      });
    }
  });

  return result;
};

// --------------------------------------------------------------------------
// おまかせランダム自動生成
// --------------------------------------------------------------------------
export const generateSmartWeekPlan = (targetServings: number = 2): Record<DayId, DayMenu> => {
  const allRecipes = getAllRecipes();
  const mains = allRecipes.filter((r) => r.type === 'main');
  const subs = allRecipes.filter((r) => r.type === 'sub');
  const soups = allRecipes.filter((r) => r.type === 'soup');
  const desserts = allRecipes.filter((r) => r.type === 'dessert');

  const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const getByGenre = (arr: typeof mains, genre: string) => {
    const filtered = arr.filter((x) => x.genre === genre);
    return filtered.length > 0 ? getRandom(filtered) : getRandom(arr);
  };

  const dayConfigs: { id: DayId; label: string; shortLabel: string; theme: string; genre: string }[] = [
    { id: 'mon', label: '月曜日', shortLabel: '月', theme: '🐟 爽やかにお魚スタート', genre: 'healthy' },
    { id: 'tue', label: '火曜日', shortLabel: '火', theme: '🥩 スタミナ肉料理', genre: 'japanese' },
    { id: 'wed', label: '水曜日', shortLabel: '水', theme: '⚡ 週の折り返し時短中華', genre: 'chinese' },
    { id: 'thu', label: '木曜日', shortLabel: '木', theme: '🍗 ヘルシー鶏肉料理', genre: 'healthy' },
    { id: 'fri', label: '金曜日', shortLabel: '金', theme: '🍛 花金の満腹メニュー', genre: 'quick' },
    { id: 'sat', label: '土曜日', shortLabel: '土', theme: '🎉 週末のごちそう洋食', genre: 'western' },
    { id: 'sun', label: '日曜日', shortLabel: '日', theme: '🌿 ほっこり癒やしの和食', genre: 'japanese' },
  ];

  const newPlan: Partial<Record<DayId, DayMenu>> = {};

  dayConfigs.forEach((cfg, idx) => {
    const main = getByGenre(mains, cfg.genre);
    const sub = getRandom(subs);
    const soup = getRandom(soups);
    const hasDessert = idx === 0 || idx === 2 || idx === 4 || idx === 5 || idx === 6;
    const dessert = hasDessert && desserts.length > 0 ? getRandom(desserts) : null;

    const dishes: DishEntry[] = [
      {
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: main.name,
        type: 'main',
        ingredients: main.ingredients,
        servings: 2,
      },
      {
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: sub.name,
        type: 'sub',
        ingredients: sub.ingredients,
        servings: 2,
      },
      {
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: soup.name,
        type: 'soup',
        ingredients: soup.ingredients,
        servings: 2,
      },
    ];

    if (dessert) {
      dishes.push({
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: dessert.name,
        type: 'dessert',
        ingredients: dessert.ingredients,
        servings: 2,
      });
    }

    const mergedIngredients = [
      ...main.ingredients,
      ...sub.ingredients,
      ...soup.ingredients.filter((i) => i.name !== '味噌・和風だし'),
      ...(dessert ? dessert.ingredients : []),
    ];

    const uniqueIngredients = mergedIngredients.filter(
      (item, index, self) => index === self.findIndex((t) => t.name === item.name)
    );

    newPlan[cfg.id] = ensureDayDishes({
      dayId: cfg.id,
      dayLabel: cfg.label,
      shortLabel: cfg.shortLabel,
      theme: cfg.theme,
      mainDish: main.name,
      subDish: sub.name,
      soupDish: soup.name,
      dessertDish: dessert ? dessert.name : '',
      dishes,
      ingredients: uniqueIngredients,
      servings: targetServings,
      memo: main.tip || '',
    });
  });

  return newPlan as Record<DayId, DayMenu>;
};

// --------------------------------------------------------------------------
// 統計データ算出
// --------------------------------------------------------------------------
export interface MenuStats {
  totalDishes: number;
  dishFrequency: { name: string; count: number; type: string }[];
  categoryCounts: { main: number; sub: number; soup: number; dessert: number };
  categoryPercentages: { main: number; sub: number; soup: number; dessert: number };
  meatVsFishVsVeg: { meat: number; fish: number; veg: number; other: number };
  dayDishCounts: Record<DayId, { dayLabel: string; count: number; main: string }>;
}

export const calculateMenuStats = (currentPlan: Record<DayId, DayMenu>): MenuStats => {
  const freqMap = new Map<string, { count: number; type: string }>();
  let mainCount = 0;
  let subCount = 0;
  let soupCount = 0;
  let dessertCount = 0;

  let meatCount = 0;
  let fishCount = 0;
  let vegCount = 0;
  let otherCount = 0;

  const dayDishCounts: Partial<Record<DayId, { dayLabel: string; count: number; main: string }>> = {};

  const days: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  days.forEach((d) => {
    const day = currentPlan[d];
    if (!day) return;

    let dayDishes = 0;

    const registerDish = (name: string, type: 'main' | 'sub' | 'soup' | 'dessert') => {
      const trimmed = name.trim();
      if (!trimmed) return;
      dayDishes++;

      if (type === 'main') mainCount++;
      if (type === 'sub') subCount++;
      if (type === 'soup') soupCount++;
      if (type === 'dessert') dessertCount++;

      const existing = freqMap.get(trimmed);
      if (existing) {
        existing.count++;
      } else {
        freqMap.set(trimmed, { count: 1, type });
      }

      if (
        trimmed.includes('豚') ||
        trimmed.includes('鶏') ||
        trimmed.includes('牛') ||
        trimmed.includes('肉') ||
        trimmed.includes('ハンバーグ') ||
        trimmed.includes('餃子') ||
        trimmed.includes('唐揚げ') ||
        trimmed.includes('チキン')
      ) {
        meatCount++;
      } else if (
        trimmed.includes('魚') ||
        trimmed.includes('鮭') ||
        trimmed.includes('さば') ||
        trimmed.includes('鯖') ||
        trimmed.includes('ぶり') ||
        trimmed.includes('アジ') ||
        trimmed.includes('エビ') ||
        trimmed.includes('あさり')
      ) {
        fishCount++;
      } else if (
        trimmed.includes('野菜') ||
        trimmed.includes('豆腐') ||
        trimmed.includes('サラダ') ||
        trimmed.includes('ナムル') ||
        trimmed.includes('ほうれん草') ||
        trimmed.includes('ピーマン') ||
        trimmed.includes('大根')
      ) {
        vegCount++;
      } else {
        otherCount++;
      }
    };

    if (day.dishes && day.dishes.length > 0) {
      day.dishes.forEach((dish) => {
        const t = dish.type === 'other' ? 'sub' : (dish.type as 'main' | 'sub' | 'soup' | 'dessert');
        registerDish(dish.name, t);
      });
    } else {
      registerDish(day.mainDish, 'main');
      registerDish(day.subDish, 'sub');
      registerDish(day.soupDish, 'soup');
      registerDish(day.dessertDish, 'dessert');
    }

    dayDishCounts[d] = {
      dayLabel: day.dayLabel,
      count: dayDishes,
      main: day.mainDish || '未設定',
    };
  });

  const totalDishes = mainCount + subCount + soupCount + dessertCount;

  const dishFrequency = Array.from(freqMap.entries())
    .map(([name, val]) => ({ name, count: val.count, type: val.type }))
    .sort((a, b) => b.count - a.count);

  const getPercent = (c: number) => (totalDishes > 0 ? Math.round((c / totalDishes) * 100) : 0);

  return {
    totalDishes,
    dishFrequency,
    categoryCounts: {
      main: mainCount,
      sub: subCount,
      soup: soupCount,
      dessert: dessertCount,
    },
    categoryPercentages: {
      main: getPercent(mainCount),
      sub: getPercent(subCount),
      soup: getPercent(soupCount),
      dessert: getPercent(dessertCount),
    },
    meatVsFishVsVeg: {
      meat: meatCount,
      fish: fishCount,
      veg: vegCount,
      other: otherCount,
    },
    dayDishCounts: dayDishCounts as Record<DayId, { dayLabel: string; count: number; main: string }>,
  };
};

// --------------------------------------------------------------------------
// データのエクスポート・インポート・ダウンロード機能（バックアップ保存）
// --------------------------------------------------------------------------
export interface BackupData {
  version: number;
  exportedAt: string;
  data: {
    weekPlan?: Record<DayId, DayMenu>;
    shoppingList?: ShoppingItem[];
    customRecipes?: RecipeItem[];
    favorites?: SavedTemplate[];
    settings?: AppSettings;
    calendarRecords?: Record<string, CalendarRecord>;
  };
}

// 全データをJSON文字列としてエクスポート
export const exportAllData = (): string => {
  const backup: BackupData = {
    version: 3,
    exportedAt: new Date().toISOString(),
    data: {
      weekPlan: loadWeekPlan(),
      shoppingList: loadShoppingItems(),
      customRecipes: loadCustomRecipes(),
      favorites: loadSavedTemplates(),
      settings: loadAppSettings(),
      calendarRecords: loadCalendarRecords(),
    },
  };
  return JSON.stringify(backup, null, 2);
};

// ファイルとしてダウンロード保存する機能
export const downloadBackupFile = (): void => {
  const jsonStr = exportAllData();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `kondate_backup_${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// JSON文字列から全データをインポートしてLocalStorageに保存
export const importAllData = (jsonStr: string): { success: boolean; error?: string } => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: '有効なJSONファイルではありません' };
    }

    let weekPlan: any = null;
    let shoppingList: any = null;
    let customRecipes: any = null;
    let favorites: any = null;
    let settings: any = null;
    let calendarRecords: any = null;

    if (parsed.data) {
      weekPlan = parsed.data.weekPlan;
      shoppingList = parsed.data.shoppingList;
      customRecipes = parsed.data.customRecipes;
      favorites = parsed.data.favorites;
      settings = parsed.data.settings;
      calendarRecords = parsed.data.calendarRecords;
    } else {
      weekPlan = typeof parsed.weekPlan === 'string' ? JSON.parse(parsed.weekPlan) : parsed.weekPlan;
      shoppingList = typeof parsed.shoppingList === 'string' ? JSON.parse(parsed.shoppingList) : parsed.shoppingList;
      customRecipes = typeof parsed.customRecipes === 'string' ? JSON.parse(parsed.customRecipes) : parsed.customRecipes;
      favorites = typeof parsed.favorites === 'string' ? JSON.parse(parsed.favorites) : parsed.favorites;
      settings = typeof parsed.settings === 'string' ? JSON.parse(parsed.settings) : parsed.settings;
      calendarRecords = typeof parsed.calendarRecords === 'string' ? JSON.parse(parsed.calendarRecords) : parsed.calendarRecords;
    }

    if (weekPlan) localStorage.setItem(STORAGE_KEYS.WEEK_PLAN, JSON.stringify(weekPlan));
    if (shoppingList) localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(shoppingList));
    if (customRecipes) localStorage.setItem(STORAGE_KEYS.CUSTOM_RECIPES, JSON.stringify(customRecipes));
    if (favorites) localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    if (settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (calendarRecords) localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendarRecords));

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'データの復元に失敗しました' };
  }
};

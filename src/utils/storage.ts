import type {
  DayId,
  DayMenu,
  ShoppingItem,
  SavedTemplate,
  RecipeItem,
  AppSettings,
  IngredientCategory,
} from '../types';
import { DEFAULT_WEEK_DAYS, PRESET_RECIPES, PRESET_TEMPLATES, guessCategory } from '../data/presetRecipes';

const STORAGE_KEYS = {
  WEEK_PLAN: 'kondate_weekly_plan_v2',
  SHOPPING_LIST: 'kondate_shopping_list_v2',
  FAVORITES: 'kondate_saved_templates_v2',
  CUSTOM_RECIPES: 'kondate_custom_recipes_v2',
  SETTINGS: 'kondate_app_settings_v2',
  HISTORY: 'kondate_plan_history_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontSize: 'md',
  notifyEnabled: false,
  notifyTime: '17:30',
  weekStart: 'mon',
};

// 献立の読み込み
export const loadWeekPlan = (): Record<DayId, DayMenu> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WEEK_PLAN);
    if (data) {
      const parsed = JSON.parse(data);
      // dessertDishプロパティが欠落している旧データへのフォールバック対応
      (Object.keys(parsed) as DayId[]).forEach((d) => {
        if (!parsed[d].dessertDish) parsed[d].dessertDish = '';
      });
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load week plan:', e);
  }
  return DEFAULT_WEEK_DAYS;
};

// 献立の保存
export const saveWeekPlan = (plan: Record<DayId, DayMenu>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.WEEK_PLAN, JSON.stringify(plan));
    // 履歴にも保存（統計分析用）
    recordPlanHistory(plan);
  } catch (e) {
    console.error('Failed to save week plan:', e);
  }
};

// 履歴の記録
const recordPlanHistory = (plan: Record<DayId, DayMenu>): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const history: Record<DayId, DayMenu>[] = raw ? JSON.parse(raw) : [];
    // 直近4回分を保持
    history.unshift(plan);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 4)));
  } catch (e) {
    // ignore
  }
};

// 買い物リストの読み込み
export const loadShoppingItems = (): ShoppingItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load shopping list:', e);
  }
  return generateShoppingListFromPlan(DEFAULT_WEEK_DAYS);
};

// 買い物リストの保存
export const saveShoppingItems = (items: ShoppingItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save shopping list:', e);
  }
};

// ユーザー登録カスタムメニューの読み込み
export const loadCustomRecipes = (): RecipeItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_RECIPES);
    if (data) {
      return JSON.parse(data);
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

  // 文字サイズのCSSスケール
  const fontSizes = {
    sm: '14px',
    md: '16px',
    lg: '18px',
  };
  document.documentElement.style.fontSize = fontSizes[settings.fontSize] || '16px';
};

// 献立から買い物リストを抽出生成（曜日は入れずに食材を分類してシンプルにまとめる）
export const generateShoppingListFromPlan = (
  plan: Record<DayId, DayMenu>,
  existingItems: ShoppingItem[] = []
): ShoppingItem[] => {
  const itemMap = new Map<string, IngredientCategory>();

  // 既存のチェック状態を記憶
  const checkedMap = new Map<string, boolean>();
  existingItems.forEach((item) => {
    checkedMap.set(item.name.toLowerCase().trim(), item.checked);
  });

  const dayOrder: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // 各曜日の献立から食材を抽出して重複を自動統合
  dayOrder.forEach((dayKey) => {
    const day = plan[dayKey];
    if (!day) return;

    day.ingredients.forEach((ing) => {
      const name = ing.name.trim();
      if (!name) return;
      if (!itemMap.has(name)) {
        itemMap.set(name, ing.category || guessCategory(name));
      }
    });
  });

  const result: ShoppingItem[] = [];
  itemMap.forEach((category, name) => {
    result.push({
      id: 'shop_' + Math.random().toString(36).substring(2, 9),
      name,
      category,
      checked: checkedMap.get(name.toLowerCase().trim()) || false,
    });
  });

  // ユーザーが手動追加した買い物アイテム（献立外のもの）も維持
  existingItems.forEach((oldItem) => {
    if (!itemMap.has(oldItem.name.trim())) {
      result.push({
        ...oldItem,
        daySources: undefined, // 曜日は完全に除去
      });
    }
  });

  return result;
};

// おまかせランダム自動生成（デザート枠含む）
export const generateSmartWeekPlan = (): Record<DayId, DayMenu> => {
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
    // デザートは週末や折り返し（水・金・土・日）に高頻度で登場
    const hasDessert = idx === 0 || idx === 2 || idx === 4 || idx === 5 || idx === 6;
    const dessert = hasDessert && desserts.length > 0 ? getRandom(desserts) : null;

    const mergedIngredients = [
      ...main.ingredients,
      ...sub.ingredients,
      ...soup.ingredients.filter((i) => i.name !== '味噌・和風だし'),
      ...(dessert ? dessert.ingredients : []),
    ];

    const uniqueIngredients = mergedIngredients.filter(
      (item, index, self) => index === self.findIndex((t) => t.name === item.name)
    );

    newPlan[cfg.id] = {
      dayId: cfg.id,
      dayLabel: cfg.label,
      shortLabel: cfg.shortLabel,
      theme: cfg.theme,
      mainDish: main.name,
      subDish: sub.name,
      soupDish: soup.name,
      dessertDish: dessert ? dessert.name : '',
      ingredients: uniqueIngredients,
      memo: main.tip || '',
    };
  });

  return newPlan as Record<DayId, DayMenu>;
};

// --------------------------------------------------------------------------
// 統計データ算出ロジック（データ画面用）
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

      // 肉・魚・野菜の傾向分析
      if (trimmed.includes('豚') || trimmed.includes('鶏') || trimmed.includes('牛') || trimmed.includes('肉') || trimmed.includes('ハンバーグ') || trimmed.includes('餃子') || trimmed.includes('唐揚げ') || trimmed.includes('チキン')) {
        meatCount++;
      } else if (trimmed.includes('魚') || trimmed.includes('鮭') || trimmed.includes('さば') || trimmed.includes('鯖') || trimmed.includes('ぶり') || trimmed.includes('アジ') || trimmed.includes('エビ') || trimmed.includes('あさり')) {
        fishCount++;
      } else if (trimmed.includes('野菜') || trimmed.includes('豆腐') || trimmed.includes('サラダ') || trimmed.includes('ナムル') || trimmed.includes('ほうれん草') || trimmed.includes('ピーマン') || trimmed.includes('大根')) {
        vegCount++;
      } else {
        otherCount++;
      }
    };

    registerDish(day.mainDish, 'main');
    registerDish(day.subDish, 'sub');
    registerDish(day.soupDish, 'soup');
    registerDish(day.dessertDish, 'dessert');

    dayDishCounts[d] = {
      dayLabel: day.dayLabel,
      count: dayDishes,
      main: day.mainDish || '未設定',
    };
  });

  const totalDishes = mainCount + subCount + soupCount + dessertCount;

  // 頻度順ソート（上位）
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
// データのエクスポート・インポート機能（バックアップとアカウント間移行用）
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
  };
}

// 全データをJSON文字列としてエクスポート
export const exportAllData = (): string => {
  const backup: BackupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      weekPlan: loadWeekPlan(),
      shoppingList: loadShoppingItems(),
      customRecipes: loadCustomRecipes(),
      favorites: loadSavedTemplates(),
      settings: loadAppSettings(),
    },
  };
  return JSON.stringify(backup, null, 2);
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

    if (parsed.data) {
      weekPlan = parsed.data.weekPlan;
      shoppingList = parsed.data.shoppingList;
      customRecipes = parsed.data.customRecipes;
      favorites = parsed.data.favorites;
      settings = parsed.data.settings;
    } else {
      weekPlan = typeof parsed.weekPlan === 'string' ? JSON.parse(parsed.weekPlan) : parsed.weekPlan;
      shoppingList = typeof parsed.shoppingList === 'string' ? JSON.parse(parsed.shoppingList) : parsed.shoppingList;
      customRecipes = typeof parsed.customRecipes === 'string' ? JSON.parse(parsed.customRecipes) : parsed.customRecipes;
      favorites = typeof parsed.favorites === 'string' ? JSON.parse(parsed.favorites) : parsed.favorites;
      settings = typeof parsed.settings === 'string' ? JSON.parse(parsed.settings) : parsed.settings;
    }

    if (weekPlan) localStorage.setItem(STORAGE_KEYS.WEEK_PLAN, JSON.stringify(weekPlan));
    if (shoppingList) localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(shoppingList));
    if (customRecipes) localStorage.setItem(STORAGE_KEYS.CUSTOM_RECIPES, JSON.stringify(customRecipes));
    if (favorites) localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    if (settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'データの復元に失敗しました' };
  }
};


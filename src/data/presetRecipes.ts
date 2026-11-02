import type { RecipeItem, IngredientCategory, SavedTemplate, DayId, DayMenu, DishCategory, IngredientItem } from '../types';
import { PRESET_RECIPE_STEPS } from './recipeSteps';

export const CATEGORY_NAMES: Record<IngredientCategory, { label: string; icon: string }> = {
  meat_fish: { label: 'お肉・お魚', icon: '🥩' },
  vegetable: { label: '野菜・きのこ', icon: '🥬' },
  dairy_egg: { label: '卵・乳製品・大豆', icon: '🥚' },
  seasoning: { label: '調味料・タレ', icon: '🧂' },
  staple: { label: '麺・ごはん・パン', icon: '🍚' },
  other: { label: '加工品・その他', icon: '🛒' },
};

export const DISH_TYPE_INFO: Record<DishCategory, { label: string; icon: string; color: string }> = {
  main: { label: '主菜', icon: '🥩', color: '#ff6b35' },
  sub: { label: '副菜', icon: '🥗', color: '#10b981' },
  soup: { label: '汁物', icon: '🍲', color: '#3b82f6' },
  dessert: { label: 'デザート', icon: '🍮', color: '#ec4899' },
  other: { label: '追加の一品', icon: '🍽️', color: '#8b5cf6' },
};

export const GENRE_LABELS: Record<RecipeItem['genre'], string> = {
  japanese: '和食',
  western: '洋食',
  chinese: '中華',
  quick: '時短',
  healthy: 'ヘルシー',
  sweet: 'スイーツ',
};

// 食材の分量を指定人数に合わせてフォーマットする関数
export const formatIngredientWithAmount = (
  ing: IngredientItem,
  targetServings: number = 2
): string => {
  if (ing.amount === undefined || !ing.unit) {
    return ing.name;
  }
  const baseServings = ing.servings || 2;
  const scaled = (ing.amount * targetServings) / baseServings;
  const rounded = Math.round(scaled * 10) / 10;
  return `${ing.name} ${rounded}${ing.unit}`;
};

// 食材名からカテゴリを推測するヘルパー
const hasAny = (n: string, words: string[]) => words.some((w) => n.includes(w));

export const guessCategory = (name: string): IngredientCategory => {
  const n = name.toLowerCase();
  // 「牛乳」「鶏ガラスープの素」「ツナ缶以外の缶詰」など、誤判定しやすいものを先に判定
  if (hasAny(n, ['牛乳', 'バター', 'チーズ', 'ヨーグルト', '生クリーム', 'アイス'])) {
    return 'dairy_egg';
  }
  if (hasAny(n, ['鶏ガラ', 'コンソメ', 'だし', '醤', 'きな粉', '杏仁霜', 'ゼラチン', 'はちみつ', '黒蜜'])) {
    return 'seasoning';
  }
  if (hasAny(n, ['肉', '鶏', '豚', '牛', '挽肉', 'ミンチ', '魚', '鮭', '鯖', 'さば', 'ぶり', 'エビ', 'えび', 'イカ', 'ツナ', 'タラ', 'アジ', 'ハム', 'ベーコン', 'ソーセージ', 'しらす', 'あさり'])) {
    return 'meat_fish';
  }
  if (hasAny(n, ['卵', 'たまご', '豆腐', '納豆', '油揚げ', '厚揚げ', '豆乳'])) {
    return 'dairy_egg';
  }
  if (hasAny(n, ['醤油', 'みりん', '酒', '砂糖', '塩', '味噌', 'みそ', 'マヨネーズ', 'ケチャップ', 'ポン酢', 'ごま', '油', 'ソース', 'カレー', '胡椒', 'こしょう', '酢', 'めんつゆ'])) {
    return 'seasoning';
  }
  if (hasAny(n, ['米', 'ご飯', 'ごはん', 'パスタ', 'うどん', 'そば', 'パン', '麺', '春雨', '餃子の皮', '粉', 'グラノーラ'])) {
    return 'staple';
  }
  if (hasAny(n, ['チョコ', 'あんこ', 'あずき', 'こんにゃく', 'ちくわ', 'わかめ', 'クコ', 'コーンクリーム缶', 'ラップ', 'ホイル'])) {
    return 'other';
  }
  // 果物も「野菜・果物」としてまとめる
  return 'vegetable';
};

// 「鶏もも肉 200g」「玉ねぎ 0.5個」「大根 1/2本」のような文字列から品名・数量・単位を分解する
export const parseIngredientText = (raw: string): IngredientItem => {
  const trimmed = raw.trim();
  // 分数表記（例: 1/2個, 1/4本）
  const fracMatch = trimmed.match(/^(.+?)\s+(\d+)\/(\d+)\s*([^\d\s]+)$/);
  if (fracMatch) {
    const name = fracMatch[1].trim();
    const num = parseFloat(fracMatch[2]);
    const den = parseFloat(fracMatch[3]);
    const unit = fracMatch[4].trim();
    if (den > 0) {
      return {
        name,
        category: guessCategory(name),
        amount: Math.round((num / den) * 10) / 10,
        unit,
        servings: 2,
      };
    }
  }
  // 小数・整数表記（例: 豚肉 200g, 卵 2個）
  const numMatch = trimmed.match(/^(.+?)\s+([\d.]+)\s*([^\d\s]+)$/);
  if (numMatch) {
    const name = numMatch[1].trim();
    const amount = parseFloat(numMatch[2]);
    const unit = numMatch[3].trim();
    if (!Number.isNaN(amount)) {
      return {
        name,
        category: guessCategory(name),
        amount,
        unit,
        servings: 2,
      };
    }
  }
  return {
    name: trimmed,
    category: guessCategory(trimmed),
  };
};

// プリセット料理データ（分量はすべて2人分基準）
export const PRESET_RECIPES: RecipeItem[] = [
  // --- 主菜 (Main) ---
  {
    id: 'm1',
    name: '豚の生姜焼き',
    type: 'main',
    genre: 'japanese',
    cookTimeMinutes: 15,
    tip: 'すりおろし生姜と醤油・みりん・酒で香ばしく！',
    ingredients: [
      { name: '豚ロース薄切り肉', category: 'meat_fish', amount: 250, unit: 'g', servings: 2 },
      { name: '玉ねぎ', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
      { name: '生姜', category: 'vegetable', amount: 1, unit: 'かけ', servings: 2 },
      { name: 'キャベツ', category: 'vegetable', amount: 0.2, unit: '玉', servings: 2 },
      { name: '醤油・みりん・酒', category: 'seasoning' },
    ],
  },
  {
    id: 'm2',
    name: '鶏のから揚げ',
    type: 'main',
    genre: 'japanese',
    cookTimeMinutes: 25,
    tip: '下味にしっかり漬け込んで二度揚げでサクサク！',
    ingredients: [
      { name: '鶏もも肉', category: 'meat_fish', amount: 300, unit: 'g', servings: 2 },
      { name: '醤油・酒・おろしにんにく', category: 'seasoning' },
      { name: '片栗粉', category: 'staple', amount: 3, unit: '大さじ', servings: 2 },
      { name: 'レモン', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
    ],
  },
  {
    id: 'm3',
    name: 'ジューシーハンバーグ',
    type: 'main',
    genre: 'western',
    cookTimeMinutes: 30,
    tip: '玉ねぎをしっかり炒めて甘みをプラス',
    ingredients: [
      { name: '合い挽き肉', category: 'meat_fish', amount: 300, unit: 'g', servings: 2 },
      { name: '玉ねぎ', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
      { name: '卵', category: 'dairy_egg', amount: 1, unit: '個', servings: 2 },
      { name: 'パン粉', category: 'staple', amount: 4, unit: '大さじ', servings: 2 },
      { name: '牛乳', category: 'dairy_egg', amount: 3, unit: '大さじ', servings: 2 },
    ],
  },
  {
    id: 'm4',
    name: '鮭のバターホイル焼き',
    type: 'main',
    genre: 'healthy',
    cookTimeMinutes: 20,
    tip: 'きのこたっぷりでヘルシー＆旨味凝縮',
    ingredients: [
      { name: '生鮭の切り身', category: 'meat_fish', amount: 2, unit: '切れ', servings: 2 },
      { name: 'しめじ', category: 'vegetable', amount: 0.5, unit: 'パック', servings: 2 },
      { name: 'えのき', category: 'vegetable', amount: 0.5, unit: '袋', servings: 2 },
      { name: '玉ねぎ', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
      { name: 'バター', category: 'dairy_egg', amount: 20, unit: 'g', servings: 2 },
      { name: '醤油', category: 'seasoning' },
    ],
  },
  {
    id: 'm5',
    name: '具だくさんお家カレー',
    type: 'main',
    genre: 'quick',
    cookTimeMinutes: 35,
    tip: '一晩寝かせるとさらにコク深く美味しい！',
    ingredients: [
      { name: '牛肉 または 豚肉', category: 'meat_fish', amount: 200, unit: 'g', servings: 2 },
      { name: '玉ねぎ', category: 'vegetable', amount: 1, unit: '個', servings: 2 },
      { name: 'じゃがいも', category: 'vegetable', amount: 1, unit: '個', servings: 2 },
      { name: '人参', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: 'カレールー', category: 'seasoning', amount: 0.5, unit: '箱', servings: 2 },
    ],
  },
  {
    id: 'm6',
    name: 'さばの味噌煮',
    type: 'main',
    genre: 'japanese',
    cookTimeMinutes: 20,
    tip: '生姜を入れて臭みを消してコトコト煮る',
    ingredients: [
      { name: '鯖の切り身', category: 'meat_fish', amount: 2, unit: '切れ', servings: 2 },
      { name: '生姜', category: 'vegetable', amount: 1, unit: 'かけ', servings: 2 },
      { name: '白ねぎ', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: '味噌・みりん・酒・砂糖', category: 'seasoning' },
    ],
  },
  {
    id: 'm7',
    name: '本格！麻婆豆腐',
    type: 'main',
    genre: 'chinese',
    cookTimeMinutes: 15,
    tip: '花椒（ホアジャオ）と豆板醤でピリッと美味しく',
    ingredients: [
      { name: '木綿豆腐', category: 'dairy_egg', amount: 1, unit: '丁', servings: 2 },
      { name: '豚ひき肉', category: 'meat_fish', amount: 150, unit: 'g', servings: 2 },
      { name: '長ねぎ', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: '豆板醤・甜面醤', category: 'seasoning' },
    ],
  },
  {
    id: 'm8',
    name: 'ピーマンの肉詰め',
    type: 'main',
    genre: 'japanese',
    cookTimeMinutes: 25,
    tip: 'ピーマンの内側に片栗粉をはたくと剥がれない',
    ingredients: [
      { name: 'ピーマン', category: 'vegetable', amount: 4, unit: '個', servings: 2 },
      { name: '豚ひき肉', category: 'meat_fish', amount: 200, unit: 'g', servings: 2 },
      { name: '玉ねぎ', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
      { name: '卵', category: 'dairy_egg', amount: 1, unit: '個', servings: 2 },
    ],
  },
  {
    id: 'm9',
    name: 'チキン南蛮（タルタル添え）',
    type: 'main',
    genre: 'western',
    cookTimeMinutes: 25,
    tip: '甘酢タレと特製タルタルソースが絶品',
    ingredients: [
      { name: '鶏もも肉', category: 'meat_fish', amount: 300, unit: 'g', servings: 2 },
      { name: '卵', category: 'dairy_egg', amount: 2, unit: '個', servings: 2 },
      { name: 'マヨネーズ・ポン酢・砂糖', category: 'seasoning' },
      { name: 'パセリ', category: 'vegetable' },
    ],
  },
  {
    id: 'm10',
    name: '豚キムチ炒め',
    type: 'main',
    genre: 'quick',
    cookTimeMinutes: 10,
    tip: 'ごま油で香ばしく炒める時短スタミナ料理！',
    ingredients: [
      { name: '豚バラ肉', category: 'meat_fish', amount: 200, unit: 'g', servings: 2 },
      { name: '白菜キムチ', category: 'vegetable', amount: 150, unit: 'g', servings: 2 },
      { name: 'ニラ', category: 'vegetable', amount: 0.5, unit: '束', servings: 2 },
      { name: 'ごま油・醤油', category: 'seasoning' },
    ],
  },
  {
    id: 'm11',
    name: 'ぶりの照り焼き',
    type: 'main',
    genre: 'japanese',
    cookTimeMinutes: 15,
    tip: 'タレをとろみがつくまで煮詰めて絡める',
    ingredients: [
      { name: 'ぶりの切り身', category: 'meat_fish', amount: 2, unit: '切れ', servings: 2 },
      { name: '長ねぎ', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: '醤油・みりん・酒・砂糖', category: 'seasoning' },
    ],
  },
  {
    id: 'm12',
    name: 'トロトロ親子丼',
    type: 'main',
    genre: 'quick',
    cookTimeMinutes: 15,
    tip: '卵は2回に分けて入れると半熟とろとろに！',
    ingredients: [
      { name: '鶏もも肉', category: 'meat_fish', amount: 200, unit: 'g', servings: 2 },
      { name: '玉ねぎ', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
      { name: '卵', category: 'dairy_egg', amount: 3, unit: '個', servings: 2 },
      { name: '三つ葉', category: 'vegetable', amount: 0.5, unit: '束', servings: 2 },
      { name: 'ご飯', category: 'staple', amount: 2, unit: '膳', servings: 2 },
    ],
  },
  {
    id: 'm13',
    name: 'パリパリ羽根つき餃子',
    type: 'main',
    genre: 'chinese',
    cookTimeMinutes: 30,
    tip: '小麦粉水を流し入れてパリパリの羽根をつくる',
    ingredients: [
      { name: '豚ひき肉', category: 'meat_fish', amount: 200, unit: 'g', servings: 2 },
      { name: 'キャベツ', category: 'vegetable', amount: 0.2, unit: '玉', servings: 2 },
      { name: 'ニラ', category: 'vegetable', amount: 0.5, unit: '束', servings: 2 },
      { name: '餃子の皮', category: 'staple', amount: 1, unit: '袋', servings: 2 },
    ],
  },
  {
    id: 'm14',
    name: 'トマトの濃厚ミートソースパスタ',
    type: 'main',
    genre: 'western',
    cookTimeMinutes: 25,
    tip: 'じっくり煮込んだひき肉の旨み',
    ingredients: [
      { name: 'パスタ乾麺', category: 'staple', amount: 200, unit: 'g', servings: 2 },
      { name: '合い挽き肉', category: 'meat_fish', amount: 200, unit: 'g', servings: 2 },
      { name: 'カットトマト缶', category: 'vegetable', amount: 1, unit: '缶', servings: 2 },
      { name: '玉ねぎ', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
      { name: '人参', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: '粉チーズ', category: 'dairy_egg' },
    ],
  },

  // --- 副菜 (Sub) ---
  {
    id: 's1',
    name: 'ほうれん草の胡麻和え',
    type: 'sub',
    genre: 'japanese',
    cookTimeMinutes: 8,
    tip: 'すりごまの香りとほんのり甘い味付け',
    ingredients: [
      { name: 'ほうれん草', category: 'vegetable', amount: 1, unit: '束', servings: 2 },
      { name: 'すり白ごま・醤油・砂糖', category: 'seasoning' },
    ],
  },
  {
    id: 's2',
    name: '彩りポテトサラダ',
    type: 'sub',
    genre: 'western',
    cookTimeMinutes: 20,
    tip: 'じゃがいもが熱いうちに酢と塩コショウで下味',
    ingredients: [
      { name: 'じゃがいも', category: 'vegetable', amount: 2, unit: '個', servings: 2 },
      { name: 'きゅうり', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: '人参', category: 'vegetable', amount: 0.3, unit: '本', servings: 2 },
      { name: 'ハム', category: 'meat_fish', amount: 3, unit: '枚', servings: 2 },
      { name: 'マヨネーズ', category: 'seasoning' },
    ],
  },
  {
    id: 's3',
    name: 'やみつき無限ピーマン',
    type: 'sub',
    genre: 'quick',
    cookTimeMinutes: 5,
    tip: 'ツナとごま油でレンジ加熱するだけ！',
    ingredients: [
      { name: 'ピーマン', category: 'vegetable', amount: 4, unit: '個', servings: 2 },
      { name: 'ツナ缶', category: 'meat_fish', amount: 1, unit: '缶', servings: 2 },
      { name: '鶏ガラスープの素・ごま油', category: 'seasoning' },
    ],
  },
  {
    id: 's4',
    name: 'きんぴらごぼう',
    type: 'sub',
    genre: 'japanese',
    cookTimeMinutes: 15,
    tip: 'ごま油で炒めてピリッと一味唐辛子',
    ingredients: [
      { name: 'ごぼう', category: 'vegetable', amount: 1, unit: '本', servings: 2 },
      { name: '人参', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: '白ごま・醤油・みりん', category: 'seasoning' },
    ],
  },
  {
    id: 's5',
    name: 'トマトとモッツァレラのマリネ',
    type: 'sub',
    genre: 'western',
    cookTimeMinutes: 5,
    tip: 'オリーブオイルとバジルで爽やか',
    ingredients: [
      { name: 'トマト', category: 'vegetable', amount: 1, unit: '個', servings: 2 },
      { name: 'モッツァレラチーズ', category: 'dairy_egg', amount: 1, unit: '袋', servings: 2 },
      { name: 'オリーブ油・塩コショウ', category: 'seasoning' },
    ],
  },
  {
    id: 's6',
    name: 'ちくわときゅうりの塩昆布和え',
    type: 'sub',
    genre: 'quick',
    cookTimeMinutes: 3,
    tip: '切って和えるだけの超速副菜',
    ingredients: [
      { name: 'ちくわ', category: 'other', amount: 3, unit: '本', servings: 2 },
      { name: 'きゅうり', category: 'vegetable', amount: 1, unit: '本', servings: 2 },
      { name: '塩昆布・ごま油', category: 'seasoning' },
    ],
  },
  {
    id: 's7',
    name: 'もやしとニラのナムル',
    type: 'sub',
    genre: 'chinese',
    cookTimeMinutes: 5,
    tip: 'サッと茹でてごま油と塩でシンプルに',
    ingredients: [
      { name: 'もやし', category: 'vegetable', amount: 1, unit: '袋', servings: 2 },
      { name: 'ニラ', category: 'vegetable', amount: 0.5, unit: '束', servings: 2 },
      { name: 'ごま油・おろしにんにく', category: 'seasoning' },
    ],
  },
  {
    id: 's8',
    name: 'ふんわりだし巻き卵',
    type: 'sub',
    genre: 'japanese',
    cookTimeMinutes: 10,
    tip: 'お出汁をきかせて弱火でじっくり巻く',
    ingredients: [
      { name: '卵', category: 'dairy_egg', amount: 3, unit: '個', servings: 2 },
      { name: '大根', category: 'vegetable', amount: 0.1, unit: '本', servings: 2 },
      { name: '白だし・砂糖', category: 'seasoning' },
    ],
  },

  // --- 汁物 (Soup) ---
  {
    id: 'sp1',
    name: '豆腐とわかめとねぎの味噌汁',
    type: 'soup',
    genre: 'japanese',
    cookTimeMinutes: 8,
    tip: '日本の食卓の定番ほっとする味',
    ingredients: [
      { name: '絹ごし豆腐', category: 'dairy_egg', amount: 0.5, unit: '丁', servings: 2 },
      { name: '乾燥わかめ', category: 'other' },
      { name: '刻みねぎ', category: 'vegetable' },
      { name: '味噌・和風だし', category: 'seasoning' },
    ],
  },
  {
    id: 'sp2',
    name: '具だくさん豚汁',
    type: 'soup',
    genre: 'japanese',
    cookTimeMinutes: 25,
    tip: 'ごま油で豚肉と根菜を炒めてから煮るのがコツ',
    ingredients: [
      { name: '豚こま切れ肉', category: 'meat_fish', amount: 100, unit: 'g', servings: 2 },
      { name: '大根', category: 'vegetable', amount: 0.2, unit: '本', servings: 2 },
      { name: '人参', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: 'ごぼう', category: 'vegetable', amount: 0.5, unit: '本', servings: 2 },
      { name: 'こんにゃく', category: 'other', amount: 0.5, unit: '枚', servings: 2 },
      { name: '油揚げ', category: 'dairy_egg', amount: 1, unit: '枚', servings: 2 },
      { name: '味噌', category: 'seasoning' },
    ],
  },
  {
    id: 'sp3',
    name: 'ふんわり卵とわかめの中華スープ',
    type: 'soup',
    genre: 'chinese',
    cookTimeMinutes: 6,
    tip: '水溶き片栗粉でとろみをつけてから溶き卵を流す',
    ingredients: [
      { name: '卵', category: 'dairy_egg', amount: 1, unit: '個', servings: 2 },
      { name: '乾燥わかめ', category: 'other' },
      { name: '鶏ガラスープの素・ごま油', category: 'seasoning' },
    ],
  },
  {
    id: 'sp4',
    name: '彩り野菜のミネストローネ',
    type: 'soup',
    genre: 'western',
    cookTimeMinutes: 20,
    tip: '角切り野菜とトマトの優しい酸味',
    ingredients: [
      { name: 'カットトマト缶', category: 'vegetable', amount: 0.5, unit: '缶', servings: 2 },
      { name: '玉ねぎ', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
      { name: '人参', category: 'vegetable', amount: 0.3, unit: '本', servings: 2 },
      { name: 'キャベツ', category: 'vegetable', amount: 0.1, unit: '玉', servings: 2 },
      { name: 'ベーコン', category: 'meat_fish', amount: 2, unit: '枚', servings: 2 },
      { name: 'コンソメ', category: 'seasoning' },
    ],
  },
  {
    id: 'sp5',
    name: '濃厚コーンポタージュ',
    type: 'soup',
    genre: 'western',
    cookTimeMinutes: 10,
    tip: '牛乳とコーンクリーム缶で濃厚な甘み',
    ingredients: [
      { name: 'コーンクリーム缶', category: 'other', amount: 1, unit: '缶', servings: 2 },
      { name: '牛乳', category: 'dairy_egg', amount: 200, unit: 'ml', servings: 2 },
      { name: 'コンソメ・バター', category: 'seasoning' },
    ],
  },

  // --- デザート (Dessert) ---
  {
    id: 'd1',
    name: 'とろける濃厚焼きプリン',
    type: 'dessert',
    genre: 'sweet',
    cookTimeMinutes: 20,
    tip: 'ほろ苦いカラメルと卵のコクが引き立つ王道プリン',
    ingredients: [
      { name: '卵', category: 'dairy_egg', amount: 2, unit: '個', servings: 2 },
      { name: '牛乳', category: 'dairy_egg', amount: 200, unit: 'ml', servings: 2 },
      { name: '砂糖', category: 'seasoning' },
    ],
  },
  {
    id: 'd2',
    name: '季節のカットフルーツ盛り',
    type: 'dessert',
    genre: 'healthy',
    cookTimeMinutes: 5,
    tip: 'ビタミン補給にぴったり！りんご・キウイ・バナナなど',
    ingredients: [
      { name: 'りんご', category: 'vegetable', amount: 0.5, unit: '個', servings: 2 },
      { name: 'バナナ', category: 'vegetable', amount: 1, unit: '本', servings: 2 },
      { name: 'キウイ', category: 'vegetable', amount: 1, unit: '個', servings: 2 },
    ],
  },
  {
    id: 'd3',
    name: 'なめらか杏仁豆腐',
    type: 'dessert',
    genre: 'chinese',
    cookTimeMinutes: 10,
    tip: '中華の後味をさっぱり癒やす定番スイーツ',
    ingredients: [
      { name: '牛乳', category: 'dairy_egg', amount: 300, unit: 'ml', servings: 2 },
      { name: '杏仁霜 または ゼラチン', category: 'seasoning' },
      { name: 'クコの実', category: 'other' },
    ],
  },
  {
    id: 'd4',
    name: 'ベリーのグラノーラヨーグルト',
    type: 'dessert',
    genre: 'healthy',
    cookTimeMinutes: 3,
    tip: 'はちみつとベリーを添えて腸活デザート',
    ingredients: [
      { name: 'プレーンヨーグルト', category: 'dairy_egg', amount: 200, unit: 'g', servings: 2 },
      { name: 'グラノーラ', category: 'staple', amount: 60, unit: 'g', servings: 2 },
      { name: 'ミックスベリー', category: 'vegetable', amount: 50, unit: 'g', servings: 2 },
      { name: 'はちみつ', category: 'seasoning' },
    ],
  },
  {
    id: 'd5',
    name: '白玉ぜんざい',
    type: 'dessert',
    genre: 'japanese',
    cookTimeMinutes: 15,
    tip: 'もちもち白玉と上品な小豆の甘さ',
    ingredients: [
      { name: '白玉粉', category: 'staple', amount: 100, unit: 'g', servings: 2 },
      { name: 'ゆであずき缶', category: 'other', amount: 1, unit: '缶', servings: 2 },
    ],
  },
  {
    id: 'd6',
    name: '宇治抹茶アイス＆黒蜜',
    type: 'dessert',
    genre: 'japanese',
    cookTimeMinutes: 2,
    tip: '和食のあとに嬉しい贅沢デザート',
    ingredients: [
      { name: '抹茶アイス', category: 'dairy_egg', amount: 2, unit: '個', servings: 2 },
      { name: '黒蜜・きな粉', category: 'seasoning' },
    ],
  },
];

// 各プリセット料理に「作り方（レシピ）」を付与
PRESET_RECIPES.forEach((recipe) => {
  if (!recipe.steps && PRESET_RECIPE_STEPS[recipe.id]) {
    recipe.steps = PRESET_RECIPE_STEPS[recipe.id];
  }
});

// 指定した料理名リストから材料一覧を組み立てるヘルパー
const buildDayIngredients = (dishNames: string[]): IngredientItem[] => {
  const map = new Map<string, IngredientItem>();
  dishNames.forEach((name) => {
    const recipe = PRESET_RECIPES.find((r) => r.name === name);
    recipe?.ingredients.forEach((ing) => {
      if (ing.name === '味噌・和風だし') return;
      const existing = map.get(ing.name);
      if (existing && existing.amount !== undefined && ing.amount !== undefined && existing.unit === ing.unit) {
        existing.amount = Math.round((existing.amount + ing.amount) * 10) / 10;
      } else if (!existing) {
        map.set(ing.name, { ...ing });
      }
    });
  });
  return Array.from(map.values());
};

// 初期の一週間献立（デザート枠付き・レシピの材料と完全一致）
export const DEFAULT_WEEK_DAYS: Record<DayId, DayMenu> = {
  mon: {
    dayId: 'mon',
    dayLabel: '月曜日',
    shortLabel: '月',
    theme: '🐟 週始めのお魚バランス',
    mainDish: '鮭のバターホイル焼き',
    subDish: 'ほうれん草の胡麻和え',
    soupDish: '豆腐とわかめとねぎの味噌汁',
    dessertDish: '季節のカットフルーツ盛り',
    ingredients: buildDayIngredients([
      '鮭のバターホイル焼き',
      'ほうれん草の胡麻和え',
      '豆腐とわかめとねぎの味噌汁',
      '季節のカットフルーツ盛り',
    ]),
    memo: '週のスタートはヘルシーなお魚＆果物で！',
  },
  tue: {
    dayId: 'tue',
    dayLabel: '火曜日',
    shortLabel: '火',
    theme: '🥩 豚肉でスタミナ補給',
    mainDish: '豚の生姜焼き',
    subDish: '彩りポテトサラダ',
    soupDish: '具だくさん豚汁',
    dessertDish: '',
    ingredients: buildDayIngredients(['豚の生姜焼き', '彩りポテトサラダ', '具だくさん豚汁']),
    memo: 'キャベツの千切りをたっぷり添える',
  },
  wed: {
    dayId: 'wed',
    dayLabel: '水曜日',
    shortLabel: '水',
    theme: '⚡ 週の折り返し時短中華',
    mainDish: '本格！麻婆豆腐',
    subDish: 'もやしとニラのナムル',
    soupDish: 'ふんわり卵とわかめの中華スープ',
    dessertDish: 'なめらか杏仁豆腐',
    ingredients: buildDayIngredients([
      '本格！麻婆豆腐',
      'もやしとニラのナムル',
      'ふんわり卵とわかめの中華スープ',
      'なめらか杏仁豆腐',
    ]),
    memo: 'ピリ辛中華の後はひんやり杏仁豆腐！',
  },
  thu: {
    dayId: 'thu',
    dayLabel: '木曜日',
    shortLabel: '木',
    theme: '🍗 鶏肉でヘルシー高タンパク',
    mainDish: 'チキン南蛮（タルタル添え）',
    subDish: 'やみつき無限ピーマン',
    soupDish: '豆腐とわかめとねぎの味噌汁',
    dessertDish: '',
    ingredients: buildDayIngredients([
      'チキン南蛮（タルタル添え）',
      'やみつき無限ピーマン',
      '豆腐とわかめとねぎの味噌汁',
    ]),
    memo: '特製タルタルソースをたっぷり',
  },
  fri: {
    dayId: 'fri',
    dayLabel: '金曜日',
    shortLabel: '金',
    theme: '🍛 花金カレー＆ワンプレート',
    mainDish: '具だくさんお家カレー',
    subDish: 'トマトとモッツァレラのマリネ',
    soupDish: '濃厚コーンポタージュ',
    dessertDish: 'ベリーのグラノーラヨーグルト',
    ingredients: buildDayIngredients([
      '具だくさんお家カレー',
      'トマトとモッツァレラのマリネ',
      '濃厚コーンポタージュ',
      'ベリーのグラノーラヨーグルト',
    ]),
    memo: '花金はお腹いっぱいカレー＆ヨーグルト',
  },
  sat: {
    dayId: 'sat',
    dayLabel: '土曜日',
    shortLabel: '土',
    theme: '🎉 週末のごちそう洋食',
    mainDish: 'ジューシーハンバーグ',
    subDish: '彩りポテトサラダ',
    soupDish: '彩り野菜のミネストローネ',
    dessertDish: 'とろける濃厚焼きプリン',
    ingredients: buildDayIngredients([
      'ジューシーハンバーグ',
      '彩りポテトサラダ',
      '彩り野菜のミネストローネ',
      'とろける濃厚焼きプリン',
    ]),
    memo: '手作り焼きプリンで特別な週末ディナー',
  },
  sun: {
    dayId: 'sun',
    dayLabel: '日曜日',
    shortLabel: '日',
    theme: '🌿 翌週に備えるほっこり和食',
    mainDish: 'さばの味噌煮',
    subDish: 'ふんわりだし巻き卵',
    soupDish: '具だくさん豚汁',
    dessertDish: '宇治抹茶アイス＆黒蜜',
    ingredients: buildDayIngredients([
      'さばの味噌煮',
      'ふんわりだし巻き卵',
      '具だくさん豚汁',
      '宇治抹茶アイス＆黒蜜',
    ]),
    memo: '和の甘味でゆったり癒やされる日曜の夜',
  },
};

export const PRESET_TEMPLATES: SavedTemplate[] = [
  {
    id: 'template_standard',
    title: '👑 黄金バランス定番セット',
    description: '魚・肉・野菜にデザートまで配分された王道の一週間',
    isPreset: true,
    createdAt: 1700000000000,
    days: DEFAULT_WEEK_DAYS,
  },
];

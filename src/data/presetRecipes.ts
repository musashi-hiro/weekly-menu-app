import type { RecipeItem, IngredientCategory, SavedTemplate, DayId, DayMenu } from '../types';

export const CATEGORY_NAMES: Record<IngredientCategory, { label: string; icon: string }> = {
  meat_fish: { label: 'お肉・お魚', icon: '🥩' },
  vegetable: { label: '野菜・きのこ', icon: '🥬' },
  dairy_egg: { label: '卵・乳製品・大豆', icon: '🥚' },
  seasoning: { label: '調味料・タレ', icon: '🧂' },
  staple: { label: '麺・ごはん・パン', icon: '🍚' },
  other: { label: '加工品・その他', icon: '🛒' },
};

export const DISH_TYPE_INFO = {
  main: { label: '主菜', icon: '🥩', color: '#ff6b35' },
  sub: { label: '副菜', icon: '🥗', color: '#10b981' },
  soup: { label: '汁物', icon: '🍲', color: '#3b82f6' },
  dessert: { label: 'デザート', icon: '🍮', color: '#ec4899' },
};

// 食材名からカテゴリを推測するヘルパー
export const guessCategory = (name: string): IngredientCategory => {
  const n = name.toLowerCase();
  if (n.includes('肉') || n.includes('鶏') || n.includes('豚') || n.includes('牛') || n.includes('挽肉') || n.includes('ミンチ') || n.includes('魚') || n.includes('鮭') || n.includes('鯖') || n.includes('さば') || n.includes('ぶり') || n.includes('エビ') || n.includes('イカ') || n.includes('ツナ') || n.includes('タラ') || n.includes('アジ') || n.includes('ハム') || n.includes('ベーコン')) {
    return 'meat_fish';
  }
  if (n.includes('卵') || n.includes('たまご') || n.includes('豆腐') || n.includes('納豆') || n.includes('牛乳') || n.includes('チーズ') || n.includes('ヨーグルト') || n.includes('油揚げ') || n.includes('厚揚げ')) {
    return 'dairy_egg';
  }
  if (n.includes('醤油') || n.includes('みりん') || n.includes('酒') || n.includes('砂糖') || n.includes('塩') || n.includes('味噌') || n.includes('みそ') || n.includes('マヨネーズ') || n.includes('ケチャップ') || n.includes('ポン酢') || n.includes('ごま油') || n.includes('油') || n.includes('ソース') || n.includes('だしの素') || n.includes('カレー') || n.includes('胡椒')) {
    return 'seasoning';
  }
  if (n.includes('米') || n.includes('パスタ') || n.includes('うどん') || n.includes('そば') || n.includes('パン') || n.includes('麺') || n.includes('春雨') || n.includes('餃子の皮')) {
    return 'staple';
  }
  if (n.includes('いちご') || n.includes('りんご') || n.includes('バナナ') || n.includes('フルーツ') || n.includes('みかん') || n.includes('チョコ') || n.includes('あんこ')) {
    return 'other';
  }
  return 'vegetable';
};

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
      { name: '豚ロース薄切り肉', category: 'meat_fish' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: '生姜', category: 'vegetable' },
      { name: 'キャベツ', category: 'vegetable' },
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
      { name: '鶏もも肉', category: 'meat_fish' },
      { name: '醤油・酒・にんにく', category: 'seasoning' },
      { name: '片栗粉', category: 'seasoning' },
      { name: 'レモン', category: 'vegetable' },
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
      { name: '合い挽き肉', category: 'meat_fish' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: '卵', category: 'dairy_egg' },
      { name: 'パン粉・牛乳', category: 'dairy_egg' },
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
      { name: '生鮭の切り身', category: 'meat_fish' },
      { name: 'しめじ・えのき', category: 'vegetable' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: 'バター・醤油', category: 'seasoning' },
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
      { name: '牛肉 または 豚肉', category: 'meat_fish' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: 'じゃがいも', category: 'vegetable' },
      { name: '人参', category: 'vegetable' },
      { name: 'カレールー', category: 'seasoning' },
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
      { name: '鯖の切り身', category: 'meat_fish' },
      { name: '生姜', category: 'vegetable' },
      { name: '味噌・みりん・酒', category: 'seasoning' },
      { name: '白ねぎ', category: 'vegetable' },
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
      { name: '木綿豆腐', category: 'dairy_egg' },
      { name: '豚ひき肉', category: 'meat_fish' },
      { name: '長ねぎ', category: 'vegetable' },
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
      { name: 'ピーマン', category: 'vegetable' },
      { name: '豚ひき肉', category: 'meat_fish' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: '卵', category: 'dairy_egg' },
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
      { name: '鶏むね肉 または 鶏もも肉', category: 'meat_fish' },
      { name: '卵・マヨネーズ', category: 'dairy_egg' },
      { name: 'ポン酢・砂糖', category: 'seasoning' },
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
      { name: '豚バラ肉', category: 'meat_fish' },
      { name: '白菜キムチ', category: 'vegetable' },
      { name: 'ニラ', category: 'vegetable' },
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
      { name: 'ぶりの切り身', category: 'meat_fish' },
      { name: '醤油・みりん・酒・砂糖', category: 'seasoning' },
      { name: 'ししとう または 長ねぎ', category: 'vegetable' },
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
      { name: '鶏もも肉', category: 'meat_fish' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: '卵', category: 'dairy_egg' },
      { name: '三つ葉', category: 'vegetable' },
      { name: 'ご飯', category: 'staple' },
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
      { name: '豚ひき肉', category: 'meat_fish' },
      { name: 'キャベツ・白菜', category: 'vegetable' },
      { name: 'ニラ・にんにく', category: 'vegetable' },
      { name: '餃子の皮', category: 'staple' },
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
      { name: 'パスタ乾麺', category: 'staple' },
      { name: '合い挽き肉', category: 'meat_fish' },
      { name: 'トマト缶', category: 'vegetable' },
      { name: '玉ねぎ・人参', category: 'vegetable' },
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
      { name: 'ほうれん草', category: 'vegetable' },
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
      { name: 'じゃがいも', category: 'vegetable' },
      { name: 'きゅうり・人参', category: 'vegetable' },
      { name: 'ハム', category: 'meat_fish' },
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
      { name: 'ピーマン', category: 'vegetable' },
      { name: 'ツナ缶', category: 'meat_fish' },
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
      { name: 'ごぼう', category: 'vegetable' },
      { name: '人参', category: 'vegetable' },
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
      { name: 'トマト または ミニトマト', category: 'vegetable' },
      { name: 'モッツァレラチーズ', category: 'dairy_egg' },
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
      { name: 'ちくわ', category: 'other' },
      { name: 'きゅうり', category: 'vegetable' },
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
      { name: 'もやし', category: 'vegetable' },
      { name: 'ニラ', category: 'vegetable' },
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
      { name: '卵', category: 'dairy_egg' },
      { name: '白だし・砂糖・水', category: 'seasoning' },
      { name: '大根（おろし用）', category: 'vegetable' },
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
      { name: '絹ごし豆腐', category: 'dairy_egg' },
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
      { name: '豚こま切れ肉', category: 'meat_fish' },
      { name: '大根・人参・ごぼう', category: 'vegetable' },
      { name: 'こんにゃく', category: 'other' },
      { name: '油揚げ・味噌', category: 'dairy_egg' },
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
      { name: '卵', category: 'dairy_egg' },
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
      { name: 'カットトマト缶', category: 'vegetable' },
      { name: '玉ねぎ・人参・キャベツ', category: 'vegetable' },
      { name: 'ベーコン', category: 'meat_fish' },
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
      { name: 'コーンクリーム缶', category: 'other' },
      { name: '牛乳', category: 'dairy_egg' },
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
      { name: '卵', category: 'dairy_egg' },
      { name: '牛乳', category: 'dairy_egg' },
      { name: '砂糖', category: 'seasoning' },
    ],
  },
  {
    id: 'd2',
    name: '季節のカットフルーツ盛り',
    type: 'dessert',
    genre: 'healthy',
    cookTimeMinutes: 5,
    tip: 'ビタミン補給にぴったり！りんご・キウイ・オレンジなど',
    ingredients: [
      { name: 'りんご・バナナ・キウイ', category: 'vegetable' },
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
      { name: '牛乳', category: 'dairy_egg' },
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
      { name: 'プレーンヨーグルト', category: 'dairy_egg' },
      { name: 'グラノーラ', category: 'staple' },
      { name: 'ミックスベリー・はちみつ', category: 'other' },
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
      { name: '白玉粉', category: 'staple' },
      { name: 'ゆであずき缶', category: 'other' },
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
      { name: '抹茶アイス', category: 'dairy_egg' },
      { name: '黒蜜・きな粉', category: 'seasoning' },
    ],
  },
];

// 初期の一週間献立（デザート枠付き）
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
    ingredients: [
      { name: '生鮭の切り身', category: 'meat_fish' },
      { name: 'しめじ・えのき', category: 'vegetable' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: 'ほうれん草', category: 'vegetable' },
      { name: '絹ごし豆腐', category: 'dairy_egg' },
      { name: '乾燥わかめ', category: 'other' },
      { name: 'フルーツ各種', category: 'vegetable' },
    ],
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
    ingredients: [
      { name: '豚ロース薄切り肉', category: 'meat_fish' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: 'キャベツ', category: 'vegetable' },
      { name: 'じゃがいも', category: 'vegetable' },
      { name: '大根・ごぼう', category: 'vegetable' },
    ],
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
    ingredients: [
      { name: '木綿豆腐', category: 'dairy_egg' },
      { name: '豚ひき肉', category: 'meat_fish' },
      { name: '長ねぎ', category: 'vegetable' },
      { name: 'もやし・ニラ', category: 'vegetable' },
      { name: '卵', category: 'dairy_egg' },
      { name: '牛乳', category: 'dairy_egg' },
    ],
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
    ingredients: [
      { name: '鶏もも肉', category: 'meat_fish' },
      { name: 'ピーマン', category: 'vegetable' },
      { name: 'ツナ缶', category: 'meat_fish' },
      { name: '豆腐', category: 'dairy_egg' },
    ],
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
    ingredients: [
      { name: '牛肉 または 豚肉', category: 'meat_fish' },
      { name: '玉ねぎ・人参・じゃがいも', category: 'vegetable' },
      { name: 'カレールー', category: 'seasoning' },
      { name: 'トマト', category: 'vegetable' },
      { name: 'ヨーグルト', category: 'dairy_egg' },
    ],
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
    ingredients: [
      { name: '合い挽き肉', category: 'meat_fish' },
      { name: '玉ねぎ', category: 'vegetable' },
      { name: '卵・牛乳', category: 'dairy_egg' },
      { name: 'カットトマト缶', category: 'vegetable' },
    ],
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
    ingredients: [
      { name: '鯖の切り身', category: 'meat_fish' },
      { name: '白ねぎ・生姜', category: 'vegetable' },
      { name: '卵', category: 'dairy_egg' },
      { name: '抹茶アイス', category: 'dairy_egg' },
    ],
    memo: '和の甘味でゆったり癒やされる日曜の夜',
  },
};

export const PRESET_TEMPLATES: SavedTemplate[] = [
  {
    id: 'template_standard',
    title: '👑 黄金バランス定番セット',
    description: '魚・肉・野菜にデザートまで配分された王道の一週間',
    isPreset: true,
    createdAt: Date.now(),
    days: DEFAULT_WEEK_DAYS,
  },
];

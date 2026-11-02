import type { ShoppingItem } from '../types';

// 買い物リストの表示・コピー用の分類（「肉」と「魚介」は分けて表示する）
export type ShoppingGroupKey =
  | 'meat'
  | 'fish'
  | 'vegetable'
  | 'dairy_egg'
  | 'staple'
  | 'seasoning'
  | 'other';

export const SHOPPING_GROUPS: { key: ShoppingGroupKey; label: string; icon: string }[] = [
  { key: 'meat', label: '肉', icon: '🥩' },
  { key: 'fish', label: '魚介', icon: '🐟' },
  { key: 'vegetable', label: '野菜・果物', icon: '🥬' },
  { key: 'dairy_egg', label: '卵・乳製品・豆腐', icon: '🥚' },
  { key: 'staple', label: '主食・粉類', icon: '🍚' },
  { key: 'seasoning', label: '調味料', icon: '🧂' },
  { key: 'other', label: 'その他', icon: '🛒' },
];

const FISH_WORDS = [
  '魚', '鮭', 'サーモン', '鯖', 'さば', 'サバ', 'ぶり', 'ブリ', 'エビ', 'えび', '海老',
  'イカ', 'いか', 'タコ', 'たこ', 'ツナ', 'タラ', '鱈', 'アジ', 'あじ', 'しらす',
  'ホタテ', 'あさり', 'しじみ', 'かつお', 'まぐろ', '刺身',
];

export const getShoppingGroup = (item: ShoppingItem): ShoppingGroupKey => {
  const cat = item.category || 'other';
  if (cat === 'meat_fish') {
    return FISH_WORDS.some((w) => item.name.includes(w)) ? 'fish' : 'meat';
  }
  if (cat === 'vegetable' || cat === 'dairy_egg' || cat === 'staple' || cat === 'seasoning') {
    return cat;
  }
  return 'other';
};

export const groupShoppingItems = (items: ShoppingItem[]) => {
  const map: Record<ShoppingGroupKey, ShoppingItem[]> = {
    meat: [],
    fish: [],
    vegetable: [],
    dairy_egg: [],
    staple: [],
    seasoning: [],
    other: [],
  };
  items.forEach((item) => map[getShoppingGroup(item)].push(item));
  return SHOPPING_GROUPS.map((g) => ({ ...g, items: map[g.key] })).filter((g) => g.items.length > 0);
};

export const formatShoppingAmount = (item: ShoppingItem): string =>
  item.amount !== undefined && item.unit ? `${item.amount}${item.unit}` : '';

// メモ帳・LINEにそのまま貼れる、1列（一段）のプレーンテキストを作る
export const buildShoppingText = (items: ShoppingItem[], servings: number): string => {
  const remaining = items.filter((i) => !i.checked);
  const lines: string[] = [`買い物リスト（${servings}人分・${remaining.length}品）`];

  groupShoppingItems(remaining).forEach((group) => {
    lines.push(`【${group.label}】`);
    group.items.forEach((item) => {
      const amount = formatShoppingAmount(item);
      lines.push(`・${item.name}${amount ? ` ${amount}` : ''}`);
    });
  });

  return lines.join('\n');
};


import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  CheckCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';
import type { ShoppingItem, IngredientCategory } from '../types';
import { CATEGORY_NAMES, guessCategory } from '../data/presetRecipes';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (name: string, category: IngredientCategory, amount?: number, unit?: string) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
  onSyncFromMenu: () => void;
  servings: number;
  onChangeServings: (newServings: number) => void;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  isOpen,
  onClose,
  items,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onClearChecked,
  onSyncFromMenu,
  servings,
  onChangeServings,
}) => {
  const [inputName, setInputName] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [inputUnit, setInputUnit] = useState('');
  const [inputCategory, setInputCategory] = useState<IngredientCategory>('vegetable');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [filterHideChecked, setFilterHideChecked] = useState(false);

  const groupedItems = useMemo(() => {
    const map: Record<IngredientCategory, ShoppingItem[]> = {
      meat_fish: [],
      vegetable: [],
      dairy_egg: [],
      seasoning: [],
      staple: [],
      other: [],
    };

    items.forEach((item) => {
      if (filterHideChecked && item.checked) return;
      const cat = item.category || 'other';
      if (map[cat]) {
        map[cat].push(item);
      } else {
        map.other.push(item);
      }
    });

    return map;
  }, [items, filterHideChecked]);

  if (!isOpen) return null;

  const totalCount = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const remainingCount = totalCount - checkedCount;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    const cat = inputCategory || guessCategory(inputName);
    const amt = inputAmount ? parseFloat(inputAmount) : undefined;
    onAddItem(inputName.trim(), cat, amt, inputUnit.trim() || undefined);
    setInputName('');
    setInputAmount('');
    setInputUnit('');
  };

  const handleCopyText = async () => {
    const categories: IngredientCategory[] = [
      'meat_fish',
      'vegetable',
      'dairy_egg',
      'seasoning',
      'staple',
      'other',
    ];
    let text = `🛒 【今週の買い物リスト】(${servings}人分・残り${remainingCount}品)\n`;

    categories.forEach((catKey) => {
      const catItems = items.filter((i) => (i.category || 'other') === catKey && !i.checked);
      if (catItems.length > 0) {
        text += `\n■ ${CATEGORY_NAMES[catKey].icon} ${CATEGORY_NAMES[catKey].label}\n`;
        catItems.forEach((i) => {
          const amountStr = i.amount !== undefined && i.unit ? ` (${i.amount}${i.unit})` : '';
          text += `  □ ${i.name}${amountStr}\n`;
        });
      }
    });

    text += `\n-- こんだてウィークリーより`;

    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (e) {
      // フォールバック
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-container shopping-modal animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <ShoppingBag size={20} className="modal-title-icon text-primary" />
            <h2 className="modal-title">自動買い物リスト</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        {/* 人数連動バー＆同期ボタン */}
        <div className="shopping-servings-bar">
          <div className="servings-selector">
            <span className="servings-label">
              <Users size={14} />
              <span>計算人数:</span>
            </span>
            <div className="servings-stepper">
              <button
                className="stepper-btn"
                onClick={() => onChangeServings(Math.max(1, servings - 1))}
                disabled={servings <= 1}
              >
                -
              </button>
              <span className="servings-val">{servings} 人分</span>
              <button
                className="stepper-btn"
                onClick={() => onChangeServings(Math.min(10, servings + 1))}
                disabled={servings >= 10}
              >
                +
              </button>
            </div>
          </div>

          <button
            className="btn-sync-menu"
            onClick={onSyncFromMenu}
            title="一週間献立の材料を現在の人数に合わせて再計算・再反映"
          >
            <RefreshCw size={13} />
            <span>献立から再計算</span>
          </button>
        </div>

        {/* ステータスバー */}
        <div className="shopping-status-bar">
          <div className="shopping-counter">
            残り <span className="highlight-count">{remainingCount}</span> 品 / 全 {totalCount} 品
          </div>
          <div className="shopping-actions-group">
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filterHideChecked}
                onChange={(e) => setFilterHideChecked(e.target.checked)}
              />
              <span>購入済を隠す</span>
            </label>
            {checkedCount > 0 && (
              <button
                className="btn-clear-checked"
                onClick={onClearChecked}
                title="チェックしたアイテムを一括削除"
              >
                <Trash2 size={13} />
                <span>購入済削除</span>
              </button>
            )}
          </div>
        </div>

        {/* 食材リスト（ジャンル別グループ表示） */}
        <div className="shopping-items-list custom-scrollbar">
          {items.length === 0 ? (
            <div className="empty-shopping-state">
              <CheckCheck size={40} className="empty-icon text-success" />
              <p className="empty-title">買い物リストは空です！</p>
              <p className="empty-subtitle">
                「献立から再計算」を押すか、下の入力欄から追加してください。
              </p>
            </div>
          ) : (
            (
              [
                'meat_fish',
                'vegetable',
                'dairy_egg',
                'seasoning',
                'staple',
                'other',
              ] as IngredientCategory[]
            ).map((catKey) => {
              const catGroup = groupedItems[catKey];
              if (!catGroup || catGroup.length === 0) return null;
              const catMeta = CATEGORY_NAMES[catKey];

              return (
                <div key={catKey} className="shopping-cat-section">
                  <div className="shopping-cat-header">
                    <span className="cat-icon">{catMeta.icon}</span>
                    <span className="cat-title">{catMeta.label}</span>
                    <span className="cat-count">({catGroup.length})</span>
                  </div>

                  <div className="shopping-cat-items">
                    {catGroup.map((item) => (
                      <div
                        key={item.id}
                        className={`shopping-item-row ${item.checked ? 'checked' : ''}`}
                        onClick={() => onToggleItem(item.id)}
                      >
                        <div className={`custom-checkbox ${item.checked ? 'checked' : ''}`}>
                          {item.checked && <Check size={14} />}
                        </div>
                        <div className="shopping-item-details">
                          <span className="item-name">{item.name}</span>
                          {item.amount !== undefined && item.unit && (
                            <span className="item-amount-badge">
                              {item.amount}
                              {item.unit}
                            </span>
                          )}
                        </div>
                        <button
                          className="item-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                          aria-label="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 自由追加フォーム */}
        <form className="shopping-add-form" onSubmit={handleAddCustom}>
          <div className="add-inputs-row">
            <select
              value={inputCategory}
              onChange={(e) => setInputCategory(e.target.value as IngredientCategory)}
              className="cat-select"
            >
              <option value="meat_fish">🥩 肉・魚</option>
              <option value="vegetable">🥬 野菜</option>
              <option value="dairy_egg">🥚 卵・乳</option>
              <option value="seasoning">🧂 調味料</option>
              <option value="staple">🍚 主食</option>
              <option value="other">🛒 その他</option>
            </select>
            <input
              type="text"
              placeholder="品名（例: 牛乳、ラップ）"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="name-input"
            />
            <input
              type="number"
              placeholder="数量"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="amount-input"
              step="any"
              min="0"
            />
            <input
              type="text"
              placeholder="単位"
              value={inputUnit}
              onChange={(e) => setInputUnit(e.target.value)}
              className="unit-input"
            />
            <button type="submit" className="add-submit-btn" disabled={!inputName.trim()}>
              <Plus size={16} />
              <span>追加</span>
            </button>
          </div>
        </form>

        {/* モーダルフッター（共有・コピー） */}
        <div className="modal-footer shopping-footer">
          <button className="btn-copy-shopping" onClick={handleCopyText}>
            <Copy size={16} />
            <span>{copyFeedback ? 'コピーしました！' : 'リストをコピー (LINE・メモ用)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

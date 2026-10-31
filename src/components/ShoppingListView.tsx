import React, { useState, useMemo } from 'react';
import {
  Check,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
import type { ShoppingItem, IngredientCategory } from '../types';
import { CATEGORY_NAMES, guessCategory } from '../data/presetRecipes';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (name: string, category: IngredientCategory) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
  onSyncFromMenu: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onClearChecked,
  onSyncFromMenu,
}) => {
  const [inputName, setInputName] = useState('');
  const [inputCategory, setInputCategory] = useState<IngredientCategory>('vegetable');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [filterHideChecked, setFilterHideChecked] = useState(false);

  // カテゴリ別にグループ化
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

  const totalCount = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const remainingCount = totalCount - checkedCount;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    const cat = inputCategory || guessCategory(inputName);
    onAddItem(inputName.trim(), cat);
    setInputName('');
  };

  // テキスト形式でクリップボードへコピー（LINEや家族への共有用）
  const handleCopyText = async () => {
    const categories: IngredientCategory[] = ['meat_fish', 'vegetable', 'dairy_egg', 'seasoning', 'staple', 'other'];
    let text = `🛒 【今週の買い物リスト】 (${remainingCount}品)\n`;

    categories.forEach((catKey) => {
      const catItems = items.filter((i) => (i.category || 'other') === catKey && !i.checked);
      if (catItems.length > 0) {
        text += `\n■ ${CATEGORY_NAMES[catKey].icon} ${CATEGORY_NAMES[catKey].label}\n`;
        catItems.forEach((i) => {
          text += `  □ ${i.name}\n`;
        });
      }
    });

    text += `\n-- こんだてウィークリーより`;

    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="shopping-view animate-fade-in">
      {/* 統計バー＆操作ボタン */}
      <div className="shopping-header-card">
        <div className="shopping-status-row">
          <div>
            <h2 className="section-title">買い物リスト</h2>
            <p className="shopping-stats">
              残り <strong>{remainingCount}</strong> 品 / 全 {totalCount} 品
            </p>
          </div>

          <div className="shopping-actions-group">
            <button
              className="btn-secondary-sm"
              onClick={onSyncFromMenu}
              title="献立の材料をリストに再反映"
            >
              <RefreshCw size={14} />
              <span>献立と同期</span>
            </button>

            <button
              className="btn-secondary-sm"
              onClick={handleCopyText}
              title="LINE等に貼り付けられるようコピー"
            >
              {copyFeedback ? <CheckCheck size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copyFeedback ? 'コピー完了！' : 'テキスト共有'}</span>
            </button>
          </div>
        </div>

        {/* 進行度バー */}
        {totalCount > 0 && (
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* 手動追加フォーム */}
      <form className="add-item-form" onSubmit={handleAddCustom}>
        <input
          type="text"
          className="text-input item-name-input"
          placeholder="食材・日用品を追加（例: 牛乳、卵、ティッシュ）"
          value={inputName}
          onChange={(e) => {
            setInputName(e.target.value);
            if (e.target.value) {
              setInputCategory(guessCategory(e.target.value));
            }
          }}
        />

        <select
          className="category-select"
          value={inputCategory}
          onChange={(e) => setInputCategory(e.target.value as IngredientCategory)}
        >
          {Object.entries(CATEGORY_NAMES).map(([key, info]) => (
            <option key={key} value={key}>
              {info.icon} {info.label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn-add-item" disabled={!inputName.trim()}>
          <Plus size={18} />
          <span>追加</span>
        </button>
      </form>

      {/* フィルタと完了済み削除 */}
      <div className="shopping-sub-bar">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filterHideChecked}
            onChange={(e) => setFilterHideChecked(e.target.checked)}
          />
          <span>完了済みを隠す</span>
        </label>

        {checkedCount > 0 && (
          <button className="text-btn-danger" onClick={onClearChecked}>
            <Trash2 size={13} />
            <span>購入済みを一括削除 ({checkedCount})</span>
          </button>
        )}
      </div>

      {/* カテゴリ別リスト */}
      <div className="categories-list-container">
        {totalCount === 0 ? (
          <div className="empty-state">
            <p>買い物リストが空です。</p>
            <p className="empty-hint">
              「献立と同期」を押すと、一週間の献立で使う材料が自動で入ります！
            </p>
          </div>
        ) : (
          (Object.keys(CATEGORY_NAMES) as IngredientCategory[]).map((catKey) => {
            const catItems = groupedItems[catKey];
            if (catItems.length === 0) return null;
            const info = CATEGORY_NAMES[catKey];

            return (
              <div key={catKey} className="category-group-card">
                <div className="category-group-header">
                  <span className="category-icon">{info.icon}</span>
                  <span className="category-name">{info.label}</span>
                  <span className="category-badge">{catItems.length}</span>
                </div>

                <div className="category-items-list">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className={`shopping-item-row ${item.checked ? 'checked' : ''}`}
                    >
                      <button
                        className="item-check-box"
                        onClick={() => onToggleItem(item.id)}
                        aria-label="チェック"
                      >
                        {item.checked && <Check size={16} />}
                      </button>

                      <div className="item-text-info" onClick={() => onToggleItem(item.id)}>
                        <span className="item-name">{item.name}</span>
                      </div>

                      <button
                        className="delete-item-btn"
                        onClick={() => onDeleteItem(item.id)}
                        title="削除"
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
    </div>
  );
};

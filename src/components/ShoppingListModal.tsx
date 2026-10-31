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
} from 'lucide-react';
import type { ShoppingItem, IngredientCategory } from '../types';
import { CATEGORY_NAMES, guessCategory } from '../data/presetRecipes';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (name: string, category: IngredientCategory) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
  onSyncFromMenu: () => void;
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
}) => {
  const [inputName, setInputName] = useState('');
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
    onAddItem(inputName.trim(), cat);
    setInputName('');
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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content shopping-modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="shopping-modal-title">
            <ShoppingBag size={20} className="shopping-modal-icon" />
            <div>
              <h3 className="modal-title">買い物リスト</h3>
              <p className="modal-subtitle">
                残り {remainingCount} 品 / 全 {totalCount} 品
              </p>
            </div>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* アクションバー */}
        <div className="modal-quick-actions">
          <button className="btn-secondary-xs" onClick={onSyncFromMenu} title="献立の材料を同期">
            <RefreshCw size={13} />
            <span>献立と同期</span>
          </button>
          <button className="btn-secondary-xs" onClick={handleCopyText} title="LINE等にコピー">
            {copyFeedback ? <CheckCheck size={13} color="#10b981" /> : <Copy size={13} />}
            <span>{copyFeedback ? 'コピー完了！' : 'テキスト共有'}</span>
          </button>
          <label className="checkbox-label" style={{ fontSize: '0.68rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterHideChecked}
              onChange={(e) => setFilterHideChecked(e.target.checked)}
            />
            <span>完了を隠す</span>
          </label>
          {checkedCount > 0 && (
            <button className="btn-danger-xs" onClick={onClearChecked}>
              <Trash2 size={13} />
              <span>削除 ({checkedCount})</span>
            </button>
          )}
        </div>

        {/* 手動追加フォーム */}
        <form className="add-item-form-modal" onSubmit={handleAddCustom}>
          <input
            type="text"
            className="text-input item-name-input"
            placeholder="食材・日用品を追加（例: 牛乳、卵）"
            value={inputName}
            onChange={(e) => {
              setInputName(e.target.value);
              if (e.target.value) {
                setInputCategory(guessCategory(e.target.value));
              }
            }}
          />
          <button type="submit" className="btn-add-item" disabled={!inputName.trim()}>
            <Plus size={16} />
            追加
          </button>
        </form>

        {/* リスト表示 */}
        <div className="modal-shopping-items-list">
          {totalCount === 0 ? (
            <div className="empty-state">
              <p>買い物リストが空です。</p>
              <p className="empty-hint">「献立と同期」を押すと材料が自動で入ります。</p>
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
                          {item.checked && <Check size={15} />}
                        </button>

                        <div className="item-text-info" onClick={() => onToggleItem(item.id)}>
                          <span className="item-name">{item.name}</span>
                        </div>

                        <button
                          className="delete-item-btn"
                          onClick={() => onDeleteItem(item.id)}
                          title="削除"
                        >
                          <Trash2 size={13} />
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
    </div>
  );
};

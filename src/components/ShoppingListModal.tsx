import React, { useState, useMemo } from 'react';
import { X, Check, Plus, Copy, Trash2, RefreshCw, CheckCheck, ShoppingBag, ListChecks, FileText } from 'lucide-react';
import type { ShoppingItem, IngredientCategory } from '../types';
import { guessCategory } from '../data/presetRecipes';
import { groupShoppingItems, buildShoppingText, formatShoppingAmount } from '../utils/shoppingFormat';

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
  const [inputCategory, setInputCategory] = useState<IngredientCategory | 'auto'>('auto');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [hideChecked, setHideChecked] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'text'>('list');

  const groups = useMemo(
    () => groupShoppingItems(items.filter((i) => !(hideChecked && i.checked))),
    [items, hideChecked]
  );
  const shoppingText = useMemo(() => buildShoppingText(items, servings), [items, servings]);

  if (!isOpen) return null;

  const totalCount = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const remainingCount = totalCount - checkedCount;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputName.trim();
    if (!name) return;
    const cat = inputCategory === 'auto' ? guessCategory(name) : inputCategory;
    // 数量欄は「2本」「300g」のような自由入力。数字＋単位に分けて保存する
    const m = inputAmount.trim().match(/^([\d.]+)\s*(.*)$/);
    const amount = m ? parseFloat(m[1]) : undefined;
    const unit = m ? m[2] || '個' : undefined;
    onAddItem(name, cat, amount, unit);
    setInputName('');
    setInputAmount('');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shoppingText);
    } catch {
      // クリップボードAPIが使えない環境向けのフォールバック
      const textarea = document.createElement('textarea');
      textarea.value = shoppingText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content shop-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <ShoppingBag size={20} className="text-primary" />
            <h2 className="modal-title">買い物リスト</h2>
          </div>
          <button className="icon-btn-plain" onClick={onClose} aria-label="閉じる">
            <X size={22} />
          </button>
        </div>

        {/* 人数・再計算 */}
        <div className="shop-toolbar">
          <div className="shop-servings">
            <span className="shop-toolbar-label">人数</span>
            <button
              className="stepper-round"
              onClick={() => onChangeServings(Math.max(1, servings - 1))}
              disabled={servings <= 1}
              aria-label="人数を減らす"
            >
              −
            </button>
            <span className="shop-servings-val">{servings}人分</span>
            <button
              className="stepper-round"
              onClick={() => onChangeServings(Math.min(10, servings + 1))}
              disabled={servings >= 10}
              aria-label="人数を増やす"
            >
              ＋
            </button>
          </div>
          <button className="btn-outline-sm" onClick={onSyncFromMenu} title="今週の献立から材料を集め直します">
            <RefreshCw size={14} />
            <span>献立から再計算</span>
          </button>
        </div>

        {/* 表示切り替え */}
        <div className="segmented">
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
            <ListChecks size={16} />
            <span>チェックリスト</span>
          </button>
          <button className={viewMode === 'text' ? 'active' : ''} onClick={() => setViewMode('text')}>
            <FileText size={16} />
            <span>メモ用テキスト</span>
          </button>
        </div>

        {viewMode === 'list' ? (
          <>
            <div className="shop-status">
              <span>
                残り <strong>{remainingCount}</strong> 品 / 全 {totalCount} 品
              </span>
              <div className="shop-status-actions">
                <label className="check-label">
                  <input type="checkbox" checked={hideChecked} onChange={(e) => setHideChecked(e.target.checked)} />
                  購入済を隠す
                </label>
                {checkedCount > 0 && (
                  <button className="btn-text-danger" onClick={onClearChecked}>
                    <Trash2 size={14} />
                    購入済を削除
                  </button>
                )}
              </div>
            </div>

            <div className="shop-list">
              {items.length === 0 ? (
                <div className="empty-box">
                  <CheckCheck size={36} className="empty-icon" />
                  <p>買い物リストは空です</p>
                  <p className="empty-sub">「献立から再計算」を押すか、下の欄から追加してください。</p>
                </div>
              ) : (
                groups.map((group) => (
                  <section key={group.key} className="shop-group">
                    <h3 className="shop-group-title">
                      <span>{group.icon}</span>
                      <span>{group.label}</span>
                      <span className="shop-group-count">{group.items.length}</span>
                    </h3>
                    <ul className="shop-rows">
                      {group.items.map((item) => {
                        const amount = formatShoppingAmount(item);
                        return (
                          <li
                            key={item.id}
                            className={`shop-row ${item.checked ? 'checked' : ''}`}
                            onClick={() => onToggleItem(item.id)}
                          >
                            <span className={`checkbox-box ${item.checked ? 'on' : ''}`}>
                              {item.checked && <Check size={14} strokeWidth={3} />}
                            </span>
                            <span className="shop-row-name">{item.name}</span>
                            {amount && <span className="shop-row-amount">{amount}</span>}
                            <button
                              className="shop-row-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item.id);
                              }}
                              aria-label={`${item.name}を削除`}
                            >
                              <X size={16} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>

            {/* 自由追加フォーム */}
            <form className="shop-add" onSubmit={handleAddCustom}>
              <select
                value={inputCategory}
                onChange={(e) => setInputCategory(e.target.value as IngredientCategory | 'auto')}
                className="shop-add-cat"
                aria-label="分類"
              >
                <option value="auto">自動分類</option>
                <option value="meat_fish">肉・魚</option>
                <option value="vegetable">野菜・果物</option>
                <option value="dairy_egg">卵・乳製品</option>
                <option value="staple">主食・粉類</option>
                <option value="seasoning">調味料</option>
                <option value="other">その他</option>
              </select>
              <input
                type="text"
                placeholder="品名（例: 牛乳）"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="shop-add-name"
              />
              <input
                type="text"
                placeholder="数量"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="shop-add-amount"
              />
              <button type="submit" className="btn-solid-sm" disabled={!inputName.trim()} aria-label="追加">
                <Plus size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="shop-text-wrap">
            <p className="shop-text-hint">未購入の品だけを分類ごとに1列で並べています。そのままメモ帳やLINEに貼り付けできます。</p>
            <textarea className="shop-textarea" readOnly value={shoppingText} onFocus={(e) => e.target.select()} />
          </div>
        )}

        {/* コピー */}
        <div className="shop-footer">
          <button className={`btn-primary-block ${copyFeedback ? 'done' : ''}`} onClick={handleCopyText}>
            {copyFeedback ? <Check size={18} /> : <Copy size={18} />}
            <span>{copyFeedback ? 'コピーしました' : 'メモ帳用にコピー'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

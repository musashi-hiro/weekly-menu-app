import React, { useState, useMemo } from 'react';
import { X, Search, Clock, Plus, Check } from 'lucide-react';
import type { RecipeItem, DayId, DishCategory } from '../types';

interface RecipeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayId: DayId;
  targetSlot: 'mainDish' | 'subDish' | 'soupDish' | 'dessertDish';
  currentValue: string;
  recipes: RecipeItem[];
  onSelectRecipe: (dishName: string, recipeObj?: RecipeItem) => void;
}

export const RecipeSelectModal: React.FC<RecipeSelectModalProps> = ({
  isOpen,
  onClose,
  targetSlot,
  currentValue,
  recipes = [],
  onSelectRecipe,
}) => {
  const initialCategory: DishCategory | 'all' =
    targetSlot === 'mainDish'
      ? 'main'
      : targetSlot === 'subDish'
      ? 'sub'
      : targetSlot === 'soupDish'
      ? 'soup'
      : 'dessert';

  const [activeType, setActiveType] = useState<DishCategory | 'all'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');

  const slotLabel =
    targetSlot === 'mainDish'
      ? '主菜（メイン）'
      : targetSlot === 'subDish'
      ? '副菜（サブ）'
      : targetSlot === 'soupDish'
      ? '汁物・スープ'
      : 'デザート・スイーツ';

  const safeRecipes = recipes || [];

  const filteredRecipes = useMemo(() => {
    return safeRecipes.filter((r) => {
      const matchType = activeType === 'all' || r.type === activeType;
      const matchQuery =
        searchQuery === '' ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchQuery;
    });
  }, [safeRecipes, activeType, searchQuery]);

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    if (customInput.trim()) {
      onSelectRecipe(customInput.trim());
      setCustomInput('');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{slotLabel}を選ぶ</h3>
            <p className="modal-subtitle">タップで即座に献立に反映されます</p>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 自由入力欄 */}
        <div className="custom-input-card">
          <input
            type="text"
            className="text-input"
            placeholder="自由に入力（例: 外食、冷蔵庫の残り物、手作りケーキ など）"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyCustom();
            }}
          />
          <button className="btn-primary-sm" onClick={handleApplyCustom} disabled={!customInput.trim()}>
            <Plus size={16} />
            設定
          </button>
        </div>

        {/* 検索バー */}
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="料理名や食材で検索（例: 豚肉、プリン）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="icon-btn-xs" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* タイプ選択タブ */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeType === 'main' ? 'active' : ''}`}
            onClick={() => setActiveType('main')}
          >
            🥩 主菜 ({recipes.filter((r) => r.type === 'main').length})
          </button>
          <button
            className={`filter-tab ${activeType === 'sub' ? 'active' : ''}`}
            onClick={() => setActiveType('sub')}
          >
            🥗 副菜 ({recipes.filter((r) => r.type === 'sub').length})
          </button>
          <button
            className={`filter-tab ${activeType === 'soup' ? 'active' : ''}`}
            onClick={() => setActiveType('soup')}
          >
            🍲 汁物 ({recipes.filter((r) => r.type === 'soup').length})
          </button>
          <button
            className={`filter-tab ${activeType === 'dessert' ? 'active' : ''}`}
            onClick={() => setActiveType('dessert')}
          >
            🍮 デザート ({recipes.filter((r) => r.type === 'dessert').length})
          </button>
          <button
            className={`filter-tab ${activeType === 'all' ? 'active' : ''}`}
            onClick={() => setActiveType('all')}
          >
            すべて
          </button>
        </div>

        {/* レシピ一覧 */}
        <div className="recipe-list-container">
          {filteredRecipes.length === 0 ? (
            <div className="empty-state">
              <p>該当するレシピが見つかりませんでした。</p>
              <p className="empty-hint">上の自由入力欄から直接入力できます。</p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const isSelected = currentValue === recipe.name;
              return (
                <div
                  key={recipe.id}
                  className={`recipe-card-select ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectRecipe(recipe.name, recipe);
                    onClose();
                  }}
                >
                  <div className="recipe-select-info">
                    <div className="recipe-name-row">
                      <span className="recipe-name">{recipe.name}</span>
                      {isSelected && <span className="selected-badge"><Check size={14} /> 選択中</span>}
                    </div>

                    {recipe.tip && <p className="recipe-tip">{recipe.tip}</p>}

                    <div className="recipe-meta-row">
                      {recipe.cookTimeMinutes && (
                        <span className="recipe-time">
                          <Clock size={12} /> {recipe.cookTimeMinutes}分
                        </span>
                      )}
                      {recipe.ingredients.length > 0 && (
                        <span className="recipe-ingredients-preview">
                          材料: {recipe.ingredients.map((i) => i.name).slice(0, 3).join(', ')}
                          {recipe.ingredients.length > 3 ? ' 他' : ''}
                        </span>
                      )}
                    </div>
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

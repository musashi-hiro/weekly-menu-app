import React from 'react';
import { X, Lightbulb, Pencil, Trash2, CalendarPlus } from 'lucide-react';
import type { RecipeItem } from '../types';
import { DISH_TYPE_INFO, CATEGORY_NAMES, GENRE_LABELS, formatIngredientWithAmount } from '../data/presetRecipes';

interface RecipeDetailModalProps {
  recipe: RecipeItem | null;
  servings?: number;
  onClose: () => void;
  onEdit?: (recipe: RecipeItem) => void;
  onDelete?: (recipeId: string) => void;
  onApplyToDay?: (recipe: RecipeItem) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  servings = 2,
  onClose,
  onEdit,
  onDelete,
  onApplyToDay,
}) => {
  if (!recipe) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content recipe-detail animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="recipe-detail-kicker">
              {DISH_TYPE_INFO[recipe.type].label}・{GENRE_LABELS[recipe.genre]}
              {recipe.cookTimeMinutes && `・約${recipe.cookTimeMinutes}分`}
            </p>
            <h3 className="modal-title">{recipe.name}</h3>
          </div>
          <button className="icon-btn-plain" onClick={onClose} aria-label="閉じる">
            <X size={22} />
          </button>
        </div>

        <div className="recipe-detail-body">
          {recipe.tip && (
            <p className="recipe-tip-box">
              <Lightbulb size={16} />
              <span>{recipe.tip}</span>
            </p>
          )}

          <h4 className="detail-heading">材料（{servings}人分）</h4>
          {recipe.ingredients.length > 0 ? (
            <ul className="ingredient-list">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>
                  <span>{formatIngredientWithAmount(ing, servings)}</span>
                  <span className="ingredient-cat">{CATEGORY_NAMES[ing.category]?.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-text">材料は登録されていません</p>
          )}

          <h4 className="detail-heading">作り方</h4>
          {recipe.steps && recipe.steps.length > 0 ? (
            <ol className="step-list">
              {recipe.steps.map((step, i) => (
                <li key={i}>
                  <span className="step-num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted-text">
              作り方はまだ登録されていません。
              {recipe.isCustom && onEdit && '「編集」から追加できます。'}
            </p>
          )}
        </div>

        {(onEdit || onDelete || onApplyToDay) && (
          <div className="recipe-detail-actions">
            {recipe.isCustom && onDelete && (
              <button
                className="btn-icon-outline danger"
                onClick={() => {
                  if (confirm(`「${recipe.name}」を削除しますか？`)) {
                    onDelete(recipe.id);
                    onClose();
                  }
                }}
                aria-label="削除"
              >
                <Trash2 size={18} />
              </button>
            )}
            {recipe.isCustom && onEdit && (
              <button
                className="btn-outline"
                onClick={() => {
                  onEdit(recipe);
                  onClose();
                }}
              >
                <Pencil size={16} />
                <span>編集</span>
              </button>
            )}
            {onApplyToDay && (
              <button
                className="btn-solid grow"
                onClick={() => {
                  onApplyToDay(recipe);
                  onClose();
                }}
              >
                <CalendarPlus size={18} />
                <span>献立に入れる</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

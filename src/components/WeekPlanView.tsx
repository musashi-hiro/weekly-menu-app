import React, { useState } from 'react';
import {
  Shuffle,
  Edit3,
  MessageSquare,
  LayoutGrid,
  CalendarRange,
  ShoppingBag,
  Plus,
  Trash2,
  Users,
  Download,
} from 'lucide-react';
import type { DayId, DayMenu, DishCategory, DishEntry, RecipeItem } from '../types';
import { DISH_TYPE_INFO, formatIngredientWithAmount } from '../data/presetRecipes';
import { downloadBackupFile } from '../utils/storage';

interface WeekPlanViewProps {
  plan: Record<DayId, DayMenu>;
  onUpdateDay: (dayId: DayId, updated: DayMenu) => void;
  onOpenSlotSelect: (
    dayId: DayId,
    slot: 'mainDish' | 'subDish' | 'soupDish' | 'dessertDish',
    currentValue: string
  ) => void;
  onShuffleDay: (dayId: DayId) => void;
  onOpenShopping: () => void;
  shoppingCount: number;
  allRecipes: RecipeItem[];
  showToast: (msg: string) => void;
  globalServings: number;
  onChangeGlobalServings: (servings: number) => void;
}

const DAY_ORDER: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WeekPlanView: React.FC<WeekPlanViewProps> = ({
  plan,
  onUpdateDay,
  onOpenSlotSelect,
  onShuffleDay,
  onOpenShopping,
  shoppingCount,
  allRecipes,
  showToast,
  globalServings,
  onChangeGlobalServings,
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [activeDayId, setActiveDayId] = useState<DayId>('mon');
  const [editingMemoDay, setEditingMemoDay] = useState<DayId | null>(null);

  const activeDay = plan[activeDayId];

  // 全曜日の人数を一括変更
  const handleUpdateAllServings = (newServings: number) => {
    if (newServings < 1 || newServings > 10) return;
    onChangeGlobalServings(newServings);
    DAY_ORDER.forEach((dId) => {
      const d = plan[dId];
      if (d) {
        onUpdateDay(dId, { ...d, servings: newServings });
      }
    });
    showToast(`👨‍👩‍👧 一週間の人数を「${newServings}人分」に設定しました！`);
  };

  return (
    <div className="week-plan-view animate-fade-in">
      {/* 画面ヘッダー補助（人数設定・買い物リスト・データ保存・表示切替） */}
      <div className="plan-top-controls">
        {/* 人数カウンター（何人分か） */}
        <div className="servings-global-control">
          <span className="control-label">
            <Users size={15} />
            <span>食べる人数:</span>
          </span>
          <div className="servings-stepper-mini">
            <button
              className="step-btn"
              onClick={() => handleUpdateAllServings(globalServings - 1)}
              disabled={globalServings <= 1}
            >
              -
            </button>
            <span className="servings-number">{globalServings}人分</span>
            <button
              className="step-btn"
              onClick={() => handleUpdateAllServings(globalServings + 1)}
              disabled={globalServings >= 10}
            >
              +
            </button>
          </div>
        </div>

        {/* 右側アクション群 */}
        <div className="plan-actions-right">
          <button
            className="btn-backup-quick"
            onClick={() => {
              downloadBackupFile();
              showToast('💾 データをファイルに保存しました！');
            }}
            title="現在の献立データをファイルに保存（バックアップ）"
          >
            <Download size={14} />
            <span>保存</span>
          </button>

          <button className="btn-shopping-shortcut" onClick={onOpenShopping}>
            <ShoppingBag size={15} />
            <span>買い物</span>
            {shoppingCount > 0 && <span className="shortcut-badge">{shoppingCount}</span>}
          </button>

          <div className="mode-switch-group">
            <button
              className={`mode-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
              title="一週間すべて表示"
            >
              <CalendarRange size={14} />
              <span>全一覧</span>
            </button>
            <button
              className={`mode-btn ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => setViewMode('single')}
              title="1日ずつ表示"
            >
              <LayoutGrid size={14} />
              <span>1日集中</span>
            </button>
          </div>
        </div>
      </div>

      {/* 曜日選択ピル */}
      <div className="day-selector-pills">
        {DAY_ORDER.map((dId) => {
          const day = plan[dId];
          const isSelected = activeDayId === dId;
          return (
            <button
              key={dId}
              className={`day-pill day-color-${dId} ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                setActiveDayId(dId);
                if (viewMode === 'all') {
                  const el = document.getElementById(`day-card-${dId}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <span className="pill-short">{day.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 1日集中モード */}
      {viewMode === 'single' && activeDay && (
        <div className="single-day-container animate-fade-in">
          <DayCard
            day={activeDay}
            onOpenSlotSelect={onOpenSlotSelect}
            onShuffleDay={onShuffleDay}
            onUpdateDay={onUpdateDay}
            isEditingMemo={editingMemoDay === activeDay.dayId}
            onToggleEditMemo={() =>
              setEditingMemoDay(editingMemoDay === activeDay.dayId ? null : activeDay.dayId)
            }
            allRecipes={allRecipes}
            showToast={showToast}
          />
        </div>
      )}

      {/* 全一覧モード */}
      {viewMode === 'all' && (
        <div className="all-days-container">
          {DAY_ORDER.map((dId) => {
            const day = plan[dId];
            return (
              <div key={dId} id={`day-card-${dId}`} className="day-card-anchor">
                <DayCard
                  day={day}
                  onOpenSlotSelect={onOpenSlotSelect}
                  onShuffleDay={onShuffleDay}
                  onUpdateDay={onUpdateDay}
                  isEditingMemo={editingMemoDay === dId}
                  onToggleEditMemo={() => setEditingMemoDay(editingMemoDay === dId ? null : dId)}
                  allRecipes={allRecipes}
                  showToast={showToast}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface DayCardProps {
  day: DayMenu;
  onOpenSlotSelect: (
    dayId: DayId,
    slot: 'mainDish' | 'subDish' | 'soupDish' | 'dessertDish',
    currentValue: string
  ) => void;
  onShuffleDay: (dayId: DayId) => void;
  onUpdateDay: (dayId: DayId, updated: DayMenu) => void;
  isEditingMemo: boolean;
  onToggleEditMemo: () => void;
  allRecipes: RecipeItem[];
  showToast: (msg: string) => void;
}

const DayCard: React.FC<DayCardProps> = ({
  day,
  onOpenSlotSelect,
  onShuffleDay,
  onUpdateDay,
  isEditingMemo,
  onToggleEditMemo,
  allRecipes,
  showToast,
}) => {
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishType, setNewDishType] = useState<DishCategory>('sub');

  // 人数（デフォルト: 2）
  const currentServings = day.servings || 2;

  // 料理リスト（dishesがあればそれを使用、なければ4スロットから合成）
  const dishes: DishEntry[] = day.dishes && day.dishes.length > 0
    ? day.dishes
    : [
        day.mainDish && { id: 'm', name: day.mainDish, type: 'main' as const },
        day.subDish && { id: 's', name: day.subDish, type: 'sub' as const },
        day.soupDish && { id: 'p', name: day.soupDish, type: 'soup' as const },
        day.dessertDish && { id: 'd', name: day.dessertDish, type: 'dessert' as const },
      ].filter(Boolean) as DishEntry[];

  // 人数変更
  const handleChangeServings = (delta: number) => {
    const next = Math.max(1, Math.min(10, currentServings + delta));
    onUpdateDay(day.dayId, { ...day, servings: next });
  };

  // メニュー追加
  const handleAddNewDish = () => {
    if (!newDishName.trim()) return;
    const name = newDishName.trim();
    const matched = allRecipes.find((r) => r.name === name);

    const newDish: DishEntry = {
      id: 'dish_' + Math.random().toString(36).substring(2, 9),
      name,
      type: newDishType,
      ingredients: matched?.ingredients,
      servings: currentServings,
    };

    const updatedDishes = [...dishes, newDish];

    // 食材リストも追加分をマージ
    let updatedIngredients = [...day.ingredients];
    if (matched?.ingredients) {
      matched.ingredients.forEach((ing) => {
        if (!updatedIngredients.some((i) => i.name === ing.name)) {
          updatedIngredients.push(ing);
        }
      });
    }

    onUpdateDay(day.dayId, {
      ...day,
      dishes: updatedDishes,
      ingredients: updatedIngredients,
    });

    setNewDishName('');
    setIsAddingDish(false);
    showToast(`🍳 ${day.shortLabel}曜日に「${name}」を追加しました！`);
  };

  // 料理の削除
  const handleDeleteDish = (dishId: string) => {
    const target = dishes.find((d) => d.id === dishId);
    const updatedDishes = dishes.filter((d) => d.id !== dishId);
    onUpdateDay(day.dayId, {
      ...day,
      dishes: updatedDishes,
    });
    if (target) {
      showToast(`🗑️ 「${target.name}」を削除しました`);
    }
  };

  return (
    <div className={`day-card day-border-${day.dayId}`}>
      {/* 曜日ヘッダー */}
      <div className="day-card-header">
        <div className="day-title-group">
          <span className={`day-badge day-bg-${day.dayId}`}>{day.dayLabel}</span>
          <span className="day-theme">{day.theme}</span>
        </div>

        <div className="day-header-actions">
          {/* 人数ステッパー */}
          <div className="day-servings-badge" title="この日の人数を変更">
            <Users size={12} />
            <button className="servings-sub-btn" onClick={() => handleChangeServings(-1)}>
              -
            </button>
            <span>{currentServings}人分</span>
            <button className="servings-add-btn" onClick={() => handleChangeServings(1)}>
              +
            </button>
          </div>

          <button
            className="shuffle-day-btn"
            onClick={() => onShuffleDay(day.dayId)}
            title="この日の献立をシャッフル"
          >
            <Shuffle size={14} />
            <span>再抽選</span>
          </button>
        </div>
      </div>

      {/* 料理一覧（複数品に完全対応） */}
      <div className="dishes-slots">
        {dishes.map((dish) => {
          const info = DISH_TYPE_INFO[dish.type] || DISH_TYPE_INFO.main;
          return (
            <div key={dish.id} className="dish-slot-item">
              <div
                className="slot-clickable"
                onClick={() => {
                  const slotKey =
                    dish.type === 'main'
                      ? 'mainDish'
                      : dish.type === 'sub'
                      ? 'subDish'
                      : dish.type === 'soup'
                      ? 'soupDish'
                      : 'dessertDish';
                  onOpenSlotSelect(day.dayId, slotKey, dish.name);
                }}
              >
                <div className="slot-icon-label" style={{ color: info.color }}>
                  <span>{info.icon}</span>
                  <span className="slot-type">{info.label}</span>
                </div>
                <div className="slot-dish-name">{dish.name}</div>
                <Edit3 size={13} className="slot-edit-icon" />
              </div>

              {/* 削除ボタン */}
              <button
                className="slot-delete-btn"
                onClick={() => handleDeleteDish(dish.id)}
                title="このメニューを削除"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}

        {/* 料理追加フォームまたは追加トリガーボタン */}
        {isAddingDish ? (
          <div className="add-dish-inline-card animate-fade-in">
            <div className="inline-add-row">
              <select
                value={newDishType}
                onChange={(e) => setNewDishType(e.target.value as DishCategory)}
                className="inline-type-select"
              >
                <option value="main">🥩 主菜</option>
                <option value="sub">🥗 副菜</option>
                <option value="soup">🍲 汁物</option>
                <option value="dessert">🍮 デザート</option>
                <option value="other">🍽️ 追加の一品</option>
              </select>

              <input
                type="text"
                placeholder="料理名を入力（例: 肉じゃが、餃子）"
                value={newDishName}
                onChange={(e) => setNewDishName(e.target.value)}
                className="inline-name-input"
                list={`recipe-list-${day.dayId}`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNewDish();
                }}
              />

              <datalist id={`recipe-list-${day.dayId}`}>
                {allRecipes.map((r) => (
                  <option key={r.id} value={r.name} />
                ))}
              </datalist>
            </div>

            <div className="inline-add-buttons">
              <button className="btn-cancel-sm" onClick={() => setIsAddingDish(false)}>
                キャンセル
              </button>
              <button className="btn-add-sm" onClick={handleAddNewDish}>
                追加する
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn-add-dish-slot"
            onClick={() => setIsAddingDish(true)}
            title="主菜や副菜、おつまみなどのメニューを追加"
          >
            <Plus size={14} />
            <span>＋ メニューを追加する</span>
          </button>
        )}
      </div>

      {/* 材料タグ（人数に合わせた分量付き表示） */}
      {day.ingredients.length > 0 && (
        <div className="day-ingredients-row">
          <span className="ing-label">材料 ({currentServings}人分):</span>
          <div className="ing-tags-wrap">
            {day.ingredients.slice(0, 8).map((ing, idx) => (
              <span key={idx} className="ing-tag">
                {formatIngredientWithAmount(ing, currentServings)}
              </span>
            ))}
            {day.ingredients.length > 8 && (
              <span className="ing-tag more">+{day.ingredients.length - 8}</span>
            )}
          </div>
        </div>
      )}

      {/* メモ */}
      <div className="day-memo-section">
        {isEditingMemo ? (
          <div className="memo-edit-box">
            <textarea
              className="memo-textarea"
              placeholder="メモ・調理のポイント・下ごしらえなど"
              value={day.memo}
              onChange={(e) => onUpdateDay(day.dayId, { ...day, memo: e.target.value })}
              rows={2}
              autoFocus
            />
            <button className="memo-done-btn" onClick={onToggleEditMemo}>
              保存
            </button>
          </div>
        ) : (
          <div className="memo-display" onClick={onToggleEditMemo}>
            <MessageSquare size={13} className="memo-icon" />
            <span className="memo-text">{day.memo || 'メモを追加...'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

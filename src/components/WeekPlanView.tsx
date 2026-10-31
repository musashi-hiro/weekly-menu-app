import React, { useState } from 'react';
import {
  Shuffle,
  Edit3,
  MessageSquare,
  Utensils,
  Soup,
  Salad,
  Cake,
  LayoutGrid,
  CalendarRange,
  ShoppingBag,
} from 'lucide-react';
import type { DayId, DayMenu } from '../types';

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
}

const DAY_ORDER: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WeekPlanView: React.FC<WeekPlanViewProps> = ({
  plan,
  onUpdateDay,
  onOpenSlotSelect,
  onShuffleDay,
  onOpenShopping,
  shoppingCount,
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [activeDayId, setActiveDayId] = useState<DayId>('mon');
  const [editingMemoDay, setEditingMemoDay] = useState<DayId | null>(null);

  const activeDay = plan[activeDayId];

  return (
    <div className="week-plan-view animate-fade-in">
      {/* 画面ヘッダー補助（買い物リストクイックボタン＆表示切替） */}
      <div className="plan-sub-bar">
        <button className="btn-shopping-shortcut" onClick={onOpenShopping}>
          <ShoppingBag size={16} />
          <span>買い物リスト</span>
          {shoppingCount > 0 && <span className="shortcut-badge">{shoppingCount}</span>}
        </button>

        <div className="mode-switch-group">
          <button
            className={`mode-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
            title="一週間すべて表示"
          >
            <CalendarRange size={15} />
            <span>全一覧</span>
          </button>
          <button
            className={`mode-btn ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
            title="1日ずつ表示"
          >
            <LayoutGrid size={15} />
            <span>1日集中</span>
          </button>
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
}

const DayCard: React.FC<DayCardProps> = ({
  day,
  onOpenSlotSelect,
  onShuffleDay,
  onUpdateDay,
  isEditingMemo,
  onToggleEditMemo,
}) => {
  return (
    <div className={`day-card day-border-${day.dayId}`}>
      {/* 曜日ヘッダー */}
      <div className="day-card-header">
        <div className="day-title-group">
          <span className={`day-badge day-bg-${day.dayId}`}>{day.dayLabel}</span>
          <span className="day-theme">{day.theme}</span>
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

      {/* 4品スロット（主菜・副菜・汁物・デザート） */}
      <div className="dishes-slots">
        {/* 主菜 */}
        <div
          className="dish-slot-item main-slot"
          onClick={() => onOpenSlotSelect(day.dayId, 'mainDish', day.mainDish)}
        >
          <div className="slot-icon-label">
            <Utensils size={15} className="slot-icon" />
            <span className="slot-type">主菜</span>
          </div>
          <div className="slot-dish-name">
            {day.mainDish || <span className="placeholder-text">主菜をえらぶ</span>}
          </div>
          <Edit3 size={13} className="slot-edit-icon" />
        </div>

        {/* 副菜 */}
        <div
          className="dish-slot-item sub-slot"
          onClick={() => onOpenSlotSelect(day.dayId, 'subDish', day.subDish)}
        >
          <div className="slot-icon-label">
            <Salad size={15} className="slot-icon" />
            <span className="slot-type">副菜</span>
          </div>
          <div className="slot-dish-name">
            {day.subDish || <span className="placeholder-text">副菜をえらぶ</span>}
          </div>
          <Edit3 size={13} className="slot-edit-icon" />
        </div>

        {/* 汁物 */}
        <div
          className="dish-slot-item soup-slot"
          onClick={() => onOpenSlotSelect(day.dayId, 'soupDish', day.soupDish)}
        >
          <div className="slot-icon-label">
            <Soup size={15} className="slot-icon" />
            <span className="slot-type">汁物</span>
          </div>
          <div className="slot-dish-name">
            {day.soupDish || <span className="placeholder-text">汁物をえらぶ</span>}
          </div>
          <Edit3 size={13} className="slot-edit-icon" />
        </div>

        {/* デザート */}
        <div
          className="dish-slot-item dessert-slot"
          onClick={() => onOpenSlotSelect(day.dayId, 'dessertDish', day.dessertDish || '')}
        >
          <div className="slot-icon-label">
            <Cake size={15} className="slot-icon" />
            <span className="slot-type">デザート</span>
          </div>
          <div className="slot-dish-name">
            {day.dessertDish ? (
              day.dessertDish
            ) : (
              <span className="placeholder-text">デザートを追加（任意）</span>
            )}
          </div>
          <Edit3 size={13} className="slot-edit-icon" />
        </div>
      </div>

      {/* 材料タグ */}
      {day.ingredients.length > 0 && (
        <div className="day-ingredients-row">
          <span className="ing-label">材料:</span>
          <div className="ing-tags-wrap">
            {day.ingredients.slice(0, 6).map((ing, idx) => (
              <span key={idx} className="ing-tag">
                {ing.name}
              </span>
            ))}
            {day.ingredients.length > 6 && (
              <span className="ing-tag more">+{day.ingredients.length - 6}</span>
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

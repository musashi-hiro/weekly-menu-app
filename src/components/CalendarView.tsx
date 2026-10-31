import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Star,
  Copy,
  Clock,
  Utensils,
} from 'lucide-react';
import type { CalendarRecord, DayId, DayMenu, DishCategory, DishEntry, RecipeItem } from '../types';
import { DISH_TYPE_INFO } from '../data/presetRecipes';

interface CalendarViewProps {
  records: Record<string, CalendarRecord>;
  onSaveRecord: (dateStr: string, record: CalendarRecord) => void;
  currentWeekPlan: Record<DayId, DayMenu>;
  onApplyWeekToCalendar: () => void;
  allRecipes: RecipeItem[];
  showToast: (msg: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  records,
  onSaveRecord,
  currentWeekPlan,
  onApplyWeekToCalendar,
  allRecipes,
  showToast,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed

  // 選択中の日付 (YYYY-MM-DD)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // メニュー追加用モーダル/入力状態
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishType, setNewDishType] = useState<DishCategory>('main');

  // 月切り替え
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  // カレンダーの日付セル配列を計算
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  // 月の初日の曜日（0=日, 1=月, ... 6=土）を月曜始まり（0=月 ... 6=日）に変換
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();

  // カレンダーグリッドの日付リスト
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // 前月の余白
  const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDate - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarCells.push({
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // 当月
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push({
      dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // 翌月の余白（7の倍数まで）
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarCells.push({
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // 選択中の日付のレコード（なければデフォルト構造を生成）
  const activeRecord: CalendarRecord = records[selectedDate] || {
    date: selectedDate,
    dishes: [],
    servings: 2,
    memo: '',
    rating: 0,
    cooked: false,
    updatedAt: Date.now(),
  };

  // レコード更新ヘルパー
  const updateCurrentRecord = (updater: (prev: CalendarRecord) => CalendarRecord) => {
    const updated = updater(activeRecord);
    onSaveRecord(selectedDate, { ...updated, updatedAt: Date.now() });
  };

  // メニュー追加
  const handleAddDish = () => {
    if (!newDishName.trim()) return;
    const matched = allRecipes.find((r) => r.name === newDishName.trim());
    const newEntry: DishEntry = {
      id: 'dish_' + Math.random().toString(36).substring(2, 9),
      name: newDishName.trim(),
      type: newDishType,
      ingredients: matched?.ingredients,
      servings: activeRecord.servings || 2,
    };

    updateCurrentRecord((prev) => ({
      ...prev,
      dishes: [...prev.dishes, newEntry],
    }));

    setNewDishName('');
    setIsAddingDish(false);
    showToast(`🍳 「${newDishName.trim()}」を追加しました`);
  };

  // メニュー削除
  const handleDeleteDish = (dishId: string) => {
    updateCurrentRecord((prev) => ({
      ...prev,
      dishes: prev.dishes.filter((d) => d.id !== dishId),
    }));
    showToast('🗑️ メニューを削除しました');
  };

  // 「今週の献立」から選択日にコピー
  const handleCopyFromWeekPlan = () => {
    const targetDateObj = new Date(selectedDate);
    const dayIndex = targetDateObj.getDay(); // 0:日, 1:月...
    const map: DayId[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const matchedDayId = map[dayIndex];
    const dayPlan = currentWeekPlan[matchedDayId];

    if (!dayPlan) {
      showToast('⚠️ 該当する曜日の献立がありません');
      return;
    }

    const dishesToCopy: DishEntry[] = dayPlan.dishes && dayPlan.dishes.length > 0
      ? [...dayPlan.dishes]
      : [
          { id: 'd1', name: dayPlan.mainDish, type: 'main' as const },
          { id: 'd2', name: dayPlan.subDish, type: 'sub' as const },
          { id: 'd3', name: dayPlan.soupDish, type: 'soup' as const },
          { id: 'd4', name: dayPlan.dessertDish, type: 'dessert' as const },
        ].filter((d) => Boolean(d.name));

    updateCurrentRecord((prev) => ({
      ...prev,
      dishes: dishesToCopy,
      servings: dayPlan.servings || 2,
      memo: dayPlan.memo || prev.memo,
    }));

    showToast(`📋 ${dayPlan.dayLabel}の献立を反映しました！`);
  };

  return (
    <div className="calendar-view-container animate-fade-in">
      {/* カレンダー上部コントロールバー */}
      <div className="calendar-header-bar">
        <div className="month-selector">
          <button className="cal-nav-btn" onClick={handlePrevMonth} title="前月">
            <ChevronLeft size={20} />
          </button>
          <span className="cal-current-month">
            {currentYear}年 {currentMonth + 1}月
          </span>
          <button className="cal-nav-btn" onClick={handleNextMonth} title="翌月">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="cal-actions-right">
          <button className="btn-cal-today" onClick={handleGoToday}>
            <Clock size={14} />
            <span>今日</span>
          </button>
          <button
            className="btn-cal-sync-week"
            onClick={onApplyWeekToCalendar}
            title="今週の1週間献立をカレンダーに一括コピーします"
          >
            <Copy size={14} />
            <span>今週の献立を一括反映</span>
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="calendar-weekdays">
        {['月', '火', '水', '木', '金', '土', '日'].map((w, idx) => (
          <div
            key={w}
            className={`cal-weekday-header ${idx === 5 ? 'saturday' : ''} ${idx === 6 ? 'sunday' : ''}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="calendar-grid">
        {calendarCells.map((cell) => {
          const rec = records[cell.dateStr];
          const isSelected = selectedDate === cell.dateStr;
          const isToday = todayStr === cell.dateStr;
          const mainDish = rec?.dishes?.find((d) => d.type === 'main')?.name || rec?.dishes?.[0]?.name;
          const dishCount = rec?.dishes?.length || 0;
          const isCooked = rec?.cooked;

          return (
            <div
              key={cell.dateStr}
              className={`calendar-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${
                isSelected ? 'selected' : ''
              } ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDate(cell.dateStr)}
            >
              <div className="cell-top">
                <span className="cell-day-num">{cell.dayNum}</span>
                {isCooked && <span className="cell-cooked-badge" title="作った！">🍳</span>}
              </div>

              {mainDish && (
                <div className="cell-dish-summary" title={mainDish}>
                  <span className="cell-dish-name">{mainDish}</span>
                  {dishCount > 1 && <span className="cell-dish-count">+{dishCount - 1}品</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 選択した日付の詳細・記録パネル */}
      <div className="calendar-detail-panel card animate-slide-up">
        <div className="detail-panel-header">
          <div className="detail-date-title">
            <CalendarIcon size={18} className="text-primary" />
            <h3>{selectedDate} の献立記録</h3>
          </div>

          <div className="detail-header-actions">
            {/* 今日作った！トグル */}
            <button
              className={`btn-cooked-toggle ${activeRecord.cooked ? 'active' : ''}`}
              onClick={() =>
                updateCurrentRecord((prev) => ({
                  ...prev,
                  cooked: !prev.cooked,
                }))
              }
            >
              {activeRecord.cooked ? (
                <>
                  <CheckCircle2 size={16} className="text-success" />
                  <span>作った！</span>
                </>
              ) : (
                <>
                  <Circle size={16} />
                  <span>未調理</span>
                </>
              )}
            </button>

            {/* 今週の献立からコピーボタン */}
            <button
              className="btn-copy-day"
              onClick={handleCopyFromWeekPlan}
              title="今週の同じ曜日の献立を取り込みます"
            >
              <Copy size={14} />
              <span>献立から取り込み</span>
            </button>
          </div>
        </div>

        {/* 人数設定バー */}
        <div className="detail-servings-bar">
          <span className="servings-label">👨‍👩‍👧 食べる人数:</span>
          <div className="servings-stepper">
            <button
              className="stepper-btn"
              onClick={() =>
                updateCurrentRecord((prev) => ({
                  ...prev,
                  servings: Math.max(1, (prev.servings || 2) - 1),
                }))
              }
            >
              -
            </button>
            <span className="servings-value">{activeRecord.servings || 2} 人分</span>
            <button
              className="stepper-btn"
              onClick={() =>
                updateCurrentRecord((prev) => ({
                  ...prev,
                  servings: Math.min(10, (prev.servings || 2) + 1),
                }))
              }
            >
              +
            </button>
          </div>
        </div>

        {/* 登録されている料理一覧（複数品対応） */}
        <div className="detail-dishes-section">
          <div className="section-title-wrap">
            <h4 className="section-title">🍽️ 本日のメニュー ({activeRecord.dishes.length}品)</h4>
            {!isAddingDish && (
              <button className="btn-add-dish-inline" onClick={() => setIsAddingDish(true)}>
                <Plus size={14} />
                <span>メニューを追加</span>
              </button>
            )}
          </div>

          {/* 新規メニュー追加フォーム */}
          {isAddingDish && (
            <div className="add-dish-inline-form animate-fade-in">
              <div className="form-row">
                <select
                  value={newDishType}
                  onChange={(e) => setNewDishType(e.target.value as DishCategory)}
                  className="dish-type-select"
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
                  className="dish-name-input"
                  list="recipe-datalist"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddDish();
                  }}
                />

                <datalist id="recipe-datalist">
                  {allRecipes.map((r) => (
                    <option key={r.id} value={r.name} />
                  ))}
                </datalist>
              </div>

              <div className="form-buttons">
                <button className="btn-cancel" onClick={() => setIsAddingDish(false)}>
                  キャンセル
                </button>
                <button className="btn-confirm-add" onClick={handleAddDish}>
                  追加する
                </button>
              </div>
            </div>
          )}

          {/* 料理リスト */}
          {activeRecord.dishes.length === 0 ? (
            <div className="empty-dishes-box">
              <Utensils size={28} className="text-muted" />
              <p>まだメニューが登録されていません</p>
              <button className="btn-primary-sm" onClick={() => setIsAddingDish(true)}>
                <Plus size={14} />
                メニューを追加する
              </button>
            </div>
          ) : (
            <div className="dishes-list-grid">
              {activeRecord.dishes.map((dish) => {
                const info = DISH_TYPE_INFO[dish.type] || DISH_TYPE_INFO.main;
                return (
                  <div key={dish.id} className="dish-card-item">
                    <div className="dish-badge" style={{ backgroundColor: info.color }}>
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </div>
                    <span className="dish-title">{dish.name}</span>
                    <button
                      className="btn-delete-dish"
                      onClick={() => handleDeleteDish(dish.id)}
                      title="このメニューを削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 評価（星評価） */}
        <div className="detail-rating-section">
          <span className="rating-label">⭐ 満足度・評価:</span>
          <div className="stars-group">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= (activeRecord.rating || 0) ? 'filled' : ''}`}
                onClick={() =>
                  updateCurrentRecord((prev) => ({
                    ...prev,
                    rating: prev.rating === star ? 0 : star,
                  }))
                }
              >
                <Star size={18} fill={star <= (activeRecord.rating || 0) ? '#f59e0b' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* メモ・日記 */}
        <div className="detail-memo-section">
          <label className="memo-label">📝 今日のメモ・感想日記:</label>
          <textarea
            className="cal-memo-textarea"
            placeholder="「子どもが完食！」「少し味が濃かったので次回は醤油少なめで」など感想を記録"
            value={activeRecord.memo || ''}
            onChange={(e) =>
              updateCurrentRecord((prev) => ({
                ...prev,
                memo: e.target.value,
              }))
            }
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};

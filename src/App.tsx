import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { WeekPlanView } from './components/WeekPlanView';
import { CalendarView } from './components/CalendarView';
import { MenuView } from './components/MenuView';
import { FavoritesView } from './components/FavoritesView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { RecipeSelectModal } from './components/RecipeSelectModal';
import { ShoppingListModal } from './components/ShoppingListModal';
import { InfoModal } from './components/InfoModal';
import type {
  DayId,
  DayMenu,
  ShoppingItem,
  RecipeItem,
  AppSettings,
  DishCategory,
  NavTabType,
  SavedTemplate,
  CalendarRecord,
  DishEntry,
} from './types';
import { DEFAULT_WEEK_DAYS, PRESET_RECIPES } from './data/presetRecipes';
import {
  loadWeekPlan,
  saveWeekPlan,
  loadShoppingItems,
  saveShoppingItems,
  loadCustomRecipes,
  saveCustomRecipes,
  loadAppSettings,
  saveAppSettings,
  applyVisualSettings,
  generateShoppingListFromPlan,
  generateSmartWeekPlan,
  loadSavedTemplates,
  saveUserTemplate,
  deleteUserTemplate,
  loadCalendarRecords,
  saveCalendarRecords,
} from './utils/storage';
import './App.css';

export const App: React.FC = () => {
  // 設定（テーマ・文字サイズ・通知・基本人数）
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings);

  // 全体人数（何人分か）
  const [globalServings, setGlobalServings] = useState<number>(settings.defaultServings || 2);

  // 下部ドックの現在タブ（plan, calendar, menu, favorites, stats, settings）
  const [currentTab, setCurrentTab] = useState<NavTabType>('plan');

  // 一週間献立データ
  const [weekPlan, setWeekPlan] = useState<Record<DayId, DayMenu>>(loadWeekPlan);

  // カレンダー記録データ（日付 YYYY-MM-DD ごとの実績・メモ・メニュー）
  const [calendarRecords, setCalendarRecords] = useState<Record<string, CalendarRecord>>(loadCalendarRecords);

  // 買い物リストデータ
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(loadShoppingItems);

  // ユーザー登録カスタムレシピ
  const [customRecipes, setCustomRecipes] = useState<RecipeItem[]>(loadCustomRecipes);

  // お気に入りテンプレート
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(loadSavedTemplates);

  // モーダル管理
  const [isShoppingOpen, setIsShoppingOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectModalState, setSelectModalState] = useState<{
    isOpen: boolean;
    dayId: DayId;
    slot: 'mainDish' | 'subDish' | 'soupDish' | 'dessertDish';
    currentValue: string;
  }>({
    isOpen: false,
    dayId: 'mon',
    slot: 'mainDish',
    currentValue: '',
  });

  // トースト通知
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // アプリ起動時および設定変更時のスタイル適用（文字サイズ、テーマ）
  useEffect(() => {
    applyVisualSettings(settings);
  }, [settings]);

  // 献立保存
  useEffect(() => {
    saveWeekPlan(weekPlan);
  }, [weekPlan]);

  // カレンダー記録保存
  useEffect(() => {
    saveCalendarRecords(calendarRecords);
  }, [calendarRecords]);

  // 買い物リスト保存
  useEffect(() => {
    saveShoppingItems(shoppingItems);
  }, [shoppingItems]);

  // カスタムレシピ保存
  useEffect(() => {
    saveCustomRecipes(customRecipes);
  }, [customRecipes]);

  // 設定更新ハンドラー
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveAppSettings(newSettings);
    if (newSettings.defaultServings && newSettings.defaultServings !== globalServings) {
      setGlobalServings(newSettings.defaultServings);
    }
    showToast('⚙️ 設定を更新しました');
  };

  // 全レシピ（プリセット＋カスタム）
  const allRecipes = [...customRecipes, ...PRESET_RECIPES];

  // 全曜日のおまかせ一括生成
  const handleRandomizeAll = () => {
    const newPlan = generateSmartWeekPlan();
    setWeekPlan(newPlan);

    // 買い物リスト連動（現在の人数で再計算）
    const newShopping = generateShoppingListFromPlan(newPlan, shoppingItems, globalServings);
    setShoppingItems(newShopping);

    // 紙吹雪演出
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.3 },
      });
    } catch (e) {
      // ignore
    }

    showToast('✨ デザート付き黄金バランス献立を生成しました！');
  };

  // 一つの曜日だけシャッフル
  const handleShuffleDay = (dayId: DayId) => {
    const all = getAllRecipesFromState();
    const mains = all.filter((r) => r.type === 'main');
    const subs = all.filter((r) => r.type === 'sub');
    const soups = all.filter((r) => r.type === 'soup');
    const desserts = all.filter((r) => r.type === 'dessert');

    const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const main = getRandom(mains);
    const sub = getRandom(subs);
    const soup = getRandom(soups);
    const dessert = desserts.length > 0 ? getRandom(desserts) : null;

    const merged = [
      ...main.ingredients,
      ...sub.ingredients,
      ...soup.ingredients.filter((i) => i.name !== '味噌・和風だし'),
      ...(dessert ? dessert.ingredients : []),
    ];
    const unique = merged.filter(
      (item, index, self) => index === self.findIndex((t) => t.name === item.name)
    );

    const targetServings = weekPlan[dayId]?.servings || globalServings;

    const newDishes: DishEntry[] = [
      {
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: main.name,
        type: 'main',
        ingredients: main.ingredients,
        servings: targetServings,
      },
      {
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: sub.name,
        type: 'sub',
        ingredients: sub.ingredients,
        servings: targetServings,
      },
      {
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: soup.name,
        type: 'soup',
        ingredients: soup.ingredients,
        servings: targetServings,
      },
    ];

    if (dessert) {
      newDishes.push({
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: dessert.name,
        type: 'dessert',
        ingredients: dessert.ingredients,
        servings: targetServings,
      });
    }

    setWeekPlan((prev) => {
      const updated = {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          mainDish: main.name,
          subDish: sub.name,
          soupDish: soup.name,
          dessertDish: dessert ? dessert.name : '',
          dishes: newDishes,
          ingredients: unique,
          memo: main.tip || '',
        },
      };
      // 買い物リストも追従更新
      setShoppingItems((s) => generateShoppingListFromPlan(updated, s, globalServings));
      return updated;
    });

    showToast(`🎲 ${weekPlan[dayId].dayLabel}の献立を再抽選しました！`);
  };

  const getAllRecipesFromState = (): RecipeItem[] => {
    return [...customRecipes, ...PRESET_RECIPES];
  };

  // 料理選択モーダルを開く
  const handleOpenSlotSelect = (
    dayId: DayId,
    slot: 'mainDish' | 'subDish' | 'soupDish' | 'dessertDish',
    currentValue: string
  ) => {
    setSelectModalState({
      isOpen: true,
      dayId,
      slot,
      currentValue,
    });
  };

  // 料理選択完了
  const handleSelectRecipe = (recipeName: string, matchedRecipe?: RecipeItem) => {
    const { dayId, slot } = selectModalState;
    const currentDay = weekPlan[dayId];
    if (!currentDay) return;

    let updatedIngredients = [...currentDay.ingredients];

    if (matchedRecipe && matchedRecipe.ingredients.length > 0) {
      matchedRecipe.ingredients.forEach((ing) => {
        if (!updatedIngredients.some((i) => i.name === ing.name)) {
          updatedIngredients.push(ing);
        }
      });
    }

    // dishes配列内の該当スロットも更新
    const slotTypeMap: Record<string, DishCategory> = {
      mainDish: 'main',
      subDish: 'sub',
      soupDish: 'soup',
      dessertDish: 'dessert',
    };
    const targetType = slotTypeMap[slot] || 'main';

    let currentDishes = currentDay.dishes ? [...currentDay.dishes] : [];
    const existingIndex = currentDishes.findIndex((d) => d.type === targetType);

    const newEntry: DishEntry = {
      id: 'dish_' + Math.random().toString(36).substring(2, 9),
      name: recipeName,
      type: targetType,
      ingredients: matchedRecipe?.ingredients,
      servings: currentDay.servings || globalServings,
    };

    if (existingIndex >= 0) {
      currentDishes[existingIndex] = newEntry;
    } else {
      currentDishes.push(newEntry);
    }

    const updatedDay: DayMenu = {
      ...currentDay,
      [slot]: recipeName,
      dishes: currentDishes,
      ingredients: updatedIngredients,
    };

    const newPlan = {
      ...weekPlan,
      [dayId]: updatedDay,
    };

    setWeekPlan(newPlan);
    setShoppingItems((s) => generateShoppingListFromPlan(newPlan, s, globalServings));

    setSelectModalState((prev) => ({ ...prev, isOpen: false }));
    showToast(`🍳 「${recipeName}」に更新しました`);
  };

  // 「今週の献立」をカレンダー（今週の月〜日）に一括コピー反映
  const handleApplyWeekToCalendar = () => {
    const today = new Date();
    // 今週の月曜日の日付を特定
    const currentDayOfWeek = today.getDay(); // 0:日, 1:月 ...
    const distanceToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);

    const dayIds: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const newRecords: Record<string, CalendarRecord> = { ...calendarRecords };

    dayIds.forEach((dId, offset) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + offset);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      const dayPlan = weekPlan[dId];
      if (dayPlan) {
        const dishes = dayPlan.dishes && dayPlan.dishes.length > 0
          ? [...dayPlan.dishes]
          : [
              dayPlan.mainDish && { id: 'd1', name: dayPlan.mainDish, type: 'main' as const },
              dayPlan.subDish && { id: 'd2', name: dayPlan.subDish, type: 'sub' as const },
              dayPlan.soupDish && { id: 'd3', name: dayPlan.soupDish, type: 'soup' as const },
              dayPlan.dessertDish && { id: 'd4', name: dayPlan.dessertDish, type: 'dessert' as const },
            ].filter(Boolean) as DishEntry[];

        newRecords[dateStr] = {
          date: dateStr,
          dishes,
          servings: dayPlan.servings || globalServings,
          memo: dayPlan.memo || '',
          rating: newRecords[dateStr]?.rating || 0,
          cooked: newRecords[dateStr]?.cooked || false,
          updatedAt: Date.now(),
        };
      }
    });

    setCalendarRecords(newRecords);

    try {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.4 } });
    } catch (e) {
      // ignore
    }

    showToast('📅 今週の献立をカレンダーに一括反映しました！');
  };

  // カレンダー記録の個別保存
  const handleSaveCalendarRecord = (dateStr: string, record: CalendarRecord) => {
    setCalendarRecords((prev) => ({
      ...prev,
      [dateStr]: record,
    }));
  };

  // メニュー画面から献立へ直接適用
  const handleApplyDishFromMenu = (
    dishName: string,
    category: DishCategory,
    targetDayId: DayId,
    recipeObj: RecipeItem
  ) => {
    const day = weekPlan[targetDayId];
    if (!day) return;

    const slotKey =
      category === 'main'
        ? 'mainDish'
        : category === 'sub'
        ? 'subDish'
        : category === 'soup'
        ? 'soupDish'
        : 'dessertDish';

    const newDishes = day.dishes ? [...day.dishes] : [];
    newDishes.push({
      id: 'dish_' + Math.random().toString(36).substring(2, 9),
      name: dishName,
      type: category,
      ingredients: recipeObj?.ingredients,
      servings: day.servings || globalServings,
    });

    const recipeIngredients = recipeObj?.ingredients || [];
    const updatedDay: DayMenu = {
      ...day,
      [slotKey]: dishName,
      dishes: newDishes,
      ingredients: [
        ...day.ingredients,
        ...recipeIngredients.filter((i) => !day.ingredients.some((existing) => existing.name === i.name)),
      ],
    };

    const newPlan = {
      ...weekPlan,
      [targetDayId]: updatedDay,
    };

    setWeekPlan(newPlan);
    setShoppingItems((s) => generateShoppingListFromPlan(newPlan, s, globalServings));
    showToast(`🍳 ${day.dayLabel}に「${dishName}」を追加しました！`);
  };

  // カスタムレシピ登録
  const handleAddCustomRecipe = (recipe: RecipeItem) => {
    setCustomRecipes((prev) => [recipe, ...prev]);
    showToast(`🎉 「${recipe.name}」をマイメニューに保存しました！`);
  };

  // カスタムレシピ削除
  const handleDeleteCustomRecipe = (recipeId: string) => {
    setCustomRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    showToast('🗑️ マイメニューから削除しました');
  };

  // カスタムレシピ編集
  const handleEditCustomRecipe = (updated: RecipeItem) => {
    setCustomRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast('✏️ メニューを更新しました');
  };

  // お気に入りテンプレート適用
  const handleApplyTemplate = (template: SavedTemplate) => {
    setWeekPlan(template.days);
    setShoppingItems(generateShoppingListFromPlan(template.days, shoppingItems, globalServings));
    setCurrentTab('plan');
    showToast(`✨ 「${template.title}」を今週の献立に適用しました！`);
  };

  // 現在の献立をお気に入りとして保存
  const handleSaveCurrentAsTemplate = (title: string, desc: string) => {
    const newTemplate: SavedTemplate = {
      id: 'tmpl_' + Math.random().toString(36).substring(2, 9),
      title: title.trim() || 'マイスペシャルセット',
      description: desc.trim() || 'お気に入りの一週間献立',
      days: weekPlan,
      createdAt: Date.now(),
    };
    saveUserTemplate(newTemplate);
    setSavedTemplates(loadSavedTemplates());
    showToast('⭐ お気に入りテンプレートに保存しました！');
  };

  // テンプレート削除
  const handleDeleteTemplate = (id: string) => {
    deleteUserTemplate(id);
    setSavedTemplates(loadSavedTemplates());
    showToast('🗑️ テンプレートを削除しました');
  };

  // ヘッダーからのお気に入り保存
  const handleSaveFavorite = () => {
    const title = prompt('この一週間の献立セットに名前をつけて保存します:', '今週のお気に入り献立');
    if (title) {
      handleSaveCurrentAsTemplate(title, 'ユーザー保存テンプレート');
    }
  };

  // 献立リセット
  const handleResetWeek = () => {
    if (confirm('今週の献立を初期設定に戻しますか？')) {
      setWeekPlan(DEFAULT_WEEK_DAYS);
      setShoppingItems(generateShoppingListFromPlan(DEFAULT_WEEK_DAYS, [], globalServings));
      showToast('🔄 献立をリセットしました');
    }
  };

  // 買い物リストの操作ハンドラー
  const handleToggleShoppingItem = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAddShoppingItem = (
    name: string,
    category: DishCategory | any,
    amount?: number,
    unit?: string
  ) => {
    const newItem: ShoppingItem = {
      id: 'custom_shop_' + Math.random().toString(36).substring(2, 9),
      name,
      category,
      amount,
      unit,
      checked: false,
    };
    setShoppingItems((prev) => [newItem, ...prev]);
    showToast(`🛒 「${name}」を追加しました`);
  };

  const handleDeleteShoppingItem = (id: string) => {
    setShoppingItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCheckedShopping = () => {
    setShoppingItems((prev) => prev.filter((item) => !item.checked));
    showToast('🧹 購入済みアイテムを削除しました');
  };

  const handleSyncShoppingFromMenu = () => {
    const synced = generateShoppingListFromPlan(weekPlan, shoppingItems, globalServings);
    setShoppingItems(synced);
    showToast(`🔄 献立の材料をリスト（${globalServings}人分）に反映しました！`);
  };

  const handleChangeShoppingServings = (newServings: number) => {
    setGlobalServings(newServings);
    const synced = generateShoppingListFromPlan(weekPlan, shoppingItems, newServings);
    setShoppingItems(synced);
    showToast(`👨‍👩‍👧 人数を「${newServings}人分」に再計算しました！`);
  };

  // 工場出荷時リセット
  const handleFactoryReset = () => {
    localStorage.clear();
    setWeekPlan(DEFAULT_WEEK_DAYS);
    setShoppingItems(generateShoppingListFromPlan(DEFAULT_WEEK_DAYS, [], 2));
    setCustomRecipes([]);
    setCalendarRecords({});
    setSavedTemplates(loadSavedTemplates());
    setSettings(loadAppSettings());
    showToast('すべてのデータを初期化しました');
  };

  // データのバックアップ復元（インポート）完了時の反映ハンドラー
  const handleImportSuccess = () => {
    setWeekPlan(loadWeekPlan());
    setShoppingItems(loadShoppingItems());
    setCustomRecipes(loadCustomRecipes());
    setSavedTemplates(loadSavedTemplates());
    setCalendarRecords(loadCalendarRecords());
    const newSettings = loadAppSettings();
    setSettings(newSettings);
    applyVisualSettings(newSettings);
    showToast('📥 データを正常に復元しました！');
  };

  const remainingShoppingCount = shoppingItems.filter((i) => !i.checked).length;

  return (
    <div className="app-wrapper">
      <div className="app-container">
        {/* ヘッダー */}
        <Header
          currentTab={currentTab}
          onRandomizeAll={handleRandomizeAll}
          onSaveFavorite={handleSaveFavorite}
          onResetWeek={handleResetWeek}
        />

        {/* メイン画面（下部ドックで切り替え） */}
        <main className="app-main">
          {/* 1. 一週間献立 */}
          {currentTab === 'plan' && (
            <WeekPlanView
              plan={weekPlan}
              onUpdateDay={(dId, updated) => setWeekPlan((prev) => ({ ...prev, [dId]: updated }))}
              onOpenSlotSelect={handleOpenSlotSelect}
              onShuffleDay={handleShuffleDay}
              onOpenShopping={() => setIsShoppingOpen(true)}
              shoppingCount={remainingShoppingCount}
              allRecipes={allRecipes}
              showToast={showToast}
              globalServings={globalServings}
              onChangeGlobalServings={setGlobalServings}
            />
          )}

          {/* 2. 献立カレンダー（記録・実績・日記） */}
          {currentTab === 'calendar' && (
            <CalendarView
              records={calendarRecords}
              onSaveRecord={handleSaveCalendarRecord}
              currentWeekPlan={weekPlan}
              onApplyWeekToCalendar={handleApplyWeekToCalendar}
              allRecipes={allRecipes}
              showToast={showToast}
            />
          )}

          {/* 3. メニュー（任意登録・管理） */}
          {currentTab === 'menu' && (
            <MenuView
              recipes={allRecipes}
              onAddCustomRecipe={handleAddCustomRecipe}
              onDeleteCustomRecipe={handleDeleteCustomRecipe}
              onEditCustomRecipe={handleEditCustomRecipe}
              onApplyDishToDay={handleApplyDishFromMenu}
            />
          )}

          {/* 4. お気に入りテンプレート */}
          {currentTab === 'favorites' && (
            <FavoritesView
              templates={savedTemplates}
              onApplyTemplate={handleApplyTemplate}
              onSaveCurrentAsTemplate={handleSaveCurrentAsTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              currentPlan={weekPlan}
            />
          )}

          {/* 5. データ（頻度・割合算出） */}
          {currentTab === 'stats' && <StatsView plan={weekPlan} />}

          {/* 6. 設定（通知・画面表示・文字サイズ・データ管理・バックアップ） */}
          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onFactoryReset={handleFactoryReset}
              onOpenPrivacyModal={() => setIsInfoOpen(true)}
              onImportSuccess={handleImportSuccess}
              showToast={showToast}
            />
          )}
        </main>

        {/* 下部ドック（献立、カレンダー、メニュー、テンプレ、設定） */}
        <Navbar currentTab={currentTab} onChangeTab={setCurrentTab} />

        {/* 料理選択モーダル */}
        <RecipeSelectModal
          isOpen={selectModalState.isOpen}
          onClose={() => setSelectModalState((prev) => ({ ...prev, isOpen: false }))}
          dayId={selectModalState.dayId}
          targetSlot={selectModalState.slot}
          currentValue={selectModalState.currentValue}
          recipes={allRecipes}
          onSelectRecipe={handleSelectRecipe}
        />

        {/* 買い物リストモーダル */}
        <ShoppingListModal
          isOpen={isShoppingOpen}
          onClose={() => setIsShoppingOpen(false)}
          items={shoppingItems}
          onToggleItem={handleToggleShoppingItem}
          onAddItem={handleAddShoppingItem}
          onDeleteItem={handleDeleteShoppingItem}
          onClearChecked={handleClearCheckedShopping}
          onSyncFromMenu={handleSyncShoppingFromMenu}
          servings={globalServings}
          onChangeServings={handleChangeShoppingServings}
        />

        {/* プライバシーポリシー・アプリ情報モーダル */}
        <InfoModal
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
          onFactoryReset={handleFactoryReset}
        />

        {/* トースト通知 */}
        {toastMessage && (
          <div className="toast-notification animate-slide-up">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

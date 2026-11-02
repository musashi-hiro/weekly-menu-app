import React, { useState, useEffect, useRef } from 'react';
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
import { RecipeDetailModal } from './components/RecipeDetailModal';
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
  ensureDayDishes,
  loadSavedTemplates,
  saveUserTemplate,
  deleteUserTemplate,
  loadCalendarRecords,
  saveCalendarRecords,
} from './utils/storage';
import './App.css';

const DAY_ORDER: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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
    category: DishCategory;
    currentValue: string;
    targetDishId?: string;
  }>({
    isOpen: false,
    dayId: 'mon',
    category: 'main',
    currentValue: '',
  });

  // 献立・カレンダーから直接レシピ（作り方）を見るモーダル
  const [detailModalState, setDetailModalState] = useState<{
    recipe: RecipeItem | null;
    servings: number;
  }>({
    recipe: null,
    servings: 2,
  });

  // トースト通知
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lastNotifiedKeyRef = useRef<string>('');

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

  // リマインダー通知の定期チェック（設定時刻になったら今日の献立を通知）
  useEffect(() => {
    if (!settings.notifyEnabled || !settings.notifyTime) return;

    const checkNotify = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${hhmm}`;

      if (hhmm === settings.notifyTime && lastNotifiedKeyRef.current !== dateKey) {
        lastNotifiedKeyRef.current = dateKey;
        const dayMap: DayId[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const todayPlan = weekPlan[dayMap[now.getDay()]];
        const menuText = todayPlan?.mainDish
          ? `今日の主菜は「${todayPlan.mainDish}」です！`
          : '今日のお夕食の献立を確認しましょう！';

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('🍳 こんだてウィークリー', {
              body: menuText,
              icon: '/favicon.svg',
            });
          } catch {
            // ignore
          }
        }
        showToast(`🔔 ${menuText}`);
      }
    };

    checkNotify();
    const timer = window.setInterval(checkNotify, 30000);
    return () => window.clearInterval(timer);
  }, [settings.notifyEnabled, settings.notifyTime, weekPlan]);

  // 全レシピ（プリセット＋カスタム）
  const allRecipes = [...customRecipes, ...PRESET_RECIPES];

  // 一つの曜日を更新し、同時に買い物リストも連動更新する共通関数
  const handleUpdateDayAndSync = (dayId: DayId, updatedDay: DayMenu) => {
    const normalizedDay = ensureDayDishes(updatedDay, customRecipes);
    setWeekPlan((prev) => {
      const nextPlan = { ...prev, [dayId]: normalizedDay };
      setShoppingItems((prevShop) =>
        generateShoppingListFromPlan(nextPlan, prevShop, globalServings)
      );
      return nextPlan;
    });
  };

  // 全体の人数を変更し、全曜日と買い物リストに即座に反映する共通関数
  const handleChangeGlobalServings = (newServings: number) => {
    if (newServings < 1 || newServings > 10) return;
    setGlobalServings(newServings);
    setWeekPlan((prev) => {
      const nextPlan = { ...prev };
      DAY_ORDER.forEach((dId) => {
        if (nextPlan[dId]) {
          nextPlan[dId] = ensureDayDishes(
            { ...nextPlan[dId], servings: newServings },
            customRecipes
          );
        }
      });
      setShoppingItems((prevShop) =>
        generateShoppingListFromPlan(nextPlan, prevShop, newServings)
      );
      return nextPlan;
    });
  };

  // 設定更新ハンドラー
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveAppSettings(newSettings);
    if (newSettings.defaultServings && newSettings.defaultServings !== globalServings) {
      handleChangeGlobalServings(newSettings.defaultServings);
    }
    showToast('⚙️ 設定を更新しました');
  };

  // 全曜日のおまかせ一括生成
  const handleRandomizeAll = () => {
    const newPlan = generateSmartWeekPlan(globalServings);
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
    } catch {
      // ignore
    }

    showToast('✨ デザート付き黄金バランス献立を生成しました！');
  };

  // 一つの曜日だけシャッフル
  const handleShuffleDay = (dayId: DayId) => {
    const mains = allRecipes.filter((r) => r.type === 'main');
    const subs = allRecipes.filter((r) => r.type === 'sub');
    const soups = allRecipes.filter((r) => r.type === 'soup');
    const desserts = allRecipes.filter((r) => r.type === 'dessert');

    const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const main = pickRandom(mains);
    const sub = pickRandom(subs);
    const soup = pickRandom(soups);
    const dessert = desserts.length > 0 ? pickRandom(desserts) : null;

    const targetServings = weekPlan[dayId]?.servings || globalServings;
    const stamp = Date.now();

    const newDishes: DishEntry[] = [
      {
        id: `dish_${stamp}_1`,
        name: main.name,
        type: 'main',
        ingredients: main.ingredients,
        servings: targetServings,
      },
      {
        id: `dish_${stamp}_2`,
        name: sub.name,
        type: 'sub',
        ingredients: sub.ingredients,
        servings: targetServings,
      },
      {
        id: `dish_${stamp}_3`,
        name: soup.name,
        type: 'soup',
        ingredients: soup.ingredients,
        servings: targetServings,
      },
    ];

    if (dessert) {
      newDishes.push({
        id: `dish_${stamp}_4`,
        name: dessert.name,
        type: 'dessert',
        ingredients: dessert.ingredients,
        servings: targetServings,
      });
    }

    const updatedDay = ensureDayDishes(
      {
        ...weekPlan[dayId],
        dishes: newDishes,
        servings: targetServings,
        memo: main.tip || '',
      },
      customRecipes
    );

    handleUpdateDayAndSync(dayId, updatedDay);
    showToast(`🎲 ${weekPlan[dayId].dayLabel}の献立を再抽選しました！`);
  };

  // 料理選択モーダルを開く
  const handleOpenSlotSelect = (
    dayId: DayId,
    category: DishCategory,
    currentValue: string,
    targetDishId?: string
  ) => {
    setSelectModalState({
      isOpen: true,
      dayId,
      category,
      currentValue,
      targetDishId,
    });
  };

  // 料理選択完了（選択した dish.id をピンポイントで更新し、古い料理の材料は残さない）
  const handleSelectRecipe = (recipeName: string, matchedRecipe?: RecipeItem) => {
    const { dayId, category, targetDishId } = selectModalState;
    const currentDay = weekPlan[dayId];
    if (!currentDay) return;

    const recipeObj = matchedRecipe || allRecipes.find((r) => r.name === recipeName);
    const currentDishes = currentDay.dishes ? [...currentDay.dishes] : [];

    // targetDishId があればその要素を、なければ同じカテゴリの先頭要素を特定
    let existingIndex = targetDishId
      ? currentDishes.findIndex((d) => d.id === targetDishId)
      : -1;
    if (existingIndex < 0) {
      existingIndex = currentDishes.findIndex((d) => d.type === category);
    }

    const newEntry: DishEntry = {
      id: existingIndex >= 0 ? currentDishes[existingIndex].id : 'dish_' + Date.now(),
      name: recipeName,
      type: recipeObj?.type || category,
      ingredients: recipeObj?.ingredients,
      servings: currentDay.servings || globalServings,
    };

    if (existingIndex >= 0) {
      currentDishes[existingIndex] = newEntry;
    } else {
      currentDishes.push(newEntry);
    }

    const updatedDay = ensureDayDishes(
      {
        ...currentDay,
        dishes: currentDishes,
      },
      customRecipes
    );

    handleUpdateDayAndSync(dayId, updatedDay);
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

    const newRecords: Record<string, CalendarRecord> = { ...calendarRecords };

    DAY_ORDER.forEach((dId, offset) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + offset);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      const dayPlan = weekPlan[dId];
      if (dayPlan) {
        const dishes =
          dayPlan.dishes !== undefined
            ? [...dayPlan.dishes]
            : ([
                dayPlan.mainDish && { id: 'd1', name: dayPlan.mainDish, type: 'main' as const },
                dayPlan.subDish && { id: 'd2', name: dayPlan.subDish, type: 'sub' as const },
                dayPlan.soupDish && { id: 'd3', name: dayPlan.soupDish, type: 'soup' as const },
                dayPlan.dessertDish && { id: 'd4', name: dayPlan.dessertDish, type: 'dessert' as const },
              ].filter(Boolean) as DishEntry[]);

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
    } catch {
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

  // メニュー画面から献立へ直接適用（同じカテゴリの枠があれば置き換え、なければ追加）
  const handleApplyDishFromMenu = (
    dishName: string,
    category: DishCategory,
    targetDayId: DayId,
    recipeObj: RecipeItem
  ) => {
    const day = weekPlan[targetDayId];
    if (!day) return;

    const currentDishes = day.dishes ? [...day.dishes] : [];
    const existingIdx = currentDishes.findIndex((d) => d.type === category);

    const newEntry: DishEntry = {
      id: existingIdx >= 0 ? currentDishes[existingIdx].id : 'dish_' + Date.now(),
      name: dishName,
      type: category,
      ingredients: recipeObj?.ingredients,
      servings: day.servings || globalServings,
    };

    if (existingIdx >= 0) {
      currentDishes[existingIdx] = newEntry;
    } else {
      currentDishes.push(newEntry);
    }

    const updatedDay = ensureDayDishes(
      {
        ...day,
        dishes: currentDishes,
      },
      customRecipes
    );

    handleUpdateDayAndSync(targetDayId, updatedDay);
    showToast(`🍳 ${day.dayLabel}の${recipeObj ? '献立' : 'メニュー'}に「${dishName}」をセットしました！`);
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

  // カスタムレシピ編集（献立に同じ料理が入っていれば材料・分量も連動更新）
  const handleEditCustomRecipe = (updated: RecipeItem) => {
    const nextCustom = customRecipes.map((r) => (r.id === updated.id ? updated : r));
    setCustomRecipes(nextCustom);
    setWeekPlan((prev) => {
      const nextPlan = { ...prev };
      DAY_ORDER.forEach((dId) => {
        if (nextPlan[dId]) {
          nextPlan[dId] = ensureDayDishes(nextPlan[dId], nextCustom);
        }
      });
      setShoppingItems((prevShop) =>
        generateShoppingListFromPlan(nextPlan, prevShop, globalServings)
      );
      return nextPlan;
    });
    showToast('✏️ メニューを更新しました');
  };

  // お気に入りテンプレート適用
  const handleApplyTemplate = (template: SavedTemplate) => {
    const normalizedPlan: Record<DayId, DayMenu> = {} as Record<DayId, DayMenu>;
    DAY_ORDER.forEach((dId) => {
      normalizedPlan[dId] = ensureDayDishes(
        { ...template.days[dId], servings: globalServings },
        customRecipes
      );
    });
    setWeekPlan(normalizedPlan);
    setShoppingItems(generateShoppingListFromPlan(normalizedPlan, shoppingItems, globalServings));
    setCurrentTab('plan');
    showToast(`✨ 「${template.title}」を今週の献立に適用しました！`);
  };

  // 現在の献立をお気に入りとして保存
  const handleSaveCurrentAsTemplate = (title: string, desc: string) => {
    const newTemplate: SavedTemplate = {
      id: 'tmpl_' + Date.now(),
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
      const initialPlan: Record<DayId, DayMenu> = {} as Record<DayId, DayMenu>;
      DAY_ORDER.forEach((dId) => {
        initialPlan[dId] = ensureDayDishes(
          { ...DEFAULT_WEEK_DAYS[dId], servings: globalServings },
          customRecipes
        );
      });
      setWeekPlan(initialPlan);
      setShoppingItems(generateShoppingListFromPlan(initialPlan, [], globalServings));
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
    category: ShoppingItem['category'],
    amount?: number,
    unit?: string
  ) => {
    const newItem: ShoppingItem = {
      id: 'custom_shop_' + Date.now(),
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
    handleChangeGlobalServings(newServings);
    showToast(`👨‍👩‍👧 人数を「${newServings}人分」に再計算しました！`);
  };

  // 工場出荷時リセット
  const handleFactoryReset = () => {
    localStorage.clear();
    const initialPlan = loadWeekPlan();
    setWeekPlan(initialPlan);
    setShoppingItems(generateShoppingListFromPlan(initialPlan, [], 2));
    setCustomRecipes([]);
    setCalendarRecords({});
    setSavedTemplates(loadSavedTemplates());
    setSettings(loadAppSettings());
    setGlobalServings(2);
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
    setGlobalServings(newSettings.defaultServings || 2);
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
              onUpdateDay={handleUpdateDayAndSync}
              onOpenSlotSelect={handleOpenSlotSelect}
              onShuffleDay={handleShuffleDay}
              onOpenShopping={() => setIsShoppingOpen(true)}
              shoppingCount={remainingShoppingCount}
              allRecipes={allRecipes}
              showToast={showToast}
              globalServings={globalServings}
              onChangeGlobalServings={handleChangeGlobalServings}
              onOpenRecipeDetail={(recipe, servings) =>
                setDetailModalState({ recipe, servings })
              }
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
              onOpenRecipeDetail={(recipe, servings) =>
                setDetailModalState({ recipe, servings })
              }
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
              globalServings={globalServings}
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

        {/* 下部ドック（献立、カレンダー、メニュー、テンプレ、分析、設定） */}
        <Navbar currentTab={currentTab} onChangeTab={setCurrentTab} />

        {/* 料理選択モーダル */}
        {selectModalState.isOpen && (
          <RecipeSelectModal
            key={`${selectModalState.dayId}_${selectModalState.category}_${selectModalState.targetDishId || ''}`}
            isOpen={selectModalState.isOpen}
            onClose={() => setSelectModalState((prev) => ({ ...prev, isOpen: false }))}
            dayId={selectModalState.dayId}
            targetCategory={selectModalState.category}
            currentValue={selectModalState.currentValue}
            recipes={allRecipes}
            onSelectRecipe={handleSelectRecipe}
          />
        )}

        {/* 献立・カレンダーからのレシピ（作り方）確認モーダル */}
        <RecipeDetailModal
          recipe={detailModalState.recipe}
          servings={detailModalState.servings}
          onClose={() => setDetailModalState((prev) => ({ ...prev, recipe: null }))}
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

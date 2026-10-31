import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { WeekPlanView } from './components/WeekPlanView';
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
} from './utils/storage';
import './App.css';

export const App: React.FC = () => {
  // 設定（テーマ・文字サイズ・通知）
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings);

  // 下部ドックの現在タブ（plan: 献立, menu: メニュー, favorites: テンプレート, stats: データ, settings: 設定）
  const [currentTab, setCurrentTab] = useState<NavTabType>('plan');

  // 一週間献立データ
  const [weekPlan, setWeekPlan] = useState<Record<DayId, DayMenu>>(loadWeekPlan);

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
    showToast('⚙️ 設定を更新しました');
  };

  // 全レシピ（プリセット＋カスタム）
  const allRecipes = [...customRecipes, ...PRESET_RECIPES];

  // 全曜日のおまかせ一括生成
  const handleRandomizeAll = () => {
    const newPlan = generateSmartWeekPlan();
    setWeekPlan(newPlan);

    // 買い物リスト連動
    const newShopping = generateShoppingListFromPlan(newPlan, shoppingItems);
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
    const mains = allRecipes.filter((r) => r.type === 'main');
    const subs = allRecipes.filter((r) => r.type === 'sub');
    const soups = allRecipes.filter((r) => r.type === 'soup');
    const desserts = allRecipes.filter((r) => r.type === 'dessert');

    const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const randomMain = getRandom(mains);
    const randomSub = getRandom(subs);
    const randomSoup = getRandom(soups);
    const randomDessert = desserts.length > 0 && Math.random() > 0.4 ? getRandom(desserts) : null;

    const day = weekPlan[dayId];
    const newIngredients = [
      ...randomMain.ingredients,
      ...randomSub.ingredients,
      ...randomSoup.ingredients.filter((i) => i.name !== '味噌・和風だし'),
      ...(randomDessert ? randomDessert.ingredients : []),
    ];

    const updatedDay: DayMenu = {
      ...day,
      mainDish: randomMain.name,
      subDish: randomSub.name,
      soupDish: randomSoup.name,
      dessertDish: randomDessert ? randomDessert.name : '',
      ingredients: newIngredients,
      memo: randomMain.tip || day.memo,
    };

    const newPlan = { ...weekPlan, [dayId]: updatedDay };
    setWeekPlan(newPlan);
    setShoppingItems((prev) => generateShoppingListFromPlan(newPlan, prev));
    showToast(`🎲 ${day.dayLabel}の献立を再抽選しました`);
  };

  // 献立リセット
  const handleResetWeek = () => {
    if (confirm('今週の献立を初期の黄金バランスセットに戻しますか？')) {
      setWeekPlan(DEFAULT_WEEK_DAYS);
      setShoppingItems(generateShoppingListFromPlan(DEFAULT_WEEK_DAYS));
      showToast('🔄 献立を初期状態にリセットしました');
    }
  };

  // お気に入り保存（テンプレートタブへ遷移）
  const handleSaveFavorite = () => {
    setCurrentTab('favorites');
    showToast('💡 「今の献立を保存」ボタンからテンプレートに登録できます');
  };

  // 1日の特定スロットの選択モーダルを開く
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

  // 料理の選択決定
  const handleSelectRecipe = (dishName: string, recipeObj?: RecipeItem) => {
    const { dayId, slot } = selectModalState;
    const currentDay = weekPlan[dayId];

    let newIngredients = [...currentDay.ingredients];

    if (recipeObj) {
      recipeObj.ingredients.forEach((newIng) => {
        if (!newIngredients.some((i) => i.name === newIng.name)) {
          newIngredients.push(newIng);
        }
      });
    }

    const updatedDay: DayMenu = {
      ...currentDay,
      [slot]: dishName,
      ingredients: newIngredients,
      memo: recipeObj?.tip || currentDay.memo,
    };

    const newPlan = { ...weekPlan, [dayId]: updatedDay };
    setWeekPlan(newPlan);
    setShoppingItems((prev) => generateShoppingListFromPlan(newPlan, prev));
    showToast(`✅ ${currentDay.dayLabel}に「${dishName}」を設定しました`);
  };

  // メニュー画面から献立へ直接追加
  const handleApplyDishFromMenu = (
    dishName: string,
    category: DishCategory,
    dayId: DayId,
    recipeObj: RecipeItem
  ) => {
    const currentDay = weekPlan[dayId];
    const slotMap: Record<DishCategory, 'mainDish' | 'subDish' | 'soupDish' | 'dessertDish'> = {
      main: 'mainDish',
      sub: 'subDish',
      soup: 'soupDish',
      dessert: 'dessertDish',
    };
    const targetSlot = slotMap[category];

    let newIngredients = [...currentDay.ingredients];
    recipeObj.ingredients.forEach((newIng) => {
      if (!newIngredients.some((i) => i.name === newIng.name)) {
        newIngredients.push(newIng);
      }
    });

    const updatedDay: DayMenu = {
      ...currentDay,
      [targetSlot]: dishName,
      ingredients: newIngredients,
      memo: recipeObj.tip || currentDay.memo,
    };

    const newPlan = { ...weekPlan, [dayId]: updatedDay };
    setWeekPlan(newPlan);
    setShoppingItems((prev) => generateShoppingListFromPlan(newPlan, prev));
    showToast(`📋 ${currentDay.dayLabel}の${category === 'dessert' ? 'デザート' : '献立'}に「${dishName}」をセットしました！`);
  };

  // カスタムレシピ登録
  const handleAddCustomRecipe = (recipe: RecipeItem) => {
    setCustomRecipes((prev) => [recipe, ...prev]);
    showToast(`🍳 「${recipe.name}」を登録しました！`);
  };

  // カスタムレシピ削除
  const handleDeleteCustomRecipe = (id: string) => {
    setCustomRecipes((prev) => prev.filter((r) => r.id !== id));
    showToast('🗑 料理を削除しました');
  };

  // カスタムレシピ編集
  const handleEditCustomRecipe = (updatedRecipe: RecipeItem) => {
    setCustomRecipes((prev) =>
      prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
    );
    showToast(`✏️ 「${updatedRecipe.name}」を更新しました！`);
  };

  // テンプレート適用
  const handleApplyTemplate = (template: SavedTemplate) => {
    setWeekPlan(template.days);
    setShoppingItems(generateShoppingListFromPlan(template.days));
    setCurrentTab('plan');

    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.35 },
      });
    } catch (e) {
      // ignore
    }

    showToast(`⭐ テンプレート「${template.title}」を今週の献立に適用しました！`);
  };

  // テンプレート保存
  const handleSaveCurrentAsTemplate = (title: string, description: string) => {
    const newTemplate: SavedTemplate = {
      id: 'tpl_' + Date.now(),
      title,
      description,
      days: { ...weekPlan },
      createdAt: Date.now(),
    };
    saveUserTemplate(newTemplate);
    setSavedTemplates(loadSavedTemplates());
    showToast(`⭐ 「${title}」をテンプレートに保存しました！`);
  };

  // テンプレート削除
  const handleDeleteTemplate = (id: string) => {
    deleteUserTemplate(id);
    setSavedTemplates(loadSavedTemplates());
    showToast('🗑 テンプレートを削除しました');
  };

  // 買い物リスト操作
  const handleToggleShoppingItem = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAddShoppingItem = (name: string, category: any) => {
    const newItem: ShoppingItem = {
      id: 'custom_' + Date.now(),
      name,
      category,
      checked: false,
    };
    setShoppingItems((prev) => [newItem, ...prev]);
    showToast(`🛒 「${name}」を追加しました`);
  };

  const handleDeleteShoppingItem = (id: string) => {
    setShoppingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCheckedShopping = () => {
    setShoppingItems((prev) => prev.filter((item) => !item.checked));
    showToast('🧹 購入済みアイテムを削除しました');
  };

  const handleSyncShoppingFromMenu = () => {
    const synced = generateShoppingListFromPlan(weekPlan, shoppingItems);
    setShoppingItems(synced);
    showToast('🔄 献立の材料をリストに反映しました！');
  };

  // 工場出荷時リセット
  const handleFactoryReset = () => {
    localStorage.clear();
    setWeekPlan(DEFAULT_WEEK_DAYS);
    setShoppingItems(generateShoppingListFromPlan(DEFAULT_WEEK_DAYS));
    setCustomRecipes([]);
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
            />
          )}

          {/* 2. メニュー（任意登録・管理） */}
          {currentTab === 'menu' && (
            <MenuView
              recipes={allRecipes}
              onAddCustomRecipe={handleAddCustomRecipe}
              onDeleteCustomRecipe={handleDeleteCustomRecipe}
              onEditCustomRecipe={handleEditCustomRecipe}
              onApplyDishToDay={handleApplyDishFromMenu}
            />
          )}

          {/* 3. お気に入りテンプレート */}
          {currentTab === 'favorites' && (
            <FavoritesView
              templates={savedTemplates}
              onApplyTemplate={handleApplyTemplate}
              onSaveCurrentAsTemplate={handleSaveCurrentAsTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              currentPlan={weekPlan}
            />
          )}

          {/* 4. データ（頻度・割合算出） */}
          {currentTab === 'stats' && <StatsView plan={weekPlan} />}

          {/* 5. 設定（通知・画面表示・文字サイズ・データ管理） */}
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

        {/* 下部ドック（5箇所: 献立、メニュー、テンプレ、データ、設定） */}
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

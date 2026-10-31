import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Clock,
  Trash2,
  CalendarPlus,
  Sparkles,
  X,
  ChefHat,
  Pencil,
} from 'lucide-react';
import type { RecipeItem, DishCategory, DayId, IngredientCategory } from '../types';
import { DISH_TYPE_INFO, guessCategory } from '../data/presetRecipes';

interface MenuViewProps {
  recipes: RecipeItem[];
  onAddCustomRecipe: (recipe: RecipeItem) => void;
  onDeleteCustomRecipe: (id: string) => void;
  onEditCustomRecipe: (recipe: RecipeItem) => void;
  onApplyDishToDay: (dishName: string, category: DishCategory, dayId: DayId, recipeObj: RecipeItem) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({
  recipes,
  onAddCustomRecipe,
  onDeleteCustomRecipe,
  onEditCustomRecipe,
  onApplyDishToDay,
}) => {
  const [activeTab, setActiveTab] = useState<DishCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [applySelectRecipe, setApplySelectRecipe] = useState<RecipeItem | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<RecipeItem | null>(null);

  // 新規登録フォーム用State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<DishCategory>('main');
  const [formGenre, setFormGenre] = useState<RecipeItem['genre']>('japanese');
  const [formTime, setFormTime] = useState<number>(15);
  const [formIngredients, setFormIngredients] = useState('');
  const [formTip, setFormTip] = useState('');

  // 編集フォーム用State
  const [editFormName, setEditFormName] = useState('');
  const [editFormType, setEditFormType] = useState<DishCategory>('main');
  const [editFormGenre, setEditFormGenre] = useState<RecipeItem['genre']>('japanese');
  const [editFormTime, setEditFormTime] = useState<number>(15);
  const [editFormIngredients, setEditFormIngredients] = useState('');
  const [editFormTip, setEditFormTip] = useState('');

  // フィルタリング
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchType = activeTab === 'all' || r.type === activeTab;
      const matchSearch =
        searchQuery === '' ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [recipes, activeTab, searchQuery]);

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const ingArray = formIngredients
      .split(/[,、\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        category: guessCategory(name) as IngredientCategory,
      }));

    const newRecipe: RecipeItem = {
      id: 'custom_' + Date.now(),
      name: formName.trim(),
      type: formType,
      genre: formGenre,
      cookTimeMinutes: formTime > 0 ? formTime : undefined,
      ingredients: ingArray,
      tip: formTip.trim(),
      isCustom: true,
      createdAt: Date.now(),
    };

    onAddCustomRecipe(newRecipe);

    // リセット
    setFormName('');
    setFormIngredients('');
    setFormTip('');
    setIsAddModalOpen(false);
  };

  // 編集モーダルを開く
  const handleOpenEdit = (recipe: RecipeItem) => {
    setEditingRecipe(recipe);
    setEditFormName(recipe.name);
    setEditFormType(recipe.type);
    setEditFormGenre(recipe.genre);
    setEditFormTime(recipe.cookTimeMinutes || 15);
    setEditFormIngredients(recipe.ingredients.map((i) => i.name).join('、'));
    setEditFormTip(recipe.tip || '');
  };

  // 編集を保存
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe || !editFormName.trim()) return;

    const ingArray = editFormIngredients
      .split(/[,、\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        category: guessCategory(name) as IngredientCategory,
      }));

    const updatedRecipe: RecipeItem = {
      ...editingRecipe,
      name: editFormName.trim(),
      type: editFormType,
      genre: editFormGenre,
      cookTimeMinutes: editFormTime > 0 ? editFormTime : undefined,
      ingredients: ingArray,
      tip: editFormTip.trim(),
    };

    onEditCustomRecipe(updatedRecipe);
    setEditingRecipe(null);
  };

  const dayList: { id: DayId; label: string }[] = [
    { id: 'mon', label: '月曜' },
    { id: 'tue', label: '火曜' },
    { id: 'wed', label: '水曜' },
    { id: 'thu', label: '木曜' },
    { id: 'fri', label: '金曜' },
    { id: 'sat', label: '土曜' },
    { id: 'sun', label: '日曜' },
  ];

  return (
    <div className="menu-view animate-fade-in">
      {/* 画面ヘッダー */}
      <div className="view-title-card">
        <div className="title-row">
          <div>
            <h2 className="view-main-title">料理メニュー</h2>
            <p className="view-sub-desc">主菜・副菜・汁物・デザートを自由に登録・管理できます</p>
          </div>
          <button className="btn-primary-action" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            <span>料理を登録</span>
          </button>
        </div>

        {/* 検索バー */}
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="料理名や材料で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="icon-btn-xs" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* カテゴリ切り替えタブ */}
        <div className="dock-category-tabs">
          <button
            className={`dock-cat-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>すべて</span>
            <span className="count-pill">{recipes.length}</span>
          </button>
          <button
            className={`dock-cat-tab ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            <span>🥩 主菜</span>
            <span className="count-pill">{recipes.filter((r) => r.type === 'main').length}</span>
          </button>
          <button
            className={`dock-cat-tab ${activeTab === 'sub' ? 'active' : ''}`}
            onClick={() => setActiveTab('sub')}
          >
            <span>🥗 副菜</span>
            <span className="count-pill">{recipes.filter((r) => r.type === 'sub').length}</span>
          </button>
          <button
            className={`dock-cat-tab ${activeTab === 'soup' ? 'active' : ''}`}
            onClick={() => setActiveTab('soup')}
          >
            <span>🍲 汁物</span>
            <span className="count-pill">{recipes.filter((r) => r.type === 'soup').length}</span>
          </button>
          <button
            className={`dock-cat-tab ${activeTab === 'dessert' ? 'active' : ''}`}
            onClick={() => setActiveTab('dessert')}
          >
            <span>🍮 デザート</span>
            <span className="count-pill">{recipes.filter((r) => r.type === 'dessert').length}</span>
          </button>
        </div>
      </div>

      {/* 料理一覧リスト */}
      <div className="recipes-grid">
        {filteredRecipes.length === 0 ? (
          <div className="empty-box">
            <ChefHat size={40} className="empty-icon" />
            <p>料理が見つかりませんでした。</p>
            <button className="btn-secondary-sm" onClick={() => setIsAddModalOpen(true)}>
              この料理を新しく登録する
            </button>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const catInfo = DISH_TYPE_INFO[recipe.type] || DISH_TYPE_INFO.main;

            return (
              <div key={recipe.id} className="recipe-manage-card">
                <div className="recipe-card-top">
                  <div className="recipe-badges">
                    <span
                      className="cat-badge"
                      style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}
                    >
                      {catInfo.icon} {catInfo.label}
                    </span>
                    {recipe.isCustom && <span className="custom-badge">オリジナル</span>}
                  </div>

                  <div className="recipe-actions">
                    <button
                      className="btn-apply-to-day"
                      onClick={() => setApplySelectRecipe(recipe)}
                      title="今週の献立にセット"
                    >
                      <CalendarPlus size={15} />
                      <span>献立へ</span>
                    </button>

                    {recipe.isCustom && (
                      <>
                        <button
                          className="btn-edit-recipe"
                          onClick={() => handleOpenEdit(recipe)}
                          title="編集"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn-delete-recipe"
                          onClick={() => {
                            if (confirm(`「${recipe.name}」を削除しますか？`)) {
                              onDeleteCustomRecipe(recipe.id);
                            }
                          }}
                          title="削除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="recipe-card-title">{recipe.name}</h3>

                {recipe.tip && <p className="recipe-card-tip">{recipe.tip}</p>}

                <div className="recipe-meta-bottom">
                  {recipe.cookTimeMinutes && (
                    <span className="recipe-cook-time">
                      <Clock size={12} /> {recipe.cookTimeMinutes}分
                    </span>
                  )}
                  {recipe.ingredients.length > 0 && (
                    <div className="recipe-ing-tags">
                      {recipe.ingredients.slice(0, 3).map((ing, i) => (
                        <span key={i} className="mini-ing-tag">
                          {ing.name}
                        </span>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <span className="mini-ing-more">+{recipe.ingredients.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 曜日選択ポップアップ */}
      {applySelectRecipe && (
        <div className="modal-backdrop" onClick={() => setApplySelectRecipe(null)}>
          <div
            className="modal-content apply-day-modal animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h4 className="modal-title">どの曜日の献立に入れますか？</h4>
                <p className="modal-subtitle">
                  {applySelectRecipe.name}（{DISH_TYPE_INFO[applySelectRecipe.type].label}）
                </p>
              </div>
              <button className="icon-btn-xs" onClick={() => setApplySelectRecipe(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="day-select-grid">
              {dayList.map((d) => (
                <button
                  key={d.id}
                  className="btn-day-slot"
                  onClick={() => {
                    onApplyDishToDay(
                      applySelectRecipe.name,
                      applySelectRecipe.type,
                      d.id,
                      applySelectRecipe
                    );
                    setApplySelectRecipe(null);
                  }}
                >
                  <span className={`day-avatar day-bg-${d.id}`}>{d.label[0]}</span>
                  <span className="day-name-text">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 料理の新規登録モーダル */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content add-recipe-modal animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Sparkles size={20} className="sparkle-highlight" />
                <h3 className="modal-title">新しい料理を登録</h3>
              </div>
              <button className="icon-btn modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRecipe} className="add-recipe-form">
              {/* 料理名 */}
              <div className="form-field">
                <label className="form-label">料理名 <span className="req">*</span></label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="例: チーズタッカルビ、ガトーショコラ"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* カテゴリ */}
              <div className="form-field">
                <label className="form-label">カテゴリ <span className="req">*</span></label>
                <div className="category-radio-row">
                  {(['main', 'sub', 'soup', 'dessert'] as DishCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`radio-pill ${formType === cat ? 'selected' : ''}`}
                      onClick={() => setFormType(cat)}
                    >
                      {DISH_TYPE_INFO[cat].icon} {DISH_TYPE_INFO[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ジャンル＆調理時間 */}
              <div className="form-row-2">
                <div className="form-field">
                  <label className="form-label">ジャンル</label>
                  <select
                    className="select-input"
                    value={formGenre}
                    onChange={(e) => setFormGenre(e.target.value as any)}
                  >
                    <option value="japanese">🇯🇵 和食</option>
                    <option value="western">🍝 洋食</option>
                    <option value="chinese">🥟 中華</option>
                    <option value="quick">⚡ 時短・簡単</option>
                    <option value="healthy">🥗 ヘルシー</option>
                    <option value="sweet">🍮 スイーツ</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">調理目安（分）</label>
                  <input
                    type="number"
                    className="text-input"
                    min="1"
                    max="180"
                    value={formTime}
                    onChange={(e) => setFormTime(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* 必要な材料 */}
              <div className="form-field">
                <label className="form-label">
                  材料（カンマ「,」で区切って入力）
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="例: 鶏もも肉, キャベツ, チーズ"
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                />
                <span className="field-hint">
                  ※ 入力した材料は「買い物リスト」に自動連動します
                </span>
              </div>

              {/* 調理のコツ・メモ */}
              <div className="form-field">
                <label className="form-label">コツ・ひとことメモ</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="例: コチュジャン多めでピリ辛に！"
                  value={formTip}
                  onChange={(e) => setFormTip(e.target.value)}
                />
              </div>

              <div className="form-bottom-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  キャンセル
                </button>
                <button type="submit" className="btn-submit" disabled={!formName.trim()}>
                  <Plus size={16} />
                  <span>メニューに追加する</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 料理の編集モーダル */}
      {editingRecipe && (
        <div className="modal-backdrop" onClick={() => setEditingRecipe(null)}>
          <div
            className="modal-content add-recipe-modal animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Pencil size={20} className="sparkle-highlight" />
                <h3 className="modal-title">料理を編集</h3>
              </div>
              <button className="icon-btn modal-close-btn" onClick={() => setEditingRecipe(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="add-recipe-form">
              {/* 料理名 */}
              <div className="form-field">
                <label className="form-label">料理名 <span className="req">*</span></label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="例: チーズタッカルビ、ガトーショコラ"
                  value={editFormName}
                  onChange={(e) => setEditFormName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* カテゴリ */}
              <div className="form-field">
                <label className="form-label">カテゴリ <span className="req">*</span></label>
                <div className="category-radio-row">
                  {(['main', 'sub', 'soup', 'dessert'] as DishCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`radio-pill ${editFormType === cat ? 'selected' : ''}`}
                      onClick={() => setEditFormType(cat)}
                    >
                      {DISH_TYPE_INFO[cat].icon} {DISH_TYPE_INFO[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ジャンル＆調理時間 */}
              <div className="form-row-2">
                <div className="form-field">
                  <label className="form-label">ジャンル</label>
                  <select
                    className="select-input"
                    value={editFormGenre}
                    onChange={(e) => setEditFormGenre(e.target.value as any)}
                  >
                    <option value="japanese">🇯🇵 和食</option>
                    <option value="western">🍝 洋食</option>
                    <option value="chinese">🥟 中華</option>
                    <option value="quick">⚡ 時短・簡単</option>
                    <option value="healthy">🥗 ヘルシー</option>
                    <option value="sweet">🍮 スイーツ</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">調理目安（分）</label>
                  <input
                    type="number"
                    className="text-input"
                    min="1"
                    max="180"
                    value={editFormTime}
                    onChange={(e) => setEditFormTime(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* 必要な材料 */}
              <div className="form-field">
                <label className="form-label">
                  材料（カンマ「,」で区切って入力）
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="例: 鶏もも肉, キャベツ, チーズ"
                  value={editFormIngredients}
                  onChange={(e) => setEditFormIngredients(e.target.value)}
                />
                <span className="field-hint">
                  ※ 入力した材料は「買い物リスト」に自動連動します
                </span>
              </div>

              {/* 調理のコツ・メモ */}
              <div className="form-field">
                <label className="form-label">コツ・ひとことメモ</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="例: コチュジャン多めでピリ辛に！"
                  value={editFormTip}
                  onChange={(e) => setEditFormTip(e.target.value)}
                />
              </div>

              <div className="form-bottom-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingRecipe(null)}
                >
                  キャンセル
                </button>
                <button type="submit" className="btn-submit" disabled={!editFormName.trim()}>
                  <Pencil size={16} />
                  <span>変更を保存する</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

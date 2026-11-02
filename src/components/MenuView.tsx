import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Clock,
  X,
  ChefHat,
  ChevronRight,
} from 'lucide-react';
import type { RecipeItem, DishCategory, DayId } from '../types';
import { DISH_TYPE_INFO, GENRE_LABELS, parseIngredientText, formatIngredientWithAmount } from '../data/presetRecipes';
import { RecipeDetailModal } from './RecipeDetailModal';

interface MenuViewProps {
  recipes: RecipeItem[];
  onAddCustomRecipe: (recipe: RecipeItem) => void;
  onDeleteCustomRecipe: (id: string) => void;
  onEditCustomRecipe: (recipe: RecipeItem) => void;
  onApplyDishToDay: (dishName: string, category: DishCategory, dayId: DayId, recipeObj: RecipeItem) => void;
  globalServings?: number;
}

const DAY_LIST: { id: DayId; label: string }[] = [
  { id: 'mon', label: '月曜' },
  { id: 'tue', label: '火曜' },
  { id: 'wed', label: '水曜' },
  { id: 'thu', label: '木曜' },
  { id: 'fri', label: '金曜' },
  { id: 'sat', label: '土曜' },
  { id: 'sun', label: '日曜' },
];

// 登録・編集フォームの入力値
interface RecipeForm {
  name: string;
  type: DishCategory;
  genre: RecipeItem['genre'];
  time: number;
  ingredients: string;
  steps: string;
  tip: string;
}

const EMPTY_FORM: RecipeForm = {
  name: '',
  type: 'main',
  genre: 'japanese',
  time: 15,
  ingredients: '',
  steps: '',
  tip: '',
};

const parseIngredients = (text: string) =>
  text
    .split(/[,、，\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseIngredientText);

const parseSteps = (text: string) =>
  text
    .split('\n')
    .map((s) => s.replace(/^\s*(\d+[.．)）]|[・-])\s*/, '').trim())
    .filter(Boolean);

export const MenuView: React.FC<MenuViewProps> = ({
  recipes,
  onAddCustomRecipe,
  onDeleteCustomRecipe,
  onEditCustomRecipe,
  onApplyDishToDay,
  globalServings = 2,
}) => {
  const [activeTab, setActiveTab] = useState<DishCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailRecipe, setDetailRecipe] = useState<RecipeItem | null>(null);
  const [applySelectRecipe, setApplySelectRecipe] = useState<RecipeItem | null>(null);

  // 登録・編集フォーム（editingId が null なら新規登録）
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecipeForm>(EMPTY_FORM);

  const updateForm = <K extends keyof RecipeForm>(key: K, value: RecipeForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes.filter((r) => {
      const matchType = activeTab === 'all' || r.type === activeTab;
      const matchSearch =
        q === '' ||
        r.name.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [recipes, activeTab, searchQuery]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, name: searchQuery.trim() });
    setIsFormOpen(true);
  };

  const openEdit = (recipe: RecipeItem) => {
    setEditingId(recipe.id);
    setForm({
      name: recipe.name,
      type: recipe.type,
      genre: recipe.genre,
      time: recipe.cookTimeMinutes || 15,
      ingredients: recipe.ingredients.map((i) => formatIngredientWithAmount(i, 2)).join('\n'),
      steps: (recipe.steps || []).join('\n'),
      tip: recipe.tip || '',
    });
    setDetailRecipe(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const base = {
      name: form.name.trim(),
      type: form.type,
      genre: form.genre,
      cookTimeMinutes: form.time > 0 ? form.time : undefined,
      ingredients: parseIngredients(form.ingredients),
      steps: parseSteps(form.steps),
      tip: form.tip.trim(),
    };

    if (editingId) {
      const original = recipes.find((r) => r.id === editingId);
      if (original) onEditCustomRecipe({ ...original, ...base });
    } else {
      onAddCustomRecipe({
        id: 'custom_' + Date.now(),
        ...base,
        isCustom: true,
        createdAt: Date.now(),
      });
    }
    setIsFormOpen(false);
  };

  const tabs: { key: DishCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'main', label: '主菜' },
    { key: 'sub', label: '副菜' },
    { key: 'soup', label: '汁物' },
    { key: 'dessert', label: 'デザート' },
  ];

  return (
    <div className="menu-view animate-fade-in">
      {/* 見出し */}
      <div className="page-head">
        <div>
          <h2 className="page-title">メニューとレシピ</h2>
          <p className="page-desc">料理をタップすると材料と作り方が見られます</p>
        </div>
        <button className="btn-solid" onClick={openCreate}>
          <Plus size={18} />
          <span>登録</span>
        </button>
      </div>

      {/* 検索 */}
      <div className="search-box">
        <Search size={18} className="search-box-icon" />
        <input
          type="text"
          placeholder="料理名・材料で検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-box-clear" onClick={() => setSearchQuery('')} aria-label="検索をクリア">
            <X size={16} />
          </button>
        )}
      </div>

      {/* 分類タブ */}
      <div className="chip-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`chip-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="chip-count">
              {t.key === 'all' ? recipes.length : recipes.filter((r) => r.type === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* 料理一覧 */}
      {filteredRecipes.length === 0 ? (
        <div className="empty-box">
          <ChefHat size={36} className="empty-icon" />
          <p>料理が見つかりませんでした</p>
          <button className="btn-outline-sm" onClick={openCreate}>
            新しく登録する
          </button>
        </div>
      ) : (
        <ul className="recipe-rows">
          {filteredRecipes.map((recipe) => {
            const info = DISH_TYPE_INFO[recipe.type] || DISH_TYPE_INFO.main;
            return (
              <li key={recipe.id}>
                <button className="recipe-row" onClick={() => setDetailRecipe(recipe)}>
                  <span className="recipe-row-bar" style={{ backgroundColor: info.color }} />
                  <span className="recipe-row-body">
                    <span className="recipe-row-name">{recipe.name}</span>
                    <span className="recipe-row-meta">
                      <span style={{ color: info.color, fontWeight: 700 }}>{info.label}</span>
                      {recipe.cookTimeMinutes && (
                        <span className="meta-time">
                          <Clock size={13} />
                          {recipe.cookTimeMinutes}分
                        </span>
                      )}
                      {recipe.steps && recipe.steps.length > 0 && <span className="meta-recipe">レシピあり</span>}
                      {recipe.isCustom && <span className="meta-custom">オリジナル</span>}
                    </span>
                  </span>
                  <ChevronRight size={20} className="recipe-row-arrow" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* レシピ詳細 */}
      <RecipeDetailModal
        recipe={detailRecipe}
        servings={globalServings}
        onClose={() => setDetailRecipe(null)}
        onEdit={openEdit}
        onDelete={onDeleteCustomRecipe}
        onApplyToDay={(r) => setApplySelectRecipe(r)}
      />

      {/* 曜日選択 */}
      {applySelectRecipe && (
        <div className="modal-backdrop" onClick={() => setApplySelectRecipe(null)}>
          <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h4 className="modal-title">どの曜日に入れますか？</h4>
                <p className="modal-subtitle">{applySelectRecipe.name}</p>
              </div>
              <button className="icon-btn-plain" onClick={() => setApplySelectRecipe(null)} aria-label="閉じる">
                <X size={22} />
              </button>
            </div>
            <div className="day-select-grid">
              {DAY_LIST.map((d) => (
                <button
                  key={d.id}
                  className="btn-day-slot"
                  onClick={() => {
                    onApplyDishToDay(applySelectRecipe.name, applySelectRecipe.type, d.id, applySelectRecipe);
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

      {/* 登録・編集フォーム */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? '料理を編集' : '料理を登録'}</h3>
              <button className="icon-btn-plain" onClick={() => setIsFormOpen(false)} aria-label="閉じる">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="add-recipe-form">
              <div className="form-field">
                <label className="form-label">
                  料理名 <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="例: チーズタッカルビ"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">分類</label>
                <div className="category-radio-row">
                  {(['main', 'sub', 'soup', 'dessert'] as DishCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`radio-pill ${form.type === cat ? 'selected' : ''}`}
                      onClick={() => updateForm('type', cat)}
                    >
                      {DISH_TYPE_INFO[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label className="form-label">ジャンル</label>
                  <select
                    className="select-input"
                    value={form.genre}
                    onChange={(e) => updateForm('genre', e.target.value as RecipeItem['genre'])}
                  >
                    {Object.entries(GENRE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">調理時間（分）</label>
                  <input
                    type="number"
                    className="text-input"
                    min="1"
                    max="180"
                    value={form.time}
                    onChange={(e) => updateForm('time', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">材料（2人分基準・1行に1つ）</label>
                <textarea
                  className="text-input textarea"
                  rows={4}
                  placeholder={'鶏もも肉 250g\nキャベツ 0.2玉\nチーズ 80g'}
                  value={form.ingredients}
                  onChange={(e) => updateForm('ingredients', e.target.value)}
                />
                <span className="field-hint">「品名 200g」と書くと、買い物リストで人数に合わせて自動計算されます</span>
              </div>

              <div className="form-field">
                <label className="form-label">作り方（1行に1手順）</label>
                <textarea
                  className="text-input textarea"
                  rows={5}
                  placeholder={'鶏肉を一口大に切る\nキャベツと一緒に炒める\nチーズをのせてフタをする'}
                  value={form.steps}
                  onChange={(e) => updateForm('steps', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">コツ・メモ</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="例: コチュジャン多めでピリ辛に"
                  value={form.tip}
                  onChange={(e) => updateForm('tip', e.target.value)}
                />
              </div>

              <div className="form-bottom-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsFormOpen(false)}>
                  キャンセル
                </button>
                <button type="submit" className="btn-submit" disabled={!form.name.trim()}>
                  {editingId ? '保存する' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

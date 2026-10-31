import React, { useState } from 'react';
import { Play, Trash2, Plus, Heart, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { SavedTemplate, DayId, DayMenu } from '../types';

interface FavoritesViewProps {
  templates: SavedTemplate[];
  onApplyTemplate: (template: SavedTemplate) => void;
  onSaveCurrentAsTemplate: (title: string, description: string) => void;
  onDeleteTemplate: (id: string) => void;
  currentPlan: Record<DayId, DayMenu>;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  templates,
  onApplyTemplate,
  onSaveCurrentAsTemplate,
  onDeleteTemplate,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmApplyId, setConfirmApplyId] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onSaveCurrentAsTemplate(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  const handleApplyConfirm = (tpl: SavedTemplate) => {
    onApplyTemplate(tpl);
    setConfirmApplyId(null);
  };

  const dayKeys: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  return (
    <div className="favorites-view animate-fade-in">
      <div className="favorites-header-card">
        <div className="fav-title-row">
          <div>
            <h2 className="section-title">⭐ お気に入りテンプレート</h2>
            <p className="fav-subtitle">よく作る一週間献立を保存して、ワンタップで今週に呼び出せます</p>
          </div>

          {!isCreating && (
            <button className="btn-primary-sm" onClick={() => setIsCreating(true)}>
              <Plus size={16} />
              <span>今の献立を保存</span>
            </button>
          )}
        </div>

        {/* 新規保存フォーム */}
        {isCreating && (
          <form className="create-template-form animate-slide-up" onSubmit={handleSave}>
            <h4 className="form-subheading">今週の献立をテンプレートに登録</h4>
            <input
              type="text"
              className="text-input"
              placeholder="テンプレート名（例: 我が家の定番ウィーク、節約ヘルシー週間）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              autoFocus
            />
            <input
              type="text"
              className="text-input"
              placeholder="メモ・特徴（例: 魚と豚肉中心、安くて簡単なメニュー）"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="form-actions-row">
              <button type="button" className="btn-secondary-sm" onClick={() => setIsCreating(false)}>
                キャンセル
              </button>
              <button type="submit" className="btn-primary-sm" disabled={!newTitle.trim()}>
                <Heart size={14} />
                <span>保存する</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* テンプレート一覧 */}
      {templates.length === 0 ? (
        <div className="empty-box">
          <Heart size={40} className="empty-icon" />
          <p>テンプレートがまだありません</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            献立を作成してから「今の献立を保存」を押してテンプレートとして登録しましょう
          </p>
        </div>
      ) : (
        <div className="templates-list">
          {templates.map((tpl) => {
            const days = tpl.days;
            const isExpanded = expandedId === tpl.id;

            return (
              <div key={tpl.id} className="template-card">
                <div className="template-header">
                  <div className="template-info">
                    <div className="template-badge-row">
                      {tpl.isPreset ? (
                        <span className="preset-badge">公式おすすめ</span>
                      ) : (
                        <span className="user-badge">マイセット</span>
                      )}
                      <h3 className="template-title">{tpl.title}</h3>
                    </div>
                    {tpl.description && <p className="template-desc">{tpl.description}</p>}
                  </div>

                  <div className="template-action-btns">
                    <button
                      className="apply-template-btn"
                      onClick={() => setConfirmApplyId(tpl.id)}
                      title="今週の献立に適用"
                    >
                      <Play size={15} fill="currentColor" />
                      <span>適用</span>
                    </button>

                    {!tpl.isPreset && (
                      <button
                        className="delete-tpl-btn"
                        onClick={() => {
                          if (confirm(`「${tpl.title}」を削除しますか？`)) {
                            onDeleteTemplate(tpl.id);
                          }
                        }}
                        title="このセットを削除"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 一週間のプレビュー表示 */}
                <div className="template-week-preview">
                  {dayKeys.map((k) => {
                    const d = days[k];
                    if (!d) return null;
                    return (
                      <div key={k} className="preview-day-col">
                        <span className={`preview-day-label day-bg-${k}`}>{d.shortLabel}</span>
                        <span className="preview-main-dish">{d.mainDish || '—'}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 展開ボタン */}
                <button
                  className="template-expand-btn"
                  onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} />
                      <span>詳細を閉じる</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      <span>全品目を表示</span>
                    </>
                  )}
                </button>

                {/* 展開時の全品目表示 */}
                {isExpanded && (
                  <div className="template-detail-grid animate-fade-in">
                    {dayKeys.map((k) => {
                      const d = days[k];
                      if (!d) return null;
                      return (
                        <div key={k} className="template-detail-day">
                          <div className="detail-day-header">
                            <span className={`day-badge-sm day-bg-${k}`}>{d.dayLabel}</span>
                            <span className="detail-day-theme">{d.theme}</span>
                          </div>
                          <div className="detail-dishes">
                            <div className="detail-dish-row">
                              <span className="detail-dish-label">🥩 主菜</span>
                              <span className="detail-dish-name">{d.mainDish || '未設定'}</span>
                            </div>
                            <div className="detail-dish-row">
                              <span className="detail-dish-label">🥗 副菜</span>
                              <span className="detail-dish-name">{d.subDish || '未設定'}</span>
                            </div>
                            <div className="detail-dish-row">
                              <span className="detail-dish-label">🍲 汁物</span>
                              <span className="detail-dish-name">{d.soupDish || '未設定'}</span>
                            </div>
                            {d.dessertDish && (
                              <div className="detail-dish-row">
                                <span className="detail-dish-label">🍮 デザート</span>
                                <span className="detail-dish-name">{d.dessertDish}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 適用確認モーダル */}
      {confirmApplyId && (
        <div className="modal-backdrop" onClick={() => setConfirmApplyId(null)}>
          <div
            className="modal-content apply-confirm-modal animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h4 className="modal-title">テンプレートを適用しますか？</h4>
              <button className="icon-btn-xs" onClick={() => setConfirmApplyId(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="apply-confirm-body">
              <p className="apply-confirm-text">
                現在の一週間献立がこのテンプレートの内容に<strong>上書き</strong>されます。
              </p>
              <div className="apply-confirm-actions">
                <button className="btn-cancel" onClick={() => setConfirmApplyId(null)}>
                  やめる
                </button>
                <button
                  className="btn-submit"
                  onClick={() => {
                    const tpl = templates.find((t) => t.id === confirmApplyId);
                    if (tpl) handleApplyConfirm(tpl);
                  }}
                >
                  <Play size={16} fill="currentColor" />
                  <span>適用する</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

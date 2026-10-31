import React from 'react';
import { Sparkles, RotateCcw, BookmarkPlus } from 'lucide-react';
import type { NavTabType } from '../types';

interface HeaderProps {
  currentTab: NavTabType;
  onRandomizeAll: () => void;
  onSaveFavorite: () => void;
  onResetWeek: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onRandomizeAll,
  onSaveFavorite,
  onResetWeek,
}) => {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="logo-group">
          <div className="logo-badge">🍳</div>
          <div>
            <h1 className="app-title">こんだてウィークリー</h1>
            <p className="app-subtitle">
              {currentTab === 'plan' && '一週間の夕食＆買い物'}
              {currentTab === 'menu' && '料理メニュー登録・管理'}
              {currentTab === 'favorites' && 'お気に入り献立テンプレート'}
              {currentTab === 'stats' && '登場頻度・割合データ分析'}
              {currentTab === 'settings' && '通知・画面表示・文字サイズ設定'}
            </p>
          </div>
        </div>

        {/* 献立タブのときのみクイックアクションを表示 */}
        {currentTab === 'plan' && (
          <div className="header-actions">
            <button
              className="sub-action-btn-compact"
              onClick={onSaveFavorite}
              title="お気に入りに保存"
            >
              <BookmarkPlus size={15} />
              <span>保存</span>
            </button>
            <button
              className="sub-action-btn-compact"
              onClick={onResetWeek}
              title="初期状態に戻す"
            >
              <RotateCcw size={15} />
              <span>リセット</span>
            </button>
          </div>
        )}
      </div>

      {/* 献立タブのときのみ「ぜんぶおまかせ！」ボタンを大きく表示 */}
      {currentTab === 'plan' && (
        <div className="header-plan-banner">
          <button className="primary-action-btn" onClick={onRandomizeAll}>
            <Sparkles size={17} className="sparkle-icon" />
            <span>今週ぜんぶおまかせ！自動提案</span>
          </button>
        </div>
      )}
    </header>
  );
};

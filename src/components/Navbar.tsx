import React from 'react';
import { CalendarDays, CalendarCheck, UtensilsCrossed, Settings, Heart } from 'lucide-react';
import type { NavTabType } from '../types';

interface NavbarProps {
  currentTab: NavTabType;
  onChangeTab: (tab: NavTabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onChangeTab }) => {
  return (
    <nav className="mobile-dock-wrapper" aria-label="メインナビゲーション">
      <div className="mobile-dock-container">
        {/* 1. 一週間献立 */}
        <button
          className={`dock-item ${currentTab === 'plan' ? 'active' : ''}`}
          onClick={() => onChangeTab('plan')}
          aria-label="一週間献立"
        >
          <div className="dock-icon-box">
            <CalendarDays size={20} className="dock-icon" />
          </div>
          <span className="dock-label">献立</span>
        </button>

        {/* 2. カレンダー */}
        <button
          className={`dock-item ${currentTab === 'calendar' ? 'active' : ''}`}
          onClick={() => onChangeTab('calendar')}
          aria-label="献立カレンダー"
        >
          <div className="dock-icon-box">
            <CalendarCheck size={20} className="dock-icon" />
          </div>
          <span className="dock-label">カレンダー</span>
        </button>

        {/* 3. メニュー */}
        <button
          className={`dock-item ${currentTab === 'menu' ? 'active' : ''}`}
          onClick={() => onChangeTab('menu')}
          aria-label="メニュー"
        >
          <div className="dock-icon-box">
            <UtensilsCrossed size={20} className="dock-icon" />
          </div>
          <span className="dock-label">メニュー</span>
        </button>

        {/* 4. お気に入り */}
        <button
          className={`dock-item ${currentTab === 'favorites' ? 'active' : ''}`}
          onClick={() => onChangeTab('favorites')}
          aria-label="お気に入りテンプレ"
        >
          <div className="dock-icon-box">
            <Heart size={20} className="dock-icon" />
          </div>
          <span className="dock-label">テンプレ</span>
        </button>

        {/* 5. 設定・保存 */}
        <button
          className={`dock-item ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => onChangeTab('settings')}
          aria-label="設定とデータ保存"
        >
          <div className="dock-icon-box">
            <Settings size={20} className="dock-icon" />
          </div>
          <span className="dock-label">設定・保存</span>
        </button>
      </div>
    </nav>
  );
};

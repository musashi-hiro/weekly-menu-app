import React, { useMemo } from 'react';
import {
  TrendingUp,
  PieChart,
  Award,
  Calendar,
} from 'lucide-react';
import type { DayId, DayMenu } from '../types';
import { calculateMenuStats } from '../utils/storage';

interface StatsViewProps {
  plan: Record<DayId, DayMenu>;
}

export const StatsView: React.FC<StatsViewProps> = ({ plan }) => {
  const stats = useMemo(() => calculateMenuStats(plan), [plan]);

  const topDish = stats.dishFrequency[0];

  const totalNutrition =
    stats.meatVsFishVsVeg.meat +
    stats.meatVsFishVsVeg.fish +
    stats.meatVsFishVsVeg.veg +
    stats.meatVsFishVsVeg.other;

  const meatPercent = totalNutrition > 0 ? Math.round((stats.meatVsFishVsVeg.meat / totalNutrition) * 100) : 0;
  const fishPercent = totalNutrition > 0 ? Math.round((stats.meatVsFishVsVeg.fish / totalNutrition) * 100) : 0;
  const vegPercent = totalNutrition > 0 ? Math.round((stats.meatVsFishVsVeg.veg / totalNutrition) * 100) : 0;

  const days: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  return (
    <div className="stats-view animate-fade-in">
      {/* 画面ヘッダー */}
      <div className="view-title-card">
        <div className="title-row">
          <div>
            <h2 className="view-main-title">献立データ分析</h2>
            <p className="view-sub-desc">
              メニューの登場頻度や曜日ごとの品数・割合をリアルタイムに算出します
            </p>
          </div>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="stats-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-icon-wrap">🍳</span>
          <div className="kpi-info">
            <span className="kpi-label">今週の総品数</span>
            <span className="kpi-value">{stats.totalDishes} <small>品</small></span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-icon-wrap">👑</span>
          <div className="kpi-info">
            <span className="kpi-label">最多登場メニュー</span>
            <span className="kpi-value-sm">{topDish ? topDish.name : '未集計'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-icon-wrap">🍮</span>
          <div className="kpi-info">
            <span className="kpi-label">デザート登場数</span>
            <span className="kpi-value">{stats.categoryCounts.dessert} <small>回</small></span>
          </div>
        </div>
      </div>

      {/* 1. カテゴリ構成比率（主菜・副菜・汁物・デザート） */}
      <div className="stats-section-card">
        <div className="section-card-header">
          <PieChart size={18} className="header-icon" />
          <h3 className="section-card-title">品目別カテゴリ比率</h3>
        </div>

        <div className="stacked-bar-wrapper">
          <div className="stacked-bar">
            <div
              className="bar-segment bar-main"
              style={{ width: `${stats.categoryPercentages.main}%` }}
              title={`主菜: ${stats.categoryPercentages.main}%`}
            />
            <div
              className="bar-segment bar-sub"
              style={{ width: `${stats.categoryPercentages.sub}%` }}
              title={`副菜: ${stats.categoryPercentages.sub}%`}
            />
            <div
              className="bar-segment bar-soup"
              style={{ width: `${stats.categoryPercentages.soup}%` }}
              title={`汁物: ${stats.categoryPercentages.soup}%`}
            />
            <div
              className="bar-segment bar-dessert"
              style={{ width: `${stats.categoryPercentages.dessert}%` }}
              title={`デザート: ${stats.categoryPercentages.dessert}%`}
            />
          </div>
        </div>

        <div className="category-legend-grid">
          <div className="legend-item">
            <span className="legend-dot dot-main" />
            <span className="legend-label">主菜</span>
            <span className="legend-count">{stats.categoryCounts.main}品 ({stats.categoryPercentages.main}%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-sub" />
            <span className="legend-label">副菜</span>
            <span className="legend-count">{stats.categoryCounts.sub}品 ({stats.categoryPercentages.sub}%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-soup" />
            <span className="legend-label">汁物</span>
            <span className="legend-count">{stats.categoryCounts.soup}品 ({stats.categoryPercentages.soup}%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-dessert" />
            <span className="legend-label">デザート</span>
            <span className="legend-count">{stats.categoryCounts.dessert}品 ({stats.categoryPercentages.dessert}%)</span>
          </div>
        </div>
      </div>

      {/* 2. 肉 vs 魚 vs 野菜の栄養バランス傾向 */}
      <div className="stats-section-card">
        <div className="section-card-header">
          <TrendingUp size={18} className="header-icon" />
          <h3 className="section-card-title">タンパク源・食材バランス</h3>
        </div>

        <div className="nutrition-progress-list">
          <div className="nutrition-row">
            <div className="nutri-label-group">
              <span className="nutri-emoji">🥩</span>
              <span className="nutri-name">お肉メイン</span>
            </div>
            <div className="nutri-bar-bg">
              <div className="nutri-bar-fill bar-fill-meat" style={{ width: `${meatPercent}%` }} />
            </div>
            <span className="nutri-percent">{meatPercent}%</span>
          </div>

          <div className="nutrition-row">
            <div className="nutri-label-group">
              <span className="nutri-emoji">🐟</span>
              <span className="nutri-name">お魚メイン</span>
            </div>
            <div className="nutri-bar-bg">
              <div className="nutri-bar-fill bar-fill-fish" style={{ width: `${fishPercent}%` }} />
            </div>
            <span className="nutri-percent">{fishPercent}%</span>
          </div>

          <div className="nutrition-row">
            <div className="nutri-label-group">
              <span className="nutri-emoji">🥗</span>
              <span className="nutri-name">野菜・大豆</span>
            </div>
            <div className="nutri-bar-bg">
              <div className="nutri-bar-fill bar-fill-veg" style={{ width: `${vegPercent}%` }} />
            </div>
            <span className="nutri-percent">{vegPercent}%</span>
          </div>
        </div>
      </div>

      {/* 3. 登場頻度ランキング */}
      <div className="stats-section-card">
        <div className="section-card-header">
          <Award size={18} className="header-icon" />
          <h3 className="section-card-title">メニュー登場頻度ランキング</h3>
        </div>

        <div className="ranking-list">
          {stats.dishFrequency.slice(0, 6).map((item, idx) => {
            const maxCount = topDish ? topDish.count : 1;
            const barWidth = Math.max(15, Math.round((item.count / maxCount) * 100));

            return (
              <div key={idx} className="ranking-item">
                <span className={`ranking-badge rank-${idx + 1}`}>{idx + 1}</span>
                <div className="ranking-bar-content">
                  <div className="ranking-name-row">
                    <span className="dish-name">{item.name}</span>
                    <span className="dish-count-tag">{item.count}回</span>
                  </div>
                  <div className="ranking-bar-track">
                    <div className="ranking-bar-fill" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 曜日ごとの構成・割合 */}
      <div className="stats-section-card">
        <div className="section-card-header">
          <Calendar size={18} className="header-icon" />
          <h3 className="section-card-title">曜日ごとの献立と品数</h3>
        </div>

        <div className="day-stats-table">
          {days.map((d) => {
            const dayData = stats.dayDishCounts[d];
            if (!dayData) return null;

            return (
              <div key={d} className="day-stat-row">
                <span className={`day-stat-badge day-bg-${d}`}>{dayData.dayLabel[0]}</span>
                <span className="day-stat-label">{dayData.dayLabel}</span>
                <span className="day-stat-main">{dayData.main}</span>
                <span className="day-stat-count-pill">{dayData.count}品</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

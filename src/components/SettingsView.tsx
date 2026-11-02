import React, { useState, useRef } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Type,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Check,
  Users,
} from 'lucide-react';
import type { AppSettings } from '../types';
import { exportAllData, importAllData } from '../utils/storage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onFactoryReset: () => void;
  onOpenPrivacyModal: () => void;
  onImportSuccess?: () => void;
  showToast?: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onFactoryReset,
  onOpenPrivacyModal,
  onImportSuccess,
  showToast,
}) => {
  const [notificationTestStatus, setNotificationTestStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 通知テスト
  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      setNotificationTestStatus('⚠️ お使いのブラウザは通知に対応していません');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('🍳 こんだてウィークリー', {
          body: '今日のお夕食の献立を確認しましょう！',
          icon: '/favicon.svg',
        });
        setNotificationTestStatus('✅ 通知テストを送信しました！');
      } else {
        setNotificationTestStatus('⚠️ ブラウザで通知がブロックされています');
      }
    } catch {
      setNotificationTestStatus('⚠️ 通知の送信に失敗しました');
    }

    setTimeout(() => setNotificationTestStatus(null), 3000);
  };

  // データのエクスポート（バックアップ保存）
  const handleExportData = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `こんだてウィークリー_バックアップ_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) {
      showToast('💾 バックアップファイルを保存しました');
    } else {
      alert('バックアップファイルをダウンロードしました。別のアカウントや端末で復元して引き継げます！');
    }
  };

  // ファイル選択トリガー
  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  // データのインポート（復元）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('バックアップファイルからデータを復元しますか？\n（現在のデータは上書きされます）')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importAllData(content);
        if (result.success) {
          if (onImportSuccess) {
            onImportSuccess();
          } else {
            alert('データを正常に復元しました！');
            window.location.reload();
          }
        } else {
          alert(`⚠️ 復元に失敗しました: ${result.error}`);
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-view animate-fade-in">
      {/* 画面ヘッダー */}
      <div className="view-title-card">
        <div className="title-row">
          <div>
            <h2 className="view-main-title">アプリ設定</h2>
            <p className="view-sub-desc">通知、画面の表示モード、文字サイズを調整できます</p>
          </div>
        </div>
      </div>

      <div className="settings-sections-list">
        {/* 1. 画面表示（カラーテーマ） */}
        <div className="setting-card">
          <div className="setting-card-header">
            <Sun size={18} className="setting-icon" />
            <h3 className="setting-title">画面表示（テーマ）</h3>
          </div>

          <div className="theme-toggle-row">
            <button
              className={`theme-option-btn ${settings.theme === 'light' ? 'selected' : ''}`}
              onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
            >
              <Sun size={20} className="theme-icon light" />
              <div className="theme-text">
                <span className="theme-name">ライトモード</span>
                <span className="theme-desc">明るく清潔感のある食卓</span>
              </div>
              {settings.theme === 'light' && <Check size={18} className="check-icon" />}
            </button>

            <button
              className={`theme-option-btn ${settings.theme === 'dark' ? 'selected' : ''}`}
              onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
            >
              <Moon size={20} className="theme-icon dark" />
              <div className="theme-text">
                <span className="theme-name">ダークモード</span>
                <span className="theme-desc">夜間でも目にやさしい</span>
              </div>
              {settings.theme === 'dark' && <Check size={18} className="check-icon" />}
            </button>
          </div>
        </div>

        {/* 2. 文字の大きさ */}
        <div className="setting-card">
          <div className="setting-card-header">
            <Type size={18} className="setting-icon" />
            <h3 className="setting-title">文字の大きさ</h3>
          </div>
          <p className="setting-desc">
            献立やレシピ、買い物リストの文字サイズを読みやすい大きさに変更します
          </p>

          <div className="font-size-selector-row">
            <button
              className={`font-size-btn ${settings.fontSize === 'sm' ? 'selected' : ''}`}
              onClick={() => onUpdateSettings({ ...settings, fontSize: 'sm' })}
            >
              <span className="font-preview sm">小</span>
              <span className="font-label">コンパクト</span>
            </button>

            <button
              className={`font-size-btn ${settings.fontSize === 'md' ? 'selected' : ''}`}
              onClick={() => onUpdateSettings({ ...settings, fontSize: 'md' })}
            >
              <span className="font-preview md">中</span>
              <span className="font-label">標準（おすすめ）</span>
            </button>

            <button
              className={`font-size-btn ${settings.fontSize === 'lg' ? 'selected' : ''}`}
              onClick={() => onUpdateSettings({ ...settings, fontSize: 'lg' })}
            >
              <span className="font-preview lg">大</span>
              <span className="font-label">大きく見やすい</span>
            </button>
          </div>
        </div>

        {/* 3. 基本の人数設定 */}
        <div className="setting-card">
          <div className="setting-card-header">
            <Users size={18} className="setting-icon" />
            <h3 className="setting-title">基本の人数設定</h3>
          </div>
          <p className="setting-desc">
            献立作成や買い物リストの分量計算で使われる標準の人数です
          </p>

          <div className="servings-setting-row">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                className={`servings-choice-btn ${(settings.defaultServings || 2) === num ? 'selected' : ''}`}
                onClick={() => onUpdateSettings({ ...settings, defaultServings: num })}
              >
                <span>{num}人分</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. 通知設定 */}
        <div className="setting-card">
          <div className="setting-card-header">
            <Bell size={18} className="setting-icon" />
            <h3 className="setting-title">夕食リマインダー通知</h3>
          </div>
          <p className="setting-desc">
            指定した時刻に「今日のお夕食の献立」をお知らせします
          </p>

          <div className="setting-toggle-row">
            <span className="toggle-label">リマインダー通知を受け取る</span>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={settings.notifyEnabled}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, notifyEnabled: e.target.checked })
                }
              />
              <span className="slider-round" />
            </label>
          </div>

          {settings.notifyEnabled && (
            <div className="notify-time-section animate-fade-in">
              <div className="time-select-row">
                <span className="time-label">通知時刻:</span>
                <input
                  type="time"
                  className="time-input"
                  value={settings.notifyTime}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, notifyTime: e.target.value })
                  }
                />
              </div>

              <button className="btn-test-notify" onClick={handleTestNotification}>
                <Bell size={14} />
                <span>通知をテストする</span>
              </button>

              {notificationTestStatus && (
                <p className="notify-status-text">{notificationTestStatus}</p>
              )}
            </div>
          )}
        </div>

        {/* 4. データ管理＆バックアップ */}
        <div className="setting-card">
          <div className="setting-card-header">
            <Smartphone size={18} className="setting-icon" />
            <h3 className="setting-title">データとプライバシー</h3>
          </div>

          <div className="setting-action-list">
            {/* ファイル選択用 input（非表示） */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />

            <button className="setting-row-btn" onClick={handleExportData}>
              <Download size={16} className="btn-icon" />
              <div className="btn-text">
                <span className="btn-main-label">データを書き出し（バックアップ保存）</span>
                <span className="btn-sub-label">献立・レシピ・設定をJSONファイルとして保存します</span>
              </div>
            </button>

            <button className="setting-row-btn" onClick={handleTriggerImport}>
              <Upload size={16} className="btn-icon" />
              <div className="btn-text">
                <span className="btn-main-label">データを復元（バックアップ読み込み）</span>
                <span className="btn-sub-label">保存したファイルからデータを読み込んで復元します</span>
              </div>
            </button>

            <button className="setting-row-btn" onClick={onOpenPrivacyModal}>
              <ShieldCheck size={16} className="btn-icon" />
              <div className="btn-text">
                <span className="btn-main-label">プライバシーポリシー（Google Play用）</span>
                <span className="btn-sub-label">完全ローカル保存・外部送信なしの安全仕様</span>
              </div>
            </button>

            <button
              className="setting-row-btn danger"
              onClick={() => {
                if (
                  confirm(
                    '登録した料理メニューや献立データをすべて初期化しますか？この操作は取り消せません。'
                  )
                ) {
                  onFactoryReset();
                }
              }}
            >
              <RefreshCw size={16} className="btn-icon" />
              <div className="btn-text">
                <span className="btn-main-label">全データを初期化する</span>
                <span className="btn-sub-label">アプリをインストール直後の状態に戻します</span>
              </div>
            </button>
          </div>
        </div>

        <div className="app-version-footer">
          <p>こんだてウィークリー v2.0 (Mobile Web & Android Edition)</p>
          <p className="footer-sub">Google Play 販売可能・ローカルストレージ駆動</p>
        </div>
      </div>
    </div>
  );
};

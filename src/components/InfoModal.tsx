import React, { useState } from 'react';
import { X, ShieldCheck, HelpCircle, Smartphone, Info, RefreshCw } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFactoryReset: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, onFactoryReset }) => {
  const [tab, setTab] = useState<'guide' | 'privacy' | 'about'>('guide');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content info-modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="info-modal-title-wrap">
            <Info size={22} className="info-icon-highlight" />
            <h3 className="modal-title">アプリ情報・サポート</h3>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${tab === 'guide' ? 'active' : ''}`}
            onClick={() => setTab('guide')}
          >
            <HelpCircle size={15} />
            <span>使い方ガイド</span>
          </button>
          <button
            className={`filter-tab ${tab === 'privacy' ? 'active' : ''}`}
            onClick={() => setTab('privacy')}
          >
            <ShieldCheck size={15} />
            <span>プライバシー規約</span>
          </button>
          <button
            className={`filter-tab ${tab === 'about' ? 'active' : ''}`}
            onClick={() => setTab('about')}
          >
            <Smartphone size={15} />
            <span>アプリ詳細</span>
          </button>
        </div>

        <div className="info-body-content">
          {tab === 'guide' && (
            <div className="guide-section">
              <h4 className="guide-heading">💡 かんたん3ステップ</h4>
              <ol className="guide-steps">
                <li>
                  <strong>「今週ぜんぶおまかせ！」をタップ</strong>
                  <p>魚・肉・野菜の栄養バランスを考慮した一週間の献立が一瞬で完成します。</p>
                </li>
                <li>
                  <strong>気に入らない日だけサッと調整</strong>
                  <p>各曜日の「再抽選」や、主菜・副菜・汁物をタップして40種以上の定番レシピからワンタップで変更できます。</p>
                </li>
                <li>
                  <strong>買い物リストへ自動抽出</strong>
                  <p>献立に必要な食材が自動で買い物リストに整理されます。スーパーで買い終わったものからチェックできます。</p>
                </li>
              </ol>

              <h4 className="guide-heading">⭐ お気に入り・セット保存</h4>
              <p className="guide-desc">
                「セット保存」ボタンで、今週の献立をテンプレートとして保存可能。いつでも呼び出して一週間をパッとセットできます。
              </p>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="privacy-section">
              <h4 className="guide-heading">🔒 プライバシーポリシー</h4>
              <p className="privacy-text">
                本アプリ「こんだてウィークリー」は、利用者のプライバシーを最優先に設計されています。
              </p>
              <ul className="privacy-points">
                <li>
                  <strong>完全ローカル動作:</strong>
                  入力された献立データやお買い物リストはすべてお客様の端末内（ローカルストレージ）のみに安全に保存されます。
                </li>
                <li>
                  <strong>外部サーバーへの個人情報送信なし:</strong>
                  インターネット上の外部サーバーへの個人情報や献立データの送信・収集は一切行いません。
                </li>
                <li>
                  <strong>オフライン動作:</strong>
                  電波の届かない地下スーパーや機内モードでも、すべての機能を快適にご利用いただけます。
                </li>
              </ul>
            </div>
          )}

          {tab === 'about' && (
            <div className="about-section">
              <div className="about-app-card">
                <div className="about-logo">🍳</div>
                <h4>こんだてウィークリー</h4>
                <p className="about-version">バージョン 1.0.0 (Google Play Edition)</p>
                <p className="about-desc">
                  毎日の夕食作りの負担を解消し、食卓の楽しさと家事の効率化を両立する一週間献立プランナー。
                </p>
              </div>

              <div className="reset-data-box">
                <h5>データの初期化</h5>
                <p>保存されているすべての献立やお買い物リストを初期状態に戻します。</p>
                <button
                  className="btn-danger-sm"
                  onClick={() => {
                    if (confirm('保存されているすべての献立と買い物リストを初期化しますか？')) {
                      onFactoryReset();
                      onClose();
                    }
                  }}
                >
                  <RefreshCw size={14} />
                  データを初期化する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

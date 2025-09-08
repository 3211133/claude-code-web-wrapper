# Claude Code Web Wrapper - UI/UX設計仕様書

## デザイン原則

### 1. Mobile First
```yaml
設計優先順位:
  1. スマートフォン (320px～414px)
  2. タブレット (768px～1024px) 
  3. デスクトップ (1024px～)

アプローチ:
  - タッチファーストインターフェース
  - 指による操作を前提とした設計
  - スワイプ・ジェスチャーの活用
```

### 2. アクセシビリティファースト
```yaml
WCAG 2.1 AA準拠:
  - 色のコントラスト比 4.5:1以上
  - キーボードナビゲーション対応
  - スクリーンリーダー対応
  - フォーカスインジケータの明確化
```

### 3. パフォーマンス重視
```yaml
読み込み速度:
  - First Contentful Paint < 1.5秒
  - Time to Interactive < 3秒
  - バッテリー使用量の最小化
```

## レイアウト設計

### 画面構成
```
┌─────────────────────────────────┐
│         Header (44px)           │ ← タッチターゲット最小サイズ
├─────────────────────────────────┤
│                                 │
│        Terminal Area            │ ← メインコンテンツ
│      (Dynamic Height)           │
│                                 │
├─────────────────────────────────┤
│    Mobile Toolbar (60px)        │ ← クイックアクション
├─────────────────────────────────┤
│   Virtual Keyboard (240px)      │ ← 必要時のみ表示
├─────────────────────────────────┤
│       Status Bar (32px)         │ ← 接続状態
└─────────────────────────────────┘
```

### ビューポート対応
```css
/* スマートフォン縦向き */
@media (max-width: 414px) and (orientation: portrait) {
  .terminal-area { height: calc(100vh - 176px); }
  .virtual-keyboard { height: 240px; }
  .mobile-toolbar { height: 60px; }
}

/* スマートフォン横向き */
@media (max-width: 896px) and (orientation: landscape) {
  .header { height: 32px; }
  .virtual-keyboard { height: 180px; }
  .status-bar { height: 24px; }
}

/* タブレット */
@media (min-width: 768px) {
  .container { max-width: 1024px; margin: 0 auto; }
  .virtual-keyboard { display: none; } /* 物理キーボード前提 */
}
```

## コンポーネント設計

### Header Component
```yaml
機能:
  - アプリケーションタイトル
  - 接続状態インジケータ
  - 設定・オプションメニュー

デザイン仕様:
  高さ: 44px (最小タッチターゲット)
  背景: グラデーション (#2d2d2d → #1a1a1a)
  テキスト: 16px, medium weight
  アイコン: 24px, 2px stroke

要素配置:
  ┌─[●][●][●]─── Terminal Title ────[⚙][🌙][⛶]─┐
  │  Mac風        中央配置          設定 テーマ 全画面 │
  └────────────────────────────────────────────┘
```

### Terminal Area Component
```yaml
機能:
  - xterm.js ターミナル表示
  - スクロール操作対応
  - テキスト選択・コピー機能

デザイン仕様:
  背景色: #1a1a1a (ダークテーマ) / #ffffff (ライトテーマ)
  フォント: 'SF Mono', 'Monaco', monospace
  フォントサイズ: 14px (モバイル), 16px (デスクトップ)
  行間: 1.4
  パディング: 16px

スクロール:
  - iOS式慣性スクロール
  - スクロールバー非表示 (モバイル)
  - オーバースクロール防止
```

### Mobile Toolbar Component
```yaml
レイアウト:
  ┌─[📁 cd]─[📋 ls]─[📊 git]─[🔨 build]─[⌨️ kbd]┐
  │  よく使うコマンドのクイックアクセス        │
  └─────────────────────────────────────────┘

ボタン仕様:
  サイズ: 60px × 48px (十分なタッチ領域)
  間隔: 4px
  角丸: 8px
  フォント: 12px
  アイコン: 20px
  
インタラクション:
  - タップ: 即座にコマンド実行
  - 長押し: コマンドオプション表示
  - スワイプ: 追加コマンド表示
```

### Virtual Keyboard Component
```yaml
レイアウト構成:
  Row 1: [Tab] [Esc] [↑] [↓] [←] [→] [Home] [End]
  Row 2: [Ctrl+C] [Ctrl+D] [Ctrl+Z] [Ctrl+L] [Clear]
  Row 3: [/] [|] [&] [~] [$] [*] [?] [@]

キー仕様:
  最小サイズ: 44px × 44px
  フォント: 12px, monospace
  角丸: 6px
  押下効果: scale(0.95) + haptic feedback

表示制御:
  - 自動表示: フォーカス時
  - 手動切り替え: ツールバーボタン
  - スワイプで非表示: 下方向スワイプ
```

### Status Bar Component
```yaml
情報表示:
  ┌─🔴 Disconnected ── Session: abc123 ── 14:30 ─┐
  │  接続状態     セッションID      時刻      │
  └────────────────────────────────────────┘

ステータスアイコン:
  🟢 Connected (緑)
  🟡 Connecting (黄)
  🔴 Disconnected (赤)
  ⚡ High Activity (青)

デザイン:
  高さ: 32px
  フォント: 11px
  背景: 半透明 rgba(0,0,0,0.8)
  テキスト: 70%透明度
```

## インタラクション設計

### タッチジェスチャー
```yaml
スワイプジェスチャー:
  - 右スワイプ: 前のコマンド (履歴)
  - 左スワイプ: 次のコマンド (履歴)
  - 上スワイプ: 仮想キーボード表示
  - 下スワイプ: 仮想キーボード非表示
  - 2本指スワイプ: スクロール

タップジェスチャー:
  - シングルタップ: カーソル移動
  - ダブルタップ: 単語選択
  - 3本指タップ: コンテキストメニュー
  - 長押し: テキスト選択モード

ピンチジェスチャー:
  - ピンチアウト: フォントサイズ拡大
  - ピンチイン: フォントサイズ縮小
```

### キーボードショートカット
```yaml
モバイル固有:
  - 音量上+下: Ctrl+C (緊急停止)
  - ホームボタン長押し: コマンドパレット
  - 画面端スワイプ: アプリ切り替え抑制

デスクトップ:
  - Cmd/Ctrl + K: ターミナルクリア
  - Cmd/Ctrl + D: セッション複製
  - Cmd/Ctrl + T: 新しいセッション
  - F11: フルスクリーンモード
```

### フィードバック設計
```yaml
ハプティックフィードバック:
  - 軽いタップ: ボタン押下
  - 中程度の振動: コマンド実行
  - 強い振動: エラー発生

ビジュアルフィードバック:
  - アニメーション時間: 200ms (快適性)
  - イージング: ease-out (自然性)
  - 色変化: 100ms (即座の反応)

オーディオフィードバック:
  - クリック音: オプション設定
  - 通知音: バックグラウンド完了
  - 警告音: エラー・警告時
```

## テーマシステム

### カラーパレット

#### ダークテーマ (デフォルト)
```css
:root[data-theme="dark"] {
  /* 背景 */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #404040;
  
  /* テキスト */
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-muted: #888888;
  
  /* アクセント */
  --accent-primary: #00ff88;    /* 成功・完了 */
  --accent-secondary: #ff6b6b;  /* エラー・警告 */
  --accent-tertiary: #4dabf7;   /* 情報・リンク */
  
  /* ターミナル色 */
  --terminal-black: #2d2d2d;
  --terminal-red: #ff6b6b;
  --terminal-green: #51cf66;
  --terminal-yellow: #ffd43b;
  --terminal-blue: #4dabf7;
  --terminal-magenta: #e64980;
  --terminal-cyan: #22b8cf;
  --terminal-white: #ffffff;
}
```

#### ライトテーマ
```css
:root[data-theme="light"] {
  /* 背景 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  
  /* テキスト */
  --text-primary: #212529;
  --text-secondary: #495057;
  --text-muted: #6c757d;
  
  /* アクセント */
  --accent-primary: #28a745;
  --accent-secondary: #dc3545;
  --accent-tertiary: #007bff;
  
  /* ターミナル色 */
  --terminal-black: #000000;
  --terminal-red: #dc3545;
  --terminal-green: #28a745;
  --terminal-yellow: #ffc107;
  --terminal-blue: #007bff;
  --terminal-magenta: #e83e8c;
  --terminal-cyan: #17a2b8;
  --terminal-white: #212529;
}
```

### アダプティブテーマ
```css
/* システム設定に合わせた自動切り替え */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) { /* ダークテーマ変数 */ }
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme]) { /* ライトテーマ変数 */ }
}

/* 高コントラストモード */
@media (prefers-contrast: high) {
  :root {
    --bg-primary: #000000;
    --text-primary: #ffffff;
    --accent-primary: #00ff00;
  }
}

/* 動作軽減モード */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## レスポンシブデザイン仕様

### ブレイクポイント戦略
```css
/* 1. Small Mobile (iPhone SE) */
@media (max-width: 375px) {
  .terminal-font-size { font-size: 12px; }
  .mobile-toolbar { grid-template-columns: repeat(4, 1fr); }
  .virtual-keyboard { height: 200px; }
}

/* 2. Large Mobile (iPhone Pro) */
@media (min-width: 376px) and (max-width: 414px) {
  .terminal-font-size { font-size: 14px; }
  .mobile-toolbar { grid-template-columns: repeat(5, 1fr); }
}

/* 3. Tablet Portrait */
@media (min-width: 768px) and (max-width: 1024px) {
  .container { padding: 24px; }
  .terminal-font-size { font-size: 16px; }
  .virtual-keyboard { display: none; }
}

/* 4. Desktop */
@media (min-width: 1024px) {
  .container { max-width: 1200px; margin: 0 auto; }
  .mobile-toolbar { display: none; }
  .desktop-shortcuts { display: block; }
}
```

### フレキシブルレイアウト
```css
/* CSS Grid による適応的レイアウト */
.app-container {
  display: grid;
  grid-template-rows: 
    auto              /* header */
    1fr               /* terminal */
    auto              /* toolbar */
    auto              /* keyboard */
    auto;             /* status */
  min-height: 100vh;
}

/* Flexbox による要素配置 */
.mobile-toolbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 4px;
  padding: 8px;
}
```

## アニメーション仕様

### マイクロインタラクション
```css
/* ボタン押下 */
.button {
  transition: transform 0.1s ease-out;
}
.button:active {
  transform: scale(0.95);
}

/* 仮想キーボード表示 */
.virtual-keyboard {
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.virtual-keyboard.show {
  transform: translateY(0);
}

/* 接続状態変化 */
.status-indicator {
  transition: color 0.5s ease;
}
.status-indicator.connecting {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### パフォーマンス考慮
```css
/* GPU加速の活用 */
.animated-element {
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

/* 60fps維持 */
.smooth-animation {
  animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-fill-mode: both;
}
```

## ユーザビリティ指針

### 学習コスト低減
```yaml
直感的操作:
  - 一般的なジェスチャーパターンの採用
  - アイコンと文字の併用表示
  - プログレッシブディスクロージャー

オンボーディング:
  - 初回起動時のクイックツアー
  - ジェスチャーヒントの表示
  - 段階的機能開放
```

### エラー防止・回復
```yaml
エラー防止:
  - 危険なコマンドの確認ダイアログ
  - 入力値の事前検証
  - オートコンプリート機能

エラー回復:
  - Undo/Redo機能
  - セッション自動保存
  - 接続断時の自動再接続
```

### アクセシビリティ
```yaml
視覚:
  - 高コントラスト対応
  - フォントサイズ調整
  - カラーブラインド対応

聴覚:
  - 視覚的フィードバック
  - バイブレーション対応
  - 字幕・通知表示

運動:
  - 大きなタッチターゲット
  - スイッチコントロール対応
  - 音声入力対応
```

---

**更新日**: 2025-01-08  
**バージョン**: 1.0  
**ステータス**: 初版作成
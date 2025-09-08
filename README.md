# Claude Code Web Wrapper

🚀 **モバイル最適化されたClaude Code CLIのWebインターフェース**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-blue)](https://3211133.github.io/claude-code-web-wrapper)
[![Mobile First](https://img.shields.io/badge/Mobile-First-green)](#responsive-design)
[![Modern CSS](https://img.shields.io/badge/CSS-Grid%20%2B%20Flexbox-orange)](#技術スタック)

## 📱 デモページ

**🔗 Live Demo:** [https://3211133.github.io/claude-code-web-wrapper](https://3211133.github.io/claude-code-web-wrapper)

スマートフォン、タブレット、デスクトップで最適化されたレスポンシブデザインを体験できます。

## ✨ 特徴

### 🎯 設計されたUI/UX
- **下から上へのレイアウト**: Y/Nボタン → 入力欄 → モード切り替え → Claude出力表示
- **4つのモード**: Chat, Code, Edit, Tool の機能別インターフェース
- **3行入力エリア**: マルチライン入力に最適化
- **Y/Nボタン**: 確認が必要な場合にスライド表示

### 📱 モバイルファースト
- **タッチ最適化**: 44px以上のタッチターゲット
- **レスポンシブ**: 320px～デスクトップまで対応
- **ジェスチャー対応**: スワイプ、ピンチ操作（準備中）
- **ハプティックフィードバック**: バイブレーション対応

### 🎨 現代的なデザイン
- **CSS Grid**: 柔軟なレスポンシブレイアウト
- **ダーク・ライトテーマ**: システム設定に自動対応
- **スムーズアニメーション**: 快適な画面遷移
- **アクセシビリティ**: WCAG準拠の設計

## 🖥️ スクリーンショット

### モバイル
```
┌─────────────────────────────────┐
│                                 │
│        Claude出力表示枠         │ ← スクロール可能
│                                 │
├─────────────────────────────────┤
│  [💬Chat] [⚡Code] [📝Edit] [🔧Tool] │ ← モード切り替え
├─────────────────────────────────┤
│  ┌─────────────────────────────┐ │
│  │     入力欄 (3行)            │ │ ← マルチライン入力
│  └─────────────────────────────┘ │
├─────────────────────────────────┤
│    [✅Yes] [❌No] [🤔Maybe] [⏹️Cancel]    │ ← 必要時のみ表示
└─────────────────────────────────┘
```

## 🛠️ 技術スタック

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: Grid + Flexbox、CSS Variables
- **Vanilla JavaScript**: 軽量・高速な実装
- **Responsive Design**: Mobile-first アプローチ

### 将来の技術統合
- **WebSocket**: Socket.IO によるリアルタイム通信
- **Node.js**: Express.js + node-pty
- **Claude Code CLI**: 実際のCLI統合
- **PWA**: Service Worker、オフライン対応

## 🚀 クイックスタート

### オンラインでの確認
1. [デモページ](https://3211133.github.io/claude-code-web-wrapper) にアクセス
2. 異なるデバイスサイズで表示を確認
3. モード切り替えや入力機能をテスト

### ローカルでの実行
```bash
# リポジトリをクローン
git clone https://github.com/3211133/claude-code-web-wrapper.git
cd claude-code-web-wrapper

# 静的ファイルサーバーで実行（例：Python）
python -m http.server 8000
# または Node.js の場合
npx serve .

# ブラウザで http://localhost:8000 を開く
```

## 💡 使い方

### 基本操作
1. **入力**: 下部の3行テキストエリアにメッセージを入力
2. **モード選択**: Chat, Code, Edit, Tool から選択
3. **送信**: Enterキーまたは送信ボタンで送信
4. **応答確認**: 必要に応じてY/Nボタンで応答

### キーボードショートカット
- `Enter`: メッセージ送信
- `Shift + Enter`: 改行
- `Cmd/Ctrl + Enter`: 強制送信
- `Cmd/Ctrl + 1-4`: モード切り替え
- `Esc`: Y/Nボタンを非表示

### モード説明
- **💬 Chat**: 通常の会話モード
- **⚡ Code**: コード生成・質問
- **📝 Edit**: ファイル編集操作
- **🔧 Tool**: ツール・機能実行

## 📐 レスポンシブデザイン

### ブレイクポイント
```css
/* Small Mobile */
@media (max-width: 375px)

/* Large Mobile */  
@media (min-width: 376px) and (max-width: 767px)

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px)

/* Desktop */
@media (min-width: 1024px)
```

### 画面サイズ別の最適化
- **320px～**: 最小限の要素、アイコンのみ
- **375px～**: 標準的なモバイル表示
- **768px～**: タブレット最適化、2カラム
- **1024px～**: デスクトップ、最大幅制限

## 🔧 開発・カスタマイズ

### プロジェクト構造
```
claude-code-web-wrapper/
├── index.html          # メインHTMLファイル
├── styles.css          # スタイルシート
├── script.js           # JavaScript機能
├── README.md           # このファイル
└── docs/               # プロジェクト設計文書
    ├── 01_PROJECT_OVERVIEW.md
    ├── 02_SYSTEM_ARCHITECTURE.md
    └── ...
```

### CSS変数でのカスタマイズ
```css
:root {
    --accent-primary: #00ff88;    /* メインカラー */
    --bg-primary: #1a1a1a;        /* 背景色 */
    --spacing-lg: 16px;           /* 余白サイズ */
    --radius-md: 8px;             /* 角丸サイズ */
}
```

## 🎯 ロードマップ

### Phase 1: 基本UI完成 ✅
- [x] HTML構造設計
- [x] CSS Grid レイアウト
- [x] JavaScript デモ機能
- [x] レスポンシブ対応

### Phase 2: バックエンド統合 🚧
- [ ] Node.js + Express サーバー
- [ ] WebSocket 通信実装
- [ ] Claude Code CLI 連携
- [ ] セッション管理

### Phase 3: 高度な機能 📋
- [ ] PWA対応
- [ ] オフライン機能
- [ ] ファイル操作
- [ ] 設定画面

### Phase 4: 本格運用 📋
- [ ] セキュリティ強化
- [ ] パフォーマンス最適化
- [ ] テスト自動化
- [ ] CI/CD構築

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. Fork このリポジトリ
2. Feature ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. Pull Request を作成

## 📄 ライセンス

このプロジェクトは MIT License の下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙋‍♂️ サポート

- **Issues**: [GitHub Issues](https://github.com/3211133/claude-code-web-wrapper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/3211133/claude-code-web-wrapper/discussions)
- **Documentation**: [プロジェクトドキュメント](docs/)

---

**🤖 Built with [Claude Code](https://claude.ai/code)**

モバイルファーストの現代的なWebアプリケーションで、Claude Code CLIの力をどこでも活用しましょう！
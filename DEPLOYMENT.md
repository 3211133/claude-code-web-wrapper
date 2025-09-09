# Claude Code Web Wrapper - デプロイメントガイド

このドキュメントでは、Claude Code Web Wrapper をサーバーで運用するためのセットアップ手順を説明します。

## 🛠️ システム要件

### 必要なソフトウェア
- **Node.js**: v16.0.0 以上 (推奨: v18.x)
- **npm**: v8.0.0 以上
- **PM2**: プロセス管理用 (自動インストール)

### 推奨環境
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **メモリ**: 1GB以上
- **ディスク**: 500MB以上の空き容量
- **ネットワーク**: ポート3000の開放

## 🚀 セットアップ手順

### Step 1: リポジトリのクローン

```bash
# プロジェクトをクローン
git clone https://github.com/3211133/claude-code-web-wrapper.git
cd claude-code-web-wrapper
```

### Step 2: 依存関係のインストール

```bash
# Node.jsパッケージをインストール
npm install

# PM2をグローバルインストール
npm install -g pm2
```

### Step 3: 環境設定

```bash
# 環境設定ファイルをコピー
cp .env.example .env

# 設定を編集（必要に応じて）
nano .env
```

#### 環境変数の説明

```bash
# 実行環境 (development / production)
NODE_ENV=production

# サーバーポート番号
PORT=3000

# セキュリティ用シークレットキー
SESSION_SECRET=your-secure-secret-key-here

# Claude Code CLIパス（オプション）
CLAUDE_CODE_PATH=claude-code

# CORS許可オリジン（カンマ区切り）
CORS_ORIGINS=https://3211133.github.io

# ログ設定
ENABLE_LOGGING=true
LOG_LEVEL=info
```

### Step 4: ログディレクトリ作成

```bash
# ログ保存用ディレクトリを作成
mkdir -p logs
```

### Step 5: アプリケーションの起動

#### 開発環境での起動
```bash
# 通常起動（開発用）
npm start

# または nodemon での自動再起動
npm run dev
```

#### 本番環境での起動（PM2使用）
```bash
# PM2でアプリケーションを起動
pm2 start ecosystem.config.js --env production

# プロセス状態確認
pm2 status

# ログ確認
pm2 logs claude-code-web-wrapper
```

### Step 6: 自動起動設定（オプション）

```bash
# PM2の現在の設定を保存
pm2 save

# 自動起動設定を生成（表示されるコマンドを実行）
pm2 startup

# 例: 表示されるコマンドを sudo で実行
# sudo env PATH=$PATH:/usr/bin /path/to/pm2 startup systemd -u username --hp /home/username
```

## 🔍 動作確認

### ヘルスチェック
```bash
# サーバーの状態確認
curl http://localhost:3000/health

# 正常な応答例
{
  "status": "healthy",
  "timestamp": "2025-09-09T17:04:18.793Z",
  "activeSessions": 0,
  "uptime": 51.294403683
}
```

### セッション情報確認
```bash
# アクティブセッション数確認
curl http://localhost:3000/api/sessions
```

### ポート確認
```bash
# ポート3000でリスニング中か確認
ss -tlnp | grep :3000
```

## 🌐 外部アクセス設定

### ファイアウォール設定（Ubuntu/Debian）
```bash
# ポート3000を開放
sudo ufw allow 3000/tcp
sudo ufw reload
```

### ファイアウォール設定（CentOS/RHEL）
```bash
# ポート3000を開放
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### Nginx リバースプロキシ（推奨）
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 運用・監視

### PM2 管理コマンド
```bash
# プロセス状態確認
pm2 status

# ログリアルタイム表示
pm2 logs claude-code-web-wrapper --lines 50

# アプリケーション再起動
pm2 restart claude-code-web-wrapper

# アプリケーション停止
pm2 stop claude-code-web-wrapper

# アプリケーション削除
pm2 delete claude-code-web-wrapper

# メモリ使用量確認
pm2 monit
```

### ログファイル
- **結合ログ**: `./logs/combined.log`
- **標準出力**: `./logs/out.log`
- **エラーログ**: `./logs/error.log`

### システムリソース確認
```bash
# CPU・メモリ使用量
top -p $(pgrep -f "claude-code-web-wrapper")

# ディスク使用量
du -sh /path/to/claude-code-web-wrapper
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. ポートが既に使用されている
```bash
# ポート3000を使用しているプロセスを確認
sudo lsof -i :3000

# プロセスを終了
sudo kill -9 <PID>
```

#### 2. node-pty のコンパイルエラー
```bash
# ビルドツールをインストール
sudo apt-get install build-essential python3-dev  # Ubuntu/Debian
sudo yum groupinstall "Development Tools" python3-devel  # CentOS/RHEL

# 再インストール
npm rebuild node-pty
```

#### 3. WebSocket 接続エラー
- ファイアウォール設定を確認
- CORS設定（.envファイル）を確認
- ブラウザのデベロッパーツールでエラーをチェック

#### 4. Claude Code CLI が見つからない
- デモモードで動作（正常な動作）
- 実際のClaude Code CLIをインストールする場合は、パスを.envファイルで指定

## 🔄 更新手順

### アプリケーションの更新
```bash
# 最新コードを取得
git pull origin main

# 依存関係を更新
npm install

# PM2で再起動
pm2 restart claude-code-web-wrapper
```

### 自動更新設定
```bash
# PM2でGitフックを使った自動デプロイ
pm2 deploy ecosystem.config.js production setup
pm2 deploy ecosystem.config.js production
```

## 📋 チェックリスト

### デプロイ前確認
- [ ] Node.js v16+ がインストール済み
- [ ] npm パッケージが正常にインストールされた
- [ ] .env ファイルが適切に設定されている
- [ ] ポート3000が開放されている
- [ ] ファイアウォール設定が完了している

### デプロイ後確認
- [ ] PM2でプロセスが正常に起動している
- [ ] ヘルスチェックが成功する
- [ ] WebSocketエンドポイントにアクセス可能
- [ ] ログファイルが正常に出力されている
- [ ] 外部からのアクセスが可能（必要に応じて）

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. **ログファイル**: `./logs/` ディレクトリのログを確認
2. **PM2ログ**: `pm2 logs claude-code-web-wrapper`
3. **システムログ**: `journalctl -u pm2-{username}.service`
4. **GitHub Issues**: [プロジェクトのIssues](https://github.com/3211133/claude-code-web-wrapper/issues)

---

**🤖 Built with [Claude Code](https://claude.ai/code)**

モバイルファーストの現代的なWebアプリケーションで、Claude Code CLIの力をサーバー上で活用しましょう！
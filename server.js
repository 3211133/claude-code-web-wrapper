/**
 * Claude Code Web Wrapper - Backend Server
 * Express.js + Socket.IO + Claude Code CLI Integration
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://3211133.github.io'] 
            : ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:8000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: isDevelopment 
        ? ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:8000']
        : ['https://3211133.github.io'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
if (isDevelopment) {
    // In development, serve the current directory files
    app.use(express.static(__dirname));
}

// Claude Code CLI session management
const sessions = new Map();

class ClaudeCodeSession {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.ptyProcess = null;
        this.isActive = false;
        this.lastActivity = Date.now();
        this.initialize();
    }

    initialize() {
        try {
            // Start Claude Code CLI process
            this.ptyProcess = pty.spawn('claude-code', [], {
                name: 'xterm-color',
                cols: 80,
                rows: 24,
                cwd: process.cwd(),
                env: process.env
            });

            this.ptyProcess.onData((data) => {
                this.handleOutput(data);
            });

            this.ptyProcess.onExit((code, signal) => {
                console.log(`Claude Code process exited with code ${code}, signal ${signal}`);
                this.cleanup();
            });

            this.isActive = true;
            console.log(`Claude Code session ${this.sessionId} initialized`);
            
        } catch (error) {
            console.error(`Failed to initialize Claude Code session ${this.sessionId}:`, error);
            // Fallback to echo mode for development/testing
            this.initializeFallback();
        }
    }

    initializeFallback() {
        console.log(`Using fallback mode for session ${this.sessionId}`);
        this.isActive = true;
        // Simulate Claude Code responses for development
    }

    handleOutput(data) {
        this.lastActivity = Date.now();
        const socket = this.getSocket();
        if (socket) {
            socket.emit('claude-output', {
                type: 'output',
                data: data,
                timestamp: new Date().toISOString()
            });
        }
    }

    sendInput(input, mode = 'chat') {
        this.lastActivity = Date.now();
        
        if (this.ptyProcess && this.isActive) {
            // Send input to Claude Code CLI
            this.ptyProcess.write(input + '\n');
        } else {
            // Fallback: simulate response
            this.simulateResponse(input, mode);
        }
    }

    simulateResponse(input, mode) {
        const socket = this.getSocket();
        if (!socket) return;

        setTimeout(() => {
            let response = this.generateMockResponse(input, mode);
            socket.emit('claude-output', {
                type: 'response',
                data: response,
                timestamp: new Date().toISOString(),
                mode: mode
            });
        }, 500 + Math.random() * 1000); // Simulate processing delay
    }

    generateMockResponse(input, mode) {
        const responses = {
            chat: `I understand you said: "${input}". This is a demo response from the backend server.`,
            code: `// Generated code based on: "${input}"\nfunction example() {\n    console.log("This is demo code");\n    return true;\n}`,
            edit: `Editing request received: "${input}". In a real implementation, this would modify files.`,
            tool: `Tool execution for: "${input}". This would run actual development tools.`
        };
        
        return responses[mode] || responses.chat;
    }

    handleYNAction(action) {
        this.lastActivity = Date.now();
        
        if (this.ptyProcess && this.isActive) {
            // Send Y/N response to Claude Code CLI
            const response = action === 'yes' ? 'y\n' : action === 'no' ? 'n\n' : action + '\n';
            this.ptyProcess.write(response);
        } else {
            // Fallback: simulate acknowledgment
            const socket = this.getSocket();
            if (socket) {
                socket.emit('claude-output', {
                    type: 'acknowledgment',
                    data: `Received ${action} response. Continuing...`,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    getSocket() {
        return io.sockets.sockets.get(this.sessionId);
    }

    cleanup() {
        if (this.ptyProcess) {
            this.ptyProcess.kill();
            this.ptyProcess = null;
        }
        this.isActive = false;
        sessions.delete(this.sessionId);
        console.log(`Claude Code session ${this.sessionId} cleaned up`);
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Create new Claude Code session
    const session = new ClaudeCodeSession(socket.id);
    sessions.set(socket.id, session);

    // Handle user input
    socket.on('user-input', (data) => {
        const { message, mode = 'chat' } = data;
        console.log(`Received input from ${socket.id}: ${message} (mode: ${mode})`);
        
        const session = sessions.get(socket.id);
        if (session) {
            session.sendInput(message, mode);
        }
    });

    // Handle Y/N responses
    socket.on('yn-action', (data) => {
        const { action } = data;
        console.log(`Received Y/N action from ${socket.id}: ${action}`);
        
        const session = sessions.get(socket.id);
        if (session) {
            session.handleYNAction(action);
        }
    });

    // Handle mode changes
    socket.on('mode-change', (data) => {
        const { mode } = data;
        console.log(`Mode changed for ${socket.id}: ${mode}`);
        
        socket.emit('mode-changed', { mode });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        const session = sessions.get(socket.id);
        if (session) {
            session.cleanup();
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        activeSessions: sessions.size,
        uptime: process.uptime()
    });
});

// API endpoint for session info
app.get('/api/sessions', (req, res) => {
    const sessionInfo = Array.from(sessions.entries()).map(([id, session]) => ({
        id,
        isActive: session.isActive,
        lastActivity: session.lastActivity
    }));
    
    res.json({
        total: sessions.size,
        sessions: sessionInfo
    });
});

// Cleanup inactive sessions periodically
setInterval(() => {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes
    
    for (const [sessionId, session] of sessions) {
        if (now - session.lastActivity > timeout) {
            console.log(`Cleaning up inactive session: ${sessionId}`);
            session.cleanup();
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    
    // Clean up all sessions
    for (const [sessionId, session] of sessions) {
        session.cleanup();
    }
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Claude Code Web Wrapper server running on port ${PORT}`);
    console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, server, io };
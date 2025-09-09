/**
 * PM2 Configuration for Claude Code Web Wrapper
 * Production process management
 */

module.exports = {
  apps: [{
    name: 'claude-code-web-wrapper',
    script: 'server.js',
    instances: 1, // Can be increased based on server specs
    exec_mode: 'fork', // Use 'cluster' for multiple instances
    
    // Environment settings
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Auto restart settings
    watch: false, // Set to true for development
    ignore_watch: [
      'node_modules',
      'logs',
      '.git'
    ],
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart on crash
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Memory management
    max_memory_restart: '500M',
    
    // Source control
    post_update: ['npm install', 'echo "Application updated"'],
    
    // Advanced PM2 features
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health check
    health_check_http_url: 'http://localhost:3000/health',
    health_check_max_restart: 3,
    
    // Environment variables from .env file
    env_file: '.env'
  }]
};
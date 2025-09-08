# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code Web Wrapper** - a web application that provides browser-based access to Claude Code CLI, with mobile-first responsive design and touch-optimized interface.

### Core Architecture
- **Frontend**: Mobile-first responsive web app with xterm.js terminal emulation
- **Backend**: Node.js server with WebSocket communication to Claude Code CLI
- **Communication**: Real-time bidirectional WebSocket connection using Socket.IO
- **Target Platform**: Primary focus on mobile browsers (iOS Safari, Android Chrome)

## Project Structure

```
claude-code-web-wrapper/
├── docs/                               # Comprehensive project documentation
│   ├── 01_PROJECT_OVERVIEW.md         # Project goals and requirements
│   ├── 02_SYSTEM_ARCHITECTURE.md      # Technical architecture design
│   ├── 03_TECHNICAL_SPECIFICATIONS.md # Implementation specifications
│   ├── 04_UIUX_DESIGN_SPECIFICATIONS.md # UI/UX and mobile design
│   ├── 05_IMPLEMENTATION_ROADMAP.md   # Development phases and milestones
│   ├── 06_SECURITY_PERFORMANCE_CONSIDERATIONS.md # Security and performance
│   └── 07_TESTING_STRATEGY.md         # Testing approach and strategies
└── .git/                              # Git repository
```

## Key Technologies & Stack

### Frontend Technology Stack
```yaml
Core:
  - HTML5/CSS3/JavaScript (ES6+)
  - xterm.js: Terminal emulation library
  - Socket.IO Client: WebSocket communication
  
UI Framework:
  - Vanilla JS (performance-focused)
  - CSS Grid/Flexbox: Responsive layouts
  - Web APIs: Touch Events, Fullscreen API, Service Workers
  
Build Tools:
  - Webpack/Vite: Module bundling
  - PostCSS: CSS processing
  - ESLint/Prettier: Code quality
```

### Backend Technology Stack
```yaml
Runtime:
  - Node.js 18+
  - Express.js: Web server framework
  - Socket.IO: WebSocket server
  
Core Libraries:
  - node-pty: Pseudo-terminal interface
  - express-session: Session management
  - helmet: Security middleware
  
Development:
  - TypeScript: Type safety
  - nodemon: Development auto-restart
  - jest: Testing framework
```

## Architecture Overview

### System Flow
```
┌─────────────────┐    WebSocket    ┌──────────────────┐    PTY     ┌─────────────┐
│   Web Browser   │ ◄────────────► │   Node.js Server │ ◄─────────► │ Claude Code │
│                 │   (Socket.IO)   │                  │   Process   │     CLI     │
├─────────────────┤                 ├──────────────────┤             └─────────────┘
│ • xterm.js      │                 │ • Express.js     │
│ • Socket.IO     │                 │ • node-pty       │
│ • Mobile UI     │                 │ • Socket.IO      │
└─────────────────┘                 └──────────────────┘
```

### Core Components

#### Frontend Components
- **Terminal Component**: xterm.js integration with mobile optimization
- **Mobile UI Components**: Virtual keyboard, touch controls, gesture handlers
- **Session Management**: Connection state, session persistence, reconnection
- **Theme System**: Dark/light themes with system preference detection

#### Backend Components
- **WebSocket Server**: Real-time communication with clients
- **PTY Manager**: Claude Code process lifecycle management
- **Security Layer**: Input validation, command whitelisting, rate limiting
- **Session Store**: Redis-based session persistence

## Mobile-First Design Principles

### Touch Optimization
- **Minimum Touch Target**: 44px × 44px for all interactive elements
- **Gesture Support**: Swipe navigation, pinch zoom, long press actions
- **Virtual Keyboard**: Custom keyboard with special keys (Ctrl, Alt, Tab, etc.)
- **Haptic Feedback**: Touch feedback for button presses and actions

### Responsive Breakpoints
```css
@media (max-width: 375px)  { /* Small Mobile */ }
@media (min-width: 376px) and (max-width: 414px) { /* Large Mobile */ }
@media (min-width: 768px) and (max-width: 1024px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Basic web terminal with xterm.js
- WebSocket communication with Claude Code
- Core session management

### Phase 2: Mobile Optimization (Weeks 3-4)
- Responsive mobile interface
- Virtual keyboard implementation
- Touch gesture handling
- PWA basic features

### Phase 3: Advanced Features (Weeks 5-6)
- Multi-session support
- File upload/download
- Performance optimization
- Security hardening

### Phase 4: Testing & Production (Weeks 7-8)
- Comprehensive testing suite
- CI/CD pipeline
- Production deployment
- Documentation completion

## Security Considerations

### Input Validation
- **Command Whitelisting**: Only allow approved commands (claude-code, git, npm, etc.)
- **Dangerous Command Detection**: Block potentially harmful commands (rm -rf, sudo, etc.)
- **Input Sanitization**: Validate and sanitize all user inputs
- **Path Restriction**: Limit file system access to approved directories

### Communication Security
- **WebSocket Security**: WSS encryption, CORS validation, authentication
- **Session Management**: Secure session tokens, timeout handling
- **Rate Limiting**: Prevent abuse through request throttling
- **Security Headers**: CSP, HSTS, X-Frame-Options implementation

## Performance Requirements

### Response Time Targets
- **Page Load**: < 3 seconds initial load
- **Key Input Response**: < 50ms for terminal input
- **WebSocket Latency**: < 100ms round-trip time
- **Command Execution**: < 200ms to start execution

### Scalability Targets
- **Concurrent Sessions**: 100+ simultaneous connections
- **Memory Usage**: < 50MB per session
- **CPU Usage**: < 70% average server utilization

## Testing Strategy

### Test Coverage Goals
- **Unit Tests**: > 85% code coverage
- **Integration Tests**: > 70% API and component integration
- **E2E Tests**: > 60% critical user flows
- **Mobile Testing**: iOS Safari, Android Chrome real device testing

### Testing Tools
- **Unit**: Jest for JavaScript/TypeScript testing
- **Integration**: Supertest for API testing, Socket.IO testing
- **E2E**: Playwright for cross-browser testing
- **Performance**: k6 for load testing
- **Security**: OWASP ZAP for security scanning

## Common Development Commands

Since this is primarily a documentation project without implemented code yet, the following commands are planned for the implementation:

### Planned Frontend Commands
```bash
# Development server
npm run dev

# Build production
npm run build

# Testing
npm run test:unit
npm run test:e2e
npm run test:coverage

# Code quality
npm run lint
npm run format
```

### Planned Backend Commands  
```bash
# Start development server
npm run dev:server

# Start production server
npm start

# Run tests
npm run test:integration
npm run test:security

# Database operations
npm run db:migrate
npm run db:seed
```

## Implementation Notes

### Mobile Browser Considerations
- **iOS Safari**: Special handling for viewport meta tag, touch events
- **Android Chrome**: Gesture navigation conflicts, keyboard handling
- **PWA Features**: Service workers, app manifest, offline support
- **Performance**: Battery optimization, minimal CPU usage

### Claude Code Integration
- **Process Management**: Spawn and manage Claude Code CLI processes
- **Input/Output Handling**: Stream terminal I/O through WebSocket
- **Session Isolation**: Each browser session gets isolated CLI instance
- **Resource Cleanup**: Proper cleanup of processes on disconnect

## Future Enhancements

### Planned Features
- **Multi-tab Sessions**: Support for multiple terminal tabs
- **File Manager**: Web-based file browser and editor
- **Collaboration**: Shared sessions for pair programming
- **Extensions**: Plugin system for custom functionality
- **Cloud Sync**: Session and preference synchronization

### Advanced Mobile Features
- **Voice Input**: Speech-to-text for command entry
- **Gesture Shortcuts**: Custom gesture commands
- **Smart Keyboard**: Context-aware key suggestions
- **Offline Mode**: Basic functionality without server connection

---

**Project Status**: Documentation Complete - Implementation Phase Ready
**Last Updated**: 2025-01-08
**Documentation Version**: 1.0
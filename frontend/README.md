# PPM Course Advisor - Frontend

A modern, responsive React application for the Program Pathways Mapper (PPM) Course Advisor system.

## Features

- 🎨 **Modern UI/UX**: Beautiful glassmorphism design with smooth animations
- 📱 **Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices
- ⚡ **Real-time Chat**: Instant messaging with typing indicators and smooth transitions
- 📊 **Progress Tracking**: Visual progress panel with animated collection tracking
- 🔄 **Smart Caching**: Cached responses for improved performance
- 🎭 **Smooth Animations**: Elegant entrance animations and micro-interactions
- ♿ **Accessibility**: Full keyboard navigation and screen reader support
- 🌐 **PWA Ready**: Progressive Web App capabilities for mobile installation

## Technology Stack

- **React 18** - Modern React with hooks and functional components
- **CSS3** - Advanced CSS with animations, gradients, and glassmorphism effects
- **Context API** - State management for API calls and data flow
- **Fetch API** - HTTP client for backend communication
- **PWA** - Progressive Web App features

## Project Structure

```
frontend/
├── public/
│   ├── index.html          # Main HTML template
│   ├── manifest.json       # PWA manifest
│   └── favicon.ico         # App icon
├── src/
│   ├── components/         # React components
│   │   ├── LandingPage.js      # Welcome screen
│   │   ├── ChatInterface.js    # Main chat interface
│   │   ├── MessageList.js      # Message container
│   │   ├── Message.js          # Individual message component
│   │   ├── MessageInput.js     # Input field with send button
│   │   ├── ProgressPanel.js    # Right sidebar progress tracker
│   │   └── TypingIndicator.js  # Animated typing indicator
│   ├── contexts/
│   │   └── ApiContext.js       # API management context
│   ├── styles/             # CSS stylesheets
│   │   ├── App.css             # Global styles and utilities
│   │   ├── LandingPage.css     # Landing page styles
│   │   ├── ChatInterface.css   # Chat interface layout
│   │   ├── Message.css         # Message bubble styles
│   │   ├── MessageInput.css    # Input component styles
│   │   ├── ProgressPanel.css   # Progress tracking styles
│   │   ├── TypingIndicator.css # Typing animation styles
│   │   └── index.css           # Global reset and base styles
│   ├── App.js              # Main app component
│   └── index.js            # React app entry point
└── package.json            # Dependencies and scripts
```

## Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Backend server running on `http://localhost:8000`

### Installation

1. **Clone and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build production bundle
- `npm test` - Run test suite
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run analyze` - Analyze bundle size

## Component Overview

### LandingPage
- **Purpose**: Welcome screen with app introduction
- **Features**: Animated entrance, feature showcase, start button
- **State**: Loading state management, error handling

### ChatInterface
- **Purpose**: Main chat application interface
- **Layout**: Two-column layout with chat and progress panel
- **Features**: Message handling, progress tracking, session management

### MessageList & Message
- **Purpose**: Display conversation history
- **Features**: Typewriter effect, message animations, cached indicators
- **Types**: User messages, assistant responses, error messages

### MessageInput
- **Purpose**: User input with send functionality
- **Features**: Auto-resize textarea, character counter, send button states
- **UX**: Enter to send, Shift+Enter for new line

### ProgressPanel
- **Purpose**: Right sidebar showing collection progress
- **Features**: Bottom-to-top filling animation, completion celebration
- **Visualization**: Progress tower, field status indicators

### TypingIndicator
- **Purpose**: Shows when assistant is responding
- **Animation**: Bouncing dots with pulsing avatar

## Styling Architecture

### Design System
- **Colors**: Purple gradient theme (#667eea to #764ba2)
- **Typography**: Inter font family with various weights
- **Spacing**: Consistent 4px grid system
- **Shadows**: Multi-layered box shadows for depth

### Animation Principles
- **Entrance**: Fade in with slide up effects
- **Interactions**: Hover states with micro-movements
- **Feedback**: Success animations and progress transitions
- **Performance**: CSS transforms for smooth 60fps animations

### Responsive Design
- **Mobile First**: Base styles for mobile devices
- **Breakpoints**: 480px, 768px, 1024px, 1200px
- **Layout**: Stacked layout on mobile, side-by-side on desktop
- **Touch**: Optimized button sizes and touch targets

## API Integration

### Context Pattern
The app uses React Context for API management:

```javascript
const api = useApi();

// Create new chat session
const response = await api.createSession();

// Send message
const result = await api.sendMessage(chatId, message);

// Get progress
const progress = await api.getCollectedInfo(chatId);
```

### Error Handling
- **Network Errors**: Graceful fallback with retry options
- **API Errors**: User-friendly error messages
- **Loading States**: Visual feedback during operations

## Performance Optimizations

### Code Splitting
- Dynamic imports for large components
- Route-based code splitting

### Asset Optimization
- Image lazy loading
- Font preloading
- Critical CSS inlining

### Runtime Performance
- React.memo for expensive components
- useCallback for event handlers
- Efficient re-renders with proper dependencies

## PWA Features

### Installation
- Add to home screen prompts
- Custom app icons and splash screens
- Standalone app experience

### Offline Support
- Service worker for caching
- Offline fallback pages
- Background sync capabilities

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+
- **Features**: CSS Grid, Flexbox, CSS Custom Properties
- **Fallbacks**: Graceful degradation for older browsers

## Deployment

### Build Process
```bash
npm run build
```

Creates optimized production build in `build/` directory.

### Environment Variables
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)
- `REACT_APP_VERSION` - App version for display

### Static Hosting
Deploy the `build/` folder to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## Development Guidelines

### Code Style
- **ESLint**: Airbnb configuration with React rules
- **Prettier**: Code formatting with 2-space indentation
- **Naming**: camelCase for variables, PascalCase for components

### Component Guidelines
- **Functional Components**: Use hooks instead of class components
- **Props**: Destructure props in function parameters
- **State**: Use useState and useEffect hooks appropriately
- **Performance**: Avoid unnecessary re-renders

### CSS Guidelines
- **BEM Methodology**: Block-Element-Modifier naming
- **Custom Properties**: Use CSS variables for theming
- **Mobile First**: Start with mobile styles, add desktop enhancements
- **Animations**: Use transform and opacity for smooth animations

## Testing

### Unit Tests
- Component rendering tests
- User interaction tests
- API integration tests

### Integration Tests
- End-to-end user flows
- Cross-browser compatibility
- Responsive design testing

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Review Checklist
- [ ] Components are properly documented
- [ ] Responsive design works on all breakpoints
- [ ] Animations are smooth and purposeful
- [ ] Accessibility standards are met
- [ ] Performance impact is minimal

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**dixisouls** - [GitHub Profile](https://github.com/dixisouls)

---

*Built with ❤️ using React and modern web technologies*
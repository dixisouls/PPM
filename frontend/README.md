# PPM React Frontend

Modern React frontend for the Program Pathways Mapper (PPM) application. Features a **real-time chat interface**, **animated progress tracking**, and **responsive design** built with the latest React patterns and best practices.

## 🚀 Key Features

### User Experience
- **Real-time Chat Interface**: Smooth messaging with typing indicators and animations
- **Progress Tracking**: Live sidebar showing information collection progress
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Modern Animations**: Framer Motion powered transitions and micro-interactions

### Technical Features
- **React 18**: Latest React with Concurrent Features and modern hooks
- **TypeScript Ready**: Full type safety support (easily configurable)
- **Optimized Performance**: Code splitting, lazy loading, and efficient re-renders
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Error Boundaries**: Graceful error handling and recovery

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │───▶│   Services      │───▶│   Backend API   │
│   (UI Layer)    │    │   (API Layer)   │    │   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       │
┌─────────────────┐              │
│   State Mgmt    │              │
│   (React Hooks) │              │
└─────────────────┘              │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Styling       │    │   Utilities     │
│   (Tailwind)    │    │   (Formatters)  │
└─────────────────┘    └─────────────────┘
```

## 📦 Installation

### Prerequisites
```bash
# Node.js 18+ (LTS recommended)
node --version
npm --version

# Or use Yarn
yarn --version
```

### Local Development Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
yarn install

# Set environment variables (optional)
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local

# Start development server
npm start
# or  
yarn start

# Open browser to http://localhost:3000
```

### Docker Development
```bash
# Build development image
docker build -t ppm-frontend:dev .

# Run with docker-compose (recommended)
cd ..  # Back to root
docker-compose up frontend -d
```

## 🔧 Configuration

### Environment Variables
```bash
# .env.local (development)
REACT_APP_API_URL=http://localhost:8000
GENERATE_SOURCEMAP=true
REACT_APP_LOG_LEVEL=debug

# .env.production (production)
REACT_APP_API_URL=https://api.yourdomain.com
GENERATE_SOURCEMAP=false
REACT_APP_LOG_LEVEL=error
```

### Build Configuration
```javascript
// package.json scripts
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build", 
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

## 📁 Project Structure

```
frontend/
├── README.md                    # This documentation
├── package.json                 # Dependencies & scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── Dockerfile                   # Container configuration
├── nginx.conf                   # Production web server config
├── public/
│   ├── index.html              # HTML template
│   ├── manifest.json           # PWA configuration
│   └── favicon.ico             # App icon
├── src/
│   ├── index.js                # Application entry point
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # Global styles
│   ├── index.css               # Tailwind imports
│   ├── components/             # Reusable UI components
│   │   ├── StartScreen.jsx     # Landing page component
│   │   ├── ChatInterface.jsx   # Main chat container
│   │   ├── Message.jsx         # Individual message component
│   │   ├── ChatInput.jsx       # Message input component
│   │   ├── CollectedInfo.jsx   # Progress sidebar component
│   │   ├── TypingIndicator.jsx # Typing animation component
│   │   └── TypingAnimation.jsx # Text animation utility
│   ├── services/               # API integration
│   │   └── api.js             # Axios HTTP client
│   └── utils/                  # Helper utilities
│       └── markdownFormatter.js # Message formatting
└── build/                      # Production build output (generated)
```

## 🎨 UI Components

### Core Components

#### StartScreen
```jsx
// Landing page with start chat functionality
<StartScreen 
  onStartChat={handleStartChat}
  error={error}
  isLoading={isLoading}
/>
```

#### ChatInterface  
```jsx
// Main chat container with sidebar
<ChatInterface
  chatId={sessionId}
  onEndChat={handleEndChat}
  initialMessage="Welcome message"
/>
```

#### Message
```jsx
// Individual chat message with animations
<Message
  message={text}
  isUser={false}
  timestamp={timestamp}
  isCached={false}
  showTypingAnimation={true}
/>
```

#### CollectedInfo
```jsx
// Progress tracking sidebar
<CollectedInfo
  collectedInfo={data}
  completionStatus={status}
  className="custom-styles"
/>
```

### Component Patterns

#### Custom Hooks
```jsx
// useMarkdownTyping hook for text animation
const { displayedText, isComplete } = useMarkdownTyping(
  text, 
  speed, 
  onComplete
);

// API integration patterns
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await chatAPI.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [dependency]);
```

#### Error Boundaries
```jsx
// ErrorBoundary component (recommended addition)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## 🎯 Styling System

### Tailwind CSS Setup
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-right': 'slideInRight 0.4s ease-out'
      }
    }
  }
};
```

### Component Classes
```css
/* src/index.css - Utility classes */
@layer components {
  .chat-bubble-user {
    @apply bg-primary-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs ml-auto;
  }
  
  .chat-bubble-assistant {
    @apply bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-sm shadow-soft border border-gray-100;
  }
  
  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105;
  }
}
```

### Animation System
```jsx
// Framer Motion patterns
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300 }
  }
};

// Usage in components
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

## 🌐 API Integration

### Service Layer
```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 240000,
  headers: { 'Content-Type': 'application/json' }
});

// Request/Response interceptors
api.interceptors.request.use(config => {
  console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.detail || 'Network error';
    throw new Error(message);
  }
);

// API methods
export const chatAPI = {
  createSession: () => api.post('/chat/sessions'),
  sendMessage: (chatId, message) => 
    api.post(`/chat/sessions/${chatId}/messages`, { message }),
  getHistory: (chatId) => 
    api.get(`/chat/sessions/${chatId}/messages`),
  closeSession: (chatId) => 
    api.delete(`/chat/sessions/${chatId}`)
};
```

### Error Handling
```jsx
// Component error handling pattern
const ChatInterface = () => {
  const [error, setError] = useState(null);
  
  const handleSendMessage = async (message) => {
    try {
      setError(null);
      const response = await chatAPI.sendMessage(chatId, message);
      // Handle success
    } catch (err) {
      setError(err.message);
      // Show error message to user
    }
  };

  return (
    <div>
      {error && (
        <motion.div 
          className="bg-red-50 border border-red-200 p-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}
      {/* Rest of component */}
    </div>
  );
};
```

## 🧪 Development Practices

### Code Quality Tools
```bash
# Install development dependencies
npm install --save-dev eslint prettier husky lint-staged

# ESLint configuration (.eslintrc.js)
module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn'
  }
};

# Prettier configuration (.prettierrc)
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}

# Pre-commit hooks (package.json)
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "src/**/*.{js,jsx}": ["eslint --fix", "prettier --write"]
  }
}
```

### Testing Setup
```bash
# Install testing utilities
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Example test (src/components/__tests__/Message.test.js)
import { render, screen } from '@testing-library/react';
import Message from '../Message';

test('renders user message correctly', () => {
  render(
    <Message 
      message="Hello world" 
      isUser={true} 
      timestamp="2024-01-01T00:00:00Z" 
    />
  );
  
  expect(screen.getByText('Hello world')).toBeInTheDocument();
  expect(screen.getByRole('button')).toHaveClass('chat-bubble-user');
});

# Run tests
npm test
```

### Performance Optimization
```jsx
// React.memo for preventing unnecessary re-renders
const Message = React.memo(({ message, isUser, timestamp }) => {
  return (
    <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
      {message}
    </div>
  );
});

// useCallback for stable function references
const ChatInterface = () => {
  const handleSendMessage = useCallback(async (message) => {
    // Message sending logic
  }, [chatId]);

  return <ChatInput onSendMessage={handleSendMessage} />;
};

// useMemo for expensive calculations
const ProcessedMessages = ({ messages }) => {
  const processedMessages = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      formattedTime: formatTime(msg.timestamp)
    }));
  }, [messages]);

  return <MessageList messages={processedMessages} />;
};
```

## 🚀 Build & Deployment

### Production Build
```bash
# Create optimized build
npm run build

# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### Docker Production
```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache curl
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
# nginx.conf - Production web server
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

## 🐛 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency issues
npm ls
```

**Development Server Issues**
```bash
# Port conflicts
lsof -ti:3000
kill -9 $(lsof -ti:3000)

# Environment variables not loading
echo $REACT_APP_API_URL
# Should show your API URL

# Create .env.local if missing
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
```

**API Connection Issues**
```javascript
// Check network requests in browser dev tools
// Add debug logging to api.js

api.interceptors.request.use(config => {
  console.log('API Request:', config);
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('API Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error);
    throw error;
  }
);
```

**Styling Issues**
```bash
# Tailwind not working
npm run build  # Rebuild to refresh Tailwind

# Check tailwind.config.js content paths
# Ensure purging is not removing needed classes

# View compiled CSS
npx tailwindcss -i ./src/index.css -o ./debug.css --watch
```

### Performance Debugging
```jsx
// React Developer Tools Profiler
// Add to components for debugging

import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Profiler:', { id, phase, actualDuration });
};

<Profiler id="ChatInterface" onRender={onRenderCallback}>
  <ChatInterface />
</Profiler>
```

## 📱 Progressive Web App (PWA)

### PWA Configuration
```json
// public/manifest.json
{
  "short_name": "PPM Chat",
  "name": "Program Pathways Mapper Chat",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#0ea5e9",
  "background_color": "#ffffff"
}
```

### Service Worker (Optional)
```javascript
// src/serviceWorker.js
// Enable for offline functionality
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 📊 Performance Metrics

### Target Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s  
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB gzipped
- **Lighthouse Score**: > 90

### Optimization Checklist
- ✅ Code splitting with React.lazy()
- ✅ Image optimization and lazy loading
- ✅ Minimize bundle size with tree shaking
- ✅ Use React.memo() for expensive components
- ✅ Implement proper error boundaries
- ✅ Add performance monitoring

## 📞 Support

For frontend-specific issues:
1. Check browser console for JavaScript errors
2. Verify API connectivity: Network tab in DevTools
3. Review component props and state in React DevTools
4. Check environment variables: `echo $REACT_APP_API_URL`
5. Validate Tailwind CSS compilation

---

**Developed by**: [dixisouls](https://github.com/dixisouls)  
**Frontend Version**: 3.0 - Modern React with Animations
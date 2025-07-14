# Silent Guard React Application Documentation

## Overview

Silent Guard is a modern React application built with TypeScript and Vite that provides a user interface for managing "dead man's switch" messages. Users can create scheduled messages that will be sent to specified recipients if they fail to check in within configured time periods. The application features Auth0 authentication, rich text editing, and a responsive design.

## Technologies & Dependencies

### Core Framework
- **React**: 19.1.0 (Latest with modern features)
- **TypeScript**: 5.8.3 (Type safety and modern JavaScript)
- **Vite**: 7.0.0 (Fast build tool and development server)

### Authentication
- **@auth0/auth0-react**: 2.3.0 (Authentication and authorization)

### Rich Text Editor
- **Lexical**: 0.32.1 (Facebook's extensible text editor framework)
- **@lexical/react**: React integration for Lexical
- **@lexical/rich-text**: Rich text editing capabilities
- **@lexical/list**: List formatting support
- **@lexical/link**: Link support
- **@lexical/selection**: Selection utilities
- **@lexical/utils**: Utility functions

### Styling & UI
- **Tailwind CSS**: 4.1.11 (Utility-first CSS framework)
- **@tailwindcss/vite**: Vite integration
- **lucide-react**: 0.525.0 (Beautiful, consistent icons)
- **sweetalert**: 2.1.2 (User-friendly alert dialogs)

### Build Tools
- **@vitejs/plugin-react**: 4.6.0 (React support for Vite)
- **ESLint**: 9.30.0 (Code linting)
- **PostCSS**: 8.5.6 (CSS processing)
- **Autoprefixer**: 10.4.21 (CSS vendor prefixes)

## Project Structure

```
silent-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AccountModal.tsx
│   │   ├── Footer.tsx
│   │   ├── LoginModal.tsx
│   │   └── RichTextEditor.tsx
│   ├── pages/               # Application pages
│   │   ├── DashboardPage.tsx
│   │   └── LandingPage.tsx
│   ├── services/            # API and external services
│   │   └── apiService.ts
│   ├── context/             # React contexts
│   │   └── TokenContext.tsx
│   ├── types/               # TypeScript type definitions
│   │   ├── AccountForm.ts
│   │   ├── LoginForm.ts
│   │   └── Message.ts
│   ├── utils/               # Utility functions
│   │   └── Utils.ts
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   ├── index.css            # Global styles
│   ├── config.ts            # Configuration
│   └── env.ts               # Environment variables
├── public/                  # Static assets
├── dist/                    # Build output
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.js
└── Dockerfile
```

## Component Architecture

### Main Application Components

#### App.tsx
- **Purpose**: Root component managing authentication and routing
- **Key Features**:
  - Auth0 authentication state management
  - Conditional rendering based on authentication status
  - Loading states during authentication
  - Route handling between Landing and Dashboard

#### main.tsx
- **Purpose**: Application entry point with providers
- **Key Features**:
  - Auth0Provider configuration
  - TokenContext provider setup
  - React DOM rendering
  - Global error handling

### Page Components

#### LandingPage.tsx
- **Purpose**: Marketing page for unauthenticated users
- **Key Features**:
  - Hero section with call-to-action
  - Feature highlights
  - Check-in confirmation handling via URL parameters
  - Auth0 login integration
  - Responsive design

#### DashboardPage.tsx
- **Purpose**: Main authenticated user interface
- **Key Features**:
  - Message management (CRUD operations)
  - User account settings
  - Message list with status indicators
  - Create/Edit message forms
  - Check-in functionality

### Reusable Components

#### RichTextEditor.tsx
- **Purpose**: Lexical-based rich text editor
- **Key Features**:
  - Rich text formatting (bold, italic, underline)
  - List support (ordered/unordered)
  - Quote blocks
  - Undo/Redo functionality
  - Toolbar interface
  - TypeScript integration

#### AccountModal.tsx
- **Purpose**: User account settings modal
- **Key Features**:
  - Display user email
  - Logout functionality
  - Modal overlay with escape key support

#### LoginModal.tsx
- **Purpose**: Authentication modal (currently unused)
- **Key Features**:
  - Form-based login interface
  - Input validation
  - Error handling

#### Footer.tsx
- **Purpose**: Application footer
- **Key Features**:
  - Build version display
  - Consistent bottom navigation

## State Management

### Context-Based Architecture

#### TokenContext.tsx
- **Purpose**: Auth0 access token management
- **Key Features**:
  - Token retrieval and caching
  - Automatic token refresh
  - Error handling for token operations
  - TypeScript type safety

### Local State Patterns
- **Component State**: React useState hooks for component-specific state
- **Form State**: Controlled components for form inputs
- **API State**: Async operations with loading/error states
- **Modal State**: Boolean flags for modal visibility

## API Integration

### Service Layer (apiService.ts)

#### Core Functions
- **getMessages()**: Retrieve user messages
- **createMessage(message)**: Create new message
- **updateMessage(id, message)**: Update existing message
- **deleteMessage(id)**: Delete message
- **signUpOrSignInUser()**: Handle user authentication
- **confirmCheckIn(confirmationId)**: Register user check-in

#### API Patterns
- **RESTful endpoints**: Standard HTTP methods
- **Bearer token authentication**: JWT tokens in headers
- **Error handling**: Structured error responses
- **TypeScript types**: Fully typed API responses

### Authentication Flow

#### Auth0 Integration
```typescript
// Auth0 Provider Configuration
domain: "your-domain.auth0.com"
clientId: "your-client-id"
authorizationParams: {
  redirect_uri: window.location.origin,
  audience: "your-api-audience",
  scope: "openid profile email"
}
```

#### Token Management
1. **Login**: User redirected to Auth0
2. **Callback**: Auth0 redirects back with tokens
3. **Token Storage**: Access tokens cached in context
4. **API Calls**: Tokens attached to requests
5. **Refresh**: Automatic token refresh handling

## Type Definitions

### Message.ts
```typescript
interface Message {
  id?: number;
  spanDays: number;
  subject: string;
  targets: string[];
  content: string;
  lastReminderSent?: string;
  nextReminderDue?: string;
  lastCheckIn?: string;
  reminderUuid?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### AccountForm.ts
```typescript
interface AccountForm {
  email: string;
}
```

### LoginForm.ts
```typescript
interface LoginForm {
  email: string;
  password: string;
}
```

## Styling Architecture

### Tailwind CSS Configuration
- **Modern Tailwind v4**: Latest version with improved performance
- **Vite Integration**: @tailwindcss/vite plugin for optimal builds
- **Utility-First**: Consistent design system
- **Responsive Design**: Mobile-first approach

### Design System
- **Colors**: Blue primary (#2563eb), slate grays
- **Typography**: System fonts with proper hierarchy
- **Spacing**: Consistent padding and margins
- **Components**: Reusable button styles, form inputs, modals

### Custom Styles (index.css)
```css
/* Rich text editor styles */
.editor-container { /* Custom editor styling */ }
.editor-toolbar { /* Toolbar styling */ }
.editor-content { /* Content area styling */ }
```

## Build Configuration

### Vite Configuration (vite.config.ts)

#### Development Server
- **HTTPS**: SSL certificates for local development
- **Host**: Configured for local domain (silentguard-local.ricardocampos.dev.br)
- **Port**: 5173
- **Hot Reload**: Fast refresh for development

#### Build Optimization
- **HTML Transformation**: Injects environment variables at build time
- **Code Splitting**: Automatic code splitting for optimal loading
- **Asset Optimization**: Image and static asset optimization
- **TypeScript**: Full TypeScript compilation

### Docker Configuration

#### Multi-Stage Build
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /usr/share/caddy
```

#### Caddy Configuration
- **Static File Serving**: Efficient static file delivery
- **Security Headers**: Comprehensive security configuration
- **Gzip Compression**: Automatic compression
- **Health Checks**: Built-in health monitoring

## Development Commands

### Package Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Code linting
npm run lint

# Preview production build
npm run preview
```

### Local Development
```bash
# Install dependencies
npm ci

# Start development server (HTTPS)
npm run dev
# Server runs on https://silentguard-local.ricardocampos.dev.br:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Development
```bash
# Build Docker image
docker build -t silent-app:latest .

# Run container
docker run -p 5173:5173 silent-app:latest
```

## Key Features

### Dead Man's Switch Management
- **Message Creation**: Users can create messages with trigger intervals
- **Recipient Management**: Multiple email recipients per message
- **Check-in System**: Users must periodically check in to prevent message sending
- **Message Status**: Active/inactive toggle for each message

### Rich Text Editing
- **Lexical Integration**: Modern, extensible rich text editor
- **Formatting Options**:
  - Bold, italic, underline
  - Headings (H1, H2, H3)
  - Ordered and unordered lists
  - Quote blocks
  - Undo/Redo functionality
- **Toolbar Interface**: User-friendly editing controls

### Security Features
- **HTTPS Enforcement**: SSL certificates for secure communication
- **CSP Headers**: Content Security Policy protection
- **Frame Protection**: X-Frame-Options and other security headers
- **Token-Based Authentication**: Secure API access

## Environment Configuration

### Environment Variables
```javascript
// env.ts
export const environment = {
  apiUrl: window.ENV?.VITE_BACKEND_API || 'http://localhost:8080',
  version: window.ENV?.VITE_BUILD || 'dev',
  // Additional environment variables
};
```

### Auth0 Configuration
```json
// auth_config.json
{
  "domain": "your-domain.auth0.com",
  "clientId": "your-client-id",
  "audience": "your-api-audience"
}
```

## Error Handling

### Error Patterns
- **API Errors**: Structured error responses with user-friendly messages
- **Authentication Errors**: Redirect to login on authentication failures
- **Network Errors**: Graceful handling of network issues
- **Validation Errors**: Form validation with inline error messages

### User Feedback
- **SweetAlert**: User-friendly alert dialogs
- **Loading States**: Visual feedback during operations
- **Success Messages**: Confirmation of successful operations
- **Error Messages**: Clear error communication

## Performance Optimization

### Bundle Optimization
- **Code Splitting**: Automatic splitting for optimal loading
- **Tree Shaking**: Removal of unused code
- **Asset Optimization**: Minification and compression
- **Dynamic Imports**: Lazy loading of components

### Caching Strategy
- **Service Worker**: Offline support (if implemented)
- **Browser Caching**: Proper cache headers
- **API Response Caching**: Token and user info caching

## Testing

### Current State
- **No Test Framework**: Currently no testing setup
- **ESLint**: Code quality through linting
- **TypeScript**: Type checking for error prevention

### Recommended Testing Setup
```bash
# Recommended additions
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## Deployment

### Production Build
```bash
# Build for production
npm run build

# Output directory: dist/
```

### Docker Deployment
```bash
# Build production image
docker build -t silent-app:production .

# Run in production
docker run -d -p 80:80 silent-app:production
```

### Environment Variables for Production
```bash
VITE_BACKEND_API=https://your-api-domain.com
VITE_BUILD=v1.0.0
```

## Browser Support

### Modern Browser Support
- **Chrome**: Latest versions
- **Firefox**: Latest versions
- **Safari**: Latest versions
- **Edge**: Latest versions

### Progressive Enhancement
- **ES6+ Features**: Modern JavaScript features
- **CSS Grid/Flexbox**: Modern layout techniques
- **Responsive Design**: Mobile-first approach

## Security Considerations

### Content Security Policy
- **Script Sources**: Restricted to trusted domains
- **Style Sources**: Inline styles allowed for dynamic styling
- **Image Sources**: Controlled image loading
- **Frame Protection**: X-Frame-Options header

### Authentication Security
- **HTTPS Only**: Secure token transmission
- **Token Expiration**: Automatic token refresh
- **Secure Storage**: Proper token storage practices

## Future Enhancements

### Planned Features
- **Offline Support**: Service worker implementation
- **Push Notifications**: Real-time notifications
- **Message Templates**: Pre-defined message templates
- **Advanced Editor**: More rich text features
- **Mobile App**: React Native version
- **Testing Suite**: Comprehensive test coverage

### Performance Improvements
- **Service Worker**: Offline functionality
- **Image Optimization**: WebP support
- **Bundle Analysis**: Bundle size optimization
- **Caching Strategy**: Advanced caching implementation

## Troubleshooting

### Common Issues
1. **Authentication Failures**: Check Auth0 configuration
2. **API Connection**: Verify backend API URL
3. **HTTPS Certificate**: Ensure SSL certificates are valid
4. **Build Errors**: Check TypeScript compilation
5. **CORS Issues**: Verify allowed origins in backend

### Debug Tools
- **React Developer Tools**: Component inspection
- **Network Tab**: API request debugging
- **Console Logs**: Error tracking
- **TypeScript Compiler**: Type checking

## Contributing

### Development Guidelines
- **TypeScript**: Use proper typing for all components
- **ESLint**: Follow linting rules
- **Component Structure**: Keep components small and focused
- **State Management**: Use appropriate state management patterns
- **CSS Classes**: Use Tailwind utilities consistently

### Code Style
- **Functional Components**: Use hooks instead of class components
- **TypeScript**: Explicit typing for props and state
- **Error Handling**: Proper error boundaries and handling
- **Accessibility**: ARIA labels and keyboard navigation
# System Patterns

## Architecture Overview

### Frontend Architecture
- **Single Page Application (SPA)** using Vue.js
- **Component-based architecture** with reusable UI components
- **Modular Vuex store** for state management
- **Role-based access control (RBAC)** system

### Design Patterns

#### 1. Module Pattern
- Vuex modules for different features (account, permission, settings, etc.)
- API service modules organized by feature
- Component modules with consistent structure

#### 2. Router Guards Pattern
- Global before guards for authentication
- Dynamic route generation based on user permissions
- Route meta information for access control

#### 3. Permission System Pattern
- **constantRoutes**: Always accessible routes (login, register, dashboard)
- **asyncRoutes**: Permission-based routes filtered by user roles
- **Role hierarchy**: sysadmin > admin > user

#### 4. API Interceptor Pattern
- Request interceptors for automatic token injection
- Response interceptors for centralized error handling
- Automatic logout on authentication failures

#### 5. Component Organization Pattern
- Layout components for page structure
- Reusable UI components in `/components`
- Page-specific components in view subdirectories
- Mixins for shared functionality

#### 6. State Management Pattern
- Centralized state with Vuex
- Getters for computed state
- Actions for async operations
- Mutations for state changes

#### 7. Internationalization Pattern
- vue-i18n for multi-language support
- Language files for different locales
- Dynamic language switching

### File Structure Patterns
```
src/
├── api/          # API service modules
├── components/   # Reusable UI components
├── views/        # Page components
├── store/        # Vuex state management
├── router/       # Route configuration
├── utils/        # Utility functions
├── layout/       # Layout components
└── styles/       # SCSS styles
```

### Data Flow Patterns
1. **User Action** → **Component Event** → **Vuex Action** → **API Call** → **Vuex Mutation** → **Component Update**
2. **Route Navigation** → **Router Guard** → **Permission Check** → **Route Access**
3. **API Response** → **Response Interceptor** → **Error Handling** → **State Update**
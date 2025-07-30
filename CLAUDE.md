# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run serve` or `yarn run serve` - Start development server on port 8888
- `npm run build` or `yarn run build` - Build for production with code obfuscation
- `npm run lint` - Run ESLint checks
- `npm run lint:prettier` - Format code with Prettier
- `npm run svgo` - Optimize SVG icons in src/icons/svg

## Architecture Overview

This is a Vue 2.x admin panel for managing Trojan proxy services with role-based access control.

### Core Structure
- **Vue 2.6.11** with Element UI component library
- **Vue Router** with permission-based routing (constantRoutes vs asyncRoutes)
- **Vuex** for state management with modular stores
- **Axios** for API calls with automatic token injection
- **Internationalization** with vue-i18n (en, zh, fa, ko)

### Key Directories
- `src/api/` - API service modules organized by feature
- `src/views/` - Page components with nested component directories
- `src/components/` - Reusable UI components
- `src/store/modules/` - Vuex modules for app, account, permission, settings, tagsView
- `src/utils/` - Utility functions including auth, request interceptors, validation
- `src/layout/` - Main layout components (sidebar, navbar, tags view)

### Authentication & Permissions
- JWT-based authentication with token stored in cookies
- Role-based access control with three levels: sysadmin (role_id=1), admin (role_id=2), user (role_id=3)
- Role mapping in `src/store/modules/account.js` converts role_id to role strings
- Dynamic route generation based on user permissions
- Permission guards in router beforeEach

### API Integration
- Development API: `http://127.0.0.1:8081/api` (via proxy in vue.config.js)
- Production API: `http://127.0.0.1:8081/api` (configured in .env/.env.production)
- Automatic Authorization header injection
- Centralized error handling with logout on token expiry
- Response code handling (20000 for success, 50014/50008/50401 for auth errors)

### Request Handling
- Fixed timeout configuration (5s default, 15s login, 20s create operations)
- Request interceptor with automatic token injection
- Response interceptor with error handling and automatic logout on auth failures
- Error codes 50014/50008/50401 trigger automatic logout confirmation

### Build Configuration
- Production builds include JavaScript obfuscation via webpack-obfuscator
- SVG sprite loader for icon management
- Asset path configuration for deployment
- Source maps disabled in production
- Environment-based API configuration (.env for development, .env.production for production)

### Feature Modules
- **Dashboard** - Admin and user dashboards with traffic statistics
- **Account Management** - User CRUD with role assignment
- **Node Management** - Proxy node configuration (Trojan, Xray, Hysteria, Hysteria2, NaiveProxy)
- **Server Management** - Server and node server management
- **System Configuration** - Base settings, email templates, blacklist (sysadmin only)
- **Task Management** - File task management (sysadmin only)

### Styling
- SCSS-based styling with Element UI theming
- Responsive sidebar navigation
- Transition animations
- Custom theme variables in src/styles/

### Important Implementation Details
- Permission system requires role mapping: only 'sysadmin' role gets full access (not 'admin')
- Route permissions are filtered dynamically based on user roles
- Login process supports optional captcha based on system settings
- Node management supports multiple proxy types with specialized form components
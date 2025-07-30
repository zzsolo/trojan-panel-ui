# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn run serve` - Start development server on port 8888
- `yarn run build` - Build for production with code obfuscation
- `yarn run lint` - Run ESLint checks
- `yarn run lint:prettier` - Format code with Prettier
- `yarn run svgo` - Optimize SVG icons in src/icons/svg

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
- Role-based access control (sysadmin, admin, user roles)
- Dynamic route generation based on user permissions
- Permission guards in router beforeEach

### API Integration
- Development proxy to `http://127.0.0.1:8081/api`
- Automatic Authorization header injection
- Centralized error handling with logout on token expiry
- Response code handling (20000 for success, 50014/50008/50401 for auth errors)

### Build Configuration
- Production builds include JavaScript obfuscation
- SVG sprite loader for icon management
- Asset path configuration for deployment
- Source maps disabled in production

### Feature Modules
- **Dashboard** - Admin and user dashboards with traffic statistics
- **Account Management** - User CRUD with role assignment
- **Node Management** - Proxy node configuration (Trojan, Xray, Hysteria, etc.)
- **Server Management** - Server and node server management
- **System Configuration** - Base settings, email templates, blacklist
- **Task Management** - File task management (sysadmin only)

### Styling
- SCSS-based styling with Element UI theming
- Responsive sidebar navigation
- Transition animations
- Custom theme variables in src/styles/
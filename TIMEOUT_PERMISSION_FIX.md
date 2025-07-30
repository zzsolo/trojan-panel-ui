# 超时和权限问题修复补丁

## 问题分析

### 1. 超时问题
- **原因**：所有API请求使用固定5000ms超时时间，对于复杂操作（如创建服务器/节点、导入导出）过短
- **影响**：登录、增删改服务器和节点时频繁出现 "timeout of 5000ms exceeded" 错误

### 2. 权限问题
- **原因**：role_id=2的用户无法登录，显示 "permission denied"
- **根本原因**：
  1. `permission.js` 中权限判断逻辑错误：`roles.includes('admin')` 应为 `roles.includes('sysadmin')`
  2. 后端返回的role_id数字与前端期望的角色字符串不匹配

## 修复方案

### 1. 超时机制优化

#### 1.1 增强请求工具 (`src/utils/request.js`)
- 实现分级超时配置
- 添加自动重试机制
- 改进错误处理逻辑

**主要改进：**
```javascript
// 超时时间配置（毫秒）
const TIMEOUT_CONFIG = {
  default: 10000,        // 默认超时时间
  login: 15000,          // 登录操作
  create: 20000,         // 创建操作（服务器/节点）
  delete: 15000,         // 删除操作
  update: 15000,         // 更新操作
  upload: 30000,         // 上传操作
  export: 60000          // 导出操作
}

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 2,         // 最大重试次数
  retryDelay: 1000,      // 重试延迟
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET']
}
```

#### 1.2 API超时配置
为关键操作添加适当的超时时间：

**登录操作** (`src/api/account.js`)：
- 登录：15秒
- 创建账户：20秒
- 删除账户：15秒
- 更新账户：15秒
- 批量创建：30秒
- 导出操作：60秒

**节点操作** (`src/api/node.js`)：
- 创建节点：20秒
- 删除节点：15秒
- 更新节点：15秒

**服务器操作** (`src/api/node-server.js`)：
- 创建服务器：20秒
- 删除服务器：15秒
- 更新服务器：15秒
- 导入服务器：30秒
- 导出服务器：60秒

### 2. 权限系统修复

#### 2.1 修复权限判断逻辑 (`src/store/modules/permission.js`)
```javascript
// 修复前
if (roles.includes('admin')) {
  accessedRoutes = asyncRoutes || []
}

// 修复后
if (roles.includes('sysadmin')) {
  accessedRoutes = asyncRoutes || []
}
```

#### 2.2 添加角色映射机制 (`src/store/modules/account.js`)
```javascript
// 角色映射：将role_id映射为角色字符串
let mappedRoles = []
if (roles && Array.isArray(roles)) {
  // 如果后端已经返回了正确的角色数组
  mappedRoles = roles
} else if (role_id !== undefined) {
  // 如果后端返回的是role_id，进行映射
  switch (role_id) {
    case 1:
      mappedRoles = ['sysadmin']
      break
    case 2:
      mappedRoles = ['admin']
      break
    case 3:
    default:
      mappedRoles = ['user']
      break
  }
} else if (roles && typeof roles === 'string') {
  // 如果后端返回的是单个角色字符串
  mappedRoles = [roles]
}
```

### 3. 错误处理改进

#### 3.1 细分错误类型
- 网络错误：`ENOTFOUND`, `ECONNREFUSED`
- 超时错误：`ECONNABORTED`, `ETIMEDOUT`
- 认证错误：401, 403
- 服务器错误：5xx

#### 3.2 国际化错误消息
支持多语言错误提示，提升用户体验。

## 角色映射说明

### role_id 映射关系
- **role_id = 1** → `['sysadmin']` (系统管理员)
- **role_id = 2** → `['admin']` (管理员)
- **role_id = 3** → `['user']` (普通用户)

### 权限级别
1. **sysadmin**: 系统管理员，拥有所有权限
2. **admin**: 管理员，可管理账户、服务器、邮件，但无系统配置权限
3. **user**: 普通用户，只能访问基本功能

## 测试建议

### 1. 超时测试
- 测试网络延迟情况下的登录操作
- 测试大批量数据的导入导出
- 测试服务器/节点的增删改操作

### 2. 权限测试
- 使用不同role_id的用户测试登录
- 验证各角色的菜单访问权限
- 测试角色切换后的权限变更

### 3. 错误处理测试
- 模拟网络断开情况
- 测试服务器错误响应
- 验证重试机制的有效性

## 部署注意事项

1. **向后兼容**：修复保持了向后兼容性，支持多种后端数据格式
2. **性能影响**：重试机制会增加少量请求时间，但显著提升成功率
3. **监控建议**：建议添加API调用监控，跟踪超时和重试情况

## 修复文件列表

1. `src/utils/request.js` - 完全重写，添加超时和重试机制
2. `src/api/account.js` - 添加超时配置
3. `src/api/node.js` - 添加超时配置
4. `src/api/node-server.js` - 添加超时配置
5. `src/store/modules/permission.js` - 修复权限判断逻辑
6. `src/store/modules/account.js` - 添加角色映射机制

此修复补丁解决了超时和权限问题，提升了系统的稳定性和用户体验。
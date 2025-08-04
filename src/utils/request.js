import axios from 'axios'
import { Message, MessageBox, Notification } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'
import i18n from '@/lang'

// 请求配置映射 - 根据URL模式设置不同的超时时间
const requestConfigMap = {
  // 登录相关 - 15秒
  '/auth/login': { timeout: 15000, retry: 2, critical: true },
  '/auth/generateCaptcha': { timeout: 10000, retry: 1 },
  '/auth/register': { timeout: 15000, retry: 2, critical: true },
  
  // 账户信息 - 10秒
  '/account/getAccountInfo': { timeout: 10000, retry: 2, critical: true },
  
  // 密码修改 - 20秒
  '/account/updateAccountPass': { timeout: 20000, retry: 1, critical: true },
  '/account/updateAccountProperty': { timeout: 15000, retry: 1, critical: true },
  
  // 账户管理 - 20秒
  '/account/createAccount': { timeout: 20000, retry: 2, critical: true },
  '/account/createAccountBatch': { timeout: 30000, retry: 1, critical: true },
  '/account/updateAccountById': { timeout: 20000, retry: 1, critical: true },
  '/account/deleteAccountById': { timeout: 15000, retry: 1, critical: true },
  
  // 服务器和节点管理 - 25秒
  '/node-server/': { timeout: 25000, retry: 2, critical: true },
  '/node/': { timeout: 25000, retry: 2, critical: true },
  
  // 文件任务 - 30秒
  '/file-task/': { timeout: 30000, retry: 1, critical: true },
  
  // 系统配置 - 20秒
  '/system/': { timeout: 20000, retry: 1, critical: true },
  
  // 默认配置
  'default': { timeout: 10000, retry: 1, critical: false }
}

// 获取请求配置
function getRequestConfig(url) {
  for (const pattern in requestConfigMap) {
    if (pattern !== 'default' && url.includes(pattern)) {
      return requestConfigMap[pattern]
    }
  }
  return requestConfigMap.default
}

// 智能重试机制
async function retryRequest(config, error, retryCount = 0) {
  const requestConfig = getRequestConfig(config.url)
  
  if (retryCount >= requestConfig.retry) {
    throw error
  }
  
  console.log(`🔄 [RETRY] 请求重试 (${retryCount + 1}/${requestConfig.retry}): ${config.url}`)
  
  // 显示重试提示
  if (retryCount === 0) {
    Notification({
      title: i18n.t('notice.retryTitle') || '请求超时',
      message: i18n.t('notice.retryMessage') || '正在重新尝试连接服务器...',
      type: 'warning',
      duration: 3000,
      customClass: 'operation-notification-fade'
    })
  }
  
  // 指数退避策略
  const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // 创建新的axios实例进行重试
  const retryInstance = axios.create({
    baseURL: process.env.VUE_APP_BASE_API,
    timeout: requestConfig.timeout
  })
  
  return retryInstance(config)
}

// 操作状态确认机制
const pendingOperations = new Map()

function generateOperationId(config) {
  return `${config.method}-${config.url}-${JSON.stringify(config.data || config.params)}`
}

function showOperationNotification(config, isStart = true) {
  const requestConfig = getRequestConfig(config.url)
  const operationId = generateOperationId(config)
  
  if (!requestConfig.critical) return null
  
  if (isStart) {
    const notification = Notification({
      title: i18n.t('notice.operationStart') || '操作进行中',
      message: getOperationMessage(config.url, 'start'),
      type: 'info',
      duration: 0, // 不自动关闭，等待结果
      showClose: true,
      customClass: 'operation-notification-fade'
    })
    
    pendingOperations.set(operationId, notification)
    return notification
  } else {
    const notification = pendingOperations.get(operationId)
    if (notification) {
      notification.close()
      pendingOperations.delete(operationId)
    }
  }
}

function getOperationMessage(url, type) {
  const messages = {
    '/auth/login': {
      start: i18n.t('notice.loginStart') || '正在登录...',
      success: i18n.t('notice.loginSuccess') || '登录成功',
      error: i18n.t('notice.loginError') || '登录失败'
    },
    '/account/updateAccountPass': {
      start: i18n.t('notice.passwordUpdateStart') || '正在修改密码...',
      success: i18n.t('notice.passwordUpdateSuccess') || '密码修改成功',
      error: i18n.t('notice.passwordUpdateError') || '密码修改失败'
    },
    '/account/createAccount': {
      start: i18n.t('notice.accountCreateStart') || '正在创建账户...',
      success: i18n.t('notice.accountCreateSuccess') || '账户创建成功',
      error: i18n.t('notice.accountCreateError') || '账户创建失败'
    },
    '/account/updateAccountById': {
      start: i18n.t('notice.accountUpdateStart') || '正在更新账户...',
      success: i18n.t('notice.accountUpdateSuccess') || '账户更新成功',
      error: i18n.t('notice.accountUpdateError') || '账户更新失败'
    },
    '/account/deleteAccountById': {
      start: i18n.t('notice.accountDeleteStart') || '正在删除账户...',
      success: i18n.t('notice.accountDeleteSuccess') || '账户删除成功',
      error: i18n.t('notice.accountDeleteError') || '账户删除失败'
    },
    '/node-server/': {
      start: i18n.t('notice.serverUpdateStart') || '正在更新服务器...',
      success: i18n.t('notice.serverUpdateSuccess') || '服务器更新成功',
      error: i18n.t('notice.serverUpdateError') || '服务器更新失败'
    },
    '/node/': {
      start: i18n.t('notice.nodeUpdateStart') || '正在更新节点...',
      success: i18n.t('notice.nodeUpdateSuccess') || '节点更新成功',
      error: i18n.t('notice.nodeUpdateError') || '节点更新失败'
    },
    'default': {
      start: i18n.t('notice.operationStart') || '正在处理请求...',
      success: i18n.t('notice.operationSuccess') || '操作成功',
      error: i18n.t('notice.operationError') || '操作失败'
    }
  }
  
  for (const pattern in messages) {
    if (pattern !== 'default' && url.includes(pattern)) {
      return messages[pattern][type]
    }
  }
  
  return messages.default[type]
}

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 10000 // 默认超时，实际请求时会根据配置调整
})

service.interceptors.request.use(
  (config) => {
    // 动态设置超时时间
    const requestConfig = getRequestConfig(config.url)
    config.timeout = requestConfig.timeout
    
    // 添加重试计数
    config.retryCount = config.retryCount || 0
    
    if (store.getters.token) {
      config.headers['Authorization'] = getToken()
    }
    
    // 显示操作开始通知
    showOperationNotification(config, true)
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    // 关闭操作通知
    showOperationNotification(response.config, false)
    
    const res = response.data
    if (res.code === 20000) {
      // 显示成功通知
      const requestConfig = getRequestConfig(response.config.url)
      if (requestConfig.critical) {
        Notification({
          title: i18n.t('notice.operationSuccess') || '操作成功',
          message: getOperationMessage(response.config.url, 'success'),
          type: 'success',
          duration: 3000,
          customClass: 'operation-notification-fade'
        })
      }
      return res
    } else if (res instanceof Blob) {
      return response
    } else {
      // 关闭操作通知
      showOperationNotification(response.config, false)
      
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      if (res.code === 50014 || res.code === 50008 || res.code === 50401) {
        MessageBox.confirm(i18n.t('confirm.logoutPrompt'), 'Confirm logout', {
          confirmButtonText: i18n.t('confirm.logoutConfirm'),
          cancelButtonText: i18n.t('confirm.cancel'),
          type: 'warning'
        }).then(() => {
          store.dispatch('account/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  async (error) => {
    const config = error.config || {}
    
    // 关闭操作通知
    showOperationNotification(config, false)
    
    // 如果是超时错误，尝试重试
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      try {
        const retryCount = config.retryCount || 0
        const response = await retryRequest(config, error, retryCount)
        // 重试成功，关闭操作通知
        showOperationNotification(config, false)
        return response
      } catch (retryError) {
        // 重试失败，显示错误通知
        const requestConfig = getRequestConfig(config.url)
        if (requestConfig.critical) {
          Notification({
            title: i18n.t('notice.operationError') || '操作失败',
            message: getOperationMessage(config.url, 'error'),
            type: 'error',
            duration: 5000,
            customClass: 'operation-notification-fade'
          })
        }
        return Promise.reject(retryError)
      }
    }
    
    // 其他错误处理
    const requestConfig = getRequestConfig(config.url)
    if (requestConfig.critical) {
      Notification({
        title: i18n.t('notice.operationError') || '操作失败',
        message: getOperationMessage(config.url, 'error'),
        type: 'error',
        duration: 5000,
        customClass: 'operation-notification-fade'
      })
    } else {
      Message({
        message: error.message,
        type: 'error',
        duration: 5 * 1000
      })
    }
    
    return Promise.reject(error)
  }
)

export default service

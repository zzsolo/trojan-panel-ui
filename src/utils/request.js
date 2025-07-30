import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'
import i18n from '@/lang'

// 超时时间配置（毫秒）
const TIMEOUT_CONFIG = {
  default: 10000, // 默认超时时间
  login: 15000, // 登录操作
  create: 20000, // 创建操作（服务器/节点）
  delete: 15000, // 删除操作
  update: 15000, // 更新操作
  upload: 30000, // 上传操作
  export: 60000 // 导出操作
}

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 2, // 最大重试次数
  retryDelay: 1000, // 重试延迟（毫秒）
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET']
}

// 创建axios实例
const createAxiosInstance = (timeout = TIMEOUT_CONFIG.default) => {
  return axios.create({
    baseURL: process.env.VUE_APP_BASE_API,
    timeout: timeout
  })
}

// 判断是否为网络错误
const isNetworkError = (error) => {
  return error.code && RETRY_CONFIG.retryableErrors.includes(error.code)
}

// 判断是否为可重试的HTTP状态码
const isRetryableStatus = (status) => {
  return RETRY_CONFIG.retryableStatusCodes.includes(status)
}

// 延迟函数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 带重试的请求函数
const requestWithRetry = async (config, retryCount = 0) => {
  const timeout = config.timeout || TIMEOUT_CONFIG.default
  const instance = createAxiosInstance(timeout)

  try {
    const response = await instance(config)
    return response
  } catch (error) {
    // 如果是认证错误，直接抛出，不重试
    if (error.response && [401, 403].includes(error.response.status)) {
      throw error
    }

    // 如果达到最大重试次数，直接抛出错误
    if (retryCount >= RETRY_CONFIG.maxRetries) {
      throw error
    }

    // 检查是否可以重试
    const shouldRetry =
      isNetworkError(error) ||
      (error.response && isRetryableStatus(error.response.status))

    if (shouldRetry) {
      console.warn(
        `Request failed, retrying (${retryCount + 1}/${
          RETRY_CONFIG.maxRetries
        }):`,
        config.url
      )
      await delay(RETRY_CONFIG.retryDelay * (retryCount + 1))
      return requestWithRetry(config, retryCount + 1)
    }

    throw error
  }
}

// 主请求服务
const service = {
  request: async (config) => {
    // 添加认证token
    if (store.getters.token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = getToken()
    }

    // 根据URL路径设置超时时间
    if (!config.timeout) {
      const url = config.url || ''
      if (url.includes('/auth/login')) {
        config.timeout = TIMEOUT_CONFIG.login
      } else if (url.includes('/create') || url.includes('/register')) {
        config.timeout = TIMEOUT_CONFIG.create
      } else if (url.includes('/delete') || url.includes('/remove')) {
        config.timeout = TIMEOUT_CONFIG.delete
      } else if (url.includes('/update') || url.includes('/modify')) {
        config.timeout = TIMEOUT_CONFIG.update
      } else if (url.includes('/export')) {
        config.timeout = TIMEOUT_CONFIG.export
      } else if (url.includes('/import') || url.includes('/upload')) {
        config.timeout = TIMEOUT_CONFIG.upload
      }
    }

    try {
      const response = await requestWithRetry(config)
      return response
    } catch (error) {
      // 统一错误处理
      handleRequestError(error)
      throw error
    }
  }
}

// 统一错误处理
const handleRequestError = (error) => {
  if (error.response) {
    // 服务器响应错误
    const res = error.response.data

    if (res.code === 20000) {
      return
    }

    if (res instanceof Blob) {
      return
    }

    // 根据错误码显示不同的错误信息
    let errorMessage = res.message || 'Error'

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage =
        i18n.t('error.timeout') || 'Request timeout, please try again'
    } else if (error.response.status === 401) {
      errorMessage = i18n.t('error.unauthorized') || 'Unauthorized access'
    } else if (error.response.status === 403) {
      errorMessage = i18n.t('error.forbidden') || 'Access denied'
    } else if (error.response.status === 404) {
      errorMessage = i18n.t('error.notFound') || 'Resource not found'
    } else if (error.response.status >= 500) {
      errorMessage =
        i18n.t('error.serverError') || 'Server error, please try again later'
    }

    Message({
      message: errorMessage,
      type: 'error',
      duration: 5 * 1000
    })

    // 处理认证错误
    if (
      res.code === 50014 ||
      res.code === 50008 ||
      res.code === 50401 ||
      error.response.status === 401
    ) {
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
  } else if (
    error.code === 'ECONNABORTED' ||
    error.message.includes('timeout')
  ) {
    // 请求超时
    Message({
      message:
        i18n.t('error.timeout') ||
        'Request timeout, please check your network connection',
      type: 'error',
      duration: 5 * 1000
    })
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    // 网络连接问题
    Message({
      message:
        i18n.t('error.network') ||
        'Network connection failed, please check your network',
      type: 'error',
      duration: 5 * 1000
    })
  } else {
    // 其他错误
    Message({
      message: error.message || 'Unknown error occurred',
      type: 'error',
      duration: 5 * 1000
    })
  }
}

// 导出请求服务
export default service.request

// 为了向后兼容，也导出整个service对象
export { service }

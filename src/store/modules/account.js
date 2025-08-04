import { getAccountInfo, login, logout, register } from '@/api/account'
import { getToken, removeToken, setToken } from '@/utils/auth'
import { resetRouter } from '@/router'

const getDefaultState = () => {
  return {
    token: getToken(),
    avatar: '', // 头像
    username: '', // 用户名
    roles: [] // 角色
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = 'Bearer ' + token
  },
  SET_USERNAME: (state, username) => {
    state.username = username
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  }
}

const actions = {
  // account login
  login({ commit }, accountInfo) {
    const { username, pass, captchaId, captchaCode } = accountInfo
    return new Promise((resolve, reject) => {
      login({
        username: username.trim(),
        pass: pass,
        captchaId: captchaId,
        captchaCode: captchaCode
      })
        .then((response) => {
          const { data } = response
          commit('SET_TOKEN', data.token)
          setToken('Bearer ' + data.token)
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  },

  // account register
  register({ commit }, accountInfo) {
    const { username, pass, captchaId, captchaCode } = accountInfo
    return new Promise((resolve, reject) => {
      register({
        username: username.trim(),
        pass: pass.trim(),
        captchaId: captchaId,
        captchaCode: captchaCode
      })
        .then((response) => {
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  },

  // get account info
  getAccountInfo({ commit }) {
    return new Promise((resolve, reject) => {
      getAccountInfo()
        .then((response) => {
          const { data } = response

          if (!data) {
            return reject(this.$t('confirm.authFail'))
          }

          const { username, roles } = data

          // 记录API返回的原始角色数据（用于调试）
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] API返回的原始角色数据:', roles)
            console.log('🔍 [DEBUG] 用户名:', username)
          }

          // 角色映射：将role_id映射为角色字符串
          const roleMap = {
            1: 'sysadmin',
            2: 'admin', 
            3: 'user'
          }
          
          // 处理API返回的角色数据
          let mappedRoles = []
          if (Array.isArray(roles)) {
            // 如果API返回的是数组
            mappedRoles = roles.map(role => {
              // 如果是数字，转换为对应的角色字符串
              if (typeof role === 'number') {
                return roleMap[role] || 'user'
              }
              // 如果已经是字符串，直接返回
              return role
            })
          } else if (typeof roles === 'number') {
            // 如果API返回的是单个数字
            mappedRoles = [roleMap[roles] || 'user']
          } else if (typeof roles === 'string') {
            // 如果API返回的是单个字符串
            mappedRoles = [roles]
          }

          // 记录映射后的角色数据（用于调试）
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] 映射后的角色数据:', mappedRoles)
          }

          commit('SET_USERNAME', username)
          commit('SET_ROLES', mappedRoles)
          resolve(data)
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('🔍 [DEBUG] 获取用户信息失败:', error)
          }
          reject(error)
        })
    })
  },

  // account logout
  logout({ commit }) {
    return new Promise((resolve, reject) => {
      logout()
        .then((response) => {
          removeToken()
          resetRouter()
          commit('RESET_STATE')
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise((resolve) => {
      removeToken()
      commit('RESET_STATE')
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

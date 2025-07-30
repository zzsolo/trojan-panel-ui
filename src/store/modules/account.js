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

          const { username, roles, role_id } = data

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

          commit('SET_USERNAME', username)
          commit('SET_ROLES', mappedRoles)
          resolve({ ...data, roles: mappedRoles })
        })
        .catch((error) => {
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

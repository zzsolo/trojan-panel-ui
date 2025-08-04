import { asyncRoutes, constantRoutes } from '@/router'

/**
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    const hasAccess = roles.some((role) => route.meta.roles.includes(role))
    // 调试信息：记录权限检查结果
    console.log('🔍 [DEBUG] hasPermission - 路由:', route.path || route.name, '需要角色:', route.meta.roles, '用户角色:', roles, '结果:', hasAccess)
    return hasAccess
  } else {
    // 调试信息：记录无角色限制的路由
    console.log('🔍 [DEBUG] hasPermission - 路由:', route.path || route.name, '无角色限制，允许访问')
    return true
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = []

  routes.forEach((route) => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  generateRoutes({ commit }, roles) {
    return new Promise((resolve) => {
      // 调试信息：记录传入的角色和路由生成过程
      console.log('🔍 [DEBUG] generateRoutes - 传入的角色:', roles)
      console.log('🔍 [DEBUG] generateRoutes - 是否包含sysadmin:', roles.includes('sysadmin'))
      
      let accessedRoutes
      if (roles.includes('sysadmin')) {
        console.log('🔍 [DEBUG] generateRoutes - 使用完整路由 (sysadmin)')
        accessedRoutes = asyncRoutes || []
      } else {
        console.log('🔍 [DEBUG] generateRoutes - 使用过滤路由 (非sysadmin)')
        accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
      }
      
      // 调试信息：记录生成的路由数量
      console.log('🔍 [DEBUG] generateRoutes - 生成的路由数量:', accessedRoutes.length)
      console.log('🔍 [DEBUG] generateRoutes - 生成的路由名称:', accessedRoutes.map(r => r.name || r.path))
      
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

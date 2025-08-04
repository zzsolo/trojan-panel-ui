import router from '@/router'
import store from '@/store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false })

// 白名单
const whiteList = ['/login', '/register']

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  document.title = getPageTitle(to.meta.title)
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        next()
      } else {
        try {
          console.log('🔍 [DEBUG] 开始获取用户信息和路由权限...')
          const { roles } = await store.dispatch('account/getAccountInfo')
          console.log('🔍 [DEBUG] 获取到的用户角色:', roles)
          
          const accessRoutes = await store.dispatch(
            'permission/generateRoutes',
            roles
          )
          console.log('🔍 [DEBUG] 生成的可访问路由数量:', accessRoutes.length)
          
          for (let i = 0; i < accessRoutes.length; i++) {
            console.log('🔍 [DEBUG] 添加路由:', accessRoutes[i].name || accessRoutes[i].path)
            router.addRoute(accessRoutes[i])
          }
          
          console.log('🔍 [DEBUG] 路由添加完成，准备跳转到:', to.path)
          next({ ...to, replace: true })
        } catch (error) {
          console.error('🔍 [DEBUG] 权限验证失败:', error)
          await store.dispatch('account/resetToken')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})

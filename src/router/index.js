import { createRouter, createWebHistory } from 'vue-router'
import { API_ENDPOINTS } from '../config'
import { request } from '../utils/request'
import { useUserStore } from '../stores/user'

// 检查session的函数
async function checkSession() {
    try {
        const response = await request(API_ENDPOINTS.CHECK_SESSION)
        if (response.status === 200) {
            const userStore = useUserStore()
            userStore.setUserData(response.data)
            return true
        }
        return false
    } catch (error) {
        console.error('Session check failed:', error)
        return false
    }
}

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: () =>
                import ('../views/LoginView.vue'),
            beforeEnter: async(to, from, next) => {
                // 检查session，如果有效直接跳转到IM页面
                if (await checkSession()) {
                    next('/im')
                } else {
                    next()
                }
            }
        },
        {
            path: '/im',
            name: 'im',
            component: () =>
                import ('../views/IMView.vue'),
            meta: { requiresAuth: true }
        }
    ]
})

// 全局路由守卫
router.beforeEach(async(to, from, next) => {
    if (to.meta.requiresAuth) {
        if (await checkSession()) {
            next()
        } else {
            next('/login')
        }
    } else {
        next()
    }
})

export default router
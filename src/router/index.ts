import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true }
    },
    {
      path: '/initial-data',
      name: 'initial-data',
      component: () => import('../views/InitialDataView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/subordinates',
      name: 'subordinates',
      component: () => import('../views/SubordinatesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/debug',
      name: 'debug',
      component: () => import('../views/DebugView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/org-chart',
      name: 'org-chart',
      component: () => import('../views/OrgChartView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/work-reports',
      name: 'work-reports',
      component: () => import('../views/WorkReportsView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Load auth data from localStorage
  if (!authStore.isAuthenticated) {
    authStore.loadAuthData()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router

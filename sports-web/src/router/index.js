import Vue from 'vue';
import Router from 'vue-router';
import store from '../store';

// router lazy load
Vue.use(Router);

const router = new Router({
  // mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'multi-login',
      component: () => import('../views/MultiLogin.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/Index.vue'),
      children: [
        {
          path: '/project',
          name: 'project',
          component: () => import('../views/Project.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator'] }
        },
        {
          path: '/competition',
          name: 'competition',
          component: () => import('../views/Competition.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator'] }
        },
        {
          path: '/player',
          name: 'player',
          component: () => import('../views/Player.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator'] }
        },
        {
          path: '/admin',
          name: 'admin',
          component: () => import('../views/Admin.vue'),
          meta: { requiresAuth: true, roles: ['admin'] }
        },
        {
          path: '/registration-review',
          name: 'registration-review',
          component: () => import('../views/RegistrationReview.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator'] }
        },
        {
          path: '/system-config',
          name: 'system-config',
          component: () => import('../views/SystemConfig.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator'] }
        },
        {
          path: '/notifications',
          name: 'notifications',
          component: () => import('../views/NotificationCenter.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: '/operation-logs',
          name: 'operation-logs',
          component: () => import('../views/OperationLogs.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator'] }
        },
        {
          path: '/admin-dashboard',
          name: 'admin-dashboard',
          component: () => import('../views/AdminDashboard.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator'] }
        },
        {
          path: '/statistics-center',
          name: 'statistics-center',
          component: () => import('../views/StatisticsCenter.vue'),
          meta: { requiresAuth: true, roles: ['admin'] }
        },
        {
          path: '/judge-management',
          name: 'judge-management',
          component: () => import('../views/JudgeManagement.vue'),
          meta: { requiresAuth: true, roles: ['admin'] }
        },
        {
          path: '/plog',
          name: 'plog',
          component: () => import('../views/Plog.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator', 'judge'] }
        }
      ]
    },
    // 运动员专用路由
    {
      path: '/player',
      name: 'player-layout',
      component: () => import('../views/PlayerLayout.vue'),
      meta: { requiresAuth: true, roles: ['player'] },
      children: [
        {
          path: '/player-home',
          name: 'player-home',
          component: () => import('../views/PlayerDashboard.vue'),
          meta: { requiresAuth: true, roles: ['player'] }
        },
        {
          path: '/player/profile',
          name: 'player-profile',
          component: () => import('../views/PlayerProfile.vue'),
          meta: { requiresAuth: true, roles: ['player'] }
        },
        {
          path: '/player/registration',
          name: 'player-registration',
          component: () => import('../views/AvailableEvents.vue'),
          meta: { requiresAuth: true, roles: ['player'] }
        },
        {
          path: '/player/my-registrations',
          name: 'player-my-registrations',
          component: () => import('../views/MyRegistrations.vue'),
          meta: { requiresAuth: true, roles: ['player'] }
        },
        {
          path: '/player/scores',
          name: 'player-scores',
          component: () => import('../views/PlayerScores.vue'),
          meta: { requiresAuth: true, roles: ['player'] }
        }
      ]
    },
    // 裁判员专用路由
    {
      path: '/judge',
      name: 'judge-layout',
      component: () => import('../views/JudgeLayout.vue'),
      meta: { requiresAuth: true, roles: ['judge'] },
      children: [
        {
          path: '/judge-home',
          name: 'judge-home',
          component: () => import('../views/JudgeDashboard.vue'),
          meta: { requiresAuth: true, roles: ['judge'] }
        },
        {
          path: '/judge/profile',
          name: 'judge-profile',
          component: () => import('../views/JudgeProfile.vue'),
          meta: { requiresAuth: true, roles: ['judge'] }
        },
        {
          path: '/judge/events',
          name: 'judge-events',
          component: () => import('../views/JudgeEvents.vue'),
          meta: { requiresAuth: true, roles: ['judge'] }
        },
        {
          path: '/judge/schedule',
          name: 'judge-schedule',
          component: () => import('../views/JudgeEvents.vue'),
          meta: { requiresAuth: true, roles: ['judge'] }
        },
        {
          path: '/judge/score-input',
          name: 'judge-score-input',
          component: () => import('../views/JudgeScoreInput.vue'),
          meta: { requiresAuth: true, roles: ['judge'] }
        },
        {
          path: '/judge/score-manage',
          name: 'judge-score-manage',
          component: () => import('../views/JudgeScoreInput.vue'),
          meta: { requiresAuth: true, roles: ['judge'] }
        }
      ]
    }
  ]
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查是否已登录
    if (!store.getters['auth/isLoggedIn']) {
      // 未登录，跳转到登录页
      next({
        path: '/',
        query: { redirect: to.fullPath }
      });
      return;
    }

    // 检查角色权限
    if (to.meta.roles && to.meta.roles.length > 0) {
      const userType = store.getters['auth/userType'];
      const roleSubType = store.getters['auth/roleSubType'];

      // 将用户类型转换为角色
      let userRole = userType;
      if (userType === 'admin') {
        userRole = roleSubType === '2' ? 'admin' : 'operator';
      }

      if (!to.meta.roles.includes(userRole)) {
        // 权限不足
        next({
          path: '/403',
          query: { message: '权限不足' }
        });
        return;
      }
    }
  }

  // 如果已登录用户访问登录页，重定向到主页
  if (to.path === '/' && store.getters['auth/isLoggedIn']) {
    const userType = store.getters['auth/userType'];
    const roleSubType = store.getters['auth/roleSubType'];

    // 根据用户类型跳转到对应主页
    if (userType === 'admin' || (userType === 'admin' && roleSubType === '1')) {
      next('/project');
    } else if (userType === 'player') {
      next('/player-home');
    } else if (userType === 'judge') {
      next('/judge-home');
    } else {
      next('/project');
    }
    return;
  }

  next();
});

export default router;

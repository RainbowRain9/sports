<template>
  <el-container class="admin-layout">
    <el-header class="unified-header">
      <div class="unified-header-left">
        <span class="unified-header-title">嘉园运动会系统</span>
        <span class="unified-header-subtitle">管理员专区</span>
      </div>
      <div class="unified-header-right">
        <el-dropdown @command="handleCommand">
          <span class="unified-user-dropdown">
            <el-avatar :size="32" :src="avatarUrl">
              {{ displayUserName.charAt(0) }}
            </el-avatar>
            <span class="unified-user-name">{{ displayUserName }}</span>
            <i class="el-icon-arrow-down"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="profile">
              <i class="el-icon-user"></i> 个人信息
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <i class="el-icon-key"></i> 修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <i class="el-icon-switch-button"></i> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </el-header>
    <el-container class="main-container">
      <el-aside width="200px" class="unified-sidebar">
        <!-- 管理员/操作员菜单 -->
        <el-menu v-if="isAdminOrOperator"
                 :default-active="defaultActive"
                 @open="handleOpen"
                 router
                 @close="handleClose"
                 class="unified-sidebar-menu"
                 background-color="#304156"
                 text-color="#bfcbd9"
                 active-text-color="#409eff">
          <!-- 数据统计 -->
          <el-menu-item index="/admin-dashboard">
            <i class="el-icon-data-analysis"></i>
            <span slot="title">数据统计</span>
          </el-menu-item>

          <!-- 统计中心 -->
          <el-menu-item index="/statistics-center" v-if="adminType === '2'">
            <i class="el-icon-pie-chart"></i>
            <span slot="title">统计中心</span>
          </el-menu-item>

          <!-- 报名管理 -->
          <el-menu-item index="/registration-review">
            <i class="el-icon-s-check"></i>
            <span slot="title">报名审核</span>
          </el-menu-item>

          <!-- 基础管理 -->
          <el-menu-item index="/project">
            <i class="el-icon-collection"></i>
            <span slot="title">项目类型</span>
          </el-menu-item>
          <el-menu-item index="/competition">
            <i class="el-icon-trophy"></i>
            <span slot="title">比赛项目</span>
          </el-menu-item>
          <el-menu-item index="/plog">
            <i class="el-icon-document"></i>
            <span slot="title">参赛记录</span>
          </el-menu-item>

          <!-- 人员管理 -->
          <el-menu-item index="/player">
            <i class="el-icon-user"></i>
            <span slot="title">运动员管理</span>
          </el-menu-item>
          <el-menu-item index="/judge-management"
                        v-if="adminType === '2' || adminType === '1'">
            <i class="el-icon-user-solid"></i>
            <span slot="title">裁判员管理</span>
          </el-menu-item>
          <el-menu-item index="/admin"
                        v-if="adminType === '2'">
            <i class="el-icon-s-custom"></i>
            <span slot="title">操作员管理</span>
          </el-menu-item>

          <!-- 系统管理 -->
          <el-menu-item index="/system-config"
                        v-if="adminType === '2'">
            <i class="el-icon-setting"></i>
            <span slot="title">系统配置</span>
          </el-menu-item>
          <el-menu-item index="/notifications">
            <i class="el-icon-bell"></i>
            <span slot="title">通知中心</span>
            <el-badge
              v-if="unreadCount > 0"
              :value="unreadCount"
              :max="99"
              class="notification-badge"
            />
          </el-menu-item>
          <el-menu-item index="/operation-logs">
            <i class="el-icon-document-copy"></i>
            <span slot="title">操作日志</span>
          </el-menu-item>
        </el-menu>

        <!-- 运动员菜单 -->
        <el-menu v-if="isPlayer"
                 :default-active="defaultActive"
                 @open="handleOpen"
                 router
                 @close="handleClose">
          <el-menu-item index="/player-home">
            <i class="el-icon-s-home"></i>
            <span slot="title">个人中心</span>
          </el-menu-item>
          <el-menu-item index="/player/profile">
            <i class="el-icon-user"></i>
            <span slot="title">个人信息</span>
          </el-menu-item>
          <el-menu-item index="/player/registration">
            <i class="el-icon-plus"></i>
            <span slot="title">项目报名</span>
          </el-menu-item>
          <el-menu-item index="/player/my-registrations">
            <i class="el-icon-tickets"></i>
            <span slot="title">我的报名</span>
          </el-menu-item>
          <el-menu-item index="/player/scores">
            <i class="el-icon-trophy"></i>
            <span slot="title">我的成绩</span>
          </el-menu-item>
        </el-menu>

        <!-- 裁判员菜单 -->
        <el-menu v-if="isJudge"
                 :default-active="defaultActive"
                 @open="handleOpen"
                 router
                 @close="handleClose">
          <el-menu-item index="/judge-home">
            <i class="el-icon-s-home"></i>
            <span slot="title">个人中心</span>
          </el-menu-item>
          <el-menu-item index="/judge/events">
            <i class="el-icon-calendar"></i>
            <span slot="title">我的赛事</span>
          </el-menu-item>
          <el-menu-item index="/judge/score-input">
            <i class="el-icon-edit"></i>
            <span slot="title">成绩录入</span>
          </el-menu-item>
          <el-menu-item index="/judge/profile">
            <i class="el-icon-user"></i>
            <span slot="title">个人信息</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="unified-main-content">
        <div class="unified-breadcrumb-container">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin-dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path" :to="item.path">
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="unified-content-wrapper">
          <router-view></router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>

</template>

<script>
import { permissionMixin } from '@/utils/permission';

export default {
  mixins: [permissionMixin],
  data() {
    return {
      avatarUrl: null,
      unreadCount: 0
    };
  },
  computed: {
    adminType() {
      return this.$store.getters['auth/roleSubType'];
    },

    // 判断是否是管理员或操作员
    isAdminOrOperator() {
      return this.$isAdmin() || this.$isOperator();
    },

    // 判断是否是运动员
    isPlayer() {
      return this.$isPlayer();
    },

    // 判断是否是裁判员
    isJudge() {
      return this.$isJudge();
    },

    // 根据用户角色设置默认激活菜单
    defaultActive() {
      if (this.isPlayer) {
        return '/player-home';
      } else if (this.isJudge) {
        return '/judge-home';
      }
      return this.$route.path || '/admin-dashboard';
    },

    // 显示用户名
    displayUserName() {
      // 优先使用新的认证系统用户名
      if (this.$store.getters['auth/userName']) {
        return this.$store.getters['auth/userName'];
      }
      // 兼容旧系统
      return this.$store.state.userName || '用户';
    },

    // 获取未读通知数量
    unreadCount() {
      return this.$store.getters['notification/unreadCount'];
    },

    // 面包屑导航项
    breadcrumbItems() {
      const routeMap = {
        '/admin-dashboard': { name: '数据统计', path: '/admin-dashboard' },
        '/statistics-center': { name: '统计中心', path: '/statistics-center' },
        '/registration-review': { name: '报名审核', path: '/registration-review' },
        '/project': { name: '项目类型', path: '/project' },
        '/competition': { name: '比赛项目', path: '/competition' },
        '/plog': { name: '参赛记录', path: '/plog' },
        '/player': { name: '运动员管理', path: '/player' },
        '/judge-management': { name: '裁判员管理', path: '/judge-management' },
        '/system-config': { name: '系统配置', path: '/system-config' },
        '/notifications': { name: '通知中心', path: '/notifications' },
        '/operation-logs': { name: '操作日志', path: '/operation-logs' }
      };

      const currentRoute = routeMap[this.$route.path];
      return currentRoute ? [currentRoute] : [];
    }
  },
  async created() {
    // 检查用户是否已登录
    if (!this.$store.getters['auth/isLoggedIn'] && this.$store.state.userName === '') {
      this.$router.push('/');
      return;
    }

    // 等待一小段时间确保认证状态稳定，然后初始化通知模块
    this.$nextTick(async () => {
      if (this.$store.getters['auth/isLoggedIn']) {
        await this.$store.dispatch('notification/initNotifications');
      }
    });
  },

  beforeDestroy() {
    // 清理通知模块
    this.$store.dispatch('notification/stopAutoRefresh');
  },
  methods: {
    handleOpen() {

    },
    handleClose() {

    },
    async logout() {
      try {
        // 如果使用新的认证系统
        if (this.$store.getters['auth/isLoggedIn']) {
          await this.$store.dispatch('auth/logout');
        } else {
          // 兼容旧系统
          this.$store.commit('SET_USER_NAME', '');
          this.$store.commit('SET_ADMIN_TYPE', '');
        }

        this.$message.success('退出成功');
        this.$router.push('/');
      } catch (error) {
        console.error('退出失败:', error);
        this.$message.error('退出失败，请稍后重试');
      }
    },

    // 处理用户下拉菜单命令
    handleCommand(command) {
      switch (command) {
        case 'profile':
          this.$router.push('/admin/profile');
          break;
        case 'password':
          this.$router.push('/admin/password');
          break;
        case 'logout':
          this.logout();
          break;
      }
    }
  }
};
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.main-container {
  height: calc(100vh - 60px);
}

/* 通知徽章样式 */
.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

.notification-badge .el-badge__content {
  background-color: #f56c6c;
  border: 1px solid #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unified-sidebar {
    width: 60px !important;
  }

  .unified-sidebar-menu .el-menu-item span,
  .unified-sidebar-menu .el-submenu__title span {
    display: none;
  }

  .unified-header-subtitle {
    display: none;
  }

  .unified-user-name {
    display: none;
  }
}
</style>

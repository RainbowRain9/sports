<template>
  <el-container class="player-layout">
    <el-header class="header">
      <div class="header-left">
        <span class="header-title">体育赛事管理系统</span>
        <span class="header-subtitle">运动员专区</span>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-dropdown">
            <el-avatar :size="32" :src="avatarUrl">
              {{ displayUserName.charAt(0) }}
            </el-avatar>
            <span class="user-name">{{ displayUserName }}</span>
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
      <el-aside width="200px" class="sidebar">
        <el-menu 
          :default-active="$route.path"
          router
          class="sidebar-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/player-home">
            <i class="el-icon-s-home"></i>
            <span slot="title">个人中心</span>
          </el-menu-item>
          
          <el-submenu index="registration">
            <template slot="title">
              <i class="el-icon-document"></i>
              <span>报名管理</span>
            </template>
            <el-menu-item index="/player/registration">
              <i class="el-icon-plus"></i>
              <span>项目报名</span>
            </el-menu-item>
            <el-menu-item index="/player/my-registrations">
              <i class="el-icon-tickets"></i>
              <span>我的报名</span>
            </el-menu-item>
          </el-submenu>
          
          <el-menu-item index="/player/scores">
            <i class="el-icon-trophy"></i>
            <span slot="title">我的成绩</span>
          </el-menu-item>

          <el-menu-item index="/player/notifications">
            <i class="el-icon-bell"></i>
            <span slot="title">通知中心</span>
            <el-badge
              v-if="unreadCount > 0"
              :value="unreadCount"
              :max="99"
              class="notification-badge"
            />
          </el-menu-item>

          <el-menu-item index="/player/profile">
            <i class="el-icon-user"></i>
            <span slot="title">个人信息</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="content">
        <div class="breadcrumb-container">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/player-home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path" :to="item.path">
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="page-content">
          <router-view></router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { permissionMixin } from '@/utils/permission';

export default {
  name: 'PlayerLayout',
  mixins: [permissionMixin],
  data() {
    return {
      avatarUrl: null
    };
  },
  computed: {
    displayUserName() {
      if (this.$store.getters['auth/userName']) {
        return this.$store.getters['auth/userName'];
      }
      return this.$store.state.userName || '运动员';
    },
    
    breadcrumbItems() {
      const routeMap = {
        '/player-home': { name: '个人中心', path: '/player-home' },
        '/player/profile': { name: '个人信息', path: '/player/profile' },
        '/player/registration': { name: '项目报名', path: '/player/registration' },
        '/player/my-registrations': { name: '我的报名', path: '/player/my-registrations' },
        '/player/scores': { name: '我的成绩', path: '/player/scores' },
        '/player/notifications': { name: '通知中心', path: '/player/notifications' }
      };

      const currentRoute = routeMap[this.$route.path];
      return currentRoute ? [currentRoute] : [];
    },

    // 获取未读通知数量
    unreadCount() {
      return this.$store.getters['notification/unreadCount'];
    }
  },

  async created() {
    // 检查用户权限
    if (!this.$isPlayer()) {
      this.$message.error('权限不足，请使用运动员账号登录');
      this.$router.push('/');
      return;
    }

    // 如果当前路径是根路径，重定向到个人中心
    if (this.$route.path === '/player') {
      this.$router.replace('/player-home');
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
    handleCommand(command) {
      switch (command) {
        case 'profile':
          this.$router.push('/player/profile');
          break;
        case 'password':
          // 跳转到个人信息页面的修改密码标签
          this.$router.push('/player/profile');
          this.$nextTick(() => {
            // 可以通过事件或其他方式切换到密码标签
          });
          break;
        case 'logout':
          this.logout();
          break;
      }
    },
    
    async logout() {
      try {
        await this.$store.dispatch('auth/logout');
        this.$message.success('退出成功');
        this.$router.push('/');
      } catch (error) {
        console.error('退出失败:', error);
        this.$message.error('退出失败，请稍后重试');
      }
    }
  }
};
</script>

<style scoped>
.player-layout {
  height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(45deg, #fff, #f0f8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 25px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-dropdown:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.main-container {
  height: calc(100vh - 60px);
}

.sidebar {
  background-color: #304156;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
  transition: all 0.3s ease;
}

.sidebar-menu .el-menu-item:hover {
  background-color: rgba(64, 158, 255, 0.1) !important;
  transform: translateX(2px);
}

.sidebar-menu .el-submenu .el-menu-item {
  height: 45px;
  line-height: 45px;
  padding-left: 60px !important;
}

.content {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
  min-height: calc(100vh - 60px);
}

.breadcrumb-container {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-bottom: 1px solid rgba(230,230,230,0.5);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.page-content {
  padding: 24px;
  min-height: calc(100vh - 120px);
  overflow-y: auto;
}

/* 全局按钮样式优化 */
.page-content .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-content .el-button:hover {
  transform: translateY(-1px);
}

.page-content .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.page-content .el-button--primary:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 60px !important;
  }
  
  .sidebar-menu .el-menu-item span,
  .sidebar-menu .el-submenu__title span {
    display: none;
  }
  
  .header-subtitle {
    display: none;
  }
  
  .user-name {
    display: none;
  }
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
</style>

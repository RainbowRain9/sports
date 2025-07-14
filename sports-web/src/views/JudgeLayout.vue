<template>
  <el-container class="judge-layout">
    <el-header class="header">
      <div class="header-left">
        <span class="header-title">嘉园运动会系统</span>
        <span class="header-subtitle">裁判员专区</span>
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
          <el-menu-item index="/judge-home">
            <i class="el-icon-s-home"></i>
            <span slot="title">个人中心</span>
          </el-menu-item>
          
          <el-submenu index="events">
            <template slot="title">
              <i class="el-icon-calendar"></i>
              <span>赛事管理</span>
            </template>
            <el-menu-item index="/judge/events">
              <i class="el-icon-date"></i>
              <span>我的赛事</span>
            </el-menu-item>
            <el-menu-item index="/judge/schedule">
              <i class="el-icon-time"></i>
              <span>执裁安排</span>
            </el-menu-item>
          </el-submenu>
          
          <el-submenu index="scores">
            <template slot="title">
              <i class="el-icon-edit-outline"></i>
              <span>成绩管理</span>
            </template>
            <el-menu-item index="/judge/score-input">
              <i class="el-icon-edit"></i>
              <span>成绩录入</span>
            </el-menu-item>
            <el-menu-item index="/judge/score-manage">
              <i class="el-icon-document"></i>
              <span>成绩管理</span>
            </el-menu-item>
          </el-submenu>

          <el-menu-item index="/judge/notifications">
            <i class="el-icon-bell"></i>
            <span slot="title">通知中心</span>
            <el-badge
              v-if="unreadCount > 0"
              :value="unreadCount"
              :max="99"
              class="notification-badge"
            />
          </el-menu-item>

          <el-menu-item index="/judge/profile">
            <i class="el-icon-user"></i>
            <span slot="title">个人信息</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="main-content">
        <div class="breadcrumb-container">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/judge-home' }">裁判员中心</el-breadcrumb-item>
            <el-breadcrumb-item 
              v-for="item in breadcrumbItems" 
              :key="item.path"
              :to="{ path: item.path }"
            >
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="content-wrapper">
          <router-view />
        </div>
      </el-main>
    </el-container>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      title="修改密码"
      :visible.sync="passwordDialogVisible"
      width="400px"
      @close="resetPasswordForm"
    >
      <el-form
        ref="passwordForm"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPasswordChange" :loading="passwordLoading">
          确定
        </el-button>
      </div>
    </el-dialog>
  </el-container>
</template>

<script>
import { changeJudgePassword } from '@/api/demo';
import { permissionMixin } from '@/utils/permission';

export default {
  name: 'JudgeLayout',
  mixins: [permissionMixin],
  data() {
    return {
      avatarUrl: null,
      passwordDialogVisible: false,
      passwordLoading: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: this.validateConfirmPassword, trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    displayUserName() {
      if (this.$store.getters['auth/userName']) {
        return this.$store.getters['auth/userName'];
      }
      return this.$store.state.userName || '裁判员';
    },
    
    breadcrumbItems() {
      const routeMap = {
        '/judge-home': { name: '个人中心', path: '/judge-home' },
        '/judge/profile': { name: '个人信息', path: '/judge/profile' },
        '/judge/events': { name: '我的赛事', path: '/judge/events' },
        '/judge/schedule': { name: '执裁安排', path: '/judge/schedule' },
        '/judge/score-input': { name: '成绩录入', path: '/judge/score-input' },
        '/judge/score-manage': { name: '成绩管理', path: '/judge/score-manage' },
        '/judge/notifications': { name: '通知中心', path: '/judge/notifications' }
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
          this.$router.push('/judge/profile');
          break;
        case 'password':
          this.passwordDialogVisible = true;
          break;
        case 'logout':
          this.logout();
          break;
      }
    },
    
    logout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('auth/logout');
        this.$router.push('/login');
        this.$message.success('已退出登录');
      }).catch(() => {});
    },
    
    validateConfirmPassword(rule, value, callback) {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    },
    
    async submitPasswordChange() {
      try {
        await this.$refs.passwordForm.validate();
        
        this.passwordLoading = true;
        
        await changeJudgePassword({
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword,
          confirmPassword: this.passwordForm.confirmPassword
        });
        
        this.$message.success('密码修改成功');
        this.passwordDialogVisible = false;
        this.resetPasswordForm();
        
      } catch (error) {
        console.error('修改密码失败:', error);
        this.$message.error(error.response && error.response.data && error.response.data.message || '修改密码失败');
      } finally {
        this.passwordLoading = false;
      }
    },
    
    resetPasswordForm() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      if (this.$refs.passwordForm) {
        this.$refs.passwordForm.resetFields();
      }
    }
  }
};
</script>

<style scoped>
.judge-layout {
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
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.95;
  background: rgba(255,255,255,0.25);
  padding: 6px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 25px;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.user-dropdown:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.user-name {
  font-size: 14px;
}

.main-container {
  height: calc(100vh - 60px);
}

.sidebar {
  background: #304156;
  box-shadow: 2px 0 6px rgba(0,0,0,0.1);
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.main-content {
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

.content-wrapper {
  padding: 24px;
  height: calc(100% - 53px);
  overflow-y: auto;
}

/* 全局按钮样式优化 */
.content-wrapper .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-wrapper .el-button:hover {
  transform: translateY(-1px);
}

.content-wrapper .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.content-wrapper .el-button--primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.content-wrapper .el-button--success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border: none;
}

.content-wrapper .el-button--success:hover {
  background: linear-gradient(135deg, #3dd169 0%, #32e7c5 100%);
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
}

.content-wrapper .el-button--warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
}

.content-wrapper .el-button--warning:hover {
  background: linear-gradient(135deg, #ee81f9 0%, #f3455a 100%);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
}

/* 卡片样式优化 */
.content-wrapper .el-card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.content-wrapper .el-card:hover {
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.dialog-footer {
  text-align: right;
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

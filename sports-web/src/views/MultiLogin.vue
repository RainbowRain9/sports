<template>
  <div class="multi-login-wrapper">
    <div class="login-container">
      <div class="login-header">
        <h1 class="system-title">嘉园运动会系统</h1>
        <p class="system-subtitle">嘉庚大二实践周作业</p>
      </div>
      
      <div class="login-content">
        <!-- 角色选择阶段 -->
        <RoleSelector 
          v-if="currentStep === 'role-select'"
          @role-selected="handleRoleSelected"
        />
        
        <!-- 登录表单阶段 -->
        <MultiRoleLogin
          v-if="currentStep === 'login'"
          :user-type="selectedUserType"
          @go-back="handleGoBack"
        />
      </div>
      
      <div class="login-footer">
        <p>&copy; 2025 嘉庚学院嘉园运动会系统</p>
      </div>
    </div>
  </div>
</template>

<script>
import RoleSelector from '@/components/RoleSelector.vue';
import MultiRoleLogin from '@/components/MultiRoleLogin.vue';

export default {
  name: 'MultiLogin',
  components: {
    RoleSelector,
    MultiRoleLogin
  },
  data() {
    return {
      currentStep: 'role-select', // 'role-select' | 'login'
      selectedUserType: ''
    };
  },
  methods: {
    handleRoleSelected(userType) {
      this.selectedUserType = userType;
      this.currentStep = 'login';
    },
    
    handleGoBack() {
      this.currentStep = 'role-select';
      this.selectedUserType = '';
    }
  }
};
</script>

<style lang="stylus" scoped>
.multi-login-wrapper
  width 100%
  min-height 100vh
  background linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  display flex
  align-items center
  justify-content center
  padding 20px

.login-container
  width 100%
  max-width 900px
  background white
  border-radius 16px
  box-shadow 0 20px 40px rgba(0, 0, 0, 0.1)
  overflow hidden

.login-header
  background linear-gradient(135deg, #409eff 0%, #36a3f7 100%)
  color white
  text-align center
  padding 40px 20px
  
  .system-title
    font-size 32px
    font-weight bold
    margin-bottom 8px
    
  .system-subtitle
    font-size 16px
    opacity 0.9

.login-content
  padding 40px 20px
  min-height 400px

.login-footer
  background #f8f9fa
  text-align center
  padding 20px
  color #666
  font-size 14px

@media (max-width: 768px)
  .multi-login-wrapper
    padding 10px
    
  .login-container
    max-width 100%
    
  .login-header
    padding 30px 20px
    
    .system-title
      font-size 24px
      
  .login-content
    padding 30px 20px
</style>

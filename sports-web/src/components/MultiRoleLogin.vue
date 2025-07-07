<template>
  <div class="multi-role-login">
    <div class="login-header">
      <el-button 
        type="text" 
        icon="el-icon-arrow-left"
        @click="goBack"
        class="back-btn"
      >
        返回选择角色
      </el-button>
      
      <div class="role-info">
        <i :class="roleConfig.icon"></i>
        <span>{{ roleConfig.name }}登录</span>
      </div>
    </div>
    
    <div class="login-form">
      <el-form 
        ref="loginForm"
        :model="form"
        :rules="rules"
        label-width="0"
        size="medium"
      >
        <el-form-item prop="username" class="form-item">
          <el-input
            v-model.trim="form.username"
            :placeholder="roleConfig.usernamePlaceholder"
            prefix-icon="el-icon-user"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password" class="form-item">
          <el-input
            v-model.trim="form.password"
            type="password"
            :placeholder="roleConfig.passwordPlaceholder"
            prefix-icon="el-icon-lock"
            show-password
            clearable
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>
        
        <el-form-item class="form-item">
          <el-button 
            type="primary" 
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 默认账号提示 -->
      <div class="default-accounts" v-if="roleConfig.defaultAccounts">
        <el-divider>默认测试账号</el-divider>
        <div class="account-list">
          <div 
            v-for="account in roleConfig.defaultAccounts" 
            :key="account.username"
            class="account-item"
            @click="fillAccount(account)"
          >
            <span class="username">{{ account.username }}</span>
            <span class="password">{{ account.password }}</span>
            <span class="desc">{{ account.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { authLogin } from '@/api/demo.js';

export default {
  name: 'MultiRoleLogin',
  props: {
    userType: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    roleConfig() {
      const configs = {
        admin: {
          name: '管理员',
          icon: 'el-icon-user-solid',
          usernamePlaceholder: '请输入管理员用户名',
          passwordPlaceholder: '请输入密码',
          defaultAccounts: [
            { username: 'admin', password: '123', desc: '系统管理员' },
            { username: 'operator', password: '123', desc: '操作员' }
          ]
        },
        player: {
          name: '运动员',
          icon: 'el-icon-trophy',
          usernamePlaceholder: '请输入学号',
          passwordPlaceholder: '请输入密码',
          defaultAccounts: [
            { username: '001', password: '123456', desc: '赵一' },
            { username: '002', password: '123456', desc: '王二' },
            { username: '003', password: '123456', desc: '李三' }
          ]
        },
        judge: {
          name: '裁判员',
          icon: 'el-icon-medal',
          usernamePlaceholder: '请输入裁判员用户名',
          passwordPlaceholder: '请输入密码',
          defaultAccounts: [
            { username: 'judge001', password: '123456', desc: '张裁判' },
            { username: 'judge002', password: '123456', desc: '李裁判' },
            { username: 'judge003', password: '123456', desc: '王裁判' }
          ]
        }
      };
      return configs[this.userType] || configs.admin;
    }
  },
  methods: {
    goBack() {
      this.$emit('go-back');
    },
    
    fillAccount(account) {
      this.form.username = account.username;
      this.form.password = account.password;
    },
    
    async handleLogin() {
      try {
        const valid = await this.$refs.loginForm.validate();
        if (!valid) return;
        
        this.loading = true;

        const result = await authLogin({
          userType: this.userType,
          username: this.form.username,
          password: this.form.password
        });

        if (result.success) {
          // 保存认证信息到Vuex
          this.$store.dispatch('auth/login', {
            token: result.data.token,
            refreshToken: result.data.refreshToken,
            user: result.data.user
          });

          // 跳转到对应的主页面
          this.redirectToHome();

          this.$message.success('登录成功');
        } else {
          this.$message.error(result.message || '登录失败');
        }
        
      } catch (error) {
        console.error('登录错误:', error);
        this.$message.error('登录失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    
    redirectToHome() {
      const routes = {
        admin: '/project',
        player: '/player-home',
        judge: '/judge-home'
      };
      
      const targetRoute = routes[this.userType] || '/project';
      this.$router.push(targetRoute);
    }
  }
};
</script>

<style lang="stylus" scoped>
.multi-role-login
  max-width 400px
  margin 0 auto
  padding 20px

.login-header
  display flex
  align-items center
  justify-content space-between
  margin-bottom 30px
  
  .back-btn
    color #409eff
    
  .role-info
    display flex
    align-items center
    font-size 18px
    font-weight bold
    color #333
    
    i
      font-size 24px
      margin-right 8px
      color #409eff

.login-form
  .form-item
    margin-bottom 20px
    
  .login-btn
    width 100%
    height 44px
    font-size 16px

.default-accounts
  margin-top 30px
  
  .account-list
    display flex
    flex-direction column
    gap 8px
    
  .account-item
    display flex
    align-items center
    padding 8px 12px
    background #f5f7fa
    border-radius 6px
    cursor pointer
    transition all 0.2s
    
    &:hover
      background #e6f7ff
      
    .username
      font-weight bold
      color #409eff
      min-width 80px
      
    .password
      color #666
      margin 0 10px
      min-width 60px
      
    .desc
      color #999
      font-size 12px
</style>

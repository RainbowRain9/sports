<template>
  <div class="role-selector">
    <div class="role-title">
      <h2>选择登录角色</h2>
      <p>请选择您的身份类型进行登录</p>
    </div>
    
    <div class="role-cards">
      <div 
        v-for="role in roles" 
        :key="role.type"
        class="role-card"
        :class="{ active: selectedRole === role.type }"
        @click="selectRole(role.type)"
      >
        <div class="role-icon">
          <i :class="role.icon"></i>
        </div>
        <div class="role-info">
          <h3>{{ role.name }}</h3>
          <p>{{ role.description }}</p>
        </div>
      </div>
    </div>
    
    <div class="role-actions">
      <el-button 
        type="primary" 
        size="large"
        :disabled="!selectedRole"
        @click="confirmRole"
      >
        确认选择
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoleSelector',
  data() {
    return {
      selectedRole: '',
      roles: [
        {
          type: 'admin',
          name: '管理员',
          description: '系统管理、用户管理、数据统计',
          icon: 'el-icon-user-solid'
        },
        {
          type: 'player',
          name: '运动员',
          description: '个人信息、报名参赛、成绩查询',
          icon: 'el-icon-trophy'
        },
        {
          type: 'judge',
          name: '裁判员',
          description: '成绩录入、赛事管理、参赛名单',
          icon: 'el-icon-medal'
        }
      ]
    };
  },
  methods: {
    selectRole(roleType) {
      this.selectedRole = roleType;
    },
    confirmRole() {
      if (this.selectedRole) {
        this.$emit('role-selected', this.selectedRole);
      }
    }
  }
};
</script>

<style lang="stylus" scoped>
.role-selector
  max-width 800px
  margin 0 auto
  padding 40px 20px
  text-align center

.role-title
  margin-bottom 40px
  
  h2
    font-size 28px
    color #333
    margin-bottom 10px
    
  p
    font-size 16px
    color #666

.role-cards
  display flex
  justify-content center
  gap 30px
  margin-bottom 40px
  flex-wrap wrap

.role-card
  width 200px
  padding 30px 20px
  border 2px solid #e4e7ed
  border-radius 12px
  cursor pointer
  transition all 0.3s ease
  background white
  
  &:hover
    border-color #409eff
    box-shadow 0 4px 12px rgba(64, 158, 255, 0.15)
    transform translateY(-2px)
    
  &.active
    border-color #409eff
    background #f0f9ff
    box-shadow 0 4px 12px rgba(64, 158, 255, 0.25)

.role-icon
  margin-bottom 20px
  
  i
    font-size 48px
    color #409eff

.role-info
  h3
    font-size 18px
    color #333
    margin-bottom 8px
    
  p
    font-size 14px
    color #666
    line-height 1.5

.role-actions
  .el-button
    padding 12px 40px
    font-size 16px

@media (max-width: 768px)
  .role-cards
    flex-direction column
    align-items center
    
  .role-card
    width 280px
</style>

<template>
  <el-container>
    <el-header class="header">
      <span class="header-title">体育赛事管理系统</span>
      <span class="header-name">{{ displayUserName }}</span>
      <span class="header-logout"
            @click="logout">退出</span>
    </el-header>
    <el-container class="container">
      <el-aside width="140px"
                class="container-aside">
        <!-- 管理员/操作员菜单 -->
        <el-menu v-if="isAdminOrOperator"
                 :default-active="defaultActive"
                 @open="handleOpen"
                 router
                 @close="handleClose">
          <!-- 数据统计 -->
          <el-menu-item index="/admin-dashboard">
            <i class="el-icon-data-analysis"></i>
            <span slot="title">数据统计</span>
          </el-menu-item>

          <!-- 报名管理 - 暂时禁用 -->
          <!-- <el-menu-item index="/registration-review">
            <i class="el-icon-s-check"></i>
            <span slot="title">报名审核</span>
          </el-menu-item> -->

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
                        v-if="adminType === '2'">
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
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>

</template>

<script>
import { permissionMixin } from '@/utils/permission';

export default {
  mixins: [permissionMixin],
  data: () => ({

  }),
  computed: {
    adminType() {
      return this.$store.state.adminType;
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
      }
      return '/project';
    },

    // 显示用户名
    displayUserName() {
      // 优先使用新的认证系统用户名
      if (this.$store.getters['auth/userName']) {
        return this.$store.getters['auth/userName'];
      }
      // 兼容旧系统
      return this.$store.state.userName || '用户';
    }
  },
  created() {
    // 检查用户是否已登录
    if (!this.$store.getters['auth/isLoggedIn'] && this.$store.state.userName === '') {
      this.$router.push('/');
    }
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
    }
  }
};
</script>

<style lang="stylus" scoped>
.header
  height 60px !important
  line-height 60px
  font-size 22px
  position relative

.header-title
  font-weight bold
  color rgba(47, 84, 201, 1)

.header-name
  position absolute
  right 130px

.header-logout
  position absolute
  right 80px
  font-size 16px
  line-height 63px
  cursor pointer

  &:hover
    color blue

.container
  background rgba(245, 247, 250, 0.54) !important
  height 93.5vh

.container-aside
  height 100% !important
  background #EBEEF5
  font-size 18px
  font-weight bold

.el-menu
  border 0px
  background #EBEEF5
</style>

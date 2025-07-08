<template>
  <div class="player-dashboard" v-loading="loading">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <el-card class="welcome-card">
        <div class="welcome-content">
          <div class="avatar-section">
            <el-avatar :size="80" :src="avatarUrl">
              {{ profile.player_name ? profile.player_name.charAt(0) : 'U' }}
            </el-avatar>
          </div>
          <div class="info-section">
            <h2>欢迎回来，{{ profile.player_name }}！</h2>
            <p class="user-info">
              <span>学号：{{ profile.player_studentid }}</span>
              <span class="divider">|</span>
              <span>班级：{{ profile.player_class }}</span>
              <span class="divider">|</span>
              <span>编号：{{ profile.player_number }}</span>
            </p>
            <p class="last-login">上次登录：{{ formatDate(profile.updated_at) }}</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon registration">
                <i class="el-icon-document"></i>
              </div>
              <div class="stats-info">
                <h3>{{ stats.registration.total_registrations }}</h3>
                <p>总报名数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon confirmed">
                <i class="el-icon-check"></i>
              </div>
              <div class="stats-info">
                <h3>{{ stats.registration.confirmed_count }}</h3>
                <p>已确认报名</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon scores">
                <i class="el-icon-trophy"></i>
              </div>
              <div class="stats-info">
                <h3>{{ stats.scores.total_scores }}</h3>
                <p>参赛次数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon best-score">
                <i class="el-icon-star-on"></i>
              </div>
              <div class="stats-info">
                <h3>{{ stats.scores.best_score || '--' }}</h3>
                <p>最佳成绩</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作区域 -->
    <div class="actions-section">
      <el-card>
        <div slot="header">
          <span>快捷操作</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="action-item" @click="goToRegistration">
              <div class="action-icon">
                <i class="el-icon-plus"></i>
              </div>
              <div class="action-content">
                <h4>项目报名</h4>
                <p>查看可报名项目并进行报名</p>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="action-item" @click="goToMyRegistrations">
              <div class="action-icon">
                <i class="el-icon-tickets"></i>
              </div>
              <div class="action-content">
                <h4>我的报名</h4>
                <p>查看和管理已报名的项目</p>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="action-item" @click="goToScores">
              <div class="action-icon">
                <i class="el-icon-data-line"></i>
              </div>
              <div class="action-content">
                <h4>成绩查询</h4>
                <p>查看个人比赛成绩和排名</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 最近成绩区域 -->
    <div class="recent-scores-section">
      <el-card>
        <div slot="header">
          <span>最近成绩</span>
          <el-button style="float: right; padding: 3px 0" type="text" @click="goToScores">
            查看全部
          </el-button>
        </div>
        <el-table :data="stats.recentScores" style="width: 100%">
          <el-table-column prop="schedule_name" label="项目名称" width="200"></el-table-column>
          <el-table-column prop="schedule_date" label="比赛日期" width="120">
            <template slot-scope="scope">
              {{ formatDate(scope.row.schedule_date) }}
            </template>
          </el-table-column>
          <el-table-column prop="plog_score" label="成绩" width="100">
            <template slot-scope="scope">
              <el-tag :type="getScoreType(scope.row.plog_score)">
                {{ scope.row.plog_score }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button size="mini" type="text" @click="viewScoreDetail(scope.row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="stats.recentScores.length === 0" class="no-data">
          <i class="el-icon-document"></i>
          <p>暂无比赛成绩</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getPlayerProfile, getPlayerStats } from '@/api/demo';
import { permissionMixin } from '@/utils/permission';

export default {
  name: 'PlayerDashboard',
  mixins: [permissionMixin],
  data() {
    return {
      loading: false,
      profile: {},
      stats: {
        registration: {
          total_registrations: 0,
          confirmed_count: 0,
          pending_count: 0,
          cancelled_count: 0
        },
        scores: {
          total_scores: 0,
          avg_score: 0,
          best_score: 0,
          worst_score: 0
        },
        recentScores: []
      }
    };
  },
  computed: {
    avatarUrl() {
      // 可以根据需要返回头像URL
      return null;
    }
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [profileResult, statsResult] = await Promise.all([
          getPlayerProfile(),
          getPlayerStats()
        ]);
        
        if (profileResult.success) {
          this.profile = profileResult.data;
        }
        
        if (statsResult.success) {
          this.stats = statsResult.data;
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        this.$message.error('加载数据失败，请刷新重试');
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '--';
      return new Date(dateStr).toLocaleDateString();
    },
    
    getScoreType(score) {
      if (score >= 90) return 'success';
      if (score >= 80) return 'warning';
      return 'info';
    },
    
    goToRegistration() {
      this.$router.push('/player/registration');
    },
    
    goToMyRegistrations() {
      this.$router.push('/player/my-registrations');
    },
    
    goToScores() {
      this.$router.push('/player/scores');
    },
    
    viewScoreDetail(score) {
      // 可以打开成绩详情对话框或跳转到详情页
      this.$message.info('成绩详情功能开发中...');
    }
  }
};
</script>

<style scoped>
.player-dashboard {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.welcome-section {
  margin-bottom: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.welcome-card .el-card__body {
  padding: 30px;
}

.welcome-content {
  display: flex;
  align-items: center;
}

.avatar-section {
  margin-right: 30px;
}

.info-section h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 500;
}

.user-info {
  margin: 10px 0;
  font-size: 16px;
  opacity: 0.9;
}

.divider {
  margin: 0 10px;
}

.last-login {
  margin: 5px 0 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stats-icon.registration {
  background-color: #409eff;
}

.stats-icon.confirmed {
  background-color: #67c23a;
}

.stats-icon.scores {
  background-color: #e6a23c;
}

.stats-icon.best-score {
  background-color: #f56c6c;
}

.stats-info h3 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stats-info p {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.actions-section {
  margin-bottom: 20px;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.action-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.action-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
  color: white;
}

.action-content h4 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 16px;
}

.action-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.recent-scores-section {
  margin-bottom: 20px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.no-data i {
  font-size: 48px;
  margin-bottom: 10px;
}

.no-data p {
  margin: 0;
  font-size: 16px;
}
</style>

<template>
  <div class="judge-dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <el-card>
        <div class="welcome-content">
          <div class="welcome-text">
            <h2>欢迎回来，{{ displayUserName }}！</h2>
            <p>今天是 {{ currentDate }}，您有 {{ stats.workStats.today_events }} 场比赛需要执裁</p>
          </div>
          <div class="welcome-avatar">
            <el-avatar :size="80" :src="avatarUrl">
              {{ displayUserName.charAt(0) }}
            </el-avatar>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon assigned">
                <i class="el-icon-calendar"></i>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.workStats.assigned_events }}</div>
                <div class="stat-label">分配赛事</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon completed">
                <i class="el-icon-check"></i>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.workStats.completed_events }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon scored">
                <i class="el-icon-edit-outline"></i>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.workStats.scored_records }}</div>
                <div class="stat-label">录入成绩</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon upcoming">
                <i class="el-icon-time"></i>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.workStats.upcoming_events }}</div>
                <div class="stat-label">待执裁</div>
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
            <div class="action-item" @click="goToEvents">
              <div class="action-icon">
                <i class="el-icon-calendar"></i>
              </div>
              <div class="action-content">
                <h4>我的赛事</h4>
                <p>查看分配给我的比赛项目</p>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="action-item" @click="goToScoreInput">
              <div class="action-icon">
                <i class="el-icon-edit"></i>
              </div>
              <div class="action-content">
                <h4>成绩录入</h4>
                <p>为比赛项目录入运动员成绩</p>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="action-item" @click="goToProfile">
              <div class="action-icon">
                <i class="el-icon-user"></i>
              </div>
              <div class="action-content">
                <h4>个人信息</h4>
                <p>查看和编辑个人基本信息</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 今日赛事安排 -->
    <div class="today-events-section">
      <el-card>
        <div slot="header">
          <span>今日赛事安排</span>
          <el-button style="float: right; padding: 3px 0" type="text" @click="refreshData">
            刷新
          </el-button>
        </div>
        <el-table :data="stats.todayEvents" style="width: 100%" v-loading="loading">
          <el-table-column prop="schedule_name" label="比赛项目" width="200" />
          <el-table-column prop="schedule_starttime" label="开始时间" width="120">
            <template slot-scope="scope">
              {{ formatTime(scope.row.schedule_starttime) }}
            </template>
          </el-table-column>
          <el-table-column prop="schedule_endtime" label="结束时间" width="120">
            <template slot-scope="scope">
              {{ formatTime(scope.row.schedule_endtime) }}
            </template>
          </el-table-column>
          <el-table-column prop="registered_count" label="报名人数" width="100" />
          <el-table-column prop="scored_count" label="已录成绩" width="100" />
          <el-table-column label="进度" width="120">
            <template slot-scope="scope">
              <el-progress 
                :percentage="getProgressPercentage(scope.row)" 
                :color="getProgressColor(scope.row)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button size="mini" type="primary" @click="goToEventDetail(scope.row)">
                查看详情
              </el-button>
              <el-button size="mini" type="success" @click="goToScoreInputForEvent(scope.row)">
                录入成绩
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="stats.todayEvents.length === 0" class="no-data">
          <i class="el-icon-calendar"></i>
          <p>今日暂无执裁安排</p>
        </div>
      </el-card>
    </div>

    <!-- 最近录入成绩 -->
    <div class="recent-scores-section">
      <el-card>
        <div slot="header">
          <span>最近录入成绩</span>
        </div>
        <el-table :data="stats.recentScores" style="width: 100%">
          <el-table-column prop="schedule_name" label="比赛项目" width="200" />
          <el-table-column prop="player_name" label="运动员" width="120" />
          <el-table-column prop="player_number" label="参赛号" width="100" />
          <el-table-column prop="plog_score" label="成绩" width="100">
            <template slot-scope="scope">
              <el-tag :type="getScoreTagType(scope.row.plog_score)">
                {{ scope.row.plog_score }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="schedule_date" label="比赛日期" width="120">
            <template slot-scope="scope">
              {{ formatDate(scope.row.schedule_date) }}
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
          <p>暂无录入成绩</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getJudgeProfile, getJudgeStats } from '@/api/demo';
import { permissionMixin } from '@/utils/permission';

export default {
  name: 'JudgeDashboard',
  mixins: [permissionMixin],
  data() {
    return {
      loading: false,
      avatarUrl: null,
      profile: {},
      stats: {
        workStats: {
          assigned_events: 0,
          completed_events: 0,
          scored_records: 0,
          today_events: 0,
          upcoming_events: 0
        },
        todayEvents: [],
        recentScores: []
      }
    };
  },
  computed: {
    displayUserName() {
      if (this.profile.judge_name) {
        return this.profile.judge_name;
      }
      if (this.$store.getters['auth/userName']) {
        return this.$store.getters['auth/userName'];
      }
      return this.$store.state.userName || '裁判员';
    },
    
    currentDate() {
      return new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  },
  async created() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [profileRes, statsRes] = await Promise.all([
          getJudgeProfile(),
          getJudgeStats()
        ]);
        
        this.profile = profileRes.data;
        this.stats = statsRes.data;
        
      } catch (error) {
        console.error('加载数据失败:', error);
        this.$message.error('加载数据失败');
      } finally {
        this.loading = false;
      }
    },
    
    async refreshData() {
      await this.loadData();
      this.$message.success('数据已刷新');
    },
    
    // 导航方法
    goToEvents() {
      this.$router.push('/judge/events');
    },
    
    goToScoreInput() {
      this.$router.push('/judge/score-input');
    },
    
    goToProfile() {
      this.$router.push('/judge/profile');
    },
    
    goToEventDetail(event) {
      this.$router.push(`/judge/events/${event.schedule_id}`);
    },
    
    goToScoreInputForEvent(event) {
      this.$router.push(`/judge/score-input?eventId=${event.schedule_id}`);
    },
    
    viewScoreDetail(score) {
      this.$message.info('查看成绩详情功能开发中');
    },
    
    // 工具方法
    formatTime(time) {
      if (!time) return '--';
      return time.substring(0, 5);
    },
    
    formatDate(date) {
      if (!date) return '--';
      return new Date(date).toLocaleDateString('zh-CN');
    },
    
    getProgressPercentage(event) {
      if (event.registered_count === 0) return 0;
      return Math.round((event.scored_count / event.registered_count) * 100);
    },
    
    getProgressColor(event) {
      const percentage = this.getProgressPercentage(event);
      if (percentage === 100) return '#67c23a';
      if (percentage >= 50) return '#e6a23c';
      return '#f56c6c';
    },
    
    getScoreTagType(score) {
      if (score >= 90) return 'success';
      if (score >= 70) return 'warning';
      return 'info';
    }
  }
};
</script>

<style scoped>
.judge-dashboard {
  padding: 0;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-section .el-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.welcome-text h2 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-text p {
  margin: 0;
  color: #5a6c7d;
  font-size: 16px;
  font-weight: 400;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  height: 120px;
  border: none;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%);
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 1;
}

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 28px;
  color: white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-icon.assigned {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}
.stat-icon.completed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4);
}
.stat-icon.scored {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.4);
}
.stat-icon.upcoming {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 4px 16px rgba(67, 233, 123, 0.4);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-label {
  font-size: 15px;
  color: #5a6c7d;
  margin-top: 6px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.actions-section {
  margin-bottom: 24px;
}

.actions-section .el-card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);
}

.action-item {
  display: flex;
  align-items: center;
  padding: 24px;
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 120px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
  overflow: hidden;
}

.action-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.action-item:hover::before {
  left: 100%;
}

.action-item:hover {
  border-color: #667eea;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.25);
  transform: translateY(-6px) scale(1.02);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.action-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.action-item:hover .action-icon {
  transform: scale(1.1) rotate(-5deg);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.action-content h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  transition: color 0.3s ease;
}

.action-item:hover .action-content h4 {
  color: #667eea;
}

.action-content p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.action-item:hover .action-content p {
  color: #495057;
}

.today-events-section,
.recent-scores-section {
  margin-bottom: 20px;
}

.no-data {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.no-data i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.no-data p {
  margin: 0;
  font-size: 14px;
}
</style>

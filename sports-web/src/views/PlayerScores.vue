<template>
  <div class="player-scores" v-loading="loading">
    <el-card>
      <div slot="header">
        <span>我的成绩</span>
        <el-button 
          style="float: right; padding: 3px 0" 
          type="text" 
          @click="refreshScores"
          :loading="loading"
        >
          刷新
        </el-button>
      </div>
      
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="项目名称">
            <el-input 
              v-model="filterForm.scheduleName" 
              placeholder="输入项目名称搜索"
              clearable
              style="width: 200px"
            ></el-input>
          </el-form-item>
          <el-form-item label="比赛日期">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 240px"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">筛选</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 成绩统计卡片 -->
      <div class="stats-section" v-if="scores.length > 0">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stats-card">
              <div class="stats-content">
                <div class="stats-number">{{ scores.length }}</div>
                <div class="stats-label">参赛次数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stats-card">
              <div class="stats-content">
                <div class="stats-number">{{ bestScore || '--' }}</div>
                <div class="stats-label">最佳成绩</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stats-card">
              <div class="stats-content">
                <div class="stats-number">{{ avgScore || '--' }}</div>
                <div class="stats-label">平均成绩</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stats-card">
              <div class="stats-content">
                <div class="stats-number">{{ topRankings }}</div>
                <div class="stats-label">前三名次数</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 成绩列表 -->
      <el-table :data="filteredScores" style="width: 100%">
        <el-table-column prop="schedule_name" label="项目名称" width="200">
          <template slot-scope="scope">
            <strong>{{ scope.row.schedule_name }}</strong>
            <div class="item-type">{{ scope.row.schedule_itemid }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="schedule_date" label="比赛日期" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.schedule_date) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="schedule_starttime" label="比赛时间" width="150">
          <template slot-scope="scope">
            {{ scope.row.schedule_starttime }} - {{ scope.row.schedule_endtime }}
          </template>
        </el-table-column>
        
        <el-table-column prop="plog_score" label="成绩" width="100" sortable>
          <template slot-scope="scope">
            <el-tag :type="getScoreType(scope.row.plog_score)" size="medium">
              {{ scope.row.plog_score }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="ranking" label="排名" width="100" sortable>
          <template slot-scope="scope">
            <div class="ranking-cell">
              <el-tag 
                :type="getRankingType(scope.row.ranking)" 
                size="small"
                effect="plain"
              >
                第 {{ scope.row.ranking }} 名
              </el-tag>
              <i 
                v-if="scope.row.ranking <= 3" 
                :class="getRankingIcon(scope.row.ranking)"
                class="ranking-icon"
              ></i>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="judge_name" label="裁判员" width="120">
          <template slot-scope="scope">
            {{ scope.row.judge_name || '--' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120">
          <template slot-scope="scope">
            <el-button 
              size="mini" 
              type="text" 
              @click="viewDetail(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-if="filteredScores.length === 0 && !loading" class="empty-state">
        <i class="el-icon-trophy"></i>
        <p>暂无比赛成绩</p>
        <p class="empty-tip">参加比赛后，成绩将在这里显示</p>
      </div>
    </el-card>
    
    <!-- 成绩详情对话框 -->
    <el-dialog
      title="成绩详情"
      :visible.sync="detailDialogVisible"
      width="600px"
    >
      <div v-if="selectedScore">
        <!-- 使用兼容的Element UI组件替代el-descriptions -->
        <div class="score-details">
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="detail-item">
                <span class="detail-label">项目名称：</span>
                <span class="detail-value">{{ selectedScore.schedule_name }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">项目类型：</span>
                <span class="detail-value">{{ selectedScore.schedule_itemid }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">比赛成绩：</span>
                <el-tag :type="getScoreType(selectedScore.plog_score)" size="medium">
                  {{ selectedScore.plog_score }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">比赛日期：</span>
                <span class="detail-value">{{ formatDate(selectedScore.schedule_date) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">比赛时间：</span>
                <span class="detail-value">{{ selectedScore.schedule_starttime }} - {{ selectedScore.schedule_endtime }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">排名：</span>
                <el-tag
                  :type="getRankingType(selectedScore.ranking)"
                  size="small"
                >
                  第 {{ selectedScore.ranking }} 名
                </el-tag>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">裁判员：</span>
                <span class="detail-value">{{ selectedScore.judge_name || '--' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <div v-if="selectedScore.schedule_introduction" style="margin-top: 20px;">
          <h4>项目介绍</h4>
          <p>{{ selectedScore.schedule_introduction }}</p>
        </div>
        
        <!-- 成绩分析 -->
        <div class="score-analysis" style="margin-top: 20px;">
          <h4>成绩分析</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="analysis-item">
                <span class="analysis-label">成绩等级：</span>
                <el-tag :type="getScoreType(selectedScore.plog_score)">
                  {{ getScoreLevel(selectedScore.plog_score) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="analysis-item">
                <span class="analysis-label">排名情况：</span>
                <span>{{ getRankingDescription(selectedScore.ranking) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getPlayerScores } from '@/api/demo';

export default {
  name: 'PlayerScores',
  data() {
    return {
      loading: false,
      scores: [],
      filteredScores: [],
      detailDialogVisible: false,
      selectedScore: null,
      filterForm: {
        scheduleName: '',
        dateRange: []
      }
    };
  },
  computed: {
    bestScore() {
      if (this.scores.length === 0) return null;
      return Math.max(...this.scores.map(s => s.plog_score));
    },
    
    avgScore() {
      if (this.scores.length === 0) return null;
      const sum = this.scores.reduce((acc, s) => acc + s.plog_score, 0);
      return (sum / this.scores.length).toFixed(1);
    },
    
    topRankings() {
      return this.scores.filter(s => s.ranking <= 3).length;
    }
  },
  async mounted() {
    await this.loadScores();
  },
  methods: {
    async loadScores() {
      this.loading = true;
      try {
        const result = await getPlayerScores();
        if (result.success) {
          this.scores = result.data;
          this.applyFilter();
        } else {
          this.$message.error(result.message || '获取成绩列表失败');
        }
      } catch (error) {
        console.error('获取成绩列表失败:', error);
        this.$message.error('获取成绩列表失败，请刷新重试');
      } finally {
        this.loading = false;
      }
    },
    
    async refreshScores() {
      await this.loadScores();
      this.$message.success('成绩列表已刷新');
    },
    
    applyFilter() {
      let filtered = [...this.scores];
      
      // 按项目名称筛选
      if (this.filterForm.scheduleName) {
        filtered = filtered.filter(score => 
          score.schedule_name.includes(this.filterForm.scheduleName)
        );
      }
      
      // 按日期范围筛选
      if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
        const [startDate, endDate] = this.filterForm.dateRange;
        filtered = filtered.filter(score => {
          const scoreDate = score.schedule_date;
          return scoreDate >= startDate && scoreDate <= endDate;
        });
      }
      
      this.filteredScores = filtered;
    },
    
    resetFilter() {
      this.filterForm = {
        scheduleName: '',
        dateRange: []
      };
      this.applyFilter();
    },
    
    viewDetail(score) {
      this.selectedScore = score;
      this.detailDialogVisible = true;
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '--';
      return new Date(dateStr).toLocaleDateString();
    },
    
    getScoreType(score) {
      if (score >= 90) return 'success';
      if (score >= 80) return 'warning';
      if (score >= 60) return 'primary';
      return 'danger';
    },
    
    getScoreLevel(score) {
      if (score >= 90) return '优秀';
      if (score >= 80) return '良好';
      if (score >= 60) return '及格';
      return '不及格';
    },
    
    getRankingType(ranking) {
      if (ranking === 1) return 'success';
      if (ranking === 2) return 'warning';
      if (ranking === 3) return 'primary';
      return 'info';
    },
    
    getRankingIcon(ranking) {
      const icons = {
        1: 'el-icon-trophy',
        2: 'el-icon-medal',
        3: 'el-icon-medal'
      };
      return icons[ranking] || '';
    },
    
    getRankingDescription(ranking) {
      if (ranking === 1) return '冠军 🏆';
      if (ranking === 2) return '亚军 🥈';
      if (ranking === 3) return '季军 🥉';
      if (ranking <= 10) return '前十名';
      return '参与奖';
    }
  }
};
</script>

<style scoped>
.player-scores {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.filter-form {
  margin: 0;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-content {
  padding: 10px;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stats-label {
  color: #909399;
  font-size: 14px;
}

.item-type {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.ranking-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ranking-icon {
  color: #f39c12;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-state p {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #c0c4cc;
}

.score-analysis {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.analysis-item {
  margin-bottom: 10px;
}

.analysis-label {
  font-weight: bold;
  margin-right: 10px;
}

/* 成绩详情样式 */
.score-details {
  padding: 10px 0;
}

.detail-item {
  margin-bottom: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-label {
  font-weight: bold;
  color: #606266;
  display: inline-block;
  min-width: 80px;
}

.detail-value {
  color: #303133;
}
</style>

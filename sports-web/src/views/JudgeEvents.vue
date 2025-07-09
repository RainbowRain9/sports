<template>
  <div class="judge-events">
    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="状态筛选">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadEvents">
            <el-option label="已分配" value="1" />
            <el-option label="已确认" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="已取消" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="比赛日期">
          <el-date-picker
            v-model="filters.date"
            type="date"
            placeholder="选择日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            clearable
            @change="loadEvents"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadEvents" icon="el-icon-search">查询</el-button>
          <el-button @click="resetFilters" icon="el-icon-refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 赛事列表 -->
    <el-card>
      <div slot="header">
        <span>我的赛事安排</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="loadEvents">
          刷新
        </el-button>
      </div>
      
      <el-table :data="events" style="width: 100%" v-loading="loading">
        <el-table-column prop="schedule_name" label="比赛项目" width="200">
          <template slot-scope="scope">
            <div class="event-name">
              <strong>{{ scope.row.schedule_name }}</strong>
              <div class="project-type">{{ scope.row.project_type }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="schedule_date" label="比赛日期" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.schedule_date) }}
          </template>
        </el-table-column>
        
        <el-table-column label="比赛时间" width="180">
          <template slot-scope="scope">
            {{ formatTime(scope.row.schedule_starttime) }} - {{ formatTime(scope.row.schedule_endtime) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="registered_players" label="报名人数" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="small" type="info">{{ scope.row.registered_players }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="scored_players" label="已录成绩" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="small" :type="getScoreTagType(scope.row)">
              {{ scope.row.scored_players }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="完成进度" width="150">
          <template slot-scope="scope">
            <el-progress 
              :percentage="getProgressPercentage(scope.row)" 
              :color="getProgressColor(scope.row)"
              :stroke-width="6"
              :show-text="false"
            />
            <span class="progress-text">{{ getProgressPercentage(scope.row) }}%</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="assignment_status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.assignment_status)">
              {{ getStatusText(scope.row.assignment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="assigned_at" label="分配时间" width="150">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.assigned_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button 
              size="mini" 
              type="primary" 
              @click="viewEventDetail(scope.row)"
              icon="el-icon-view"
            >
              查看详情
            </el-button>
            <el-button 
              size="mini" 
              type="success" 
              @click="goToScoreInput(scope.row)"
              icon="el-icon-edit"
              :disabled="scope.row.registered_players === 0"
            >
              录入成绩
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-if="events.length === 0 && !loading" class="empty-state">
        <i class="el-icon-calendar"></i>
        <p>暂无分配的赛事</p>
        <p class="empty-tip">请联系管理员为您分配比赛项目</p>
      </div>
    </el-card>

    <!-- 赛事详情对话框 -->
    <el-dialog
      title="赛事详情"
      :visible.sync="detailDialogVisible"
      width="800px"
      @close="closeDetailDialog"
    >
      <div v-if="selectedEvent" class="event-detail">
        <div class="event-detail-grid">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">比赛项目:</span>
                <span class="value">{{ selectedEvent.schedule_name }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">项目类型:</span>
                <span class="value">{{ selectedEvent.project_type }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">比赛日期:</span>
                <span class="value">{{ formatDate(selectedEvent.schedule_date) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">比赛时间:</span>
                <span class="value">{{ formatTime(selectedEvent.schedule_starttime) }} - {{ formatTime(selectedEvent.schedule_endtime) }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">报名人数:</span>
                <span class="value">{{ selectedEvent.registered_players }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">已录成绩:</span>
                <span class="value">{{ selectedEvent.scored_players }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">分配状态:</span>
                <span class="value">
                  <el-tag :type="getStatusTagType(selectedEvent.assignment_status)">
                    {{ getStatusText(selectedEvent.assignment_status) }}
                  </el-tag>
                </span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">分配时间:</span>
                <span class="value">{{ formatDateTime(selectedEvent.assigned_at) }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="detail-item">
                <span class="label">项目介绍:</span>
                <span class="value">{{ selectedEvent.schedule_introduction || '暂无介绍' }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="detail-item">
                <span class="label">备注信息:</span>
                <span class="value">{{ selectedEvent.notes || '暂无备注' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <!-- 参赛选手列表 -->
        <div class="participants-section" style="margin-top: 20px;">
          <h4>参赛选手名单</h4>
          <el-table :data="participants" style="width: 100%" v-loading="participantsLoading">
            <el-table-column prop="player_number" label="参赛号" width="100" />
            <el-table-column prop="player_name" label="姓名" width="120" />
            <el-table-column prop="player_sex" label="性别" width="80" />
            <el-table-column prop="player_class" label="班级" width="100" />
            <el-table-column prop="current_score" label="当前成绩" width="100">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.current_score > 0" type="success">
                  {{ scope.row.current_score }}
                </el-tag>
                <span v-else class="no-score">未录入</span>
              </template>
            </el-table-column>
            <el-table-column prop="registration_status" label="报名状态" width="100">
              <template slot-scope="scope">
                <el-tag :type="scope.row.registration_status === 2 ? 'success' : 'warning'">
                  {{ scope.row.registration_status === 2 ? '已确认' : '待确认' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          type="primary" 
          @click="goToScoreInputFromDetail"
          :disabled="!selectedEvent || selectedEvent.registered_players === 0"
        >
          录入成绩
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getJudgeAssignedEvents, getEventParticipants } from '@/api/demo';
import { permissionMixin } from '@/utils/permission';

export default {
  name: 'JudgeEvents',
  mixins: [permissionMixin],
  data() {
    return {
      loading: false,
      events: [],
      filters: {
        status: '',
        date: '',
        projectType: ''
      },
      
      // 详情对话框
      detailDialogVisible: false,
      selectedEvent: null,
      participants: [],
      participantsLoading: false
    };
  },
  async created() {
    await this.loadEvents();
  },
  methods: {
    async loadEvents() {
      this.loading = true;
      try {
        const params = {};
        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.date) params.date = this.filters.date;
        if (this.filters.projectType) params.projectType = this.filters.projectType;
        
        const response = await getJudgeAssignedEvents(params);
        this.events = response.data;
        
      } catch (error) {
        console.error('加载赛事列表失败:', error);
        this.$message.error('加载赛事列表失败');
      } finally {
        this.loading = false;
      }
    },
    
    resetFilters() {
      this.filters = {
        status: '',
        date: '',
        projectType: ''
      };
      this.loadEvents();
    },
    
    async viewEventDetail(event) {
      this.selectedEvent = event;
      this.detailDialogVisible = true;
      
      // 加载参赛选手列表
      this.participantsLoading = true;
      try {
        const response = await getEventParticipants(event.schedule_id);
        this.participants = response.data;
      } catch (error) {
        console.error('加载参赛选手失败:', error);
        this.$message.error('加载参赛选手失败');
      } finally {
        this.participantsLoading = false;
      }
    },
    
    closeDetailDialog() {
      this.selectedEvent = null;
      this.participants = [];
    },
    
    goToScoreInput(event) {
      this.$router.push(`/judge/score-input?eventId=${event.schedule_id}`);
    },
    
    goToScoreInputFromDetail() {
      if (this.selectedEvent) {
        this.$router.push(`/judge/score-input?eventId=${this.selectedEvent.schedule_id}`);
      }
    },
    
    // 工具方法
    formatDate(date) {
      if (!date) return '--';
      return new Date(date).toLocaleDateString('zh-CN');
    },
    
    formatTime(time) {
      if (!time) return '--';
      return time.substring(0, 5);
    },
    
    formatDateTime(datetime) {
      if (!datetime) return '--';
      return new Date(datetime).toLocaleString('zh-CN');
    },
    
    getProgressPercentage(event) {
      if (event.registered_players === 0) return 0;
      return Math.round((event.scored_players / event.registered_players) * 100);
    },
    
    getProgressColor(event) {
      const percentage = this.getProgressPercentage(event);
      if (percentage === 100) return '#67c23a';
      if (percentage >= 50) return '#e6a23c';
      return '#f56c6c';
    },
    
    getScoreTagType(event) {
      if (event.scored_players === 0) return 'info';
      if (event.scored_players === event.registered_players) return 'success';
      return 'warning';
    },
    
    getStatusTagType(status) {
      const typeMap = {
        1: 'warning',  // 已分配
        2: 'primary',  // 已确认
        3: 'success',  // 已完成
        4: 'danger'    // 已取消
      };
      return typeMap[status] || 'info';
    },
    
    getStatusText(status) {
      const textMap = {
        1: '已分配',
        2: '已确认',
        3: '已完成',
        4: '已取消'
      };
      return textMap[status] || '未知';
    }
  }
};
</script>

<style scoped>
.judge-events {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.event-name {
  line-height: 1.4;
}

.project-type {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  margin-left: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 20px;
  display: block;
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

.empty-tip {
  font-size: 14px !important;
  color: #c0c4cc !important;
}

.event-detail {
  padding: 0;
}

.event-detail-grid {
  padding: 15px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e6e6e6;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 12px;
  min-width: 80px;
  flex-shrink: 0;
}

.detail-item .value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.participants-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.no-score {
  color: #c0c4cc;
  font-size: 12px;
}

.dialog-footer {
  text-align: right;
}
</style>

<template>
  <div class="available-events" v-loading="loading">
    <el-card>
      <div slot="header">
        <span>可报名项目</span>
        <el-button 
          style="float: right; padding: 3px 0" 
          type="text" 
          @click="refreshEvents"
          :loading="loading"
        >
          刷新
        </el-button>
      </div>
      
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="项目类型">
            <el-select v-model="filterForm.itemType" placeholder="全部类型" clearable>
              <el-option 
                v-for="type in eventTypes" 
                :key="type.value" 
                :label="type.label" 
                :value="type.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="比赛日期">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">筛选</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 项目列表 -->
      <div class="events-grid">
        <el-row :gutter="20">
          <el-col 
            :span="8" 
            v-for="event in filteredEvents" 
            :key="event.schedule_id"
            class="event-col"
          >
            <el-card class="event-card" :class="{ 'registered': event.is_registered }">
              <div class="event-header">
                <h3 class="event-title">{{ event.schedule_name }}</h3>
                <el-tag 
                  :type="getEventStatusType(event)" 
                  size="small"
                >
                  {{ getEventStatusText(event) }}
                </el-tag>
              </div>
              
              <div class="event-info">
                <div class="info-item">
                  <i class="el-icon-date"></i>
                  <span>{{ formatDate(event.schedule_date) }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-time"></i>
                  <span>{{ event.schedule_starttime }} - {{ event.schedule_endtime }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-user"></i>
                  <span>{{ event.current_participants }}/{{ event.max_participants }} 人</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-tickets"></i>
                  <span>剩余名额：{{ event.available_slots }} 个</span>
                </div>
              </div>
              
              <div class="event-description">
                <p>{{ event.schedule_introduction || '暂无项目介绍' }}</p>
              </div>
              
              <div class="event-actions">
                <el-button 
                  v-if="!event.is_registered && event.available_slots > 0"
                  type="primary" 
                  size="small" 
                  @click="registerEvent(event)"
                  :loading="registeringEvents.includes(event.schedule_id)"
                >
                  立即报名
                </el-button>
                <el-button 
                  v-else-if="event.is_registered"
                  type="success" 
                  size="small" 
                  disabled
                >
                  已报名
                </el-button>
                <el-button 
                  v-else
                  type="info" 
                  size="small" 
                  disabled
                >
                  名额已满
                </el-button>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="viewEventDetail(event)"
                >
                  查看详情
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredEvents.length === 0 && !loading" class="empty-state">
        <i class="el-icon-document"></i>
        <p>暂无可报名的项目</p>
      </div>
    </el-card>
    
    <!-- 报名确认对话框 -->
    <el-dialog
      title="报名确认"
      :visible.sync="confirmDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedEvent">
        <h4>{{ selectedEvent.schedule_name }}</h4>
        <!-- 使用兼容的Element UI组件替代el-descriptions -->
        <div class="event-details">
          <div class="detail-row">
            <span class="detail-label">比赛日期：</span>
            <span class="detail-value">{{ formatDate(selectedEvent.schedule_date) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">比赛时间：</span>
            <span class="detail-value">{{ selectedEvent.schedule_starttime }} - {{ selectedEvent.schedule_endtime }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">当前报名：</span>
            <span class="detail-value">{{ selectedEvent.current_participants }}/{{ selectedEvent.max_participants }} 人</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">剩余名额：</span>
            <span class="detail-value">{{ selectedEvent.available_slots }} 个</span>
          </div>
        </div>
        
        <div class="confirm-note">
          <el-alert
            title="报名须知"
            type="info"
            :closable="false"
            show-icon
          >
            <ul>
              <li>每人最多可报名 3 个项目</li>
              <li>每班每项目最多 5 人</li>
              <li>报名后请按时参加比赛</li>
              <li>如需取消报名，请在比赛前联系管理员</li>
            </ul>
          </el-alert>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmRegistration"
          :loading="confirming"
        >
          确认报名
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getAvailableEvents,
  createRegistration,
  checkRegistrationLimits
} from '@/api/demo';

export default {
  name: 'AvailableEvents',
  data() {
    return {
      loading: false,
      events: [],
      filteredEvents: [],
      registeringEvents: [],
      confirmDialogVisible: false,
      selectedEvent: null,
      confirming: false,
      filterForm: {
        itemType: '',
        dateRange: []
      },
      eventTypes: [
        { label: '田径', value: '田径' },
        { label: '球类', value: '球类' },
        { label: '游泳', value: '游泳' },
        { label: '体操', value: '体操' }
      ]
    };
  },
  async mounted() {
    await this.loadEvents();

    // 监听报名数据更新事件
    this.$root.$on('registration-updated', this.handleRegistrationUpdate);
  },

  // 页面激活时刷新数据
  async activated() {
    await this.loadEvents();
  },

  beforeDestroy() {
    // 移除事件监听
    this.$root.$off('registration-updated', this.handleRegistrationUpdate);
  },
  methods: {
    async loadEvents() {
      this.loading = true;
      try {
        const result = await getAvailableEvents();
        if (result.success) {
          this.events = result.data;
          this.applyFilter();
        } else {
          this.$message.error(result.message || '获取项目列表失败');
        }
      } catch (error) {
        console.error('获取项目列表失败:', error);
        this.$message.error('获取项目列表失败，请刷新重试');
      } finally {
        this.loading = false;
      }
    },

    async refreshEvents() {
      await this.loadEvents();
      this.$message.success('项目列表已刷新');
    },

    applyFilter() {
      let filtered = [...this.events];
      // 按项目类型筛选
      if (this.filterForm.itemType) {
        filtered = filtered.filter(event =>
          event.schedule_itemid.toString().includes(this.filterForm.itemType)
        );
      }
      
      // 按日期范围筛选
      if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
        const [startDate, endDate] = this.filterForm.dateRange;
        filtered = filtered.filter(event => {
          const eventDate = event.schedule_date;
          return eventDate >= startDate && eventDate <= endDate;
        });
      }
      
      this.filteredEvents = filtered;
    },
    
    resetFilter() {
      this.filterForm = {
        itemType: '',
        dateRange: []
      };
      this.applyFilter();
    },
    
    async registerEvent(event) {
      // 先检查报名限制
      try {
        const limitResult = await checkRegistrationLimits({
          scheduleId: event.schedule_id
        });
        
        if (limitResult.success && !limitResult.data.canRegister) {
          this.$message.error(limitResult.data.errorMessage);
          return;
        }
      } catch (error) {
        console.error('检查报名限制失败:', error);
      }
      
      this.selectedEvent = event;
      this.confirmDialogVisible = true;
    },
    
    async confirmRegistration() {
      if (!this.selectedEvent) return;
      
      this.confirming = true;
      try {
        const result = await createRegistration({
          scheduleId: this.selectedEvent.schedule_id
        });
        
        if (result.success) {
          this.$message.success('报名成功！');
          this.confirmDialogVisible = false;

          // 更新事件状态
          const eventIndex = this.events.findIndex(e =>
            e.schedule_id === this.selectedEvent.schedule_id
          );
          if (eventIndex !== -1) {
            this.events[eventIndex].is_registered = 1;
            this.events[eventIndex].current_participants += 1;
            this.events[eventIndex].available_slots -= 1;
          }
          this.applyFilter();

          // 发出全局事件通知其他页面刷新数据
          this.$root.$emit('registration-updated');
        } else {
          this.$message.error(result.message || '报名失败');
        }
      } catch (error) {
        console.error('报名失败:', error);
        this.$message.error('报名失败，请稍后重试');
      } finally {
        this.confirming = false;
      }
    },
    
    viewEventDetail(event) {
      // 可以打开详情对话框或跳转到详情页
      this.$message.info('项目详情功能开发中...');
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '--';
      return new Date(dateStr).toLocaleDateString();
    },
    
    getEventStatusType(event) {
      if (event.is_registered) return 'success';
      if (event.available_slots <= 0) return 'danger';
      if (event.available_slots <= 5) return 'warning';
      return 'primary';
    },
    
    getEventStatusText(event) {
      if (event.is_registered) return '已报名';
      if (event.available_slots <= 0) return '名额已满';
      if (event.available_slots <= 5) return '名额紧张';
      return '可报名';
    },

    // 处理报名数据更新事件
    async handleRegistrationUpdate() {
      await this.loadEvents();
    }
  }
};
</script>

<style scoped>
.available-events {
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

.events-grid {
  margin-bottom: 20px;
}

.event-col {
  margin-bottom: 20px;
}

.event-card {
  height: 100%;
  transition: all 0.3s;
  cursor: pointer;
}

.event-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.event-card.registered {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.event-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.event-info {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.info-item i {
  margin-right: 8px;
  color: #909399;
}

.event-description {
  margin-bottom: 15px;
  color: #909399;
  font-size: 14px;
  line-height: 1.5;
}

.event-description p {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  margin: 0;
  font-size: 16px;
}

.confirm-note {
  margin-top: 20px;
}

.confirm-note ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.confirm-note li {
  margin-bottom: 5px;
  color: #606266;
}

/* 事件详情样式 */
.event-details {
  margin: 15px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.detail-row {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row:nth-child(even) {
  background-color: #fff;
}

.detail-label {
  font-weight: bold;
  color: #606266;
  min-width: 80px;
  flex-shrink: 0;
}

.detail-value {
  color: #303133;
  flex: 1;
}
</style>

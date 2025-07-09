<template>
  <div class="notification-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="el-icon-bell"></i>
          通知中心
        </h2>
        <p class="page-description">查看和管理系统通知消息</p>
      </div>
      <div class="header-actions">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
          <el-button 
            type="primary" 
            icon="el-icon-check" 
            @click="markAllAsRead"
            :disabled="unreadCount === 0"
          >
            全部已读
          </el-button>
        </el-badge>
        <el-button 
          type="success" 
          icon="el-icon-refresh" 
          @click="refreshData"
          :loading="loading"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div class="filter-form">
        <el-form :model="filterForm" inline>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
              <el-option label="未读" :value="0"></el-option>
              <el-option label="已读" :value="1"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filterForm.type" placeholder="全部类型" clearable>
              <el-option label="报名审核" value="registration_review"></el-option>
              <el-option label="成绩更新" value="score_update"></el-option>
              <el-option label="系统通知" value="system_notice"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="filterForm.priority" placeholder="全部优先级" clearable>
              <el-option label="普通" :value="1"></el-option>
              <el-option label="重要" :value="2"></el-option>
              <el-option label="紧急" :value="3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 通知列表 -->
    <el-card class="notification-list-card">
      <div v-loading="loading" class="notification-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.notification_id"
          class="notification-item"
          :class="{ 'unread': notification.status === 0 }"
          @click="markAsRead(notification)"
        >
          <div class="notification-header">
            <div class="notification-title">
              <i :class="getNotificationIcon(notification.type)"></i>
              <span>{{ notification.title }}</span>
              <el-tag 
                v-if="notification.priority > 1" 
                :type="getPriorityType(notification.priority)"
                size="mini"
              >
                {{ getPriorityText(notification.priority) }}
              </el-tag>
            </div>
            <div class="notification-actions">
              <el-button 
                v-if="notification.status === 0"
                type="text" 
                size="mini" 
                @click.stop="markAsRead(notification)"
              >
                标记已读
              </el-button>
              <el-button 
                type="text" 
                size="mini" 
                style="color: #f56c6c;"
                @click.stop="deleteNotification(notification)"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <div class="notification-content">
            {{ notification.content }}
          </div>
          
          <div class="notification-footer">
            <div class="notification-meta">
              <el-tag :type="getTypeColor(notification.type)" size="mini">
                {{ getTypeText(notification.type) }}
              </el-tag>
              <span class="notification-time">
                {{ formatDateTime(notification.created_at) }}
              </span>
            </div>
            <div class="notification-status">
              <el-tag 
                :type="notification.status === 0 ? 'danger' : 'success'" 
                size="mini"
              >
                {{ notification.status === 0 ? '未读' : '已读' }}
              </el-tag>
              <span v-if="notification.read_time" class="read-time">
                已读于 {{ formatDateTime(notification.read_time) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="notifications.length === 0 && !loading" class="empty-state">
          <i class="el-icon-bell"></i>
          <p>暂无通知消息</p>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="pagination.total > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 批量操作 -->
    <div class="batch-actions" v-if="selectedNotifications.length > 0">
      <el-card>
        <div class="batch-content">
          <span>已选择 {{ selectedNotifications.length }} 个通知</span>
          <div class="batch-buttons">
            <el-button 
              type="primary" 
              size="small"
              @click="batchMarkAsRead"
            >
              批量已读
            </el-button>
            <el-button 
              type="danger" 
              size="small"
              @click="batchDelete"
            >
              批量删除
            </el-button>
            <el-button 
              size="small"
              @click="clearSelection"
            >
              取消选择
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'NotificationCenter',
  computed: {
    ...mapGetters(['userInfo'])
  },
  data() {
    return {
      loading: false,
      
      // 筛选表单
      filterForm: {
        status: null,
        type: '',
        priority: null
      },
      
      // 通知列表
      notifications: [],
      
      // 未读数量
      unreadCount: 0,
      
      // 分页
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      
      // 选中的通知
      selectedNotifications: []
    };
  },
  
  async created() {
    await this.loadData();
    await this.loadUnreadCount();
    
    // 定时刷新未读数量
    this.unreadCountTimer = setInterval(() => {
      this.loadUnreadCount();
    }, 30000); // 30秒刷新一次
  },
  
  beforeDestroy() {
    if (this.unreadCountTimer) {
      clearInterval(this.unreadCountTimer);
    }
  },
  
  methods: {
    // 加载通知数据
    async loadData() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          ...this.filterForm
        };
        
        const response = await this.$http.get('/api/notifications', { params });
        if (response.data.success) {
          this.notifications = response.data.data.list;
          this.pagination.total = response.data.data.total;
        } else {
          this.$message.error(response.data.message || '获取通知失败');
        }
      } catch (error) {
        console.error('加载通知数据失败:', error);
        this.$message.error('加载数据失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载未读数量
    async loadUnreadCount() {
      try {
        const response = await this.$http.get('/api/notifications/unread-count');
        if (response.data.success) {
          this.unreadCount = response.data.data.count;
        }
      } catch (error) {
        console.error('获取未读数量失败:', error);
      }
    },
    
    // 刷新数据
    async refreshData() {
      await this.loadData();
      await this.loadUnreadCount();
      this.$message.success('数据已刷新');
    },
    
    // 应用筛选
    async applyFilter() {
      this.pagination.page = 1;
      await this.loadData();
    },
    
    // 重置筛选
    async resetFilter() {
      this.filterForm = {
        status: null,
        type: '',
        priority: null
      };
      this.pagination.page = 1;
      await this.loadData();
    },
    
    // 标记单个通知为已读
    async markAsRead(notification) {
      if (notification.status === 1) return; // 已经是已读状态
      
      try {
        const response = await this.$http.put(`/api/notifications/${notification.notification_id}/read`);
        if (response.data.success) {
          notification.status = 1;
          notification.read_time = new Date().toISOString();
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        } else {
          this.$message.error(response.data.message || '标记失败');
        }
      } catch (error) {
        console.error('标记已读失败:', error);
        this.$message.error('操作失败，请稍后重试');
      }
    },
    
    // 全部标记为已读
    async markAllAsRead() {
      try {
        await this.$confirm('确定要将所有未读通知标记为已读吗？', '确认操作', {
          type: 'info'
        });
        
        const response = await this.$http.put('/api/notifications/mark-all-read');
        if (response.data.success) {
          this.$message.success(`成功标记 ${response.data.data.count} 个通知为已读`);
          await this.loadData();
          await this.loadUnreadCount();
        } else {
          this.$message.error(response.data.message || '操作失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('全部标记已读失败:', error);
          this.$message.error('操作失败，请稍后重试');
        }
      }
    },
    
    // 删除通知
    async deleteNotification(notification) {
      try {
        await this.$confirm('确定要删除这个通知吗？', '删除确认', {
          type: 'warning'
        });
        
        const response = await this.$http.delete(`/api/notifications/${notification.notification_id}`);
        if (response.data.success) {
          this.$message.success('删除成功');
          await this.loadData();
          if (notification.status === 0) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
        } else {
          this.$message.error(response.data.message || '删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除通知失败:', error);
          this.$message.error('删除失败，请稍后重试');
        }
      }
    },
    
    // 分页处理
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.page = 1;
      this.loadData();
    },
    
    handleCurrentChange(val) {
      this.pagination.page = val;
      this.loadData();
    },
    
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-';
      return new Date(dateTime).toLocaleString('zh-CN');
    },
    
    // 获取通知图标
    getNotificationIcon(type) {
      const iconMap = {
        registration_review: 'el-icon-document-checked',
        score_update: 'el-icon-trophy',
        system_notice: 'el-icon-info'
      };
      return iconMap[type] || 'el-icon-bell';
    },
    
    // 获取类型颜色
    getTypeColor(type) {
      const colorMap = {
        registration_review: 'primary',
        score_update: 'success',
        system_notice: 'info'
      };
      return colorMap[type] || '';
    },
    
    // 获取类型文本
    getTypeText(type) {
      const textMap = {
        registration_review: '报名审核',
        score_update: '成绩更新',
        system_notice: '系统通知'
      };
      return textMap[type] || type;
    },
    
    // 获取优先级类型
    getPriorityType(priority) {
      const typeMap = {
        1: '',
        2: 'warning',
        3: 'danger'
      };
      return typeMap[priority] || '';
    },
    
    // 获取优先级文本
    getPriorityText(priority) {
      const textMap = {
        1: '普通',
        2: '重要',
        3: '紧急'
      };
      return textMap[priority] || '普通';
    }
  }
};
</script>

<style scoped>
.notification-center {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.header-content h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-content p {
  margin: 5px 0 0 0;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-badge {
  margin-right: 10px;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filter-form {
  padding: 10px 0;
}

/* 通知列表卡片 */
.notification-list-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.notification-list {
  min-height: 300px;
}

/* 通知项 */
.notification-item {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
}

.notification-item:last-child {
  border-bottom: none;
}

/* 通知头部 */
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.notification-title i {
  font-size: 18px;
  color: #409eff;
}

.notification-actions {
  display: flex;
  gap: 5px;
}

/* 通知内容 */
.notification-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
  font-size: 14px;
}

/* 通知底部 */
.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-time {
  color: #c0c4cc;
}

.notification-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.read-time {
  color: #c0c4cc;
  font-size: 11px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
  display: block;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

/* 批量操作 */
.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.batch-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.batch-buttons {
  display: flex;
  gap: 10px;
  margin-left: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-center {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    margin-top: 15px;
  }

  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .notification-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-form .el-form {
    flex-direction: column;
  }

  .filter-form .el-form-item {
    margin-bottom: 15px;
  }

  .batch-actions {
    left: 10px;
    right: 10px;
    transform: none;
  }

  .batch-content {
    flex-direction: column;
    gap: 10px;
  }

  .batch-buttons {
    margin-left: 0;
  }
}
</style>

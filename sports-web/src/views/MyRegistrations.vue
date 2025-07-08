<template>
  <div class="my-registrations" v-loading="loading">
    <el-card>
      <div slot="header">
        <span>我的报名</span>
        <el-button 
          style="float: right; padding: 3px 0" 
          type="text" 
          @click="refreshRegistrations"
          :loading="loading"
        >
          刷新
        </el-button>
      </div>
      
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="报名状态">
            <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
              <el-option label="已报名" value="1"></el-option>
              <el-option label="已确认" value="2"></el-option>
              <el-option label="已取消" value="3"></el-option>
              <el-option label="已拒绝" value="4"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">筛选</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 报名列表 -->
      <el-table :data="filteredRegistrations" style="width: 100%">
        <el-table-column prop="schedule_name" label="项目名称" width="200">
          <template slot-scope="scope">
            <strong>{{ scope.row.schedule_name }}</strong>
            <div class="item-type">{{ scope.row.schedule_itemname }}</div>
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
        
        <el-table-column prop="registration_status" label="报名状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.registration_status)">
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="registration_time" label="报名时间" width="150">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.registration_time) }}
          </template>
        </el-table-column>
        
        <el-table-column label="备注" min-width="150">
          <template slot-scope="scope">
            <div v-if="scope.row.admin_note" class="note-text">
              {{ scope.row.admin_note }}
            </div>
            <div v-if="scope.row.cancel_reason" class="cancel-reason">
              <span class="reason-label">取消原因：</span>
              {{ scope.row.cancel_reason }}
            </div>
            <span v-if="!scope.row.admin_note && !scope.row.cancel_reason" class="no-note">
              --
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150">
          <template slot-scope="scope">
            <el-button 
              v-if="scope.row.registration_status === 1 || scope.row.registration_status === 2"
              size="mini" 
              type="danger" 
              @click="cancelRegistration(scope.row)"
              :loading="cancelingIds.includes(scope.row.registration_id)"
            >
              取消报名
            </el-button>
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
      <div v-if="filteredRegistrations.length === 0 && !loading" class="empty-state">
        <i class="el-icon-document"></i>
        <p>暂无报名记录</p>
        <el-button type="primary" @click="goToRegistration">去报名</el-button>
      </div>
    </el-card>
    
    <!-- 取消报名对话框 -->
    <el-dialog
      title="取消报名"
      :visible.sync="cancelDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedRegistration">
        <el-alert
          title="确认取消报名"
          type="warning"
          :closable="false"
          show-icon
        >
          您确定要取消报名 "{{ selectedRegistration.schedule_name }}" 吗？
        </el-alert>
        
        <el-form :model="cancelForm" style="margin-top: 20px;">
          <el-form-item label="取消原因">
            <el-input
              v-model="cancelForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入取消原因（可选）"
              maxlength="200"
              show-word-limit
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="confirmCancel"
          :loading="confirming"
        >
          确认取消
        </el-button>
      </span>
    </el-dialog>
    
    <!-- 详情对话框 -->
    <el-dialog
      title="报名详情"
      :visible.sync="detailDialogVisible"
      width="600px"
    >
      <div v-if="selectedRegistration">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称" :span="2">
            {{ selectedRegistration.schedule_name }}
          </el-descriptions-item>
          <el-descriptions-item label="项目类型">
            {{ selectedRegistration.schedule_itemname }}
          </el-descriptions-item>
          <el-descriptions-item label="报名状态">
            <el-tag :type="getStatusType(selectedRegistration.registration_status)">
              {{ selectedRegistration.status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="比赛日期">
            {{ formatDate(selectedRegistration.schedule_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="比赛时间">
            {{ selectedRegistration.schedule_starttime }} - {{ selectedRegistration.schedule_endtime }}
          </el-descriptions-item>
          <el-descriptions-item label="报名时间" :span="2">
            {{ formatDateTime(selectedRegistration.registration_time) }}
          </el-descriptions-item>
          <el-descriptions-item 
            v-if="selectedRegistration.confirmation_time" 
            label="确认时间" 
            :span="2"
          >
            {{ formatDateTime(selectedRegistration.confirmation_time) }}
          </el-descriptions-item>
          <el-descriptions-item 
            v-if="selectedRegistration.cancel_time" 
            label="取消时间" 
            :span="2"
          >
            {{ formatDateTime(selectedRegistration.cancel_time) }}
          </el-descriptions-item>
          <el-descriptions-item 
            v-if="selectedRegistration.admin_note" 
            label="管理员备注" 
            :span="2"
          >
            {{ selectedRegistration.admin_note }}
          </el-descriptions-item>
          <el-descriptions-item 
            v-if="selectedRegistration.cancel_reason" 
            label="取消原因" 
            :span="2"
          >
            {{ selectedRegistration.cancel_reason }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedRegistration.schedule_introduction" style="margin-top: 20px;">
          <h4>项目介绍</h4>
          <p>{{ selectedRegistration.schedule_introduction }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getMyRegistrations, cancelRegistration } from '@/api/demo';

export default {
  name: 'MyRegistrations',
  data() {
    return {
      loading: false,
      registrations: [],
      filteredRegistrations: [],
      cancelingIds: [],
      cancelDialogVisible: false,
      detailDialogVisible: false,
      selectedRegistration: null,
      confirming: false,
      filterForm: {
        status: ''
      },
      cancelForm: {
        reason: ''
      }
    };
  },
  async mounted() {
    await this.loadRegistrations();
  },
  methods: {
    async loadRegistrations() {
      this.loading = true;
      try {
        const result = await getMyRegistrations();
        if (result.success) {
          this.registrations = result.data;
          this.applyFilter();
        } else {
          this.$message.error(result.message || '获取报名列表失败');
        }
      } catch (error) {
        console.error('获取报名列表失败:', error);
        this.$message.error('获取报名列表失败，请刷新重试');
      } finally {
        this.loading = false;
      }
    },
    
    async refreshRegistrations() {
      await this.loadRegistrations();
      this.$message.success('报名列表已刷新');
    },
    
    applyFilter() {
      let filtered = [...this.registrations];
      
      if (this.filterForm.status) {
        filtered = filtered.filter(reg => 
          reg.registration_status.toString() === this.filterForm.status
        );
      }
      
      this.filteredRegistrations = filtered;
    },
    
    resetFilter() {
      this.filterForm.status = '';
      this.applyFilter();
    },
    
    cancelRegistration(registration) {
      this.selectedRegistration = registration;
      this.cancelForm.reason = '';
      this.cancelDialogVisible = true;
    },
    
    async confirmCancel() {
      if (!this.selectedRegistration) return;
      
      this.confirming = true;
      try {
        const result = await cancelRegistration(this.selectedRegistration.registration_id);
        
        if (result.success) {
          this.$message.success('取消报名成功');
          this.cancelDialogVisible = false;
          
          // 更新本地数据
          const index = this.registrations.findIndex(r => 
            r.registration_id === this.selectedRegistration.registration_id
          );
          if (index !== -1) {
            this.registrations[index].registration_status = 3;
            this.registrations[index].status_text = '已取消';
            this.registrations[index].cancel_time = new Date().toISOString();
            this.registrations[index].cancel_reason = this.cancelForm.reason;
          }
          this.applyFilter();
        } else {
          this.$message.error(result.message || '取消报名失败');
        }
      } catch (error) {
        console.error('取消报名失败:', error);
        this.$message.error('取消报名失败，请稍后重试');
      } finally {
        this.confirming = false;
      }
    },
    
    viewDetail(registration) {
      this.selectedRegistration = registration;
      this.detailDialogVisible = true;
    },
    
    goToRegistration() {
      this.$router.push('/player/registration');
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '--';
      return new Date(dateStr).toLocaleDateString();
    },
    
    formatDateTime(dateStr) {
      if (!dateStr) return '--';
      return new Date(dateStr).toLocaleString();
    },
    
    getStatusType(status) {
      const statusMap = {
        1: 'primary',  // 已报名
        2: 'success',  // 已确认
        3: 'info',     // 已取消
        4: 'danger'    // 已拒绝
      };
      return statusMap[status] || 'info';
    }
  }
};
</script>

<style scoped>
.my-registrations {
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

.item-type {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.note-text {
  color: #606266;
  font-size: 14px;
}

.cancel-reason {
  color: #f56c6c;
  font-size: 14px;
}

.reason-label {
  font-weight: bold;
}

.no-note {
  color: #c0c4cc;
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
  margin: 0 0 20px 0;
  font-size: 16px;
}
</style>

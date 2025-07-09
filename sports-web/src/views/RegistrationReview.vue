<template>
  <div class="registration-review">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="el-icon-document-checked"></i>
          报名审核管理
        </h2>
        <p class="page-description">管理和审核运动员报名申请</p>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          icon="el-icon-refresh" 
          @click="refreshData"
          :loading="loading"
        >
          刷新数据
        </el-button>
        <el-button 
          type="success" 
          icon="el-icon-download" 
          @click="exportData"
        >
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card pending">
            <div class="stat-icon">
              <i class="el-icon-time"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.pending_count || 0 }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card approved">
            <div class="stat-icon">
              <i class="el-icon-check"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.approved_count || 0 }}</div>
              <div class="stat-label">已批准</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card rejected">
            <div class="stat-icon">
              <i class="el-icon-close"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.rejected_count || 0 }}</div>
              <div class="stat-label">已拒绝</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.total_registrations || 0 }}</div>
              <div class="stat-label">总报名</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div class="filter-form">
        <el-form :model="filterForm" inline>
          <el-form-item label="报名状态">
            <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
              <el-option label="待审核" :value="1"></el-option>
              <el-option label="已批准" :value="2"></el-option>
              <el-option label="已拒绝" :value="4"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="比赛项目">
            <el-select v-model="filterForm.scheduleId" placeholder="全部项目" clearable>
              <el-option 
                v-for="event in eventOptions" 
                :key="event.schedule_id"
                :label="event.schedule_name" 
                :value="event.schedule_id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="班级">
            <el-input 
              v-model="filterForm.playerClass" 
              placeholder="输入班级名称" 
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 批量操作 -->
    <div class="batch-actions" v-if="selectedRows.length > 0">
      <el-alert
        :title="`已选择 ${selectedRows.length} 条记录`"
        type="info"
        show-icon
        :closable="false"
      >
        <div slot="default">
          <el-button 
            type="success" 
            size="small" 
            @click="batchApprove"
            :loading="batchLoading"
          >
            批量批准
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="batchReject"
            :loading="batchLoading"
          >
            批量拒绝
          </el-button>
          <el-button 
            size="small" 
            @click="clearSelection"
          >
            取消选择
          </el-button>
        </div>
      </el-alert>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        row-key="registration_id"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        
        <el-table-column prop="player_name" label="运动员" width="100">
          <template slot-scope="scope">
            <div class="player-info">
              <div class="player-name">{{ scope.row.player_name }}</div>
              <div class="player-class">{{ scope.row.player_class }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="schedule_name" label="比赛项目" width="150">
          <template slot-scope="scope">
            <div class="event-info">
              <div class="event-name">{{ scope.row.schedule_name }}</div>
              <div class="event-date">{{ scope.row.schedule_date }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="registration_time" label="报名时间" width="150">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.registration_time) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="status_text" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag 
              :type="getStatusType(scope.row.registration_status)"
              size="small"
            >
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="admin_note" label="审核备注" min-width="150">
          <template slot-scope="scope">
            <span v-if="scope.row.admin_note">{{ scope.row.admin_note }}</span>
            <span v-else class="text-muted">暂无备注</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button 
                v-if="scope.row.registration_status === 1"
                type="success" 
                size="mini" 
                @click="approveRegistration(scope.row)"
                :loading="actionLoading[scope.row.registration_id]"
              >
                批准
              </el-button>
              <el-button 
                v-if="scope.row.registration_status === 1"
                type="danger" 
                size="mini" 
                @click="rejectRegistration(scope.row)"
                :loading="actionLoading[scope.row.registration_id]"
              >
                拒绝
              </el-button>
              <el-button 
                type="text" 
                size="mini" 
                @click="viewDetail(scope.row)"
              >
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog
      :title="reviewDialog.title"
      :visible.sync="reviewDialog.visible"
      width="500px"
      @close="resetReviewDialog"
    >
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="运动员">
          <span>{{ reviewDialog.registration?.player_name }}</span>
        </el-form-item>
        <el-form-item label="比赛项目">
          <span>{{ reviewDialog.registration?.schedule_name }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-tag 
            :type="reviewDialog.action === 'approve' ? 'success' : 'danger'"
            size="medium"
          >
            {{ reviewDialog.action === 'approve' ? '批准' : '拒绝' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input
            v-model="reviewForm.note"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注（可选）"
            maxlength="500"
            show-word-limit
          ></el-input>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="reviewDialog.visible = false">取消</el-button>
        <el-button 
          :type="reviewDialog.action === 'approve' ? 'success' : 'danger'"
          @click="confirmReview"
          :loading="reviewDialog.loading"
        >
          确认{{ reviewDialog.action === 'approve' ? '批准' : '拒绝' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      title="报名详情"
      :visible.sync="detailDialog.visible"
      width="600px"
    >
      <div v-if="detailDialog.registration" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="运动员姓名">
            {{ detailDialog.registration.player_name }}
          </el-descriptions-item>
          <el-descriptions-item label="学号">
            {{ detailDialog.registration.player_studentid }}
          </el-descriptions-item>
          <el-descriptions-item label="班级">
            {{ detailDialog.registration.player_class }}
          </el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ detailDialog.registration.player_sex }}
          </el-descriptions-item>
          <el-descriptions-item label="比赛项目">
            {{ detailDialog.registration.schedule_name }}
          </el-descriptions-item>
          <el-descriptions-item label="比赛日期">
            {{ detailDialog.registration.schedule_date }}
          </el-descriptions-item>
          <el-descriptions-item label="比赛时间">
            {{ detailDialog.registration.schedule_starttime }} - {{ detailDialog.registration.schedule_endtime }}
          </el-descriptions-item>
          <el-descriptions-item label="报名时间">
            {{ formatDateTime(detailDialog.registration.registration_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="报名状态">
            <el-tag :type="getStatusType(detailDialog.registration.registration_status)">
              {{ detailDialog.registration.status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核时间" v-if="detailDialog.registration.confirmation_time">
            {{ formatDateTime(detailDialog.registration.confirmation_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="审核备注" :span="2" v-if="detailDialog.registration.admin_note">
            {{ detailDialog.registration.admin_note }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="detailDialog.registration.schedule_introduction" class="project-intro">
          <h4>项目介绍</h4>
          <p>{{ detailDialog.registration.schedule_introduction }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getPendingRegistrations,
  batchReviewRegistrations,
  reviewRegistration,
  getRegistrationStats,
  exportRegistrations
} from '@/api/demo.js';

export default {
  name: 'RegistrationReview',
  data() {
    return {
      loading: false,
      batchLoading: false,

      // 统计数据
      stats: {
        total_registrations: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0
      },

      // 筛选表单
      filterForm: {
        status: null,
        scheduleId: null,
        playerClass: ''
      },

      // 项目选项
      eventOptions: [],

      // 表格数据
      tableData: [],
      selectedRows: [],

      // 分页
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },

      // 操作加载状态
      actionLoading: {},

      // 审核对话框
      reviewDialog: {
        visible: false,
        title: '',
        action: '', // 'approve' or 'reject'
        registration: null,
        loading: false
      },

      // 审核表单
      reviewForm: {
        note: ''
      },

      // 详情对话框
      detailDialog: {
        visible: false,
        registration: null
      }
    };
  },

  async created() {
    await this.loadData();
    await this.loadStats();
    await this.loadEventOptions();
  },

  methods: {
    // 加载数据
    async loadData() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          ...this.filterForm
        };

        const result = await getPendingRegistrations(params);
        if (result.success) {
          this.tableData = result.data.list;
          this.pagination.total = result.data.total;
        } else {
          this.$message.error(result.message || '获取数据失败');
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        this.$message.error('加载数据失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },

    // 加载统计数据
    async loadStats() {
      try {
        const result = await getRegistrationStats();
        if (result.success) {
          this.stats = result.data.basic;
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },

    // 加载项目选项
    async loadEventOptions() {
      try {
        // 这里应该调用获取所有项目的API
        // 暂时使用空数组，实际项目中需要实现
        this.eventOptions = [];
      } catch (error) {
        console.error('加载项目选项失败:', error);
      }
    },

    // 刷新数据
    async refreshData() {
      await this.loadData();
      await this.loadStats();
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
        scheduleId: null,
        playerClass: ''
      };
      this.pagination.page = 1;
      await this.loadData();
    },

    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },

    // 清除选择
    clearSelection() {
      this.$refs.table?.clearSelection();
      this.selectedRows = [];
    },

    // 批量批准
    async batchApprove() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请先选择要批准的报名');
        return;
      }

      const pendingRows = this.selectedRows.filter(row => row.registration_status === 1);
      if (pendingRows.length === 0) {
        this.$message.warning('所选报名中没有待审核状态的记录');
        return;
      }

      try {
        await this.$confirm(`确定要批准选中的 ${pendingRows.length} 个报名吗？`, '批量批准', {
          type: 'warning'
        });

        this.batchLoading = true;
        const registrationIds = pendingRows.map(row => row.registration_id);

        const result = await batchReviewRegistrations({
          registrationIds,
          action: 'approve',
          note: '批量批准'
        });

        if (result.success) {
          this.$message.success(`成功批准 ${result.data.successCount} 个报名`);
          await this.loadData();
          await this.loadStats();
          this.clearSelection();
        } else {
          this.$message.error(result.message || '批量批准失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量批准失败:', error);
          this.$message.error('批量批准失败，请稍后重试');
        }
      } finally {
        this.batchLoading = false;
      }
    },

    // 批量拒绝
    async batchReject() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请先选择要拒绝的报名');
        return;
      }

      const pendingRows = this.selectedRows.filter(row => row.registration_status === 1);
      if (pendingRows.length === 0) {
        this.$message.warning('所选报名中没有待审核状态的记录');
        return;
      }

      try {
        const { value: reason } = await this.$prompt('请输入拒绝理由', '批量拒绝', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'textarea',
          inputValidator: (value) => {
            if (!value || value.trim().length === 0) {
              return '请输入拒绝理由';
            }
            return true;
          }
        });

        this.batchLoading = true;
        const registrationIds = pendingRows.map(row => row.registration_id);

        const result = await batchReviewRegistrations({
          registrationIds,
          action: 'reject',
          note: reason
        });

        if (result.success) {
          this.$message.success(`成功拒绝 ${result.data.successCount} 个报名`);
          await this.loadData();
          await this.loadStats();
          this.clearSelection();
        } else {
          this.$message.error(result.message || '批量拒绝失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量拒绝失败:', error);
          this.$message.error('批量拒绝失败，请稍后重试');
        }
      } finally {
        this.batchLoading = false;
      }
    },

    // 单个批准
    approveRegistration(registration) {
      this.reviewDialog = {
        visible: true,
        title: '批准报名',
        action: 'approve',
        registration,
        loading: false
      };
      this.reviewForm.note = '';
    },

    // 单个拒绝
    rejectRegistration(registration) {
      this.reviewDialog = {
        visible: true,
        title: '拒绝报名',
        action: 'reject',
        registration,
        loading: false
      };
      this.reviewForm.note = '';
    },

    // 确认审核
    async confirmReview() {
      this.reviewDialog.loading = true;
      try {
        const result = await reviewRegistration(this.reviewDialog.registration.registration_id, {
          action: this.reviewDialog.action,
          note: this.reviewForm.note
        });

        if (result.success) {
          this.$message.success(`报名${this.reviewDialog.action === 'approve' ? '批准' : '拒绝'}成功`);
          this.reviewDialog.visible = false;
          await this.loadData();
          await this.loadStats();
        } else {
          this.$message.error(result.message || '操作失败');
        }
      } catch (error) {
        console.error('审核失败:', error);
        this.$message.error('操作失败，请稍后重试');
      } finally {
        this.reviewDialog.loading = false;
      }
    },

    // 重置审核对话框
    resetReviewDialog() {
      this.reviewForm.note = '';
    },

    // 查看详情
    viewDetail(registration) {
      this.detailDialog = {
        visible: true,
        registration
      };
    },

    // 导出数据
    async exportData() {
      try {
        await this.$confirm('确定要导出当前筛选条件下的报名数据吗？', '导出确认', {
          type: 'info'
        });

        const params = {
          format: 'excel',
          ...this.filterForm
        };

        const result = await exportRegistrations(params);
        if (result.success) {
          // 创建下载链接
          const blob = new Blob([result.data], { type: result.contentType });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = result.filename;
          link.click();
          window.URL.revokeObjectURL(url);

          this.$message.success('数据导出成功');
        } else {
          this.$message.error(result.message || '导出失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('导出失败:', error);
          this.$message.error('导出失败，请稍后重试');
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

    // 获取状态类型
    getStatusType(status) {
      const statusMap = {
        1: 'warning', // 待审核
        2: 'success', // 已批准
        3: 'info',    // 已取消
        4: 'danger'   // 已拒绝
      };
      return statusMap[status] || 'info';
    }
  }
};
</script>

<style scoped>
.registration-review {
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

.header-actions .el-button {
  margin-left: 10px;
}

/* 统计卡片 */
.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 15px;
}

.stat-card.pending .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.approved .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.rejected .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 5px;
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

/* 批量操作 */
.batch-actions {
  margin-bottom: 20px;
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.player-info .player-name {
  font-weight: 600;
  color: #2c3e50;
}

.player-info .player-class {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

.event-info .event-name {
  font-weight: 600;
  color: #2c3e50;
}

.event-info .event-date {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

.action-buttons .el-button {
  margin-right: 5px;
}

.text-muted {
  color: #999;
  font-style: italic;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

/* 详情内容 */
.detail-content {
  padding: 10px 0;
}

.project-intro {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.project-intro h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.project-intro p {
  margin: 0;
  line-height: 1.6;
  color: #5a6c7d;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .registration-review {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    margin-top: 15px;
  }

  .stats-cards .el-col {
    margin-bottom: 15px;
  }

  .filter-form .el-form {
    flex-direction: column;
  }

  .filter-form .el-form-item {
    margin-bottom: 15px;
  }
}
</style>

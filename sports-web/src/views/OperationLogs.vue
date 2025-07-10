<template>
  <div class="operation-logs">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="el-icon-document"></i>
          操作日志
        </h2>
        <p class="page-description">查看和管理系统操作记录</p>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          icon="el-icon-download" 
          @click="exportLogs"
          :loading="exportLoading"
        >
          导出日志
        </el-button>
        <el-button
          type="danger"
          icon="el-icon-delete"
          @click="showCleanupDialog"
          v-if="isSuperAdmin"
        >
          清理日志
        </el-button>
        <el-button
          type="warning"
          icon="el-icon-warning"
          @click="showSecurityAudit"
          v-if="isSuperAdmin"
        >
          安全审计
        </el-button>
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

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.basic.total_operations }}</div>
              <div class="stat-label">总操作数</div>
            </div>
            <i class="el-icon-document stat-icon"></i>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card success">
            <div class="stat-content">
              <div class="stat-number">{{ stats.basic.success_count }}</div>
              <div class="stat-label">成功操作</div>
            </div>
            <i class="el-icon-circle-check stat-icon"></i>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card danger">
            <div class="stat-content">
              <div class="stat-number">{{ stats.basic.failed_count }}</div>
              <div class="stat-label">失败操作</div>
            </div>
            <i class="el-icon-circle-close stat-icon"></i>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card info">
            <div class="stat-content">
              <div class="stat-number">{{ stats.basic.active_users }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
            <i class="el-icon-user stat-icon"></i>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表展示 -->
    <el-row :gutter="20" class="charts-row" v-if="stats">
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>操作趋势</span>
            <el-button type="text" @click="refreshCharts">刷新</el-button>
          </div>
          <div id="operationTrendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>操作类型分布</span>
          </div>
          <div id="operationTypeChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row" v-if="stats">
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>用户活跃度</span>
          </div>
          <div id="userActivityChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>操作结果统计</span>
          </div>
          <div id="operationResultChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div class="filter-form">
        <el-form :model="filterForm" inline>
          <el-form-item label="用户类型">
            <el-select v-model="filterForm.userType" placeholder="全部类型" clearable>
              <el-option label="管理员" value="admin"></el-option>
              <el-option label="操作员" value="operator"></el-option>
              <el-option label="运动员" value="player"></el-option>
              <el-option label="裁判员" value="judge"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="filterForm.operation" placeholder="全部操作" clearable>
              <el-option 
                v-for="op in operationTypes" 
                :key="op.operation" 
                :label="getOperationText(op.operation)" 
                :value="op.operation"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="目标类型">
            <el-select v-model="filterForm.targetType" placeholder="全部目标" clearable>
              <el-option 
                v-for="target in targetTypes" 
                :key="target.target_type" 
                :label="getTargetText(target.target_type)" 
                :value="target.target_type"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="操作结果">
            <el-select v-model="filterForm.result" placeholder="全部结果" clearable>
              <el-option label="成功" value="success"></el-option>
              <el-option label="失败" value="failed"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              @change="handleDateRangeChange"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        row-key="log_id"
      >
        <el-table-column prop="user_id" label="用户ID" width="80"></el-table-column>
        
        <el-table-column prop="user_type" label="用户类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="getUserTypeColor(scope.row.user_type)" size="small">
              {{ getUserTypeText(scope.row.user_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="operation" label="操作类型" width="150">
          <template slot-scope="scope">
            <span class="operation-text">{{ getOperationText(scope.row.operation) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="target_type" label="目标类型" width="120">
          <template slot-scope="scope">
            <span v-if="scope.row.target_type">{{ getTargetText(scope.row.target_type) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="target_id" label="目标ID" width="80">
          <template slot-scope="scope">
            <span v-if="scope.row.target_id">{{ scope.row.target_id }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="result" label="操作结果" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.result === 'success' ? 'success' : 'danger'" size="small">
              {{ scope.row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="ip_address" label="IP地址" width="120">
          <template slot-scope="scope">
            <span v-if="scope.row.ip_address">{{ scope.row.ip_address }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="操作时间" width="150">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="scope">
            <el-button 
              type="text" 
              size="mini" 
              @click="viewDetails(scope.row)"
            >
              详情
            </el-button>
            <el-button 
              type="text" 
              size="mini" 
              @click="viewUserHistory(scope.row)"
            >
              用户历史
            </el-button>
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

    <!-- 详情对话框 -->
    <el-dialog
      title="操作详情"
      :visible.sync="detailDialog.visible"
      width="600px"
    >
      <div v-if="detailDialog.log" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">
            {{ detailDialog.log.log_id }}
          </el-descriptions-item>
          <el-descriptions-item label="用户ID">
            {{ detailDialog.log.user_id }}
          </el-descriptions-item>
          <el-descriptions-item label="用户类型">
            <el-tag :type="getUserTypeColor(detailDialog.log.user_type)">
              {{ getUserTypeText(detailDialog.log.user_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            {{ getOperationText(detailDialog.log.operation) }}
          </el-descriptions-item>
          <el-descriptions-item label="目标类型">
            {{ detailDialog.log.target_type || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="目标ID">
            {{ detailDialog.log.target_id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作结果">
            <el-tag :type="detailDialog.log.result === 'success' ? 'success' : 'danger'">
              {{ detailDialog.log.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ detailDialog.log.ip_address || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">
            {{ formatDateTime(detailDialog.log.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="detailDialog.log.parsed_details" class="details-section">
          <h4>操作详情</h4>
          <pre class="details-json">{{ JSON.stringify(detailDialog.log.parsed_details, null, 2) }}</pre>
        </div>
        
        <div v-if="detailDialog.log.error_message" class="error-section">
          <h4>错误信息</h4>
          <div class="error-message">{{ detailDialog.log.error_message }}</div>
        </div>
        
        <div v-if="detailDialog.log.user_agent" class="user-agent-section">
          <h4>用户代理</h4>
          <div class="user-agent">{{ detailDialog.log.user_agent }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 用户历史对话框 -->
    <el-dialog
      title="用户操作历史"
      :visible.sync="historyDialog.visible"
      width="800px"
    >
      <div v-loading="historyDialog.loading">
        <el-table :data="historyDialog.data" size="small">
          <el-table-column prop="operation" label="操作类型" width="150">
            <template slot-scope="scope">
              {{ getOperationText(scope.row.operation) }}
            </template>
          </el-table-column>
          <el-table-column prop="target_type" label="目标类型" width="120">
            <template slot-scope="scope">
              {{ scope.row.target_type || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="target_id" label="目标ID" width="80">
            <template slot-scope="scope">
              {{ scope.row.target_id || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="result" label="结果" width="80">
            <template slot-scope="scope">
              <el-tag :type="scope.row.result === 'success' ? 'success' : 'danger'" size="mini">
                {{ scope.row.result === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="操作时间" width="150">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 清理日志对话框 -->
    <el-dialog
      title="清理过期日志"
      :visible.sync="cleanupDialog.visible"
      width="400px"
    >
      <el-form :model="cleanupForm" label-width="100px">
        <el-form-item label="保留天数">
          <el-input-number 
            v-model="cleanupForm.retentionDays" 
            :min="7" 
            :max="365"
            placeholder="请输入保留天数"
          ></el-input-number>
          <div class="form-tip">最少保留7天，建议保留90天</div>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="cleanupDialog.visible = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="confirmCleanup"
          :loading="cleanupDialog.loading"
        >
          确认清理
        </el-button>
      </span>
    </el-dialog>

    <!-- 安全审计对话框 -->
    <el-dialog
      title="安全审计报告"
      :visible.sync="securityAuditDialog.visible"
      width="80%"
      top="5vh"
    >
      <div v-loading="securityAuditDialog.loading">
        <!-- 安全统计 -->
        <el-row :gutter="20" class="security-stats">
          <el-col :span="6">
            <el-card class="stat-card danger">
              <div class="stat-content">
                <div class="stat-number">{{ securityStats.failedLogins || 0 }}</div>
                <div class="stat-label">登录失败</div>
              </div>
              <i class="el-icon-warning stat-icon"></i>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card warning">
              <div class="stat-content">
                <div class="stat-number">{{ securityStats.suspiciousIPs || 0 }}</div>
                <div class="stat-label">可疑IP</div>
              </div>
              <i class="el-icon-location stat-icon"></i>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card info">
              <div class="stat-content">
                <div class="stat-number">{{ securityStats.privilegeOperations || 0 }}</div>
                <div class="stat-label">权限操作</div>
              </div>
              <i class="el-icon-key stat-icon"></i>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card success">
              <div class="stat-content">
                <div class="stat-number">{{ securityStats.dataExports || 0 }}</div>
                <div class="stat-label">数据导出</div>
              </div>
              <i class="el-icon-download stat-icon"></i>
            </el-card>
          </el-col>
        </el-row>

        <!-- 安全事件列表 -->
        <el-card class="security-events-card">
          <div slot="header" class="card-header">
            <span>安全事件</span>
            <el-button type="text" @click="refreshSecurityAudit">刷新</el-button>
          </div>

          <el-table :data="securityEvents" style="width: 100%">
            <el-table-column prop="event_type" label="事件类型" width="120">
              <template slot-scope="scope">
                <el-tag :type="getSecurityEventType(scope.row.event_type)">
                  {{ getSecurityEventText(scope.row.event_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
            <el-table-column prop="ip_address" label="IP地址" width="140"></el-table-column>
            <el-table-column prop="user_agent" label="用户代理" min-width="200" show-overflow-tooltip></el-table-column>
            <el-table-column prop="risk_level" label="风险等级" width="100">
              <template slot-scope="scope">
                <el-tag :type="getRiskLevelType(scope.row.risk_level)">
                  {{ getRiskLevelText(scope.row.risk_level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="160">
              <template slot-scope="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="securityAuditDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="exportSecurityReport">导出报告</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as echarts from 'echarts';

export default {
  name: 'OperationLogs',
  computed: {
    ...mapGetters(['userInfo']),

    // 是否为超级管理员
    isSuperAdmin() {
      const user = this.$store.getters['auth/user'];
      return user && user.userType === 'admin' && user.roleSubType === '2';
    },

    // 是否为普通管理员
    isRegularAdmin() {
      const user = this.$store.getters['auth/user'];
      return user && (user.userType === 'operator' ||
        (user.userType === 'admin' && user.roleSubType !== '2'));
    }
  },
  data() {
    return {
      loading: false,
      exportLoading: false,

      // 统计数据
      stats: null,

      // 筛选表单
      filterForm: {
        userType: '',
        operation: '',
        targetType: '',
        result: '',
        dateRange: ''
      },

      // 日期范围
      dateRange: null,

      // 表格数据
      tableData: [],

      // 分页
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },

      // 操作类型列表
      operationTypes: [],

      // 目标类型列表
      targetTypes: [],

      // 详情对话框
      detailDialog: {
        visible: false,
        log: null
      },

      // 用户历史对话框
      historyDialog: {
        visible: false,
        loading: false,
        data: []
      },

      // 清理对话框
      cleanupDialog: {
        visible: false,
        loading: false
      },

      // 清理表单
      cleanupForm: {
        retentionDays: 90
      },

      // 图表实例
      charts: {
        operationTrend: null,
        operationType: null,
        userActivity: null,
        operationResult: null
      },

      // 安全审计对话框
      securityAuditDialog: {
        visible: false,
        loading: false
      },

      // 安全统计数据
      securityStats: {},

      // 安全事件列表
      securityEvents: []
    };
  },

  async created() {
    await this.loadMetadata();
    await this.loadStats();
    await this.loadData();
  },

  mounted() {
    // 图表将在数据加载完成后初始化
    console.log('OperationLogs component mounted');
    // 延迟初始化图表，确保DOM已渲染
    setTimeout(() => {
      this.initCharts();
    }, 1000);
  },

  beforeDestroy() {
    // 销毁图表实例
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.dispose();
      }
    });
  },

  methods: {
    // 加载元数据
    async loadMetadata() {
      try {
        // 加载操作类型
        const operationResponse = await this.$http.get('/api/admin/operation-logs/operations');
        if (operationResponse.success) {
          this.operationTypes = operationResponse.data || [];
        }

        // 加载目标类型
        const targetResponse = await this.$http.get('/api/admin/operation-logs/targets');
        if (targetResponse.success) {
          this.targetTypes = targetResponse.data || [];
        }
      } catch (error) {
        console.error('加载元数据失败:', error);
      }
    },

    // 加载统计数据
    async loadStats() {
      try {
        const params = {};
        if (this.filterForm.dateRange) {
          params.dateRange = this.filterForm.dateRange;
        }

        const response = await this.$http.get('/api/admin/operation-logs/stats', { params });
        if (response.success) {
          this.stats = response.data || {};
          console.log('Stats data loaded:', this.stats); // 调试信息
          // 更新图表
          this.$nextTick(() => {
            this.initChartsIfNeeded();
            this.refreshCharts();
          });
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },

    // 加载日志数据
    async loadData() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          ...this.filterForm
        };

        const response = await this.$http.get('/api/admin/operation-logs', { params });
        if (response.success) {
          this.tableData = response.data.list || [];
          this.pagination.total = response.data.total || 0;
        } else {
          this.$message.error(response.message || '获取数据失败');
        }
      } catch (error) {
        console.error('加载日志数据失败:', error);
        this.$message.error('加载数据失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },

    // 刷新数据
    async refreshData() {
      await this.loadStats();
      await this.loadData();
      this.$message.success('数据已刷新');
    },

    // 处理日期范围变化
    handleDateRangeChange(value) {
      if (value && value.length === 2) {
        this.filterForm.dateRange = `${value[0]},${value[1]}`;
      } else {
        this.filterForm.dateRange = '';
      }
    },

    // 应用筛选
    async applyFilter() {
      this.pagination.page = 1;
      await this.loadStats();
      await this.loadData();
    },

    // 重置筛选
    async resetFilter() {
      this.filterForm = {
        userType: '',
        operation: '',
        targetType: '',
        result: '',
        dateRange: ''
      };
      this.dateRange = null;
      this.pagination.page = 1;
      await this.loadStats();
      await this.loadData();
    },

    // 查看详情
    viewDetails(log) {
      this.detailDialog = {
        visible: true,
        log
      };
    },

    // 查看用户历史
    async viewUserHistory(log) {
      this.historyDialog = {
        visible: true,
        loading: true,
        data: []
      };

      try {
        const response = await this.$http.get(`/api/admin/operation-logs/user/${log.user_id}`, {
          params: { userType: log.user_type, limit: 50 }
        });

        if (response.success) {
          this.historyDialog.data = response.data || [];
        } else {
          this.$message.error(response.message || '获取用户历史失败');
        }
      } catch (error) {
        console.error('获取用户历史失败:', error);
        this.$message.error('获取用户历史失败，请稍后重试');
      } finally {
        this.historyDialog.loading = false;
      }
    },

    // 导出日志
    async exportLogs() {
      this.exportLoading = true;
      try {
        const params = {
          format: 'excel',
          ...this.filterForm
        };

        const response = await this.$http.get('/api/admin/operation-logs/export', {
          params,
          responseType: 'blob'
        });

        // 创建下载链接
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `operation_logs_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.$message.success('日志导出成功');
      } catch (error) {
        console.error('导出日志失败:', error);
        this.$message.error('导出失败，请稍后重试');
      } finally {
        this.exportLoading = false;
      }
    },

    // 显示清理对话框
    showCleanupDialog() {
      this.cleanupDialog.visible = true;
    },

    // 确认清理
    async confirmCleanup() {
      try {
        await this.$confirm(
          `确定要清理 ${this.cleanupForm.retentionDays} 天前的日志吗？此操作不可恢复！`,
          '清理确认',
          { type: 'warning' }
        );

        this.cleanupDialog.loading = true;

        const response = await this.$http.delete('/api/admin/operation-logs/cleanup', {
          data: { retentionDays: this.cleanupForm.retentionDays }
        });

        if (response.success) {
          this.$message.success(response.message || '清理完成');
          this.cleanupDialog.visible = false;
          await this.loadStats();
          await this.loadData();
        } else {
          this.$message.error(response.message || '清理失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('清理日志失败:', error);
          this.$message.error('清理失败，请稍后重试');
        }
      } finally {
        this.cleanupDialog.loading = false;
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

    // 获取用户类型颜色
    getUserTypeColor(userType) {
      const colorMap = {
        admin: 'danger',
        operator: 'warning',
        player: 'primary',
        judge: 'success'
      };
      return colorMap[userType] || '';
    },

    // 获取用户类型文本
    getUserTypeText(userType) {
      const textMap = {
        admin: '管理员',
        operator: '操作员',
        player: '运动员',
        judge: '裁判员'
      };
      return textMap[userType] || userType;
    },

    // 获取操作类型文本
    getOperationText(operation) {
      const textMap = {
        login: '登录',
        logout: '登出',
        create_registration: '创建报名',
        update_registration: '更新报名',
        delete_registration: '删除报名',
        review_registration: '审核报名',
        create_score: '录入成绩',
        update_score: '更新成绩',
        delete_score: '删除成绩',
        create_config: '创建配置',
        update_config: '更新配置',
        delete_config: '删除配置',
        send_notification: '发送通知',
        export_data: '导出数据',
        cleanup_logs: '清理日志'
      };
      return textMap[operation] || operation;
    },

    // 获取目标类型文本
    getTargetText(targetType) {
      const textMap = {
        registration: '报名记录',
        player: '运动员',
        judge: '裁判员',
        admin: '管理员',
        competition: '比赛项目',
        plog: '成绩记录',
        system_config: '系统配置',
        system_notification: '系统通知'
      };
      return textMap[targetType] || targetType;
    },

    // 初始化图表
    initCharts() {
      this.initOperationTrendChart();
      this.initOperationTypeChart();
      this.initUserActivityChart();
      this.initOperationResultChart();
    },

    // 如果需要则初始化图表
    initChartsIfNeeded() {
      if (!this.charts.operationTrend) {
        this.initOperationTrendChart();
      }
      if (!this.charts.operationType) {
        this.initOperationTypeChart();
      }
      if (!this.charts.userActivity) {
        this.initUserActivityChart();
      }
      if (!this.charts.operationResult) {
        this.initOperationResultChart();
      }
    },

    // 初始化操作趋势图表
    initOperationTrendChart() {
      const chartDom = document.getElementById('operationTrendChart');
      if (!chartDom) {
        console.warn('operationTrendChart DOM element not found');
        return;
      }

      if (!this.charts.operationTrend) {
        this.charts.operationTrend = echarts.init(chartDom);
        console.log('operationTrend chart initialized');
      }
      this.updateOperationTrendChart();
    },

    // 初始化操作类型分布图表
    initOperationTypeChart() {
      const chartDom = document.getElementById('operationTypeChart');
      if (!chartDom) {
        console.warn('operationTypeChart DOM element not found');
        return;
      }

      if (!this.charts.operationType) {
        this.charts.operationType = echarts.init(chartDom);
        console.log('operationType chart initialized');
      }
      this.updateOperationTypeChart();
    },

    // 初始化用户活跃度图表
    initUserActivityChart() {
      const chartDom = document.getElementById('userActivityChart');
      if (!chartDom) return;

      this.charts.userActivity = echarts.init(chartDom);
      this.updateUserActivityChart();
    },

    // 初始化操作结果统计图表
    initOperationResultChart() {
      const chartDom = document.getElementById('operationResultChart');
      if (!chartDom) return;

      this.charts.operationResult = echarts.init(chartDom);
      this.updateOperationResultChart();
    },

    // 更新操作趋势图表
    updateOperationTrendChart() {
      console.log('updateOperationTrendChart called');
      console.log('Chart instance:', this.charts.operationTrend);
      console.log('Stats data:', this.stats);

      if (!this.charts.operationTrend) {
        console.log('operationTrend chart instance not found');
        return;
      }

      if (!this.stats || !this.stats.trend || this.stats.trend.length === 0) {
        console.log('No trend data available, showing empty chart');
        // 显示空数据的图表
        const emptyOption = {
          title: { text: '操作趋势 (暂无数据)', textStyle: { fontSize: 14 } },
          xAxis: { type: 'category', data: [] },
          yAxis: { type: 'value' },
          series: [
            { name: '成功操作', type: 'line', data: [] },
            { name: '失败操作', type: 'line', data: [] }
          ]
        };
        this.charts.operationTrend.setOption(emptyOption);
        return;
      }

      console.log('Updating operationTrend chart with data:', this.stats.trend);

      const option = {
        title: {
          text: '最近7天操作趋势',
          textStyle: { fontSize: 14 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        legend: {
          data: ['成功操作', '失败操作']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.stats.trend.map(item => item.date)
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '成功操作',
            type: 'line',
            smooth: true,
            data: this.stats.trend.map(item => item.success_count),
            itemStyle: { color: '#67C23A' }
          },
          {
            name: '失败操作',
            type: 'line',
            smooth: true,
            data: this.stats.trend.map(item => item.failed_count),
            itemStyle: { color: '#F56C6C' }
          }
        ]
      };

      this.charts.operationTrend.setOption(option);
    },

    // 更新操作类型分布图表
    updateOperationTypeChart() {
      console.log('updateOperationTypeChart called');

      if (!this.charts.operationType) {
        console.log('operationType chart instance not found');
        return;
      }

      if (!this.stats || !this.stats.operation_types || this.stats.operation_types.length === 0) {
        console.log('No operation_types data available');
        const emptyOption = {
          title: { text: '操作类型分布 (暂无数据)', textStyle: { fontSize: 14 } },
          series: [{ name: '操作类型', type: 'pie', data: [] }]
        };
        this.charts.operationType.setOption(emptyOption);
        return;
      }

      const data = this.stats.operation_types.map(item => ({
        name: this.getOperationText(item.operation),
        value: item.count
      }));

      console.log('Operation type chart data:', data);

      const option = {
        title: {
          text: '操作类型分布',
          textStyle: { fontSize: 14 }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '操作类型',
            type: 'pie',
            radius: '50%',
            data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };

      this.charts.operationType.setOption(option);
    },

    // 更新用户活跃度图表
    updateUserActivityChart() {
      if (!this.charts.userActivity || !this.stats || !this.stats.user_activity) return;

      const option = {
        title: {
          text: '用户活跃度',
          textStyle: { fontSize: 14 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['管理员', '操作员', '运动员', '裁判员']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '操作次数',
            type: 'bar',
            data: [
              (this.stats.user_activity && this.stats.user_activity.admin) || 0,
              (this.stats.user_activity && this.stats.user_activity.operator) || 0,
              (this.stats.user_activity && this.stats.user_activity.player) || 0,
              (this.stats.user_activity && this.stats.user_activity.judge) || 0
            ],
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            }
          }
        ]
      };

      this.charts.userActivity.setOption(option);
    },

    // 更新操作结果统计图表
    updateOperationResultChart() {
      if (!this.charts.operationResult || !this.stats || !this.stats.basic) return;

      const data = [
        { name: '成功', value: this.stats.basic.success_count, itemStyle: { color: '#67C23A' } },
        { name: '失败', value: this.stats.basic.failed_count, itemStyle: { color: '#F56C6C' } }
      ];

      const option = {
        title: {
          text: '操作结果统计',
          textStyle: { fontSize: 14 }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [
          {
            name: '操作结果',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '30',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data
          }
        ]
      };

      this.charts.operationResult.setOption(option);
    },

    // 刷新图表
    refreshCharts() {
      this.$nextTick(() => {
        this.updateOperationTrendChart();
        this.updateOperationTypeChart();
        this.updateUserActivityChart();
        this.updateOperationResultChart();
      });
    },

    // 显示安全审计对话框
    async showSecurityAudit() {
      this.securityAuditDialog.visible = true;
      await this.loadSecurityAudit();
    },

    // 加载安全审计数据
    async loadSecurityAudit() {
      this.securityAuditDialog.loading = true;
      try {
        const response = await this.$http.get('/api/admin/operation-logs/security-audit');
        if (response.success) {
          this.securityStats = response.data.stats || {};
          this.securityEvents = response.data.events || [];
        } else {
          this.$message.error(response.message || '获取安全审计数据失败');
        }
      } catch (error) {
        console.error('加载安全审计数据失败:', error);
        this.handleApiError(error);
      } finally {
        this.securityAuditDialog.loading = false;
      }
    },

    // 刷新安全审计
    async refreshSecurityAudit() {
      await this.loadSecurityAudit();
    },

    // 导出安全报告
    async exportSecurityReport() {
      try {
        const response = await this.$http.get('/api/admin/operation-logs/export-security-report', {
          responseType: 'blob'
        });

        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `安全审计报告_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.$message.success('安全报告导出成功');
      } catch (error) {
        console.error('导出安全报告失败:', error);
        this.$message.error('导出失败，请稍后重试');
      }
    },

    // 获取安全事件类型
    getSecurityEventType(eventType) {
      const typeMap = {
        failed_login: 'danger',
        suspicious_ip: 'warning',
        privilege_operation: 'info',
        data_export: 'success',
        unauthorized_access: 'danger'
      };
      return typeMap[eventType] || 'info';
    },

    // 获取安全事件文本
    getSecurityEventText(eventType) {
      const textMap = {
        failed_login: '登录失败',
        suspicious_ip: '可疑IP',
        privilege_operation: '权限操作',
        data_export: '数据导出',
        unauthorized_access: '未授权访问'
      };
      return textMap[eventType] || eventType;
    },

    // 获取风险等级类型
    getRiskLevelType(riskLevel) {
      const typeMap = {
        low: 'success',
        medium: 'warning',
        high: 'danger',
        critical: 'danger'
      };
      return typeMap[riskLevel] || 'info';
    },

    // 获取风险等级文本
    getRiskLevelText(riskLevel) {
      const textMap = {
        low: '低',
        medium: '中',
        high: '高',
        critical: '严重'
      };
      return textMap[riskLevel] || riskLevel;
    },

    // 统一的API错误处理
    handleApiError(error) {
      if (error.response) {
        const { status } = error.response;
        if (status === 401) {
          this.$message.error('登录已过期，请重新登录');
          this.$store.dispatch('auth/logout');
          this.$router.push('/');
        } else if (status === 403) {
          this.$message.error('权限不足');
        } else if (status === 500) {
          this.$message.error('服务器错误，请稍后重试');
        } else {
          this.$message.error('操作失败，请稍后重试');
        }
      } else {
        this.$message.error('网络错误，请检查网络连接');
      }
    }
  }
};
</script>

<style scoped>
.operation-logs {
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
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.success {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.stat-card.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: white;
}

.stat-card.info {
  background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
  color: white;
}

.stat-content {
  padding: 20px;
  position: relative;
  z-index: 2;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  opacity: 0.3;
}

/* 图表行 */
.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
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

/* 表格卡片 */
.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.operation-text {
  font-weight: 600;
}

.text-muted {
  color: #999;
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

.details-section,
.error-section,
.user-agent-section {
  margin-top: 20px;
}

.details-section h4,
.error-section h4,
.user-agent-section h4 {
  margin-bottom: 10px;
  color: #303133;
  font-size: 14px;
}

.details-json {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
}

.error-message {
  background: #fef0f0;
  color: #f56c6c;
  padding: 10px;
  border-radius: 4px;
  border-left: 4px solid #f56c6c;
}

.user-agent {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
}

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 安全审计样式 */
.security-stats {
  margin-bottom: 20px;
}

.security-events-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .operation-logs {
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

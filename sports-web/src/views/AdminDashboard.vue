<template>
  <div class="admin-dashboard">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h2 class="page-title">
        <i class="el-icon-data-analysis"></i>
        数据统计中心
      </h2>
      <p class="page-subtitle">实时监控系统运行状态和数据统计</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="unified-stat-card">
            <div class="stats-content">
              <div class="unified-stat-icon primary">
                <i class="el-icon-user"></i>
              </div>
              <div class="stats-info">
                <h3>{{ stats.totalUsers || 0 }}</h3>
                <p>总用户数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="unified-stat-card">
            <div class="stats-content">
              <div class="unified-stat-icon secondary">
                <i class="el-icon-trophy"></i>
              </div>
              <div class="stats-info">
                <h3>{{ stats.totalEvents || 0 }}</h3>
                <p>比赛项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="unified-stat-card">
            <div class="stats-content">
              <div class="unified-stat-icon success">
                <i class="el-icon-tickets"></i>
              </div>
              <div class="stats-info">
                <h3>{{ stats.totalRegistrations || 0 }}</h3>
                <p>总报名数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="unified-stat-card">
            <div class="stats-content">
              <div class="unified-stat-icon warning">
                <i class="el-icon-warning"></i>
              </div>
              <div class="stats-info">
                <h3>{{ stats.pendingReviews || 0 }}</h3>
                <p>待审核</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 报名趋势图 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <div slot="header" class="card-header">
              <span>报名趋势分析</span>
              <el-button type="text" @click="refreshCharts">刷新</el-button>
            </div>
            <div id="registrationTrendChart" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 项目分布图 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <div slot="header" class="card-header">
              <span>项目报名分布</span>
              <el-button type="text" @click="exportData">导出数据</el-button>
            </div>
            <div id="eventDistributionChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-card>
        <div slot="header" class="card-header">
          <span>快捷操作</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-button 
              type="primary" 
              icon="el-icon-plus" 
              @click="$router.push('/competition')"
              class="action-btn"
            >
              新增比赛项目
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button 
              type="success" 
              icon="el-icon-check" 
              @click="$router.push('/registration-review')"
              class="action-btn"
            >
              报名审核
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button 
              type="warning" 
              icon="el-icon-user" 
              @click="$router.push('/player')"
              class="action-btn"
            >
              运动员管理
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button 
              type="info" 
              icon="el-icon-setting" 
              @click="$router.push('/system-config')"
              class="action-btn"
            >
              系统配置
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities">
      <el-card>
        <div slot="header" class="card-header">
          <span>最近活动</span>
          <el-button type="text" @click="$router.push('/operation-logs')">查看全部</el-button>
        </div>
        <el-table :data="recentActivities" style="width: 100%">
          <el-table-column prop="time" label="时间" width="180"></el-table-column>
          <el-table-column prop="user" label="操作人" width="120"></el-table-column>
          <el-table-column prop="action" label="操作" width="150"></el-table-column>
          <el-table-column prop="target" label="对象"></el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  data() {
    return {
      loading: false,
      chartLoading: false,
      stats: {
        totalUsers: 0,
        totalEvents: 0,
        totalRegistrations: 0,
        pendingReviews: 0
      },
      recentActivities: [],
      registrationTrendChart: null,
      eventDistributionChart: null
    };
  },
  
  async mounted() {
    await this.loadDashboardData();
    this.initCharts();

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
  },

  beforeDestroy() {
    // 清理事件监听和图表实例
    window.removeEventListener('resize', this.handleResize);
    if (this.registrationTrendChart) {
      this.registrationTrendChart.dispose();
    }
    if (this.eventDistributionChart) {
      this.eventDistributionChart.dispose();
    }
  },
  
  methods: {
    // 加载Dashboard数据
    async loadDashboardData() {
      this.loading = true;
      try {
        // 加载统计数据
        await this.loadStats();
        // 加载最近活动
        await this.loadRecentActivities();
      } catch (error) {
        console.error('加载Dashboard数据失败:', error);
        this.$message.error('加载数据失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载统计数据
    async loadStats() {
      try {
        // 这里先使用模拟数据，后续集成真实API
        this.stats = {
          totalUsers: 156,
          totalEvents: 24,
          totalRegistrations: 342,
          pendingReviews: 12
        };
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },
    
    // 加载最近活动
    async loadRecentActivities() {
      try {
        // 模拟数据
        this.recentActivities = [
          {
            time: '2025-01-09 14:30:25',
            user: '管理员1',
            action: '审核报名',
            target: '张三 - 100米短跑'
          },
          {
            time: '2025-01-09 14:25:10',
            user: '操作员1',
            action: '新增项目',
            target: '200米短跑'
          },
          {
            time: '2025-01-09 14:20:05',
            user: '管理员1',
            action: '修改配置',
            target: '系统配置'
          }
        ];
      } catch (error) {
        console.error('加载最近活动失败:', error);
      }
    },
    
    // 初始化图表
    initCharts() {
      this.chartLoading = true;

      this.$nextTick(() => {
        // 初始化报名趋势图
        this.registrationTrendChart = this.$echarts.init(document.getElementById('registrationTrendChart'));
        const trendOption = {
          title: {
            text: '最近7天报名趋势',
            left: 'center',
            textStyle: {
              fontSize: 16,
              color: '#303133'
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross'
            }
          },
          legend: {
            data: ['报名数量', '审核通过'],
            bottom: 10
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['01-03', '01-04', '01-05', '01-06', '01-07', '01-08', '01-09']
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '报名数量',
              type: 'line',
              smooth: true,
              lineStyle: {
                color: '#409EFF'
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [{
                    offset: 0, color: 'rgba(64, 158, 255, 0.3)'
                  }, {
                    offset: 1, color: 'rgba(64, 158, 255, 0.1)'
                  }]
                }
              },
              data: [12, 18, 25, 32, 28, 35, 42]
            },
            {
              name: '审核通过',
              type: 'line',
              smooth: true,
              lineStyle: {
                color: '#67C23A'
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [{
                    offset: 0, color: 'rgba(103, 194, 58, 0.3)'
                  }, {
                    offset: 1, color: 'rgba(103, 194, 58, 0.1)'
                  }]
                }
              },
              data: [10, 15, 22, 28, 25, 30, 38]
            }
          ]
        };
        this.registrationTrendChart.setOption(trendOption);

        // 初始化项目分布饼图
        this.eventDistributionChart = this.$echarts.init(document.getElementById('eventDistributionChart'));
        const distributionOption = {
          title: {
            text: '项目报名分布',
            left: 'center',
            textStyle: {
              fontSize: 16,
              color: '#303133'
            }
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            data: ['100米短跑', '200米短跑', '跳远', '跳高', '铅球']
          },
          series: [
            {
              name: '报名分布',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['60%', '50%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: [
                {
                  value: 85,
                  name: '100米短跑',
                  itemStyle: { color: '#409EFF' }
                },
                {
                  value: 72,
                  name: '200米短跑',
                  itemStyle: { color: '#67C23A' }
                },
                {
                  value: 58,
                  name: '跳远',
                  itemStyle: { color: '#E6A23C' }
                },
                {
                  value: 45,
                  name: '跳高',
                  itemStyle: { color: '#F56C6C' }
                },
                {
                  value: 32,
                  name: '铅球',
                  itemStyle: { color: '#909399' }
                }
              ]
            }
          ]
        };
        this.eventDistributionChart.setOption(distributionOption);

        this.chartLoading = false;
      });
    },
    
    // 处理窗口大小变化
    handleResize() {
      if (this.registrationTrendChart) {
        this.registrationTrendChart.resize();
      }
      if (this.eventDistributionChart) {
        this.eventDistributionChart.resize();
      }
    },

    // 刷新图表
    refreshCharts() {
      this.$message.success('图表数据已刷新');
      this.initCharts();
    },

    // 导出数据
    async exportData() {
      try {
        this.$message.info('正在导出数据...');

        // 模拟数据导出
        const exportData = {
          stats: this.stats,
          registrationTrend: [
            { date: '01-03', registrations: 12, approved: 10 },
            { date: '01-04', registrations: 18, approved: 15 },
            { date: '01-05', registrations: 25, approved: 22 },
            { date: '01-06', registrations: 32, approved: 28 },
            { date: '01-07', registrations: 28, approved: 25 },
            { date: '01-08', registrations: 35, approved: 30 },
            { date: '01-09', registrations: 42, approved: 38 }
          ],
          eventDistribution: [
            { event: '100米短跑', count: 85 },
            { event: '200米短跑', count: 72 },
            { event: '跳远', count: 58 },
            { event: '跳高', count: 45 },
            { event: '铅球', count: 32 }
          ]
        };

        // 使用file-saver导出JSON文件
        const { saveAs } = await import('file-saver');
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json;charset=utf-8'
        });
        saveAs(blob, `dashboard-data-${new Date().toISOString().split('T')[0]}.json`);

        this.$message.success('数据导出成功');
      } catch (error) {
        console.error('导出数据失败:', error);
        this.$message.error('导出失败，请稍后重试');
      }
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.dashboard-header {
  margin-bottom: 30px;
}

.page-title {
  color: #303133;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.page-title i {
  margin-right: 12px;
  color: #409EFF;
}

.page-subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.stats-cards {
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.total-users { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.total-events { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.total-registrations { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.pending-reviews { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stat-content h3 {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
}

.stat-content p {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  margin-bottom: 30px;
}

.action-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

.recent-activities {
  margin-bottom: 20px;
}
</style>

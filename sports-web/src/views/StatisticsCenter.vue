<template>
  <div class="statistics-center">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <i class="el-icon-data-analysis"></i>
        数据统计中心
      </h1>
      <p class="page-subtitle">实时监控系统运行状态和数据统计分析</p>
    </div>

    <!-- 系统概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(card, index) in overviewCards" :key="index">
          <div class="overview-card" :class="card.type">
            <div class="card-icon">
              <i :class="card.icon"></i>
            </div>
            <div class="card-content">
              <div class="card-value">{{ card.value }}</div>
              <div class="card-label">{{ card.label }}</div>
              <div class="card-change" :class="card.changeType">
                <i :class="card.changeIcon"></i>
                {{ card.change }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 班级参与度图表 -->
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>班级参与度统计</h3>
              <el-button size="mini" @click="refreshClassChart">
                <i class="el-icon-refresh"></i>
              </el-button>
            </div>
            <div id="classChart" class="chart-container"></div>
          </div>
        </el-col>

        <!-- 项目热度图表 -->
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>项目热度排行</h3>
              <el-button size="mini" @click="refreshEventChart">
                <i class="el-icon-refresh"></i>
              </el-button>
            </div>
            <div id="eventChart" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 性别分布图表 -->
        <el-col :span="8">
          <div class="chart-card">
            <div class="chart-header">
              <h3>性别分布</h3>
              <el-button size="mini" @click="refreshGenderChart">
                <i class="el-icon-refresh"></i>
              </el-button>
            </div>
            <div id="genderChart" class="chart-container"></div>
          </div>
        </el-col>

        <!-- 报名趋势图表 -->
        <el-col :span="16">
          <div class="chart-card">
            <div class="chart-header">
              <h3>报名趋势分析</h3>
              <el-select v-model="trendDays" size="mini" @change="refreshTrendChart" style="margin-left: 10px;">
                <el-option label="最近7天" :value="7"></el-option>
                <el-option label="最近15天" :value="15"></el-option>
                <el-option label="最近30天" :value="30"></el-option>
              </el-select>
              <el-button size="mini" @click="refreshTrendChart" style="margin-left: 10px;">
                <i class="el-icon-refresh"></i>
              </el-button>
            </div>
            <div id="trendChart" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 实时状态监控 -->
    <div class="status-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>系统运行状态</h3>
          <el-switch
            v-model="autoRefresh"
            active-text="自动刷新"
            @change="toggleAutoRefresh">
          </el-switch>
        </div>
        <div class="status-grid">
          <div class="status-item">
            <div class="status-label">数据库状态</div>
            <div class="status-value" :class="systemStatus.database && systemStatus.database.status">
              {{ systemStatus.database && systemStatus.database.status === 'connected' ? '正常' : '异常' }}
            </div>
          </div>
          <div class="status-item">
            <div class="status-label">服务器运行时间</div>
            <div class="status-value">{{ formatUptime(systemStatus.server && systemStatus.server.uptime) }}</div>
          </div>
          <div class="status-item">
            <div class="status-label">内存使用</div>
            <div class="status-value">
              {{ systemStatus.server && systemStatus.server.memory ? systemStatus.server.memory.used : 0 }}MB / {{ systemStatus.server && systemStatus.server.memory ? systemStatus.server.memory.total : 0 }}MB
            </div>
          </div>
          <div class="status-item">
            <div class="status-label">最后更新</div>
            <div class="status-value">{{ lastUpdateTime }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { statisticsApi } from '@/api/statistics'

export default {
  name: 'StatisticsCenter',
  data() {
    return {
      loading: false,
      autoRefresh: false,
      refreshTimer: null,
      trendDays: 7,
      lastUpdateTime: '',
      
      // 概览数据
      overviewCards: [
        {
          type: 'primary',
          icon: 'el-icon-user',
          label: '总运动员数',
          value: 0,
          change: '+0',
          changeType: 'positive',
          changeIcon: 'el-icon-arrow-up'
        },
        {
          type: 'success',
          icon: 'el-icon-trophy',
          label: '比赛项目数',
          value: 0,
          change: '+0',
          changeType: 'positive',
          changeIcon: 'el-icon-arrow-up'
        },
        {
          type: 'warning',
          icon: 'el-icon-document',
          label: '报名总数',
          value: 0,
          change: '+0',
          changeType: 'positive',
          changeIcon: 'el-icon-arrow-up'
        },
        {
          type: 'info',
          icon: 'el-icon-medal',
          label: '成绩记录数',
          value: 0,
          change: '+0',
          changeType: 'positive',
          changeIcon: 'el-icon-arrow-up'
        }
      ],
      
      // 系统状态
      systemStatus: {},
      
      // 图表实例
      charts: {
        class: null,
        event: null,
        gender: null,
        trend: null
      }
    }
  },
  
  mounted() {
    this.initPage()
  },
  
  beforeDestroy() {
    this.clearAutoRefresh()
    // 销毁图表实例
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.dispose()
      }
    })
  },
  
  methods: {
    async initPage() {
      this.loading = true
      try {
        await Promise.all([
          this.loadOverviewData(),
          this.loadSystemStatus(),
          this.initCharts()
        ])
        this.updateLastUpdateTime()
      } catch (error) {
        console.error('初始化页面失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },
    
    async loadOverviewData() {
      try {
        const response = await statisticsApi.getOverview()
        if (response.success) {
          const { overview, todayStats } = response.data
          
          // 更新概览卡片数据
          this.overviewCards[0].value = overview.total_players
          this.overviewCards[0].change = `+${todayStats.today_players}`
          
          this.overviewCards[1].value = overview.total_events
          this.overviewCards[1].change = '+0'
          
          this.overviewCards[2].value = overview.approved_registrations
          this.overviewCards[2].change = `+${todayStats.today_registrations}`
          
          this.overviewCards[3].value = overview.total_scores
          this.overviewCards[3].change = `+${todayStats.today_scores}`
        }
      } catch (error) {
        console.error('加载概览数据失败:', error)
      }
    },
    
    async loadSystemStatus() {
      try {
        const response = await statisticsApi.getSystemStatus()
        if (response.success) {
          this.systemStatus = response.data
        }
      } catch (error) {
        console.error('加载系统状态失败:', error)
      }
    },
    
    async initCharts() {
      await Promise.all([
        this.initClassChart(),
        this.initEventChart(),
        this.initGenderChart(),
        this.initTrendChart()
      ])
    },
    
    async initClassChart() {
      try {
        const response = await statisticsApi.getClassParticipation()
        if (response.success) {
          const chartDom = document.getElementById('classChart')
          this.charts.class = echarts.init(chartDom)
          
          const { participationStats } = response.data
          const option = {
            tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'shadow' }
            },
            xAxis: {
              type: 'category',
              data: participationStats.map(item => item.player_class),
              axisLabel: { rotate: 45 }
            },
            yAxis: { type: 'value' },
            series: [{
              name: '参与率',
              type: 'bar',
              data: participationStats.map(item => item.participation_rate),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#83bff6' },
                  { offset: 0.5, color: '#188df0' },
                  { offset: 1, color: '#188df0' }
                ])
              }
            }]
          }
          
          this.charts.class.setOption(option)
        }
      } catch (error) {
        console.error('初始化班级图表失败:', error)
      }
    },
    
    async initEventChart() {
      try {
        const response = await statisticsApi.getEventPopularity()
        if (response.success) {
          const chartDom = document.getElementById('eventChart')
          this.charts.event = echarts.init(chartDom)

          const { eventStats } = response.data
          const option = {
            tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'shadow' }
            },
            xAxis: {
              type: 'category',
              data: eventStats.slice(0, 8).map(item => item.schedule_name),
              axisLabel: { rotate: 45 }
            },
            yAxis: { type: 'value' },
            series: [{
              name: '报名人数',
              type: 'bar',
              data: eventStats.slice(0, 8).map(item => item.registration_count),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#ffd666' },
                  { offset: 0.5, color: '#ffc53d' },
                  { offset: 1, color: '#faad14' }
                ])
              }
            }]
          }

          this.charts.event.setOption(option)
        }
      } catch (error) {
        console.error('初始化项目图表失败:', error)
      }
    },

    async initGenderChart() {
      try {
        const response = await statisticsApi.getGenderDistribution()
        if (response.success) {
          const chartDom = document.getElementById('genderChart')
          this.charts.gender = echarts.init(chartDom)

          const { genderStats } = response.data
          const option = {
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            series: [{
              name: '性别分布',
              type: 'pie',
              radius: ['40%', '70%'],
              data: genderStats.map(item => ({
                value: item.total_count,
                name: item.gender === '男' ? '男生' : '女生'
              })),
              itemStyle: {
                color: function(params) {
                  const colors = ['#5470c6', '#ff6b9d']
                  return colors[params.dataIndex]
                }
              }
            }]
          }

          this.charts.gender.setOption(option)
        }
      } catch (error) {
        console.error('初始化性别图表失败:', error)
      }
    },

    async initTrendChart() {
      try {
        const response = await statisticsApi.getRegistrationTrend(this.trendDays)
        if (response.success) {
          const chartDom = document.getElementById('trendChart')
          this.charts.trend = echarts.init(chartDom)

          const { trendData } = response.data
          const option = {
            tooltip: {
              trigger: 'axis'
            },
            legend: {
              data: ['总报名', '已审核', '待审核']
            },
            xAxis: {
              type: 'category',
              data: trendData.map(item => item.date)
            },
            yAxis: { type: 'value' },
            series: [
              {
                name: '总报名',
                type: 'line',
                data: trendData.map(item => item.total_registrations),
                smooth: true,
                itemStyle: { color: '#1890ff' }
              },
              {
                name: '已审核',
                type: 'line',
                data: trendData.map(item => item.approved_count),
                smooth: true,
                itemStyle: { color: '#52c41a' }
              },
              {
                name: '待审核',
                type: 'line',
                data: trendData.map(item => item.pending_count),
                smooth: true,
                itemStyle: { color: '#faad14' }
              }
            ]
          }

          this.charts.trend.setOption(option)
        }
      } catch (error) {
        console.error('初始化趋势图表失败:', error)
      }
    },

    formatUptime(seconds) {
      if (!seconds) return '0秒'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      return `${hours}小时${minutes}分${secs}秒`
    },
    
    updateLastUpdateTime() {
      this.lastUpdateTime = new Date().toLocaleTimeString()
    },
    
    toggleAutoRefresh(enabled) {
      if (enabled) {
        this.refreshTimer = setInterval(() => {
          this.initPage()
        }, 30000) // 30秒刷新一次
      } else {
        this.clearAutoRefresh()
      }
    },
    
    clearAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    
    // 刷新方法
    refreshClassChart() {
      this.initClassChart()
    },
    
    refreshEventChart() {
      this.initEventChart()
    },
    
    refreshGenderChart() {
      this.initGenderChart()
    },
    
    refreshTrendChart() {
      this.initTrendChart()
    }
  }
}
</script>

<style scoped>
.statistics-center {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.page-title i {
  margin-right: 10px;
  color: #ffd700;
}

.page-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.overview-cards {
  margin-bottom: 30px;
}

.overview-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  height: 100px;
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.card-icon {
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

.overview-card.primary .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.overview-card.success .card-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.overview-card.warning .card-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.overview-card.info .card-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.card-change {
  font-size: 12px;
  font-weight: 600;
}

.card-change.positive {
  color: #52c41a;
}

.card-change.negative {
  color: #ff4d4f;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  height: 400px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.chart-container {
  height: 320px;
}

.status-section {
  margin-bottom: 20px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.status-item {
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(5px);
}

.status-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.status-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.status-value.connected {
  color: #52c41a;
}

.status-value.disconnected {
  color: #ff4d4f;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .statistics-center {
    padding: 10px;
  }

  .page-title {
    font-size: 24px;
  }

  .overview-card {
    margin-bottom: 15px;
  }

  .chart-card {
    height: 300px;
  }

  .chart-container {
    height: 220px;
  }
}
</style>

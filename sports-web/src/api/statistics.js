import { demo as request } from './adapter'

/**
 * 数据统计中心API接口
 */
export const statisticsApi = {
  /**
   * 获取系统概览统计数据
   */
  getOverview() {
    return request.get('/api/statistics/overview')
  },

  /**
   * 获取班级参与统计
   */
  getClassParticipation() {
    return request.get('/api/statistics/class-participation')
  },

  /**
   * 获取项目热度统计
   */
  getEventPopularity() {
    return request.get('/api/statistics/event-popularity')
  },

  /**
   * 获取性别分布统计
   */
  getGenderDistribution() {
    return request.get('/api/statistics/gender-distribution')
  },

  /**
   * 获取报名趋势统计
   * @param {number} days - 统计天数
   */
  getRegistrationTrend(days = 7) {
    return request.get('/api/statistics/registration-trend', { params: { days } })
  },

  /**
   * 获取成绩分析统计
   */
  getScoreAnalysis() {
    return request.get('/api/statistics/score-analysis')
  },

  /**
   * 获取系统运行状态
   */
  getSystemStatus() {
    return request.get('/api/statistics/system-status')
  },

  /**
   * 获取Dashboard综合数据
   */
  getDashboard() {
    return request.get('/api/statistics/dashboard')
  }
}

export default statisticsApi

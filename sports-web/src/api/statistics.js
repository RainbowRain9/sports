import request from './adapter'

/**
 * 数据统计中心API接口
 */
export const statisticsApi = {
  /**
   * 获取系统概览统计数据
   */
  getOverview() {
    return request({
      url: '/api/statistics/overview',
      method: 'get'
    })
  },

  /**
   * 获取班级参与统计
   */
  getClassParticipation() {
    return request({
      url: '/api/statistics/class-participation',
      method: 'get'
    })
  },

  /**
   * 获取项目热度统计
   */
  getEventPopularity() {
    return request({
      url: '/api/statistics/event-popularity',
      method: 'get'
    })
  },

  /**
   * 获取性别分布统计
   */
  getGenderDistribution() {
    return request({
      url: '/api/statistics/gender-distribution',
      method: 'get'
    })
  },

  /**
   * 获取报名趋势统计
   * @param {number} days - 统计天数
   */
  getRegistrationTrend(days = 7) {
    return request({
      url: '/api/statistics/registration-trend',
      method: 'get',
      params: { days }
    })
  },

  /**
   * 获取成绩分析统计
   */
  getScoreAnalysis() {
    return request({
      url: '/api/statistics/score-analysis',
      method: 'get'
    })
  },

  /**
   * 获取系统运行状态
   */
  getSystemStatus() {
    return request({
      url: '/api/statistics/system-status',
      method: 'get'
    })
  },

  /**
   * 获取Dashboard综合数据
   */
  getDashboard() {
    return request({
      url: '/api/statistics/dashboard',
      method: 'get'
    })
  }
}

export default statisticsApi

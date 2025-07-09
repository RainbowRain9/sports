'use strict';

const Controller = require('egg').Controller;

/**
 * 数据统计中心控制器
 * 提供各种统计数据的API接口
 */
class StatisticsController extends Controller {

  /**
   * 获取系统概览统计数据
   * GET /api/statistics/overview
   */
  async getOverview() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || (ctx.user.userType !== 'admin' && ctx.user.roleSubType !== '2')) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const overview = await ctx.service.statistics.getSystemOverview();
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: overview
      };
      
    } catch (error) {
      ctx.logger.error('获取系统概览失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取班级参与统计
   * GET /api/statistics/class-participation
   */
  async getClassParticipation() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || (ctx.user.userType !== 'admin' && ctx.user.roleSubType !== '2')) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const classStats = await ctx.service.statistics.getClassParticipation();
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: classStats
      };
      
    } catch (error) {
      ctx.logger.error('获取班级参与统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取项目热度统计
   * GET /api/statistics/event-popularity
   */
  async getEventPopularity() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || (ctx.user.userType !== 'admin' && ctx.user.roleSubType !== '2')) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const eventStats = await ctx.service.statistics.getEventPopularity();
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: eventStats
      };
      
    } catch (error) {
      ctx.logger.error('获取项目热度统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取性别参与统计
   * GET /api/statistics/gender-distribution
   */
  async getGenderDistribution() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || (ctx.user.userType !== 'admin' && ctx.user.roleSubType !== '2')) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const genderStats = await ctx.service.statistics.getGenderDistribution();
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: genderStats
      };
      
    } catch (error) {
      ctx.logger.error('获取性别分布统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取报名趋势统计
   * GET /api/statistics/registration-trend
   */
  async getRegistrationTrend() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || (ctx.user.userType !== 'admin' && ctx.user.roleSubType !== '2')) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const { days = 7 } = ctx.query;
      const trendData = await ctx.service.statistics.getRegistrationTrend(parseInt(days));
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: trendData
      };
      
    } catch (error) {
      ctx.logger.error('获取报名趋势统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取成绩分析统计
   * GET /api/statistics/score-analysis
   */
  async getScoreAnalysis() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || (ctx.user.userType !== 'admin' && ctx.user.roleSubType !== '2')) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const scoreStats = await ctx.service.statistics.getScoreAnalysis();
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: scoreStats
      };
      
    } catch (error) {
      ctx.logger.error('获取成绩分析统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取实时系统状态
   * GET /api/statistics/system-status
   */
  async getSystemStatus() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || (ctx.user.userType !== 'admin' && ctx.user.roleSubType !== '2')) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const systemStatus = await ctx.service.statistics.getSystemStatus();
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: systemStatus
      };
      
    } catch (error) {
      ctx.logger.error('获取系统状态失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取综合统计数据（用于首页Dashboard）
   * GET /api/statistics/dashboard
   */
  async getDashboard() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || (ctx.user.userType !== 'admin' && ctx.user.roleSubType !== '2')) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const dashboardData = await ctx.service.statistics.getDashboardData();
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: dashboardData
      };
      
    } catch (error) {
      ctx.logger.error('获取Dashboard数据失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = StatisticsController;

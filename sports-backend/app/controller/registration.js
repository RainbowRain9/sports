'use strict';

const Controller = require('egg').Controller;

/**
 * 报名管理控制器
 * 处理运动员报名相关的API请求
 */
class RegistrationController extends Controller {
  
  /**
   * 获取可报名项目列表
   * GET /api/registration/available-events
   */
  async getAvailableEvents() {
    const { ctx } = this;
    
    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }
      
      const playerId = ctx.user.userId;
      const events = await ctx.service.registration.getAvailableEvents(playerId);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: events
      };
      
    } catch (error) {
      ctx.logger.error('获取可报名项目列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 创建报名
   * POST /api/registration/register
   */
  async createRegistration() {
    const { ctx } = this;
    
    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }
      
      const playerId = ctx.user.userId;
      const { scheduleId } = ctx.request.body;
      
      if (!scheduleId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '项目ID不能为空'
        };
        return;
      }
      
      // 检查报名限制
      const limitCheck = await ctx.service.registration.checkRegistrationLimits(playerId, scheduleId);
      if (!limitCheck.canRegister) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: limitCheck.errorMessage
        };
        return;
      }
      
      // 创建报名
      const result = await ctx.service.registration.createRegistration(playerId, scheduleId);
      
      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '报名成功',
          data: result.data
        };
      } else {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: result.message
        };
      }
      
    } catch (error) {
      ctx.logger.error('创建报名失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取我的报名列表
   * GET /api/registration/my-registrations
   */
  async getMyRegistrations() {
    const { ctx } = this;
    
    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }
      
      const playerId = ctx.user.userId;
      const { status } = ctx.query;
      
      const registrations = await ctx.service.registration.getPlayerRegistrations(playerId, status);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: registrations
      };
      
    } catch (error) {
      ctx.logger.error('获取我的报名列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 取消报名
   * DELETE /api/registration/:registrationId
   */
  async cancelRegistration() {
    const { ctx } = this;
    
    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }
      
      const playerId = ctx.user.userId;
      const registrationId = ctx.params.registrationId;
      const { reason } = ctx.request.body;
      
      if (!registrationId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '报名ID不能为空'
        };
        return;
      }
      
      // 验证报名归属
      const registration = await ctx.service.registration.getRegistrationById(registrationId);
      if (!registration || registration.player_id !== playerId) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '无权取消此报名'
        };
        return;
      }
      
      // 取消报名
      const result = await ctx.service.registration.cancelRegistration(registrationId, reason);
      
      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '取消报名成功'
        };
      } else {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: result.message
        };
      }
      
    } catch (error) {
      ctx.logger.error('取消报名失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 检查报名限制
   * POST /api/registration/check-limits
   */
  async checkLimits() {
    const { ctx } = this;
    
    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }
      
      const playerId = ctx.user.userId;
      const { scheduleId } = ctx.request.body;
      
      if (!scheduleId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '项目ID不能为空'
        };
        return;
      }
      
      const limitCheck = await ctx.service.registration.checkRegistrationLimits(playerId, scheduleId);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: limitCheck
      };
      
    } catch (error) {
      ctx.logger.error('检查报名限制失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = RegistrationController;

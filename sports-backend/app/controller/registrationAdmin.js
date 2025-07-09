'use strict';

const Controller = require('egg').Controller;

/**
 * 报名审核管理控制器
 * 处理管理员报名审核相关的API请求
 */
class RegistrationAdminController extends Controller {
  
  /**
   * 获取待审核报名列表
   * GET /api/admin/registrations/pending
   */
  async getPendingRegistrations() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }
      
      const { page = 1, pageSize = 20, status, scheduleId, playerClass } = ctx.query;
      
      const result = await ctx.service.registrationAdmin.getPendingRegistrations({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status: status ? parseInt(status) : null,
        scheduleId: scheduleId ? parseInt(scheduleId) : null,
        playerClass
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result
      };
      
    } catch (error) {
      ctx.logger.error('获取待审核报名列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 批量审核报名
   * POST /api/admin/registrations/batch-review
   */
  async batchReviewRegistrations() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }
      
      const { registrationIds, action, note } = ctx.request.body;
      
      // 参数验证
      if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '报名ID列表不能为空'
        };
        return;
      }
      
      if (!['approve', 'reject'].includes(action)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '操作类型无效，只能是approve或reject'
        };
        return;
      }
      
      const adminId = ctx.user.userId;
      const result = await ctx.service.registrationAdmin.batchReviewRegistrations({
        registrationIds,
        action,
        note,
        adminId
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result,
        message: `成功${action === 'approve' ? '批准' : '拒绝'}${result.successCount}个报名`
      };
      
    } catch (error) {
      ctx.logger.error('批量审核报名失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 单个审核报名
   * PUT /api/admin/registrations/:registrationId/review
   */
  async reviewRegistration() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }
      
      const registrationId = parseInt(ctx.params.registrationId);
      const { action, note } = ctx.request.body;
      
      // 参数验证
      if (!registrationId || isNaN(registrationId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '报名ID无效'
        };
        return;
      }
      
      if (!['approve', 'reject'].includes(action)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '操作类型无效，只能是approve或reject'
        };
        return;
      }
      
      const adminId = ctx.user.userId;
      const result = await ctx.service.registrationAdmin.reviewRegistration({
        registrationId,
        action,
        note,
        adminId
      });
      
      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          data: result.data,
          message: `报名${action === 'approve' ? '批准' : '拒绝'}成功`
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
      ctx.logger.error('审核报名失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取审核统计数据
   * GET /api/admin/registrations/stats
   */
  async getRegistrationStats() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }
      
      const { dateRange } = ctx.query;
      
      const stats = await ctx.service.registrationAdmin.getRegistrationStats({
        dateRange
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: stats
      };
      
    } catch (error) {
      ctx.logger.error('获取审核统计数据失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取审核历史记录
   * GET /api/admin/registrations/history
   */
  async getReviewHistory() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }
      
      const { page = 1, pageSize = 20, adminId, action, dateRange } = ctx.query;
      
      const result = await ctx.service.registrationAdmin.getReviewHistory({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        adminId: adminId ? parseInt(adminId) : null,
        action,
        dateRange
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result
      };
      
    } catch (error) {
      ctx.logger.error('获取审核历史记录失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 导出报名数据
   * GET /api/admin/registrations/export
   */
  async exportRegistrations() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }
      
      const { format = 'excel', status, scheduleId, dateRange } = ctx.query;
      
      const result = await ctx.service.registrationAdmin.exportRegistrations({
        format,
        status: status ? parseInt(status) : null,
        scheduleId: scheduleId ? parseInt(scheduleId) : null,
        dateRange
      });
      
      if (result.success) {
        // 设置下载响应头
        ctx.set('Content-Type', result.contentType);
        ctx.set('Content-Disposition', `attachment; filename="${result.filename}"`);
        ctx.body = result.data;
      } else {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: result.message
        };
      }
      
    } catch (error) {
      ctx.logger.error('导出报名数据失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取审核流程状态
   * GET /api/admin/registrations/:registrationId/workflow
   */
  async getReviewWorkflow() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const registrationId = parseInt(ctx.params.registrationId);

      if (!registrationId || isNaN(registrationId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '报名ID无效'
        };
        return;
      }

      const result = await ctx.service.registrationAdmin.getReviewWorkflow(registrationId);

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
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
      ctx.logger.error('获取审核流程状态失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = RegistrationAdminController;

'use strict';

const Controller = require('egg').Controller;

/**
 * 操作日志控制器
 * 处理操作日志查看和管理相关的API请求
 */
class OperationLogController extends Controller {
  
  /**
   * 获取操作日志列表
   * GET /api/admin/operation-logs
   */
  async getLogs() {
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
      
      const { 
        page = 1, 
        pageSize = 20, 
        userType, 
        operation, 
        targetType, 
        result, 
        dateRange,
        userId 
      } = ctx.query;
      
      const result_data = await ctx.service.operationLog.getLogs({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        userType,
        operation,
        targetType,
        result,
        dateRange,
        userId: userId ? parseInt(userId) : null
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result_data
      };
      
    } catch (error) {
      ctx.logger.error('获取操作日志列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取操作日志统计
   * GET /api/admin/operation-logs/stats
   */
  async getLogStats() {
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
      
      const stats = await ctx.service.operationLog.getLogStats({
        dateRange
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: stats
      };
      
    } catch (error) {
      ctx.logger.error('获取操作日志统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 导出操作日志
   * GET /api/admin/operation-logs/export
   */
  async exportLogs() {
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
      
      const { format = 'excel', userType, operation, dateRange } = ctx.query;
      
      const result = await ctx.service.operationLog.exportLogs({
        format,
        userType,
        operation,
        dateRange
      });
      
      if (result.success) {
        // 记录导出操作
        await ctx.service.operationLog.log({
          userId: ctx.user.userId,
          userType: ctx.user.userType,
          operation: 'export_operation_logs',
          targetType: 'operation_log',
          details: { format, userType, operation, dateRange },
          result: 'success'
        });
        
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
      ctx.logger.error('导出操作日志失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 清理过期日志
   * DELETE /api/admin/operation-logs/cleanup
   */
  async cleanupLogs() {
    const { ctx } = this;
    
    try {
      // 验证超级管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可执行清理操作'
        };
        return;
      }
      
      const { retentionDays = 90 } = ctx.request.body;
      
      // 参数验证
      if (!retentionDays || retentionDays < 7) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '保留天数不能少于7天'
        };
        return;
      }
      
      const result = await ctx.service.operationLog.cleanExpiredLogs(parseInt(retentionDays));
      
      // 记录清理操作
      await ctx.service.operationLog.log({
        userId: ctx.user.userId,
        userType: ctx.user.userType,
        operation: 'cleanup_operation_logs',
        targetType: 'operation_log',
        details: { retentionDays, deletedCount: result.deletedCount },
        result: 'success'
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result,
        message: `成功清理 ${result.deletedCount} 条过期日志`
      };
      
    } catch (error) {
      ctx.logger.error('清理过期日志失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取用户操作历史
   * GET /api/admin/operation-logs/user/:userId
   */
  async getUserOperationHistory() {
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
      
      const userId = parseInt(ctx.params.userId);
      const { userType, limit = 50 } = ctx.query;
      
      if (!userId || isNaN(userId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '用户ID无效'
        };
        return;
      }
      
      if (!userType) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '用户类型不能为空'
        };
        return;
      }
      
      const history = await ctx.service.operationLog.getUserOperationHistory(
        userId, 
        userType, 
        parseInt(limit)
      );
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: history
      };
      
    } catch (error) {
      ctx.logger.error('获取用户操作历史失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取操作类型列表
   * GET /api/admin/operation-logs/operations
   */
  async getOperationTypes() {
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
      
      const { app } = ctx;
      
      // 获取所有操作类型
      const sql = `
        SELECT DISTINCT operation, COUNT(*) as count
        FROM operation_log
        GROUP BY operation
        ORDER BY count DESC
      `;
      
      const operations = await app.mysql.query(sql);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: operations
      };
      
    } catch (error) {
      ctx.logger.error('获取操作类型列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取目标类型列表
   * GET /api/admin/operation-logs/targets
   */
  async getTargetTypes() {
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
      
      const { app } = ctx;
      
      // 获取所有目标类型
      const sql = `
        SELECT DISTINCT target_type, COUNT(*) as count
        FROM operation_log
        WHERE target_type IS NOT NULL
        GROUP BY target_type
        ORDER BY count DESC
      `;
      
      const targets = await app.mysql.query(sql);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: targets
      };
      
    } catch (error) {
      ctx.logger.error('获取目标类型列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = OperationLogController;

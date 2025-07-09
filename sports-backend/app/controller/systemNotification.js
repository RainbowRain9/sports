'use strict';

const Controller = require('egg').Controller;

/**
 * 系统通知控制器
 * 处理系统通知相关的API请求
 */
class SystemNotificationController extends Controller {
  
  /**
   * 获取用户通知列表
   * GET /api/notifications
   */
  async getNotifications() {
    const { ctx } = this;
    
    try {
      // 验证用户登录
      if (!ctx.user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: '请先登录'
        };
        return;
      }
      
      const { page = 1, pageSize = 20, status, type, priority } = ctx.query;
      
      const result = await ctx.service.systemNotification.getUserNotifications({
        userId: ctx.user.userId,
        userType: ctx.user.userType,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status: status ? parseInt(status) : null,
        type,
        priority: priority ? parseInt(priority) : null
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result
      };
      
    } catch (error) {
      ctx.logger.error('获取通知列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取未读通知数量
   * GET /api/notifications/unread-count
   */
  async getUnreadCount() {
    const { ctx } = this;
    
    try {
      // 验证用户登录
      if (!ctx.user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: '请先登录'
        };
        return;
      }
      
      const count = await ctx.service.systemNotification.getUnreadCount(
        ctx.user.userId,
        ctx.user.userType
      );
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: { count }
      };
      
    } catch (error) {
      ctx.logger.error('获取未读通知数量失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 标记通知为已读
   * PUT /api/notifications/:notificationId/read
   */
  async markAsRead() {
    const { ctx } = this;
    
    try {
      // 验证用户登录
      if (!ctx.user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: '请先登录'
        };
        return;
      }
      
      const notificationId = parseInt(ctx.params.notificationId);
      
      if (!notificationId || isNaN(notificationId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '通知ID无效'
        };
        return;
      }
      
      const result = await ctx.service.systemNotification.markAsRead(
        notificationId,
        ctx.user.userId,
        ctx.user.userType
      );
      
      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '标记成功'
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
      ctx.logger.error('标记通知已读失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 批量标记通知为已读
   * PUT /api/notifications/batch-read
   */
  async batchMarkAsRead() {
    const { ctx } = this;
    
    try {
      // 验证用户登录
      if (!ctx.user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: '请先登录'
        };
        return;
      }
      
      const { notificationIds } = ctx.request.body;
      
      // 参数验证
      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '通知ID列表不能为空'
        };
        return;
      }
      
      const result = await ctx.service.systemNotification.batchMarkAsRead(
        notificationIds,
        ctx.user.userId,
        ctx.user.userType
      );
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result,
        message: `成功标记 ${result.successCount} 个通知为已读`
      };
      
    } catch (error) {
      ctx.logger.error('批量标记通知已读失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 全部标记为已读
   * PUT /api/notifications/mark-all-read
   */
  async markAllAsRead() {
    const { ctx } = this;
    
    try {
      // 验证用户登录
      if (!ctx.user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: '请先登录'
        };
        return;
      }
      
      const result = await ctx.service.systemNotification.markAllAsRead(
        ctx.user.userId,
        ctx.user.userType
      );
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result,
        message: `成功标记 ${result.count} 个通知为已读`
      };
      
    } catch (error) {
      ctx.logger.error('全部标记已读失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 删除通知
   * DELETE /api/notifications/:notificationId
   */
  async deleteNotification() {
    const { ctx } = this;
    
    try {
      // 验证用户登录
      if (!ctx.user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: '请先登录'
        };
        return;
      }
      
      const notificationId = parseInt(ctx.params.notificationId);
      
      if (!notificationId || isNaN(notificationId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '通知ID无效'
        };
        return;
      }
      
      const result = await ctx.service.systemNotification.deleteNotification(
        notificationId,
        ctx.user.userId,
        ctx.user.userType
      );
      
      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '删除成功'
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
      ctx.logger.error('删除通知失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 管理员发送系统通知
   * POST /api/admin/notifications/send
   */
  async sendNotification() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可发送通知'
        };
        return;
      }
      
      const { title, content, type, priority, targetUsers, targetUserType } = ctx.request.body;
      
      // 参数验证
      if (!title || !content) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '标题和内容不能为空'
        };
        return;
      }
      
      const result = await ctx.service.systemNotification.sendNotification({
        title,
        content,
        type: type || 'system_notice',
        priority: priority || 1,
        targetUsers,
        targetUserType,
        senderId: ctx.user.userId
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result,
        message: `成功发送 ${result.sentCount} 个通知`
      };
      
    } catch (error) {
      ctx.logger.error('发送通知失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 管理员获取通知统计
   * GET /api/admin/notifications/stats
   */
  async getNotificationStats() {
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
      
      const stats = await ctx.service.systemNotification.getNotificationStats({
        dateRange
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: stats
      };
      
    } catch (error) {
      ctx.logger.error('获取通知统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = SystemNotificationController;

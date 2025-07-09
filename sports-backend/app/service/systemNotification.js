'use strict';

const Service = require('egg').Service;

/**
 * 系统通知服务
 * 处理系统通知相关的业务逻辑
 */
class SystemNotificationService extends Service {
  
  /**
   * 获取用户通知列表
   * @param {object} params - 查询参数
   * @returns {object} 分页结果
   */
  async getUserNotifications(params) {
    const { app } = this;
    const { userId, userType, page, pageSize, status, type, priority } = params;
    
    try {
      // 构建查询条件
      let whereConditions = ['user_id = ? AND user_type = ?'];
      let queryParams = [userId, userType];
      
      if (status !== null) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }
      
      if (type) {
        whereConditions.push('type = ?');
        queryParams.push(type);
      }
      
      if (priority !== null) {
        whereConditions.push('priority = ?');
        queryParams.push(priority);
      }
      
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM system_notification ${whereClause}`;
      const countResult = await app.mysql.query(countSql, queryParams);
      const total = countResult[0].total;
      
      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataSql = `
        SELECT 
          notification_id,
          title,
          content,
          type,
          related_id,
          status,
          priority,
          read_time,
          created_at
        FROM system_notification
        ${whereClause}
        ORDER BY priority DESC, created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(pageSize, offset);
      const dataResult = await app.mysql.query(dataSql, queryParams);
      
      return {
        list: dataResult,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
      
    } catch (error) {
      this.logger.error('获取用户通知列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取未读通知数量
   * @param {number} userId - 用户ID
   * @param {string} userType - 用户类型
   * @returns {number} 未读数量
   */
  async getUnreadCount(userId, userType) {
    const { app } = this;
    
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM system_notification
        WHERE user_id = ? AND user_type = ? AND status = 0
      `;
      
      const result = await app.mysql.query(sql, [userId, userType]);
      return result[0].count;
      
    } catch (error) {
      this.logger.error('获取未读通知数量失败:', error);
      throw error;
    }
  }
  
  /**
   * 标记通知为已读
   * @param {number} notificationId - 通知ID
   * @param {number} userId - 用户ID
   * @param {string} userType - 用户类型
   * @returns {object} 操作结果
   */
  async markAsRead(notificationId, userId, userType) {
    const { app } = this;
    
    try {
      // 检查通知是否存在且属于当前用户
      const notification = await app.mysql.get('system_notification', {
        notification_id: notificationId,
        user_id: userId,
        user_type: userType
      });
      
      if (!notification) {
        return {
          success: false,
          message: '通知不存在或无权访问'
        };
      }
      
      if (notification.status === 1) {
        return {
          success: true,
          message: '通知已经是已读状态'
        };
      }
      
      // 更新为已读状态
      await app.mysql.update('system_notification', {
        status: 1,
        read_time: new Date(),
        updated_at: new Date()
      }, {
        where: { notification_id: notificationId }
      });
      
      return {
        success: true
      };
      
    } catch (error) {
      this.logger.error('标记通知已读失败:', error);
      throw error;
    }
  }
  
  /**
   * 批量标记通知为已读
   * @param {array} notificationIds - 通知ID列表
   * @param {number} userId - 用户ID
   * @param {string} userType - 用户类型
   * @returns {object} 操作结果
   */
  async batchMarkAsRead(notificationIds, userId, userType) {
    const { app } = this;
    
    try {
      let successCount = 0;
      let failedCount = 0;
      
      for (const notificationId of notificationIds) {
        try {
          const result = await this.markAsRead(notificationId, userId, userType);
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
        }
      }
      
      return {
        successCount,
        failedCount,
        total: notificationIds.length
      };
      
    } catch (error) {
      this.logger.error('批量标记通知已读失败:', error);
      throw error;
    }
  }
  
  /**
   * 全部标记为已读
   * @param {number} userId - 用户ID
   * @param {string} userType - 用户类型
   * @returns {object} 操作结果
   */
  async markAllAsRead(userId, userType) {
    const { app } = this;
    
    try {
      const sql = `
        UPDATE system_notification 
        SET status = 1, read_time = NOW(), updated_at = NOW()
        WHERE user_id = ? AND user_type = ? AND status = 0
      `;
      
      const result = await app.mysql.query(sql, [userId, userType]);
      
      return {
        count: result.affectedRows
      };
      
    } catch (error) {
      this.logger.error('全部标记已读失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除通知
   * @param {number} notificationId - 通知ID
   * @param {number} userId - 用户ID
   * @param {string} userType - 用户类型
   * @returns {object} 操作结果
   */
  async deleteNotification(notificationId, userId, userType) {
    const { app } = this;
    
    try {
      // 检查通知是否存在且属于当前用户
      const notification = await app.mysql.get('system_notification', {
        notification_id: notificationId,
        user_id: userId,
        user_type: userType
      });
      
      if (!notification) {
        return {
          success: false,
          message: '通知不存在或无权访问'
        };
      }
      
      await app.mysql.delete('system_notification', {
        notification_id: notificationId
      });
      
      return {
        success: true
      };
      
    } catch (error) {
      this.logger.error('删除通知失败:', error);
      throw error;
    }
  }
  
  /**
   * 发送系统通知
   * @param {object} params - 通知参数
   * @returns {object} 发送结果
   */
  async sendNotification(params) {
    const { app } = this;
    const { title, content, type, priority, targetUsers, targetUserType, senderId } = params;
    
    try {
      let sentCount = 0;
      
      // 如果指定了目标用户列表
      if (targetUsers && Array.isArray(targetUsers) && targetUsers.length > 0) {
        for (const userId of targetUsers) {
          await this._createNotification({
            userId,
            userType: targetUserType,
            title,
            content,
            type,
            priority
          });
          sentCount++;
        }
      } 
      // 如果指定了用户类型，发送给该类型的所有用户
      else if (targetUserType) {
        const users = await this._getUsersByType(targetUserType);
        for (const user of users) {
          await this._createNotification({
            userId: user.user_id,
            userType: targetUserType,
            title,
            content,
            type,
            priority
          });
          sentCount++;
        }
      }
      
      // 记录操作日志
      await this.ctx.service.operationLog.log({
        userId: senderId,
        userType: 'admin',
        operation: 'send_notification',
        targetType: 'system_notification',
        details: { title, type, targetUserType, sentCount },
        result: 'success'
      });
      
      return {
        sentCount
      };
      
    } catch (error) {
      this.logger.error('发送系统通知失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建单个通知
   * @param {object} params - 通知参数
   */
  async _createNotification(params) {
    const { app } = this;
    const { userId, userType, title, content, type, priority, relatedId } = params;
    
    try {
      const notificationData = {
        user_id: userId,
        user_type: userType,
        title,
        content,
        type,
        related_id: relatedId || null,
        status: 0, // 未读
        priority: priority || 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await app.mysql.insert('system_notification', notificationData);
      
    } catch (error) {
      this.logger.error('创建通知失败:', error);
      throw error;
    }
  }
  
  /**
   * 根据用户类型获取用户列表
   * @param {string} userType - 用户类型
   * @returns {array} 用户列表
   */
  async _getUsersByType(userType) {
    const { app } = this;
    
    try {
      let sql;
      let idField;
      
      switch (userType) {
        case 'player':
          sql = 'SELECT player_id as user_id FROM player WHERE player_status = 1';
          break;
        case 'admin':
          sql = 'SELECT admin_id as user_id FROM admin WHERE admin_status = 1';
          break;
        case 'judge':
          sql = 'SELECT judge_id as user_id FROM judge WHERE judge_status = 1';
          break;
        default:
          return [];
      }
      
      const result = await app.mysql.query(sql);
      return result;
      
    } catch (error) {
      this.logger.error('获取用户列表失败:', error);
      return [];
    }
  }
  
  /**
   * 获取通知统计
   * @param {object} params - 查询参数
   * @returns {object} 统计数据
   */
  async getNotificationStats(params) {
    const { app } = this;
    const { dateRange } = params;
    
    try {
      let dateCondition = '';
      let queryParams = [];
      
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        dateCondition = 'WHERE DATE(created_at) BETWEEN ? AND ?';
        queryParams = [startDate, endDate];
      }
      
      // 基础统计
      const basicStatsSql = `
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN status = 0 THEN 1 END) as unread_count,
          COUNT(CASE WHEN status = 1 THEN 1 END) as read_count,
          COUNT(CASE WHEN priority = 3 THEN 1 END) as urgent_count
        FROM system_notification
        ${dateCondition}
      `;
      
      const basicStats = await app.mysql.query(basicStatsSql, queryParams);
      
      // 按类型统计
      const typeStatsSql = `
        SELECT 
          type,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 0 THEN 1 END) as unread_count
        FROM system_notification
        ${dateCondition}
        GROUP BY type
        ORDER BY count DESC
      `;
      
      const typeStats = await app.mysql.query(typeStatsSql, queryParams);
      
      // 按用户类型统计
      const userTypeStatsSql = `
        SELECT 
          user_type,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 0 THEN 1 END) as unread_count
        FROM system_notification
        ${dateCondition}
        GROUP BY user_type
        ORDER BY count DESC
      `;
      
      const userTypeStats = await app.mysql.query(userTypeStatsSql, queryParams);
      
      return {
        basic: basicStats[0],
        byType: typeStats,
        byUserType: userTypeStats
      };
      
    } catch (error) {
      this.logger.error('获取通知统计失败:', error);
      throw error;
    }
  }
  
  /**
   * 清理过期通知
   * @param {number} retentionDays - 保留天数
   * @returns {object} 清理结果
   */
  async cleanExpiredNotifications(retentionDays = 30) {
    const { app } = this;
    
    try {
      const sql = `
        DELETE FROM system_notification 
        WHERE status = 1 AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const result = await app.mysql.query(sql, [retentionDays]);
      
      return {
        success: true,
        deletedCount: result.affectedRows
      };
      
    } catch (error) {
      this.logger.error('清理过期通知失败:', error);
      throw error;
    }
  }
}

module.exports = SystemNotificationService;

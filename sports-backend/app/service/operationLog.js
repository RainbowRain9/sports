'use strict';

const Service = require('egg').Service;

/**
 * 操作日志服务
 * 处理系统操作日志记录和查询
 */
class OperationLogService extends Service {
  
  /**
   * 记录操作日志
   * @param {object} logData - 日志数据
   */
  async log(logData) {
    const { app, ctx } = this;
    
    try {
      const insertData = {
        user_id: logData.userId,
        user_type: logData.userType,
        operation: logData.operation,
        target_type: logData.targetType || null,
        target_id: logData.targetId || null,
        details: logData.details ? JSON.stringify(logData.details) : null,
        ip_address: logData.ipAddress || ctx.ip || null,
        user_agent: logData.userAgent || ctx.get('user-agent') || null,
        result: logData.result || 'success',
        error_message: logData.errorMessage || null,
        created_at: new Date()
      };
      
      await app.mysql.insert('operation_log', insertData);
      
    } catch (error) {
      // 日志记录失败不应该影响主要业务流程
      this.logger.error('记录操作日志失败:', error);
    }
  }
  
  /**
   * 获取操作日志列表
   * @param {object} params - 查询参数
   * @returns {object} 分页结果
   */
  async getLogs(params) {
    const { app } = this;
    const { page, pageSize, userType, operation, targetType, result, dateRange, userId } = params;
    
    try {
      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];
      
      if (userType) {
        whereConditions.push('user_type = ?');
        queryParams.push(userType);
      }
      
      if (operation) {
        whereConditions.push('operation = ?');
        queryParams.push(operation);
      }
      
      if (targetType) {
        whereConditions.push('target_type = ?');
        queryParams.push(targetType);
      }
      
      if (result) {
        whereConditions.push('result = ?');
        queryParams.push(result);
      }
      
      if (userId) {
        whereConditions.push('user_id = ?');
        queryParams.push(userId);
      }
      
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        whereConditions.push('DATE(created_at) BETWEEN ? AND ?');
        queryParams.push(startDate, endDate);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM operation_log ${whereClause}`;
      const countResult = await app.mysql.query(countSql, queryParams);
      const total = countResult[0].total;
      
      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataSql = `
        SELECT 
          log_id,
          user_id,
          user_type,
          operation,
          target_type,
          target_id,
          details,
          ip_address,
          user_agent,
          result,
          error_message,
          created_at
        FROM operation_log
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(pageSize, offset);
      const dataResult = await app.mysql.query(dataSql, queryParams);
      
      // 解析details字段
      dataResult.forEach(log => {
        if (log.details) {
          try {
            log.parsed_details = JSON.parse(log.details);
          } catch (error) {
            log.parsed_details = {};
          }
        }
      });
      
      return {
        list: dataResult,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
      
    } catch (error) {
      this.logger.error('获取操作日志列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取操作统计
   * @param {object} params - 查询参数
   * @returns {object} 统计数据
   */
  async getLogStats(params) {
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
          COUNT(*) as total_operations,
          COUNT(CASE WHEN result = 'success' THEN 1 END) as success_count,
          COUNT(CASE WHEN result = 'failed' THEN 1 END) as failed_count,
          COUNT(DISTINCT user_id) as active_users
        FROM operation_log
        ${dateCondition}
      `;
      
      const basicStats = await app.mysql.query(basicStatsSql, queryParams);
      
      // 按操作类型统计
      const operationStatsSql = `
        SELECT 
          operation,
          COUNT(*) as count,
          COUNT(CASE WHEN result = 'success' THEN 1 END) as success_count,
          COUNT(CASE WHEN result = 'failed' THEN 1 END) as failed_count
        FROM operation_log
        ${dateCondition}
        GROUP BY operation
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const operationStats = await app.mysql.query(operationStatsSql, queryParams);
      
      // 按用户类型统计
      const userTypeStatsSql = `
        SELECT 
          user_type,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM operation_log
        ${dateCondition}
        GROUP BY user_type
        ORDER BY count DESC
      `;
      
      const userTypeStats = await app.mysql.query(userTypeStatsSql, queryParams);
      
      // 按日期统计（最近7天）
      const dailyStatsSql = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          COUNT(CASE WHEN result = 'success' THEN 1 END) as success_count,
          COUNT(CASE WHEN result = 'failed' THEN 1 END) as failed_count
        FROM operation_log
        WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      
      const dailyStats = await app.mysql.query(dailyStatsSql);
      
      return {
        basic: basicStats[0],
        byOperation: operationStats,
        byUserType: userTypeStats,
        daily: dailyStats
      };
      
    } catch (error) {
      this.logger.error('获取操作统计失败:', error);
      throw error;
    }
  }
  
  /**
   * 清理过期日志
   * @param {number} retentionDays - 保留天数
   * @returns {object} 清理结果
   */
  async cleanExpiredLogs(retentionDays = 90) {
    const { app } = this;
    
    try {
      const sql = `
        DELETE FROM operation_log 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const result = await app.mysql.query(sql, [retentionDays]);
      
      return {
        success: true,
        deletedCount: result.affectedRows
      };
      
    } catch (error) {
      this.logger.error('清理过期日志失败:', error);
      throw error;
    }
  }
  
  /**
   * 导出操作日志
   * @param {object} params - 导出参数
   * @returns {object} 导出结果
   */
  async exportLogs(params) {
    const { app } = this;
    const { format, userType, operation, dateRange } = params;
    
    try {
      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];
      
      if (userType) {
        whereConditions.push('user_type = ?');
        queryParams.push(userType);
      }
      
      if (operation) {
        whereConditions.push('operation = ?');
        queryParams.push(operation);
      }
      
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        whereConditions.push('DATE(created_at) BETWEEN ? AND ?');
        queryParams.push(startDate, endDate);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // 查询数据
      const sql = `
        SELECT 
          log_id as '日志ID',
          user_id as '用户ID',
          user_type as '用户类型',
          operation as '操作类型',
          target_type as '目标类型',
          target_id as '目标ID',
          details as '操作详情',
          ip_address as 'IP地址',
          result as '操作结果',
          error_message as '错误信息',
          created_at as '操作时间'
        FROM operation_log
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 10000
      `;
      
      const data = await app.mysql.query(sql, queryParams);
      
      if (format === 'excel') {
        // 这里应该使用Excel导出库，如xlsx
        // 暂时返回JSON格式，实际项目中需要集成Excel库
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        return {
          success: true,
          data: JSON.stringify(data, null, 2),
          contentType: 'application/json',
          filename: `operation_logs_${timestamp}.json`
        };
      } else {
        return {
          success: false,
          message: '不支持的导出格式'
        };
      }
      
    } catch (error) {
      this.logger.error('导出操作日志失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户操作历史
   * @param {number} userId - 用户ID
   * @param {string} userType - 用户类型
   * @param {number} limit - 限制数量
   * @returns {array} 操作历史
   */
  async getUserOperationHistory(userId, userType, limit = 50) {
    const { app } = this;
    
    try {
      const sql = `
        SELECT 
          operation,
          target_type,
          target_id,
          result,
          created_at
        FROM operation_log
        WHERE user_id = ? AND user_type = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      const result = await app.mysql.query(sql, [userId, userType, limit]);
      
      return result;
      
    } catch (error) {
      this.logger.error('获取用户操作历史失败:', error);
      throw error;
    }
  }
}

module.exports = OperationLogService;

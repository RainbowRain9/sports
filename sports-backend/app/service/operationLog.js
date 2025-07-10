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
    const { page, pageSize, userType, operation, targetType, result, dateRange, userId, restrictUserId } = params;
    
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

      // 权限限制：非超级管理员只能查看自己的操作记录
      if (restrictUserId) {
        whereConditions.push('user_id = ?');
        queryParams.push(restrictUserId);
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
    const { dateRange, restrictUserId } = params;
    
    try {
      let dateCondition = '';
      let queryParams = [];
      
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        dateCondition = 'WHERE DATE(created_at) BETWEEN ? AND ?';
        queryParams = [startDate, endDate];
      }

      // 权限限制：非超级管理员只能查看自己的统计数据
      if (restrictUserId) {
        if (dateCondition) {
          dateCondition += ' AND user_id = ?';
        } else {
          dateCondition = 'WHERE user_id = ?';
        }
        queryParams.push(restrictUserId);
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
      let dailyStatsSql = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count,
          COUNT(CASE WHEN result = 'success' THEN 1 END) as success_count,
          COUNT(CASE WHEN result = 'failed' THEN 1 END) as failed_count
        FROM operation_log
        WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `;

      let dailyQueryParams = [];

      // 权限限制：非超级管理员只能查看自己的统计数据
      if (restrictUserId) {
        dailyStatsSql += ' AND user_id = ?';
        dailyQueryParams.push(restrictUserId);
      }

      dailyStatsSql += `
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const dailyStats = await app.mysql.query(dailyStatsSql, dailyQueryParams);
      
      // 处理用户活跃度数据
      const userActivity = {};
      userTypeStats.forEach(item => {
        userActivity[item.user_type] = item.count;
      });

      return {
        basic: basicStats[0],
        operation_types: operationStats,
        user_types: userTypeStats,
        user_activity: userActivity,
        trend: dailyStats.reverse() // 按时间正序排列
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

  /**
   * 获取安全审计数据
   * @returns {object} 安全审计数据
   */
  async getSecurityAuditData() {
    const { app } = this;

    try {
      // 获取安全统计数据
      const securityStatsSql = `
        SELECT
          COUNT(CASE WHEN operation = 'login' AND result = 'failed' THEN 1 END) as failed_logins,
          COUNT(DISTINCT CASE WHEN operation = 'login' AND result = 'failed' THEN ip_address END) as suspicious_ips,
          COUNT(CASE WHEN operation IN ('create_user', 'delete_user', 'update_user', 'create_config', 'delete_config') THEN 1 END) as privilege_operations,
          COUNT(CASE WHEN operation LIKE '%export%' THEN 1 END) as data_exports
        FROM operation_log
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;

      const statsResult = await app.mysql.query(securityStatsSql);
      const stats = statsResult[0];

      // 获取安全事件列表
      const securityEventsSql = `
        SELECT
          log_id,
          CASE
            WHEN operation = 'login' AND result = 'failed' THEN 'failed_login'
            WHEN operation IN ('create_user', 'delete_user', 'update_user') THEN 'privilege_operation'
            WHEN operation LIKE '%export%' THEN 'data_export'
            WHEN user_id = 0 OR user_id IS NULL THEN 'unauthorized_access'
            ELSE 'other'
          END as event_type,
          CONCAT(operation, ' - ', COALESCE(error_message, 'Success')) as description,
          ip_address,
          user_agent,
          CASE
            WHEN operation = 'login' AND result = 'failed' AND
                 (SELECT COUNT(*) FROM operation_log ol2
                  WHERE ol2.ip_address = operation_log.ip_address
                  AND ol2.operation = 'login'
                  AND ol2.result = 'failed'
                  AND ol2.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) > 5
            THEN 'high'
            WHEN operation IN ('delete_user', 'delete_config') THEN 'medium'
            WHEN operation LIKE '%export%' THEN 'medium'
            ELSE 'low'
          END as risk_level,
          created_at
        FROM operation_log
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND (
          (operation = 'login' AND result = 'failed') OR
          operation IN ('create_user', 'delete_user', 'update_user', 'create_config', 'delete_config') OR
          operation LIKE '%export%' OR
          user_id = 0 OR user_id IS NULL
        )
        ORDER BY created_at DESC
        LIMIT 100
      `;

      const eventsResult = await app.mysql.query(securityEventsSql);

      return {
        stats: {
          failedLogins: stats.failed_logins,
          suspiciousIPs: stats.suspicious_ips,
          privilegeOperations: stats.privilege_operations,
          dataExports: stats.data_exports
        },
        events: eventsResult
      };

    } catch (error) {
      this.logger.error('获取安全审计数据失败:', error);
      throw error;
    }
  }

  /**
   * 导出安全审计报告
   * @returns {object} 导出结果
   */
  async exportSecurityReport() {
    const { app } = this;

    try {
      const auditData = await this.getSecurityAuditData();

      // 构建Excel数据
      const workbook = new app.excel.Workbook();

      // 安全统计工作表
      const statsSheet = workbook.addWorksheet('安全统计');
      statsSheet.columns = [
        { header: '统计项目', key: 'item', width: 20 },
        { header: '数量', key: 'count', width: 15 },
        { header: '说明', key: 'description', width: 40 }
      ];

      statsSheet.addRows([
        { item: '登录失败次数', count: auditData.stats.failedLogins, description: '最近30天内的登录失败次数' },
        { item: '可疑IP数量', count: auditData.stats.suspiciousIPs, description: '产生登录失败的不同IP地址数量' },
        { item: '权限操作次数', count: auditData.stats.privilegeOperations, description: '用户管理、配置管理等敏感操作次数' },
        { item: '数据导出次数', count: auditData.stats.dataExports, description: '各类数据导出操作次数' }
      ]);

      // 安全事件工作表
      const eventsSheet = workbook.addWorksheet('安全事件');
      eventsSheet.columns = [
        { header: '事件类型', key: 'event_type', width: 15 },
        { header: '描述', key: 'description', width: 40 },
        { header: 'IP地址', key: 'ip_address', width: 15 },
        { header: '风险等级', key: 'risk_level', width: 10 },
        { header: '发生时间', key: 'created_at', width: 20 }
      ];

      eventsSheet.addRows(auditData.events.map(event => ({
        event_type: this.getSecurityEventText(event.event_type),
        description: event.description,
        ip_address: event.ip_address,
        risk_level: this.getRiskLevelText(event.risk_level),
        created_at: event.created_at
      })));

      // 生成文件
      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `安全审计报告_${new Date().toISOString().split('T')[0]}.xlsx`;

      return {
        success: true,
        data: buffer,
        filename: filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

    } catch (error) {
      this.logger.error('导出安全审计报告失败:', error);
      return {
        success: false,
        message: '导出失败：' + error.message
      };
    }
  }

  /**
   * 获取安全事件文本
   * @param {string} eventType - 事件类型
   * @returns {string} 事件文本
   */
  getSecurityEventText(eventType) {
    const textMap = {
      'failed_login': '登录失败',
      'suspicious_ip': '可疑IP',
      'privilege_operation': '权限操作',
      'data_export': '数据导出',
      'unauthorized_access': '未授权访问'
    };
    return textMap[eventType] || eventType;
  }

  /**
   * 获取风险等级文本
   * @param {string} riskLevel - 风险等级
   * @returns {string} 风险等级文本
   */
  getRiskLevelText(riskLevel) {
    const textMap = {
      'low': '低',
      'medium': '中',
      'high': '高',
      'critical': '严重'
    };
    return textMap[riskLevel] || riskLevel;
  }
}

module.exports = OperationLogService;

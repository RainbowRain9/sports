'use strict';

const Service = require('egg').Service;

/**
 * 报名审核管理服务
 * 处理管理员报名审核相关的业务逻辑
 */
class RegistrationAdminService extends Service {
  
  /**
   * 获取待审核报名列表
   * @param {object} params - 查询参数
   * @returns {object} 分页结果
   */
  async getPendingRegistrations(params) {
    const { app } = this;
    const { page, pageSize, status, scheduleId, playerClass } = params;
    
    try {
      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];
      
      // 状态筛选
      if (status !== null) {
        whereConditions.push('r.registration_status = ?');
        queryParams.push(status);
      } else {
        // 默认查询待审核状态（已报名）
        whereConditions.push('r.registration_status = 1');
      }
      
      // 项目筛选
      if (scheduleId) {
        whereConditions.push('r.schedule_id = ?');
        queryParams.push(scheduleId);
      }
      
      // 班级筛选
      if (playerClass) {
        whereConditions.push('p.player_class LIKE ?');
        queryParams.push(`%${playerClass}%`);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // 查询总数
      const countSql = `
        SELECT COUNT(*) as total
        FROM registration r
        JOIN player p ON r.player_id = p.player_id
        JOIN competition c ON r.schedule_id = c.schedule_id
        ${whereClause}
      `;
      
      const countResult = await app.mysql.query(countSql, queryParams);
      const total = countResult[0].total;
      
      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataSql = `
        SELECT 
          r.registration_id,
          r.registration_status,
          r.registration_time,
          r.confirmation_time,
          r.admin_note,
          p.player_id,
          p.player_name,
          p.player_class,
          p.player_studentid,
          p.player_sex,
          c.schedule_id,
          c.schedule_name,
          c.schedule_date,
          c.schedule_starttime,
          c.schedule_endtime,
          c.schedule_introduction,
          CASE r.registration_status
            WHEN 1 THEN '待审核'
            WHEN 2 THEN '已批准'
            WHEN 3 THEN '已取消'
            WHEN 4 THEN '已拒绝'
            ELSE '未知状态'
          END as status_text
        FROM registration r
        JOIN player p ON r.player_id = p.player_id
        JOIN competition c ON r.schedule_id = c.schedule_id
        ${whereClause}
        ORDER BY r.registration_time DESC
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
      this.logger.error('获取待审核报名列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 批量审核报名
   * @param {object} params - 审核参数
   * @returns {object} 审核结果
   */
  async batchReviewRegistrations(params) {
    const { app } = this;
    const { registrationIds, action, note, adminId } = params;
    
    const conn = await app.mysql.beginTransaction();
    
    try {
      let successCount = 0;
      let failedCount = 0;
      const errors = [];
      
      for (const registrationId of registrationIds) {
        try {
          const result = await this._reviewSingleRegistration(conn, {
            registrationId,
            action,
            note,
            adminId
          });
          
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
            errors.push({
              registrationId,
              error: result.message
            });
          }
        } catch (error) {
          failedCount++;
          errors.push({
            registrationId,
            error: error.message
          });
        }
      }
      
      await conn.commit();
      
      return {
        successCount,
        failedCount,
        errors,
        total: registrationIds.length
      };
      
    } catch (error) {
      await conn.rollback();
      this.logger.error('批量审核报名失败:', error);
      throw error;
    }
  }
  
  /**
   * 单个审核报名
   * @param {object} params - 审核参数
   * @returns {object} 审核结果
   */
  async reviewRegistration(params) {
    const { app } = this;
    const { registrationId, action, note, adminId } = params;
    
    const conn = await app.mysql.beginTransaction();
    
    try {
      const result = await this._reviewSingleRegistration(conn, {
        registrationId,
        action,
        note,
        adminId
      });
      
      if (result.success) {
        await conn.commit();
      } else {
        await conn.rollback();
      }
      
      return result;
      
    } catch (error) {
      await conn.rollback();
      this.logger.error('审核报名失败:', error);
      throw error;
    }
  }
  
  /**
   * 内部方法：审核单个报名
   * @param {object} conn - 数据库连接
   * @param {object} params - 审核参数
   * @returns {object} 审核结果
   */
  async _reviewSingleRegistration(conn, params) {
    const { registrationId, action, note, adminId } = params;
    
    try {
      // 检查报名是否存在且状态正确
      const registration = await conn.get('registration', { registration_id: registrationId });
      
      if (!registration) {
        return {
          success: false,
          message: '报名记录不存在'
        };
      }
      
      if (registration.registration_status !== 1) {
        return {
          success: false,
          message: '报名状态不正确，只能审核待审核状态的报名'
        };
      }
      
      // 确定新状态
      const newStatus = action === 'approve' ? 2 : 4; // 2-已批准，4-已拒绝
      
      // 记录审核日志（在更新前）
      await this._logRegistrationReview(conn, {
        registrationId,
        adminId,
        actionType: action,
        oldStatus: registration.registration_status,
        newStatus,
        reviewNote: note
      });

      // 更新报名状态
      const updateData = {
        registration_status: newStatus,
        admin_id: adminId,
        admin_note: note || null,
        confirmation_time: new Date(),
        updated_at: new Date()
      };

      await conn.update('registration', updateData, {
        where: { registration_id: registrationId }
      });

      // 发送通知
      await this.ctx.service.notification.sendRegistrationReviewNotification({
        registrationId,
        action,
        adminId,
        note
      });

      // 如果是批准，需要检查项目人数限制
      if (action === 'approve') {
        const checkResult = await this._checkEventCapacity(conn, registration.schedule_id);
        if (!checkResult.success) {
          // 如果超出限制，回滚状态
          await conn.update('registration', {
            registration_status: 1,
            admin_id: null,
            admin_note: null,
            confirmation_time: null
          }, {
            where: { registration_id: registrationId }
          });
          
          return {
            success: false,
            message: checkResult.message
          };
        }
      }
      
      return {
        success: true,
        data: {
          registrationId,
          newStatus,
          statusText: newStatus === 2 ? '已批准' : '已拒绝'
        }
      };
      
    } catch (error) {
      this.logger.error('审核单个报名失败:', error);
      throw error;
    }
  }
  
  /**
   * 检查项目容量限制
   * @param {object} conn - 数据库连接
   * @param {number} scheduleId - 项目ID
   * @returns {object} 检查结果
   */
  async _checkEventCapacity(conn, scheduleId) {
    try {
      // 获取项目信息
      const event = await conn.get('competition', { schedule_id: scheduleId });
      
      if (!event) {
        return {
          success: false,
          message: '比赛项目不存在'
        };
      }
      
      // 统计已批准的报名数量
      const approvedCount = await conn.count('registration', {
        schedule_id: scheduleId,
        registration_status: 2 // 已批准
      });
      
      // 检查是否超出限制
      if (event.max_participants && approvedCount >= event.max_participants) {
        return {
          success: false,
          message: `项目 ${event.schedule_name} 已达到最大参赛人数限制 (${event.max_participants}人)`
        };
      }
      
      return {
        success: true
      };
      
    } catch (error) {
      this.logger.error('检查项目容量限制失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取审核统计数据
   * @param {object} params - 查询参数
   * @returns {object} 统计数据
   */
  async getRegistrationStats(params) {
    const { app } = this;
    const { dateRange } = params;
    
    try {
      let dateCondition = '';
      let queryParams = [];
      
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        dateCondition = 'WHERE r.registration_time BETWEEN ? AND ?';
        queryParams = [startDate, endDate];
      }
      
      // 基础统计
      const basicStatsSql = `
        SELECT 
          COUNT(*) as total_registrations,
          COUNT(CASE WHEN registration_status = 1 THEN 1 END) as pending_count,
          COUNT(CASE WHEN registration_status = 2 THEN 1 END) as approved_count,
          COUNT(CASE WHEN registration_status = 3 THEN 1 END) as cancelled_count,
          COUNT(CASE WHEN registration_status = 4 THEN 1 END) as rejected_count
        FROM registration r
        ${dateCondition}
      `;
      
      const basicStats = await app.mysql.query(basicStatsSql, queryParams);
      
      // 按项目统计
      const eventStatsSql = `
        SELECT 
          c.schedule_name,
          COUNT(*) as total_registrations,
          COUNT(CASE WHEN r.registration_status = 1 THEN 1 END) as pending_count,
          COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) as approved_count
        FROM registration r
        JOIN competition c ON r.schedule_id = c.schedule_id
        ${dateCondition}
        GROUP BY c.schedule_id, c.schedule_name
        ORDER BY total_registrations DESC
        LIMIT 10
      `;
      
      const eventStats = await app.mysql.query(eventStatsSql, queryParams);
      
      // 按班级统计
      const classStatsSql = `
        SELECT 
          p.player_class,
          COUNT(*) as total_registrations,
          COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) as approved_count
        FROM registration r
        JOIN player p ON r.player_id = p.player_id
        ${dateCondition}
        GROUP BY p.player_class
        ORDER BY total_registrations DESC
        LIMIT 10
      `;
      
      const classStats = await app.mysql.query(classStatsSql, queryParams);
      
      return {
        basic: basicStats[0],
        byEvent: eventStats,
        byClass: classStats
      };

    } catch (error) {
      this.logger.error('获取审核统计数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取审核历史记录
   * @param {object} params - 查询参数
   * @returns {object} 分页结果
   */
  async getReviewHistory(params) {
    const { app } = this;
    const { page, pageSize, adminId, action, dateRange } = params;

    try {
      // 构建查询条件
      let whereConditions = ['r.registration_status IN (2, 4)']; // 已批准或已拒绝
      let queryParams = [];

      // 管理员筛选
      if (adminId) {
        whereConditions.push('r.admin_id = ?');
        queryParams.push(adminId);
      }

      // 操作类型筛选
      if (action) {
        if (action === 'approve') {
          whereConditions.push('r.registration_status = 2');
        } else if (action === 'reject') {
          whereConditions.push('r.registration_status = 4');
        }
      }

      // 日期范围筛选
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        whereConditions.push('r.confirmation_time BETWEEN ? AND ?');
        queryParams.push(startDate, endDate);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // 查询总数
      const countSql = `
        SELECT COUNT(*) as total
        FROM registration r
        JOIN player p ON r.player_id = p.player_id
        JOIN competition c ON r.schedule_id = c.schedule_id
        LEFT JOIN admin a ON r.admin_id = a.admin_id
        ${whereClause}
      `;

      const countResult = await app.mysql.query(countSql, queryParams);
      const total = countResult[0].total;

      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataSql = `
        SELECT
          r.registration_id,
          r.registration_status,
          r.registration_time,
          r.confirmation_time,
          r.admin_note,
          p.player_name,
          p.player_class,
          p.player_studentid,
          c.schedule_name,
          c.schedule_date,
          a.admin_name as reviewer_name,
          CASE r.registration_status
            WHEN 2 THEN '已批准'
            WHEN 4 THEN '已拒绝'
            ELSE '未知状态'
          END as status_text,
          CASE r.registration_status
            WHEN 2 THEN 'approve'
            WHEN 4 THEN 'reject'
            ELSE 'unknown'
          END as action_type
        FROM registration r
        JOIN player p ON r.player_id = p.player_id
        JOIN competition c ON r.schedule_id = c.schedule_id
        LEFT JOIN admin a ON r.admin_id = a.admin_id
        ${whereClause}
        ORDER BY r.confirmation_time DESC
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
      this.logger.error('获取审核历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 导出报名数据
   * @param {object} params - 导出参数
   * @returns {object} 导出结果
   */
  async exportRegistrations(params) {
    const { app } = this;
    const { format, status, scheduleId, dateRange } = params;

    try {
      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];

      if (status !== null) {
        whereConditions.push('r.registration_status = ?');
        queryParams.push(status);
      }

      if (scheduleId) {
        whereConditions.push('r.schedule_id = ?');
        queryParams.push(scheduleId);
      }

      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        whereConditions.push('r.registration_time BETWEEN ? AND ?');
        queryParams.push(startDate, endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // 查询数据
      const sql = `
        SELECT
          r.registration_id as '报名ID',
          p.player_name as '运动员姓名',
          p.player_class as '班级',
          p.player_studentid as '学号',
          p.player_sex as '性别',
          c.schedule_name as '比赛项目',
          c.schedule_date as '比赛日期',
          c.schedule_starttime as '开始时间',
          r.registration_time as '报名时间',
          CASE r.registration_status
            WHEN 1 THEN '待审核'
            WHEN 2 THEN '已批准'
            WHEN 3 THEN '已取消'
            WHEN 4 THEN '已拒绝'
            ELSE '未知状态'
          END as '报名状态',
          r.confirmation_time as '审核时间',
          a.admin_name as '审核人',
          r.admin_note as '审核备注'
        FROM registration r
        JOIN player p ON r.player_id = p.player_id
        JOIN competition c ON r.schedule_id = c.schedule_id
        LEFT JOIN admin a ON r.admin_id = a.admin_id
        ${whereClause}
        ORDER BY r.registration_time DESC
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
          filename: `registrations_${timestamp}.json`
        };
      } else {
        return {
          success: false,
          message: '不支持的导出格式'
        };
      }

    } catch (error) {
      this.logger.error('导出报名数据失败:', error);
      throw error;
    }
  }

  /**
   * 记录审核日志
   * @param {object} conn - 数据库连接
   * @param {object} params - 日志参数
   */
  async _logRegistrationReview(conn, params) {
    const { registrationId, adminId, actionType, oldStatus, newStatus, reviewNote } = params;

    try {
      const logData = {
        registration_id: registrationId,
        admin_id: adminId,
        action_type: actionType,
        old_status: oldStatus,
        new_status: newStatus,
        review_note: reviewNote || null,
        review_time: new Date(),
        created_at: new Date()
      };

      await conn.insert('registration_review_log', logData);

    } catch (error) {
      this.logger.error('记录审核日志失败:', error);
      // 日志记录失败不应该影响主要业务流程
    }
  }

  /**
   * 获取审核流程状态
   * @param {number} registrationId - 报名ID
   * @returns {object} 流程状态
   */
  async getReviewWorkflow(registrationId) {
    const { app } = this;

    try {
      // 获取报名基本信息
      const registration = await app.mysql.get('registration', { registration_id: registrationId });

      if (!registration) {
        return {
          success: false,
          message: '报名记录不存在'
        };
      }

      // 获取审核日志
      const logs = await app.mysql.select('registration_review_log', {
        where: { registration_id: registrationId },
        orders: [['review_time', 'asc']]
      });

      // 构建流程状态
      const workflow = {
        registration_id: registrationId,
        current_status: registration.registration_status,
        current_status_text: this._getStatusText(registration.registration_status),
        registration_time: registration.registration_time,
        confirmation_time: registration.confirmation_time,
        admin_note: registration.admin_note,
        review_logs: logs.map(log => ({
          log_id: log.log_id,
          admin_id: log.admin_id,
          action_type: log.action_type,
          action_text: this._getActionText(log.action_type),
          old_status: log.old_status,
          old_status_text: this._getStatusText(log.old_status),
          new_status: log.new_status,
          new_status_text: this._getStatusText(log.new_status),
          review_note: log.review_note,
          review_time: log.review_time
        })),
        can_approve: registration.registration_status === 1,
        can_reject: registration.registration_status === 1,
        can_cancel: [1, 2].includes(registration.registration_status)
      };

      return {
        success: true,
        data: workflow
      };

    } catch (error) {
      this.logger.error('获取审核流程状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取状态文本
   * @param {number} status - 状态码
   * @returns {string} 状态文本
   */
  _getStatusText(status) {
    const statusMap = {
      1: '待审核',
      2: '已批准',
      3: '已取消',
      4: '已拒绝'
    };
    return statusMap[status] || '未知状态';
  }

  /**
   * 获取操作文本
   * @param {string} action - 操作类型
   * @returns {string} 操作文本
   */
  _getActionText(action) {
    const actionMap = {
      'approve': '批准',
      'reject': '拒绝',
      'cancel': '取消',
      'unknown': '未知操作'
    };
    return actionMap[action] || '未知操作';
  }

  /**
   * 验证审核权限
   * @param {number} adminId - 管理员ID
   * @param {string} action - 操作类型
   * @returns {object} 验证结果
   */
  async validateReviewPermission(adminId, action) {
    const { app } = this;

    try {
      // 获取管理员信息
      const admin = await app.mysql.get('admin', { admin_id: adminId });

      if (!admin) {
        return {
          success: false,
          message: '管理员不存在'
        };
      }

      // 检查管理员类型权限
      const allowedActions = {
        '2': ['approve', 'reject', 'cancel'], // 管理员
        '1': ['approve', 'reject']            // 操作员
      };

      const permissions = allowedActions[admin.admin_type] || [];

      if (!permissions.includes(action)) {
        return {
          success: false,
          message: '权限不足，无法执行此操作'
        };
      }

      return {
        success: true,
        admin
      };

    } catch (error) {
      this.logger.error('验证审核权限失败:', error);
      throw error;
    }
  }
}

module.exports = RegistrationAdminService;

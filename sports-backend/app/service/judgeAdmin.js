'use strict';

const Service = require('egg').Service;

/**
 * 管理员端裁判员管理服务
 * 处理管理员对裁判员的CRUD操作和赛事分配
 */
class JudgeAdminService extends Service {

  // ==================== 裁判员CRUD操作 ====================

  /**
   * 获取裁判员列表
   * @param {object} params - 查询参数
   * @returns {object} 分页结果
   */
  async getJudgeList(params) {
    const { app } = this;
    const { page = 1, pageSize = 20, name, specialty, status } = params;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (name) {
      whereClause += ' AND j.judge_name LIKE ?';
      queryParams.push(`%${name}%`);
    }

    if (specialty) {
      whereClause += ' AND j.judge_specialty LIKE ?';
      queryParams.push(`%${specialty}%`);
    }

    if (status !== undefined && status !== '') {
      whereClause += ' AND j.judge_status = ?';
      queryParams.push(parseInt(status));
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM judge j
      ${whereClause}
    `;
    const countResult = await app.mysql.query(countSql, queryParams);
    const total = countResult[0].total;

    // 查询列表数据
    const offset = (page - 1) * pageSize;
    const listSql = `
      SELECT 
        j.judge_id,
        j.judge_name,
        j.judge_username,
        j.judge_sex,
        j.judge_phone,
        j.judge_email,
        j.judge_specialty,
        j.judge_status,
        j.created_at,
        j.updated_at,
        COALESCE(stats.assigned_events, 0) as assigned_events,
        COALESCE(stats.completed_events, 0) as completed_events,
        COALESCE(stats.scored_records, 0) as scored_records
      FROM judge j
      LEFT JOIN v_judge_work_stats stats ON j.judge_id = stats.judge_id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const listParams = [...queryParams, pageSize, offset];
    const list = await app.mysql.query(listSql, listParams);

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 获取裁判员详情
   * @param {number} judgeId - 裁判员ID
   * @returns {object} 裁判员详情
   */
  async getJudgeDetail(judgeId) {
    const { app } = this;

    const sql = `
      SELECT 
        j.judge_id,
        j.judge_name,
        j.judge_username,
        j.judge_sex,
        j.judge_phone,
        j.judge_email,
        j.judge_specialty,
        j.judge_status,
        j.created_at,
        j.updated_at,
        COALESCE(stats.assigned_events, 0) as assigned_events,
        COALESCE(stats.completed_events, 0) as completed_events,
        COALESCE(stats.scored_records, 0) as scored_records,
        COALESCE(stats.today_events, 0) as today_events,
        COALESCE(stats.upcoming_events, 0) as upcoming_events
      FROM judge j
      LEFT JOIN v_judge_work_stats stats ON j.judge_id = stats.judge_id
      WHERE j.judge_id = ?
    `;

    const result = await app.mysql.query(sql, [judgeId]);
    return result[0] || null;
  }

  /**
   * 创建裁判员
   * @param {object} judgeData - 裁判员数据
   * @returns {object} 创建结果
   */
  async createJudge(judgeData) {
    const { app } = this;
    const { 
      judge_name, 
      judge_username, 
      judge_password, 
      judge_sex, 
      judge_phone, 
      judge_email, 
      judge_specialty 
    } = judgeData;

    // 检查用户名是否已存在
    const existingJudge = await app.mysql.get('judge', { judge_username });
    if (existingJudge) {
      return {
        success: false,
        message: '用户名已存在'
      };
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (judge_email) {
      const existingEmail = await app.mysql.get('judge', { judge_email });
      if (existingEmail) {
        return {
          success: false,
          message: '邮箱已被使用'
        };
      }
    }

    try {
      const result = await app.mysql.insert('judge', {
        judge_name,
        judge_username,
        judge_password,
        judge_sex,
        judge_phone,
        judge_email,
        judge_specialty,
        judge_status: 1, // 默认启用
        created_at: new Date(),
        updated_at: new Date()
      });

      return {
        success: true,
        message: '裁判员创建成功',
        judgeId: result.insertId
      };

    } catch (error) {
      this.logger.error('创建裁判员失败:', error);
      return {
        success: false,
        message: '创建失败，请稍后重试'
      };
    }
  }

  /**
   * 更新裁判员信息
   * @param {number} judgeId - 裁判员ID
   * @param {object} judgeData - 更新数据
   * @returns {object} 更新结果
   */
  async updateJudge(judgeId, judgeData) {
    const { app } = this;
    const { 
      judge_name, 
      judge_username, 
      judge_password, 
      judge_sex, 
      judge_phone, 
      judge_email, 
      judge_specialty,
      judge_status
    } = judgeData;

    // 检查裁判员是否存在
    const existingJudge = await app.mysql.get('judge', { judge_id: judgeId });
    if (!existingJudge) {
      return {
        success: false,
        message: '裁判员不存在'
      };
    }

    // 检查用户名是否被其他裁判员使用
    if (judge_username && judge_username !== existingJudge.judge_username) {
      const duplicateUsername = await app.mysql.get('judge', { 
        judge_username,
        judge_id: ['!=', judgeId]
      });
      if (duplicateUsername) {
        return {
          success: false,
          message: '用户名已被其他裁判员使用'
        };
      }
    }

    // 检查邮箱是否被其他裁判员使用
    if (judge_email && judge_email !== existingJudge.judge_email) {
      const duplicateEmail = await app.mysql.get('judge', { 
        judge_email,
        judge_id: ['!=', judgeId]
      });
      if (duplicateEmail) {
        return {
          success: false,
          message: '邮箱已被其他裁判员使用'
        };
      }
    }

    try {
      const updateData = {
        updated_at: new Date()
      };

      // 只更新提供的字段
      if (judge_name) updateData.judge_name = judge_name;
      if (judge_username) updateData.judge_username = judge_username;
      if (judge_password) updateData.judge_password = judge_password;
      if (judge_sex) updateData.judge_sex = judge_sex;
      if (judge_phone !== undefined) updateData.judge_phone = judge_phone;
      if (judge_email !== undefined) updateData.judge_email = judge_email;
      if (judge_specialty !== undefined) updateData.judge_specialty = judge_specialty;
      if (judge_status !== undefined) updateData.judge_status = judge_status;

      await app.mysql.update('judge', updateData, {
        where: { judge_id: judgeId }
      });

      return {
        success: true,
        message: '裁判员信息更新成功'
      };

    } catch (error) {
      this.logger.error('更新裁判员失败:', error);
      return {
        success: false,
        message: '更新失败，请稍后重试'
      };
    }
  }

  /**
   * 删除裁判员
   * @param {number} judgeId - 裁判员ID
   * @returns {object} 删除结果
   */
  async deleteJudge(judgeId) {
    const { app } = this;

    // 检查裁判员是否存在
    const existingJudge = await app.mysql.get('judge', { judge_id: judgeId });
    if (!existingJudge) {
      return {
        success: false,
        message: '裁判员不存在'
      };
    }

    // 检查是否有关联的赛事分配
    const assignedEvents = await app.mysql.select('judge_events', {
      where: { judge_id: judgeId }
    });

    if (assignedEvents.length > 0) {
      return {
        success: false,
        message: '该裁判员已分配赛事，无法删除。请先取消赛事分配。'
      };
    }

    // 检查是否有关联的成绩记录
    const scoreRecords = await app.mysql.select('plog', {
      where: { plog_judgeid: judgeId }
    });

    if (scoreRecords.length > 0) {
      return {
        success: false,
        message: '该裁判员已录入成绩，无法删除。'
      };
    }

    try {
      await app.mysql.delete('judge', { judge_id: judgeId });

      return {
        success: true,
        message: '裁判员删除成功'
      };

    } catch (error) {
      this.logger.error('删除裁判员失败:', error);
      return {
        success: false,
        message: '删除失败，请稍后重试'
      };
    }
  }

  // ==================== 赛事分配管理 ====================

  /**
   * 获取可分配的比赛项目列表
   * @returns {array} 比赛项目列表
   */
  async getAvailableEvents() {
    const { app } = this;

    const sql = `
      SELECT
        c.schedule_id,
        c.schedule_name,
        c.schedule_date,
        c.schedule_starttime,
        c.schedule_endtime,
        c.schedule_introduction,
        pt.type_name as project_type,
        COUNT(DISTINCT je.judge_id) as assigned_judges,
        COUNT(DISTINCT r.registration_id) as registered_players
      FROM competition c
      LEFT JOIN project pt ON c.schedule_itemid = pt.type_id
      LEFT JOIN judge_events je ON c.schedule_id = je.schedule_id AND je.status IN (1,2)
      LEFT JOIN registration r ON c.schedule_id = r.schedule_id AND r.registration_status IN (1,2)
      WHERE c.schedule_date >= CURDATE()
      GROUP BY c.schedule_id
      ORDER BY c.schedule_date ASC, c.schedule_starttime ASC
    `;

    return await app.mysql.query(sql);
  }

  /**
   * 获取裁判员的赛事分配列表
   * @param {number} judgeId - 裁判员ID
   * @returns {array} 赛事分配列表
   */
  async getJudgeEventAssignments(judgeId) {
    const { app } = this;

    const sql = `
      SELECT
        je.id as assignment_id,
        je.judge_id,
        je.schedule_id,
        je.status as assignment_status,
        je.assigned_at,
        je.notes,
        c.schedule_name,
        c.schedule_date,
        c.schedule_starttime,
        c.schedule_endtime,
        c.schedule_introduction,
        pt.type_name as project_type,
        COUNT(DISTINCT r.registration_id) as registered_players,
        COUNT(DISTINCT p.plog_id) as scored_players
      FROM judge_events je
      JOIN competition c ON je.schedule_id = c.schedule_id
      LEFT JOIN project pt ON c.schedule_itemid = pt.type_id
      LEFT JOIN registration r ON c.schedule_id = r.schedule_id AND r.registration_status IN (1,2)
      LEFT JOIN plog p ON c.schedule_id = p.plog_scheduleid AND p.plog_judgeid = je.judge_id
      WHERE je.judge_id = ?
      GROUP BY je.id
      ORDER BY c.schedule_date ASC, c.schedule_starttime ASC
    `;

    return await app.mysql.query(sql, [judgeId]);
  }

  /**
   * 分配裁判员到比赛项目
   * @param {object} assignmentData - 分配数据
   * @returns {object} 分配结果
   */
  async assignJudgeToEvent(assignmentData) {
    const { app } = this;
    const { judge_id, schedule_id, assigned_by, notes } = assignmentData;

    // 验证裁判员是否存在且状态正常
    const judge = await app.mysql.get('judge', { judge_id });
    if (!judge || judge.judge_status !== 1) {
      return {
        success: false,
        message: '裁判员不存在或状态异常'
      };
    }

    // 验证比赛项目是否存在
    const event = await app.mysql.get('competition', { schedule_id });
    if (!event) {
      return {
        success: false,
        message: '比赛项目不存在'
      };
    }

    // 检查是否已经分配
    const existingAssignment = await app.mysql.get('judge_events', {
      judge_id,
      schedule_id
    });

    if (existingAssignment) {
      return {
        success: false,
        message: '该裁判员已分配到此比赛项目'
      };
    }

    try {
      const result = await app.mysql.insert('judge_events', {
        judge_id,
        schedule_id,
        assigned_by,
        status: 1, // 已分配
        notes,
        assigned_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      return {
        success: true,
        message: '分配成功',
        assignmentId: result.insertId
      };

    } catch (error) {
      this.logger.error('分配裁判员失败:', error);
      return {
        success: false,
        message: '分配失败，请稍后重试'
      };
    }
  }

  /**
   * 取消裁判员赛事分配
   * @param {number} assignmentId - 分配记录ID
   * @returns {object} 取消结果
   */
  async cancelJudgeAssignment(assignmentId) {
    const { app } = this;

    // 检查分配记录是否存在
    const assignment = await app.mysql.get('judge_events', { id: assignmentId });
    if (!assignment) {
      return {
        success: false,
        message: '分配记录不存在'
      };
    }

    // 检查是否已有成绩录入
    const scoreRecords = await app.mysql.select('plog', {
      where: {
        plog_judgeid: assignment.judge_id,
        plog_scheduleid: assignment.schedule_id
      }
    });

    if (scoreRecords.length > 0) {
      return {
        success: false,
        message: '该裁判员已为此比赛录入成绩，无法取消分配'
      };
    }

    try {
      await app.mysql.delete('judge_events', { id: assignmentId });

      return {
        success: true,
        message: '取消分配成功'
      };

    } catch (error) {
      this.logger.error('取消分配失败:', error);
      return {
        success: false,
        message: '取消分配失败，请稍后重试'
      };
    }
  }

  /**
   * 批量分配裁判员
   * @param {object} batchData - 批量分配数据
   * @returns {object} 批量分配结果
   */
  async batchAssignJudges(batchData) {
    const { app } = this;
    const { judge_ids, schedule_id, assigned_by, notes } = batchData;

    if (!Array.isArray(judge_ids) || judge_ids.length === 0) {
      return {
        success: false,
        message: '裁判员ID列表不能为空'
      };
    }

    // 验证比赛项目是否存在
    const event = await app.mysql.get('competition', { schedule_id });
    if (!event) {
      return {
        success: false,
        message: '比赛项目不存在'
      };
    }

    const results = {
      success: [],
      failed: [],
      total: judge_ids.length
    };

    // 逐个分配
    for (const judge_id of judge_ids) {
      try {
        const result = await this.assignJudgeToEvent({
          judge_id,
          schedule_id,
          assigned_by,
          notes
        });

        if (result.success) {
          results.success.push({
            judge_id,
            message: result.message
          });
        } else {
          results.failed.push({
            judge_id,
            message: result.message
          });
        }
      } catch (error) {
        results.failed.push({
          judge_id,
          message: '分配异常'
        });
      }
    }

    return {
      success: true,
      message: `批量分配完成：成功${results.success.length}个，失败${results.failed.length}个`,
      data: results
    };
  }

  // ==================== 统计和报告 ====================

  /**
   * 获取裁判员工作统计
   * @param {object} params - 查询参数
   * @returns {object} 统计数据
   */
  async getJudgeWorkStats(params) {
    const { app } = this;
    const { dateRange } = params;

    let dateFilter = '';
    const queryParams = [];

    if (dateRange && dateRange.length === 2) {
      dateFilter = 'AND c.schedule_date BETWEEN ? AND ?';
      queryParams.push(dateRange[0], dateRange[1]);
    }

    const sql = `
      SELECT
        j.judge_id,
        j.judge_name,
        j.judge_specialty,
        COUNT(DISTINCT je.schedule_id) as total_assigned,
        COUNT(DISTINCT CASE WHEN je.status = 3 THEN je.schedule_id END) as completed_events,
        COUNT(DISTINCT p.plog_id) as scored_records,
        AVG(CASE WHEN p.plog_score > 0 THEN p.plog_score END) as avg_score
      FROM judge j
      LEFT JOIN judge_events je ON j.judge_id = je.judge_id
      LEFT JOIN competition c ON je.schedule_id = c.schedule_id
      LEFT JOIN plog p ON j.judge_id = p.plog_judgeid
      WHERE j.judge_status = 1 ${dateFilter}
      GROUP BY j.judge_id
      ORDER BY total_assigned DESC, completed_events DESC
    `;

    return await app.mysql.query(sql, queryParams);
  }
}

module.exports = JudgeAdminService;

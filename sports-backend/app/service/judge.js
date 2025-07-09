'use strict';

const Service = require('egg').Service;
const bcrypt = require('bcryptjs');

/**
 * 裁判员服务类
 * 处理裁判员相关的业务逻辑
 */
class JudgeService extends Service {

  // ==================== 个人信息管理 ====================

  /**
   * 获取裁判员个人信息
   * @param {number} judgeId - 裁判员ID
   * @returns {object} 裁判员信息
   */
  async getProfile(judgeId) {
    const { app } = this;

    const sql = `
      SELECT
        judge_id,
        judge_name,
        judge_username,
        judge_sex,
        judge_phone,
        judge_email,
        judge_specialty,
        judge_status,
        created_at,
        updated_at
      FROM judge
      WHERE judge_id = ?
    `;

    const result = await app.mysql.query(sql, [judgeId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 更新裁判员个人信息
   * @param {number} judgeId - 裁判员ID
   * @param {object} updateData - 更新数据
   * @returns {boolean} 更新结果
   */
  async updateProfile(judgeId, updateData) {
    const { app } = this;

    try {
      const result = await app.mysql.update('judge', {
        ...updateData,
        updated_at: new Date()
      }, {
        where: { judge_id: judgeId }
      });

      return result.affectedRows > 0;
    } catch (error) {
      this.logger.error('更新裁判员信息失败:', error);
      return false;
    }
  }

  /**
   * 获取裁判员统计信息
   * @param {number} judgeId - 裁判员ID
   * @returns {object} 统计信息
   */
  async getJudgeStats(judgeId) {
    const { app } = this;

    // 获取工作统计
    const workStatsSql = `
      SELECT
        assigned_events,
        completed_events,
        scored_records,
        today_events,
        upcoming_events
      FROM v_judge_work_stats
      WHERE judge_id = ?
    `;

    // 获取最近录入的成绩
    const recentScoresSql = `
      SELECT
        p.plog_id,
        p.plog_score,
        c.schedule_name,
        c.schedule_date,
        pl.player_name,
        pl.player_number
      FROM plog p
      JOIN competition c ON p.plog_scheduleid = c.schedule_id
      JOIN player pl ON p.plog_playerid = pl.player_id
      WHERE p.plog_judgeid = ?
      ORDER BY p.plog_id DESC
      LIMIT 5
    `;

    // 获取今日待执裁项目
    const todayEventsSql = `
      SELECT
        c.schedule_id,
        c.schedule_name,
        c.schedule_starttime,
        c.schedule_endtime,
        COUNT(DISTINCT r.registration_id) as registered_count,
        COUNT(DISTINCT p.plog_id) as scored_count
      FROM judge_events je
      JOIN competition c ON je.schedule_id = c.schedule_id
      LEFT JOIN registration r ON c.schedule_id = r.schedule_id AND r.registration_status IN (1,2)
      LEFT JOIN plog p ON c.schedule_id = p.plog_scheduleid
      WHERE je.judge_id = ? AND c.schedule_date = CURDATE()
      GROUP BY c.schedule_id
      ORDER BY c.schedule_starttime
    `;

    const [workStats, recentScores, todayEvents] = await Promise.all([
      app.mysql.query(workStatsSql, [judgeId]),
      app.mysql.query(recentScoresSql, [judgeId]),
      app.mysql.query(todayEventsSql, [judgeId])
    ]);

    return {
      workStats: workStats[0] || {
        assigned_events: 0,
        completed_events: 0,
        scored_records: 0,
        today_events: 0,
        upcoming_events: 0
      },
      recentScores: recentScores || [],
      todayEvents: todayEvents || []
    };
  }

  /**
   * 修改密码
   * @param {number} judgeId - 裁判员ID
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   * @returns {object} 修改结果
   */
  async changePassword(judgeId, oldPassword, newPassword) {
    const { app } = this;

    try {
      // 获取当前密码
      const judge = await app.mysql.get('judge', { judge_id: judgeId });
      if (!judge) {
        return { success: false, message: '裁判员不存在' };
      }

      // 验证旧密码
      const isOldPasswordValid = await this.verifyPassword(oldPassword, judge.judge_password);
      if (!isOldPasswordValid) {
        return { success: false, message: '原密码错误' };
      }

      // 加密新密码（如果需要）
      let hashedNewPassword = newPassword;
      if (newPassword.length < 60) { // 简单判断是否已加密
        hashedNewPassword = await bcrypt.hash(newPassword, 10);
      }

      // 更新密码
      const result = await app.mysql.update('judge', {
        judge_password: hashedNewPassword,
        updated_at: new Date()
      }, {
        where: { judge_id: judgeId }
      });

      return result.affectedRows > 0 
        ? { success: true, message: '密码修改成功' }
        : { success: false, message: '密码修改失败' };

    } catch (error) {
      this.logger.error('修改密码失败:', error);
      return { success: false, message: '系统错误' };
    }
  }

  /**
   * 验证密码
   * @param {string} inputPassword - 输入的密码
   * @param {string} storedPassword - 存储的密码
   * @returns {boolean} 验证结果
   */
  async verifyPassword(inputPassword, storedPassword) {
    // 如果存储的密码是明文（兼容现有数据），直接比较
    if (inputPassword === storedPassword) {
      return true;
    }

    // 如果是加密密码，使用bcrypt验证
    try {
      return await bcrypt.compare(inputPassword, storedPassword);
    } catch (error) {
      return false;
    }
  }

  // ==================== 赛事管理 ====================

  /**
   * 获取分配给裁判员的比赛项目
   * @param {number} judgeId - 裁判员ID
   * @param {object} filters - 过滤条件
   * @returns {array} 比赛项目列表
   */
  async getAssignedEvents(judgeId, filters = {}) {
    const { app } = this;

    let whereConditions = ['je.judge_id = ?'];
    let params = [judgeId];

    // 状态过滤
    if (filters.status) {
      whereConditions.push('je.status = ?');
      params.push(filters.status);
    }

    // 日期过滤
    if (filters.date) {
      whereConditions.push('c.schedule_date = ?');
      params.push(filters.date);
    }

    // 项目类型过滤
    if (filters.projectType) {
      whereConditions.push('c.schedule_itemid = ?');
      params.push(filters.projectType);
    }

    const sql = `
      SELECT
        je.id as assignment_id,
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
      LEFT JOIN plog p ON c.schedule_id = p.plog_scheduleid
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY je.id
      ORDER BY c.schedule_date ASC, c.schedule_starttime ASC
    `;

    return await app.mysql.query(sql, params);
  }

  /**
   * 检查裁判员是否有权限操作指定比赛项目
   * @param {number} judgeId - 裁判员ID
   * @param {number} scheduleId - 比赛项目ID
   * @returns {boolean} 权限检查结果
   */
  async checkEventPermission(judgeId, scheduleId) {
    const { app } = this;

    const sql = `
      SELECT COUNT(*) as count
      FROM judge_events
      WHERE judge_id = ? AND schedule_id = ? AND status IN (1, 2)
    `;

    const result = await app.mysql.query(sql, [judgeId, scheduleId]);
    return result[0].count > 0;
  }

  /**
   * 获取比赛项目的参赛选手名单
   * @param {number} scheduleId - 比赛项目ID
   * @returns {array} 参赛选手列表
   */
  async getEventParticipants(scheduleId) {
    const { app } = this;

    const sql = `
      SELECT
        p.player_id,
        p.player_name,
        p.player_number,
        p.player_sex,
        p.player_class,
        r.registration_id,
        r.registration_status,
        r.registration_time,
        COALESCE(pl.plog_score, 0) as current_score,
        pl.plog_id as score_id
      FROM registration r
      JOIN player p ON r.player_id = p.player_id
      LEFT JOIN plog pl ON r.player_id = pl.plog_playerid AND r.schedule_id = pl.plog_scheduleid
      WHERE r.schedule_id = ? AND r.registration_status IN (1, 2)
      ORDER BY p.player_number ASC
    `;

    return await app.mysql.query(sql, [scheduleId]);
  }

  // ==================== 成绩管理 ====================

  /**
   * 录入比赛成绩
   * @param {object} scoreData - 成绩数据
   * @returns {object} 录入结果
   */
  async createScore(scoreData) {
    const { app } = this;
    const { player_id, schedule_id, score, judge_id, notes } = scoreData;

    try {
      // 检查是否已存在成绩记录
      const existingScore = await app.mysql.get('plog', {
        plog_playerid: player_id,
        plog_scheduleid: schedule_id
      });

      if (existingScore) {
        return { success: false, message: '该运动员在此项目中已有成绩记录' };
      }

      // 验证运动员是否已报名此项目
      const registration = await app.mysql.get('registration', {
        player_id: player_id,
        schedule_id: schedule_id,
        registration_status: [1, 2] // 已报名或已确认
      });

      if (!registration) {
        return { success: false, message: '该运动员未报名此项目' };
      }

      // 插入成绩记录
      const result = await app.mysql.insert('plog', {
        plog_playerid: player_id,
        plog_scheduleid: schedule_id,
        plog_score: score,
        plog_judgeid: judge_id,
        plog_adminid: judge_id // 兼容原有字段
      });

      return {
        success: true,
        message: '成绩录入成功',
        data: { plog_id: result.insertId }
      };

    } catch (error) {
      this.logger.error('录入成绩失败:', error);
      return { success: false, message: '录入失败：系统错误' };
    }
  }

  /**
   * 更新比赛成绩
   * @param {number} scoreId - 成绩ID
   * @param {number} judgeId - 裁判员ID
   * @param {object} updateData - 更新数据
   * @returns {object} 更新结果
   */
  async updateScore(scoreId, judgeId, updateData) {
    const { app } = this;

    try {
      // 检查成绩记录是否存在且属于该裁判员
      const existingScore = await app.mysql.get('plog', { plog_id: scoreId });

      if (!existingScore) {
        return { success: false, message: '成绩记录不存在' };
      }

      // 验证权限：只能修改自己录入的成绩
      if (existingScore.plog_judgeid !== judgeId && existingScore.plog_adminid !== judgeId) {
        return { success: false, message: '您只能修改自己录入的成绩' };
      }

      // 更新成绩
      const result = await app.mysql.update('plog', {
        plog_score: updateData.score,
        plog_judgeid: judgeId // 确保记录更新者
      }, {
        where: { plog_id: scoreId }
      });

      return result.affectedRows > 0
        ? { success: true, message: '成绩更新成功' }
        : { success: false, message: '更新失败' };

    } catch (error) {
      this.logger.error('更新成绩失败:', error);
      return { success: false, message: '更新失败：系统错误' };
    }
  }

  /**
   * 获取比赛项目的成绩列表
   * @param {number} scheduleId - 比赛项目ID
   * @returns {array} 成绩列表
   */
  async getEventScores(scheduleId) {
    const { app } = this;

    const sql = `
      SELECT
        p.plog_id,
        p.plog_score,
        p.plog_playerid,
        p.plog_scheduleid,
        p.plog_judgeid,
        pl.player_name,
        pl.player_number,
        pl.player_sex,
        pl.player_class,
        j.judge_name,
        c.schedule_name
      FROM plog p
      JOIN player pl ON p.plog_playerid = pl.player_id
      JOIN competition c ON p.plog_scheduleid = c.schedule_id
      LEFT JOIN judge j ON p.plog_judgeid = j.judge_id
      WHERE p.plog_scheduleid = ?
      ORDER BY p.plog_score DESC
    `;

    return await app.mysql.query(sql, [scheduleId]);
  }

  /**
   * 删除成绩记录
   * @param {number} scoreId - 成绩ID
   * @param {number} judgeId - 裁判员ID
   * @returns {object} 删除结果
   */
  async deleteScore(scoreId, judgeId) {
    const { app } = this;

    try {
      // 检查成绩记录是否存在且属于该裁判员
      const existingScore = await app.mysql.get('plog', { plog_id: scoreId });

      if (!existingScore) {
        return { success: false, message: '成绩记录不存在' };
      }

      // 验证权限：只能删除自己录入的成绩
      if (existingScore.plog_judgeid !== judgeId && existingScore.plog_adminid !== judgeId) {
        return { success: false, message: '您只能删除自己录入的成绩' };
      }

      // 删除成绩记录
      const result = await app.mysql.delete('plog', { plog_id: scoreId });

      return result.affectedRows > 0
        ? { success: true, message: '成绩删除成功' }
        : { success: false, message: '删除失败' };

    } catch (error) {
      this.logger.error('删除成绩失败:', error);
      return { success: false, message: '删除失败：系统错误' };
    }
  }
}

module.exports = JudgeService;

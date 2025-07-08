'use strict';
const Service = require('egg').Service;

class PlayerService extends Service {
  async index(query) {
    const { app } = this;
    query.playerName = query.playerName || '';
    const sql = `select * from player where player_name like '%${query.playerName}%'`;
    return await app.mysql.query(sql);
  }

  async create(data) {
    const { app } = this;
    const {
      playerName,
      playerSex,
      playerBirthday,
      playerClass,
      playerStudentid,
      playerNumber,
    } = data;
    const allDatas = await app.mysql.select('player');
    const idx = allDatas.findIndex(item => {
      return item.player_number === playerNumber;
    });
    if (idx !== -1) {
      return false;
    }
    await app.mysql.insert('player', {
      player_name: playerName,
      player_sex: playerSex,
      player_birthday: playerBirthday,
      player_class: playerClass,
      player_studentid: playerStudentid,
      player_number: playerNumber,
    });
    return true;
  }

  async update(data) {
    const { app } = this;
    const {
      playerId,
      playerName,
      playerSex,
      playerBirthday,
      playerClass,
      playerStudentid,
      playerNumber,
    } = data;
    await app.mysql.update(
      'player',
      {
        player_id: playerId,
        player_name: playerName,
        player_sex: playerSex,
        player_birthday: playerBirthday,
        player_class: playerClass,
        player_studentid: playerStudentid,
        player_number: playerNumber,
      },
      {
        where: {
          player_id: playerId,
        },
      }
    );
  }

  async destory(id) {
    const { app } = this;
    await app.mysql.delete('plog', {
      plog_playerid: id,
    });
    await app.mysql.delete('player', {
      player_id: id,
    });
  }

  // ==================== 运动员自助功能 ====================

  /**
   * 获取运动员个人信息
   * @param {number} playerId - 运动员ID
   * @returns {object} 运动员信息
   */
  async getProfile(playerId) {
    const { app } = this;

    const sql = `
      SELECT
        player_id,
        player_name,
        player_sex,
        player_birthday,
        player_class,
        player_studentid,
        player_number,
        player_username,
        player_status,
        created_at,
        updated_at
      FROM player
      WHERE player_id = ?
    `;

    const result = await app.mysql.query(sql, [playerId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 验证个人信息更新数据
   * @param {object} updateData - 更新数据
   * @returns {object} 验证结果
   */
  async validateProfileUpdate(updateData) {
    const { app } = this;

    // 允许更新的字段
    const allowedFields = ['player_name', 'player_sex', 'player_birthday'];
    const updateFields = Object.keys(updateData);

    // 检查是否包含不允许更新的字段
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return {
        valid: false,
        message: `不允许更新以下字段: ${invalidFields.join(', ')}`
      };
    }

    // 验证姓名
    if (updateData.player_name && updateData.player_name.trim().length === 0) {
      return {
        valid: false,
        message: '姓名不能为空'
      };
    }

    // 验证性别
    if (updateData.player_sex && !['男', '女'].includes(updateData.player_sex)) {
      return {
        valid: false,
        message: '性别只能是男或女'
      };
    }

    // 验证生日格式
    if (updateData.player_birthday) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(updateData.player_birthday)) {
        return {
          valid: false,
          message: '生日格式不正确，应为YYYY-MM-DD'
        };
      }
    }

    return { valid: true };
  }

  /**
   * 更新运动员个人信息
   * @param {number} playerId - 运动员ID
   * @param {object} updateData - 更新数据
   * @returns {object} 更新结果
   */
  async updateProfile(playerId, updateData) {
    const { app } = this;

    try {
      // 构建更新数据
      const updateFields = {};
      if (updateData.player_name) updateFields.player_name = updateData.player_name.trim();
      if (updateData.player_sex) updateFields.player_sex = updateData.player_sex;
      if (updateData.player_birthday) updateFields.player_birthday = updateData.player_birthday;

      // 添加更新时间
      updateFields.updated_at = new Date();

      // 执行更新
      await app.mysql.update('player', updateFields, {
        where: { player_id: playerId }
      });

      // 获取更新后的数据
      const updatedProfile = await this.getProfile(playerId);

      return {
        success: true,
        data: updatedProfile
      };

    } catch (error) {
      this.logger.error('更新运动员信息失败:', error);
      return {
        success: false,
        message: '更新失败，请稍后重试'
      };
    }
  }

  /**
   * 获取运动员统计信息
   * @param {number} playerId - 运动员ID
   * @returns {object} 统计信息
   */
  async getPlayerStats(playerId) {
    const { app } = this;

    // 获取报名统计
    const registrationSql = `
      SELECT
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN registration_status = 1 THEN 1 END) as pending_count,
        COUNT(CASE WHEN registration_status = 2 THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN registration_status = 3 THEN 1 END) as cancelled_count
      FROM registration
      WHERE player_id = ?
    `;

    // 获取成绩统计
    const scoreSql = `
      SELECT
        COUNT(*) as total_scores,
        AVG(plog_score) as avg_score,
        MAX(plog_score) as best_score,
        MIN(plog_score) as worst_score
      FROM plog
      WHERE plog_playerid = ?
    `;

    // 获取最近的比赛记录
    const recentSql = `
      SELECT
        c.schedule_name,
        c.schedule_date,
        p.plog_score
      FROM plog p
      JOIN competition c ON p.plog_scheduleid = c.schedule_id
      WHERE p.plog_playerid = ?
      ORDER BY c.schedule_date DESC
      LIMIT 5
    `;

    const [registrationStats, scoreStats, recentScores] = await Promise.all([
      app.mysql.query(registrationSql, [playerId]),
      app.mysql.query(scoreSql, [playerId]),
      app.mysql.query(recentSql, [playerId])
    ]);

    return {
      registration: registrationStats[0] || {
        total_registrations: 0,
        pending_count: 0,
        confirmed_count: 0,
        cancelled_count: 0
      },
      scores: scoreStats[0] || {
        total_scores: 0,
        avg_score: 0,
        best_score: 0,
        worst_score: 0
      },
      recentScores: recentScores || []
    };
  }

  /**
   * 修改密码
   * @param {number} playerId - 运动员ID
   * @param {string} oldPassword - 原密码
   * @param {string} newPassword - 新密码
   * @returns {object} 修改结果
   */
  async changePassword(playerId, oldPassword, newPassword) {
    const { app } = this;

    try {
      // 验证原密码
      const player = await app.mysql.get('player', { player_id: playerId });
      if (!player) {
        return {
          success: false,
          message: '运动员不存在'
        };
      }

      if (player.player_password !== oldPassword) {
        return {
          success: false,
          message: '原密码错误'
        };
      }

      // 更新密码
      await app.mysql.update('player', {
        player_password: newPassword,
        updated_at: new Date()
      }, {
        where: { player_id: playerId }
      });

      return {
        success: true,
        message: '密码修改成功'
      };

    } catch (error) {
      this.logger.error('修改密码失败:', error);
      return {
        success: false,
        message: '修改失败，请稍后重试'
      };
    }
  }

  /**
   * 获取运动员个人成绩
   * @param {number} playerId - 运动员ID
   * @param {object} filters - 筛选条件
   * @returns {array} 成绩列表
   */
  async getPlayerScores(playerId, filters = {}) {
    const { app } = this;

    let sql = `
      SELECT
        p.plog_id,
        p.plog_score,
        c.schedule_id,
        c.schedule_name,
        c.schedule_itemid,
        c.schedule_date,
        c.schedule_starttime,
        c.schedule_endtime,
        a.admin_name as judge_name,
        (
          SELECT COUNT(*) + 1
          FROM plog p2
          WHERE p2.plog_scheduleid = p.plog_scheduleid
          AND p2.plog_score > p.plog_score
        ) as ranking
      FROM plog p
      JOIN competition c ON p.plog_scheduleid = c.schedule_id
      LEFT JOIN admin a ON p.plog_adminid = a.admin_id
      WHERE p.plog_playerid = ?
    `;

    const params = [playerId];

    // 添加筛选条件
    if (filters.scheduleId) {
      sql += ' AND c.schedule_id = ?';
      params.push(filters.scheduleId);
    }

    if (filters.startDate) {
      sql += ' AND c.schedule_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND c.schedule_date <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY c.schedule_date DESC, c.schedule_starttime DESC';

    return await app.mysql.query(sql, params);
  }
}

module.exports = PlayerService;

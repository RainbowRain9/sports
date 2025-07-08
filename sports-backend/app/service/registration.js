'use strict';

const Service = require('egg').Service;

/**
 * 报名管理服务
 */
class RegistrationService extends Service {
  
  /**
   * 获取可报名项目列表
   * @param {number} playerId - 运动员ID
   * @returns {array} 可报名项目列表
   */
  async getAvailableEvents(playerId) {
    const { app } = this;
    
    const sql = `
      SELECT 
        c.schedule_id,
        c.schedule_itemid,
        c.schedule_itemid,
        c.schedule_name,
        c.schedule_date,
        c.schedule_starttime,
        c.schedule_endtime,
        c.schedule_introduction,
        c.registration_start_time,
        c.registration_end_time,
        c.max_participants,
        c.registration_status,
        c.registration_note,
        COALESCE(rs.total_registrations, 0) as current_participants,
        COALESCE(rs.available_slots, c.max_participants) as available_slots,
        CASE 
          WHEN r.registration_id IS NOT NULL THEN 1 
          ELSE 0 
        END as is_registered
      FROM competition c
      LEFT JOIN v_registration_stats rs ON c.schedule_id = rs.schedule_id
      LEFT JOIN registration r ON c.schedule_id = r.schedule_id 
        AND r.player_id = ? 
        AND r.registration_status IN (1, 2)
      WHERE c.registration_status = 1
        AND (c.registration_end_time IS NULL OR c.registration_end_time > NOW())
        AND (c.registration_start_time IS NULL OR c.registration_start_time <= NOW())
      ORDER BY c.schedule_date ASC, c.schedule_starttime ASC
    `;
    
    return await app.mysql.query(sql, [playerId]);
  }
  
  /**
   * 检查报名限制
   * @param {number} playerId - 运动员ID
   * @param {number} scheduleId - 项目ID
   * @returns {object} 检查结果
   */
  async checkRegistrationLimits(playerId, scheduleId) {
    const { app } = this;
    
    try {
      // 使用事务确保在同一个连接中执行
      const conn = await app.mysql.beginTransaction();

      try {
        // 调用存储过程检查限制
        const sql = 'CALL CheckRegistrationLimits(?, ?, @can_register, @error_message)';
        await conn.query(sql, [playerId, scheduleId]);

        // 获取结果
        const result = await conn.query('SELECT @can_register as can_register, @error_message as error_message');
        const checkResult = result[0];

        await conn.commit();

        return {
          canRegister: checkResult.can_register === 1,
          errorMessage: checkResult.error_message || ''
        };
      } catch (error) {
        await conn.rollback();
        throw error;
      }
      
    } catch (error) {
      this.logger.error('检查报名限制失败:', error);
      return {
        canRegister: false,
        errorMessage: '系统错误，请稍后重试'
      };
    }
  }
  
  /**
   * 创建报名
   * @param {number} playerId - 运动员ID
   * @param {number} scheduleId - 项目ID
   * @returns {object} 创建结果
   */
  async createRegistration(playerId, scheduleId) {
    const { app } = this;
    
    try {
      // 再次检查限制（防止并发问题）
      const limitCheck = await this.checkRegistrationLimits(playerId, scheduleId);
      if (!limitCheck.canRegister) {
        return {
          success: false,
          message: limitCheck.errorMessage
        };
      }
      
      // 创建报名记录
      const registrationData = {
        player_id: playerId,
        schedule_id: scheduleId,
        registration_status: 1, // 已报名
        registration_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await app.mysql.insert('registration', registrationData);
      
      return {
        success: true,
        data: {
          registrationId: result.insertId,
          ...registrationData
        }
      };
      
    } catch (error) {
      this.logger.error('创建报名失败:', error);

      // 检查是否是重复报名错误
      if (error.code === 'ER_DUP_ENTRY') {
        // 检查现有记录的状态
        const existingRecord = await app.mysql.get('registration', {
          player_id: playerId,
          schedule_id: scheduleId
        });

        if (existingRecord && existingRecord.registration_status === 3) {
          // 如果是已取消的记录，更新为重新报名
          const updateResult = await app.mysql.update('registration', {
            registration_status: 1,
            registration_time: new Date(),
            confirmation_time: null,
            cancel_time: null,
            cancel_reason: null,
            updated_at: new Date()
          }, {
            where: {
              registration_id: existingRecord.registration_id
            }
          });

          return {
            success: true,
            data: {
              registrationId: existingRecord.registration_id,
              player_id: playerId,
              schedule_id: scheduleId,
              registration_status: 1,
              registration_time: new Date()
            }
          };
        } else {
          return {
            success: false,
            message: '您已经报名了该项目'
          };
        }
      }

      return {
        success: false,
        message: '报名失败，请稍后重试'
      };
    }
  }
  
  /**
   * 获取运动员报名列表
   * @param {number} playerId - 运动员ID
   * @param {string} status - 状态筛选
   * @returns {array} 报名列表
   */
  async getPlayerRegistrations(playerId, status = null) {
    const { app } = this;
    
    let sql = `
      SELECT 
        r.registration_id,
        r.registration_status,
        r.registration_time,
        r.confirmation_time,
        r.cancel_time,
        r.cancel_reason,
        r.admin_note,
        c.schedule_id,
        c.schedule_itemid,
        c.schedule_itemid,
        c.schedule_name,
        c.schedule_date,
        c.schedule_starttime,
        c.schedule_endtime,
        c.schedule_introduction,
        CASE r.registration_status
          WHEN 1 THEN '已报名'
          WHEN 2 THEN '已确认'
          WHEN 3 THEN '已取消'
          WHEN 4 THEN '已拒绝'
          ELSE '未知状态'
        END as status_text
      FROM registration r
      JOIN competition c ON r.schedule_id = c.schedule_id
      WHERE r.player_id = ?
    `;
    
    const params = [playerId];
    
    if (status) {
      sql += ' AND r.registration_status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY r.registration_time DESC';
    
    return await app.mysql.query(sql, params);
  }
  
  /**
   * 根据ID获取报名记录
   * @param {number} registrationId - 报名ID
   * @returns {object} 报名记录
   */
  async getRegistrationById(registrationId) {
    const { app } = this;
    
    return await app.mysql.get('registration', { registration_id: registrationId });
  }
  
  /**
   * 取消报名
   * @param {number} registrationId - 报名ID
   * @param {string} reason - 取消原因
   * @returns {object} 取消结果
   */
  async cancelRegistration(registrationId, reason = '') {
    const { app } = this;
    
    try {
      // 检查报名状态
      const registration = await this.getRegistrationById(registrationId);
      if (!registration) {
        return {
          success: false,
          message: '报名记录不存在'
        };
      }
      
      if (registration.registration_status === 3) {
        return {
          success: false,
          message: '报名已经取消'
        };
      }
      
      if (registration.registration_status === 4) {
        return {
          success: false,
          message: '报名已被拒绝，无法取消'
        };
      }
      
      // 更新报名状态
      await app.mysql.update('registration', {
        registration_status: 3, // 已取消
        cancel_time: new Date(),
        cancel_reason: reason,
        updated_at: new Date()
      }, {
        where: { registration_id: registrationId }
      });
      
      return {
        success: true,
        message: '取消报名成功'
      };
      
    } catch (error) {
      this.logger.error('取消报名失败:', error);
      return {
        success: false,
        message: '取消失败，请稍后重试'
      };
    }
  }
  
  /**
   * 获取报名统计信息
   * @param {number} playerId - 运动员ID
   * @returns {object} 统计信息
   */
  async getRegistrationStats(playerId) {
    const { app } = this;
    
    const sql = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN registration_status = 1 THEN 1 END) as pending_count,
        COUNT(CASE WHEN registration_status = 2 THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN registration_status = 3 THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN registration_status = 4 THEN 1 END) as rejected_count,
        (3 - COUNT(CASE WHEN registration_status IN (1,2) THEN 1 END)) as remaining_slots
      FROM registration 
      WHERE player_id = ?
    `;
    
    const result = await app.mysql.query(sql, [playerId]);
    return result[0] || {
      total_registrations: 0,
      pending_count: 0,
      confirmed_count: 0,
      cancelled_count: 0,
      rejected_count: 0,
      remaining_slots: 3
    };
  }
}

module.exports = RegistrationService;

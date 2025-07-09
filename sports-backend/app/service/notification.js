'use strict';

const Service = require('egg').Service;

/**
 * 通知服务
 * 处理系统通知和邮件通知
 */
class NotificationService extends Service {
  
  /**
   * 发送报名审核通知
   * @param {object} params - 通知参数
   */
  async sendRegistrationReviewNotification(params) {
    const { registrationId, action, adminId, note } = params;
    
    try {
      // 获取报名详细信息
      const registrationInfo = await this._getRegistrationInfo(registrationId);
      
      if (!registrationInfo) {
        this.logger.error('报名信息不存在:', registrationId);
        return;
      }
      
      // 发送系统内通知
      await this._sendSystemNotification({
        ...registrationInfo,
        action,
        adminId,
        note
      });
      
      // 发送邮件通知（如果配置了邮件服务）
      if (this.config.email && this.config.email.enabled) {
        await this._sendEmailNotification({
          ...registrationInfo,
          action,
          adminId,
          note
        });
      }
      
      // 发送短信通知（如果配置了短信服务）
      if (this.config.sms && this.config.sms.enabled) {
        await this._sendSmsNotification({
          ...registrationInfo,
          action,
          adminId,
          note
        });
      }
      
    } catch (error) {
      this.logger.error('发送报名审核通知失败:', error);
      // 通知发送失败不应该影响主要业务流程
    }
  }
  
  /**
   * 获取报名详细信息
   * @param {number} registrationId - 报名ID
   * @returns {object} 报名信息
   */
  async _getRegistrationInfo(registrationId) {
    const { app } = this;
    
    try {
      const sql = `
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
          p.player_email,
          p.player_phone,
          c.schedule_id,
          c.schedule_name,
          c.schedule_date,
          c.schedule_starttime,
          c.schedule_endtime,
          a.admin_name as reviewer_name
        FROM registration r
        JOIN player p ON r.player_id = p.player_id
        JOIN competition c ON r.schedule_id = c.schedule_id
        LEFT JOIN admin a ON r.admin_id = a.admin_id
        WHERE r.registration_id = ?
      `;
      
      const result = await app.mysql.query(sql, [registrationId]);
      return result[0] || null;
      
    } catch (error) {
      this.logger.error('获取报名信息失败:', error);
      return null;
    }
  }
  
  /**
   * 发送系统内通知
   * @param {object} params - 通知参数
   */
  async _sendSystemNotification(params) {
    const { app } = this;
    const { 
      registration_id, 
      player_id, 
      player_name, 
      schedule_name, 
      action, 
      note,
      reviewer_name 
    } = params;
    
    try {
      // 构建通知内容
      const actionText = this._getActionText(action);
      const title = `报名审核${actionText}`;
      let content = `您报名的项目"${schedule_name}"已被${actionText}`;
      
      if (reviewer_name) {
        content += `，审核人：${reviewer_name}`;
      }
      
      if (note) {
        content += `，审核备注：${note}`;
      }
      
      // 保存系统通知
      const notificationData = {
        user_id: player_id,
        user_type: 'player',
        title,
        content,
        type: 'registration_review',
        related_id: registration_id,
        status: 0, // 0-未读，1-已读
        created_at: new Date()
      };
      
      await app.mysql.insert('system_notification', notificationData);
      
      // 发送实时通知（WebSocket）
      await this._sendRealtimeNotification(player_id, {
        type: 'registration_review',
        title,
        content,
        data: {
          registration_id,
          action,
          schedule_name
        }
      });
      
    } catch (error) {
      this.logger.error('发送系统内通知失败:', error);
    }
  }
  
  /**
   * 发送邮件通知
   * @param {object} params - 通知参数
   */
  async _sendEmailNotification(params) {
    const { 
      player_name, 
      player_email, 
      schedule_name, 
      schedule_date,
      schedule_starttime,
      action, 
      note,
      reviewer_name 
    } = params;
    
    if (!player_email) {
      this.logger.warn('运动员邮箱为空，跳过邮件通知');
      return;
    }
    
    try {
      const actionText = this._getActionText(action);
      const subject = `【体育赛事管理系统】报名审核${actionText}通知`;
      
      let htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">体育赛事管理系统</h2>
            <p style="margin: 10px 0 0 0;">报名审核${actionText}通知</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <p>亲爱的 <strong>${player_name}</strong> 同学：</p>
            
            <p>您好！您的报名申请已经审核完成，详情如下：</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>比赛项目：</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${schedule_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>比赛日期：</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${schedule_date} ${schedule_starttime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>审核结果：</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span style="color: ${action === 'approve' ? '#28a745' : '#dc3545'}; font-weight: bold;">
                      ${actionText}
                    </span>
                  </td>
                </tr>
      `;
      
      if (reviewer_name) {
        htmlContent += `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>审核人：</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${reviewer_name}</td>
                </tr>
        `;
      }
      
      if (note) {
        htmlContent += `
                <tr>
                  <td style="padding: 8px 0;"><strong>审核备注：</strong></td>
                  <td style="padding: 8px 0;">${note}</td>
                </tr>
        `;
      }
      
      htmlContent += `
              </table>
            </div>
            
            ${action === 'approve' ? 
              '<p style="color: #28a745;">🎉 恭喜您！请按时参加比赛，祝您取得好成绩！</p>' :
              '<p style="color: #dc3545;">😔 很遗憾，您的报名未通过审核。如有疑问，请联系管理员。</p>'
            }
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
              <p>此邮件由系统自动发送，请勿回复。</p>
              <p>如有问题，请登录系统查看详情或联系管理员。</p>
            </div>
          </div>
        </div>
      `;
      
      // 发送邮件
      await this.ctx.service.email.send({
        to: player_email,
        subject,
        html: htmlContent
      });
      
    } catch (error) {
      this.logger.error('发送邮件通知失败:', error);
    }
  }
  
  /**
   * 发送短信通知
   * @param {object} params - 通知参数
   */
  async _sendSmsNotification(params) {
    const { 
      player_name, 
      player_phone, 
      schedule_name, 
      action 
    } = params;
    
    if (!player_phone) {
      this.logger.warn('运动员手机号为空，跳过短信通知');
      return;
    }
    
    try {
      const actionText = this._getActionText(action);
      const message = `【体育赛事】${player_name}同学，您报名的"${schedule_name}"项目审核${actionText}。请登录系统查看详情。`;
      
      // 发送短信
      await this.ctx.service.sms.send({
        phone: player_phone,
        message
      });
      
    } catch (error) {
      this.logger.error('发送短信通知失败:', error);
    }
  }
  
  /**
   * 发送实时通知
   * @param {number} userId - 用户ID
   * @param {object} notification - 通知内容
   */
  async _sendRealtimeNotification(userId, notification) {
    try {
      // 这里应该集成WebSocket或Server-Sent Events
      // 暂时记录日志，实际项目中需要实现实时推送
      this.logger.info('发送实时通知:', { userId, notification });
      
      // 示例：使用Socket.IO发送实时通知
      // if (this.app.io) {
      //   this.app.io.to(`user_${userId}`).emit('notification', notification);
      // }
      
    } catch (error) {
      this.logger.error('发送实时通知失败:', error);
    }
  }
  
  /**
   * 获取操作文本
   * @param {string} action - 操作类型
   * @returns {string} 操作文本
   */
  _getActionText(action) {
    const actionMap = {
      'approve': '通过',
      'reject': '拒绝',
      'cancel': '取消'
    };
    return actionMap[action] || '处理';
  }
  
  /**
   * 批量发送通知
   * @param {array} notifications - 通知列表
   */
  async batchSendNotifications(notifications) {
    const promises = notifications.map(notification => 
      this.sendRegistrationReviewNotification(notification)
    );
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error('批量发送通知失败:', error);
    }
  }
}

module.exports = NotificationService;

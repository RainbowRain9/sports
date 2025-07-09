'use strict';

const Service = require('egg').Service;
const nodemailer = require('nodemailer');

/**
 * 邮件服务
 * 处理邮件发送功能
 */
class EmailService extends Service {
  
  constructor(ctx) {
    super(ctx);
    this.transporter = null;
    this.initTransporter();
  }
  
  /**
   * 初始化邮件传输器
   */
  initTransporter() {
    const emailConfig = this.config.email || {};
    
    if (!emailConfig.enabled) {
      this.logger.info('邮件服务未启用');
      return;
    }
    
    try {
      this.transporter = nodemailer.createTransporter({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure, // true for 465, false for other ports
        auth: {
          user: emailConfig.smtp.user,
          pass: emailConfig.smtp.pass
        },
        pool: true, // 使用连接池
        maxConnections: 5,
        maxMessages: 100
      });
      
      // 验证连接
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('邮件服务连接失败:', error);
        } else {
          this.logger.info('邮件服务连接成功');
        }
      });
      
    } catch (error) {
      this.logger.error('初始化邮件传输器失败:', error);
    }
  }
  
  /**
   * 发送邮件
   * @param {object} options - 邮件选项
   * @returns {object} 发送结果
   */
  async send(options) {
    const { to, subject, text, html, attachments } = options;
    
    if (!this.transporter) {
      this.logger.warn('邮件传输器未初始化，跳过发送');
      return {
        success: false,
        message: '邮件服务未配置'
      };
    }
    
    try {
      // 记录发送日志
      const logId = await this._logEmailSend({
        to_email: to,
        subject,
        content: html || text,
        content_type: html ? 'html' : 'text',
        status: 0 // 待发送
      });
      
      const emailConfig = this.config.email;
      const mailOptions = {
        from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
        to,
        subject,
        text,
        html,
        attachments
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      // 更新发送成功日志
      await this._updateEmailLog(logId, {
        status: 1,
        send_time: new Date(),
        message_id: info.messageId
      });
      
      this.logger.info('邮件发送成功:', { to, subject, messageId: info.messageId });
      
      return {
        success: true,
        messageId: info.messageId,
        logId
      };
      
    } catch (error) {
      this.logger.error('邮件发送失败:', error);
      
      // 更新发送失败日志
      if (logId) {
        await this._updateEmailLog(logId, {
          status: 2,
          error_message: error.message
        });
      }
      
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * 批量发送邮件
   * @param {array} emailList - 邮件列表
   * @returns {object} 发送结果
   */
  async batchSend(emailList) {
    const results = {
      total: emailList.length,
      success: 0,
      failed: 0,
      details: []
    };
    
    for (const email of emailList) {
      try {
        const result = await this.send(email);
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
        }
        results.details.push({
          to: email.to,
          success: result.success,
          message: result.message || 'OK',
          messageId: result.messageId
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          to: email.to,
          success: false,
          message: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * 使用模板发送邮件
   * @param {object} options - 发送选项
   * @returns {object} 发送结果
   */
  async sendWithTemplate(options) {
    const { to, templateCode, templateData, attachments } = options;
    
    try {
      // 获取邮件模板
      const template = await this._getEmailTemplate(templateCode);
      
      if (!template) {
        return {
          success: false,
          message: '邮件模板不存在'
        };
      }
      
      // 渲染模板
      const subject = this._renderTemplate(template.title_template, templateData);
      const html = this._renderTemplate(template.content_template, templateData);
      
      // 发送邮件
      return await this.send({
        to,
        subject,
        html,
        attachments
      });
      
    } catch (error) {
      this.logger.error('使用模板发送邮件失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * 获取邮件模板
   * @param {string} templateCode - 模板代码
   * @returns {object} 模板信息
   */
  async _getEmailTemplate(templateCode) {
    const { app } = this;
    
    try {
      const template = await app.mysql.get('notification_template', {
        template_code: templateCode,
        template_type: 'email',
        status: 1
      });
      
      return template;
      
    } catch (error) {
      this.logger.error('获取邮件模板失败:', error);
      return null;
    }
  }
  
  /**
   * 渲染模板
   * @param {string} template - 模板内容
   * @param {object} data - 数据
   * @returns {string} 渲染结果
   */
  _renderTemplate(template, data) {
    if (!template) return '';
    
    let result = template;
    
    // 简单的模板渲染，实际项目中可以使用更强大的模板引擎
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    // 处理条件渲染 {{#key}}content{{/key}}
    result = result.replace(/{{#(\w+)}}(.*?){{\/\1}}/g, (match, key, content) => {
      return data[key] ? content : '';
    });
    
    return result;
  }
  
  /**
   * 记录邮件发送日志
   * @param {object} logData - 日志数据
   * @returns {number} 日志ID
   */
  async _logEmailSend(logData) {
    const { app } = this;
    
    try {
      const result = await app.mysql.insert('email_log', {
        ...logData,
        created_at: new Date()
      });
      
      return result.insertId;
      
    } catch (error) {
      this.logger.error('记录邮件发送日志失败:', error);
      return null;
    }
  }
  
  /**
   * 更新邮件发送日志
   * @param {number} logId - 日志ID
   * @param {object} updateData - 更新数据
   */
  async _updateEmailLog(logId, updateData) {
    const { app } = this;
    
    if (!logId) return;
    
    try {
      await app.mysql.update('email_log', {
        ...updateData,
        updated_at: new Date()
      }, {
        where: { log_id: logId }
      });
      
    } catch (error) {
      this.logger.error('更新邮件发送日志失败:', error);
    }
  }
  
  /**
   * 获取邮件发送统计
   * @param {object} params - 查询参数
   * @returns {object} 统计数据
   */
  async getEmailStats(params = {}) {
    const { app } = this;
    const { dateRange } = params;
    
    try {
      let whereClause = '';
      let queryParams = [];
      
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        whereClause = 'WHERE DATE(created_at) BETWEEN ? AND ?';
        queryParams = [startDate, endDate];
      }
      
      const sql = `
        SELECT 
          COUNT(*) as total_emails,
          COUNT(CASE WHEN status = 1 THEN 1 END) as success_count,
          COUNT(CASE WHEN status = 2 THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 0 THEN 1 END) as pending_count,
          ROUND(COUNT(CASE WHEN status = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
        FROM email_log
        ${whereClause}
      `;
      
      const result = await app.mysql.query(sql, queryParams);
      return result[0];
      
    } catch (error) {
      this.logger.error('获取邮件发送统计失败:', error);
      return {
        total_emails: 0,
        success_count: 0,
        failed_count: 0,
        pending_count: 0,
        success_rate: 0
      };
    }
  }
  
  /**
   * 重试失败的邮件
   * @param {number} maxRetries - 最大重试次数
   * @returns {object} 重试结果
   */
  async retryFailedEmails(maxRetries = 3) {
    const { app } = this;
    
    try {
      // 获取需要重试的邮件
      const failedEmails = await app.mysql.select('email_log', {
        where: {
          status: 2, // 发送失败
          retry_count: app.mysql.literal(`< ${maxRetries}`)
        },
        limit: 50 // 限制批量处理数量
      });
      
      const results = {
        total: failedEmails.length,
        success: 0,
        failed: 0
      };
      
      for (const email of failedEmails) {
        try {
          const result = await this.send({
            to: email.to_email,
            subject: email.subject,
            html: email.content
          });
          
          if (result.success) {
            results.success++;
          } else {
            results.failed++;
            // 增加重试次数
            await this._updateEmailLog(email.log_id, {
              retry_count: email.retry_count + 1,
              error_message: result.message
            });
          }
        } catch (error) {
          results.failed++;
          await this._updateEmailLog(email.log_id, {
            retry_count: email.retry_count + 1,
            error_message: error.message
          });
        }
      }
      
      return results;
      
    } catch (error) {
      this.logger.error('重试失败邮件失败:', error);
      return {
        total: 0,
        success: 0,
        failed: 0
      };
    }
  }
}

module.exports = EmailService;

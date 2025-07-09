-- 通知系统数据库扩展脚本
-- 用于支持系统内通知和消息推送

USE sports;

-- 1. 创建系统通知表
DROP TABLE IF EXISTS `system_notification`;
CREATE TABLE `system_notification` (
  `notification_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `user_id` int(100) NOT NULL COMMENT '用户ID',
  `user_type` varchar(20) NOT NULL COMMENT '用户类型：player/admin/judge',
  `title` varchar(200) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `type` varchar(50) NOT NULL COMMENT '通知类型：registration_review/score_update/system_notice',
  `related_id` int(100) DEFAULT NULL COMMENT '关联ID（如报名ID、成绩ID等）',
  `status` tinyint(1) DEFAULT 0 COMMENT '状态：0-未读，1-已读',
  `priority` tinyint(1) DEFAULT 1 COMMENT '优先级：1-普通，2-重要，3-紧急',
  `read_time` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`notification_id`),
  KEY `idx_user` (`user_id`, `user_type`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='系统通知表';

-- 2. 创建邮件发送记录表
DROP TABLE IF EXISTS `email_log`;
CREATE TABLE `email_log` (
  `log_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `to_email` varchar(200) NOT NULL COMMENT '收件人邮箱',
  `to_name` varchar(100) DEFAULT NULL COMMENT '收件人姓名',
  `subject` varchar(500) NOT NULL COMMENT '邮件主题',
  `content` text NOT NULL COMMENT '邮件内容',
  `content_type` varchar(20) DEFAULT 'html' COMMENT '内容类型：text/html',
  `status` tinyint(1) DEFAULT 0 COMMENT '发送状态：0-待发送，1-发送成功，2-发送失败',
  `error_message` varchar(1000) DEFAULT NULL COMMENT '错误信息',
  `send_time` timestamp NULL DEFAULT NULL COMMENT '发送时间',
  `retry_count` int(5) DEFAULT 0 COMMENT '重试次数',
  `related_type` varchar(50) DEFAULT NULL COMMENT '关联类型',
  `related_id` int(100) DEFAULT NULL COMMENT '关联ID',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`log_id`),
  KEY `idx_status` (`status`),
  KEY `idx_send_time` (`send_time`),
  KEY `idx_related` (`related_type`, `related_id`),
  KEY `idx_to_email` (`to_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='邮件发送记录表';

-- 3. 创建短信发送记录表
DROP TABLE IF EXISTS `sms_log`;
CREATE TABLE `sms_log` (
  `log_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `message` varchar(1000) NOT NULL COMMENT '短信内容',
  `status` tinyint(1) DEFAULT 0 COMMENT '发送状态：0-待发送，1-发送成功，2-发送失败',
  `error_message` varchar(1000) DEFAULT NULL COMMENT '错误信息',
  `send_time` timestamp NULL DEFAULT NULL COMMENT '发送时间',
  `retry_count` int(5) DEFAULT 0 COMMENT '重试次数',
  `related_type` varchar(50) DEFAULT NULL COMMENT '关联类型',
  `related_id` int(100) DEFAULT NULL COMMENT '关联ID',
  `provider` varchar(50) DEFAULT NULL COMMENT '短信服务商',
  `message_id` varchar(100) DEFAULT NULL COMMENT '短信ID',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`log_id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_send_time` (`send_time`),
  KEY `idx_related` (`related_type`, `related_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='短信发送记录表';

-- 4. 扩展player表，添加通知设置字段
ALTER TABLE `player` 
ADD COLUMN `player_email` varchar(100) DEFAULT NULL COMMENT '邮箱地址',
ADD COLUMN `player_phone` varchar(20) DEFAULT NULL COMMENT '手机号码',
ADD COLUMN `notification_settings` json DEFAULT NULL COMMENT '通知设置';

-- 5. 扩展admin表，添加通知设置字段
ALTER TABLE `admin` 
ADD COLUMN `admin_email` varchar(100) DEFAULT NULL COMMENT '邮箱地址',
ADD COLUMN `admin_phone` varchar(20) DEFAULT NULL COMMENT '手机号码',
ADD COLUMN `notification_settings` json DEFAULT NULL COMMENT '通知设置';

-- 6. 扩展judge表，添加通知设置字段（如果存在）
ALTER TABLE `judge` 
ADD COLUMN `notification_settings` json DEFAULT NULL COMMENT '通知设置';

-- 7. 创建通知模板表
DROP TABLE IF EXISTS `notification_template`;
CREATE TABLE `notification_template` (
  `template_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `template_code` varchar(50) NOT NULL COMMENT '模板代码',
  `template_name` varchar(200) NOT NULL COMMENT '模板名称',
  `template_type` varchar(20) NOT NULL COMMENT '模板类型：system/email/sms',
  `title_template` varchar(500) DEFAULT NULL COMMENT '标题模板',
  `content_template` text NOT NULL COMMENT '内容模板',
  `variables` json DEFAULT NULL COMMENT '变量说明',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`template_id`),
  UNIQUE KEY `uk_template_code` (`template_code`),
  KEY `idx_template_type` (`template_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='通知模板表';

-- 8. 插入默认通知模板
INSERT INTO `notification_template` (`template_code`, `template_name`, `template_type`, `title_template`, `content_template`, `variables`) VALUES
('registration_approve_system', '报名批准-系统通知', 'system', '报名审核通过', '您报名的项目"{{schedule_name}}"已被批准{{#reviewer_name}}，审核人：{{reviewer_name}}{{/reviewer_name}}{{#note}}，审核备注：{{note}}{{/note}}', '{"schedule_name":"项目名称","reviewer_name":"审核人","note":"审核备注"}'),
('registration_reject_system', '报名拒绝-系统通知', 'system', '报名审核拒绝', '您报名的项目"{{schedule_name}}"已被拒绝{{#reviewer_name}}，审核人：{{reviewer_name}}{{/reviewer_name}}{{#note}}，审核备注：{{note}}{{/note}}', '{"schedule_name":"项目名称","reviewer_name":"审核人","note":"审核备注"}'),
('registration_approve_email', '报名批准-邮件通知', 'email', '【体育赛事管理系统】报名审核通过通知', '<div>亲爱的 {{player_name}} 同学：<br><br>恭喜您！您报名的项目"{{schedule_name}}"已通过审核。<br><br>比赛时间：{{schedule_date}} {{schedule_starttime}}<br>{{#note}}审核备注：{{note}}<br>{{/note}}<br>请按时参加比赛，祝您取得好成绩！</div>', '{"player_name":"运动员姓名","schedule_name":"项目名称","schedule_date":"比赛日期","schedule_starttime":"开始时间","note":"审核备注"}'),
('registration_reject_email', '报名拒绝-邮件通知', 'email', '【体育赛事管理系统】报名审核结果通知', '<div>亲爱的 {{player_name}} 同学：<br><br>很遗憾，您报名的项目"{{schedule_name}}"未通过审核。<br><br>{{#note}}审核备注：{{note}}<br>{{/note}}<br>如有疑问，请联系管理员。</div>', '{"player_name":"运动员姓名","schedule_name":"项目名称","note":"审核备注"}'),
('registration_approve_sms', '报名批准-短信通知', 'sms', NULL, '【体育赛事】{{player_name}}同学，您报名的"{{schedule_name}}"项目审核通过。请登录系统查看详情。', '{"player_name":"运动员姓名","schedule_name":"项目名称"}'),
('registration_reject_sms', '报名拒绝-短信通知', 'sms', NULL, '【体育赛事】{{player_name}}同学，您报名的"{{schedule_name}}"项目审核未通过。请登录系统查看详情。', '{"player_name":"运动员姓名","schedule_name":"项目名称"}');

-- 9. 创建通知统计视图
CREATE OR REPLACE VIEW `v_notification_stats` AS
SELECT 
  user_type,
  type as notification_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 0 THEN 1 END) as unread_count,
  COUNT(CASE WHEN status = 1 THEN 1 END) as read_count,
  COUNT(CASE WHEN priority = 3 THEN 1 END) as urgent_count,
  DATE(created_at) as notification_date
FROM system_notification
GROUP BY user_type, type, DATE(created_at)
ORDER BY notification_date DESC;

-- 10. 创建邮件发送统计视图
CREATE OR REPLACE VIEW `v_email_stats` AS
SELECT 
  DATE(created_at) as send_date,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN status = 1 THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 2 THEN 1 END) as failed_count,
  COUNT(CASE WHEN status = 0 THEN 1 END) as pending_count,
  ROUND(COUNT(CASE WHEN status = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM email_log
GROUP BY DATE(created_at)
ORDER BY send_date DESC;

-- 11. 创建存储过程：清理过期通知
DELIMITER $$
CREATE PROCEDURE `CleanExpiredNotifications`(
  IN p_days_to_keep INT
)
BEGIN
  DECLARE v_cutoff_date DATE;
  
  -- 计算截止日期
  SET v_cutoff_date = DATE_SUB(CURDATE(), INTERVAL p_days_to_keep DAY);
  
  -- 删除过期的已读通知
  DELETE FROM system_notification 
  WHERE status = 1 AND DATE(created_at) < v_cutoff_date;
  
  -- 删除过期的邮件日志
  DELETE FROM email_log 
  WHERE status IN (1, 2) AND DATE(created_at) < v_cutoff_date;
  
  -- 删除过期的短信日志
  DELETE FROM sms_log 
  WHERE status IN (1, 2) AND DATE(created_at) < v_cutoff_date;
  
  SELECT ROW_COUNT() as deleted_records;
  
END$$
DELIMITER ;

-- 12. 创建存储过程：标记通知为已读
DELIMITER $$
CREATE PROCEDURE `MarkNotificationAsRead`(
  IN p_notification_id INT,
  IN p_user_id INT
)
BEGIN
  UPDATE system_notification 
  SET 
    status = 1,
    read_time = NOW(),
    updated_at = NOW()
  WHERE notification_id = p_notification_id 
    AND user_id = p_user_id 
    AND status = 0;
    
  SELECT ROW_COUNT() as affected_rows;
END$$
DELIMITER ;

-- 13. 更新现有用户的联系信息（示例数据）
UPDATE `player` SET 
  `player_email` = CONCAT('student', player_studentid, '@example.com'),
  `player_phone` = CONCAT('138', LPAD(player_id, 8, '0')),
  `notification_settings` = '{"email": true, "sms": true, "system": true}'
WHERE `player_email` IS NULL;

UPDATE `admin` SET 
  `admin_email` = CONCAT('admin', admin_id, '@example.com'),
  `admin_phone` = CONCAT('139', LPAD(admin_id, 8, '0')),
  `notification_settings` = '{"email": true, "sms": true, "system": true}'
WHERE `admin_email` IS NULL;

-- 14. 创建定时任务表（用于延迟发送和重试）
DROP TABLE IF EXISTS `notification_queue`;
CREATE TABLE `notification_queue` (
  `queue_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '队列ID',
  `notification_type` varchar(20) NOT NULL COMMENT '通知类型：system/email/sms',
  `recipient_id` int(100) NOT NULL COMMENT '接收者ID',
  `recipient_type` varchar(20) NOT NULL COMMENT '接收者类型',
  `template_code` varchar(50) NOT NULL COMMENT '模板代码',
  `template_data` json NOT NULL COMMENT '模板数据',
  `scheduled_time` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '计划发送时间',
  `status` tinyint(1) DEFAULT 0 COMMENT '状态：0-待发送，1-发送中，2-发送成功，3-发送失败',
  `retry_count` int(5) DEFAULT 0 COMMENT '重试次数',
  `max_retries` int(5) DEFAULT 3 COMMENT '最大重试次数',
  `error_message` varchar(1000) DEFAULT NULL COMMENT '错误信息',
  `sent_time` timestamp NULL DEFAULT NULL COMMENT '实际发送时间',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`queue_id`),
  KEY `idx_status` (`status`),
  KEY `idx_scheduled_time` (`scheduled_time`),
  KEY `idx_recipient` (`recipient_id`, `recipient_type`),
  KEY `idx_notification_type` (`notification_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='通知队列表';

-- 完成提示
SELECT 'Notification system extension completed successfully!' as message;

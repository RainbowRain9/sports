-- =============================================
-- 体育赛事管理系统完整功能扩展脚本（修复版）
-- 补充缺失的系统管理和优化功能
-- =============================================

USE sports;

-- 1. 检查并创建系统通知表（如果不存在）
CREATE TABLE IF NOT EXISTS `system_notification` (
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

-- 2. 检查并创建报名审核日志表（如果不存在）
CREATE TABLE IF NOT EXISTS `registration_review_log` (
  `log_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `registration_id` int(100) NOT NULL COMMENT '报名ID',
  `admin_id` int(100) NOT NULL COMMENT '审核管理员ID',
  `action_type` varchar(20) NOT NULL COMMENT '操作类型：approve/reject/cancel',
  `old_status` tinyint(2) NOT NULL COMMENT '原状态',
  `new_status` tinyint(2) NOT NULL COMMENT '新状态',
  `review_note` varchar(1000) DEFAULT NULL COMMENT '审核备注',
  `review_time` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '审核时间',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`log_id`),
  KEY `idx_registration_id` (`registration_id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_review_time` (`review_time`),
  KEY `idx_action_type` (`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='报名审核日志表';

-- 3. 检查并创建邮件发送记录表（如果不存在）
CREATE TABLE IF NOT EXISTS `email_log` (
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

-- 4. 检查并创建通知模板表（如果不存在）
CREATE TABLE IF NOT EXISTS `notification_template` (
  `template_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `template_code` varchar(50) NOT NULL COMMENT '模板代码',
  `template_name` varchar(200) NOT NULL COMMENT '模板名称',
  `template_type` varchar(20) NOT NULL COMMENT '模板类型：system/email/sms',
  `title_template` varchar(500) DEFAULT NULL COMMENT '标题模板',
  `content_template` text NOT NULL COMMENT '内容模板',
  `variables` text DEFAULT NULL COMMENT '变量说明',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`template_id`),
  UNIQUE KEY `uk_template_code` (`template_code`),
  KEY `idx_template_type` (`template_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='通知模板表';

-- 5. 创建系统配置表
CREATE TABLE IF NOT EXISTS `system_config` (
  `config_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text COMMENT '配置值',
  `config_type` varchar(20) DEFAULT 'string' COMMENT '配置类型：string/number/boolean/json',
  `description` varchar(500) COMMENT '配置描述',
  `is_public` tinyint(1) DEFAULT 0 COMMENT '是否公开：0-私有，1-公开',
  `updated_by` int(100) DEFAULT NULL COMMENT '更新人',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `uk_config_key` (`config_key`),
  KEY `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='系统配置表';

-- 6. 创建操作日志表
CREATE TABLE IF NOT EXISTS `operation_log` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` int(100) NOT NULL COMMENT '用户ID',
  `user_type` varchar(20) NOT NULL COMMENT '用户类型：player/admin/judge',
  `operation` varchar(50) NOT NULL COMMENT '操作类型',
  `target_type` varchar(50) DEFAULT NULL COMMENT '目标类型',
  `target_id` int(100) DEFAULT NULL COMMENT '目标ID',
  `details` text DEFAULT NULL COMMENT '操作详情',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text DEFAULT NULL COMMENT '用户代理',
  `result` varchar(20) DEFAULT 'success' COMMENT '操作结果：success/failed',
  `error_message` varchar(1000) DEFAULT NULL COMMENT '错误信息',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`log_id`),
  KEY `idx_user` (`user_id`, `user_type`),
  KEY `idx_operation` (`operation`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_result` (`result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='操作日志表';

-- 7. 安全地扩展现有表字段
-- 检查player表是否需要添加字段
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'player' 
   AND table_schema = DATABASE()
   AND column_name = 'player_email') > 0,
  'SELECT "player_email already exists" as message',
  'ALTER TABLE `player` ADD COLUMN `player_email` varchar(100) DEFAULT NULL COMMENT "邮箱地址"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'player' 
   AND table_schema = DATABASE()
   AND column_name = 'player_phone') > 0,
  'SELECT "player_phone already exists" as message',
  'ALTER TABLE `player` ADD COLUMN `player_phone` varchar(20) DEFAULT NULL COMMENT "手机号码"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'player' 
   AND table_schema = DATABASE()
   AND column_name = 'player_status') > 0,
  'SELECT "player_status already exists" as message',
  'ALTER TABLE `player` ADD COLUMN `player_status` tinyint(1) DEFAULT 1 COMMENT "状态：1-正常，0-禁用"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查admin表是否需要添加字段
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'admin' 
   AND table_schema = DATABASE()
   AND column_name = 'admin_email') > 0,
  'SELECT "admin_email already exists" as message',
  'ALTER TABLE `admin` ADD COLUMN `admin_email` varchar(100) DEFAULT NULL COMMENT "邮箱地址"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'admin' 
   AND table_schema = DATABASE()
   AND column_name = 'admin_phone') > 0,
  'SELECT "admin_phone already exists" as message',
  'ALTER TABLE `admin` ADD COLUMN `admin_phone` varchar(20) DEFAULT NULL COMMENT "手机号码"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查judge表是否需要添加字段
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'judge' 
   AND table_schema = DATABASE()
   AND column_name = 'judge_email') > 0,
  'SELECT "judge_email already exists" as message',
  'ALTER TABLE `judge` ADD COLUMN `judge_email` varchar(100) DEFAULT NULL COMMENT "邮箱地址"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'judge' 
   AND table_schema = DATABASE()
   AND column_name = 'judge_phone') > 0,
  'SELECT "judge_phone already exists" as message',
  'ALTER TABLE `judge` ADD COLUMN `judge_phone` varchar(20) DEFAULT NULL COMMENT "手机号码"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. 添加关键索引（忽略已存在的索引）
-- registration表索引
CREATE INDEX `idx_registration_player_status` ON `registration`(`player_id`, `registration_status`);
CREATE INDEX `idx_registration_schedule_status` ON `registration`(`schedule_id`, `registration_status`);
CREATE INDEX `idx_registration_time` ON `registration`(`registration_time`);

-- plog表索引
CREATE INDEX `idx_plog_player_schedule` ON `plog`(`plog_playerid`, `plog_scheduleid`);
CREATE INDEX `idx_plog_schedule_score` ON `plog`(`plog_scheduleid`, `plog_score`);

-- competition表索引
CREATE INDEX `idx_competition_date_status` ON `competition`(`schedule_date`, `registration_status`);
CREATE INDEX `idx_competition_type_date` ON `competition`(`schedule_itemid`, `schedule_date`);

-- 9. 插入默认系统配置
INSERT IGNORE INTO `system_config` (`config_key`, `config_value`, `config_type`, `description`, `is_public`) VALUES
('system.name', '体育赛事管理系统', 'string', '系统名称', 1),
('system.version', 'v1.3.0', 'string', '系统版本', 1),
('registration.max_per_player', '3', 'number', '每人最多报名项目数', 1),
('registration.max_per_class_per_event', '5', 'number', '每班每项目最多报名人数', 1),
('email.enabled', 'false', 'boolean', '是否启用邮件通知', 0),
('sms.enabled', 'false', 'boolean', '是否启用短信通知', 0),
('notification.retention_days', '30', 'number', '通知保留天数', 0),
('log.retention_days', '90', 'number', '日志保留天数', 0);

-- 10. 插入默认通知模板
INSERT IGNORE INTO `notification_template` (`template_code`, `template_name`, `template_type`, `title_template`, `content_template`, `variables`) VALUES
('registration_approve_system', '报名批准-系统通知', 'system', '报名审核通过', '您报名的项目"{{schedule_name}}"已被批准{{#reviewer_name}}，审核人：{{reviewer_name}}{{/reviewer_name}}{{#note}}，审核备注：{{note}}{{/note}}', '{"schedule_name":"项目名称","reviewer_name":"审核人","note":"审核备注"}'),
('registration_reject_system', '报名拒绝-系统通知', 'system', '报名审核拒绝', '您报名的项目"{{schedule_name}}"已被拒绝{{#reviewer_name}}，审核人：{{reviewer_name}}{{/reviewer_name}}{{#note}}，审核备注：{{note}}{{/note}}', '{"schedule_name":"项目名称","reviewer_name":"审核人","note":"审核备注"}'),
('score_update_system', '成绩更新-系统通知', 'system', '成绩已更新', '您在项目"{{schedule_name}}"中的成绩已更新：{{score}}分', '{"schedule_name":"项目名称","score":"成绩"}');

-- 11. 更新现有用户的联系信息（示例数据）
UPDATE `player` SET 
  `player_email` = CONCAT('student', player_studentid, '@example.com'),
  `player_phone` = CONCAT('138', LPAD(player_id, 8, '0'))
WHERE `player_email` IS NULL;

UPDATE `admin` SET 
  `admin_email` = CONCAT('admin', admin_id, '@example.com'),
  `admin_phone` = CONCAT('139', LPAD(admin_id, 8, '0'))
WHERE `admin_email` IS NULL;

UPDATE `judge` SET 
  `judge_email` = CONCAT('judge', judge_id, '@example.com'),
  `judge_phone` = CONCAT('137', LPAD(judge_id, 8, '0'))
WHERE `judge_email` IS NULL;

-- 12. 创建综合统计视图
CREATE OR REPLACE VIEW `v_system_overview` AS
SELECT 
  (SELECT COUNT(*) FROM player) as total_players,
  (SELECT COUNT(*) FROM judge) as total_judges,
  (SELECT COUNT(*) FROM admin) as total_admins,
  (SELECT COUNT(*) FROM competition WHERE schedule_date >= CURDATE()) as upcoming_events,
  (SELECT COUNT(*) FROM registration WHERE registration_status = 1) as pending_registrations,
  (SELECT COUNT(*) FROM registration WHERE registration_status = 2) as approved_registrations,
  (SELECT COUNT(*) FROM plog) as total_scores;

-- 完成提示
SELECT 'Complete system extension completed successfully!' as message,
       'Added: system_config, operation_log, notification tables and enhanced existing tables' as details;

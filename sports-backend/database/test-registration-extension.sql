-- 测试运动员自助系统数据库扩展
-- 这是一个简化版本，用于测试基本功能

-- 1. 检查是否已存在registration表
SELECT 'Checking if registration table exists...' as message;

-- 2. 创建报名表 (如果不存在)
CREATE TABLE IF NOT EXISTS `registration` (
  `registration_id` int(100) NOT NULL AUTO_INCREMENT COMMENT '报名ID',
  `player_id` int(100) NOT NULL COMMENT '运动员ID',
  `schedule_id` int(100) NOT NULL COMMENT '比赛项目ID',
  `registration_status` tinyint(2) NOT NULL DEFAULT 1 COMMENT '报名状态：1-已报名，2-已确认，3-已取消，4-已拒绝',
  `registration_time` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
  `confirmation_time` timestamp NULL DEFAULT NULL COMMENT '确认时间',
  `cancel_time` timestamp NULL DEFAULT NULL COMMENT '取消时间',
  `cancel_reason` varchar(500) DEFAULT NULL COMMENT '取消原因',
  `admin_id` int(100) DEFAULT NULL COMMENT '审核管理员ID',
  `admin_note` varchar(500) DEFAULT NULL COMMENT '管理员备注',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`registration_id`),
  UNIQUE KEY `uk_player_schedule` (`player_id`, `schedule_id`),
  KEY `idx_player_id` (`player_id`),
  KEY `idx_schedule_id` (`schedule_id`),
  KEY `idx_status` (`registration_status`),
  KEY `idx_registration_time` (`registration_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='运动员报名表';

-- 3. 检查competition表是否需要扩展
SELECT 'Checking competition table structure...' as message;

-- 4. 为competition表添加报名相关字段（如果不存在）
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'competition' 
   AND table_schema = DATABASE()
   AND column_name = 'registration_start_time') > 0,
  'SELECT "registration_start_time column already exists" as message',
  'ALTER TABLE `competition` 
   ADD COLUMN `registration_start_time` timestamp NULL DEFAULT NULL COMMENT "报名开始时间",
   ADD COLUMN `registration_end_time` timestamp NULL DEFAULT NULL COMMENT "报名结束时间",
   ADD COLUMN `max_participants` int(10) DEFAULT 50 COMMENT "最大参赛人数",
   ADD COLUMN `registration_status` tinyint(2) DEFAULT 1 COMMENT "报名状态：1-开放报名，2-报名结束，3-报名暂停",
   ADD COLUMN `registration_note` varchar(1000) DEFAULT NULL COMMENT "报名说明"'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 插入一些测试数据
SELECT 'Inserting test data...' as message;

-- 更新现有比赛项目的报名信息
UPDATE `competition` SET 
  `registration_start_time` = DATE_SUB(NOW(), INTERVAL 7 DAY),
  `registration_end_time` = DATE_ADD(NOW(), INTERVAL 7 DAY),
  `max_participants` = 50,
  `registration_status` = 1,
  `registration_note` = '欢迎报名参加本次比赛，请在规定时间内完成报名。'
WHERE `registration_start_time` IS NULL
LIMIT 5;

-- 6. 创建一些测试报名记录（如果player表有数据）
INSERT IGNORE INTO `registration` 
  (`player_id`, `schedule_id`, `registration_status`, `registration_time`)
SELECT 
  p.player_id,
  c.schedule_id,
  1,
  NOW()
FROM player p
CROSS JOIN competition c
WHERE p.player_id <= 3 AND c.schedule_id <= 2
LIMIT 3;

-- 7. 验证数据
SELECT 'Verification results:' as message;
SELECT COUNT(*) as registration_count FROM registration;
SELECT COUNT(*) as competition_with_registration_info FROM competition WHERE registration_start_time IS NOT NULL;

SELECT '运动员自助系统数据库扩展测试完成！' as message;

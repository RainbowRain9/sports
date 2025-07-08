-- =============================================
-- 运动员自助系统数据库扩展脚本
-- 嘉庚大二实践周作业 - 体育赛事管理系统
-- =============================================

-- 1. 创建报名表 (registration)
DROP TABLE IF EXISTS `registration`;
CREATE TABLE `registration` (
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

-- 2. 扩展competition表，添加报名相关字段
ALTER TABLE `competition` 
ADD COLUMN `registration_start_time` timestamp NULL DEFAULT NULL COMMENT '报名开始时间',
ADD COLUMN `registration_end_time` timestamp NULL DEFAULT NULL COMMENT '报名结束时间',
ADD COLUMN `max_participants` int(10) DEFAULT 50 COMMENT '最大参赛人数',
ADD COLUMN `registration_status` tinyint(2) DEFAULT 1 COMMENT '报名状态：1-开放报名，2-报名结束，3-报名暂停',
ADD COLUMN `registration_note` varchar(1000) DEFAULT NULL COMMENT '报名说明';

-- 3. 创建报名统计视图
CREATE OR REPLACE VIEW `v_registration_stats` AS
SELECT 
  s.schedule_id,
  s.schedule_name,
  s.schedule_itemname,
  s.schedule_date,
  s.registration_start_time,
  s.registration_end_time,
  s.max_participants,
  s.registration_status,
  COUNT(r.registration_id) as total_registrations,
  COUNT(CASE WHEN r.registration_status = 1 THEN 1 END) as pending_registrations,
  COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) as confirmed_registrations,
  COUNT(CASE WHEN r.registration_status = 3 THEN 1 END) as cancelled_registrations,
  (s.max_participants - COUNT(CASE WHEN r.registration_status IN (1,2) THEN 1 END)) as available_slots
FROM competition s
LEFT JOIN registration r ON s.schedule_id = r.schedule_id
GROUP BY s.schedule_id;

-- 4. 创建运动员报名统计视图
CREATE OR REPLACE VIEW `v_player_registration_stats` AS
SELECT 
  p.player_id,
  p.player_name,
  p.player_class,
  p.player_studentid,
  COUNT(r.registration_id) as total_registrations,
  COUNT(CASE WHEN r.registration_status = 1 THEN 1 END) as pending_count,
  COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN r.registration_status = 3 THEN 1 END) as cancelled_count,
  (3 - COUNT(CASE WHEN r.registration_status IN (1,2) THEN 1 END)) as remaining_slots
FROM player p
LEFT JOIN registration r ON p.player_id = r.player_id
GROUP BY p.player_id;

-- 5. 创建班级报名统计视图
CREATE OR REPLACE VIEW `v_class_registration_stats` AS
SELECT 
  p.player_class,
  r.schedule_id,
  s.schedule_name,
  COUNT(r.registration_id) as class_registrations,
  (5 - COUNT(CASE WHEN r.registration_status IN (1,2) THEN 1 END)) as class_remaining_slots
FROM player p
JOIN registration r ON p.player_id = r.player_id
JOIN competition s ON r.schedule_id = s.schedule_id
WHERE r.registration_status IN (1,2)
GROUP BY p.player_class, r.schedule_id;

-- 6. 插入测试数据
-- 更新现有比赛项目的报名信息
UPDATE `competition` SET 
  `registration_start_time` = DATE_SUB(NOW(), INTERVAL 7 DAY),
  `registration_end_time` = DATE_ADD(NOW(), INTERVAL 7 DAY),
  `max_participants` = 50,
  `registration_status` = 1,
  `registration_note` = '欢迎报名参加本次比赛，请在规定时间内完成报名。'
WHERE `schedule_id` IN (SELECT schedule_id FROM competition LIMIT 5);

-- 7. 创建存储过程：检查报名限制
DELIMITER $$
CREATE PROCEDURE `CheckRegistrationLimits`(
  IN p_player_id INT,
  IN p_schedule_id INT,
  OUT p_can_register BOOLEAN,
  OUT p_error_message VARCHAR(500)
)
BEGIN
  DECLARE player_count INT DEFAULT 0;
  DECLARE class_count INT DEFAULT 0;
  DECLARE player_class VARCHAR(100);
  DECLARE schedule_max INT DEFAULT 0;
  DECLARE current_participants INT DEFAULT 0;
  
  -- 获取运动员班级
  SELECT player_class INTO player_class FROM player WHERE player_id = p_player_id;
  
  -- 检查运动员已报名项目数量（最多3个）
  SELECT COUNT(*) INTO player_count 
  FROM registration 
  WHERE player_id = p_player_id AND registration_status IN (1,2);
  
  IF player_count >= 3 THEN
    SET p_can_register = FALSE;
    SET p_error_message = '每人最多只能报名3个项目';
    LEAVE CheckRegistrationLimits;
  END IF;
  
  -- 检查班级在该项目的报名数量（每班每项目最多5人）
  SELECT COUNT(*) INTO class_count
  FROM registration r
  JOIN player p ON r.player_id = p.player_id
  WHERE p.player_class = player_class 
    AND r.schedule_id = p_schedule_id 
    AND r.registration_status IN (1,2);
  
  IF class_count >= 5 THEN
    SET p_can_register = FALSE;
    SET p_error_message = CONCAT('班级 ', player_class, ' 在该项目的报名人数已达上限（5人）');
    LEAVE CheckRegistrationLimits;
  END IF;
  
  -- 检查项目总报名人数
  SELECT max_participants INTO schedule_max FROM competition WHERE schedule_id = p_schedule_id;
  SELECT COUNT(*) INTO current_participants 
  FROM registration 
  WHERE schedule_id = p_schedule_id AND registration_status IN (1,2);
  
  IF current_participants >= schedule_max THEN
    SET p_can_register = FALSE;
    SET p_error_message = '该项目报名人数已满';
    LEAVE CheckRegistrationLimits;
  END IF;
  
  -- 检查是否重复报名
  SELECT COUNT(*) INTO player_count
  FROM registration 
  WHERE player_id = p_player_id AND schedule_id = p_schedule_id AND registration_status IN (1,2);
  
  IF player_count > 0 THEN
    SET p_can_register = FALSE;
    SET p_error_message = '您已经报名了该项目';
    LEAVE CheckRegistrationLimits;
  END IF;
  
  -- 所有检查通过
  SET p_can_register = TRUE;
  SET p_error_message = '';
  
END$$
DELIMITER ;

-- 8. 添加索引优化
ALTER TABLE `registration` ADD INDEX `idx_player_status` (`player_id`, `registration_status`);
ALTER TABLE `registration` ADD INDEX `idx_schedule_status` (`schedule_id`, `registration_status`);

-- 执行完成提示
SELECT '运动员自助系统数据库扩展完成！' as message;

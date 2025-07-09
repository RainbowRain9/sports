-- =====================================================
-- 裁判员专用功能模块数据库扩展脚本
-- 创建时间: 2025-07-09
-- 描述: 为体育赛事管理系统添加裁判员专用功能支持
-- =====================================================

USE sports;

-- 1. 创建裁判员与比赛项目关联表
DROP TABLE IF EXISTS `judge_events`;
CREATE TABLE `judge_events` (
  `id` int(100) NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `judge_id` int(100) NOT NULL COMMENT '裁判员ID',
  `schedule_id` int(100) NOT NULL COMMENT '比赛项目ID',
  `assigned_by` int(100) DEFAULT NULL COMMENT '分配管理员ID',
  `assigned_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  `status` tinyint(2) DEFAULT 1 COMMENT '状态：1-已分配，2-已确认，3-已完成，4-已取消',
  `notes` varchar(500) DEFAULT NULL COMMENT '备注信息',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_judge_schedule` (`judge_id`, `schedule_id`),
  KEY `idx_judge_id` (`judge_id`),
  KEY `idx_schedule_id` (`schedule_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_judge_events_judge` FOREIGN KEY (`judge_id`) REFERENCES `judge` (`judge_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_judge_events_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `competition` (`schedule_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='裁判员比赛项目关联表';

-- 2. 扩展plog表，添加裁判员字段（如果不存在）
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE table_name = 'plog' 
   AND table_schema = DATABASE()
   AND column_name = 'plog_judgeid') > 0,
  'SELECT "plog_judgeid column already exists" as message',
  'ALTER TABLE `plog` ADD COLUMN `plog_judgeid` int(100) DEFAULT NULL COMMENT "录入成绩的裁判员ID"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 为plog表添加裁判员外键约束（如果字段存在且约束不存在）
SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                         WHERE table_name = 'plog' 
                         AND table_schema = DATABASE()
                         AND constraint_name = 'fk_plog_judge');

SET @sql = IF(@constraint_exists = 0 AND 
              (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_name = 'plog' 
               AND table_schema = DATABASE()
               AND column_name = 'plog_judgeid') > 0,
              'ALTER TABLE `plog` ADD CONSTRAINT `fk_plog_judge` FOREIGN KEY (`plog_judgeid`) REFERENCES `judge` (`judge_id`) ON DELETE SET NULL',
              'SELECT "Foreign key constraint already exists or column not found" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 创建裁判员工作统计视图
CREATE OR REPLACE VIEW `v_judge_work_stats` AS
SELECT 
  j.judge_id,
  j.judge_name,
  j.judge_username,
  j.judge_specialty,
  COUNT(DISTINCT je.schedule_id) as assigned_events,
  COUNT(DISTINCT CASE WHEN je.status = 3 THEN je.schedule_id END) as completed_events,
  COUNT(DISTINCT p.plog_id) as scored_records,
  COUNT(DISTINCT CASE WHEN c.schedule_date = CURDATE() THEN je.schedule_id END) as today_events,
  COUNT(DISTINCT CASE WHEN c.schedule_date > CURDATE() THEN je.schedule_id END) as upcoming_events
FROM judge j
LEFT JOIN judge_events je ON j.judge_id = je.judge_id
LEFT JOIN competition c ON je.schedule_id = c.schedule_id
LEFT JOIN plog p ON j.judge_id = p.plog_judgeid
WHERE j.judge_status = 1
GROUP BY j.judge_id;

-- 5. 创建裁判员赛事详情视图
CREATE OR REPLACE VIEW `v_judge_event_details` AS
SELECT 
  je.id as assignment_id,
  je.judge_id,
  j.judge_name,
  je.schedule_id,
  c.schedule_name,
  c.schedule_date,
  c.schedule_starttime,
  c.schedule_endtime,
  c.schedule_introduction,
  pt.type_name as project_type,
  je.status as assignment_status,
  je.assigned_at,
  je.notes,
  COUNT(DISTINCT r.registration_id) as registered_players,
  COUNT(DISTINCT p.plog_id) as scored_players
FROM judge_events je
JOIN judge j ON je.judge_id = j.judge_id
JOIN competition c ON je.schedule_id = c.schedule_id
LEFT JOIN project pt ON c.schedule_itemid = pt.type_id
LEFT JOIN registration r ON c.schedule_id = r.schedule_id AND r.registration_status IN (1,2)
LEFT JOIN plog p ON c.schedule_id = p.plog_scheduleid
GROUP BY je.id;

-- 6. 插入测试数据：为现有比赛项目分配裁判员
INSERT INTO `judge_events` (`judge_id`, `schedule_id`, `assigned_by`, `status`, `notes`) VALUES
(1, 11, 5, 1, '负责跳远项目的成绩录入和现场执裁'),
(2, 14, 5, 1, '负责1000米项目的成绩录入和现场执裁'),
(3, 17, 5, 1, '负责铅球项目的成绩录入和现场执裁');

-- 7. 更新现有成绩记录，关联裁判员
UPDATE `plog` SET `plog_judgeid` = 1 WHERE `plog_scheduleid` = 11;

-- 8. 创建裁判员权限扩展（如果role_permission表存在）
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                    WHERE table_schema = DATABASE()
                    AND table_name = 'role_permission');

SET @sql = IF(@table_exists > 0,
    'INSERT IGNORE INTO `role_permission` (`role_type`, `permission`, `description`) VALUES
    ("judge", "event:view", "查看分配的比赛项目"),
    ("judge", "event:manage", "管理分配的比赛项目"),
    ("judge", "score:create", "创建成绩记录"),
    ("judge", "score:update", "修改成绩记录"),
    ("judge", "score:delete", "删除成绩记录"),
    ("judge", "participant:view", "查看参赛选手信息"),
    ("judge", "schedule:view", "查看比赛赛程"),
    ("judge", "stats:view", "查看统计信息")',
    'SELECT "role_permission table does not exist, skipping permission insert" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 9. 添加索引优化
ALTER TABLE `judge_events` ADD INDEX `idx_assigned_at` (`assigned_at`);
ALTER TABLE `judge_events` ADD INDEX `idx_status_date` (`status`, `assigned_at`);

-- 10. 创建存储过程：分配裁判员到比赛项目
DELIMITER $$
CREATE PROCEDURE `AssignJudgeToEvent`(
  IN p_judge_id INT,
  IN p_schedule_id INT,
  IN p_assigned_by INT,
  IN p_notes VARCHAR(500),
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR(500)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_judge_exists INT DEFAULT 0;
  DECLARE v_event_exists INT DEFAULT 0;
  
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_success = FALSE;
    SET p_message = '分配失败：数据库错误';
  END;
  
  START TRANSACTION;
  
  -- 检查裁判员是否存在且状态正常
  SELECT COUNT(*) INTO v_judge_exists 
  FROM judge 
  WHERE judge_id = p_judge_id AND judge_status = 1;
  
  IF v_judge_exists = 0 THEN
    SET p_success = FALSE;
    SET p_message = '裁判员不存在或状态异常';
    ROLLBACK;
  ELSE
    -- 检查比赛项目是否存在
    SELECT COUNT(*) INTO v_event_exists 
    FROM competition 
    WHERE schedule_id = p_schedule_id;
    
    IF v_event_exists = 0 THEN
      SET p_success = FALSE;
      SET p_message = '比赛项目不存在';
      ROLLBACK;
    ELSE
      -- 检查是否已经分配
      SELECT COUNT(*) INTO v_count 
      FROM judge_events 
      WHERE judge_id = p_judge_id AND schedule_id = p_schedule_id;
      
      IF v_count > 0 THEN
        SET p_success = FALSE;
        SET p_message = '该裁判员已分配到此比赛项目';
        ROLLBACK;
      ELSE
        -- 执行分配
        INSERT INTO judge_events (judge_id, schedule_id, assigned_by, status, notes)
        VALUES (p_judge_id, p_schedule_id, p_assigned_by, 1, p_notes);
        
        SET p_success = TRUE;
        SET p_message = '分配成功';
        COMMIT;
      END IF;
    END IF;
  END IF;
END$$
DELIMITER ;

-- 执行完成提示
SELECT '裁判员专用功能模块数据库扩展完成！' as message;
SELECT '已创建表：judge_events' as created_tables;
SELECT '已创建视图：v_judge_work_stats, v_judge_event_details' as created_views;
SELECT '已创建存储过程：AssignJudgeToEvent' as created_procedures;

-- 报名审核系统数据库扩展脚本
-- 用于完善报名审核流程和状态管理

USE sports;

-- 1. 创建审核日志表
DROP TABLE IF EXISTS `registration_review_log`;
CREATE TABLE `registration_review_log` (
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

-- 2. 创建审核统计视图
CREATE OR REPLACE VIEW `v_registration_review_stats` AS
SELECT 
  DATE(r.registration_time) as registration_date,
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN r.registration_status = 1 THEN 1 END) as pending_count,
  COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) as approved_count,
  COUNT(CASE WHEN r.registration_status = 3 THEN 1 END) as cancelled_count,
  COUNT(CASE WHEN r.registration_status = 4 THEN 1 END) as rejected_count,
  ROUND(COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) * 100.0 / COUNT(*), 2) as approval_rate
FROM registration r
GROUP BY DATE(r.registration_time)
ORDER BY registration_date DESC;

-- 3. 创建管理员审核工作量统计视图
CREATE OR REPLACE VIEW `v_admin_review_workload` AS
SELECT 
  a.admin_id,
  a.admin_name,
  COUNT(l.log_id) as total_reviews,
  COUNT(CASE WHEN l.action_type = 'approve' THEN 1 END) as approved_count,
  COUNT(CASE WHEN l.action_type = 'reject' THEN 1 END) as rejected_count,
  DATE(MAX(l.review_time)) as last_review_date,
  ROUND(COUNT(CASE WHEN l.action_type = 'approve' THEN 1 END) * 100.0 / COUNT(l.log_id), 2) as approval_rate
FROM admin a
LEFT JOIN registration_review_log l ON a.admin_id = l.admin_id
WHERE a.admin_type IN ('1', '2') -- 操作员和管理员
GROUP BY a.admin_id, a.admin_name
ORDER BY total_reviews DESC;

-- 4. 创建项目报名审核统计视图
CREATE OR REPLACE VIEW `v_event_registration_review_stats` AS
SELECT 
  c.schedule_id,
  c.schedule_name,
  c.schedule_date,
  c.max_participants,
  COUNT(r.registration_id) as total_registrations,
  COUNT(CASE WHEN r.registration_status = 1 THEN 1 END) as pending_count,
  COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) as approved_count,
  COUNT(CASE WHEN r.registration_status = 4 THEN 1 END) as rejected_count,
  (c.max_participants - COUNT(CASE WHEN r.registration_status = 2 THEN 1 END)) as remaining_slots,
  ROUND(COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) * 100.0 / c.max_participants, 2) as fill_rate
FROM competition c
LEFT JOIN registration r ON c.schedule_id = r.schedule_id
GROUP BY c.schedule_id, c.schedule_name, c.schedule_date, c.max_participants
ORDER BY c.schedule_date ASC;

-- 5. 创建班级报名统计视图
CREATE OR REPLACE VIEW `v_class_registration_stats` AS
SELECT 
  p.player_class,
  COUNT(DISTINCT p.player_id) as total_students,
  COUNT(r.registration_id) as total_registrations,
  COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) as approved_registrations,
  ROUND(COUNT(r.registration_id) * 1.0 / COUNT(DISTINCT p.player_id), 2) as avg_registrations_per_student,
  ROUND(COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) * 100.0 / COUNT(r.registration_id), 2) as approval_rate
FROM player p
LEFT JOIN registration r ON p.player_id = r.player_id
GROUP BY p.player_class
ORDER BY total_registrations DESC;

-- 6. 创建存储过程：记录审核日志
DELIMITER $$
CREATE PROCEDURE `LogRegistrationReview`(
  IN p_registration_id INT,
  IN p_admin_id INT,
  IN p_action_type VARCHAR(20),
  IN p_old_status TINYINT,
  IN p_new_status TINYINT,
  IN p_review_note VARCHAR(1000),
  IN p_ip_address VARCHAR(45),
  IN p_user_agent VARCHAR(500)
)
BEGIN
  INSERT INTO registration_review_log (
    registration_id,
    admin_id,
    action_type,
    old_status,
    new_status,
    review_note,
    ip_address,
    user_agent,
    review_time
  ) VALUES (
    p_registration_id,
    p_admin_id,
    p_action_type,
    p_old_status,
    p_new_status,
    p_review_note,
    p_ip_address,
    p_user_agent,
    NOW()
  );
END$$
DELIMITER ;

-- 7. 创建存储过程：批量审核报名
DELIMITER $$
CREATE PROCEDURE `BatchReviewRegistrations`(
  IN p_registration_ids TEXT,
  IN p_admin_id INT,
  IN p_action_type VARCHAR(20),
  IN p_review_note VARCHAR(1000),
  IN p_ip_address VARCHAR(45),
  OUT p_success_count INT,
  OUT p_failed_count INT
)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_registration_id INT;
  DECLARE v_old_status TINYINT;
  DECLARE v_new_status TINYINT;
  DECLARE v_error_msg VARCHAR(500);
  
  -- 声明游标
  DECLARE id_cursor CURSOR FOR 
    SELECT CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(p_registration_ids, ',', numbers.n), ',', -1) AS UNSIGNED) as id
    FROM (
      SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 
      UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
    ) numbers
    WHERE CHAR_LENGTH(p_registration_ids) - CHAR_LENGTH(REPLACE(p_registration_ids, ',', '')) >= numbers.n - 1;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION 
  BEGIN
    SET p_failed_count = p_failed_count + 1;
    GET DIAGNOSTICS CONDITION 1 v_error_msg = MESSAGE_TEXT;
  END;
  
  -- 初始化计数器
  SET p_success_count = 0;
  SET p_failed_count = 0;
  
  -- 确定新状态
  IF p_action_type = 'approve' THEN
    SET v_new_status = 2;
  ELSEIF p_action_type = 'reject' THEN
    SET v_new_status = 4;
  ELSE
    SET p_failed_count = -1;
    LEAVE BatchReviewRegistrations;
  END IF;
  
  -- 开始事务
  START TRANSACTION;
  
  -- 打开游标
  OPEN id_cursor;
  
  read_loop: LOOP
    FETCH id_cursor INTO v_registration_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- 获取当前状态
    SELECT registration_status INTO v_old_status 
    FROM registration 
    WHERE registration_id = v_registration_id AND registration_status = 1;
    
    IF v_old_status = 1 THEN
      -- 更新报名状态
      UPDATE registration 
      SET 
        registration_status = v_new_status,
        admin_id = p_admin_id,
        admin_note = p_review_note,
        confirmation_time = NOW(),
        updated_at = NOW()
      WHERE registration_id = v_registration_id;
      
      -- 记录审核日志
      CALL LogRegistrationReview(
        v_registration_id,
        p_admin_id,
        p_action_type,
        v_old_status,
        v_new_status,
        p_review_note,
        p_ip_address,
        NULL
      );
      
      SET p_success_count = p_success_count + 1;
    ELSE
      SET p_failed_count = p_failed_count + 1;
    END IF;
    
  END LOOP;
  
  CLOSE id_cursor;
  
  -- 提交事务
  COMMIT;
  
END$$
DELIMITER ;

-- 8. 创建触发器：自动记录状态变更日志
DELIMITER $$
CREATE TRIGGER `tr_registration_status_change`
AFTER UPDATE ON `registration`
FOR EACH ROW
BEGIN
  IF OLD.registration_status != NEW.registration_status THEN
    INSERT INTO registration_review_log (
      registration_id,
      admin_id,
      action_type,
      old_status,
      new_status,
      review_note,
      review_time
    ) VALUES (
      NEW.registration_id,
      COALESCE(NEW.admin_id, 0),
      CASE 
        WHEN NEW.registration_status = 2 THEN 'approve'
        WHEN NEW.registration_status = 4 THEN 'reject'
        WHEN NEW.registration_status = 3 THEN 'cancel'
        ELSE 'unknown'
      END,
      OLD.registration_status,
      NEW.registration_status,
      NEW.admin_note,
      NOW()
    );
  END IF;
END$$
DELIMITER ;

-- 9. 插入测试数据
-- 为现有报名记录生成一些审核日志
INSERT INTO registration_review_log (registration_id, admin_id, action_type, old_status, new_status, review_note, review_time)
SELECT 
  r.registration_id,
  COALESCE(r.admin_id, 5) as admin_id,
  CASE r.registration_status
    WHEN 2 THEN 'approve'
    WHEN 4 THEN 'reject'
    ELSE 'unknown'
  END as action_type,
  1 as old_status,
  r.registration_status as new_status,
  COALESCE(r.admin_note, '系统初始化数据') as review_note,
  COALESCE(r.confirmation_time, r.registration_time) as review_time
FROM registration r
WHERE r.registration_status IN (2, 4) AND r.admin_id IS NOT NULL;

-- 10. 创建索引优化查询性能
ALTER TABLE registration ADD INDEX idx_status_time (registration_status, registration_time);
ALTER TABLE registration ADD INDEX idx_admin_confirmation (admin_id, confirmation_time);

-- 完成提示
SELECT 'Registration review system extension completed successfully!' as message;

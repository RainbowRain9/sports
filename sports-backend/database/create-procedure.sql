-- 创建报名限制检查存储过程
DELIMITER $$
CREATE PROCEDURE `CheckRegistrationLimits`(
  IN p_player_id INT,
  IN p_schedule_id INT,
  OUT p_can_register BOOLEAN,
  OUT p_error_message VARCHAR(500)
)
CheckRegistrationLimits: BEGIN
  DECLARE player_count INT DEFAULT 0;
  DECLARE class_count INT DEFAULT 0;
  DECLARE player_class_name VARCHAR(100);
  DECLARE schedule_max INT DEFAULT 0;
  DECLARE current_participants INT DEFAULT 0;

  -- 初始化输出参数
  SET p_can_register = TRUE;
  SET p_error_message = '';

  -- 获取运动员班级
  SELECT player_class INTO player_class_name FROM player WHERE player_id = p_player_id;

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
  WHERE p.player_class = player_class_name
    AND r.schedule_id = p_schedule_id 
    AND r.registration_status IN (1,2);
  
  IF class_count >= 5 THEN
    SET p_can_register = FALSE;
    SET p_error_message = CONCAT('班级 ', player_class_name, ' 在该项目的报名人数已达上限（5人）');
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

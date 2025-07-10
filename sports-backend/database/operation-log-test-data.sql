-- 操作日志测试数据
-- 为操作日志功能创建丰富的测试数据

-- 清理现有测试数据
DELETE FROM operation_log WHERE details LIKE '%测试%' OR operation LIKE '%test%';

-- 插入管理员操作日志
INSERT INTO operation_log (user_id, user_type, operation, target_type, target_id, details, ip_address, user_agent, result, created_at) VALUES
-- 系统管理操作
(1, 'admin', 'login', 'system', NULL, '{"login_method": "password", "session_duration": "8h"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 1 HOUR),
(1, 'admin', 'create_config', 'system_config', 1, '{"config_key": "system.maintenance_mode", "config_value": "false", "config_type": "boolean"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 50 MINUTE),
(1, 'admin', 'update_config', 'system_config', 2, '{"config_key": "system.max_registration_per_user", "old_value": "3", "new_value": "5"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 45 MINUTE),
(1, 'admin', 'delete_config', 'system_config', 3, '{"config_key": "system.test_config", "reason": "不再需要"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 40 MINUTE),

-- 用户管理操作
(1, 'admin', 'create_user', 'player', 20, '{"player_name": "张三", "player_studentid": "2023001", "player_class": "计算机1班"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 35 MINUTE),
(1, 'admin', 'update_user', 'player', 17, '{"field": "player_phone", "old_value": "13800000001", "new_value": "13900000001"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 30 MINUTE),
(1, 'admin', 'delete_user', 'player', 21, '{"player_name": "李四", "reason": "重复注册"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 25 MINUTE),

-- 比赛管理操作
(1, 'admin', 'create_competition', 'competition', 10, '{"schedule_name": "男子4x100米接力", "schedule_date": "2025-07-15", "schedule_location": "田径场"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 20 MINUTE),
(1, 'admin', 'update_competition', 'competition', 5, '{"field": "schedule_date", "old_value": "2025-07-14", "new_value": "2025-07-15"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 15 MINUTE),

-- 报名审核操作
(1, 'admin', 'review_registration', 'registration', 15, '{"action": "approve", "old_status": 1, "new_status": 2, "note": "符合参赛条件"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 10 MINUTE),
(1, 'admin', 'review_registration', 'registration', 16, '{"action": "reject", "old_status": 1, "new_status": 3, "note": "不符合年龄要求"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 8 MINUTE),

-- 数据导出操作
(1, 'admin', 'export_data', 'registration', NULL, '{"export_type": "excel", "date_range": ["2025-07-01", "2025-07-10"], "total_records": 150}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 5 MINUTE),

-- 系统通知操作
(1, 'admin', 'send_notification', 'system_notification', 25, '{"title": "系统维护通知", "target_type": "all", "recipient_count": 200}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 3 MINUTE);

-- 插入操作员操作日志
INSERT INTO operation_log (user_id, user_type, operation, target_type, target_id, details, ip_address, user_agent, result, created_at) VALUES
-- 操作员登录
(2, 'operator', 'login', 'system', NULL, '{"login_method": "password", "session_duration": "4h"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NOW() - INTERVAL 2 HOUR),

-- 成绩管理操作
(2, 'operator', 'create_score', 'plog', 50, '{"player_id": 17, "competition_id": 5, "score": 12.5, "rank": 3}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NOW() - INTERVAL 90 MINUTE),
(2, 'operator', 'update_score', 'plog', 48, '{"field": "plog_score", "old_value": 13.2, "new_value": 13.1, "reason": "计时修正"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NOW() - INTERVAL 80 MINUTE),
(2, 'operator', 'delete_score', 'plog', 52, '{"player_id": 19, "competition_id": 6, "reason": "重复录入"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NOW() - INTERVAL 70 MINUTE),

-- 报名管理操作
(2, 'operator', 'create_registration', 'registration', 25, '{"player_id": 18, "competition_id": 7, "registration_time": "2025-07-10 14:30:00"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NOW() - INTERVAL 60 MINUTE),
(2, 'operator', 'update_registration', 'registration', 20, '{"field": "registration_status", "old_value": 1, "new_value": 2}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NOW() - INTERVAL 50 MINUTE),

-- 失败操作示例
(2, 'operator', 'create_score', 'plog', NULL, '{"player_id": 17, "competition_id": 5, "score": 12.5}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'failed', NOW() - INTERVAL 40 MINUTE);

-- 插入运动员操作日志
INSERT INTO operation_log (user_id, user_type, operation, target_type, target_id, details, ip_address, user_agent, result, created_at) VALUES
-- 运动员登录
(17, 'player', 'login', 'system', NULL, '{"login_method": "password", "device": "mobile"}', '192.168.1.150', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 3 HOUR),
(18, 'player', 'login', 'system', NULL, '{"login_method": "password", "device": "desktop"}', '192.168.1.151', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 2.5 HOUR),
(19, 'player', 'login', 'system', NULL, '{"login_method": "password", "device": "mobile"}', '192.168.1.152', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', 'success', NOW() - INTERVAL 2 HOUR),

-- 报名操作
(17, 'player', 'create_registration', 'registration', 30, '{"competition_id": 8, "registration_time": "2025-07-10 15:00:00"}', '192.168.1.150', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 150 MINUTE),
(18, 'player', 'create_registration', 'registration', 31, '{"competition_id": 9, "registration_time": "2025-07-10 15:30:00"}', '192.168.1.151', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 120 MINUTE),
(19, 'player', 'create_registration', 'registration', 32, '{"competition_id": 10, "registration_time": "2025-07-10 16:00:00"}', '192.168.1.152', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', 'success', NOW() - INTERVAL 90 MINUTE),

-- 取消报名操作
(17, 'player', 'cancel_registration', 'registration', 28, '{"competition_id": 6, "reason": "时间冲突"}', '192.168.1.150', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 60 MINUTE),

-- 个人信息更新
(18, 'player', 'update_profile', 'player', 18, '{"field": "player_phone", "old_value": "13800000002", "new_value": "13900000002"}', '192.168.1.151', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 30 MINUTE),
(19, 'player', 'change_password', 'player', 19, '{"password_strength": "strong"}', '192.168.1.152', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', 'success', NOW() - INTERVAL 20 MINUTE),

-- 查看成绩操作
(17, 'player', 'view_scores', 'plog', NULL, '{"competition_count": 3, "view_type": "personal"}', '192.168.1.150', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 10 MINUTE);

-- 插入裁判员操作日志
INSERT INTO operation_log (user_id, user_type, operation, target_type, target_id, details, ip_address, user_agent, result, created_at) VALUES
-- 裁判员登录
(1, 'judge', 'login', 'system', NULL, '{"login_method": "password", "device": "tablet"}', '192.168.1.200', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 4 HOUR),
(2, 'judge', 'login', 'system', NULL, '{"login_method": "password", "device": "desktop"}', '192.168.1.201', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 3.5 HOUR),

-- 成绩录入操作
(1, 'judge', 'input_score', 'plog', 55, '{"player_id": 17, "competition_id": 8, "score": 11.8, "rank": 1, "input_method": "manual"}', '192.168.1.200', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 180 MINUTE),
(1, 'judge', 'input_score', 'plog', 56, '{"player_id": 18, "competition_id": 8, "score": 12.1, "rank": 2, "input_method": "manual"}', '192.168.1.200', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 175 MINUTE),
(2, 'judge', 'input_score', 'plog', 57, '{"player_id": 19, "competition_id": 9, "score": 1.65, "rank": 1, "input_method": "electronic"}', '192.168.1.201', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 150 MINUTE),

-- 批量成绩录入
(1, 'judge', 'batch_input_scores', 'plog', NULL, '{"competition_id": 10, "player_count": 8, "input_method": "batch", "total_time": "15min"}', '192.168.1.200', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 120 MINUTE),

-- 成绩修正操作
(2, 'judge', 'correct_score', 'plog', 55, '{"field": "plog_score", "old_value": 11.9, "new_value": 11.8, "reason": "计时器误差修正"}', '192.168.1.201', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 90 MINUTE),

-- 查看执裁安排
(1, 'judge', 'view_schedule', 'competition', NULL, '{"date": "2025-07-15", "assigned_events": 3}', '192.168.1.200', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'success', NOW() - INTERVAL 60 MINUTE),
(2, 'judge', 'view_schedule', 'competition', NULL, '{"date": "2025-07-16", "assigned_events": 2}', '192.168.1.201', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NOW() - INTERVAL 30 MINUTE);

-- 插入一些失败操作示例
INSERT INTO operation_log (user_id, user_type, operation, target_type, target_id, details, ip_address, user_agent, result, error_message, created_at) VALUES
-- 登录失败
(0, 'unknown', 'login', 'system', NULL, '{"username": "admin", "login_method": "password"}', '192.168.1.999', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'failed', '用户名或密码错误', NOW() - INTERVAL 6 HOUR),
(0, 'unknown', 'login', 'system', NULL, '{"username": "test001", "login_method": "password"}', '192.168.1.888', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'failed', '账号不存在', NOW() - INTERVAL 5 HOUR),

-- 权限不足操作
(17, 'player', 'delete_user', 'player', 20, '{"target_user": "张三"}', '192.168.1.150', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'failed', '权限不足：运动员无法删除用户', NOW() - INTERVAL 4 HOUR),
(2, 'operator', 'delete_config', 'system_config', 1, '{"config_key": "system.maintenance_mode"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'failed', '权限不足：操作员无法删除系统配置', NOW() - INTERVAL 3 HOUR),

-- 数据验证失败
(18, 'player', 'create_registration', 'registration', NULL, '{"competition_id": 5}', '192.168.1.151', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'failed', '报名失败：已超过报名截止时间', NOW() - INTERVAL 2 HOUR),
(1, 'judge', 'input_score', 'plog', NULL, '{"player_id": 17, "competition_id": 8, "score": -1.5}', '192.168.1.200', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'failed', '成绩录入失败：成绩值无效', NOW() - INTERVAL 1 HOUR);

-- 查询验证数据
SELECT 
  user_type,
  operation,
  result,
  COUNT(*) as count,
  DATE(created_at) as date
FROM operation_log 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY user_type, operation, result, DATE(created_at)
ORDER BY date DESC, user_type, operation;

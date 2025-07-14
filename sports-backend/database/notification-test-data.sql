-- 通知中心测试数据
-- 为不同角色的用户创建测试通知

-- 清理现有测试数据
DELETE FROM system_notification WHERE title LIKE '%测试%';

-- 为管理员创建通知
INSERT INTO system_notification (user_id, user_type, title, content, type, status, priority, created_at) VALUES
(1, 'admin', '系统维护通知', '系统将于今晚22:00-24:00进行维护，请提前保存数据。', 'system_notice', 0, 2, NOW() - INTERVAL 1 HOUR),
(1, 'admin', '数据备份完成', '系统数据备份已完成，备份文件已保存到服务器。', 'system_notice', 1, 1, NOW() - INTERVAL 2 HOUR),
(1, 'admin', '新用户注册提醒', '有新的运动员用户注册，请及时审核。', 'system_notice', 0, 1, NOW() - INTERVAL 30 MINUTE);

-- 为运动员创建通知（假设运动员ID为17, 18, 19）
INSERT INTO system_notification (user_id, user_type, title, content, type, status, priority, created_at) VALUES
(17, 'player', '报名审核通过', '您报名的"男子100米跑"项目已审核通过，请按时参加比赛。', 'registration_review', 0, 2, NOW() - INTERVAL 1 HOUR),
(17, 'player', '成绩已公布', '您在"男子100米跑"项目中的成绩为12.5秒，排名第3。', 'score_update', 1, 1, NOW() - INTERVAL 3 HOUR),
(17, 'player', '比赛时间提醒', '您报名的"男子100米跑"比赛将于明天上午9:00开始，请提前到场。', 'event_notice', 0, 3, NOW() - INTERVAL 2 HOUR),

(18, 'player', '报名审核拒绝', '您报名的"女子跳远"项目审核未通过，原因：不符合参赛条件。', 'registration_review', 0, 2, NOW() - INTERVAL 45 MINUTE),
(18, 'player', '系统公告', '运动会报名截止时间延长至本周五，请抓紧时间报名。', 'system_notice', 1, 1, NOW() - INTERVAL 4 HOUR),

(19, 'player', '成绩录入通知', '您在"女子800米跑"项目中的成绩已录入，请查看详情。', 'score_update', 0, 1, NOW() - INTERVAL 20 MINUTE),
(19, 'player', '比赛取消通知', '由于天气原因，原定今天下午的"女子800米跑"比赛取消，具体时间另行通知。', 'event_notice', 0, 3, NOW() - INTERVAL 1 HOUR);

-- 为裁判员创建通知（假设裁判员ID为1, 2, 3）
INSERT INTO system_notification (user_id, user_type, title, content, type, status, priority, created_at) VALUES
(1, 'judge', '执裁任务分配', '您被分配执裁"男子100米跑"项目，比赛时间：明天上午9:00。', 'event_notice', 0, 2, NOW() - INTERVAL 2 HOUR),
(1, 'judge', '成绩录入提醒', '请及时录入"男子100米跑"项目的比赛成绩。', 'score_update', 1, 1, NOW() - INTERVAL 5 HOUR),
(1, 'judge', '培训通知', '裁判员培训会议将于本周三下午2:00在会议室举行，请准时参加。', 'system_notice', 0, 1, NOW() - INTERVAL 3 HOUR),

(2, 'judge', '比赛场地变更', '您执裁的"女子跳远"项目比赛场地变更为田径场B区。', 'event_notice', 0, 2, NOW() - INTERVAL 1 HOUR),
(2, 'judge', '器材检查通知', '请在比赛前30分钟到场检查比赛器材。', 'system_notice', 1, 1, NOW() - INTERVAL 6 HOUR),

(3, 'judge', '紧急通知', '由于裁判员临时缺席，您需要额外执裁"男子跳高"项目。', 'event_notice', 0, 3, NOW() - INTERVAL 30 MINUTE),
(3, 'judge', '工作总结提交', '请在本周内提交本月的执裁工作总结。', 'system_notice', 0, 1, NOW() - INTERVAL 4 HOUR);

-- 创建一些历史通知数据
INSERT INTO system_notification (user_id, user_type, title, content, type, status, priority, created_at) VALUES
(17, 'player', '欢迎使用系统', '欢迎使用嘉园运动会系统，祝您使用愉快！', 'system_notice', 1, 1, NOW() - INTERVAL 7 DAY),
(18, 'player', '账号激活成功', '您的账号已成功激活，可以正常使用系统功能。', 'system_notice', 1, 1, NOW() - INTERVAL 6 DAY),
(19, 'player', '密码修改成功', '您的登录密码已成功修改，请妥善保管。', 'system_notice', 1, 1, NOW() - INTERVAL 5 DAY),
(1, 'judge', '系统升级完成', '系统升级已完成，新增了多项实用功能。', 'system_notice', 1, 1, NOW() - INTERVAL 4 DAY),
(2, 'judge', '数据同步完成', '用户数据同步已完成，如有问题请联系管理员。', 'system_notice', 1, 1, NOW() - INTERVAL 3 DAY),
(1, 'admin', '月度统计报告', '本月系统使用统计报告已生成，请查看附件。', 'system_notice', 1, 1, NOW() - INTERVAL 2 DAY);

-- 查询验证数据
SELECT 
  notification_id,
  user_id,
  user_type,
  title,
  type,
  status,
  priority,
  created_at
FROM system_notification 
ORDER BY created_at DESC 
LIMIT 20;

'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  // 原有登陆模块（保持兼容）
  router.get('/', controller.login.index);
  router.post('/login', controller.login.login);

  // 新的多角色认证API
  router.post('/api/auth/login', controller.auth.login);
  router.post('/api/auth/logout', controller.auth.logout);
  router.get('/api/auth/profile', app.middleware.auth(), controller.auth.profile);
  router.post('/api/auth/verify', controller.auth.verify);
  router.post('/api/auth/check-permission', app.middleware.auth(), controller.auth.checkPermission);

  // 运动员自助系统API
  router.get('/api/player/profile', app.middleware.auth(), controller.player.getProfile);
  router.put('/api/player/profile', app.middleware.auth(), controller.player.updateProfile);
  router.get('/api/player/stats', app.middleware.auth(), controller.player.getStats);
  router.put('/api/player/password', app.middleware.auth(), controller.player.changePassword);
  router.get('/api/player/scores', app.middleware.auth(), controller.player.getPlayerScores);

  // 报名管理API
  router.get('/api/registration/available-events', app.middleware.auth(), controller.registration.getAvailableEvents);
  router.post('/api/registration/register', app.middleware.auth(), controller.registration.createRegistration);
  router.get('/api/registration/my-registrations', app.middleware.auth(), controller.registration.getMyRegistrations);
  router.delete('/api/registration/:registrationId', app.middleware.auth(), controller.registration.cancelRegistration);
  router.post('/api/registration/check-limits', app.middleware.auth(), controller.registration.checkLimits);

  // 管理员报名审核API
  router.get('/api/admin/registrations/pending', app.middleware.auth(), controller.registrationAdmin.getPendingRegistrations);
  router.post('/api/admin/registrations/batch-review', app.middleware.auth(), controller.registrationAdmin.batchReviewRegistrations);
  router.put('/api/admin/registrations/:registrationId/review', app.middleware.auth(), controller.registrationAdmin.reviewRegistration);
  router.get('/api/admin/registrations/:registrationId/workflow', app.middleware.auth(), controller.registrationAdmin.getReviewWorkflow);
  router.get('/api/admin/registrations/stats', app.middleware.auth(), controller.registrationAdmin.getRegistrationStats);
  router.get('/api/admin/registrations/history', app.middleware.auth(), controller.registrationAdmin.getReviewHistory);
  router.get('/api/admin/registrations/export', app.middleware.auth(), controller.registrationAdmin.exportRegistrations);

  // 系统配置管理API
  router.get('/api/admin/system/config', app.middleware.auth(), controller.systemConfig.getConfigs);
  router.get('/api/system/config/public', controller.systemConfig.getPublicConfigs);
  router.get('/api/admin/system/config/:configKey', app.middleware.auth(), controller.systemConfig.getConfig);
  router.post('/api/admin/system/config', app.middleware.auth(), controller.systemConfig.createConfig);
  router.put('/api/admin/system/config/:configKey', app.middleware.auth(), controller.systemConfig.updateConfig);
  router.delete('/api/admin/system/config/:configKey', app.middleware.auth(), controller.systemConfig.deleteConfig);
  router.put('/api/admin/system/config/batch', app.middleware.auth(), controller.systemConfig.batchUpdateConfigs);

  // 系统通知API
  router.get('/api/notifications', app.middleware.auth(), controller.systemNotification.getNotifications);
  router.get('/api/notifications/unread-count', app.middleware.auth(), controller.systemNotification.getUnreadCount);
  router.put('/api/notifications/:notificationId/read', app.middleware.auth(), controller.systemNotification.markAsRead);
  router.put('/api/notifications/batch-read', app.middleware.auth(), controller.systemNotification.batchMarkAsRead);
  router.put('/api/notifications/mark-all-read', app.middleware.auth(), controller.systemNotification.markAllAsRead);
  router.delete('/api/notifications/:notificationId', app.middleware.auth(), controller.systemNotification.deleteNotification);
  router.post('/api/admin/notifications/send', app.middleware.auth(), controller.systemNotification.sendNotification);
  router.get('/api/admin/notifications/stats', app.middleware.auth(), controller.systemNotification.getNotificationStats);

  // 操作日志API
  router.get('/api/admin/operation-logs', app.middleware.auth(), controller.operationLog.getLogs);
  router.get('/api/admin/operation-logs/stats', app.middleware.auth(), controller.operationLog.getLogStats);
  router.get('/api/admin/operation-logs/export', app.middleware.auth(), controller.operationLog.exportLogs);
  router.delete('/api/admin/operation-logs/cleanup', app.middleware.auth(), controller.operationLog.cleanupLogs);
  router.get('/api/admin/operation-logs/user/:userId', app.middleware.auth(), controller.operationLog.getUserOperationHistory);
  router.get('/api/admin/operation-logs/operations', app.middleware.auth(), controller.operationLog.getOperationTypes);
  router.get('/api/admin/operation-logs/targets', app.middleware.auth(), controller.operationLog.getTargetTypes);

  // 管理员端裁判员管理API（临时移除认证，用于测试）
  // 注意：具体路径必须放在参数路径之前，避免路由匹配冲突
  router.get('/api/admin/judges/available-events', controller.judgeAdmin.getAvailableEvents);
  router.get('/api/admin/judges/work-stats', controller.judgeAdmin.getJudgeWorkStats);
  router.post('/api/admin/judges/assign-event', controller.judgeAdmin.assignJudgeToEvent);
  router.post('/api/admin/judges/batch-assign', controller.judgeAdmin.batchAssignJudges);

  router.get('/api/admin/judges', controller.judgeAdmin.getJudgeList);
  router.get('/api/admin/judges/:judgeId', controller.judgeAdmin.getJudgeDetail);
  router.post('/api/admin/judges', controller.judgeAdmin.createJudge);
  router.put('/api/admin/judges/:judgeId', controller.judgeAdmin.updateJudge);
  router.delete('/api/admin/judges/:judgeId', controller.judgeAdmin.deleteJudge);
  router.put('/api/admin/judges/:judgeId/status', controller.judgeAdmin.toggleJudgeStatus);

  // 管理员端裁判员赛事分配API（临时移除认证，用于测试）
  router.get('/api/admin/judges/:judgeId/assignments', controller.judgeAdmin.getJudgeAssignments);
  router.delete('/api/admin/judges/assignments/:assignmentId', controller.judgeAdmin.cancelJudgeAssignment);

  // 裁判员专用API
  router.get('/api/judge/profile', app.middleware.auth(), controller.judge.getProfile);
  router.put('/api/judge/profile', app.middleware.auth(), controller.judge.updateProfile);
  router.get('/api/judge/stats', app.middleware.auth(), controller.judge.getStats);
  router.put('/api/judge/password', app.middleware.auth(), controller.judge.changePassword);
  router.get('/api/judge/events', app.middleware.auth(), controller.judge.getAssignedEvents);
  router.get('/api/judge/events/:scheduleId/participants', app.middleware.auth(), controller.judge.getEventParticipants);
  router.get('/api/judge/events/:scheduleId/scores', app.middleware.auth(), controller.judge.getEventScores);
  router.post('/api/judge/scores', app.middleware.auth(), controller.judge.createScore);
  router.put('/api/judge/scores/:scoreId', app.middleware.auth(), controller.judge.updateScore);
  router.delete('/api/judge/scores/:scoreId', app.middleware.auth(), controller.judge.deleteScore);

  // 运动员管理
  router.get('/players', controller.player.index);
  router.post('/players', controller.player.create);
  router.put('/players/:id', controller.player.update);
  router.delete('/players/:id', controller.player.destory);

  // 管理员管理
  router.get('/admins', controller.admin.index);
  router.post('/admins', controller.admin.create);
  router.put('/admins/:id', controller.admin.update);
  router.delete('/admins/:id', controller.admin.destory);

  // 项目管理
  router.get('/projects', controller.project.index);
  router.post('/projects', controller.project.create);
  router.put('/projects/:id', controller.project.update);
  router.delete('/projects/:id', controller.project.destory);

  // 赛程管理
  router.get('/competitions', controller.competition.index);
  router.post('/competitions', controller.competition.create);
  router.put('/competitions/aiplan', controller.competition.plan);
  router.put('/competitions/:id', controller.competition.update);
  router.delete('/competitions/:id', controller.competition.destory);

  // 参赛管理
  router.get('/plogs', controller.plog.index);
  router.post('/plogs', controller.plog.create);
  router.put('/plogs/:id', controller.plog.update);
  router.delete('/plogs/:id', controller.plog.destory);

  router.get('/test', controller.competition.weather);
};

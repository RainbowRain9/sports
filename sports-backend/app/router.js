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

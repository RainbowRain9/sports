import { demo } from './adapter';

export const getPing = async () => await demo.get('./ping');

// 登陆模块（原有接口，保持兼容）
export const postLogin = async data => await demo.post('/login', data);

// 新的多角色认证API
export const authLogin = async data => await demo.post('/api/auth/login', data);
export const authLogout = async () => await demo.post('/api/auth/logout');
export const authProfile = async () => await demo.get('/api/auth/profile');
export const authVerify = async token => await demo.post('/api/auth/verify', { token });
export const authCheckPermission = async permission => await demo.post('/api/auth/check-permission', { permission });

// 运动员自助系统API
export const getPlayerProfile = async () => await demo.get('/api/player/profile');
export const updatePlayerProfile = async data => await demo.put('/api/player/profile', data);
export const getPlayerStats = async () => await demo.get('/api/player/stats');
export const changePlayerPassword = async data => await demo.put('/api/player/password', data);
export const getPlayerScores = async params => await demo.get('/api/player/scores', { params });

// 报名管理API
export const getAvailableEvents = async () => await demo.get('/api/registration/available-events');
export const createRegistration = async data => await demo.post('/api/registration/register', data);
export const getMyRegistrations = async params => await demo.get('/api/registration/my-registrations', { params });
export const cancelRegistration = async registrationId => await demo.delete(`/api/registration/${registrationId}`);
export const checkRegistrationLimits = async data => await demo.post('/api/registration/check-limits', data);

// 管理员报名审核API
export const getPendingRegistrations = async params => await demo.get('/api/admin/registrations/pending', { params });
export const batchReviewRegistrations = async data => await demo.post('/api/admin/registrations/batch-review', data);
export const reviewRegistration = async (registrationId, data) => await demo.put(`/api/admin/registrations/${registrationId}/review`, data);
export const getRegistrationStats = async params => await demo.get('/api/admin/registrations/stats', { params });
export const getReviewHistory = async params => await demo.get('/api/admin/registrations/history', { params });
export const exportRegistrations = async params => await demo.get('/api/admin/registrations/export', { params });

// 系统配置管理API
export const getSystemConfigs = async params => await demo.get('/api/admin/system/config', { params });
export const getPublicConfigs = async () => await demo.get('/api/system/config/public');
export const getSystemConfig = async configKey => await demo.get(`/api/admin/system/config/${configKey}`);
export const createSystemConfig = async data => await demo.post('/api/admin/system/config', data);
export const updateSystemConfig = async (configKey, data) => await demo.put(`/api/admin/system/config/${configKey}`, data);
export const deleteSystemConfig = async configKey => await demo.delete(`/api/admin/system/config/${configKey}`);
export const batchUpdateSystemConfigs = async data => await demo.put('/api/admin/system/config/batch', data);

// 系统通知API
export const getNotifications = async params => await demo.get('/api/notifications', { params });
export const getUnreadCount = async () => await demo.get('/api/notifications/unread-count');
export const markNotificationAsRead = async notificationId => await demo.put(`/api/notifications/${notificationId}/read`);
export const batchMarkAsRead = async data => await demo.put('/api/notifications/batch-read', data);
export const markAllAsRead = async () => await demo.put('/api/notifications/mark-all-read');
export const deleteNotification = async notificationId => await demo.delete(`/api/notifications/${notificationId}`);
export const sendNotification = async data => await demo.post('/api/admin/notifications/send', data);
export const getNotificationStats = async params => await demo.get('/api/admin/notifications/stats', { params });

// 操作日志API
export const getOperationLogs = async params => await demo.get('/api/admin/operation-logs', { params });
export const getOperationLogStats = async params => await demo.get('/api/admin/operation-logs/stats', { params });
export const exportOperationLogs = async params => await demo.get('/api/admin/operation-logs/export', { params });
export const cleanupOperationLogs = async data => await demo.delete('/api/admin/operation-logs/cleanup', { data });
export const getUserOperationHistory = async (userId, params) => await demo.get(`/api/admin/operation-logs/user/${userId}`, { params });
export const getOperationTypes = async () => await demo.get('/api/admin/operation-logs/operations');
export const getTargetTypes = async () => await demo.get('/api/admin/operation-logs/targets');

// 裁判员专用API
export const getJudgeProfile = async () => await demo.get('/api/judge/profile');
export const updateJudgeProfile = async data => await demo.put('/api/judge/profile', data);
export const getJudgeStats = async () => await demo.get('/api/judge/stats');
export const changeJudgePassword = async data => await demo.put('/api/judge/password', data);
export const getJudgeAssignedEvents = async params => await demo.get('/api/judge/events', { params });
export const getEventParticipants = async scheduleId => await demo.get(`/api/judge/events/${scheduleId}/participants`);
export const getEventScores = async scheduleId => await demo.get(`/api/judge/events/${scheduleId}/scores`);
export const createScore = async data => await demo.post('/api/judge/scores', data);
export const updateScore = async (scoreId, data) => await demo.put(`/api/judge/scores/${scoreId}`, data);
export const deleteScore = async scoreId => await demo.delete(`/api/judge/scores/${scoreId}`);

// 项目管理模块
export const getProjects = async params =>
  await demo.get('/projects', { params });
export const postProjects = async data => await demo.post('/projects', data);
export const putProjects = async (id, data) =>
  await demo.put(`/projects/${id}`, data);
export const deleteProjects = async id => await demo.delete(`/projects/${id}`);

// 赛程管理模块
export const getCompetitions = async params =>
  await demo.get('/competitions', { params });
export const postCompetitions = async data =>
  await demo.post('/competitions', data);
export const putCompetitions = async (id, data) =>
  await demo.put(`/competitions/${id}`, data);

export const putPlans = async data =>
  await demo.put('/competitions/aiplan', data);
export const deleteCompetitions = async id =>
  await demo.delete(`/competitions/${id}`);

// 运动员管理模块
export const getPlayers = async params =>
  await demo.get('/players', {
    params
  });
export const postPlayers = async data => await demo.post('/players', data);
export const putPlayers = async (id, data) =>
  await demo.put(`/players/${id}`, data);
export const deletePlayers = async id => await demo.delete(`/players/${id}`);

// 管理员管理模块
export const getAdmins = async params => await demo.get('/admins', { params });
export const postAdmins = async data => await demo.post('/admins', data);
export const putAdmins = async (id, data) =>
  await demo.put(`/admins/${id}`, data);
export const deleteAdmins = async id => await demo.delete(`/admins/${id}`);

// 参赛管理模块
export const getPlogs = async params => await demo.get('/plogs', { params });
export const postPlogs = async data => await demo.post('/plogs', data);
export const putPlogs = async (id, data) =>
  await demo.put(`/plogs/${id}`, data);
export const deletePlogs = async id => await demo.delete(`/plogs/${id}`);

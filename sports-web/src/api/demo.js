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

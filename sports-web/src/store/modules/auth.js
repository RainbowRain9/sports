/**
 * 认证状态管理模块
 * 管理用户登录状态、Token、权限等
 */

const state = {
  // 认证状态
  isAuthenticated: false,
  
  // Token信息
  token: localStorage.getItem('auth_token') || '',
  refreshToken: localStorage.getItem('refresh_token') || '',
  
  // 用户信息
  user: JSON.parse(localStorage.getItem('user_info') || 'null'),
  
  // 权限列表
  permissions: JSON.parse(localStorage.getItem('user_permissions') || '[]'),
  
  // 登录时间
  loginTime: localStorage.getItem('login_time') || null
};

const getters = {
  // 是否已登录
  isLoggedIn: state => !!state.token && !!state.user,
  
  // 用户类型
  userType: state => state.user ? state.user.userType : null,
  
  // 用户名
  username: state => state.user ? state.user.username : '',
  
  // 用户姓名
  userName: state => state.user ? state.user.name : '',
  
  // 角色子类型（管理员类型、班级、专业等）
  roleSubType: state => state.user ? state.user.roleSubType : '',
  
  // 检查是否有特定权限
  hasPermission: state => permission => {
    return state.permissions.includes(permission);
  },
  
  // 检查是否是管理员
  isAdmin: state => {
    return state.user && state.user.userType === 'admin' && state.user.roleSubType === '2';
  },
  
  // 检查是否是操作员
  isOperator: state => {
    return state.user && state.user.userType === 'admin' && state.user.roleSubType === '1';
  },
  
  // 检查是否是运动员
  isPlayer: state => {
    return state.user && state.user.userType === 'player';
  },
  
  // 检查是否是裁判员
  isJudge: state => {
    return state.user && state.user.userType === 'judge';
  }
};

const mutations = {
  // 设置认证状态
  SET_AUTH_STATUS(state, status) {
    state.isAuthenticated = status;
  },
  
  // 设置Token
  SET_TOKEN(state, token) {
    state.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  },
  
  // 设置刷新Token
  SET_REFRESH_TOKEN(state, refreshToken) {
    state.refreshToken = refreshToken;
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }
  },
  
  // 设置用户信息
  SET_USER(state, user) {
    state.user = user;
    if (user) {
      localStorage.setItem('user_info', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_info');
    }
  },
  
  // 设置权限列表
  SET_PERMISSIONS(state, permissions) {
    state.permissions = permissions;
    localStorage.setItem('user_permissions', JSON.stringify(permissions));
  },
  
  // 设置登录时间
  SET_LOGIN_TIME(state, time) {
    state.loginTime = time;
    if (time) {
      localStorage.setItem('login_time', time);
    } else {
      localStorage.removeItem('login_time');
    }
  },
  
  // 清除所有认证信息
  CLEAR_AUTH(state) {
    state.isAuthenticated = false;
    state.token = '';
    state.refreshToken = '';
    state.user = null;
    state.permissions = [];
    state.loginTime = null;
    
    // 清除localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('login_time');
  },
  
  // 兼容原有的mutations（保持向后兼容）
  SET_ADMIN_TYPE(state, adminType) {
    if (state.user) {
      state.user.roleSubType = adminType;
      localStorage.setItem('user_info', JSON.stringify(state.user));
    }
  },
  
  SET_USER_NAME(state, userName) {
    if (state.user) {
      state.user.name = userName;
      localStorage.setItem('user_info', JSON.stringify(state.user));
    }
  }
};

const actions = {
  // 登录
  async login({ commit }, { token, refreshToken, user }) {
    try {
      // 设置认证信息
      commit('SET_TOKEN', token);
      commit('SET_REFRESH_TOKEN', refreshToken);
      commit('SET_USER', user);
      commit('SET_AUTH_STATUS', true);
      commit('SET_LOGIN_TIME', new Date().toISOString());
      
      // 获取用户权限（这里可以调用API获取）
      // const permissions = await this.$api.getUserPermissions();
      // commit('SET_PERMISSIONS', permissions);
      
      return { success: true };
    } catch (error) {
      console.error('登录状态保存失败:', error);
      return { success: false, message: '登录状态保存失败' };
    }
  },
  
  // 登出
  async logout({ commit }) {
    try {
      // 可以在这里调用API通知服务器登出
      // await this.$api.logout();
      
      // 清除本地状态
      commit('CLEAR_AUTH');
      
      return { success: true };
    } catch (error) {
      console.error('登出失败:', error);
      // 即使API调用失败，也要清除本地状态
      commit('CLEAR_AUTH');
      return { success: false, message: '登出失败' };
    }
  },
  
  // 刷新Token
  async refreshToken({ commit, state }) {
    try {
      if (!state.refreshToken) {
        throw new Error('没有刷新Token');
      }
      
      // 调用API刷新Token
      // const result = await this.$api.refreshToken(state.refreshToken);
      // commit('SET_TOKEN', result.token);
      
      return { success: true };
    } catch (error) {
      console.error('Token刷新失败:', error);
      // Token刷新失败，清除认证状态
      commit('CLEAR_AUTH');
      return { success: false };
    }
  },
  
  // 验证Token有效性
  async validateToken({ commit, state }) {
    try {
      if (!state.token) {
        return { success: false, message: '没有Token' };
      }
      
      // 调用API验证Token
      // const result = await this.$api.validateToken(state.token);
      
      return { success: true };
    } catch (error) {
      console.error('Token验证失败:', error);
      commit('CLEAR_AUTH');
      return { success: false };
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};

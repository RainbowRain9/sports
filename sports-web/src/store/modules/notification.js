/**
 * 通知模块 - Vuex Store
 */

const state = {
  // 未读通知数量
  unreadCount: 0,
  
  // 通知列表
  notifications: [],
  
  // 最后更新时间
  lastUpdateTime: null,
  
  // 自动刷新定时器ID
  refreshTimer: null
};

const mutations = {
  // 设置未读通知数量
  SET_UNREAD_COUNT(state, count) {
    state.unreadCount = count;
  },
  
  // 设置通知列表
  SET_NOTIFICATIONS(state, notifications) {
    state.notifications = notifications;
  },
  
  // 添加新通知
  ADD_NOTIFICATION(state, notification) {
    state.notifications.unshift(notification);
    if (notification.status === 0) {
      state.unreadCount++;
    }
  },
  
  // 更新通知状态
  UPDATE_NOTIFICATION_STATUS(state, { notificationId, status }) {
    const notification = state.notifications.find(n => n.notification_id === notificationId);
    if (notification) {
      const oldStatus = notification.status;
      notification.status = status;
      
      // 更新未读数量
      if (oldStatus === 0 && status === 1) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      } else if (oldStatus === 1 && status === 0) {
        state.unreadCount++;
      }
    }
  },
  
  // 删除通知
  REMOVE_NOTIFICATION(state, notificationId) {
    const index = state.notifications.findIndex(n => n.notification_id === notificationId);
    if (index !== -1) {
      const notification = state.notifications[index];
      if (notification.status === 0) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications.splice(index, 1);
    }
  },
  
  // 全部标记为已读
  MARK_ALL_AS_READ(state) {
    state.notifications.forEach(notification => {
      notification.status = 1;
    });
    state.unreadCount = 0;
  },
  
  // 设置最后更新时间
  SET_LAST_UPDATE_TIME(state, time) {
    state.lastUpdateTime = time;
  },
  
  // 设置刷新定时器
  SET_REFRESH_TIMER(state, timerId) {
    state.refreshTimer = timerId;
  },
  
  // 清除刷新定时器
  CLEAR_REFRESH_TIMER(state) {
    if (state.refreshTimer) {
      clearInterval(state.refreshTimer);
      state.refreshTimer = null;
    }
  }
};

const actions = {
  // 获取未读通知数量
  async fetchUnreadCount({ commit, rootGetters }) {
    try {
      // 检查用户是否已登录
      if (!rootGetters['auth/isLoggedIn']) {
        console.log('用户未登录，跳过获取未读通知数量');
        return 0;
      }

      const response = await this._vm.$http.get('/api/notifications/unread-count');
      if (response.success) {
        commit('SET_UNREAD_COUNT', response.data.count);
        commit('SET_LAST_UPDATE_TIME', new Date());
        return response.data.count;
      }
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      // 如果是401错误，说明认证失败，清除通知数据
      if (error.response && error.response.status === 401) {
        commit('SET_UNREAD_COUNT', 0);
        console.log('认证失败，清除通知数据');
      }
    }
    return 0;
  },
  
  // 获取通知列表
  async fetchNotifications({ commit, rootGetters }, params = {}) {
    try {
      // 检查用户是否已登录
      if (!rootGetters['auth/isLoggedIn']) {
        console.log('用户未登录，跳过获取通知列表');
        return { list: [], total: 0, unreadCount: 0 };
      }

      const response = await this._vm.$http.get('/api/notifications', { params });
      if (response.success) {
        commit('SET_NOTIFICATIONS', response.data.list || []);
        commit('SET_UNREAD_COUNT', response.data.unreadCount || 0);
        commit('SET_LAST_UPDATE_TIME', new Date());
        return response.data;
      }
    } catch (error) {
      console.error('获取通知列表失败:', error);
      // 如果是401错误，说明认证失败，清除通知数据
      if (error.response && error.response.status === 401) {
        commit('SET_NOTIFICATIONS', []);
        commit('SET_UNREAD_COUNT', 0);
        console.log('认证失败，清除通知数据');
      }
    }
    return { list: [], total: 0, unreadCount: 0 };
  },
  
  // 标记通知为已读
  async markAsRead({ commit }, notificationId) {
    try {
      const response = await this._vm.$http.put(`/api/notifications/${notificationId}/read`);
      if (response.success) {
        commit('UPDATE_NOTIFICATION_STATUS', { notificationId, status: 1 });
        return true;
      }
    } catch (error) {
      console.error('标记通知已读失败:', error);
    }
    return false;
  },
  
  // 标记通知为未读
  async markAsUnread({ commit }, notificationId) {
    try {
      const response = await this._vm.$http.put(`/api/notifications/${notificationId}/unread`);
      if (response.success) {
        commit('UPDATE_NOTIFICATION_STATUS', { notificationId, status: 0 });
        return true;
      }
    } catch (error) {
      console.error('标记通知未读失败:', error);
    }
    return false;
  },
  
  // 删除通知
  async deleteNotification({ commit }, notificationId) {
    try {
      const response = await this._vm.$http.delete(`/api/notifications/${notificationId}`);
      if (response.success) {
        commit('REMOVE_NOTIFICATION', notificationId);
        return true;
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
    return false;
  },
  
  // 全部标记为已读
  async markAllAsRead({ commit }) {
    try {
      const response = await this._vm.$http.put('/api/notifications/mark-all-read');
      if (response.success) {
        commit('MARK_ALL_AS_READ');
        return true;
      }
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
    return false;
  },
  
  // 开始自动刷新
  startAutoRefresh({ dispatch, commit, state, rootGetters }) {
    // 清除现有定时器
    if (state.refreshTimer) {
      clearInterval(state.refreshTimer);
    }

    // 设置新的定时器，每30秒刷新一次
    const timerId = setInterval(() => {
      // 只有在用户已登录时才刷新
      if (rootGetters['auth/isLoggedIn']) {
        dispatch('fetchUnreadCount');
      }
    }, 30000);

    commit('SET_REFRESH_TIMER', timerId);
  },
  
  // 停止自动刷新
  stopAutoRefresh({ commit }) {
    commit('CLEAR_REFRESH_TIMER');
  },
  
  // 初始化通知模块
  async initNotifications({ dispatch, rootGetters }) {
    // 检查用户是否已登录
    if (rootGetters['auth/isLoggedIn']) {
      await dispatch('fetchUnreadCount');
      dispatch('startAutoRefresh');
    }
  },
  
  // 清理通知模块
  cleanup({ commit }) {
    commit('CLEAR_REFRESH_TIMER');
    commit('SET_UNREAD_COUNT', 0);
    commit('SET_NOTIFICATIONS', []);
    commit('SET_LAST_UPDATE_TIME', null);
  }
};

const getters = {
  // 获取未读通知数量
  unreadCount: state => state.unreadCount,
  
  // 获取通知列表
  notifications: state => state.notifications,
  
  // 获取最后更新时间
  lastUpdateTime: state => state.lastUpdateTime,
  
  // 是否有未读通知
  hasUnreadNotifications: state => state.unreadCount > 0,
  
  // 获取未读通知列表
  unreadNotifications: state => state.notifications.filter(n => n.status === 0),
  
  // 获取重要通知数量
  importantNotificationsCount: state => state.notifications.filter(n => n.priority >= 2).length,
  
  // 获取今日通知数量
  todayNotificationsCount: state => {
    const today = new Date().toDateString();
    return state.notifications.filter(n => {
      const notificationDate = new Date(n.created_at).toDateString();
      return notificationDate === today;
    }).length;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};

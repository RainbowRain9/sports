/**
 * axios
 * api: https://github.com/axios/axios
 */

import axios from 'axios';
import { domains } from '@/config';
import store from '@/store';

const getInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: true
  });

  // 请求拦截器 - 自动添加Token
  instance.interceptors.request.use(
    (config) => {
      const token = store.getters['auth/token'] || store.state.auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response = {}) => {
      const { data } = response;

      // 新API格式（/api/auth/*、/api/admin/*）
      if (data.success !== undefined) {
        // 直接返回数据，保持前端代码的一致性
        return data;
      }

      // 原有API格式（兼容）
      const { code, data: responseData } = data;
      if (code === 200) {
        return responseData;
      }
      return Promise.reject(data);
    },
    (error) => {
      // 处理401未授权错误
      if (error.response && error.response.status === 401) {
        // 清除认证信息并跳转到登录页
        store.dispatch('auth/logout');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const demo = getInstance(domains.demo);

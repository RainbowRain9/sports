/**
 * 权限检查工具函数
 */

import store from '@/store';

/**
 * 检查用户是否有特定权限
 * @param {string} permission - 权限标识
 * @returns {boolean}
 */
export function hasPermission(permission) {
  return store.getters['auth/hasPermission'](permission);
}

/**
 * 检查用户是否是管理员
 * @returns {boolean}
 */
export function isAdmin() {
  return store.getters['auth/isAdmin'];
}

/**
 * 检查用户是否是操作员
 * @returns {boolean}
 */
export function isOperator() {
  return store.getters['auth/isOperator'];
}

/**
 * 检查用户是否是运动员
 * @returns {boolean}
 */
export function isPlayer() {
  return store.getters['auth/isPlayer'];
}

/**
 * 检查用户是否是裁判员
 * @returns {boolean}
 */
export function isJudge() {
  return store.getters['auth/isJudge'];
}

/**
 * 检查用户是否有指定角色
 * @param {string|Array} roles - 角色或角色数组
 * @returns {boolean}
 */
export function hasRole(roles) {
  const userType = store.getters['auth/userType'];
  const roleSubType = store.getters['auth/roleSubType'];
  
  // 将用户类型转换为角色
  let userRole = userType;
  if (userType === 'admin') {
    userRole = roleSubType === '2' ? 'admin' : 'operator';
  }
  
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  return userRole === roles;
}

/**
 * 权限指令 - 用于v-permission
 * 使用方法: <div v-permission="'user:manage'">管理员可见</div>
 */
export const permissionDirective = {
  inserted(el, binding) {
    const { value } = binding;
    
    if (value) {
      const hasAuth = hasPermission(value);
      if (!hasAuth) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    }
  }
};

/**
 * 角色指令 - 用于v-role
 * 使用方法: <div v-role="'admin'">管理员可见</div>
 */
export const roleDirective = {
  inserted(el, binding) {
    const { value } = binding;
    
    if (value) {
      const hasAuth = hasRole(value);
      if (!hasAuth) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    }
  }
};

/**
 * 权限混入 - 在组件中使用
 */
export const permissionMixin = {
  methods: {
    $hasPermission: hasPermission,
    $hasRole: hasRole,
    $isAdmin: isAdmin,
    $isOperator: isOperator,
    $isPlayer: isPlayer,
    $isJudge: isJudge
  }
};

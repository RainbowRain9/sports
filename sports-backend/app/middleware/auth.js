'use strict';

/**
 * 认证中间件
 * 验证用户身份和权限
 */
module.exports = (options = {}) => {
  return async function auth(ctx, next) {
    
    // 获取Token
    let token = ctx.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7); // 移除 'Bearer ' 前缀
    }
    
    if (!token) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        code: 401,
        message: '缺少认证Token'
      };
      return;
    }
    
    try {
      // 验证Token
      const user = await ctx.service.auth.validateToken(token);
      
      if (!user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: 'Token无效或已过期'
        };
        return;
      }
      
      // 将用户信息添加到上下文
      ctx.user = user;
      
      // 如果指定了角色要求，检查用户角色
      if (options.userType) {
        const allowedTypes = Array.isArray(options.userType) ? options.userType : [options.userType];
        
        if (!allowedTypes.includes(user.userType)) {
          ctx.status = 403;
          ctx.body = {
            success: false,
            code: 403,
            message: '权限不足：角色不匹配'
          };
          return;
        }
      }
      
      // 如果指定了权限要求，检查用户权限
      if (options.permission) {
        const hasPermission = await ctx.service.auth.checkPermission(
          user.userId,
          user.userType,
          options.permission
        );
        
        if (!hasPermission) {
          ctx.status = 403;
          ctx.body = {
            success: false,
            code: 403,
            message: `权限不足：缺少 ${options.permission} 权限`
          };
          return;
        }
      }
      
      // 继续执行下一个中间件
      await next();
      
    } catch (error) {
      ctx.logger.error('认证中间件异常:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '认证服务异常'
      };
    }
  };
};

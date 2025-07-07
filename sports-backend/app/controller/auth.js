'use strict';

const Controller = require('egg').Controller;

class AuthController extends Controller {
  
  /**
   * 多角色统一登录接口
   * POST /api/auth/login
   * Body: { userType: 'admin|player|judge', username: '', password: '' }
   */
  async login() {
    const { ctx } = this;
    
    try {
      // 参数验证
      const { userType, username, password } = ctx.request.body;
      
      if (!userType || !username || !password) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '用户类型、用户名和密码不能为空'
        };
        return;
      }
      
      // 验证用户类型
      const validUserTypes = ['admin', 'player', 'judge'];
      if (!validUserTypes.includes(userType)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '无效的用户类型'
        };
        return;
      }
      
      // 调用认证服务
      const result = await ctx.service.auth.login({
        userType,
        username: username.trim(),
        password: password.trim()
      });
      
      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '登录成功',
          data: result.data
        };
      } else {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: result.message
        };
      }
      
    } catch (error) {
      ctx.logger.error('登录接口异常:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 登出接口
   * POST /api/auth/logout
   */
  async logout() {
    const { ctx } = this;
    
    try {
      const sessionId = ctx.user ? ctx.user.sessionId : null;
      
      const result = await ctx.service.auth.logout(sessionId);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        message: result.message
      };
      
    } catch (error) {
      ctx.logger.error('登出接口异常:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '登出失败'
      };
    }
  }
  
  /**
   * 获取当前用户信息
   * GET /api/auth/profile
   */
  async profile() {
    const { ctx } = this;
    
    try {
      if (!ctx.user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: '未登录'
        };
        return;
      }
      
      // 获取用户权限
      const permissions = await ctx.service.auth.getUserPermissions(
        ctx.user.userId,
        ctx.user.userType
      );
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: {
          user: {
            id: ctx.user.userId,
            username: ctx.user.username,
            name: ctx.user.name,
            userType: ctx.user.userType,
            roleSubType: ctx.user.roleSubType
          },
          permissions
        }
      };
      
    } catch (error) {
      ctx.logger.error('获取用户信息异常:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '获取用户信息失败'
      };
    }
  }
  
  /**
   * Token验证接口
   * POST /api/auth/verify
   */
  async verify() {
    const { ctx } = this;
    
    try {
      const { token } = ctx.request.body;
      
      if (!token) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: 'Token不能为空'
        };
        return;
      }
      
      const user = await ctx.service.auth.validateToken(token);
      
      if (user) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: 'Token有效',
          data: {
            user: {
              id: user.userId,
              username: user.username,
              name: user.name,
              userType: user.userType,
              roleSubType: user.roleSubType
            }
          }
        };
      } else {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: 'Token无效或已过期'
        };
      }
      
    } catch (error) {
      ctx.logger.error('Token验证异常:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: 'Token验证失败'
      };
    }
  }
  
  /**
   * 权限检查接口
   * POST /api/auth/check-permission
   */
  async checkPermission() {
    const { ctx } = this;
    
    try {
      if (!ctx.user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          code: 401,
          message: '未登录'
        };
        return;
      }
      
      const { permission } = ctx.request.body;
      
      if (!permission) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '权限标识不能为空'
        };
        return;
      }
      
      const hasPermission = await ctx.service.auth.checkPermission(
        ctx.user.userId,
        ctx.user.userType,
        permission
      );
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: {
          hasPermission,
          permission
        }
      };
      
    } catch (error) {
      ctx.logger.error('权限检查异常:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '权限检查失败'
      };
    }
  }
}

module.exports = AuthController;

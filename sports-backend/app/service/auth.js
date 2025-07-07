'use strict';

const Service = require('egg').Service;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class AuthService extends Service {
  
  /**
   * 多角色统一登录
   * @param {Object} data - 登录数据
   * @param {string} data.userType - 用户类型：admin/player/judge
   * @param {string} data.username - 用户名
   * @param {string} data.password - 密码
   */
  async login(data) {
    const { userType, username, password } = data;
    
    try {
      // 根据用户类型查询用户信息
      const user = await this.getUserByType(userType, username);
      
      if (!user) {
        return { success: false, message: '用户不存在' };
      }
      
      // 验证密码
      const isPasswordValid = await this.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: '密码错误' };
      }
      
      // 检查账号状态
      if (user.status === 0) {
        return { success: false, message: '账号已被禁用' };
      }
      
      // 生成JWT Token
      const tokenData = await this.generateToken(user, userType);
      
      // 保存会话信息
      await this.saveSession(tokenData);
      
      return {
        success: true,
        data: {
          token: tokenData.token,
          refreshToken: tokenData.refreshToken,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            userType,
            roleSubType: user.roleSubType
          }
        }
      };
      
    } catch (error) {
      this.logger.error('登录失败:', error);
      return { success: false, message: '登录失败，请稍后重试' };
    }
  }
  
  /**
   * 根据用户类型获取用户信息
   */
  async getUserByType(userType, username) {
    const { app } = this;
    
    switch (userType) {
      case 'admin':
        const admin = await app.mysql.get('admin', { admin_username: username });
        return admin ? {
          id: admin.admin_id,
          username: admin.admin_username,
          password: admin.admin_password,
          name: admin.admin_name,
          status: 1, // admin表暂无status字段，默认启用
          roleSubType: admin.admin_type
        } : null;
        
      case 'player':
        const player = await app.mysql.get('player', { player_username: username });
        return player ? {
          id: player.player_id,
          username: player.player_username,
          password: player.player_password,
          name: player.player_name,
          status: player.player_status || 1,
          roleSubType: player.player_class
        } : null;
        
      case 'judge':
        const judge = await app.mysql.get('judge', { judge_username: username });
        return judge ? {
          id: judge.judge_id,
          username: judge.judge_username,
          password: judge.judge_password,
          name: judge.judge_name,
          status: judge.judge_status || 1,
          roleSubType: judge.judge_specialty
        } : null;
        
      default:
        return null;
    }
  }
  
  /**
   * 验证密码
   */
  async verifyPassword(inputPassword, storedPassword) {
    // 如果存储的密码是明文（兼容现有数据），直接比较
    if (inputPassword === storedPassword) {
      return true;
    }
    
    // 如果是加密密码，使用bcrypt验证
    try {
      return await bcrypt.compare(inputPassword, storedPassword);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 生成JWT Token
   */
  async generateToken(user, userType) {
    const { app } = this;
    const sessionId = uuidv4();
    const refreshToken = uuidv4();
    
    const payload = {
      sessionId,
      userId: user.id,
      userType,
      username: user.username,
      name: user.name,
      roleSubType: user.roleSubType
    };
    
    // 生成访问Token（2小时有效）
    const token = jwt.sign(payload, app.config.jwt.secret, {
      expiresIn: app.config.jwt.expiresIn || '2h'
    });
    
    // 计算过期时间
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2小时后
    
    return {
      sessionId,
      token,
      refreshToken,
      expiresAt,
      userId: user.id,
      userType
    };
  }
  
  /**
   * 保存会话信息
   */
  async saveSession(tokenData) {
    const { app } = this;
    
    // 删除该用户的旧会话
    await app.mysql.delete('user_session', {
      user_id: tokenData.userId,
      user_type: tokenData.userType
    });
    
    // 保存新会话
    await app.mysql.insert('user_session', {
      session_id: tokenData.sessionId,
      user_id: tokenData.userId,
      user_type: tokenData.userType,
      token: tokenData.token,
      refresh_token: tokenData.refreshToken,
      expires_at: tokenData.expiresAt
    });
  }
  
  /**
   * 验证Token
   */
  async validateToken(token) {
    const { app } = this;
    
    try {
      // 验证JWT Token
      const decoded = jwt.verify(token, app.config.jwt.secret);
      
      // 检查会话是否存在
      const session = await app.mysql.get('user_session', {
        session_id: decoded.sessionId,
        token
      });
      
      if (!session) {
        return null;
      }
      
      // 检查是否过期
      if (new Date() > new Date(session.expires_at)) {
        await app.mysql.delete('user_session', { session_id: decoded.sessionId });
        return null;
      }
      
      // 更新最后活跃时间
      await app.mysql.update('user_session', 
        { last_active: new Date() },
        { where: { session_id: decoded.sessionId } }
      );
      
      return decoded;
      
    } catch (error) {
      this.logger.error('Token验证失败:', error);
      return null;
    }
  }
  
  /**
   * 登出
   */
  async logout(sessionId) {
    const { app } = this;
    
    if (sessionId) {
      await app.mysql.delete('user_session', { session_id: sessionId });
    }
    
    return { success: true, message: '登出成功' };
  }
  
  /**
   * 检查用户权限
   */
  async checkPermission(userId, userType, permission) {
    const { app } = this;
    
    // 获取角色类型
    let roleType = userType;
    if (userType === 'admin') {
      // 管理员需要区分admin和operator
      const admin = await app.mysql.get('admin', { admin_id: userId });
      roleType = admin && admin.admin_type === '2' ? 'admin' : 'operator';
    }
    
    // 查询权限
    const rolePermission = await app.mysql.get('role_permission', {
      role_type: roleType,
      permission
    });
    
    return !!rolePermission;
  }
  
  /**
   * 获取用户权限列表
   */
  async getUserPermissions(userId, userType) {
    const { app } = this;
    
    let roleType = userType;
    if (userType === 'admin') {
      const admin = await app.mysql.get('admin', { admin_id: userId });
      roleType = admin && admin.admin_type === '2' ? 'admin' : 'operator';
    }
    
    const permissions = await app.mysql.select('role_permission', {
      where: { role_type: roleType }
    });
    
    return permissions.map(p => p.permission);
  }
}

module.exports = AuthService;

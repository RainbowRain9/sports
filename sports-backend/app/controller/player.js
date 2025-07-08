'use strict';
// 运动员管理

const Controller = require('egg').Controller;

class PlayerController extends Controller {
  async index() {
    const { ctx } = this;
    try {
      const result = await ctx.service.player.index(ctx.query);
      ctx.status = 200;
      ctx.body = {
        code: 200,
        data: result,
      };
    } catch (error) {
      console.log(error);
      ctx.status = 500;
      ctx.body = {
        code: -2,
        data: '获取失败',
      };
    }
  }

  async create() {
    const { ctx } = this;
    try {
      const result = await ctx.service.player.create(ctx.request.body);
      if (result) {
        ctx.status = 200;
        ctx.body = {
          code: 200,
          data: '添加成功',
        };
      } else {
        ctx.status = 403;
        ctx.body = {
          code: -1,
          data: '该赛程已经存在',
        };
      }
    } catch (error) {
      console.log(error);
      ctx.status = 500;
      ctx.body = {
        code: -2,
        data: '添加失败',
      };
    }
  }

  async update() {
    const { ctx } = this;
    try {
      await ctx.service.player.update(ctx.request.body);
      ctx.status = 200;
      ctx.body = {
        code: 200,
        data: '修改成功',
      };
    } catch (error) {
      console.log(error);
      ctx.status = 500;
      ctx.body = {
        code: -2,
        data: '修改失败',
      };
    }
  }

  async destory() {
    const { ctx } = this;
    try {
      await ctx.service.player.destory(ctx.params.id);
      ctx.status = 200;
      ctx.body = {
        code: 200,
        data: '删除成功',
      };
    } catch (error) {
      console.log(error);
      ctx.status = 500;
      ctx.body = {
        code: -2,
        data: '删除失败',
      };
    }
  }

  // ==================== 运动员自助功能 ====================

  /**
   * 获取运动员个人信息
   * GET /api/player/profile
   */
  async getProfile() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }

      const playerId = ctx.user.userId;
      const profile = await ctx.service.player.getProfile(playerId);

      if (!profile) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          code: 404,
          message: '运动员信息不存在'
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: profile
      };

    } catch (error) {
      ctx.logger.error('获取运动员个人信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 更新运动员个人信息
   * PUT /api/player/profile
   */
  async updateProfile() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }

      const playerId = ctx.user.userId;
      const updateData = ctx.request.body;

      // 验证更新数据
      const validationResult = await ctx.service.player.validateProfileUpdate(updateData);
      if (!validationResult.valid) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: validationResult.message
        };
        return;
      }

      // 执行更新
      const result = await ctx.service.player.updateProfile(playerId, updateData);

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '个人信息更新成功',
          data: result.data
        };
      } else {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: result.message
        };
      }

    } catch (error) {
      ctx.logger.error('更新运动员个人信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取运动员统计信息
   * GET /api/player/stats
   */
  async getStats() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }

      const playerId = ctx.user.userId;
      const stats = await ctx.service.player.getPlayerStats(playerId);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: stats
      };

    } catch (error) {
      ctx.logger.error('获取运动员统计信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 修改密码
   * PUT /api/player/password
   */
  async changePassword() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }

      const playerId = ctx.user.userId;
      const { oldPassword, newPassword } = ctx.request.body;

      // 验证输入
      if (!oldPassword || !newPassword) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '原密码和新密码不能为空'
        };
        return;
      }

      if (newPassword.length < 6) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '新密码长度不能少于6位'
        };
        return;
      }

      // 执行密码修改
      const result = await ctx.service.player.changePassword(playerId, oldPassword, newPassword);

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '密码修改成功'
        };
      } else {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: result.message
        };
      }

    } catch (error) {
      ctx.logger.error('修改密码失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取运动员个人成绩
   * GET /api/player/scores
   */
  async getPlayerScores() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'player') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅运动员可访问'
        };
        return;
      }

      const playerId = ctx.user.userId;
      const filters = ctx.query;

      const scores = await ctx.service.player.getPlayerScores(playerId, filters);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: scores
      };

    } catch (error) {
      ctx.logger.error('获取运动员个人成绩失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = PlayerController;

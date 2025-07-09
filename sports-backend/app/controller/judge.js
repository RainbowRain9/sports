'use strict';

const Controller = require('egg').Controller;

/**
 * 裁判员管理控制器
 * 处理裁判员专用功能的API请求
 */
class JudgeController extends Controller {

  // ==================== 裁判员个人信息管理 ====================

  /**
   * 获取裁判员个人信息
   * GET /api/judge/profile
   */
  async getProfile() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const profile = await ctx.service.judge.getProfile(judgeId);

      if (!profile) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          code: 404,
          message: '裁判员信息不存在'
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
      ctx.logger.error('获取裁判员个人信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 更新裁判员个人信息
   * PUT /api/judge/profile
   */
  async updateProfile() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const updateData = ctx.request.body;

      // 数据验证
      const { judge_name, judge_sex, judge_phone, judge_email, judge_specialty } = updateData;
      
      if (!judge_name || !judge_sex) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '姓名和性别不能为空'
        };
        return;
      }

      const result = await ctx.service.judge.updateProfile(judgeId, {
        judge_name,
        judge_sex,
        judge_phone,
        judge_email,
        judge_specialty
      });

      if (result) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '个人信息更新成功'
        };
      } else {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '更新失败'
        };
      }

    } catch (error) {
      ctx.logger.error('更新裁判员个人信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取裁判员统计信息
   * GET /api/judge/stats
   */
  async getStats() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const stats = await ctx.service.judge.getJudgeStats(judgeId);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: stats
      };

    } catch (error) {
      ctx.logger.error('获取裁判员统计信息失败:', error);
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
   * PUT /api/judge/password
   */
  async changePassword() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const { oldPassword, newPassword, confirmPassword } = ctx.request.body;

      // 参数验证
      if (!oldPassword || !newPassword || !confirmPassword) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '所有密码字段都不能为空'
        };
        return;
      }

      if (newPassword !== confirmPassword) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '新密码和确认密码不一致'
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

      const result = await ctx.service.judge.changePassword(judgeId, oldPassword, newPassword);

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
      ctx.logger.error('修改裁判员密码失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  // ==================== 赛事管理 ====================

  /**
   * 获取分配给裁判员的比赛项目
   * GET /api/judge/events
   */
  async getAssignedEvents() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const filters = ctx.query;

      const events = await ctx.service.judge.getAssignedEvents(judgeId, filters);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: events
      };

    } catch (error) {
      ctx.logger.error('获取分配的比赛项目失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取比赛项目的参赛选手名单
   * GET /api/judge/events/:scheduleId/participants
   */
  async getEventParticipants() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const scheduleId = parseInt(ctx.params.scheduleId);

      if (!scheduleId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '比赛项目ID无效'
        };
        return;
      }

      // 验证裁判员是否有权限查看此比赛项目
      const hasPermission = await ctx.service.judge.checkEventPermission(judgeId, scheduleId);
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '您没有权限查看此比赛项目'
        };
        return;
      }

      const participants = await ctx.service.judge.getEventParticipants(scheduleId);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: participants
      };

    } catch (error) {
      ctx.logger.error('获取参赛选手名单失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  // ==================== 成绩录入管理 ====================

  /**
   * 录入比赛成绩
   * POST /api/judge/scores
   */
  async createScore() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const { player_id, schedule_id, score, notes } = ctx.request.body;

      // 参数验证
      if (!player_id || !schedule_id || score === undefined || score === null) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '运动员ID、比赛项目ID和成绩不能为空'
        };
        return;
      }

      // 验证裁判员是否有权限为此比赛项目录入成绩
      const hasPermission = await ctx.service.judge.checkEventPermission(judgeId, schedule_id);
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '您没有权限为此比赛项目录入成绩'
        };
        return;
      }

      const result = await ctx.service.judge.createScore({
        player_id,
        schedule_id,
        score,
        judge_id: judgeId,
        notes
      });

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '成绩录入成功',
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
      ctx.logger.error('录入比赛成绩失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 更新比赛成绩
   * PUT /api/judge/scores/:scoreId
   */
  async updateScore() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const scoreId = parseInt(ctx.params.scoreId);
      const { score, notes } = ctx.request.body;

      if (!scoreId || score === undefined || score === null) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '成绩ID和成绩不能为空'
        };
        return;
      }

      const result = await ctx.service.judge.updateScore(scoreId, judgeId, { score, notes });

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '成绩更新成功'
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
      ctx.logger.error('更新比赛成绩失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取比赛项目的成绩列表
   * GET /api/judge/events/:scheduleId/scores
   */
  async getEventScores() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const scheduleId = parseInt(ctx.params.scheduleId);

      if (!scheduleId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '比赛项目ID无效'
        };
        return;
      }

      // 验证裁判员是否有权限查看此比赛项目的成绩
      const hasPermission = await ctx.service.judge.checkEventPermission(judgeId, scheduleId);
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '您没有权限查看此比赛项目的成绩'
        };
        return;
      }

      const scores = await ctx.service.judge.getEventScores(scheduleId);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: scores
      };

    } catch (error) {
      ctx.logger.error('获取比赛成绩列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 删除成绩记录
   * DELETE /api/judge/scores/:scoreId
   */
  async deleteScore() {
    const { ctx } = this;

    try {
      // 验证用户身份
      if (!ctx.user || ctx.user.userType !== 'judge') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅裁判员可访问'
        };
        return;
      }

      const judgeId = ctx.user.userId;
      const scoreId = parseInt(ctx.params.scoreId);

      if (!scoreId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '成绩ID无效'
        };
        return;
      }

      const result = await ctx.service.judge.deleteScore(scoreId, judgeId);

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '成绩删除成功'
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
      ctx.logger.error('删除成绩记录失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = JudgeController;

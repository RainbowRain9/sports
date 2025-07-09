'use strict';

const Controller = require('egg').Controller;

/**
 * 管理员端裁判员管理控制器（简化版，用于测试）
 * 处理管理员对裁判员的CRUD操作和赛事分配
 */
class JudgeAdminController extends Controller {

  // ==================== 裁判员CRUD操作 ====================

  /**
   * 获取裁判员列表
   * GET /api/admin/judges
   */
  async getJudgeList() {
    const { ctx } = this;

    try {
      const { page = 1, pageSize = 20, name, specialty, status } = ctx.query;

      const result = await ctx.service.judgeAdmin.getJudgeList({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        name,
        specialty,
        status
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result
      };

    } catch (error) {
      ctx.logger.error('获取裁判员列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取裁判员详情
   * GET /api/admin/judges/:judgeId
   */
  async getJudgeDetail() {
    const { ctx } = this;

    try {
      // 临时移除权限验证，用于测试
      // TODO: 后续需要重新添加权限验证

      const judgeId = parseInt(ctx.params.judgeId);

      if (!judgeId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '裁判员ID无效'
        };
        return;
      }

      const judge = await ctx.service.judgeAdmin.getJudgeDetail(judgeId);

      if (!judge) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          code: 404,
          message: '裁判员不存在'
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: judge
      };

    } catch (error) {
      ctx.logger.error('获取裁判员详情失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 创建裁判员
   * POST /api/admin/judges
   */
  async createJudge() {
    const { ctx } = this;

    try {
      // 临时移除权限验证，用于测试

      const { 
        judge_name, 
        judge_username, 
        judge_password, 
        judge_sex, 
        judge_phone, 
        judge_email, 
        judge_specialty 
      } = ctx.request.body;

      // 参数验证
      if (!judge_name || !judge_username || !judge_password || !judge_sex) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '姓名、用户名、密码和性别不能为空'
        };
        return;
      }

      const result = await ctx.service.judgeAdmin.createJudge({
        judge_name,
        judge_username,
        judge_password,
        judge_sex,
        judge_phone,
        judge_email,
        judge_specialty
      });

      if (result.success) {
        ctx.status = 201;
        ctx.body = {
          success: true,
          code: 201,
          message: result.message,
          data: { judgeId: result.judgeId }
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
      ctx.logger.error('创建裁判员失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 更新裁判员信息
   * PUT /api/admin/judges/:judgeId
   */
  async updateJudge() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const judgeId = parseInt(ctx.params.judgeId);

      if (!judgeId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '裁判员ID无效'
        };
        return;
      }

      const updateData = ctx.request.body;

      const result = await ctx.service.judgeAdmin.updateJudge(judgeId, updateData);

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: result.message
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
      ctx.logger.error('更新裁判员失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 删除裁判员
   * DELETE /api/admin/judges/:judgeId
   */
  async deleteJudge() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可删除裁判员'
        };
        return;
      }

      const judgeId = parseInt(ctx.params.judgeId);

      if (!judgeId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '裁判员ID无效'
        };
        return;
      }

      const result = await ctx.service.judgeAdmin.deleteJudge(judgeId);

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: result.message
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
      ctx.logger.error('删除裁判员失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 切换裁判员状态
   * PUT /api/admin/judges/:judgeId/status
   */
  async toggleJudgeStatus() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const judgeId = parseInt(ctx.params.judgeId);
      const { status } = ctx.request.body;

      if (!judgeId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '裁判员ID无效'
        };
        return;
      }

      if (status === undefined || ![0, 1].includes(status)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '状态值无效，只能是0或1'
        };
        return;
      }

      const result = await ctx.service.judgeAdmin.updateJudge(judgeId, { judge_status: status });

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: `裁判员已${status ? '启用' : '停用'}`
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
      ctx.logger.error('切换裁判员状态失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  // ==================== 赛事分配管理 ====================

  /**
   * 获取可分配的比赛项目列表
   * GET /api/admin/judges/available-events
   */
  async getAvailableEvents() {
    const { ctx } = this;

    try {
      // 验证管理员权限 (临时注释用于测试)
      // if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
      //   ctx.status = 403;
      //   ctx.body = {
      //     success: false,
      //     code: 403,
      //     message: '权限不足：仅管理员可访问'
      //   };
      //   return;
      // }

      const events = await ctx.service.judgeAdmin.getAvailableEvents();

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: events
      };

    } catch (error) {
      ctx.logger.error('获取可分配比赛项目失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取裁判员的赛事分配列表
   * GET /api/admin/judges/:judgeId/assignments
   */
  async getJudgeAssignments() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const judgeId = parseInt(ctx.params.judgeId);

      if (!judgeId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '裁判员ID无效'
        };
        return;
      }

      const assignments = await ctx.service.judgeAdmin.getJudgeEventAssignments(judgeId);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: assignments
      };

    } catch (error) {
      ctx.logger.error('获取裁判员赛事分配失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 分配裁判员到比赛项目
   * POST /api/admin/judges/assign-event
   */
  async assignJudgeToEvent() {
    const { ctx } = this;

    try {
      // 验证管理员权限 (临时注释用于测试)
      // if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
      //   ctx.status = 403;
      //   ctx.body = {
      //     success: false,
      //     code: 403,
      //     message: '权限不足：仅管理员可访问'
      //   };
      //   return;
      // }

      const { judge_id, schedule_id, notes } = ctx.request.body;

      // 添加调试日志
      ctx.logger.info('分配赛事请求数据:', { judge_id, schedule_id, notes, body: ctx.request.body });

      // 参数验证
      if (!judge_id || !schedule_id) {
        ctx.logger.error('参数验证失败:', { judge_id, schedule_id });
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '裁判员ID和比赛项目ID不能为空'
        };
        return;
      }

      const result = await ctx.service.judgeAdmin.assignJudgeToEvent({
        judge_id: parseInt(judge_id),
        schedule_id: parseInt(schedule_id),
        assigned_by: ctx.user ? ctx.user.userId : 1, // 临时使用管理员ID 1
        notes
      });

      if (result.success) {
        ctx.status = 201;
        ctx.body = {
          success: true,
          code: 201,
          message: result.message,
          data: { assignmentId: result.assignmentId }
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
      ctx.logger.error('分配裁判员失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 取消裁判员赛事分配
   * DELETE /api/admin/judges/assignments/:assignmentId
   */
  async cancelJudgeAssignment() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const assignmentId = parseInt(ctx.params.assignmentId);

      if (!assignmentId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '分配记录ID无效'
        };
        return;
      }

      const result = await ctx.service.judgeAdmin.cancelJudgeAssignment(assignmentId);

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: result.message
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
      ctx.logger.error('取消分配失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 批量分配裁判员
   * POST /api/admin/judges/batch-assign
   */
  async batchAssignJudges() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const { judge_ids, schedule_id, notes } = ctx.request.body;

      // 参数验证
      if (!judge_ids || !Array.isArray(judge_ids) || judge_ids.length === 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '裁判员ID列表不能为空'
        };
        return;
      }

      if (!schedule_id) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '比赛项目ID不能为空'
        };
        return;
      }

      const result = await ctx.service.judgeAdmin.batchAssignJudges({
        judge_ids: judge_ids.map(id => parseInt(id)),
        schedule_id: parseInt(schedule_id),
        assigned_by: ctx.user.userId,
        notes
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        message: result.message,
        data: result.data
      };

    } catch (error) {
      ctx.logger.error('批量分配裁判员失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取裁判员工作统计
   * GET /api/admin/judges/work-stats
   */
  async getJudgeWorkStats() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可访问'
        };
        return;
      }

      const { dateRange } = ctx.query;

      const stats = await ctx.service.judgeAdmin.getJudgeWorkStats({
        dateRange: dateRange ? JSON.parse(dateRange) : null
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: stats
      };

    } catch (error) {
      ctx.logger.error('获取裁判员工作统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = JudgeAdminController;

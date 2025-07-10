'use strict';

const Controller = require('egg').Controller;

/**
 * 系统配置管理控制器
 * 处理系统配置相关的API请求
 */
class SystemConfigController extends Controller {
  
  /**
   * 获取系统配置列表
   * GET /api/admin/system/config
   */
  async getConfigs() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin' || ctx.user.roleSubType !== '2') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可访问'
        };
        return;
      }

      const { page = 1, pageSize = 20, configType, isPublic, keyword } = ctx.query;

      const result = await ctx.service.systemConfig.getConfigs({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        configType,
        isPublic: isPublic ? parseInt(isPublic) : null,
        keyword
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result
      };

    } catch (error) {
      ctx.logger.error('获取系统配置列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取公开配置
   * GET /api/system/config/public
   */
  async getPublicConfigs() {
    const { ctx } = this;
    
    try {
      const configs = await ctx.service.systemConfig.getPublicConfigs();
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: configs
      };
      
    } catch (error) {
      ctx.logger.error('获取公开配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 获取单个配置
   * GET /api/admin/system/config/:configKey
   */
  async getConfig() {
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
      
      const { configKey } = ctx.params;
      
      const config = await ctx.service.systemConfig.getConfig(configKey);
      
      if (config) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          data: config
        };
      } else {
        ctx.status = 404;
        ctx.body = {
          success: false,
          code: 404,
          message: '配置不存在'
        };
      }
      
    } catch (error) {
      ctx.logger.error('获取配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 创建配置
   * POST /api/admin/system/config
   */
  async createConfig() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可创建配置'
        };
        return;
      }
      
      const { configKey, configValue, configType, description, isPublic } = ctx.request.body;
      
      // 参数验证
      if (!configKey || configValue === undefined) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '配置键和配置值不能为空'
        };
        return;
      }
      
      const result = await ctx.service.systemConfig.createConfig({
        configKey,
        configValue,
        configType: configType || 'string',
        description,
        isPublic: isPublic ? 1 : 0,
        updatedBy: ctx.user.userId
      });
      
      if (result.success) {
        // 记录操作日志
        await ctx.service.operationLog.log({
          userId: ctx.user.userId,
          userType: ctx.user.userType,
          operation: 'create_config',
          targetType: 'system_config',
          targetId: result.data.configId,
          details: { configKey, configType, description },
          result: 'success'
        });
        
        ctx.status = 201;
        ctx.body = {
          success: true,
          code: 201,
          data: result.data,
          message: '配置创建成功'
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
      ctx.logger.error('创建配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 更新配置
   * PUT /api/admin/system/config/:configKey
   */
  async updateConfig() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可修改配置'
        };
        return;
      }
      
      const { configKey } = ctx.params;
      const { configValue, configType, description, isPublic } = ctx.request.body;
      
      // 参数验证
      if (configValue === undefined) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '配置值不能为空'
        };
        return;
      }
      
      const result = await ctx.service.systemConfig.updateConfig(configKey, {
        configValue,
        configType,
        description,
        isPublic: isPublic !== undefined ? (isPublic ? 1 : 0) : undefined,
        updatedBy: ctx.user.userId
      });
      
      if (result.success) {
        // 记录操作日志
        await ctx.service.operationLog.log({
          userId: ctx.user.userId,
          userType: ctx.user.userType,
          operation: 'update_config',
          targetType: 'system_config',
          targetId: result.data.configId,
          details: { configKey, configValue, configType },
          result: 'success'
        });
        
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          data: result.data,
          message: '配置更新成功'
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
      ctx.logger.error('更新配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 删除配置
   * DELETE /api/admin/system/config/:configKey
   */
  async deleteConfig() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可删除配置'
        };
        return;
      }
      
      const { configKey } = ctx.params;
      
      const result = await ctx.service.systemConfig.deleteConfig(configKey);
      
      if (result.success) {
        // 记录操作日志
        await ctx.service.operationLog.log({
          userId: ctx.user.userId,
          userType: ctx.user.userType,
          operation: 'delete_config',
          targetType: 'system_config',
          details: { configKey },
          result: 'success'
        });
        
        ctx.status = 200;
        ctx.body = {
          success: true,
          code: 200,
          message: '配置删除成功'
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
      ctx.logger.error('删除配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  
  /**
   * 批量更新配置
   * PUT /api/admin/system/config/batch
   */
  async batchUpdateConfigs() {
    const { ctx } = this;
    
    try {
      // 验证管理员权限
      if (!ctx.user || !['admin', 'operator'].includes(ctx.user.userType)) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅管理员可修改配置'
        };
        return;
      }
      
      const { configs } = ctx.request.body;
      
      // 参数验证
      if (!configs || !Array.isArray(configs) || configs.length === 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '配置列表不能为空'
        };
        return;
      }
      
      const result = await ctx.service.systemConfig.batchUpdateConfigs(configs, ctx.user.userId);
      
      // 记录操作日志
      await ctx.service.operationLog.log({
        userId: ctx.user.userId,
        userType: ctx.user.userType,
        operation: 'batch_update_config',
        targetType: 'system_config',
        details: { configCount: configs.length, configKeys: configs.map(c => c.configKey) },
        result: 'success'
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result,
        message: `成功更新 ${result.successCount} 个配置`
      };
      
    } catch (error) {
      ctx.logger.error('批量更新配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
  /**
   * 批量导入配置
   * POST /api/admin/system/config/batch-import
   */
  async batchImportConfigs() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin' || ctx.user.roleSubType !== '2') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可访问'
        };
        return;
      }

      const { configs } = ctx.request.body;

      if (!Array.isArray(configs) || configs.length === 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '请提供有效的配置数组'
        };
        return;
      }

      const result = await ctx.service.systemConfig.batchImportConfigs(configs, ctx.user.userId);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result,
        message: `批量导入完成：成功${result.success}个，失败${result.failed}个`
      };

    } catch (error) {
      ctx.logger.error('批量导入配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 导出配置
   * GET /api/admin/system/config/export
   */
  async exportConfigs() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin' || ctx.user.roleSubType !== '2') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可访问'
        };
        return;
      }

      const { configType, isPublic } = ctx.query;

      const filters = {};
      if (configType) filters.configType = configType;
      if (isPublic !== undefined) filters.isPublic = parseInt(isPublic);

      const configs = await ctx.service.systemConfig.exportConfigs(filters);

      // 设置下载头
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `system_config_${timestamp}.json`;

      ctx.set('Content-Type', 'application/json');
      ctx.set('Content-Disposition', `attachment; filename="${filename}"`);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: configs,
        filename,
        exportTime: new Date().toISOString()
      };

    } catch (error) {
      ctx.logger.error('导出配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 获取配置备份
   * GET /api/admin/system/config/backup
   */
  async backupConfigs() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin' || ctx.user.roleSubType !== '2') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可访问'
        };
        return;
      }

      const configs = await ctx.service.systemConfig.exportConfigs();

      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        configs: configs,
        metadata: {
          total: configs.length,
          exportedBy: ctx.user.userId,
          systemVersion: 'v1.3.0'
        }
      };

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: backup
      };

    } catch (error) {
      ctx.logger.error('备份配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * 恢复配置
   * POST /api/admin/system/config/restore
   */
  async restoreConfigs() {
    const { ctx } = this;

    try {
      // 验证管理员权限
      if (!ctx.user || ctx.user.userType !== 'admin' || ctx.user.roleSubType !== '2') {
        ctx.status = 403;
        ctx.body = {
          success: false,
          code: 403,
          message: '权限不足：仅超级管理员可访问'
        };
        return;
      }

      const { backup } = ctx.request.body;

      if (!backup || !backup.configs || !Array.isArray(backup.configs)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          code: 400,
          message: '请提供有效的备份数据'
        };
        return;
      }

      const result = await ctx.service.systemConfig.batchImportConfigs(backup.configs, ctx.user.userId);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: 200,
        data: result,
        message: `配置恢复完成：成功${result.success}个，失败${result.failed}个`
      };

    } catch (error) {
      ctx.logger.error('恢复配置失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        code: 500,
        message: '服务器内部错误'
      };
    }
  }
}

module.exports = SystemConfigController;

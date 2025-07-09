'use strict';

const Service = require('egg').Service;

/**
 * 系统配置服务
 * 处理系统配置相关的业务逻辑
 */
class SystemConfigService extends Service {
  
  /**
   * 获取配置列表
   * @param {object} params - 查询参数
   * @returns {object} 分页结果
   */
  async getConfigs(params) {
    const { app } = this;
    const { page, pageSize, configType, isPublic, keyword } = params;
    
    try {
      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];
      
      if (configType) {
        whereConditions.push('config_type = ?');
        queryParams.push(configType);
      }
      
      if (isPublic !== null) {
        whereConditions.push('is_public = ?');
        queryParams.push(isPublic);
      }
      
      if (keyword) {
        whereConditions.push('(config_key LIKE ? OR description LIKE ?)');
        queryParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM system_config ${whereClause}`;
      const countResult = await app.mysql.query(countSql, queryParams);
      const total = countResult[0].total;
      
      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataSql = `
        SELECT 
          config_id,
          config_key,
          config_value,
          config_type,
          description,
          is_public,
          updated_by,
          created_at,
          updated_at
        FROM system_config
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(pageSize, offset);
      const dataResult = await app.mysql.query(dataSql, queryParams);
      
      return {
        list: dataResult,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
      
    } catch (error) {
      this.logger.error('获取配置列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取公开配置
   * @returns {object} 配置对象
   */
  async getPublicConfigs() {
    const { app } = this;
    
    try {
      const sql = `
        SELECT config_key, config_value, config_type
        FROM system_config
        WHERE is_public = 1
        ORDER BY config_key
      `;
      
      const result = await app.mysql.query(sql);
      
      // 转换为键值对对象
      const configs = {};
      result.forEach(config => {
        configs[config.config_key] = this._parseConfigValue(config.config_value, config.config_type);
      });
      
      return configs;
      
    } catch (error) {
      this.logger.error('获取公开配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取单个配置
   * @param {string} configKey - 配置键
   * @returns {object} 配置信息
   */
  async getConfig(configKey) {
    const { app } = this;
    
    try {
      const config = await app.mysql.get('system_config', { config_key: configKey });
      
      if (config) {
        config.parsed_value = this._parseConfigValue(config.config_value, config.config_type);
      }
      
      return config;
      
    } catch (error) {
      this.logger.error('获取配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建配置
   * @param {object} configData - 配置数据
   * @returns {object} 创建结果
   */
  async createConfig(configData) {
    const { app } = this;
    
    try {
      // 检查配置键是否已存在
      const existingConfig = await app.mysql.get('system_config', { config_key: configData.configKey });
      
      if (existingConfig) {
        return {
          success: false,
          message: '配置键已存在'
        };
      }
      
      // 验证配置值
      const validationResult = this._validateConfigValue(configData.configValue, configData.configType);
      if (!validationResult.valid) {
        return {
          success: false,
          message: validationResult.message
        };
      }
      
      const insertData = {
        config_key: configData.configKey,
        config_value: configData.configValue,
        config_type: configData.configType,
        description: configData.description,
        is_public: configData.isPublic,
        updated_by: configData.updatedBy,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await app.mysql.insert('system_config', insertData);
      
      return {
        success: true,
        data: {
          configId: result.insertId,
          ...insertData
        }
      };
      
    } catch (error) {
      this.logger.error('创建配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新配置
   * @param {string} configKey - 配置键
   * @param {object} updateData - 更新数据
   * @returns {object} 更新结果
   */
  async updateConfig(configKey, updateData) {
    const { app } = this;
    
    try {
      // 检查配置是否存在
      const existingConfig = await app.mysql.get('system_config', { config_key: configKey });
      
      if (!existingConfig) {
        return {
          success: false,
          message: '配置不存在'
        };
      }
      
      // 验证配置值
      if (updateData.configValue !== undefined) {
        const configType = updateData.configType || existingConfig.config_type;
        const validationResult = this._validateConfigValue(updateData.configValue, configType);
        if (!validationResult.valid) {
          return {
            success: false,
            message: validationResult.message
          };
        }
      }
      
      // 构建更新数据
      const updateFields = {
        updated_at: new Date()
      };
      
      if (updateData.configValue !== undefined) updateFields.config_value = updateData.configValue;
      if (updateData.configType !== undefined) updateFields.config_type = updateData.configType;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.isPublic !== undefined) updateFields.is_public = updateData.isPublic;
      if (updateData.updatedBy !== undefined) updateFields.updated_by = updateData.updatedBy;
      
      await app.mysql.update('system_config', updateFields, {
        where: { config_key: configKey }
      });
      
      return {
        success: true,
        data: {
          configId: existingConfig.config_id,
          configKey,
          ...updateFields
        }
      };
      
    } catch (error) {
      this.logger.error('更新配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除配置
   * @param {string} configKey - 配置键
   * @returns {object} 删除结果
   */
  async deleteConfig(configKey) {
    const { app } = this;
    
    try {
      // 检查配置是否存在
      const existingConfig = await app.mysql.get('system_config', { config_key: configKey });
      
      if (!existingConfig) {
        return {
          success: false,
          message: '配置不存在'
        };
      }
      
      // 检查是否为系统核心配置（不允许删除）
      const protectedConfigs = ['system.name', 'system.version'];
      if (protectedConfigs.includes(configKey)) {
        return {
          success: false,
          message: '系统核心配置不允许删除'
        };
      }
      
      await app.mysql.delete('system_config', { config_key: configKey });
      
      return {
        success: true
      };
      
    } catch (error) {
      this.logger.error('删除配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 批量更新配置
   * @param {array} configs - 配置列表
   * @param {number} updatedBy - 更新人ID
   * @returns {object} 更新结果
   */
  async batchUpdateConfigs(configs, updatedBy) {
    const { app } = this;
    
    const conn = await app.mysql.beginTransaction();
    
    try {
      let successCount = 0;
      let failedCount = 0;
      const errors = [];
      
      for (const config of configs) {
        try {
          const result = await this._updateSingleConfig(conn, config.configKey, {
            configValue: config.configValue,
            configType: config.configType,
            description: config.description,
            isPublic: config.isPublic,
            updatedBy
          });
          
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
            errors.push({
              configKey: config.configKey,
              error: result.message
            });
          }
        } catch (error) {
          failedCount++;
          errors.push({
            configKey: config.configKey,
            error: error.message
          });
        }
      }
      
      await conn.commit();
      
      return {
        successCount,
        failedCount,
        errors,
        total: configs.length
      };
      
    } catch (error) {
      await conn.rollback();
      this.logger.error('批量更新配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 内部方法：更新单个配置
   * @param {object} conn - 数据库连接
   * @param {string} configKey - 配置键
   * @param {object} updateData - 更新数据
   * @returns {object} 更新结果
   */
  async _updateSingleConfig(conn, configKey, updateData) {
    try {
      // 检查配置是否存在
      const existingConfig = await conn.get('system_config', { config_key: configKey });
      
      if (!existingConfig) {
        return {
          success: false,
          message: '配置不存在'
        };
      }
      
      // 验证配置值
      if (updateData.configValue !== undefined) {
        const configType = updateData.configType || existingConfig.config_type;
        const validationResult = this._validateConfigValue(updateData.configValue, configType);
        if (!validationResult.valid) {
          return {
            success: false,
            message: validationResult.message
          };
        }
      }
      
      // 构建更新数据
      const updateFields = {
        updated_at: new Date()
      };
      
      if (updateData.configValue !== undefined) updateFields.config_value = updateData.configValue;
      if (updateData.configType !== undefined) updateFields.config_type = updateData.configType;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.isPublic !== undefined) updateFields.is_public = updateData.isPublic;
      if (updateData.updatedBy !== undefined) updateFields.updated_by = updateData.updatedBy;
      
      await conn.update('system_config', updateFields, {
        where: { config_key: configKey }
      });
      
      return {
        success: true
      };
      
    } catch (error) {
      this.logger.error('更新单个配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 解析配置值
   * @param {string} value - 配置值
   * @param {string} type - 配置类型
   * @returns {any} 解析后的值
   */
  _parseConfigValue(value, type) {
    if (value === null || value === undefined) {
      return null;
    }
    
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch (error) {
          return value;
        }
      default:
        return value;
    }
  }
  
  /**
   * 验证配置值
   * @param {any} value - 配置值
   * @param {string} type - 配置类型
   * @returns {object} 验证结果
   */
  _validateConfigValue(value, type) {
    switch (type) {
      case 'number':
        if (isNaN(Number(value))) {
          return {
            valid: false,
            message: '配置值必须是有效的数字'
          };
        }
        break;
      case 'boolean':
        if (!['true', 'false', '1', '0'].includes(String(value).toLowerCase())) {
          return {
            valid: false,
            message: '配置值必须是有效的布尔值（true/false/1/0）'
          };
        }
        break;
      case 'json':
        try {
          JSON.parse(value);
        } catch (error) {
          return {
            valid: false,
            message: '配置值必须是有效的JSON格式'
          };
        }
        break;
    }
    
    return {
      valid: true
    };
  }
}

module.exports = SystemConfigService;

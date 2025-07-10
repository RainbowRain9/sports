import { demo as request } from './adapter'

/**
 * 系统配置管理API
 */
export default {
  /**
   * 获取配置列表
   * @param {object} params - 查询参数
   */
  getConfigs(params) {
    return request.get('/api/admin/system/config', { params })
  },

  /**
   * 获取公开配置
   */
  getPublicConfigs() {
    return request.get('/api/system/config/public')
  },

  /**
   * 获取单个配置
   * @param {string} configKey - 配置键
   */
  getConfig(configKey) {
    return request.get(`/api/admin/system/config/${configKey}`)
  },

  /**
   * 创建配置
   * @param {object} data - 配置数据
   */
  createConfig(data) {
    return request.post('/api/admin/system/config', data)
  },

  /**
   * 更新配置
   * @param {string} configKey - 配置键
   * @param {object} data - 更新数据
   */
  updateConfig(configKey, data) {
    return request.put(`/api/admin/system/config/${configKey}`, data)
  },

  /**
   * 删除配置
   * @param {string} configKey - 配置键
   */
  deleteConfig(configKey) {
    return request.delete(`/api/admin/system/config/${configKey}`)
  },

  /**
   * 批量更新配置
   * @param {array} configs - 配置数组
   */
  batchUpdateConfigs(configs) {
    return request.put('/api/admin/system/config/batch', { configs })
  },

  /**
   * 批量导入配置
   * @param {array} configs - 配置数组
   */
  batchImportConfigs(configs) {
    return request.post('/api/admin/system/config/batch-import', { configs })
  },

  /**
   * 导出配置
   * @param {object} filters - 过滤条件
   */
  exportConfigs(filters = {}) {
    return request.get('/api/admin/system/config/export', { params: filters })
  },

  /**
   * 备份配置
   */
  backupConfigs() {
    return request.get('/api/admin/system/config/backup')
  },

  /**
   * 恢复配置
   * @param {object} backup - 备份数据
   */
  restoreConfigs(backup) {
    return request.post('/api/admin/system/config/restore', { backup })
  }
}

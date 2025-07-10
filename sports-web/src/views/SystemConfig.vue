<template>
  <div class="system-config">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="el-icon-setting"></i>
          系统配置管理
        </h2>
        <p class="page-description">管理系统运行参数和配置项</p>
      </div>
      <div class="header-actions">
        <el-dropdown @command="handleAdvancedAction" v-if="userType === 'admin'">
          <el-button type="info" icon="el-icon-more">
            高级功能<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="export">
              <i class="el-icon-download"></i> 导出配置
            </el-dropdown-item>
            <el-dropdown-item command="import">
              <i class="el-icon-upload2"></i> 导入配置
            </el-dropdown-item>
            <el-dropdown-item command="backup">
              <i class="el-icon-folder-opened"></i> 备份配置
            </el-dropdown-item>
            <el-dropdown-item command="restore">
              <i class="el-icon-refresh-left"></i> 恢复配置
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <el-button
          type="primary"
          icon="el-icon-plus"
          @click="showCreateDialog"
          v-if="userType === 'admin'"
        >
          新增配置
        </el-button>
        <el-button
          type="success"
          icon="el-icon-refresh"
          @click="refreshData"
          :loading="loading"
        >
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div class="filter-form">
        <el-form :model="filterForm" inline>
          <el-form-item label="配置类型">
            <el-select v-model="filterForm.configType" placeholder="全部类型" clearable>
              <el-option label="字符串" value="string"></el-option>
              <el-option label="数字" value="number"></el-option>
              <el-option label="布尔值" value="boolean"></el-option>
              <el-option label="JSON" value="json"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="公开状态">
            <el-select v-model="filterForm.isPublic" placeholder="全部状态" clearable>
              <el-option label="公开" :value="1"></el-option>
              <el-option label="私有" :value="0"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input 
              v-model="filterForm.keyword" 
              placeholder="搜索配置键或描述" 
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 配置列表 -->
    <el-card class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        row-key="config_id"
      >
        <el-table-column prop="config_key" label="配置键" width="200">
          <template slot-scope="scope">
            <div class="config-key">
              <span class="key-text">{{ scope.row.config_key }}</span>
              <el-tag 
                v-if="scope.row.is_public" 
                type="success" 
                size="mini"
              >
                公开
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="config_value" label="配置值" min-width="150">
          <template slot-scope="scope">
            <div class="config-value">
              <span v-if="scope.row.config_type === 'boolean'">
                <el-tag :type="scope.row.config_value === 'true' ? 'success' : 'danger'">
                  {{ scope.row.config_value === 'true' ? '是' : '否' }}
                </el-tag>
              </span>
              <span v-else-if="scope.row.config_type === 'json'" class="json-value">
                {{ formatJsonValue(scope.row.config_value) }}
              </span>
              <span v-else>{{ scope.row.config_value }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="config_type" label="类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="getTypeColor(scope.row.config_type)" size="small">
              {{ getTypeText(scope.row.config_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200">
          <template slot-scope="scope">
            <span v-if="scope.row.description">{{ scope.row.description }}</span>
            <span v-else class="text-muted">暂无描述</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="updated_at" label="更新时间" width="150">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.updated_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button 
                type="text" 
                size="mini" 
                @click="editConfig(scope.row)"
              >
                编辑
              </el-button>
              <el-button 
                type="text" 
                size="mini" 
                @click="viewConfig(scope.row)"
              >
                详情
              </el-button>
              <el-button
                v-if="userType === 'admin' && !isProtectedConfig(scope.row.config_key)"
                type="text" 
                size="mini" 
                style="color: #f56c6c;"
                @click="deleteConfig(scope.row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 创建/编辑配置对话框 -->
    <el-dialog
      :title="configDialog.isEdit ? '编辑配置' : '新增配置'"
      :visible.sync="configDialog.visible"
      width="600px"
      @close="resetConfigDialog"
    >
      <el-form 
        :model="configForm" 
        :rules="configRules"
        ref="configForm"
        label-width="100px"
      >
        <el-form-item label="配置键" prop="configKey">
          <el-input 
            v-model="configForm.configKey" 
            placeholder="请输入配置键"
            :disabled="configDialog.isEdit"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="配置类型" prop="configType">
          <el-select v-model="configForm.configType" placeholder="请选择配置类型">
            <el-option label="字符串" value="string"></el-option>
            <el-option label="数字" value="number"></el-option>
            <el-option label="布尔值" value="boolean"></el-option>
            <el-option label="JSON" value="json"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="配置值" prop="configValue">
          <el-input 
            v-if="configForm.configType === 'json'"
            v-model="configForm.configValue"
            type="textarea"
            :rows="4"
            placeholder="请输入JSON格式的配置值"
          ></el-input>
          <el-select 
            v-else-if="configForm.configType === 'boolean'"
            v-model="configForm.configValue"
            placeholder="请选择布尔值"
          >
            <el-option label="是 (true)" value="true"></el-option>
            <el-option label="否 (false)" value="false"></el-option>
          </el-select>
          <el-input 
            v-else
            v-model="configForm.configValue"
            placeholder="请输入配置值"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="configForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入配置描述"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="公开状态">
          <el-switch
            v-model="configForm.isPublic"
            active-text="公开"
            inactive-text="私有"
          ></el-switch>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="configDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveConfig"
          :loading="configDialog.loading"
        >
          {{ configDialog.isEdit ? '更新' : '创建' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 配置详情对话框 -->
    <el-dialog
      title="配置详情"
      :visible.sync="detailDialog.visible"
      width="500px"
    >
      <div v-if="detailDialog.config" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="配置键">
            {{ detailDialog.config.config_key }}
          </el-descriptions-item>
          <el-descriptions-item label="配置值">
            <pre v-if="detailDialog.config.config_type === 'json'">{{ formatJsonValue(detailDialog.config.config_value) }}</pre>
            <span v-else>{{ detailDialog.config.config_value }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="配置类型">
            <el-tag :type="getTypeColor(detailDialog.config.config_type)">
              {{ getTypeText(detailDialog.config.config_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="公开状态">
            <el-tag :type="detailDialog.config.is_public ? 'success' : 'info'">
              {{ detailDialog.config.is_public ? '公开' : '私有' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ detailDialog.config.description || '暂无描述' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(detailDialog.config.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(detailDialog.config.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 导入配置对话框 -->
    <el-dialog
      title="导入配置"
      :visible.sync="importDialog.visible"
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          show-icon
        >
          <p>支持导入JSON格式的配置文件，格式要求：</p>
          <ul>
            <li>必须包含 config_key、config_value、config_type 字段</li>
            <li>如果配置键已存在，将会更新现有配置</li>
            <li>导入前请确保配置数据的正确性</li>
          </ul>
        </el-alert>

        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="importDialog.fileList"
          accept=".json"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">只能上传json文件</div>
        </el-upload>

        <div v-if="importDialog.previewData" class="preview-section">
          <h4>预览数据 (前5条):</h4>
          <el-table
            :data="importDialog.previewData.slice(0, 5)"
            size="mini"
            border
          >
            <el-table-column prop="config_key" label="配置键" width="150"></el-table-column>
            <el-table-column prop="config_value" label="配置值" width="150" show-overflow-tooltip></el-table-column>
            <el-table-column prop="config_type" label="类型" width="80"></el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
          </el-table>
          <p class="preview-info">共 {{ importDialog.previewData.length }} 条配置</p>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="importDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmImport"
          :loading="importDialog.loading"
          :disabled="!importDialog.previewData"
        >
          确认导入
        </el-button>
      </span>
    </el-dialog>

    <!-- 备份恢复对话框 -->
    <el-dialog
      title="恢复配置"
      :visible.sync="restoreDialog.visible"
      width="600px"
    >
      <div class="restore-content">
        <el-alert
          title="恢复说明"
          type="warning"
          :closable="false"
          show-icon
        >
          <p>恢复配置将会：</p>
          <ul>
            <li>覆盖现有的同名配置项</li>
            <li>添加备份中不存在的新配置项</li>
            <li>此操作不可逆，请谨慎操作</li>
          </ul>
        </el-alert>

        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleBackupFileChange"
          :file-list="restoreDialog.fileList"
          accept=".json"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将备份文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">只能上传json格式的备份文件</div>
        </el-upload>

        <div v-if="restoreDialog.backupData" class="backup-info">
          <h4>备份信息:</h4>
          <el-descriptions :column="2" border size="mini">
            <el-descriptions-item label="备份版本">
              {{ restoreDialog.backupData.version }}
            </el-descriptions-item>
            <el-descriptions-item label="备份时间">
              {{ formatDateTime(restoreDialog.backupData.timestamp) }}
            </el-descriptions-item>
            <el-descriptions-item label="配置数量">
              {{ restoreDialog.backupData.configs ? restoreDialog.backupData.configs.length : 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="系统版本">
              {{ restoreDialog.backupData.metadata ? restoreDialog.backupData.metadata.systemVersion : '未知' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="restoreDialog.visible = false">取消</el-button>
        <el-button
          type="danger"
          @click="confirmRestore"
          :loading="restoreDialog.loading"
          :disabled="!restoreDialog.backupData"
        >
          确认恢复
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'SystemConfig',
  computed: {
    // 获取用户信息
    userInfo() {
      return this.$store.getters['auth/user'] || {};
    },

    // 获取用户类型
    userType() {
      return this.$store.getters['auth/userType'];
    }
  },
  data() {
    return {
      loading: false,

      // 筛选表单
      filterForm: {
        configType: '',
        isPublic: null,
        keyword: ''
      },

      // 表格数据
      tableData: [],

      // 分页
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },

      // 配置对话框
      configDialog: {
        visible: false,
        isEdit: false,
        loading: false
      },

      // 配置表单
      configForm: {
        configKey: '',
        configValue: '',
        configType: 'string',
        description: '',
        isPublic: false
      },

      // 表单验证规则
      configRules: {
        configKey: [
          { required: true, message: '请输入配置键', trigger: 'blur' },
          { pattern: /^[a-zA-Z][a-zA-Z0-9._]*$/, message: '配置键只能包含字母、数字、点和下划线，且必须以字母开头', trigger: 'blur' }
        ],
        configType: [
          { required: true, message: '请选择配置类型', trigger: 'change' }
        ],
        configValue: [
          { required: true, message: '请输入配置值', trigger: 'blur' },
          { validator: this.validateConfigValue, trigger: 'blur' }
        ]
      },

      // 详情对话框
      detailDialog: {
        visible: false,
        config: null
      },

      // 导入对话框
      importDialog: {
        visible: false,
        loading: false,
        fileList: [],
        previewData: null
      },

      // 恢复对话框
      restoreDialog: {
        visible: false,
        loading: false,
        fileList: [],
        backupData: null
      },

      // 受保护的配置键
      protectedConfigs: ['system.name', 'system.version']
    };
  },

  async created() {
    await this.loadData();
  },

  methods: {
    // 加载数据
    async loadData() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          ...this.filterForm
        };

        const response = await this.$http.get('/api/admin/system/config', { params });

        if (response.success) {
          this.tableData = response.data.list || [];
          this.pagination.total = response.data.total || 0;
        } else {
          this.$message.error(response.message || '获取数据失败');
        }
      } catch (error) {
        console.error('加载数据失败:', error);

        // 处理不同类型的错误
        if (error.response) {
          const status = error.response.status;
          if (status === 401) {
            this.$message.error('登录已过期，请重新登录');
            this.$store.dispatch('auth/logout');
            this.$router.push('/');
          } else if (status === 403) {
            this.$message.error('权限不足，仅超级管理员可访问');
          } else {
            this.$message.error('服务器错误，请稍后重试');
          }
        } else {
          this.$message.error('网络错误，请检查网络连接');
        }
      } finally {
        this.loading = false;
      }
    },

    // 刷新数据
    async refreshData() {
      await this.loadData();
      this.$message.success('数据已刷新');
    },

    // 应用筛选
    async applyFilter() {
      this.pagination.page = 1;
      await this.loadData();
    },

    // 重置筛选
    async resetFilter() {
      this.filterForm = {
        configType: '',
        isPublic: null,
        keyword: ''
      };
      this.pagination.page = 1;
      await this.loadData();
    },

    // 显示创建对话框
    showCreateDialog() {
      this.configDialog = {
        visible: true,
        isEdit: false,
        loading: false
      };
      this.resetConfigForm();
    },

    // 编辑配置
    editConfig(config) {
      this.configDialog = {
        visible: true,
        isEdit: true,
        loading: false
      };
      this.configForm = {
        configKey: config.config_key,
        configValue: config.config_value,
        configType: config.config_type,
        description: config.description || '',
        isPublic: !!config.is_public
      };
    },

    // 查看配置详情
    viewConfig(config) {
      this.detailDialog = {
        visible: true,
        config
      };
    },

    // 删除配置
    async deleteConfig(config) {
      try {
        await this.$confirm(`确定要删除配置"${config.config_key}"吗？`, '删除确认', {
          type: 'warning'
        });

        const response = await this.$http.delete(`/api/admin/system/config/${config.config_key}`);
        if (response.success) {
          this.$message.success('配置删除成功');
          await this.loadData();
        } else {
          this.$message.error(response.message || '删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除配置失败:', error);
          this.$message.error('删除失败，请稍后重试');
        }
      }
    },

    // 保存配置
    async saveConfig() {
      try {
        await this.$refs.configForm.validate();

        this.configDialog.loading = true;

        const data = {
          configValue: this.configForm.configValue,
          configType: this.configForm.configType,
          description: this.configForm.description,
          isPublic: this.configForm.isPublic
        };

        let response;
        if (this.configDialog.isEdit) {
          response = await this.$http.put(`/api/admin/system/config/${this.configForm.configKey}`, data);
        } else {
          response = await this.$http.post('/api/admin/system/config', {
            configKey: this.configForm.configKey,
            ...data
          });
        }

        if (response.success) {
          this.$message.success(`配置${this.configDialog.isEdit ? '更新' : '创建'}成功`);
          this.configDialog.visible = false;
          await this.loadData();
        } else {
          this.$message.error(response.message || '操作失败');
        }
      } catch (error) {
        if (error !== 'validation') {
          console.error('保存配置失败:', error);
          this.$message.error('操作失败，请稍后重试');
        }
      } finally {
        this.configDialog.loading = false;
      }
    },

    // 重置配置表单
    resetConfigForm() {
      this.configForm = {
        configKey: '',
        configValue: '',
        configType: 'string',
        description: '',
        isPublic: false
      };
      if (this.$refs.configForm) {
        this.$refs.configForm.resetFields();
      }
    },

    // 重置配置对话框
    resetConfigDialog() {
      this.resetConfigForm();
    },

    // 验证配置值
    validateConfigValue(rule, value, callback) {
      // eslint-disable-next-line no-unused-vars
      if (!value) {
        callback(new Error('请输入配置值'));
        return;
      }

      switch (this.configForm.configType) {
        case 'number':
          if (isNaN(Number(value))) {
            callback(new Error('配置值必须是有效的数字'));
          } else {
            callback();
          }
          break;
        case 'boolean':
          if (!['true', 'false'].includes(value)) {
            callback(new Error('配置值必须是true或false'));
          } else {
            callback();
          }
          break;
        case 'json':
          try {
            JSON.parse(value);
            callback();
          } catch (error) {
            callback(new Error('配置值必须是有效的JSON格式'));
          }
          break;
        default:
          callback();
      }
    },

    // 分页处理
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.page = 1;
      this.loadData();
    },

    handleCurrentChange(val) {
      this.pagination.page = val;
      this.loadData();
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-';
      return new Date(dateTime).toLocaleString('zh-CN');
    },

    // 格式化JSON值
    formatJsonValue(value) {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch (error) {
        return value;
      }
    },

    // 获取类型颜色
    getTypeColor(type) {
      const colorMap = {
        string: '',
        number: 'success',
        boolean: 'warning',
        json: 'info'
      };
      return colorMap[type] || '';
    },

    // 获取类型文本
    getTypeText(type) {
      const textMap = {
        string: '字符串',
        number: '数字',
        boolean: '布尔值',
        json: 'JSON'
      };
      return textMap[type] || type;
    },

    // 检查是否为受保护配置
    isProtectedConfig(configKey) {
      return this.protectedConfigs.includes(configKey);
    },

    // 高级功能处理
    handleAdvancedAction(command) {
      switch (command) {
        case 'export':
          this.exportConfigs();
          break;
        case 'import':
          this.showImportDialog();
          break;
        case 'backup':
          this.backupConfigs();
          break;
        case 'restore':
          this.showRestoreDialog();
          break;
      }
    },

    // 导出配置
    async exportConfigs() {
      try {
        const params = {
          configType: this.filterForm.configType,
          isPublic: this.filterForm.isPublic
        };

        const response = await this.$http.get('/api/admin/system/config/export', { params });
        if (response.success) {
          // 创建下载链接
          const blob = new Blob([JSON.stringify(response.data, null, 2)], {
            type: 'application/json'
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = response.filename || 'system_config_export.json';
          link.click();
          window.URL.revokeObjectURL(url);

          this.$message.success('配置导出成功');
        } else {
          this.$message.error(response.message || '导出失败');
        }
      } catch (error) {
        console.error('导出配置失败:', error);
        this.$message.error('导出失败，请稍后重试');
      }
    },

    // 显示导入对话框
    showImportDialog() {
      this.importDialog.visible = true;
      this.importDialog.fileList = [];
      this.importDialog.previewData = null;
    },

    // 处理文件变化
    handleFileChange(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            this.importDialog.previewData = data;
          } else if (data.configs && Array.isArray(data.configs)) {
            this.importDialog.previewData = data.configs;
          } else {
            this.$message.error('文件格式不正确，请上传有效的配置文件');
            return;
          }
        } catch (error) {
          this.$message.error('文件解析失败，请检查JSON格式');
        }
      };
      reader.readAsText(file.raw);
    },

    // 确认导入
    async confirmImport() {
      if (!this.importDialog.previewData) {
        this.$message.warning('请先选择要导入的文件');
        return;
      }

      this.importDialog.loading = true;
      try {
        const response = await this.$http.post('/api/admin/system/config/batch-import', {
          configs: this.importDialog.previewData
        });

        if (response.success) {
          this.$message.success(response.message);
          this.importDialog.visible = false;
          await this.loadData();
        } else {
          this.$message.error(response.message || '导入失败');
        }
      } catch (error) {
        console.error('导入配置失败:', error);
        this.$message.error('导入失败，请稍后重试');
      } finally {
        this.importDialog.loading = false;
      }
    },

    // 备份配置
    async backupConfigs() {
      try {
        const response = await this.$http.get('/api/admin/system/config/backup');
        if (response.success) {
          // 创建下载链接
          const blob = new Blob([JSON.stringify(response.data, null, 2)], {
            type: 'application/json'
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          link.download = `system_config_backup_${timestamp}.json`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.$message.success('配置备份成功');
        } else {
          this.$message.error(response.message || '备份失败');
        }
      } catch (error) {
        console.error('备份配置失败:', error);
        this.$message.error('备份失败，请稍后重试');
      }
    },

    // 显示恢复对话框
    showRestoreDialog() {
      this.restoreDialog.visible = true;
      this.restoreDialog.fileList = [];
      this.restoreDialog.backupData = null;
    },

    // 处理备份文件变化
    handleBackupFileChange(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.version && data.configs && Array.isArray(data.configs)) {
            this.restoreDialog.backupData = data;
          } else {
            this.$message.error('文件格式不正确，请上传有效的备份文件');
            return;
          }
        } catch (error) {
          this.$message.error('文件解析失败，请检查JSON格式');
        }
      };
      reader.readAsText(file.raw);
    },

    // 确认恢复
    async confirmRestore() {
      if (!this.restoreDialog.backupData) {
        this.$message.warning('请先选择要恢复的备份文件');
        return;
      }

      this.$confirm('此操作将覆盖现有配置，是否继续？', '确认恢复', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.restoreDialog.loading = true;
        try {
          const response = await this.$http.post('/api/admin/system/config/restore', {
            backup: this.restoreDialog.backupData
          });

          if (response.success) {
            this.$message.success(response.message);
            this.restoreDialog.visible = false;
            await this.loadData();
          } else {
            this.$message.error(response.message || '恢复失败');
          }
        } catch (error) {
          console.error('恢复配置失败:', error);
          this.$message.error('恢复失败，请稍后重试');
        } finally {
          this.restoreDialog.loading = false;
        }
      });
    }
  }
};
</script>

<style scoped>
.system-config {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.header-content h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-content p {
  margin: 5px 0 0 0;
  opacity: 0.9;
}

.header-actions .el-button {
  margin-left: 10px;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filter-form {
  padding: 10px 0;
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.config-key {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-text {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.config-value {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.json-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.action-buttons .el-button {
  margin-right: 5px;
}

.text-muted {
  color: #999;
  font-style: italic;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

/* 详情内容 */
.detail-content {
  padding: 10px 0;
}

.detail-content pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}

/* 导入导出相关样式 */
.import-content .el-alert,
.restore-content .el-alert {
  margin-bottom: 20px;
}

.import-content .el-alert ul,
.restore-content .el-alert ul {
  margin: 10px 0 0 20px;
}

.import-content .el-alert li,
.restore-content .el-alert li {
  margin-bottom: 5px;
}

.import-content .upload-demo,
.restore-content .upload-demo {
  margin: 20px 0;
}

.import-content .preview-section,
.restore-content .preview-section {
  margin-top: 20px;
}

.import-content .preview-section h4,
.restore-content .preview-section h4 {
  margin-bottom: 10px;
  color: #303133;
}

.import-content .preview-info,
.restore-content .preview-info {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.import-content .backup-info,
.restore-content .backup-info {
  margin-top: 20px;
}

.import-content .backup-info h4,
.restore-content .backup-info h4 {
  margin-bottom: 10px;
  color: #303133;
}

/* 高级功能按钮样式 */
.header-actions .el-dropdown {
  margin-right: 10px;
}

/* 表格样式增强 */
.config-table .config-key {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #409eff;
}

.config-table .config-type-tag {
  font-size: 12px;
}

.config-table .protected-config .config-key {
  color: #f56c6c;
}

.config-table .protected-config .config-key::after {
  content: ' 🔒';
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-config {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    margin-top: 15px;
  }

  .filter-form .el-form {
    flex-direction: column;
  }

  .filter-form .el-form-item {
    margin-bottom: 15px;
  }
}
</style>

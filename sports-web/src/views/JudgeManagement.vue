<template>
  <div class="judge-management">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <i class="el-icon-user-solid"></i>
          裁判员管理
        </h2>
        <p class="page-subtitle">管理裁判员信息和赛事分配</p>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="el-icon-plus" @click="addJudge">
          新增裁判员
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入裁判员姓名"
              prefix-icon="el-icon-search"
              clearable
            ></el-input>
          </el-col>
          <el-col :span="6">
            <el-select v-model="searchForm.specialty" placeholder="专业领域" clearable>
              <el-option label="田径" value="track_field"></el-option>
              <el-option label="游泳" value="swimming"></el-option>
              <el-option label="球类" value="ball_sports"></el-option>
              <el-option label="体操" value="gymnastics"></el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="searchForm.status" placeholder="状态" clearable>
              <el-option label="正常" value="1"></el-option>
              <el-option label="停用" value="0"></el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="searchJudges">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 裁判员列表 -->
    <div class="table-section">
      <el-card>
        <el-table 
          :data="judgeList" 
          v-loading="loading"
          style="width: 100%"
        >
          <el-table-column prop="judge_id" label="ID" width="80"></el-table-column>
          <el-table-column prop="judge_name" label="姓名" width="120"></el-table-column>
          <el-table-column prop="judge_username" label="用户名" width="120"></el-table-column>
          <el-table-column prop="judge_sex" label="性别" width="80"></el-table-column>
          <el-table-column prop="judge_phone" label="联系电话" width="130"></el-table-column>
          <el-table-column prop="judge_email" label="邮箱" width="180"></el-table-column>
          <el-table-column prop="judge_specialty" label="专业领域" width="120">
            <template slot-scope="scope">
              <el-tag :type="getSpecialtyTagType(scope.row.judge_specialty)">
                {{ getSpecialtyText(scope.row.judge_specialty) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="judge_level" label="等级" width="100">
            <template slot-scope="scope">
              <el-tag :type="getLevelTagType(scope.row.judge_level)">
                {{ getLevelText(scope.row.judge_level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="judge_status" label="状态" width="80">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.judge_status"
                :active-value="1"
                :inactive-value="0"
                @change="toggleJudgeStatus(scope.row)"
              ></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="viewJudge(scope.row)">
                查看
              </el-button>
              <el-button type="text" size="small" @click="editJudge(scope.row)">
                编辑
              </el-button>
              <el-button type="text" size="small" @click="assignEvents(scope.row)">
                分配赛事
              </el-button>
              <el-button type="text" size="small" style="color: #f56c6c" @click="deleteJudge(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="pagination.currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pagination.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
          ></el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑裁判员对话框 -->
    <el-dialog
      :title="judgeDialog.isEdit ? '编辑裁判员' : '新增裁判员'"
      :visible.sync="judgeDialog.visible"
      width="600px"
      @close="resetJudgeDialog"
    >
      <el-form
        :model="judgeForm"
        :rules="judgeRules"
        ref="judgeForm"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="judge_name">
              <el-input v-model="judgeForm.judge_name" placeholder="请输入姓名"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户名" prop="judge_username">
              <el-input v-model="judgeForm.judge_username" placeholder="请输入用户名"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="judge_sex">
              <el-select v-model="judgeForm.judge_sex" placeholder="请选择性别">
                <el-option label="男" value="男"></el-option>
                <el-option label="女" value="女"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="judge_phone">
              <el-input v-model="judgeForm.judge_phone" placeholder="请输入联系电话"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="邮箱" prop="judge_email">
          <el-input v-model="judgeForm.judge_email" placeholder="请输入邮箱地址"></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="专业领域" prop="judge_specialty">
              <el-select v-model="judgeForm.judge_specialty" placeholder="请选择专业领域">
                <el-option label="田径" value="track_field"></el-option>
                <el-option label="游泳" value="swimming"></el-option>
                <el-option label="球类" value="ball_sports"></el-option>
                <el-option label="体操" value="gymnastics"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="裁判等级" prop="judge_level">
              <el-select v-model="judgeForm.judge_level" placeholder="请选择裁判等级">
                <el-option label="国家级" value="national"></el-option>
                <el-option label="一级" value="first"></el-option>
                <el-option label="二级" value="second"></el-option>
                <el-option label="三级" value="third"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="个人简介" prop="judge_bio">
          <el-input
            type="textarea"
            v-model="judgeForm.judge_bio"
            placeholder="请输入个人简介"
            :rows="3"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="judge_password" v-if="!judgeDialog.isEdit">
          <el-input
            type="password"
            v-model="judgeForm.judge_password"
            placeholder="请输入登录密码"
            show-password
          ></el-input>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="judgeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveJudge" :loading="judgeDialog.loading">
          {{ judgeDialog.isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'JudgeManagement',
  data() {
    return {
      loading: false,
      judgeList: [],
      searchForm: {
        name: '',
        specialty: '',
        status: ''
      },
      pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      },
      judgeDialog: {
        visible: false,
        isEdit: false,
        loading: false
      },
      judgeForm: {
        judge_name: '',
        judge_username: '',
        judge_password: '',
        judge_sex: '',
        judge_phone: '',
        judge_email: '',
        judge_specialty: '',
        judge_level: '',
        judge_bio: ''
      },
      judgeRules: {
        judge_name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        judge_username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        judge_password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        judge_sex: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        judge_specialty: [
          { required: true, message: '请选择专业领域', trigger: 'change' }
        ],
        judge_level: [
          { required: true, message: '请选择裁判等级', trigger: 'change' }
        ]
      }
    };
  },

  async mounted() {
    await this.loadJudges();
  },

  methods: {
    // 加载裁判员列表
    async loadJudges() {
      this.loading = true;
      try {
        // 模拟数据 - 后续集成真实API
        this.judgeList = [
          {
            judge_id: 1,
            judge_name: '张裁判',
            judge_username: 'judge001',
            judge_sex: '男',
            judge_phone: '13800138001',
            judge_email: 'judge001@example.com',
            judge_specialty: 'track_field',
            judge_level: 'national',
            judge_status: 1
          },
          {
            judge_id: 2,
            judge_name: '李裁判',
            judge_username: 'judge002',
            judge_sex: '女',
            judge_phone: '13800138002',
            judge_email: 'judge002@example.com',
            judge_specialty: 'swimming',
            judge_level: 'first',
            judge_status: 1
          }
        ];
        this.pagination.total = this.judgeList.length;
      } catch (error) {
        console.error('加载裁判员列表失败:', error);
        this.$message.error('加载数据失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },

    // 搜索裁判员
    searchJudges() {
      this.pagination.currentPage = 1;
      this.loadJudges();
    },

    // 重置搜索
    resetSearch() {
      this.searchForm = {
        name: '',
        specialty: '',
        status: ''
      };
      this.loadJudges();
    },

    // 新增裁判员
    addJudge() {
      this.judgeDialog.isEdit = false;
      this.judgeDialog.visible = true;
      this.resetJudgeForm();
    },

    // 编辑裁判员
    editJudge(row) {
      this.judgeDialog.isEdit = true;
      this.judgeDialog.visible = true;
      this.judgeForm = { ...row };
    },

    // 查看裁判员详情
    viewJudge(row) {
      this.$message.info('查看功能开发中');
    },

    // 分配赛事
    assignEvents(row) {
      this.$message.info('赛事分配功能开发中');
    },

    // 删除裁判员
    deleteJudge(row) {
      this.$confirm('确定要删除该裁判员吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('删除成功');
        this.loadJudges();
      });
    },

    // 切换裁判员状态
    toggleJudgeStatus(row) {
      this.$message.success(`已${row.judge_status ? '启用' : '停用'}该裁判员`);
    },

    // 保存裁判员
    async saveJudge() {
      try {
        await this.$refs.judgeForm.validate();
        this.judgeDialog.loading = true;
        
        // 模拟保存操作
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.$message.success(`裁判员${this.judgeDialog.isEdit ? '更新' : '创建'}成功`);
        this.judgeDialog.visible = false;
        await this.loadJudges();
      } catch (error) {
        if (error !== 'validation') {
          console.error('保存裁判员失败:', error);
          this.$message.error('操作失败，请稍后重试');
        }
      } finally {
        this.judgeDialog.loading = false;
      }
    },

    // 重置裁判员表单
    resetJudgeForm() {
      this.judgeForm = {
        judge_name: '',
        judge_username: '',
        judge_password: '',
        judge_sex: '',
        judge_phone: '',
        judge_email: '',
        judge_specialty: '',
        judge_level: '',
        judge_bio: ''
      };
      if (this.$refs.judgeForm) {
        this.$refs.judgeForm.resetFields();
      }
    },

    // 重置对话框
    resetJudgeDialog() {
      this.resetJudgeForm();
    },

    // 分页处理
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.loadJudges();
    },

    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.loadJudges();
    },

    // 获取专业领域标签类型
    getSpecialtyTagType(specialty) {
      const types = {
        track_field: 'primary',
        swimming: 'success',
        ball_sports: 'warning',
        gymnastics: 'info'
      };
      return types[specialty] || 'default';
    },

    // 获取专业领域文本
    getSpecialtyText(specialty) {
      const texts = {
        track_field: '田径',
        swimming: '游泳',
        ball_sports: '球类',
        gymnastics: '体操'
      };
      return texts[specialty] || specialty;
    },

    // 获取等级标签类型
    getLevelTagType(level) {
      const types = {
        national: 'danger',
        first: 'warning',
        second: 'primary',
        third: 'info'
      };
      return types[level] || 'default';
    },

    // 获取等级文本
    getLevelText(level) {
      const texts = {
        national: '国家级',
        first: '一级',
        second: '二级',
        third: '三级'
      };
      return texts[level] || level;
    }
  }
};
</script>

<style scoped>
.judge-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-title {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.page-title i {
  margin-right: 8px;
  color: #409EFF;
}

.page-subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.search-section {
  margin-bottom: 20px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>

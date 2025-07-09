<template>
  <div class="judge-profile">
    <el-row :gutter="20">
      <!-- 个人信息编辑 -->
      <el-col :span="16">
        <el-card>
          <div slot="header">
            <span>个人信息</span>
            <el-button 
              style="float: right; padding: 3px 0" 
              type="text" 
              @click="toggleEdit"
            >
              {{ isEditing ? '取消编辑' : '编辑信息' }}
            </el-button>
          </div>
          
          <el-form
            ref="profileForm"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
            :disabled="!isEditing"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="姓名" prop="judge_name">
                  <el-input v-model="profileForm.judge_name" placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="性别" prop="judge_sex">
                  <el-select v-model="profileForm.judge_sex" placeholder="请选择性别" style="width: 100%">
                    <el-option label="男" value="男" />
                    <el-option label="女" value="女" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="联系电话" prop="judge_phone">
                  <el-input v-model="profileForm.judge_phone" placeholder="请输入联系电话" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱" prop="judge_email">
                  <el-input v-model="profileForm.judge_email" placeholder="请输入邮箱地址" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="专业特长" prop="judge_specialty">
              <el-input 
                v-model="profileForm.judge_specialty" 
                type="textarea" 
                :rows="3"
                placeholder="请输入您的专业特长，如：田径项目、游泳项目、球类项目等"
              />
            </el-form-item>
            
            <el-form-item label="用户名">
              <el-input v-model="profileForm.judge_username" disabled />
              <div class="form-tip">用户名不可修改</div>
            </el-form-item>
            
            <el-form-item label="账号状态">
              <el-tag :type="profileForm.judge_status === 1 ? 'success' : 'danger'">
                {{ profileForm.judge_status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </el-form-item>
            
            <el-form-item v-if="isEditing">
              <el-button type="primary" @click="saveProfile" :loading="saveLoading">
                保存修改
              </el-button>
              <el-button @click="cancelEdit">取消</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <!-- 侧边栏信息 -->
      <el-col :span="8">
        <!-- 头像和基本信息 -->
        <el-card class="profile-card">
          <div class="profile-header">
            <el-avatar :size="80" :src="avatarUrl">
              {{ profileForm.judge_name ? profileForm.judge_name.charAt(0) : 'J' }}
            </el-avatar>
            <h3>{{ profileForm.judge_name || '裁判员' }}</h3>
            <p>{{ profileForm.judge_specialty || '暂无专业特长' }}</p>
          </div>
        </el-card>
        
        <!-- 账号信息 -->
        <el-card style="margin-top: 20px;">
          <div slot="header">
            <span>账号信息</span>
          </div>
          <div class="account-info">
            <div class="info-item">
              <span class="label">注册时间：</span>
              <span class="value">{{ formatDate(profileForm.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后更新：</span>
              <span class="value">{{ formatDate(profileForm.updated_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">裁判员ID：</span>
              <span class="value">{{ profileForm.judge_id }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 快捷操作 -->
        <el-card style="margin-top: 20px;">
          <div slot="header">
            <span>快捷操作</span>
          </div>
          <div class="quick-actions">
            <el-button type="primary" size="small" @click="showPasswordDialog" icon="el-icon-key">
              修改密码
            </el-button>
            <el-button type="success" size="small" @click="goToEvents" icon="el-icon-calendar">
              我的赛事
            </el-button>
            <el-button type="warning" size="small" @click="goToScoreInput" icon="el-icon-edit">
              成绩录入
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      title="修改密码"
      :visible.sync="passwordDialogVisible"
      width="400px"
      @close="resetPasswordForm"
    >
      <el-form
        ref="passwordForm"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPasswordChange" :loading="passwordLoading">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getJudgeProfile, updateJudgeProfile, changeJudgePassword } from '@/api/demo';
import { permissionMixin } from '@/utils/permission';

export default {
  name: 'JudgeProfile',
  mixins: [permissionMixin],
  data() {
    return {
      loading: false,
      isEditing: false,
      saveLoading: false,
      avatarUrl: null,
      originalProfile: {},
      profileForm: {
        judge_id: '',
        judge_name: '',
        judge_username: '',
        judge_sex: '',
        judge_phone: '',
        judge_email: '',
        judge_specialty: '',
        judge_status: 1,
        created_at: '',
        updated_at: ''
      },
      profileRules: {
        judge_name: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        judge_sex: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        judge_phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        judge_email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },
      
      // 修改密码相关
      passwordDialogVisible: false,
      passwordLoading: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: this.validateConfirmPassword, trigger: 'blur' }
        ]
      }
    };
  },
  async created() {
    await this.loadProfile();
  },
  methods: {
    async loadProfile() {
      this.loading = true;
      try {
        const response = await getJudgeProfile();
        this.profileForm = { ...response.data };
        this.originalProfile = { ...response.data };
      } catch (error) {
        console.error('加载个人信息失败:', error);
        this.$message.error('加载个人信息失败');
      } finally {
        this.loading = false;
      }
    },
    
    toggleEdit() {
      this.isEditing = !this.isEditing;
      if (!this.isEditing) {
        this.cancelEdit();
      }
    },
    
    cancelEdit() {
      this.profileForm = { ...this.originalProfile };
      this.isEditing = false;
      if (this.$refs.profileForm) {
        this.$refs.profileForm.resetFields();
      }
    },
    
    async saveProfile() {
      try {
        await this.$refs.profileForm.validate();
        
        this.saveLoading = true;
        
        await updateJudgeProfile({
          judge_name: this.profileForm.judge_name,
          judge_sex: this.profileForm.judge_sex,
          judge_phone: this.profileForm.judge_phone,
          judge_email: this.profileForm.judge_email,
          judge_specialty: this.profileForm.judge_specialty
        });
        
        this.$message.success('个人信息更新成功');
        this.originalProfile = { ...this.profileForm };
        this.isEditing = false;
        
        // 更新store中的用户信息
        this.$store.commit('auth/SET_USER_NAME', this.profileForm.judge_name);
        
      } catch (error) {
        console.error('更新个人信息失败:', error);
        this.$message.error(error.response && error.response.data && error.response.data.message || '更新个人信息失败');
      } finally {
        this.saveLoading = false;
      }
    },
    
    // 密码相关方法
    showPasswordDialog() {
      this.passwordDialogVisible = true;
    },
    
    validateConfirmPassword(rule, value, callback) {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    },
    
    async submitPasswordChange() {
      try {
        await this.$refs.passwordForm.validate();
        
        this.passwordLoading = true;
        
        await changeJudgePassword({
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword,
          confirmPassword: this.passwordForm.confirmPassword
        });
        
        this.$message.success('密码修改成功');
        this.passwordDialogVisible = false;
        this.resetPasswordForm();
        
      } catch (error) {
        console.error('修改密码失败:', error);
        this.$message.error(error.response && error.response.data && error.response.data.message || '修改密码失败');
      } finally {
        this.passwordLoading = false;
      }
    },
    
    resetPasswordForm() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      if (this.$refs.passwordForm) {
        this.$refs.passwordForm.resetFields();
      }
    },
    
    // 导航方法
    goToEvents() {
      this.$router.push('/judge/events');
    },
    
    goToScoreInput() {
      this.$router.push('/judge/score-input');
    },
    
    // 工具方法
    formatDate(date) {
      if (!date) return '--';
      return new Date(date).toLocaleString('zh-CN');
    }
  }
};
</script>

<style scoped>
.judge-profile {
  padding: 0;
}

.profile-card {
  text-align: center;
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  overflow: hidden;
  position: relative;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.profile-header h3 {
  margin: 15px 0 5px 0;
  color: #303133;
}

.profile-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.account-info {
  padding: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #909399;
  font-size: 14px;
}

.info-item .value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions .el-button {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.quick-actions .el-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.quick-actions .el-button:hover::before {
  left: 100%;
}

.quick-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.quick-actions .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.quick-actions .el-button--primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.quick-actions .el-button--success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border: none;
}

.quick-actions .el-button--success:hover {
  background: linear-gradient(135deg, #3dd169 0%, #32e7c5 100%);
  box-shadow: 0 8px 24px rgba(67, 233, 123, 0.4);
}

.quick-actions .el-button--warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
}

.quick-actions .el-button--warning:hover {
  background: linear-gradient(135deg, #ee81f9 0%, #f3455a 100%);
  box-shadow: 0 8px 24px rgba(240, 147, 251, 0.4);
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  text-align: right;
}
</style>

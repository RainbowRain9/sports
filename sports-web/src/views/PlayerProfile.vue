<template>
  <div class="player-profile" v-loading="loading">
    <el-card>
      <div slot="header">
        <span>个人信息管理</span>
      </div>
      
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form 
            ref="profileForm" 
            :model="profileForm" 
            :rules="profileRules" 
            label-width="100px"
            class="profile-form"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="姓名" prop="player_name">
                  <el-input 
                    v-model="profileForm.player_name" 
                    :disabled="!editMode"
                    placeholder="请输入姓名"
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="性别" prop="player_sex">
                  <el-select 
                    v-model="profileForm.player_sex" 
                    :disabled="!editMode"
                    placeholder="请选择性别"
                    style="width: 100%"
                  >
                    <el-option label="男" value="男"></el-option>
                    <el-option label="女" value="女"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="生日" prop="player_birthday">
                  <el-date-picker
                    v-model="profileForm.player_birthday"
                    :disabled="!editMode"
                    type="date"
                    placeholder="选择生日"
                    style="width: 100%"
                    value-format="yyyy-MM-dd"
                  ></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="班级">
                  <el-input 
                    v-model="profileForm.player_class" 
                    disabled
                    placeholder="班级信息"
                  ></el-input>
                  <div class="field-note">班级信息不可修改</div>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="学号">
                  <el-input 
                    v-model="profileForm.player_studentid" 
                    disabled
                    placeholder="学号"
                  ></el-input>
                  <div class="field-note">学号不可修改</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="运动员编号">
                  <el-input 
                    v-model="profileForm.player_number" 
                    disabled
                    placeholder="运动员编号"
                  ></el-input>
                  <div class="field-note">编号不可修改</div>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用户名">
                  <el-input 
                    v-model="profileForm.player_username" 
                    disabled
                    placeholder="登录用户名"
                  ></el-input>
                  <div class="field-note">用户名不可修改</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="账号状态">
                  <el-tag :type="profileForm.player_status === 1 ? 'success' : 'danger'">
                    {{ profileForm.player_status === 1 ? '正常' : '禁用' }}
                  </el-tag>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item>
              <el-button v-if="!editMode" type="primary" @click="enableEdit">
                编辑信息
              </el-button>
              <template v-else>
                <el-button type="primary" @click="saveProfile" :loading="saving">
                  保存修改
                </el-button>
                <el-button @click="cancelEdit">取消</el-button>
              </template>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 修改密码 -->
        <el-tab-pane label="修改密码" name="password">
          <el-form 
            ref="passwordForm" 
            :model="passwordForm" 
            :rules="passwordRules" 
            label-width="100px"
            class="password-form"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input 
                v-model="passwordForm.oldPassword" 
                type="password" 
                placeholder="请输入原密码"
                show-password
              ></el-input>
            </el-form-item>
            
            <el-form-item label="新密码" prop="newPassword">
              <el-input 
                v-model="passwordForm.newPassword" 
                type="password" 
                placeholder="请输入新密码"
                show-password
              ></el-input>
            </el-form-item>
            
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                placeholder="请再次输入新密码"
                show-password
              ></el-input>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="changePassword" :loading="changingPassword">
                修改密码
              </el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { getPlayerProfile, updatePlayerProfile, changePlayerPassword } from '@/api/demo';

export default {
  name: 'PlayerProfile',
  data() {
    // 确认密码验证器
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };
    
    return {
      loading: false,
      saving: false,
      changingPassword: false,
      activeTab: 'basic',
      editMode: false,
      originalProfile: {},
      profileForm: {
        player_name: '',
        player_sex: '',
        player_birthday: '',
        player_class: '',
        player_studentid: '',
        player_number: '',
        player_username: '',
        player_status: 1
      },
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      profileRules: {
        player_name: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
        ],
        player_sex: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        player_birthday: [
          { required: true, message: '请选择生日', trigger: 'change' }
        ]
      },
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    };
  },
  async mounted() {
    await this.loadProfile();
  },
  methods: {
    async loadProfile() {
      this.loading = true;
      try {
        const result = await getPlayerProfile();
        if (result.success) {
          this.profileForm = { ...result.data };
          this.originalProfile = { ...result.data };
        } else {
          this.$message.error(result.message || '获取个人信息失败');
        }
      } catch (error) {
        console.error('获取个人信息失败:', error);
        this.$message.error('获取个人信息失败，请刷新重试');
      } finally {
        this.loading = false;
      }
    },
    
    enableEdit() {
      this.editMode = true;
    },
    
    cancelEdit() {
      this.editMode = false;
      this.profileForm = { ...this.originalProfile };
      this.$refs.profileForm.clearValidate();
    },
    
    async saveProfile() {
      try {
        const valid = await this.$refs.profileForm.validate();
        if (!valid) return;
        
        this.saving = true;
        
        // 只提交允许修改的字段
        const updateData = {
          player_name: this.profileForm.player_name,
          player_sex: this.profileForm.player_sex,
          player_birthday: this.profileForm.player_birthday
        };
        
        const result = await updatePlayerProfile(updateData);
        if (result.success) {
          this.$message.success('个人信息更新成功');
          this.originalProfile = { ...this.profileForm };
          this.editMode = false;
        } else {
          this.$message.error(result.message || '更新失败');
        }
      } catch (error) {
        console.error('更新个人信息失败:', error);
        this.$message.error('更新失败，请稍后重试');
      } finally {
        this.saving = false;
      }
    },
    
    async changePassword() {
      try {
        const valid = await this.$refs.passwordForm.validate();
        if (!valid) return;
        
        this.changingPassword = true;
        
        const result = await changePlayerPassword({
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword
        });
        
        if (result.success) {
          this.$message.success('密码修改成功');
          this.resetPasswordForm();
        } else {
          this.$message.error(result.message || '密码修改失败');
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        this.$message.error('修改密码失败，请稍后重试');
      } finally {
        this.changingPassword = false;
      }
    },
    
    resetPasswordForm() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.$refs.passwordForm.clearValidate();
    }
  }
};
</script>

<style scoped>
.player-profile {
  padding: 20px;
}

.profile-form, .password-form {
  max-width: 600px;
  margin: 20px 0;
}

.field-note {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.el-tabs--border-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>

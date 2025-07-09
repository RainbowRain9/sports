<template>
  <div class="judge-score-input">
    <!-- 赛事选择区域 -->
    <el-card class="event-selector">
      <div slot="header">
        <span>选择比赛项目</span>
      </div>
      <el-form :model="form" inline>
        <el-form-item label="比赛项目">
          <el-select 
            v-model="form.selectedEventId" 
            placeholder="请选择比赛项目" 
            @change="onEventChange"
            style="width: 300px"
          >
            <el-option
              v-for="event in availableEvents"
              :key="event.schedule_id"
              :label="`${event.schedule_name} (${formatDate(event.schedule_date)})`"
              :value="event.schedule_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadParticipants" :disabled="!form.selectedEventId">
            加载参赛选手
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 比赛信息展示 -->
    <el-card v-if="selectedEvent" class="event-info">
      <div slot="header">
        <span>比赛信息</span>
      </div>
      <div class="event-info-grid">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <span class="label">比赛项目:</span>
              <span class="value">{{ selectedEvent.schedule_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">比赛日期:</span>
              <span class="value">{{ formatDate(selectedEvent.schedule_date) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">比赛时间:</span>
              <span class="value">{{ formatTime(selectedEvent.schedule_starttime) }} - {{ formatTime(selectedEvent.schedule_endtime) }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 15px;">
          <el-col :span="8">
            <div class="info-item">
              <span class="label">报名人数:</span>
              <span class="value">{{ selectedEvent.registered_players }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">已录成绩:</span>
              <span class="value">{{ selectedEvent.scored_players }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">完成进度:</span>
              <div class="value">
                <el-progress
                  :percentage="getProgressPercentage(selectedEvent)"
                  :color="getProgressColor(selectedEvent)"
                  :stroke-width="6"
                />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 成绩录入区域 -->
    <el-card v-if="participants.length > 0">
      <div slot="header">
        <span>成绩录入</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="batchScoreMode = !batchScoreMode">
          {{ batchScoreMode ? '单个录入' : '批量录入' }}
        </el-button>
      </div>

      <!-- 批量录入模式 -->
      <div v-if="batchScoreMode" class="batch-input-section">
        <el-alert
          title="批量录入模式"
          description="您可以快速为多个运动员录入成绩，录入完成后点击保存按钮统一提交"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-table :data="participants" style="width: 100%">
          <el-table-column prop="player_number" label="参赛号" width="100" />
          <el-table-column prop="player_name" label="姓名" width="120" />
          <el-table-column prop="player_sex" label="性别" width="80" />
          <el-table-column prop="player_class" label="班级" width="100" />
          <el-table-column label="成绩录入" width="200">
            <template slot-scope="scope">
              <el-input
                v-model="scope.row.inputScore"
                placeholder="请输入成绩"
                type="number"
                :disabled="scope.row.current_score > 0"
                @keyup.enter.native="submitSingleScore(scope.row)"
              >
                <template slot="append">分</template>
              </el-input>
            </template>
          </el-table-column>
          <el-table-column prop="current_score" label="当前成绩" width="100">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.current_score > 0" type="success">
                {{ scope.row.current_score }}
              </el-tag>
              <span v-else class="no-score">未录入</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template slot-scope="scope">
              <el-button 
                v-if="scope.row.current_score === 0"
                size="mini" 
                type="primary" 
                @click="submitSingleScore(scope.row)"
                :disabled="!scope.row.inputScore"
                :loading="scope.row.submitting"
              >
                录入
              </el-button>
              <el-button 
                v-else
                size="mini" 
                type="warning" 
                @click="editScore(scope.row)"
              >
                修改
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="batch-actions" style="margin-top: 20px; text-align: center;">
          <el-button type="success" @click="batchSubmitScores" :loading="batchSubmitting">
            批量保存所有成绩
          </el-button>
        </div>
      </div>

      <!-- 单个录入模式 -->
      <div v-else class="single-input-section">
        <el-table :data="participants" style="width: 100%">
          <el-table-column prop="player_number" label="参赛号" width="100" />
          <el-table-column prop="player_name" label="姓名" width="120" />
          <el-table-column prop="player_sex" label="性别" width="80" />
          <el-table-column prop="player_class" label="班级" width="100" />
          <el-table-column prop="current_score" label="当前成绩" width="120">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.current_score > 0" type="success">
                {{ scope.row.current_score }}
              </el-tag>
              <span v-else class="no-score">未录入</span>
            </template>
          </el-table-column>
          <el-table-column prop="registration_status" label="报名状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="scope.row.registration_status === 2 ? 'success' : 'warning'">
                {{ scope.row.registration_status === 2 ? '已确认' : '待确认' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template slot-scope="scope">
              <el-button 
                v-if="scope.row.current_score === 0"
                size="mini" 
                type="primary" 
                @click="showScoreDialog(scope.row)"
                icon="el-icon-edit"
              >
                录入成绩
              </el-button>
              <el-button 
                v-else
                size="mini" 
                type="warning" 
                @click="showScoreDialog(scope.row)"
                icon="el-icon-edit-outline"
              >
                修改成绩
              </el-button>
              <el-button 
                v-if="scope.row.current_score > 0"
                size="mini" 
                type="danger" 
                @click="deleteScore(scope.row)"
                icon="el-icon-delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 空状态 -->
      <div v-if="participants.length === 0 && !participantsLoading" class="empty-state">
        <i class="el-icon-user"></i>
        <p>该比赛项目暂无参赛选手</p>
      </div>
    </el-card>

    <!-- 成绩录入对话框 -->
    <el-dialog
      :title="scoreDialog.isEdit ? '修改成绩' : '录入成绩'"
      :visible.sync="scoreDialog.visible"
      width="400px"
      @close="closeScoreDialog"
    >
      <el-form
        ref="scoreForm"
        :model="scoreDialog.form"
        :rules="scoreRules"
        label-width="80px"
      >
        <el-form-item label="运动员">
          <span>{{ scoreDialog.participant && scoreDialog.participant.player_name }} ({{ scoreDialog.participant && scoreDialog.participant.player_number }})</span>
        </el-form-item>
        <el-form-item label="比赛项目">
          <span>{{ selectedEvent && selectedEvent.schedule_name }}</span>
        </el-form-item>
        <el-form-item label="成绩" prop="score">
          <el-input
            v-model.number="scoreDialog.form.score"
            type="number"
            placeholder="请输入成绩"
            ref="scoreInput"
          >
            <template slot="append">分</template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="scoreDialog.form.notes"
            type="textarea"
            :rows="3"
            placeholder="可选，录入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="scoreDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitScore" :loading="scoreDialog.submitting">
          {{ scoreDialog.isEdit ? '更新' : '录入' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { 
  getJudgeAssignedEvents, 
  getEventParticipants, 
  createScore, 
  updateScore, 
  deleteScore 
} from '@/api/demo';
import { permissionMixin } from '@/utils/permission';

export default {
  name: 'JudgeScoreInput',
  mixins: [permissionMixin],
  data() {
    return {
      loading: false,
      participantsLoading: false,
      batchSubmitting: false,
      batchScoreMode: false,
      
      form: {
        selectedEventId: ''
      },
      
      availableEvents: [],
      selectedEvent: null,
      participants: [],
      
      // 成绩录入对话框
      scoreDialog: {
        visible: false,
        isEdit: false,
        submitting: false,
        participant: null,
        form: {
          score: '',
          notes: ''
        }
      },
      
      scoreRules: {
        score: [
          { required: true, message: '请输入成绩', trigger: 'blur' },
          { type: 'number', min: 0, max: 999, message: '成绩必须在0-999之间', trigger: 'blur' }
        ]
      }
    };
  },
  async created() {
    await this.loadAvailableEvents();
    
    // 如果URL中有eventId参数，自动选择该赛事
    const eventId = this.$route.query.eventId;
    if (eventId) {
      this.form.selectedEventId = parseInt(eventId);
      await this.onEventChange();
      await this.loadParticipants();
    }
  },
  methods: {
    async loadAvailableEvents() {
      this.loading = true;
      try {
        const response = await getJudgeAssignedEvents({ status: '1,2' }); // 已分配和已确认的赛事
        this.availableEvents = response.data;
      } catch (error) {
        console.error('加载可执裁赛事失败:', error);
        this.$message.error('加载可执裁赛事失败');
      } finally {
        this.loading = false;
      }
    },
    
    onEventChange() {
      this.selectedEvent = this.availableEvents.find(
        event => event.schedule_id === this.form.selectedEventId
      );
      this.participants = [];
    },
    
    async loadParticipants() {
      if (!this.form.selectedEventId) {
        this.$message.warning('请先选择比赛项目');
        return;
      }
      
      this.participantsLoading = true;
      try {
        const response = await getEventParticipants(this.form.selectedEventId);
        this.participants = response.data.map(participant => ({
          ...participant,
          inputScore: '',
          submitting: false
        }));
      } catch (error) {
        console.error('加载参赛选手失败:', error);
        this.$message.error('加载参赛选手失败');
      } finally {
        this.participantsLoading = false;
      }
    },
    
    // 单个成绩录入
    showScoreDialog(participant) {
      this.scoreDialog.participant = participant;
      this.scoreDialog.isEdit = participant.current_score > 0;
      this.scoreDialog.form.score = participant.current_score || '';
      this.scoreDialog.form.notes = '';
      this.scoreDialog.visible = true;
      
      this.$nextTick(() => {
        if (this.$refs.scoreInput) {
          this.$refs.scoreInput.focus();
        }
      });
    },
    
    closeScoreDialog() {
      this.scoreDialog = {
        visible: false,
        isEdit: false,
        submitting: false,
        participant: null,
        form: {
          score: '',
          notes: ''
        }
      };
      if (this.$refs.scoreForm) {
        this.$refs.scoreForm.resetFields();
      }
    },
    
    async submitScore() {
      try {
        await this.$refs.scoreForm.validate();
        
        this.scoreDialog.submitting = true;
        
        if (this.scoreDialog.isEdit) {
          // 更新成绩
          await updateScore(this.scoreDialog.participant.score_id, {
            score: this.scoreDialog.form.score,
            notes: this.scoreDialog.form.notes
          });
          this.$message.success('成绩更新成功');
        } else {
          // 录入新成绩
          await createScore({
            player_id: this.scoreDialog.participant.player_id,
            schedule_id: this.form.selectedEventId,
            score: this.scoreDialog.form.score,
            notes: this.scoreDialog.form.notes
          });
          this.$message.success('成绩录入成功');
        }
        
        this.scoreDialog.visible = false;
        await this.loadParticipants(); // 重新加载数据
        
      } catch (error) {
        console.error('提交成绩失败:', error);
        this.$message.error(error.response && error.response.data && error.response.data.message || '提交成绩失败');
      } finally {
        this.scoreDialog.submitting = false;
      }
    },
    
    // 批量录入相关方法
    async submitSingleScore(participant) {
      if (!participant.inputScore) {
        this.$message.warning('请输入成绩');
        return;
      }
      
      participant.submitting = true;
      try {
        await createScore({
          player_id: participant.player_id,
          schedule_id: this.form.selectedEventId,
          score: parseFloat(participant.inputScore)
        });
        
        this.$message.success(`${participant.player_name} 成绩录入成功`);
        await this.loadParticipants(); // 重新加载数据
        
      } catch (error) {
        console.error('录入成绩失败:', error);
        this.$message.error(error.response && error.response.data && error.response.data.message || '录入成绩失败');
      } finally {
        participant.submitting = false;
      }
    },
    
    async batchSubmitScores() {
      const pendingScores = this.participants.filter(p => p.inputScore && p.current_score === 0);
      
      if (pendingScores.length === 0) {
        this.$message.warning('没有需要录入的成绩');
        return;
      }
      
      this.batchSubmitting = true;
      let successCount = 0;
      
      try {
        for (const participant of pendingScores) {
          try {
            await createScore({
              player_id: participant.player_id,
              schedule_id: this.form.selectedEventId,
              score: parseFloat(participant.inputScore)
            });
            successCount++;
          } catch (error) {
            console.error(`录入 ${participant.player_name} 成绩失败:`, error);
          }
        }
        
        this.$message.success(`批量录入完成，成功录入 ${successCount} 个成绩`);
        await this.loadParticipants(); // 重新加载数据
        
      } finally {
        this.batchSubmitting = false;
      }
    },
    
    async deleteScore(participant) {
      try {
        await this.$confirm('确定要删除这个成绩记录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await deleteScore(participant.score_id);
        this.$message.success('成绩删除成功');
        await this.loadParticipants(); // 重新加载数据
        
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除成绩失败:', error);
          this.$message.error(error.response && error.response.data && error.response.data.message || '删除成绩失败');
        }
      }
    },
    
    // 工具方法
    formatDate(date) {
      if (!date) return '--';
      return new Date(date).toLocaleDateString('zh-CN');
    },
    
    formatTime(time) {
      if (!time) return '--';
      return time.substring(0, 5);
    },
    
    getProgressPercentage(event) {
      if (event.registered_players === 0) return 0;
      return Math.round((event.scored_players / event.registered_players) * 100);
    },
    
    getProgressColor(event) {
      const percentage = this.getProgressPercentage(event);
      if (percentage === 100) return '#67c23a';
      if (percentage >= 50) return '#e6a23c';
      return '#f56c6c';
    }
  }
};
</script>

<style scoped>
.judge-score-input {
  padding: 0;
}

.event-selector,
.event-info {
  margin-bottom: 24px;
}

.event-selector .el-card,
.event-info .el-card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.event-selector .el-card:hover,
.event-info .el-card:hover {
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.event-info-grid {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 2px solid #e9ecef;
  position: relative;
  overflow: hidden;
}

.event-info-grid::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  min-width: 80px;
}

.info-item .value {
  color: #303133;
  flex: 1;
}

.batch-input-section,
.single-input-section {
  padding: 0;
}

.batch-actions {
  border-top: 1px solid #e6e6e6;
  padding-top: 20px;
}

.no-score {
  color: #c0c4cc;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 20px;
  display: block;
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

.dialog-footer {
  text-align: right;
}
</style>

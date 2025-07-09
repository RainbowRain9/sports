#!/usr/bin/env node

/**
 * 裁判员系统功能测试脚本
 * 用于自动化测试裁判员专用功能模块的API接口
 */

const axios = require('axios');
const colors = require('colors');

// 配置
const config = {
  baseURL: 'http://localhost:7001',
  timeout: 10000
};

// 创建axios实例
const api = axios.create(config);

// 测试数据
const testData = {
  judge: {
    username: 'judge001',
    password: '123456'
  },
  updateProfile: {
    judge_name: '张裁判（测试）',
    judge_sex: '男',
    judge_phone: '13800138001',
    judge_email: 'judge001@test.com',
    judge_specialty: '田径项目、跳跃类项目'
  },
  changePassword: {
    oldPassword: '123456',
    newPassword: '123456',
    confirmPassword: '123456'
  }
};

// 全局变量
let authToken = '';
let judgeId = '';

// 工具函数
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'success':
      console.log(`${prefix} ✅ ${message}`.green);
      break;
    case 'error':
      console.log(`${prefix} ❌ ${message}`.red);
      break;
    case 'warning':
      console.log(`${prefix} ⚠️  ${message}`.yellow);
      break;
    case 'info':
    default:
      console.log(`${prefix} ℹ️  ${message}`.blue);
      break;
  }
}

function logSection(title) {
  console.log('\n' + '='.repeat(50).cyan);
  console.log(`🧪 ${title}`.cyan.bold);
  console.log('='.repeat(50).cyan);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试函数
async function testJudgeLogin() {
  logSection('裁判员登录测试');
  
  try {
    const response = await api.post('/api/auth/login', {
      userType: 'judge',
      username: testData.judge.username,
      password: testData.judge.password
    });
    
    if (response.data.success) {
      authToken = response.data.data.token;
      judgeId = response.data.data.user.id;
      
      // 设置默认请求头
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      log(`登录成功，用户: ${response.data.data.user.name}`, 'success');
      log(`Token: ${authToken.substring(0, 20)}...`, 'info');
      return true;
    } else {
      log(`登录失败: ${response.data.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`登录请求失败: ${error.message}`, 'error');
    return false;
  }
}

async function testGetProfile() {
  logSection('获取个人信息测试');
  
  try {
    const response = await api.get('/api/judge/profile');
    
    if (response.data.success) {
      const profile = response.data.data;
      log(`获取个人信息成功`, 'success');
      log(`姓名: ${profile.judge_name}`, 'info');
      log(`专业特长: ${profile.judge_specialty}`, 'info');
      log(`账号状态: ${profile.judge_status === 1 ? '正常' : '禁用'}`, 'info');
      return true;
    } else {
      log(`获取个人信息失败: ${response.data.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`获取个人信息请求失败: ${error.message}`, 'error');
    return false;
  }
}

async function testUpdateProfile() {
  logSection('更新个人信息测试');
  
  try {
    const response = await api.put('/api/judge/profile', testData.updateProfile);
    
    if (response.data.success) {
      log('个人信息更新成功', 'success');
      return true;
    } else {
      log(`个人信息更新失败: ${response.data.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`更新个人信息请求失败: ${error.message}`, 'error');
    return false;
  }
}

async function testGetStats() {
  logSection('获取统计信息测试');
  
  try {
    const response = await api.get('/api/judge/stats');
    
    if (response.data.success) {
      const stats = response.data.data;
      log('获取统计信息成功', 'success');
      log(`分配赛事: ${stats.workStats.assigned_events}`, 'info');
      log(`已完成赛事: ${stats.workStats.completed_events}`, 'info');
      log(`录入成绩: ${stats.workStats.scored_records}`, 'info');
      log(`今日赛事: ${stats.workStats.today_events}`, 'info');
      log(`待执裁赛事: ${stats.workStats.upcoming_events}`, 'info');
      return true;
    } else {
      log(`获取统计信息失败: ${response.data.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`获取统计信息请求失败: ${error.message}`, 'error');
    return false;
  }
}

async function testGetAssignedEvents() {
  logSection('获取分配赛事测试');
  
  try {
    const response = await api.get('/api/judge/events');
    
    if (response.data.success) {
      const events = response.data.data;
      log(`获取分配赛事成功，共 ${events.length} 个赛事`, 'success');
      
      events.forEach((event, index) => {
        log(`赛事 ${index + 1}: ${event.schedule_name} (${event.schedule_date})`, 'info');
        log(`  报名人数: ${event.registered_players}, 已录成绩: ${event.scored_players}`, 'info');
      });
      
      return events.length > 0 ? events[0] : null;
    } else {
      log(`获取分配赛事失败: ${response.data.message}`, 'error');
      return null;
    }
  } catch (error) {
    log(`获取分配赛事请求失败: ${error.message}`, 'error');
    return null;
  }
}

async function testGetEventParticipants(scheduleId) {
  logSection('获取参赛选手测试');
  
  try {
    const response = await api.get(`/api/judge/events/${scheduleId}/participants`);
    
    if (response.data.success) {
      const participants = response.data.data;
      log(`获取参赛选手成功，共 ${participants.length} 人`, 'success');
      
      participants.forEach((participant, index) => {
        log(`选手 ${index + 1}: ${participant.player_name} (${participant.player_number})`, 'info');
        log(`  当前成绩: ${participant.current_score || '未录入'}`, 'info');
      });
      
      return participants.length > 0 ? participants[0] : null;
    } else {
      log(`获取参赛选手失败: ${response.data.message}`, 'error');
      return null;
    }
  } catch (error) {
    log(`获取参赛选手请求失败: ${error.message}`, 'error');
    return null;
  }
}

async function testScoreInput(participant, scheduleId) {
  logSection('成绩录入测试');
  
  if (!participant) {
    log('没有可用的参赛选手进行测试', 'warning');
    return false;
  }
  
  try {
    // 如果已有成绩，跳过录入测试
    if (participant.current_score > 0) {
      log(`选手 ${participant.player_name} 已有成绩: ${participant.current_score}`, 'warning');
      return true;
    }
    
    const testScore = Math.floor(Math.random() * 100) + 50; // 50-149的随机成绩
    
    const response = await api.post('/api/judge/scores', {
      player_id: participant.player_id,
      schedule_id: scheduleId,
      score: testScore,
      notes: '自动化测试录入'
    });
    
    if (response.data.success) {
      log(`成绩录入成功: ${participant.player_name} - ${testScore}分`, 'success');
      return true;
    } else {
      log(`成绩录入失败: ${response.data.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`成绩录入请求失败: ${error.message}`, 'error');
    return false;
  }
}

async function testChangePassword() {
  logSection('修改密码测试');
  
  try {
    const response = await api.put('/api/judge/password', testData.changePassword);
    
    if (response.data.success) {
      log('密码修改成功', 'success');
      return true;
    } else {
      log(`密码修改失败: ${response.data.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`密码修改请求失败: ${error.message}`, 'error');
    return false;
  }
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始裁判员系统功能测试'.rainbow.bold);
  console.log(`📡 测试服务器: ${config.baseURL}`.gray);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  const tests = [
    { name: '裁判员登录', func: testJudgeLogin },
    { name: '获取个人信息', func: testGetProfile },
    { name: '更新个人信息', func: testUpdateProfile },
    { name: '获取统计信息', func: testGetStats },
    { name: '获取分配赛事', func: testGetAssignedEvents },
    { name: '修改密码', func: testChangePassword }
  ];
  
  let firstEvent = null;
  let firstParticipant = null;
  
  for (const test of tests) {
    results.total++;
    
    try {
      const result = await test.func();
      
      if (result) {
        results.passed++;
        
        // 保存第一个赛事用于后续测试
        if (test.name === '获取分配赛事' && result.schedule_id) {
          firstEvent = result;
        }
      } else {
        results.failed++;
      }
    } catch (error) {
      log(`测试 "${test.name}" 执行异常: ${error.message}`, 'error');
      results.failed++;
    }
    
    await sleep(1000); // 等待1秒
  }
  
  // 如果有赛事，测试参赛选手和成绩录入
  if (firstEvent) {
    results.total++;
    firstParticipant = await testGetEventParticipants(firstEvent.schedule_id);
    if (firstParticipant) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    await sleep(1000);
    
    results.total++;
    const scoreResult = await testScoreInput(firstParticipant, firstEvent.schedule_id);
    if (scoreResult) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // 输出测试结果
  logSection('测试结果汇总');
  log(`总测试数: ${results.total}`, 'info');
  log(`通过: ${results.passed}`, 'success');
  log(`失败: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
  log(`成功率: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed === 0 ? 'success' : 'warning');
  
  if (results.failed === 0) {
    console.log('\n🎉 所有测试通过！裁判员系统功能正常！'.green.bold);
  } else {
    console.log('\n⚠️  部分测试失败，请检查系统配置和日志。'.yellow.bold);
  }
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  log(`未处理的Promise拒绝: ${reason}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`未捕获的异常: ${error.message}`, 'error');
  process.exit(1);
});

// 启动测试
if (require.main === module) {
  runTests().catch(error => {
    log(`测试执行失败: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testJudgeLogin,
  testGetProfile,
  testUpdateProfile,
  testGetStats,
  testGetAssignedEvents,
  testGetEventParticipants,
  testScoreInput,
  testChangePassword
};

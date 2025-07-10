'use strict';

const Service = require('egg').Service;

/**
 * 数据统计服务
 * 处理各种统计数据的业务逻辑
 */
class StatisticsService extends Service {

  /**
   * 获取系统概览统计数据
   */
  async getSystemOverview() {
    const { app } = this;
    
    try {
      // 使用统计视图获取基础数据
      const [overviewResult] = await app.mysql.query('SELECT * FROM v_statistics_overview');
      
      // 获取今日新增数据
      const todayStats = await app.mysql.query(`
        SELECT
          (SELECT COUNT(*) FROM registration WHERE DATE(registration_time) = CURDATE()) as today_registrations,
          (SELECT COUNT(*) FROM plog) as today_scores,
          (SELECT COUNT(*) FROM player WHERE DATE(created_at) = CURDATE()) as today_players
      `);
      
      return {
        overview: overviewResult,
        todayStats: todayStats[0]
      };
      
    } catch (error) {
      this.logger.error('获取系统概览数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取班级参与统计
   */
  async getClassParticipation() {
    const { app } = this;
    
    try {
      // 获取班级基础统计
      const classStats = await app.mysql.query('SELECT * FROM v_class_stats');
      
      // 获取班级报名参与情况
      const participationStats = await app.mysql.query(`
        SELECT 
          p.player_class,
          COUNT(DISTINCT r.player_id) as participating_students,
          COUNT(r.registration_id) as total_registrations,
          COUNT(CASE WHEN r.registration_status = 2 THEN 1 END) as approved_registrations,
          ROUND(COUNT(DISTINCT r.player_id) * 100.0 / COUNT(DISTINCT p.player_id), 2) as participation_rate
        FROM player p
        LEFT JOIN registration r ON p.player_id = r.player_id
        WHERE p.player_status = 1
        GROUP BY p.player_class
        ORDER BY participation_rate DESC
      `);
      
      return {
        classStats,
        participationStats
      };
      
    } catch (error) {
      this.logger.error('获取班级参与统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目热度统计
   */
  async getEventPopularity() {
    const { app } = this;
    
    try {
      const eventStats = await app.mysql.query('SELECT * FROM v_event_stats ORDER BY registration_count DESC');
      
      // 获取项目类型统计
      const typeStats = await app.mysql.query(`
        SELECT 
          p.type_name,
          COUNT(c.schedule_id) as event_count,
          COUNT(r.registration_id) as total_registrations,
          COUNT(pl.plog_id) as total_scores
        FROM project p
        LEFT JOIN competition c ON p.type_id = c.schedule_itemid
        LEFT JOIN registration r ON c.schedule_id = r.schedule_id
        LEFT JOIN plog pl ON c.schedule_id = pl.plog_scheduleid
        GROUP BY p.type_id, p.type_name
        ORDER BY total_registrations DESC
      `);
      
      return {
        eventStats,
        typeStats
      };
      
    } catch (error) {
      this.logger.error('获取项目热度统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取性别分布统计
   */
  async getGenderDistribution() {
    const { app } = this;
    
    try {
      // 总体性别分布
      const genderStats = await app.mysql.query(`
        SELECT 
          player_sex as gender,
          COUNT(*) as total_count,
          COUNT(DISTINCT r.player_id) as participating_count,
          COUNT(r.registration_id) as registration_count,
          COUNT(pl.plog_id) as score_count,
          ROUND(AVG(pl.plog_score), 2) as avg_score
        FROM player p
        LEFT JOIN registration r ON p.player_id = r.player_id AND r.registration_status = 2
        LEFT JOIN plog pl ON p.player_id = pl.plog_playerid
        WHERE p.player_status = 1
        GROUP BY p.player_sex
      `);
      
      // 各项目性别参与情况
      const eventGenderStats = await app.mysql.query(`
        SELECT 
          c.schedule_name,
          p.player_sex as gender,
          COUNT(r.registration_id) as registration_count,
          COUNT(pl.plog_id) as score_count
        FROM competition c
        LEFT JOIN registration r ON c.schedule_id = r.schedule_id AND r.registration_status = 2
        LEFT JOIN player p ON r.player_id = p.player_id
        LEFT JOIN plog pl ON r.player_id = pl.plog_playerid AND pl.plog_scheduleid = c.schedule_id
        WHERE p.player_status = 1
        GROUP BY c.schedule_id, c.schedule_name, p.player_sex
        ORDER BY c.schedule_name, p.player_sex
      `);
      
      return {
        genderStats,
        eventGenderStats
      };
      
    } catch (error) {
      this.logger.error('获取性别分布统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取报名趋势统计
   */
  async getRegistrationTrend(days = 7) {
    const { app } = this;
    
    try {
      const trendData = await app.mysql.query(`
        SELECT 
          DATE(registration_time) as date,
          COUNT(*) as total_registrations,
          COUNT(CASE WHEN registration_status = 1 THEN 1 END) as pending_count,
          COUNT(CASE WHEN registration_status = 2 THEN 1 END) as approved_count,
          COUNT(CASE WHEN registration_status = 3 THEN 1 END) as rejected_count
        FROM registration 
        WHERE registration_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(registration_time)
        ORDER BY date DESC
      `, [days]);
      
      // 获取每小时报名分布（今日）
      const hourlyData = await app.mysql.query(`
        SELECT 
          HOUR(registration_time) as hour,
          COUNT(*) as registration_count
        FROM registration 
        WHERE DATE(registration_time) = CURDATE()
        GROUP BY HOUR(registration_time)
        ORDER BY hour
      `);
      
      return {
        trendData,
        hourlyData
      };
      
    } catch (error) {
      this.logger.error('获取报名趋势统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取成绩分析统计
   */
  async getScoreAnalysis() {
    const { app } = this;
    
    try {
      // 各项目成绩统计
      const scoreStats = await app.mysql.query(`
        SELECT 
          c.schedule_name,
          COUNT(pl.plog_id) as score_count,
          ROUND(AVG(pl.plog_score), 2) as avg_score,
          MAX(pl.plog_score) as max_score,
          MIN(pl.plog_score) as min_score,
          ROUND(STDDEV(pl.plog_score), 2) as score_stddev
        FROM competition c
        LEFT JOIN plog pl ON c.schedule_id = pl.plog_scheduleid
        WHERE pl.plog_id IS NOT NULL
        GROUP BY c.schedule_id, c.schedule_name
        ORDER BY score_count DESC
      `);
      
      // 成绩分布区间统计
      const scoreDistribution = await app.mysql.query(`
        SELECT 
          c.schedule_name,
          CASE 
            WHEN pl.plog_score >= (SELECT MAX(plog_score) * 0.8 FROM plog WHERE plog_scheduleid = c.schedule_id) THEN '优秀'
            WHEN pl.plog_score >= (SELECT MAX(plog_score) * 0.6 FROM plog WHERE plog_scheduleid = c.schedule_id) THEN '良好'
            WHEN pl.plog_score >= (SELECT MAX(plog_score) * 0.4 FROM plog WHERE plog_scheduleid = c.schedule_id) THEN '一般'
            ELSE '待提高'
          END as score_level,
          COUNT(*) as count
        FROM competition c
        INNER JOIN plog pl ON c.schedule_id = pl.plog_scheduleid
        GROUP BY c.schedule_id, c.schedule_name, score_level
        ORDER BY c.schedule_name, score_level
      `);
      
      return {
        scoreStats,
        scoreDistribution
      };
      
    } catch (error) {
      this.logger.error('获取成绩分析统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统状态信息
   */
  async getSystemStatus() {
    const { app } = this;

    try {
      // 数据库连接状态测试
      let dbStatus = 'disconnected';
      let dbError = null;

      try {
        const testResult = await app.mysql.query('SELECT 1 as test_connection');
        if (testResult && testResult.length > 0) {
          dbStatus = 'connected';
        }
      } catch (dbErr) {
        this.logger.error('数据库连接测试失败:', dbErr);
        dbError = dbErr.message;
      }

      // 系统运行时间（秒）
      const uptimeSeconds = Math.floor(process.uptime());

      // 内存使用情况（字节转MB）
      const memoryUsage = process.memoryUsage();
      const memoryStats = {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // 常驻内存
        external: Math.round(memoryUsage.external / 1024 / 1024) // 外部内存
      };

      // CPU使用情况
      const cpuUsage = process.cpuUsage();

      // 最近操作日志（如果表存在）
      let recentLogs = [];
      try {
        recentLogs = await app.mysql.query(`
          SELECT operation, target_type, target_id, result, created_at
          FROM operation_log
          ORDER BY created_at DESC
          LIMIT 5
        `);
      } catch (logErr) {
        // 如果operation_log表不存在，忽略错误
        this.logger.warn('操作日志表不存在或查询失败:', logErr.message);
      }

      // 系统信息
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        startTime: new Date(Date.now() - uptimeSeconds * 1000).toISOString()
      };

      return {
        database: {
          status: dbStatus,
          timestamp: new Date().toISOString(),
          error: dbError
        },
        server: {
          uptime: uptimeSeconds,
          memory: memoryStats,
          cpu: {
            user: Math.round(cpuUsage.user / 1000), // 微秒转毫秒
            system: Math.round(cpuUsage.system / 1000)
          },
          system: systemInfo
        },
        recentLogs: recentLogs || [],
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('获取系统状态失败:', error);

      // 即使出错也返回基本信息
      return {
        database: {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message
        },
        server: {
          uptime: Math.floor(process.uptime()),
          memory: {
            used: 0,
            total: 0,
            rss: 0,
            external: 0
          },
          cpu: {
            user: 0,
            system: 0
          },
          system: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid
          }
        },
        recentLogs: [],
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 获取Dashboard综合数据
   */
  async getDashboardData() {
    const { app } = this;
    
    try {
      // 并行获取各种统计数据
      const [overview, classStats, eventStats, genderStats] = await Promise.all([
        this.getSystemOverview(),
        this.getClassParticipation(),
        this.getEventPopularity(),
        this.getGenderDistribution()
      ]);
      
      return {
        overview: overview.overview,
        todayStats: overview.todayStats,
        topClasses: classStats.participationStats.slice(0, 5),
        topEvents: eventStats.eventStats.slice(0, 5),
        genderDistribution: genderStats.genderStats
      };
      
    } catch (error) {
      this.logger.error('获取Dashboard数据失败:', error);
      throw error;
    }
  }
}

module.exports = StatisticsService;

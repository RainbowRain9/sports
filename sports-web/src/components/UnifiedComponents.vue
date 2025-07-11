<!-- 统一样式组件库 -->
<template>
  <div>
    <!-- 这是一个组件库文件，包含统一样式的可复用组件 -->
  </div>
</template>

<script>
export default {
  name: 'UnifiedComponents'
}
</script>

<style scoped>
/* =============================================
   统一样式组件 - 可复用组件样式
   ============================================= */

/* 1. 统一卡片组件 */
.unified-card {
  border-radius: var(--radius-xl, 16px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #ebeef5;
  overflow: hidden;
  background: white;
}

.unified-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

.unified-card.gradient-border::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

/* 2. 统一按钮组件 */
.unified-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  position: relative;
  overflow: hidden;
  padding: 12px 24px;
  font-size: 14px;
  cursor: pointer;
}

.unified-btn:hover {
  transform: translateY(-1px);
}

.unified-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.unified-btn.primary:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.unified-btn.secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.unified-btn.secondary:hover {
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4);
}

.unified-btn.success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.unified-btn.success:hover {
  box-shadow: 0 4px 16px rgba(67, 233, 123, 0.4);
}

.unified-btn.info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.unified-btn.info:hover {
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.4);
}

.unified-btn.warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.unified-btn.warning:hover {
  box-shadow: 0 4px 16px rgba(250, 112, 154, 0.4);
}

/* 3. 统一表格样式 */
.unified-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.unified-table .el-table__header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.unified-table .el-table__header th {
  background: transparent;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  color: #495057;
}

.unified-table .el-table__body tr:hover {
  background-color: rgba(102, 126, 234, 0.05);
}

/* 4. 统一表单样式 */
.unified-form {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.unified-form .el-form-item__label {
  font-weight: 600;
  color: #495057;
}

.unified-form .el-input__inner,
.unified-form .el-textarea__inner {
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.unified-form .el-input__inner:focus,
.unified-form .el-textarea__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 5. 统一对话框样式 */
.unified-dialog .el-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.unified-dialog .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
}

.unified-dialog .el-dialog__title {
  font-weight: 600;
  font-size: 18px;
}

.unified-dialog .el-dialog__headerbtn {
  top: 20px;
  right: 24px;
}

.unified-dialog .el-dialog__headerbtn .el-dialog__close {
  color: white;
  font-size: 20px;
}

.unified-dialog .el-dialog__body {
  padding: 24px;
}

/* 6. 统一标签样式 */
.unified-tag {
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border: none;
}

.unified-tag.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.unified-tag.success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.unified-tag.warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.unified-tag.info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

/* 7. 统一加载样式 */
.unified-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #667eea;
}

.unified-loading .el-loading-spinner {
  color: #667eea;
}

/* 8. 统一分页样式 */
.unified-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.unified-pagination .el-pagination {
  background: white;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.unified-pagination .el-pagination .el-pager li {
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.3s ease;
}

.unified-pagination .el-pagination .el-pager li:hover {
  background-color: rgba(102, 126, 234, 0.1);
}

.unified-pagination .el-pagination .el-pager li.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 9. 统一搜索框样式 */
.unified-search {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.unified-search .el-input-group__prepend {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

/* 10. 统一消息提示样式 */
.unified-message {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.unified-message.success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border: none;
}

.unified-message.warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  border: none;
}

.unified-message.error {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
}

.unified-message.info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
}

/* 11. 统一工具提示样式 */
.unified-tooltip {
  background: rgba(0,0,0,0.8);
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

/* 12. 统一下拉菜单样式 */
.unified-dropdown {
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.unified-dropdown .el-dropdown-menu__item {
  transition: all 0.3s ease;
}

.unified-dropdown .el-dropdown-menu__item:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

/* 13. 响应式工具类 */
@media (max-width: 768px) {
  .unified-card {
    margin: 0 8px;
    border-radius: 12px;
  }
  
  .unified-form {
    padding: 16px;
    margin: 0 8px;
  }
  
  .unified-search {
    padding: 16px;
    margin: 0 8px 16px 8px;
  }
}

/* 14. 动画类 */
.unified-fade-enter-active,
.unified-fade-leave-active {
  transition: opacity 0.3s ease;
}

.unified-fade-enter,
.unified-fade-leave-to {
  opacity: 0;
}

.unified-slide-enter-active,
.unified-slide-leave-active {
  transition: transform 0.3s ease;
}

.unified-slide-enter,
.unified-slide-leave-to {
  transform: translateX(100%);
}
</style>

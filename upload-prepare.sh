#!/bin/bash

# 体育赛事管理系统 - 上传准备脚本
# 版本: v1.3.2
# 日期: 2025-01-09

echo "🚀 体育赛事管理系统 - 上传准备脚本"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 已安装${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 未安装${NC}"
        return 1
    fi
}

# 步骤1: 环境检查
echo -e "\n${BLUE}📋 步骤1: 环境检查${NC}"
echo "------------------------"

check_command "git"
check_command "node"
check_command "npm"

# 步骤2: 项目清理
echo -e "\n${BLUE}🧹 步骤2: 项目清理${NC}"
echo "------------------------"

echo "正在清理 node_modules 目录..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "${GREEN}✅ 根目录 node_modules 已清理${NC}"
fi

if [ -d "sports-web/node_modules" ]; then
    rm -rf sports-web/node_modules
    echo -e "${GREEN}✅ 前端 node_modules 已清理${NC}"
fi

if [ -d "sports-backend/node_modules" ]; then
    rm -rf sports-backend/node_modules
    echo -e "${GREEN}✅ 后端 node_modules 已清理${NC}"
fi

echo "正在清理日志文件..."
if [ -d "sports-backend/logs" ]; then
    rm -rf sports-backend/logs/*
    echo -e "${GREEN}✅ 后端日志文件已清理${NC}"
fi

echo "正在清理临时文件..."
find . -name "*.log" -delete 2>/dev/null
find . -name ".DS_Store" -delete 2>/dev/null
find . -name "Thumbs.db" -delete 2>/dev/null
find . -name "*.tmp" -delete 2>/dev/null
echo -e "${GREEN}✅ 临时文件已清理${NC}"

# 步骤3: 文件检查
echo -e "\n${BLUE}📁 步骤3: 关键文件检查${NC}"
echo "------------------------"

# 检查关键文件
files_to_check=(
    "README.md"
    "UPLOAD_GUIDE.md"
    "sports-web/package.json"
    "sports-backend/package.json"
    "sports-backend/sports.sql"
    ".gitignore"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file 缺失${NC}"
    fi
done

# 步骤4: 配置检查
echo -e "\n${BLUE}⚙️ 步骤4: 配置文件检查${NC}"
echo "------------------------"

# 检查前端配置
if [ -f "sports-web/.env" ]; then
    echo -e "${GREEN}✅ 前端环境配置文件存在${NC}"
    echo "   内容预览:"
    head -3 sports-web/.env | sed 's/^/   /'
else
    echo -e "${YELLOW}⚠️ 前端环境配置文件不存在${NC}"
fi

# 检查后端配置
if [ -f "sports-backend/config/config.local.js" ]; then
    echo -e "${GREEN}✅ 后端配置文件存在${NC}"
    echo -e "${YELLOW}⚠️ 注意: 上传前请确认数据库密码已脱敏${NC}"
else
    echo -e "${RED}❌ 后端配置文件不存在${NC}"
fi

# 步骤5: 项目大小检查
echo -e "\n${BLUE}📊 步骤5: 项目大小检查${NC}"
echo "------------------------"

project_size=$(du -sh . 2>/dev/null | cut -f1)
echo "项目总大小: $project_size"

# 检查大文件
echo "检查大文件 (>10MB):"
find . -type f -size +10M 2>/dev/null | while read file; do
    size=$(du -sh "$file" | cut -f1)
    echo -e "${YELLOW}⚠️ 大文件: $file ($size)${NC}"
done

# 步骤6: Git 状态检查
echo -e "\n${BLUE}📝 步骤6: Git 状态检查${NC}"
echo "------------------------"

if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git 仓库已初始化${NC}"
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️ 有未提交的更改${NC}"
        echo "未提交的文件:"
        git status --porcelain | head -10
    else
        echo -e "${GREEN}✅ 工作目录干净${NC}"
    fi
    
    # 显示最近的提交
    echo "最近的提交:"
    git log --oneline -3 2>/dev/null || echo "无提交记录"
else
    echo -e "${YELLOW}⚠️ Git 仓库未初始化${NC}"
    echo "建议运行: git init"
fi

# 步骤7: 上传建议
echo -e "\n${BLUE}🎯 步骤7: 上传建议${NC}"
echo "------------------------"

echo -e "${GREEN}推荐上传平台:${NC}"
echo "1. GitHub - 最流行的代码托管平台"
echo "2. Gitee - 国内访问速度快"
echo "3. 课程平台 - 直接提交作业"

echo -e "\n${GREEN}上传前最后检查:${NC}"
echo "□ 确认敏感信息已移除"
echo "□ 确认文档完整性"
echo "□ 确认功能正常运行"
echo "□ 确认项目大小合理"

# 步骤8: 快速命令
echo -e "\n${BLUE}⚡ 步骤8: 快速上传命令${NC}"
echo "------------------------"

echo -e "${GREEN}Git 初始化和提交:${NC}"
echo "git init"
echo "git add ."
echo "git commit -m \"Initial commit: 体育赛事管理系统 v1.3.2\""
echo "git branch -M main"

echo -e "\n${GREEN}添加远程仓库 (GitHub):${NC}"
echo "git remote add origin https://github.com/yourusername/sports-management-system.git"
echo "git push -u origin main"

echo -e "\n${GREEN}创建压缩包 (课程提交):${NC}"
echo "zip -r 体育赛事管理系统_姓名_学号.zip . -x \"node_modules/*\" \"*/node_modules/*\" \"*.log\" \".git/*\""

# 完成
echo -e "\n${GREEN}🎉 准备完成!${NC}"
echo "=================================="
echo -e "项目已准备就绪，可以进行上传。"
echo -e "详细说明请查看: ${BLUE}UPLOAD_GUIDE.md${NC}"
echo ""

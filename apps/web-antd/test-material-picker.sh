#!/bin/bash

# MaterialPicker 集成测试运行脚本
#
# 用法:
#   ./test-material-picker.sh          # 运行所有测试
#   ./test-material-picker.sh headed   # 运行测试并显示浏览器
#   ./test-material-picker.sh debug    # 调试模式（慢速 + 浏览器）

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MaterialPicker 集成测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查依赖
echo -e "${YELLOW}⏳ 检查依赖...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ 错误: pnpm 未安装${NC}"
    exit 1
fi

# 确保在正确的目录
cd "$(dirname "$0")"
echo -e "${GREEN}✅ 当前目录: $(pwd)${NC}"
echo ""

# 解析参数
MODE="normal"
if [ "$1" == "headed" ]; then
    MODE="headed"
    echo -e "${YELLOW}📺 模式: 有头模式（显示浏览器）${NC}"
elif [ "$1" == "debug" ]; then
    MODE="debug"
    echo -e "${YELLOW}🐛 模式: 调试模式（慢速 + 浏览器）${NC}"
else
    echo -e "${YELLOW}🤖 模式: 无头模式（后台运行）${NC}"
fi
echo ""

# 检查是否需要启动开发服务器
echo -e "${YELLOW}⏳ 检查开发服务器...${NC}"
if curl -s http://localhost:5666 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 开发服务器已运行${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠️  开发服务器未运行，将自动启动${NC}"
    echo -e "${BLUE}提示: 你也可以手动启动服务器: pnpm dev --port 5666${NC}"
    SERVER_RUNNING=false
fi
echo ""

# 安装 Playwright 浏览器（如果需要）
echo -e "${YELLOW}⏳ 确保 Playwright 浏览器已安装...${NC}"
pnpm exec playwright install chromium --with-deps > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Playwright 浏览器就绪${NC}"
echo ""

# 运行测试
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  开始测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 构建测试命令
TEST_CMD="pnpm exec playwright test __tests__/e2e/material-picker-integration.spec.ts"

if [ "$MODE" == "headed" ]; then
    TEST_CMD="$TEST_CMD --headed"
elif [ "$MODE" == "debug" ]; then
    TEST_CMD="$TEST_CMD --headed --debug"
fi

# 运行测试
if $SERVER_RUNNING; then
    # 服务器已运行，直接测试
    eval $TEST_CMD
    TEST_RESULT=$?
else
    # 需要启动服务器
    eval $TEST_CMD
    TEST_RESULT=$?
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  测试完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 显示结果
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    echo ""
    echo -e "${BLUE}📊 查看详细报告:${NC}"
    echo -e "${BLUE}   pnpm exec playwright show-report node_modules/.e2e/test-results${NC}"
    exit 0
else
    echo -e "${RED}❌ 测试失败${NC}"
    echo ""
    echo -e "${YELLOW}💡 调试建议:${NC}"
    echo -e "   1. 使用有头模式查看问题: ./test-material-picker.sh headed"
    echo -e "   2. 使用调试模式逐步检查: ./test-material-picker.sh debug"
    echo -e "   3. 查看测试报告: pnpm exec playwright show-report node_modules/.e2e/test-results"
    echo -e "   4. 检查截图: node_modules/.e2e/test-results/"
    exit 1
fi

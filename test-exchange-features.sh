#!/bin/bash

# 交易控制台新功能测试脚本

echo "🚀 开始测试交易控制台新功能..."

# 检查前端服务器是否运行
echo "📡 检查前端服务器状态..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ 前端服务器运行正常 (http://localhost:3001)"
else
    echo "❌ 前端服务器未运行，请先启动: npm run dev"
    exit 1
fi

echo ""
echo "🎯 测试功能列表:"
echo "1. 交易所选择器"
echo "   - 位置: 顶部导航栏，QuantConsole 标题右侧"
echo "   - 功能: 切换 CoinGecko、Binance、OKX、模拟数据"
echo "   - 验证: 点击下拉菜单，选择不同交易所"
echo ""

echo "2. 连接状态指示器"
echo "   - 位置: 顶部导航栏，交易所选择器右侧"
echo "   - 功能: 显示连接状态和详细信息"
echo "   - 验证: 鼠标悬停查看详细连接信息"
echo ""

echo "3. 增强的刷新功能"
echo "   - 位置: 顶部导航栏右侧按钮"
echo "   - 功能: 智能重连当前交易所"
echo "   - 验证: 点击刷新按钮观察连接状态变化"
echo ""

echo "📝 测试步骤:"
echo "1. 访问 http://localhost:3001/auth/login"
echo "2. 登录后访问 http://localhost:3001/trading"
echo "3. 测试交易所选择器功能"
echo "4. 测试连接状态指示器"
echo "5. 观察数据源切换时的图表更新"
echo ""

echo "🔍 关键验证点:"
echo "- 交易所切换时图表数据是否更新"
echo "- 连接状态是否实时显示"
echo "- 悬停提示是否显示详细信息"
echo "- 错误状态是否正确处理"
echo ""

echo "📊 预期行为:"
echo "- CoinGecko: 延迟~150ms, 数据质量良好"
echo "- Binance: 延迟~50ms, 数据质量优秀"
echo "- 模拟数据: 延迟~5ms, 数据质量优秀"
echo ""

echo "✨ 测试完成后，请验证以下内容:"
echo "✓ 所有交易所都能正常切换"
echo "✓ 连接状态显示准确"
echo "✓ 悬停提示信息完整"
echo "✓ 图表数据正确更新"
echo "✓ 没有控制台错误"

echo ""
echo "🎉 祝测试顺利！"

# QuantConsole 前端故障排除指南

## 常见问题及解决方案

### 1. 白屏问题

#### 症状
- 页面显示为白屏
- 浏览器控制台显示 JavaScript 错误
- 应用程序无法正常加载

#### 常见原因及解决方案

##### A. 导入错误
**错误示例:**
```
Uncaught SyntaxError: The requested module does not provide an export named 'TradingChart2'
```

**原因:** 尝试导入不存在的组件或图标

**解决方案:**
1. 检查导入的组件/图标是否存在
2. 查看库的官方文档确认正确的导入名称
3. 对于 lucide-react 图标，访问 https://lucide.dev 查看可用图标

**修复示例:**
```tsx
// 错误的导入
import { TradingChart2 } from 'lucide-react'

// 正确的导入
import { TrendingUp } from 'lucide-react'
```

##### B. 语法错误
**症状:** 控制台显示语法错误

**解决方案:**
1. 检查 TypeScript/JavaScript 语法
2. 确保所有括号、引号正确闭合
3. 检查组件的 JSX 结构是否正确

##### C. 依赖缺失
**症状:** 模块未找到错误

**解决方案:**
1. 运行 `npm install` 安装缺失的依赖
2. 检查 package.json 中的依赖版本
3. 清除 node_modules 并重新安装：
   ```bash
   rm -rf node_modules
   npm install
   ```

### 2. 开发服务器问题

#### 端口占用
**症状:** 端口 3000 被占用

**解决方案:**
- Vite 会自动使用下一个可用端口（通常是 3001）
- 或手动指定端口：`npm run dev -- --port 3002`

#### 热重载不工作
**解决方案:**
1. 重启开发服务器
2. 清除浏览器缓存
3. 检查文件保存是否成功

### 3. 组件错误

#### 未定义的组件
**症状:** 'ComponentName' is not defined

**解决方案:**
1. 检查组件是否正确导入
2. 确认组件文件路径正确
3. 检查组件是否正确导出

#### Hook 使用错误
**症状:** Hook 相关错误

**解决方案:**
1. 确保 Hook 只在函数组件顶层调用
2. 不要在循环、条件或嵌套函数中调用 Hook
3. 检查 Hook 的依赖数组

### 4. 类型错误

#### TypeScript 错误
**解决方案:**
1. 检查类型定义是否正确
2. 确保导入的类型存在
3. 更新 @types 包版本

### 5. 样式问题

#### Tailwind CSS 不生效
**解决方案:**
1. 确认 Tailwind 配置正确
2. 检查 postcss.config.js 配置
3. 重启开发服务器

## 调试步骤

### 1. 检查浏览器控制台
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页的错误信息
3. 记录完整的错误消息

### 2. 检查网络请求
1. 查看 Network 标签页
2. 确认所有资源都正确加载
3. 检查是否有 404 或 500 错误

### 3. 检查源代码
1. 使用 Sources 标签页查看实际加载的代码
2. 设置断点调试 JavaScript
3. 检查变量值和执行流程

### 4. 逐步排查
1. 注释掉可疑的代码
2. 逐个恢复功能
3. 确定具体出错的位置

## 预防措施

### 1. 代码规范
- 使用 ESLint 和 Prettier 保持代码质量
- 定期运行类型检查 `npm run build`
- 提交前进行本地测试

### 2. 依赖管理
- 定期更新依赖包
- 锁定重要依赖的版本
- 使用 package-lock.json

### 3. 错误处理
- 实现错误边界组件
- 添加适当的错误提示
- 记录错误日志

## 快速修复命令

```bash
# 清除并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 清除 Vite 缓存
rm -rf node_modules/.vite
npm run dev

# 检查类型错误
npm run build

# 格式化代码
npm run lint
```

## 获取帮助

### 日志信息收集
当报告问题时，请提供：
1. 完整的错误消息
2. 浏览器控制台截图
3. 相关的代码片段
4. 操作步骤重现

### 常用资源
- [React 官方文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Vite 文档](https://vitejs.dev/guide/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)

---

**更新时间:** 2025年7月24日

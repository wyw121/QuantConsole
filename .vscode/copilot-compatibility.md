# GitHub Copilot 兼容性优化配置

## 问题描述
在使用 GitHub Copilot 代理模式时，VS Code Tasks 系统存在以下兼容性问题：

### 1. 后台任务输出缓冲问题
- `isBackground: true` 的任务输出不会立即可用
- `get_task_output` 工具无法及时获取长期运行任务的输出
- 导致 Copilot 在检查任务状态时出现延迟或失败

### 2. 任务状态同步延迟
- `run_vs_code_task` 和 `get_task_output` 之间存在竞态条件
- 任务启动和输出获取的时间差导致状态不一致
- 影响 Copilot 对任务执行结果的判断

### 3. 终端状态管理冲突
- GitHub Copilot 代理模式的终端状态跟踪与长期运行的后台任务冲突
- 多个终端实例同时活跃时，状态管理变得复杂
- 可能导致 Copilot 响应中断或性能下降

## 解决方案

### 已实施的优化
1. **移除 isBackground 标志**：所有开发服务器任务不再标记为后台任务
2. **使用专用面板**：每个任务分配独立的终端面板
3. **禁用自动任务**：完全移除 `runOn: "folderOpen"` 配置
4. **手动启动模式**：所有服务需要手动启动以避免资源竞争

### VS Code 设置优化
建议在用户设置中添加以下配置：

```json
{
    // 禁用任务自动检测以减少冲突
    "typescript.tsc.autoDetect": "off",
    "grunt.autoDetect": "off",
    "jake.autoDetect": "off",
    "gulp.autoDetect": "off",
    "npm.autoDetect": "off",

    // 优化终端性能
    "terminal.integrated.enablePersistentSessions": false,
    "terminal.integrated.experimentalLinkProvider": false,

    // 减少 Copilot 冲突
    "task.autoDetect": "off",
    "task.problemMatchers.neverPrompt": true
}
```

### 推荐的开发流程
1. 手动启动前端：`Ctrl+Shift+P` → `Tasks: Run Task` → `Frontend: Dev Server`
2. 手动启动后端：`Ctrl+Shift+P` → `Tasks: Run Task` → `Backend: Dev Server`
3. 避免同时运行多个资源密集型任务
4. 使用专用终端而不是共享终端

## 参考文献
- VS Code Tasks 官方文档：https://code.visualstudio.com/docs/editor/tasks
- GitHub Issue #253265：GitHub Copilot 性能优化
- VS Code Tasks 输出行为配置：https://code.visualstudio.com/docs/editor/tasks#_output-behavior

## 故障排除
如果仍遇到问题：
1. 重启 VS Code 扩展宿主：`Ctrl+Shift+P` → `Developer: Restart Extension Host`
2. 清理任务缓存：关闭所有终端并重启 VS Code
3. 检查 VS Code 进程资源使用情况
4. 考虑临时禁用其他扩展进行排查

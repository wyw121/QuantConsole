# QuantConsole - 加密货币短线交易控制台网站

## ⚠️ 重要：VS Code Tasks 完全禁用声明

**🚫 GitHub Copilot 严禁使用 VS Code Tasks 系统**

根据用户明确要求，本项目已**永久禁用**所有 VS Code Tasks 功能：

### 禁用规则（最高优先级）

1. **严禁使用 `run_vs_code_task` 工具**：GitHub Copilot 不得使用任何 VS Code Tasks 相关功能
2. **严禁使用 `create_and_run_task` 工具**：不得创建或运行任何 VS Code 任务
3. **严禁引用 `.vscode/tasks.json`**：该文件已被禁用，不得读取或使用其中的配置
4. **强制使用 `run_in_terminal` 工具**：所有开发任务必须通过终端手动执行
5. **🚫 严禁使用 `cargo clean` 命令**：GitHub Copilot 不得执行 `cargo clean` 清理命令，以避免不必要的重新编译和构建时间延长

### 替代方案

所有开发操作必须使用以下方式：

- ✅ **前端开发服务器**：`run_in_terminal` → `cd frontend && npm run dev`
- ✅ **后端开发服务器**：`run_in_terminal` → `cd backend && cargo run`
- ✅ **数据库迁移**：`run_in_terminal` → `cd backend/migration && cargo run`
- ✅ **前端构建**：`run_in_terminal` → `cd frontend && npm run build`
- ✅ **后端构建**：`run_in_terminal` → `cd backend && cargo build --release`

### 违规检测

如果 GitHub Copilot 尝试使用任何 VS Code Tasks 功能或执行 `cargo clean` 命令，将被视为违反用户指令。

---

## 项目概述

这是一个用于加密货币短线交易的控制台网站，主要功能包括：

- 用户登录注册系统
- 交易控制台概览
- 交易记录管理
- 交易所配置管理

## 技术栈规范

### 前端技术栈

- **框架**: React 18+ with TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS
- **状态管理**: React Query + Zustand
- **路由**: React Router v6
- **图表库**: Chart.js 或 Recharts
- **UI 组件**: 使用 Headless UI 或 Radix UI 作为基础组件
- **表单**: React Hook Form with Zod 验证

### 后端技术栈

- **语言**: Rust
- **框架**: Actix-web 或 Axum
- **数据库**: MySQL 8.0+
- **ORM**: SeaORM 或 Diesel
- **认证**: JWT tokens
- **API 文档**: 使用 OpenAPI/Swagger

### 开发规范

#### 前端代码规范

- 使用 TypeScript 严格模式，所有组件必须有完整的类型定义
- React 组件使用函数式组件 + Hooks
- 使用 ESLint + Prettier 进行代码格式化
- 组件命名使用 PascalCase，文件名使用 kebab-case
- 自定义 Hook 以 `use` 开头
- 使用 CSS Modules 或 styled-components 避免样式冲突

#### Rust 代码规范

- 使用 `cargo fmt` 和 `cargo clippy` 保持代码质量
- 结构体和枚举使用 PascalCase
- 函数和变量使用 snake_case
- 错误处理使用 `Result<T, E>` 类型
- 使用 `serde` 进行序列化/反序列化
- API 端点使用 RESTful 设计模式

#### 数据库设计

- 表名使用 snake_case
- 主键使用 `id` 字段，类型为 BIGINT AUTO_INCREMENT
- 时间字段使用 `created_at` 和 `updated_at`
- 外键字段以 `_id` 结尾
- 索引命名规范：`idx_table_column`

### 项目结构

#### 前端目录结构

```
frontend/
├── src/
│   ├── components/          # 可复用组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义 Hooks
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型定义
│   ├── services/           # API 服务
│   └── styles/             # 全局样式
└── public/                 # 静态资源
```

#### 后端目录结构

```
backend/
├── src/
│   ├── handlers/           # HTTP 处理器
│   ├── models/             # 数据模型
│   ├── services/           # 业务逻辑
│   ├── utils/              # 工具函数
│   └── config/             # 配置文件
└── migrations/             # 数据库迁移
```

### 特定功能要求

#### 用户认证

- 实现 JWT token 认证机制
- 支持注册、登录、登出功能
- 密码加密使用 bcrypt
- 实现刷新 token 机制

#### 交易控制台

- 实时显示加密货币价格数据
- 支持多种交易对显示
- 包含交易图表和技术指标
- 响应式设计，支持移动端

#### 交易记录

- 支持交易记录的增删改查
- 实现分页和搜索功能
- 支持按时间、交易对、类型筛选
- 导出功能（CSV/Excel）

#### 交易所配置

- 支持多个交易所的 API 配置
- API 密钥加密存储
- 连接状态检测
- 支持测试网和主网切换

### 安全要求

- 所有 API 密钥必须加密存储
- 实现 CORS 安全策略
- 输入验证和 SQL 注入防护
- 实现请求限流
- 敏感操作需要二次验证

### VS Code 任务配置要求

**⚠️ 重要：VS Code Tasks 系统已被完全禁用**

- **严禁使用 VS Code Tasks**：根据用户明确要求，所有 VS Code Tasks 功能已被永久禁用
- **强制使用 run_in_terminal**：所有开发任务必须通过 `run_in_terminal` 工具手动执行
- **禁用 tasks.json**：`.vscode/tasks.json` 文件已被禁用，不得使用其中的配置
- **违规检测**：GitHub Copilot 使用任何 VS Code Tasks 功能将被视为违规行为
- **手动执行原则**：所有开发服务器、构建、测试等操作必须手动启动

### 性能要求

- 前端打包体积优化，lazy loading
- 数据库查询优化，合理使用索引
- 实现缓存策略（Redis）
- WebSocket 连接用于实时数据更新

### UI/UX 设计

- 使用深色主题，适合交易环境
- 响应式设计，支持桌面和移动端
- 清晰的数据可视化
- 直观的用户操作流程
- 支持键盘快捷键操作

## 代码生成指导

当生成代码时，请遵循以下原则：

1. 确保类型安全，避免使用 `any` 类型
2. 包含完整的错误处理
3. 添加必要的注释和文档
4. 遵循项目的命名约定
5. 考虑性能和安全性
6. 使用现代 ES6+ 语法特性
7. Rust 代码要处理所有可能的错误情况
8. 数据库操作使用事务保证数据一致性

### ⚠️ VS Code Tasks 系统已被永久禁用

**重要说明**：根据用户明确要求，本项目已完全禁用 VS Code Tasks 系统。

#### 禁用原因

1. **用户明确要求**：项目所有者要求永久禁用 VS Code Tasks 功能
2. **GitHub Copilot 兼容性**：避免资源竞争和性能问题
3. **强制手动控制**：确保所有开发任务都通过手动方式执行

#### 禁用实施

- **`.vscode/tasks.json` 已被禁用**：文件仍存在但所有任务配置已被移除
- **VS Code Tasks 工具禁用**：GitHub Copilot 不得使用 `run_vs_code_task` 或 `create_and_run_task`
- **强制使用终端**：所有开发操作必须通过 `run_in_terminal` 工具执行

#### 开发命令参考

替代原有 VS Code Tasks 的手动命令：

```bash
# 前端开发服务器
cd frontend
npm run dev

# 后端开发服务器
cd backend
cargo run

# 数据库迁移
cd backend/migration
cargo run

# 前端构建
cd frontend
npm run build

# 后端构建
cd backend
cargo build --release

# Docker 服务
docker-compose up -d
```

#### 合规性要求

- GitHub Copilot 必须遵守此禁用规则
- 任何尝试使用 VS Code Tasks 的行为都将被视为违规
- 所有开发任务必须通过 `run_in_terminal` 工具手动执行

## 测试要求

- 前端使用 Vitest + Testing Library
- 后端使用 Rust 内置测试框架
- 集成测试覆盖主要 API 端点
- 单元测试覆盖核心业务逻辑
- E2E 测试覆盖关键用户流程

# QuantConsole - 加密货币短线交易控制台网站

## 📝 开发工具使用说明

根据项目需求，GitHub Copilot 可以使用以下工具来协助开发：

### 推荐的开发操作方式

- **VS Code Tasks**：可以使用 `run_task` 工具执行预定义的开发任务
- **终端命令**：使用 `run_in_terminal` 工具执行自定义命令
- **灵活选择**：根据具体情况选择最合适的执行方式

### 常用开发命令

- **前端开发服务器**：使用 Frontend: Dev Server 任务或 `cd frontend && npm run dev`
- **后端开发服务器**：使用 Backend: Dev Server 任务或 `cd backend && cargo run`
- **数据库迁移**：使用 Database: Run Migration 任务或 `cd backend/migration && cargo run`
- **前端构建**：使用 Frontend: Build 任务或 `cd frontend && npm run build`
- **后端构建**：使用 Backend: Build 任务或 `cd backend && cargo build --release`

### 开发建议

- 🚫 **避免使用 `cargo clean` 命令**：以避免不必要的重新编译和构建时间延长
- ⚡ **优先使用 VS Code Tasks**：为常见操作提供了预配置的任务，提高开发效率
- 🛠️ **终端命令作为补充**：用于执行特殊或一次性的操作

---

## 项目概述

这是一个用于加密货币短线交易的控制台网站，主要功能包括：

- 用户登录注册系统
- 交易控制台概览
- 交易记录管理
- 交易所配置管理

## 🚀 新增功能规划

### 价格监控与提醒系统
- **关注代币价格看板**：实时显示用户关注的所有代币价格，支持多交易所数据源切换
- **智能价格提醒**：支持价格跌破/突破、技术指标触发（如200日均线）等多种提醒方式
- **提醒渠道**：邮件、站内通知、移动推送等多种提醒方式

### 高级交易策略系统
- **多指标组合策略**：支持用户自定义多个技术指标的组合条件
- **策略条件编辑器**：可视化配置"指标A超过阈值 AND 指标B低于阈值 AND 指标C处于区间"等复合条件
- **策略回测**：历史数据验证策略有效性

### 智能交易机器人
- **Copy Trading 功能**：自动复制指定钱包的交易操作
- **钱包追踪系统**：监控标记钱包的交易动作和资金流向
- **自动执行**：根据策略信号自动执行买入/卖出操作

### 数据源与交易所集成
- **多交易所数据支持**：类似TradingView的多数据源选择
- **实时数据流**：WebSocket连接确保数据实时性
- **交易所API管理**：统一管理多个交易所的API配置

### 未来功能规划
- **KOL看板**：展示关键意见领袖的交易动向和观点
- **社交交易**：跟随优秀交易者的策略
- **高级分析工具**：更深入的市场分析和预测工具

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
#### 交易所配置

- 支持多个交易所的 API 配置
- API 密钥加密存储
- 连接状态检测
- 支持测试网和主网切换

#### 价格监控与提醒系统

- **关注代币看板功能**：
  - 实时价格显示组件，支持自定义代币列表
  - 多交易所数据源切换（Binance, OKX, Huobi等）
  - 价格变动可视化（涨跌幅、成交量等）
  - 支持拖拽排序和分组管理

- **智能提醒系统**：
  - 价格突破/跌破提醒（支持百分比和固定价格）
  - 技术指标提醒（均线交叉、RSI超买超卖、MACD信号等）
  - 成交量异常提醒
  - 多渠道提醒：邮件、短信、站内通知、Webhook

#### 高级交易策略系统

- **策略编辑器**：
  - 可视化条件构建器（类似查询构建器）
  - 支持AND/OR逻辑组合
  - 预设常用策略模板
  - 策略参数调优界面

- **技术指标库**：
  - 基础指标：MA, EMA, RSI, MACD, Bollinger Bands
  - 高级指标：Ichimoku, Fibonacci, Volume Profile
  - 自定义指标支持
  - 指标参数个性化配置

#### 智能交易机器人

- **Copy Trading 功能**：
  - 钱包地址监控和验证
  - 交易信号解析和过滤
  - 自动跟单执行（支持比例调整）
  - 风险控制机制（止损、最大跟单金额等）

- **钱包追踪系统**：
  - 多链钱包地址支持（Ethereum, BSC, Polygon等）
  - 交易历史分析和可视化
  - 盈亏统计和胜率计算
  - 资金流向分析

- **自动执行引擎**：
  - 多交易所订单路由
  - 滑点保护和最优价格执行
  - 订单状态实时跟踪
  - 执行日志和审计记录
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

### VS Code 任务配置

项目提供了完整的 VS Code Tasks 配置，支持：

- **前端开发任务**：`Frontend: Dev Server`、`Frontend: Build`
- **后端开发任务**：`Backend: Dev Server`、`Backend: Build`
- **数据库任务**：`Database: Run Migration`
- **Docker 服务**：`🐳 Docker: Start All Services`

可以通过 `Ctrl+Shift+P` → `Tasks: Run Task` 来执行，或者使用 `run_task` 工具。

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

## 测试要求

- 前端使用 Vitest + Testing Library
- 后端使用 Rust 内置测试框架
- 集成测试覆盖主要 API 端点
- 单元测试覆盖核心业务逻辑
- E2E 测试覆盖关键用户流程

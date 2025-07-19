# QuantConsole - 加密货币短线交易控制台

<div align="center">

![QuantConsole Logo](https://via.placeholder.com/200x80/1f2937/ffffff?text=QuantConsole)

**专业的加密货币短线交易控制台网站**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)

</div>

## 🚀 项目概述

QuantConsole 是一个现代化的加密货币短线交易控制台网站，为专业交易者提供实时市场数据、交易记录管理和多交易所集成功能。项目采用最新的技术栈，确保高性能、安全性和用户体验。

### ✨ 核心功能

- 🔐 **用户认证系统** - 安全的注册、登录和权限管理
- 📊 **交易控制台** - 实时市场数据和交易图表
- 📈 **交易记录管理** - 完整的交易历史和分析
- 🔧 **交易所配置** - 多交易所 API 集成和管理
- 📱 **响应式设计** - 支持桌面和移动端
- 🌙 **深色主题** - 专为交易环境优化

## 🛠️ 技术栈

### 前端
- **React 18+** - 现代 React 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **TailwindCSS** - 实用优先的 CSS 框架
- **React Query** - 数据获取和状态管理
- **React Router v6** - 客户端路由
- **Chart.js** - 数据可视化图表

### 后端
- **Rust** - 高性能系统编程语言
- **Actix-web** - 快速的 web 框架
- **SeaORM** - 现代 Rust ORM
- **MySQL 8.0+** - 关系型数据库
- **JWT** - 安全的身份验证
- **Redis** - 缓存和会话存储

### 开发工具
- **Docker** - 容器化部署
- **Docker Compose** - 多容器应用编排

### 安全特性
- **密码加密** - BCrypt 哈希算法
- **JWT 认证** - 安全的令牌系统
- **双因素认证** - TOTP 时间基础一次性密码
- **会话管理** - 安全的用户会话跟踪
- **安全事件日志** - 完整的安全审计跟踪

## 🏗️ 项目结构

```
QuantConsole/
├── frontend/                 # React + TypeScript 前端
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── services/       # API 服务
│   │   ├── store/          # 状态管理
│   │   ├── types/          # TypeScript 类型定义
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Rust + Actix-web 后端
│   ├── src/
│   │   ├── handlers/       # API 处理器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── migration/          # 数据库迁移
│   └── Cargo.toml
├── database/                 # 数据库相关文件
│   └── init.sql            # 数据库初始化脚本
├── docker-compose.yml        # Docker 编排配置
└── README.md
```

## 🚀 快速开始

### 前置要求

- Node.js 18+ 和 npm/yarn
- Rust 1.70+ 和 Cargo
- MySQL 8.0+ 或 Docker
- Git

### 开发环境部署

#### 方法一：一键启动脚本

**Windows:**
```cmd
# 双击运行或在命令行执行
start-dev.bat
```

**Linux/macOS:**
```bash
# 添加执行权限
chmod +x start-dev.sh
# 运行启动脚本
./start-dev.sh
```

#### 方法二：手动启动步骤

### 1. 克隆项目

```bash
git clone https://github.com/wyw121/QuantConsole.git
cd QuantConsole
```

### 2. 启动数据库服务

使用 Docker Compose 启动 MySQL 和 Redis：

```bash
docker-compose up -d mysql redis
```

等待数据库启动完成后，访问 http://localhost:8081 使用 phpMyAdmin 管理数据库。

### 3. 配置环境变量

#### 后端配置

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，更新数据库连接信息：

```env
DATABASE_URL=mysql://root:quantconsole123@localhost:3306/quantconsole
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### 前端配置

```bash
cd ../frontend
cp .env.development.example .env.development
```

### 4. 安装依赖并启动后端

```bash
cd backend

# 安装依赖
cargo build

# 运行数据库迁移
cargo run --bin migrate

# 启动后端服务
cargo run
```

后端服务将在 http://localhost:8080 启动

### 5. 安装依赖并启动前端

```bash
cd ../frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:3000 启动

### 6. 访问应用

打开浏览器访问 http://localhost:3000，您将看到 QuantConsole 的登录页面。

## 📋 API 文档

### 认证端点

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |
| POST | `/api/auth/logout` | 用户登出 | ✅ |
| POST | `/api/auth/refresh` | 刷新令牌 | ❌ |
| POST | `/api/auth/2fa/setup` | 设置双因素认证 | ✅ |
| POST | `/api/auth/2fa/confirm` | 确认双因素认证 | ✅ |

### 用户端点

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/user/me` | 获取当前用户信息 | ✅ |
| PUT | `/api/user/profile` | 更新用户资料 | ✅ |

### 系统端点

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/health` | 健康检查 | ❌ |

## 🔒 安全特性

### 密码安全
- 使用 BCrypt 算法进行密码哈希
- 强密码策略：至少8位，包含大小写字母、数字和特殊字符
- 防止暴力破解攻击

### 身份认证
- JWT (JSON Web Tokens) 用于无状态认证
- 访问令牌短期有效（1小时）
- 刷新令牌长期有效（7天）
- 自动令牌刷新机制

### 双因素认证 (2FA)
- 基于时间的一次性密码 (TOTP)
- 兼容 Google Authenticator、Authy 等应用
- 备份码支持
- QR 码快速设置

### 会话管理
- 安全的会话跟踪
- 设备信息记录
- IP 地址和位置跟踪
- 异常登录检测

### 安全日志
- 完整的安全事件记录
- 登录/登出跟踪
- 失败认证记录
- 可疑活动监控

## 🚀 生产环境部署

### 准备工作

1. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.prod.example .env.prod

# 编辑配置文件，设置安全的密码和密钥
nano .env.prod
```

2. **准备 SSL 证书** (可选，用于 HTTPS)
```bash
# 创建 SSL 证书目录
mkdir -p nginx/ssl

# 将证书文件放入目录
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

### 部署方式

**方法一：一键部署脚本**

*Windows:*
```cmd
deploy.bat
```

*Linux/macOS:*
```bash
chmod +x deploy.sh
./deploy.sh
```

**方法二：手动部署**
```bash
# 构建并启动生产环境
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

### 访问生产环境

- 应用主页: https://yourdomain.com
- API 文档: https://yourdomain.com/api/docs
- 健康检查: https://yourdomain.com/health

## 📊 监控和维护

### 系统监控

**实时监控:**
```bash
# Windows
monitor.bat

# Linux/macOS
chmod +x monitor.sh
./monitor.sh
```

**查看日志:**
```bash
# 开发环境
docker-compose logs -f

# 生产环境
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose logs -f backend
```

**性能监控:**
```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
docker system df

# 清理无用镜像和容器
docker system prune -a
```

## 🧪 测试

### 前端测试

```bash
cd frontend
npm run test
```

### 后端测试

```bash
cd backend
cargo test
```

## 📦 部署

### Docker 部署

1. 构建镜像：

```bash
# 构建前端镜像
cd frontend
docker build -t quantconsole-frontend .

# 构建后端镜像
cd ../backend
docker build -t quantconsole-backend .
```

2. 使用 Docker Compose 部署：

```bash
docker-compose up -d
```

### 生产环境配置

1. 更新环境变量
2. 配置 HTTPS
3. 设置防火墙规则
4. 配置日志轮转
5. 设置监控和告警

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

该项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到任何问题或有疑问，请通过以下方式寻求帮助：

- 📧 邮箱：support@quantconsole.com
- 💬 Discord：[QuantConsole 社区](https://discord.gg/quantconsole)
- 📋 GitHub Issues：[提交问题](https://github.com/wyw121/QuantConsole/issues)

## 🏆 致谢

感谢所有为 QuantConsole 项目做出贡献的开发者和社区成员！

---

<div align="center">
  Made with ❤️ by the QuantConsole Team
</div>
- **ESLint & Prettier** - 代码质量和格式化
- **Vitest** - 前端测试框架
- **GitHub Actions** - CI/CD 流水线

## 📁 项目结构

```
QuantConsole/
├── frontend/                 # React 前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义 hooks
│   │   ├── services/       # API 服务层
│   │   ├── types/          # TypeScript 类型
│   │   └── utils/          # 工具函数
│   └── package.json
├── backend/                 # Rust 后端 API
│   ├── src/
│   │   ├── handlers/       # HTTP 处理器
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── config/         # 配置管理
│   ├── migrations/         # 数据库迁移
│   └── Cargo.toml
├── .github/                # GitHub 配置
│   ├── copilot-instructions.md
│   ├── .prompt.md
│   └── .instructions.md
└── README.md
```

## 🚀 快速开始

### 环境要求

- **Node.js** 18+
- **Rust** 1.70+
- **MySQL** 8.0+
- **Redis** 6.0+ (可选)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/wyw121/QuantConsole.git
   cd QuantConsole
   ```

2. **设置数据库**
   ```sql
   mysql -u root -p
   CREATE DATABASE quantconsole;
   CREATE USER 'quantuser'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON quantconsole.* TO 'quantuser'@'localhost';
   ```

3. **启动后端服务**
   ```bash
   cd backend
   cp .env.example .env
   # 编辑 .env 文件配置数据库连接
   cargo run
   ```

4. **启动前端应用**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **访问应用**
   - 前端: http://localhost:3000
   - 后端 API: http://localhost:8080

### Docker 快速启动

```bash
# 使用 Docker Compose 一键启动
docker-compose up -d

# 查看服务状态
docker-compose ps
```

## 📚 API 文档

### 认证相关
```http
POST /api/auth/register    # 用户注册
POST /api/auth/login       # 用户登录
POST /api/auth/logout      # 用户登出
GET  /api/auth/me         # 获取用户信息
```

### 交易记录
```http
GET    /api/trades         # 获取交易记录
POST   /api/trades         # 创建交易记录
PUT    /api/trades/:id     # 更新交易记录
DELETE /api/trades/:id     # 删除交易记录
```

### 交易所配置
```http
GET    /api/exchanges      # 获取交易所配置
POST   /api/exchanges      # 添加交易所配置
PUT    /api/exchanges/:id  # 更新交易所配置
DELETE /api/exchanges/:id  # 删除交易所配置
```

详细的 API 文档请访问: http://localhost:8080/docs

## 🧪 测试

### 前端测试
```bash
cd frontend
npm run test          # 运行单元测试
npm run test:coverage # 测试覆盖率
npm run test:e2e      # E2E 测试
```

### 后端测试
```bash
cd backend
cargo test            # 运行单元测试
cargo test --release  # 优化模式测试
```

## 🚀 部署

### 生产环境构建

```bash
# 前端构建
cd frontend
npm run build

# 后端构建
cd backend
cargo build --release
```

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 生产环境启动
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码规范

- 前端使用 ESLint + Prettier
- 后端使用 `cargo fmt` + `cargo clippy`
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- **项目维护者**: [@wyw121](https://github.com/wyw121)
- **问题反馈**: [Issues](https://github.com/wyw121/QuantConsole/issues)
- **功能建议**: [Discussions](https://github.com/wyw121/QuantConsole/discussions)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和使用者！

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

Made with ❤️ by [wyw121](https://github.com/wyw121)

</div>

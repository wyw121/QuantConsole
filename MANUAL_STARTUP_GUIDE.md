# QuantConsole 项目手动启动指南

本文档详细说明如何在不使用 Docker 的情况下手动启动 QuantConsole 项目的前端和后端服务。

## 🎯 GitHub Copilot 性能优化说明

为了确保 GitHub Copilot 的最佳性能，我们已禁用了自动运行的 VS Code 任务（`runOn: "folderOpen"`）。这避免了 Copilot 与后台任务之间的资源竞争，提供更流畅的编码体验。

**影响**：
- 开发服务器不会在打开工作区时自动启动
- 需要手动启动所需的开发任务
- 更好的 Copilot 响应性能和建议质量

## 📋 前置要求

在开始之前，请确保您的系统已安装以下软件：

### 必需软件
- **Node.js** (版本 18+ 推荐) - [下载地址](https://nodejs.org/)
- **Rust** (最新稳定版) - [下载地址](https://www.rust-lang.org/tools/install)
- **MySQL** (版本 8.0+) - [下载地址](https://dev.mysql.com/downloads/mysql/)
- **Redis** (可选，用于缓存) - [下载地址](https://redis.io/downloads/)

### 验证安装
在终端中运行以下命令验证安装：

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 Rust 版本
rustc --version

# 检查 Cargo 版本
cargo --version

# 检查 MySQL 是否运行
mysql --version
```

## ⚡ VS Code 任务快速启动

为了提高开发效率，项目配置了 VS Code 任务，可以快速启动各种开发服务。

### 使用 VS Code 任务

1. **打开命令面板**: `Ctrl+Shift+P`
2. **输入**: `Tasks: Run Task`
3. **选择任务**:
   - `🚀 Start Development (All)` - 启动所有开发服务器
   - `Frontend: Dev Server` - 仅启动前端开发服务器 (端口 5173)
   - `Backend: Dev Server` - 仅启动后端开发服务器 (端口 8080)
   - `Database: Run Migration` - 运行数据库迁移
   - `🐳 Docker: Start All Services` - 启动所有 Docker 服务

### 推荐启动顺序

1. 先启动数据库服务 (`🐳 Docker: Start All Services`)
2. 运行数据库迁移 (`Database: Run Migration`)
3. 启动后端服务 (`Backend: Dev Server`)
4. 启动前端服务 (`Frontend: Dev Server`)

### 任务优势

- ✅ 自动设置正确的工作目录
- ✅ 统一的终端管理
- ✅ 快捷键支持
- ✅ 错误检测和问题匹配

> **注意**: 为了优化 GitHub Copilot 性能，VS Code 任务不会自动启动。请根据需要手动运行相应任务。

## 🗄️ 数据库配置

### 1. 启动 MySQL 服务

#### Windows (PowerShell)
```powershell
# 启动 MySQL 服务
net start mysql80

# 或者使用服务管理器启动 MySQL 服务
```

#### Linux/macOS
```bash
# Ubuntu/Debian
sudo systemctl start mysql

# macOS (使用 Homebrew)
brew services start mysql

# 或者直接运行
mysqld_safe --user=mysql &
```

### 2. 创建数据库和用户

```bash
# 连接到 MySQL
mysql -u root -p

# 在 MySQL 命令行中执行以下 SQL
```

```sql
-- 创建数据库
CREATE DATABASE quantconsole CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'quantuser'@'localhost' IDENTIFIED BY 'quantpass123';

-- 授权
GRANT ALL PRIVILEGES ON quantconsole.* TO 'quantuser'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

### 3. 执行初始化脚本（可选）

如果有初始化脚本，可以执行：

```bash
mysql -u quantuser -p quantconsole < database/init.sql
```

## 🚀 后端启动步骤

### 1. 进入后端目录

```bash
cd backend
```

### 2. 配置环境变量

创建 `.env` 文件（如果不存在）：

```bash
# Windows (PowerShell)
New-Item -Name ".env" -ItemType File

# Linux/macOS
touch .env
```

在 `.env` 文件中添加以下配置：

```env
# 数据库配置
DATABASE_URL=mysql://quantuser:quantpass123@localhost:3306/quantconsole

# JWT 密钥（请更改为您自己的密钥）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 服务器配置
SERVER_HOST=127.0.0.1
SERVER_PORT=8080

# Redis 配置（可选）
REDIS_URL=redis://127.0.0.1:6379

# 日志级别
RUST_LOG=info
```

### 3. 安装依赖

```bash
# 更新 Cargo 索引
cargo update

# 构建项目（会自动下载依赖）
cargo build
```

### 4. 运行数据库迁移

```bash
# 进入迁移目录
cd migration

# 运行迁移
cargo run

# 返回后端根目录
cd ..
```

### 5. 启动后端服务

```bash
# 开发模式启动（带热重载）
cargo run

# 或者使用 watch 模式（需要安装 cargo-watch）
# cargo install cargo-watch
# cargo watch -x run
```

后端服务将在 `http://127.0.0.1:8080` 启动。

### 6. 验证后端启动

在新的终端窗口中测试：

```bash
# 测试健康检查端点
curl http://127.0.0.1:8080/health

# 或者使用 PowerShell
Invoke-WebRequest -Uri "http://127.0.0.1:8080/health"
```

## 🌐 前端启动步骤

### 1. 打开新的终端窗口

保持后端服务运行，打开新的终端窗口。

### 2. 进入前端目录

```bash
cd frontend
```

### 3. 安装依赖

```bash
# 安装 npm 依赖
npm install

# 或者使用 yarn（如果您更喜欢）
# yarn install
```

### 4. 配置环境变量

创建 `.env` 文件：

```bash
# Windows (PowerShell)
New-Item -Name ".env" -ItemType File

# Linux/macOS
touch .env
```

在 `.env` 文件中添加：

```env
# API 基础地址
VITE_API_BASE_URL=http://127.0.0.1:8080/api

# 应用标题
VITE_APP_TITLE=QuantConsole

# 开发模式
VITE_NODE_ENV=development
```

### 5. 启动前端开发服务器

```bash
# 启动开发服务器
npm run dev

# 或者使用 yarn
# yarn dev
```

前端服务将在 `http://localhost:5173` 启动（Vite 默认端口）。

### 6. 验证前端启动

在浏览器中访问 `http://localhost:5173`，您应该能看到 QuantConsole 的登录页面。

## 🔧 可选服务启动

### Redis 缓存服务

如果您需要 Redis 缓存功能：

#### Windows
1. 下载 Redis for Windows
2. 解压并运行 `redis-server.exe`

#### Linux
```bash
# Ubuntu/Debian
sudo systemctl start redis-server

# 或者直接运行
redis-server
```

#### macOS
```bash
# 使用 Homebrew
brew services start redis

# 或者直接运行
redis-server
```

## 📊 启动验证清单

确保以下服务都正常运行：

- [ ] **MySQL 数据库** - 端口 3306
- [ ] **后端 API 服务** - http://127.0.0.1:8080
- [ ] **前端开发服务器** - http://localhost:5173
- [ ] **Redis 服务**（可选）- 端口 6379

## 🐛 常见问题排查

### 后端启动问题

#### 1. 数据库连接失败
```
Error: Failed to connect to database
```

**解决方案：**
- 确认 MySQL 服务正在运行
- 检查 `.env` 文件中的数据库配置
- 验证数据库用户权限

#### 2. 端口被占用
```
Error: Address already in use (os error 48)
```

**解决方案：**
```bash
# 查找占用端口的进程
# Windows
netstat -ano | findstr :8080

# Linux/macOS
lsof -i :8080

# 终止进程或更改端口
```

#### 3. 依赖编译失败

**解决方案：**
```bash
# 清理构建缓存
cargo clean

# 重新构建
cargo build
```

### 前端启动问题

#### 1. 依赖安装失败

**解决方案：**
```bash
# 清理 node_modules 和缓存
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 2. 端口冲突

**解决方案：**
```bash
# 指定不同端口启动
npm run dev -- --port 3000
```

#### 3. API 请求失败

**解决方案：**
- 确认后端服务正在运行
- 检查 `.env` 文件中的 API 地址配置
- 查看浏览器开发者工具的网络选项卡

## 🔄 重启服务

### 重启后端
```bash
# 在后端目录中按 Ctrl+C 停止服务
# 然后重新运行
cargo run
```

### 重启前端
```bash
# 在前端目录中按 Ctrl+C 停止服务
# 然后重新运行
npm run dev
```

## 📝 开发工作流

1. **启动数据库服务** - MySQL 和 Redis（可选）
2. **启动后端服务** - 在 `backend` 目录运行 `cargo run`
3. **启动前端服务** - 在 `frontend` 目录运行 `npm run dev`
4. **开始开发** - 修改代码，前端支持热重载
5. **测试功能** - 在浏览器中测试应用功能

## 🚀 生产环境构建

### 构建前端
```bash
cd frontend
npm run build
```

### 构建后端
```bash
cd backend
cargo build --release
```

构建完成后，可以使用生成的文件进行生产部署。

---

## 💡 小贴士

- 建议使用多个终端窗口分别运行前端和后端服务
- 开发过程中保持所有服务运行，以便实时查看更改
- 定期检查日志输出以发现潜在问题
- 使用 Git 管理代码版本，避免意外丢失更改

如果遇到其他问题，请查看项目的 README.md 文件或联系开发团队获取支持。

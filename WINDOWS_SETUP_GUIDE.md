# QuantConsole Windows 开发环境配置指南

## 🎯 概述

本指南专门针对 Windows 开发环境，已移除所有 Docker 依赖，使用原生 Windows 服务和工具。

## 📋 系统要求

### 必需软件

1. **Node.js 18+**
   - 下载: https://nodejs.org/
   - 或使用 Chocolatey: `choco install nodejs`
   - 或使用 Scoop: `scoop install nodejs`

2. **Rust 1.70+**
   - 下载: https://rustup.rs/
   - 项目已包含 `rustup-init.exe`

3. **MySQL 8.0+**
   - 下载: https://dev.mysql.com/downloads/mysql/
   - 或使用 Chocolatey: `choco install mysql`
   - 或使用 Scoop: `scoop install mysql`

4. **Git**
   - 下载: https://git-scm.com/
   - 或使用 Chocolatey: `choco install git`

### 可选工具

- **VS Code** - 推荐的代码编辑器
- **PowerShell 7+** - 更好的终端体验
- **Windows Terminal** - 现代终端应用

## 🚀 快速开始

### 1. 环境准备

```cmd
# 克隆项目
git clone https://github.com/wyw121/QuantConsole.git
cd QuantConsole
```

### 2. 安装 Rust（如果未安装）

```cmd
# 运行项目中包含的 Rust 安装程序
rustup-init.exe

# 或从官网下载安装
# 安装完成后，添加 MSVC 目标
rustup target add x86_64-pc-windows-msvc
```

### 3. 配置数据库

#### 安装 MySQL
```cmd
# 使用 Chocolatey（推荐）
choco install mysql

# 或使用 Scoop
scoop install mysql

# 启动 MySQL 服务
net start MySQL
```

#### 创建数据库
```sql
CREATE DATABASE quantconsole;
CREATE USER 'quantconsole'@'localhost' IDENTIFIED BY 'quantconsole123';
GRANT ALL PRIVILEGES ON quantconsole.* TO 'quantconsole'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 配置环境变量

#### 后端配置
```cmd
cd backend
copy .env.example .env
```

编辑 `.env` 文件：
```env
DATABASE_URL=mysql://quantconsole:quantconsole123@localhost:3306/quantconsole
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
RUST_LOG=debug
```

#### 前端配置
```cmd
cd ../frontend
copy .env.development.example .env.development
```

### 5. 一键启动

```cmd
# 双击运行或在命令行执行
start-dev.bat
```

这将自动：
- 检查 MySQL 服务状态
- 启动 Rust 后端服务（端口 8080）
- 启动 React 前端服务（端口 3000）

### 6. 手动启动（可选）

#### 启动后端
```cmd
cd backend
cargo run
```

#### 启动前端
```cmd
cd frontend
npm install
npm run dev
```

## 🔧 开发工具配置

### VS Code 配置

推荐安装的扩展：
- Rust Analyzer
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

### 项目任务

可用的 VS Code 任务：
- `Frontend: Dev Server` - 启动前端开发服务器
- `Backend: Dev Server` - 启动后端开发服务器
- `Frontend: Build` - 构建前端生产版本
- `Backend: Build` - 构建后端生产版本
- `Database: Run Migration` - 运行数据库迁移

## 📊 监控和管理

### 系统监控
```cmd
# 运行监控脚本
monitor.bat
```

监控内容包括：
- 服务状态检查
- 健康状态检查
- 资源使用情况
- 磁盘使用情况

### 服务管理

#### MySQL 服务
```cmd
# 启动 MySQL 服务
net start MySQL

# 停止 MySQL 服务
net stop MySQL

# 查看服务状态
sc query MySQL
```

#### 应用进程
```cmd
# 查看 QuantConsole 相关进程
tasklist /fi "imagename eq quantconsole*"

# 结束进程（如果需要）
taskkill /f /im "process_name.exe"
```

## 🏗️ 生产部署

### 构建应用

```cmd
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
cargo build --release
```

### 部署到 Windows 服务器

1. **配置 IIS 或 Nginx for Windows**
   - 静态文件: `frontend/dist`
   - API 代理: `http://localhost:8080`

2. **注册 Windows 服务（使用 NSSM）**
   ```cmd
   # 下载 NSSM (Non-Sucking Service Manager)
   # 安装后端服务
   nssm install QuantConsole "C:\path\to\quantconsole.exe"
   nssm start QuantConsole
   ```

## 🚨 故障排除

### 常见问题

1. **Rust 编译错误**
   ```cmd
   # 更新 Rust
   rustup update

   # 清理构建缓存
   cargo clean
   ```

2. **数据库连接问题**
   ```cmd
   # 检查 MySQL 服务状态
   sc query MySQL

   # 测试数据库连接
   mysql -u quantconsole -p quantconsole
   ```

3. **端口占用问题**
   ```cmd
   # 查看端口使用情况
   netstat -ano | findstr :3000
   netstat -ano | findstr :8080

   # 结束占用进程
   taskkill /f /pid <PID>
   ```

### 日志查看

- **应用日志**: 检查控制台输出或配置的日志文件
- **系统日志**: Windows 事件查看器
- **MySQL 日志**: MySQL 数据目录下的错误日志文件

## 📚 更多资源

- [Rust 官方文档](https://doc.rust-lang.org/)
- [React 官方文档](https://reactjs.org/docs/)
- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)

## 🤝 获取帮助

如果遇到问题，请：
1. 查看本指南的故障排除部分
2. 检查项目的 Issues 页面
3. 创建新的 Issue 并提供详细信息

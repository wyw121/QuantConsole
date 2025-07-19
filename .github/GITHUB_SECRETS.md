# GitHub Actions Secrets 配置指南

本文档描述了项目所需的 GitHub Secrets 配置。这些 secrets 用于 CI/CD 流水线中的敏感信息管理。

## 必需的 Secrets

### 1. 数据库配置 (可选 - 仅在使用真实数据库时)
```
MYSQL_ROOT_PASSWORD=your_secure_mysql_password
DATABASE_URL=mysql://username:password@host:port/database_name
```

### 2. JWT 配置 (生产环境)
```
JWT_SECRET=your_super_secure_jwt_secret_key_with_256_bits_minimum
```

### 3. Docker Hub 配置 (可选 - 仅在需要推送镜像时)
```
DOCKER_USERNAME=your_dockerhub_username
DOCKER_TOKEN=your_dockerhub_access_token
```

### 4. 部署配置 (可选 - 仅在自动部署时)
```
PRODUCTION_HOST=your_production_server_ip
PRODUCTION_USER=your_server_username
PRODUCTION_SSH_KEY=your_private_ssh_key
```

## 如何设置 GitHub Secrets

1. 访问您的 GitHub 仓库
2. 点击 `Settings` 选项卡
3. 在左侧菜单中选择 `Secrets and variables` > `Actions`
4. 点击 `New repository secret`
5. 输入 secret 名称和值
6. 点击 `Add secret`

## 安全最佳实践

### JWT Secret 生成
```bash
# 使用 OpenSSL 生成强密码
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### MySQL 密码
- 使用至少 16 个字符的复杂密码
- 包含大小写字母、数字和特殊字符
- 不要使用常见的密码

### SSH 密钥
```bash
# 生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 私钥内容放入 PRODUCTION_SSH_KEY
# 公钥内容添加到目标服务器的 ~/.ssh/authorized_keys
```

## 环境特定配置

### 开发环境
开发环境可以使用简单的配置，不需要设置 secrets：
```yaml
env:
  DATABASE_URL: mysql://root:password@localhost:3306/quantconsole_dev
  JWT_SECRET: dev-secret-key-not-for-production
```

### 测试环境 (CI)
测试环境使用内置的测试配置，已在 workflow 中设置：
```yaml
env:
  DATABASE_URL: mysql://root:ci_test_password@localhost:3306/quantconsole_test
  JWT_SECRET: test-secret-key-for-ci-environment
```

### 生产环境
生产环境必须使用 GitHub Secrets 中配置的值。

## 当前 CI/CD 状态

当前的 CI/CD 配置已经优化，具有以下特点：

### ✅ 已配置
- 前端和后端的基础构建测试
- 自动检测项目是否存在（前端/后端）
- 安全扫描（在 PR 时运行）
- MySQL 测试数据库服务
- 构建状态总结

### 🚧 可选配置
- Docker 镜像构建和推送
- 自动部署到生产环境
- 代码覆盖率报告
- 性能测试

### 🔒 安全措施
- 所有敏感信息使用 GitHub Secrets
- CI 环境使用独立的测试密码
- 继续错误处理，避免因缺少项目而失败

## 故障排除

### 常见问题

1. **"Context access might be invalid"** 错误
   - 确保在 GitHub 仓库设置中添加了相应的 secrets
   - 检查 secret 名称是否拼写正确

2. **数据库连接失败**
   - 确保 DATABASE_URL 格式正确
   - 检查 MySQL 服务是否正常启动

3. **构建失败**
   - 查看具体的错误日志
   - 确保项目结构正确（frontend/backend 目录）

### 调试步骤

1. 检查 GitHub Actions 日志
2. 验证 secrets 配置
3. 确认项目结构
4. 测试本地构建

## 升级路径

随着项目发展，您可以逐步添加更多功能：

1. **第一阶段**：基础 CI（当前状态）
2. **第二阶段**：添加代码覆盖率和质量检查
3. **第三阶段**：Docker 镜像构建
4. **第四阶段**：自动部署
5. **第五阶段**：监控和告警

---

如有任何问题，请查看 GitHub Actions 的运行日志或联系项目维护者。

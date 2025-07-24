use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand::Rng;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, Set,
};
use serde::{Deserialize, Serialize};
use totp_rs::{Algorithm, TOTP};
use uuid::Uuid;

use crate::models::{
    security_event::{self},
    user::{self, Entity as User},
    user_session::{self, Entity as UserSession},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // 用户 ID
    pub email: String,
    pub username: String,
    pub role: String,
    pub session_id: String,         // 会话 ID
    pub device_id: Option<String>,  // 设备 ID
    pub ip_address: Option<String>, // IP 地址
    pub exp: i64,                   // 过期时间
    pub iat: i64,                   // 签发时间
    pub iss: String,                // 签发者
    pub aud: String,                // 受众
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub remember_me: Option<bool>,
    pub two_factor_code: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub username: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub username: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar: Option<String>,
    pub is_email_verified: bool,
    pub is_two_factor_enabled: bool,
    pub role: String,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub last_login_at: Option<chrono::DateTime<chrono::FixedOffset>>,
}

#[derive(Debug, Serialize)]
pub struct TwoFactorSetupResponse {
    pub qr_code_url: String,
    pub secret_key: String,
    pub backup_codes: Vec<String>,
}

pub struct AuthService {
    db: DatabaseConnection,
    jwt_secret: String,
}

impl AuthService {
    pub fn new(db: DatabaseConnection, jwt_secret: String) -> Self {
        Self { db, jwt_secret }
    }

    /// 生成设备指纹
    pub fn generate_device_fingerprint(user_agent: &str, ip_address: &str) -> String {
        use sha2::{Digest, Sha256};

        let fingerprint_data = format!("{user_agent}:{ip_address}");
        let mut hasher = Sha256::new();
        hasher.update(fingerprint_data.as_bytes());
        let result = hasher.finalize();

        format!("{result:x}")[..32].to_string()
    }

    /// 验证会话安全性
    pub async fn verify_session_security(
        &self,
        user_id: String,
        session_id: &str,
        ip_address: &str,
        user_agent: &str,
    ) -> Result<bool> {
        // 查找会话
        let session = UserSession::find()
            .filter(user_session::Column::UserId.eq(&user_id))
            .filter(user_session::Column::Id.eq(session_id))
            .filter(user_session::Column::IsActive.eq(true))
            .one(&self.db)
            .await?;

        if let Some(session) = session {
            // 检查IP地址是否匹配
            if session.ip_address != ip_address {
                self.log_security_event(
                    user_id,
                    "suspicious_ip".to_string(),
                    format!(
                        "会话IP地址发生变化: {} -> {}",
                        session.ip_address, ip_address
                    ),
                    ip_address.to_string(),
                    user_agent.to_string(),
                    "high".to_string(),
                )
                .await?;

                return Ok(false);
            }

            // 检查用户代理是否匹配
            if session.user_agent != user_agent {
                self.log_security_event(
                    user_id,
                    "suspicious_user_agent".to_string(),
                    "会话用户代理发生变化".to_string(),
                    ip_address.to_string(),
                    user_agent.to_string(),
                    "medium".to_string(),
                )
                .await?;
            }

            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// 获取用户的活跃设备列表
    pub async fn get_active_devices(&self, user_id: String) -> Result<Vec<serde_json::Value>> {
        let sessions = UserSession::find()
            .filter(user_session::Column::UserId.eq(user_id))
            .filter(user_session::Column::IsActive.eq(true))
            .all(&self.db)
            .await?;

        let devices: Vec<serde_json::Value> = sessions
            .into_iter()
            .map(|session| {
                serde_json::json!({
                    "deviceId": session.id,
                    "deviceName": self.parse_device_name(&session.user_agent),
                    "browser": self.parse_browser(&session.user_agent),
                    "os": self.parse_os(&session.user_agent),
                    "ipAddress": session.ip_address,
                    "location": session.location,
                    "lastSeen": session.last_accessed_at,
                    "isCurrentDevice": false, // 需要额外逻辑判断
                    "isTrusted": false, // 可以添加信任设备逻辑
                })
            })
            .collect();

        Ok(devices)
    }

    /// 撤销设备访问权限
    pub async fn revoke_device_access(&self, user_id: String, device_id: &str) -> Result<()> {
        // 删除指定设备的会话
        UserSession::delete_many()
            .filter(user_session::Column::UserId.eq(&user_id))
            .filter(user_session::Column::Id.eq(device_id))
            .exec(&self.db)
            .await?;

        // 记录安全事件
        self.log_security_event(
            user_id,
            "device_revoked".to_string(),
            format!("设备访问权限已撤销: {device_id}"),
            "system".to_string(),
            "system".to_string(),
            "low".to_string(),
        )
        .await?;

        Ok(())
    }

    /// 登出所有设备
    pub async fn logout_all_devices(&self, user_id: String) -> Result<()> {
        UserSession::delete_many()
            .filter(user_session::Column::UserId.eq(&user_id))
            .exec(&self.db)
            .await?;

        self.log_security_event(
            user_id,
            "logout_all_devices".to_string(),
            "用户登出所有设备".to_string(),
            "system".to_string(),
            "system".to_string(),
            "low".to_string(),
        )
        .await?;

        Ok(())
    }

    /// 解析设备名称
    fn parse_device_name(&self, user_agent: &str) -> String {
        if user_agent.contains("Mobile") {
            "移动设备".to_string()
        } else if user_agent.contains("Tablet") {
            "平板设备".to_string()
        } else {
            "桌面设备".to_string()
        }
    }

    /// 解析浏览器
    fn parse_browser(&self, user_agent: &str) -> String {
        if user_agent.contains("Chrome") {
            "Chrome".to_string()
        } else if user_agent.contains("Firefox") {
            "Firefox".to_string()
        } else if user_agent.contains("Safari") {
            "Safari".to_string()
        } else if user_agent.contains("Edge") {
            "Edge".to_string()
        } else {
            "Unknown".to_string()
        }
    }

    /// 获取用户安全事件
    pub async fn get_security_events(
        &self,
        user_id: String,
        query: crate::handlers::device::SecurityEventQuery,
    ) -> Result<serde_json::Value> {
        use sea_orm::Condition;

        let page = query.page.unwrap_or(1);
        let limit = query.limit.unwrap_or(20);

        let mut condition = Condition::all().add(security_event::Column::UserId.eq(user_id));

        if let Some(event_type) = query.event_type {
            condition = condition.add(security_event::Column::EventType.eq(event_type));
        }

        if let Some(severity) = query.severity {
            condition = condition.add(security_event::Column::Severity.eq(severity));
        }

        let paginator = security_event::Entity::find()
            .filter(condition)
            .order_by_desc(security_event::Column::CreatedAt)
            .paginate(&self.db, limit);

        let total = paginator.num_items().await?;
        let events = paginator.fetch_page(page - 1).await?;

        let events_json: Vec<serde_json::Value> = events
            .into_iter()
            .map(|event| {
                serde_json::json!({
                    "id": event.id,
                    "eventType": event.event_type,
                    "description": event.description,
                    "ipAddress": event.ip_address,
                    "location": event.location,
                    "severity": event.severity,
                    "timestamp": event.created_at,
                    "userAgent": event.user_agent,
                })
            })
            .collect();

        Ok(serde_json::json!({
            "events": events_json,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total as f64 / limit as f64).ceil() as u64,
            }
        }))
    }

    /// 解析操作系统
    fn parse_os(&self, user_agent: &str) -> String {
        if user_agent.contains("Windows") {
            "Windows".to_string()
        } else if user_agent.contains("Mac") {
            "macOS".to_string()
        } else if user_agent.contains("Linux") {
            "Linux".to_string()
        } else if user_agent.contains("Android") {
            "Android".to_string()
        } else if user_agent.contains("iOS") {
            "iOS".to_string()
        } else {
            "Unknown".to_string()
        }
    }

    pub async fn register(
        &self,
        request: RegisterRequest,
        ip_address: String,
        user_agent: String,
    ) -> Result<AuthResponse> {
        log::info!("🔍 [AuthService] 开始注册流程");
        log::info!(
            "📝 [AuthService] 注册请求: email={}, username={}",
            request.email,
            request.username
        );

        // 检查邮箱是否已存在
        log::info!("🔍 [AuthService] 检查邮箱是否已存在: {}", request.email);
        if User::find()
            .filter(user::Column::Email.eq(&request.email))
            .one(&self.db)
            .await?
            .is_some()
        {
            log::warn!("❌ [AuthService] 邮箱已被注册: {}", request.email);
            return Err(anyhow::anyhow!("邮箱已被注册"));
        }
        log::info!("✅ [AuthService] 邮箱检查通过");

        // 检查用户名是否已存在
        log::info!(
            "🔍 [AuthService] 检查用户名是否已存在: {}",
            request.username
        );
        if User::find()
            .filter(user::Column::Username.eq(&request.username))
            .one(&self.db)
            .await?
            .is_some()
        {
            log::warn!("❌ [AuthService] 用户名已被使用: {}", request.username);
            return Err(anyhow::anyhow!("用户名已被使用"));
        }
        log::info!("✅ [AuthService] 用户名检查通过");

        // 创建用户
        log::info!("🔐 [AuthService] 开始哈希密码");
        let password_hash = self.hash_password(&request.password)?;
        let user_id = uuid::Uuid::new_v4().to_string();
        let now = Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());

        log::info!("👤 [AuthService] 创建用户模型 - ID: {}", user_id);

        let user = user::ActiveModel {
            id: Set(user_id.clone()),
            email: Set(request.email.clone()),
            username: Set(request.username.clone()),
            password_hash: Set(password_hash),
            first_name: Set(request.first_name.clone()),
            last_name: Set(request.last_name.clone()),
            role: Set("user".to_string()),
            is_active: Set(true),
            is_email_verified: Set(false),
            is_two_factor_enabled: Set(false),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };

        // 插入用户
        log::info!("💾 [AuthService] 插入用户到数据库");
        let result = user.insert(&self.db).await;

        let inserted_user = match result {
            Ok(user) => user,
            Err(e) => {
                // 如果插入后查询失败，尝试手动查询刚插入的用户
                log::warn!("⚠️ [AuthService] 插入后自动查询失败，尝试手动查询: {}", e);

                // 等待一小段时间确保数据写入完成
                tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

                let manual_query_result = User::find()
                    .filter(user::Column::Id.eq(&user_id))
                    .one(&self.db)
                    .await?;

                match manual_query_result {
                    Some(user) => {
                        log::info!("✅ [AuthService] 手动查询成功找到用户: {}", user.id);
                        user
                    }
                    None => {
                        log::error!("❌ [AuthService] 手动查询也失败，用户插入可能未成功");
                        return Err(anyhow::anyhow!("用户插入失败：无法找到刚插入的记录"));
                    }
                }
            }
        };

        log::info!(
            "✅ [AuthService] 用户插入成功: id={}, email={}",
            inserted_user.id,
            inserted_user.email
        );

        // 记录安全事件
        log::info!("📝 [AuthService] 记录安全事件");
        self.log_security_event(
            inserted_user.id.clone(),
            "register".to_string(),
            "用户注册".to_string(),
            ip_address.clone(),
            user_agent.clone(),
            "low".to_string(),
        )
        .await?;
        log::info!("✅ [AuthService] 安全事件记录成功");

        // 生成令牌
        log::info!("🔑 [AuthService] 生成认证令牌");
        let (access_token, refresh_token) = self.generate_tokens(&inserted_user).await?;
        log::info!("✅ [AuthService] 令牌生成成功");

        // 创建会话
        log::info!("📋 [AuthService] 创建用户会话");
        self.create_session(&inserted_user, &refresh_token, ip_address, user_agent)
            .await?;
        log::info!("✅ [AuthService] 会话创建成功");

        let response = AuthResponse {
            user: self.user_to_response(&inserted_user),
            access_token,
            refresh_token,
            expires_in: 3600, // 1 小时
        };

        log::info!(
            "🎉 [AuthService] 注册流程完成: user_id={}",
            inserted_user.id
        );
        Ok(response)
    }

    pub async fn login(
        &self,
        request: LoginRequest,
        ip_address: String,
        user_agent: String,
    ) -> Result<AuthResponse> {
        // 查找用户
        let user = User::find()
            .filter(user::Column::Email.eq(&request.email))
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("邮箱或密码错误"))?;

        // 验证密码
        if !self.verify_password(&request.password, &user.password_hash)? {
            self.log_security_event(
                user.id,
                "login_failed".to_string(),
                "密码错误".to_string(),
                ip_address.clone(),
                user_agent.clone(),
                "medium".to_string(),
            )
            .await?;

            return Err(anyhow::anyhow!("邮箱或密码错误"));
        }

        // 检查双因素认证
        if user.is_two_factor_enabled {
            if let Some(code) = request.two_factor_code {
                if !self.verify_two_factor_code(&user, &code)? {
                    self.log_security_event(
                        user.id,
                        "login_failed_2fa".to_string(),
                        "双因素认证失败".to_string(),
                        ip_address.clone(),
                        user_agent.clone(),
                        "medium".to_string(),
                    )
                    .await?;

                    return Err(anyhow::anyhow!("双因素认证代码错误"));
                }
            } else {
                return Err(anyhow::anyhow!("需要双因素认证代码"));
            }
        }

        // 更新最后登录信息
        let mut user: user::ActiveModel = user.into();
        user.last_login_at = Set(Some(
            Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()),
        ));
        user.last_login_ip = Set(Some(ip_address.clone()));
        let user = user.update(&self.db).await?;

        // 记录安全事件
        self.log_security_event(
            user.id.clone(),
            "login".to_string(),
            "用户登录".to_string(),
            ip_address.clone(),
            user_agent.clone(),
            "low".to_string(),
        )
        .await?;

        // 生成令牌
        let (access_token, refresh_token) = self.generate_tokens(&user).await?;

        // 创建会话
        self.create_session(&user, &refresh_token, ip_address, user_agent)
            .await?;

        Ok(AuthResponse {
            user: self.user_to_response(&user),
            access_token,
            refresh_token,
            expires_in: 3600, // 1 小时
        })
    }

    pub async fn logout(&self, user_id: String, refresh_token: String) -> Result<()> {
        // 删除会话
        UserSession::delete_many()
            .filter(user_session::Column::UserId.eq(user_id))
            .filter(user_session::Column::RefreshToken.eq(refresh_token))
            .exec(&self.db)
            .await?;

        Ok(())
    }

    pub async fn refresh_token(&self, refresh_token: String) -> Result<(String, String)> {
        // 查找会话
        let session = UserSession::find()
            .filter(user_session::Column::RefreshToken.eq(&refresh_token))
            .filter(user_session::Column::IsActive.eq(true))
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("无效的刷新令牌"))?;

        // 检查会话是否过期
        if session.expires_at < Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap())
        {
            return Err(anyhow::anyhow!("刷新令牌已过期"));
        }

        // 查找用户
        let user_id = session.user_id.clone();
        let user = User::find_by_id(&user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("用户不存在"))?;

        // 生成新令牌
        let (access_token, new_refresh_token) = self.generate_tokens(&user).await?;

        // 更新会话
        let mut session: user_session::ActiveModel = session.into();
        session.refresh_token = Set(new_refresh_token.clone());
        session.last_accessed_at =
            Set(Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()));
        session.update(&self.db).await?;

        Ok((access_token, new_refresh_token))
    }

    pub async fn setup_two_factor(&self, user_id: String) -> Result<TwoFactorSetupResponse> {
        let user = User::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("用户不存在"))?;

        // 生成密钥
        let mut rng = rand::thread_rng();
        let secret: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
        let _totp = TOTP::new(Algorithm::SHA1, 6, 1, 30, secret.clone())?;

        // 生成二维码 URL
        let qr_code_url = format!(
            "otpauth://totp/{}:{}?secret={}&issuer={}",
            "QuantConsole",
            user.email,
            base32::encode(base32::Alphabet::RFC4648 { padding: true }, &secret),
            "QuantConsole"
        );

        // 保存密钥到数据库
        let mut user: user::ActiveModel = user.into();
        user.two_factor_secret = Set(Some(base32::encode(
            base32::Alphabet::RFC4648 { padding: true },
            &secret,
        )));
        user.update(&self.db).await?;

        // 生成备份码
        let backup_codes = self.generate_backup_codes();

        Ok(TwoFactorSetupResponse {
            qr_code_url,
            secret_key: base32::encode(base32::Alphabet::RFC4648 { padding: true }, &secret),
            backup_codes,
        })
    }

    pub async fn verify_and_enable_two_factor(
        &self,
        user_id: String,
        code: String,
    ) -> Result<Vec<String>> {
        let user = User::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("用户不存在"))?;

        if !self.verify_two_factor_code(&user, &code)? {
            return Err(anyhow::anyhow!("验证码错误"));
        }

        // 启用双因素认证
        let mut user: user::ActiveModel = user.into();
        user.is_two_factor_enabled = Set(true);
        user.update(&self.db).await?;

        // 生成备份码
        let backup_codes = self.generate_backup_codes();

        Ok(backup_codes)
    }

    fn hash_password(&self, password: &str) -> Result<String> {
        Ok(hash(password, DEFAULT_COST)?)
    }

    fn verify_password(&self, password: &str, hash: &str) -> Result<bool> {
        Ok(verify(password, hash)?)
    }

    fn verify_two_factor_code(&self, user: &user::Model, code: &str) -> Result<bool> {
        if let Some(secret_encoded) = &user.two_factor_secret {
            let secret =
                base32::decode(base32::Alphabet::RFC4648 { padding: true }, secret_encoded)
                    .ok_or_else(|| anyhow::anyhow!("无效的密钥格式"))?;
            let totp = TOTP::new(Algorithm::SHA1, 6, 1, 30, secret)?;

            Ok(totp.check_current(code)?)
        } else {
            Ok(false)
        }
    }

    async fn generate_tokens(&self, user: &user::Model) -> Result<(String, String)> {
        let now = Utc::now();
        let access_exp = now + Duration::hours(1);
        let refresh_exp = now + Duration::days(7);

        // 生成会话ID
        let session_id = uuid::Uuid::new_v4().to_string();

        let access_claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            username: user.username.clone(),
            role: user.role.clone(),
            session_id: session_id.clone(),
            device_id: None,  // 可以从请求中获取设备指纹
            ip_address: None, // 可以从请求中获取IP地址
            exp: access_exp.timestamp(),
            iat: now.timestamp(),
            iss: "QuantConsole".to_string(),
            aud: "QuantConsole-Client".to_string(),
        };

        let refresh_claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            username: user.username.clone(),
            role: user.role.clone(),
            session_id,
            device_id: None,
            ip_address: None,
            exp: refresh_exp.timestamp(),
            iat: now.timestamp(),
            iss: "QuantConsole".to_string(),
            aud: "QuantConsole-Client".to_string(),
        };

        let access_token = encode(
            &Header::default(),
            &access_claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref()),
        )?;

        let refresh_token = encode(
            &Header::default(),
            &refresh_claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref()),
        )?;

        Ok((access_token, refresh_token))
    }

    async fn create_session(
        &self,
        user: &user::Model,
        refresh_token: &str,
        ip_address: String,
        user_agent: String,
    ) -> Result<()> {
        let session = user_session::ActiveModel {
            id: Set(uuid::Uuid::new_v4().to_string()),
            user_id: Set(user.id.clone()),
            refresh_token: Set(refresh_token.to_string()),
            ip_address: Set(ip_address),
            user_agent: Set(user_agent),
            expires_at: Set(
                Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap())
                    + Duration::days(7),
            ),
            ..Default::default()
        };

        // 插入会话，如果出现查询问题则忽略（不影响主要业务流程）
        match session.insert(&self.db).await {
            Ok(_) => {
                log::debug!("✅ [AuthService] 会话创建成功");
            }
            Err(e) => {
                log::warn!("⚠️ [AuthService] 会话记录失败，但不影响主流程: {}", e);
                // 对于会话记录失败，我们不抛出错误，避免影响主要业务流程
            }
        }

        Ok(())
    }

    async fn log_security_event(
        &self,
        user_id: String,
        event_type: String,
        description: String,
        ip_address: String,
        user_agent: String,
        severity: String,
    ) -> Result<()> {
        let event = security_event::ActiveModel {
            id: Set(uuid::Uuid::new_v4().to_string()),
            user_id: Set(user_id),
            event_type: Set(event_type),
            description: Set(description),
            ip_address: Set(ip_address),
            user_agent: Set(user_agent),
            severity: Set(severity),
            ..Default::default()
        };

        // 插入安全事件，如果出现查询问题则忽略（不影响主要业务流程）
        match event.insert(&self.db).await {
            Ok(_) => {
                log::debug!("✅ [AuthService] 安全事件记录成功");
            }
            Err(e) => {
                log::warn!("⚠️ [AuthService] 安全事件记录失败，但不影响主流程: {}", e);
                // 对于安全事件记录失败，我们不抛出错误，避免影响主要业务流程
            }
        }

        Ok(())
    }

    fn user_to_response(&self, user: &user::Model) -> UserResponse {
        UserResponse {
            id: user.id.clone(),
            email: user.email.clone(),
            username: user.username.clone(),
            first_name: user.first_name.clone(),
            last_name: user.last_name.clone(),
            avatar: user.avatar.clone(),
            is_email_verified: user.is_email_verified,
            is_two_factor_enabled: user.is_two_factor_enabled,
            role: user.role.clone(),
            created_at: user.created_at,
            last_login_at: user.last_login_at,
        }
    }

    fn generate_backup_codes(&self) -> Vec<String> {
        (0..8)
            .map(|_| {
                let mut rng = rand::thread_rng();
                format!(
                    "{:04}-{:04}",
                    rng.gen_range(0..10000),
                    rng.gen_range(0..10000)
                )
            })
            .collect()
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::default(),
        )?;

        Ok(token_data.claims)
    }
}

use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand::Rng;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use totp_rs::{Algorithm, TOTP};
use uuid::Uuid;

use crate::models::{
    user::{self, Entity as User},
    user_session::{self, Entity as UserSession},
    security_event::{self},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // 用户 ID
    pub email: String,
    pub role: String,
    pub exp: i64, // 过期时间
    pub iat: i64, // 签发时间
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
    pub id: Uuid,
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

    pub async fn register(
        &self,
        request: RegisterRequest,
        ip_address: String,
        user_agent: String,
    ) -> Result<AuthResponse> {
        // 检查邮箱是否已存在
        if User::find()
            .filter(user::Column::Email.eq(&request.email))
            .one(&self.db)
            .await?
            .is_some()
        {
            return Err(anyhow::anyhow!("邮箱已被注册"));
        }

        // 检查用户名是否已存在
        if User::find()
            .filter(user::Column::Username.eq(&request.username))
            .one(&self.db)
            .await?
            .is_some()
        {
            return Err(anyhow::anyhow!("用户名已被使用"));
        }

        // 创建用户
        let password_hash = self.hash_password(&request.password)?;
        let user = user::ActiveModel {
            email: Set(request.email.clone()),
            username: Set(request.username.clone()),
            password_hash: Set(password_hash),
            first_name: Set(request.first_name.clone()),
            last_name: Set(request.last_name.clone()),
            ..Default::default()
        };

        let user = user.insert(&self.db).await?;

        // 记录安全事件
        self.log_security_event(
            user.id,
            "register".to_string(),
            "用户注册".to_string(),
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
        user.last_login_at = Set(Some(Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap())));
        user.last_login_ip = Set(Some(ip_address.clone()));
        let user = user.update(&self.db).await?;

        // 记录安全事件
        self.log_security_event(
            user.id,
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

    pub async fn logout(&self, user_id: Uuid, refresh_token: String) -> Result<()> {
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
        if session.expires_at < Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()) {
            return Err(anyhow::anyhow!("刷新令牌已过期"));
        }

        // 查找用户
        let user = User::find_by_id(session.user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("用户不存在"))?;

        // 生成新令牌
        let (access_token, new_refresh_token) = self.generate_tokens(&user).await?;

        // 更新会话
        let mut session: user_session::ActiveModel = session.into();
        session.refresh_token = Set(new_refresh_token.clone());
        session.last_accessed_at = Set(Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()));
        session.update(&self.db).await?;

        Ok((access_token, new_refresh_token))
    }

    pub async fn setup_two_factor(&self, user_id: Uuid) -> Result<TwoFactorSetupResponse> {
        let user = User::find_by_id(user_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("用户不存在"))?;

        // 生成密钥
        let mut rng = rand::thread_rng();
        let secret: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
        let _totp = TOTP::new(
            Algorithm::SHA1,
            6,
            1,
            30,
            secret.clone(),
        )?;

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
        user.two_factor_secret = Set(Some(base32::encode(base32::Alphabet::RFC4648 { padding: true }, &secret)));
        user.update(&self.db).await?;

        // 生成备份码
        let backup_codes = self.generate_backup_codes();

        Ok(TwoFactorSetupResponse {
            qr_code_url,
            secret_key: base32::encode(base32::Alphabet::RFC4648 { padding: true }, &secret),
            backup_codes,
        })
    }

    pub async fn verify_and_enable_two_factor(&self, user_id: Uuid, code: String) -> Result<Vec<String>> {
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
            let secret = base32::decode(base32::Alphabet::RFC4648 { padding: true }, secret_encoded)
                .ok_or_else(|| anyhow::anyhow!("无效的密钥格式"))?;
            let totp = TOTP::new(
                Algorithm::SHA1,
                6,
                1,
                30,
                secret,
            )?;

            Ok(totp.check_current(code)?)
        } else {
            Ok(false)
        }
    }

    async fn generate_tokens(&self, user: &user::Model) -> Result<(String, String)> {
        let now = Utc::now();
        let access_exp = now + Duration::hours(1);
        let refresh_exp = now + Duration::days(7);

        let access_claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.role.clone(),
            exp: access_exp.timestamp(),
            iat: now.timestamp(),
        };

        let refresh_claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.role.clone(),
            exp: refresh_exp.timestamp(),
            iat: now.timestamp(),
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
            user_id: Set(user.id),
            refresh_token: Set(refresh_token.to_string()),
            ip_address: Set(ip_address),
            user_agent: Set(user_agent),
            expires_at: Set(Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap()) + Duration::days(7)),
            ..Default::default()
        };

        session.insert(&self.db).await?;
        Ok(())
    }

    async fn log_security_event(
        &self,
        user_id: Uuid,
        event_type: String,
        description: String,
        ip_address: String,
        user_agent: String,
        severity: String,
    ) -> Result<()> {
        let event = security_event::ActiveModel {
            user_id: Set(user_id),
            event_type: Set(event_type),
            description: Set(description),
            ip_address: Set(ip_address),
            user_agent: Set(user_agent),
            severity: Set(severity),
            ..Default::default()
        };

        event.insert(&self.db).await?;
        Ok(())
    }

    fn user_to_response(&self, user: &user::Model) -> UserResponse {
        UserResponse {
            id: user.id,
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

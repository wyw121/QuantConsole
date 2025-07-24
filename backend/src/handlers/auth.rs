use actix_web::{web, HttpRequest, HttpResponse, Result};
use serde_json::json;
use std::sync::Arc;

use crate::services::auth::{AuthService, LoginRequest, RegisterRequest};
use crate::utils::response::{ApiResponse, ErrorCode};

pub async fn register(
    req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
    request: web::Json<RegisterRequest>,
) -> Result<HttpResponse> {
    log::info!("🔍 [Backend Handler] 接收到注册请求");
    log::info!("📝 [Backend Handler] 请求数据: {:?}", request);

    // 获取客户端信息
    let ip_address = req
        .connection_info()
        .peer_addr()
        .unwrap_or("unknown")
        .to_string();

    let user_agent = req
        .headers()
        .get("user-agent")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    log::info!(
        "🌐 [Backend Handler] 客户端信息 - IP: {}, User-Agent: {}",
        ip_address,
        user_agent
    );

    match auth_service
        .register(request.into_inner(), ip_address, user_agent)
        .await
    {
        Ok(response) => {
            log::info!("✅ [Backend Handler] 注册成功: {:?}", response);
            Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
        }
        Err(e) => {
            log::error!("❌ [Backend Handler] 注册失败: {}", e);
            Ok(HttpResponse::BadRequest().json(ApiResponse::<()>::error(
                ErrorCode::ValidationError,
                &e.to_string(),
            )))
        }
    }
}

pub async fn login(
    req: HttpRequest,
    auth_service: web::Data<Arc<AuthService>>,
    request: web::Json<LoginRequest>,
) -> Result<HttpResponse> {
    // 获取客户端信息
    let ip_address = req
        .connection_info()
        .peer_addr()
        .unwrap_or("unknown")
        .to_string();

    let user_agent = req
        .headers()
        .get("user-agent")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    match auth_service
        .login(request.into_inner(), ip_address, user_agent)
        .await
    {
        Ok(response) => Ok(HttpResponse::Ok().json(ApiResponse::success(response))),
        Err(e) => {
            log::error!("登录失败: {}", e);
            Ok(HttpResponse::BadRequest().json(ApiResponse::<()>::error(
                ErrorCode::AuthenticationError,
                &e.to_string(),
            )))
        }
    }
}

pub async fn logout(
    auth_service: web::Data<Arc<AuthService>>,
    user_id: web::ReqData<uuid::Uuid>,
    request: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let refresh_token = request
        .get("refresh_token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            HttpResponse::BadRequest().json(ApiResponse::<()>::error(
                ErrorCode::ValidationError,
                "缺少刷新令牌",
            ))
        });

    let refresh_token = match refresh_token {
        Ok(_) => refresh_token.unwrap().to_string(),
        Err(response) => return Ok(response),
    };

    match auth_service
        .logout(user_id.to_string(), refresh_token)
        .await
    {
        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse::success(json!({})))),
        Err(e) => {
            log::error!("登出失败: {}", e);
            Ok(
                HttpResponse::InternalServerError().json(ApiResponse::<()>::error(
                    ErrorCode::InternalError,
                    "登出失败",
                )),
            )
        }
    }
}

pub async fn refresh_token(
    auth_service: web::Data<Arc<AuthService>>,
    request: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let refresh_token = request
        .get("refresh_token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            HttpResponse::BadRequest().json(ApiResponse::<()>::error(
                ErrorCode::ValidationError,
                "缺少刷新令牌",
            ))
        });

    let refresh_token = match refresh_token {
        Ok(_) => refresh_token.unwrap().to_string(),
        Err(response) => return Ok(response),
    };

    match auth_service.refresh_token(refresh_token).await {
        Ok((access_token, new_refresh_token)) => {
            Ok(HttpResponse::Ok().json(ApiResponse::success(json!({
                "access_token": access_token,
                "refresh_token": new_refresh_token,
                "expires_in": 3600
            }))))
        }
        Err(e) => {
            log::error!("刷新令牌失败: {}", e);
            Ok(HttpResponse::BadRequest().json(ApiResponse::<()>::error(
                ErrorCode::AuthenticationError,
                &e.to_string(),
            )))
        }
    }
}

pub async fn setup_two_factor(
    auth_service: web::Data<Arc<AuthService>>,
    user_id: web::ReqData<uuid::Uuid>,
) -> Result<HttpResponse> {
    match auth_service.setup_two_factor(user_id.to_string()).await {
        Ok(response) => Ok(HttpResponse::Ok().json(ApiResponse::success(response))),
        Err(e) => {
            log::error!("设置双因素认证失败: {}", e);
            Ok(
                HttpResponse::InternalServerError().json(ApiResponse::<()>::error(
                    ErrorCode::InternalError,
                    "设置双因素认证失败",
                )),
            )
        }
    }
}

pub async fn confirm_two_factor(
    auth_service: web::Data<Arc<AuthService>>,
    user_id: web::ReqData<uuid::Uuid>,
    request: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let code = request.get("code").and_then(|v| v.as_str()).ok_or_else(|| {
        HttpResponse::BadRequest().json(ApiResponse::<()>::error(
            ErrorCode::ValidationError,
            "缺少验证码",
        ))
    });

    let code = match code {
        Ok(_) => code.unwrap().to_string(),
        Err(response) => return Ok(response),
    };

    match auth_service
        .verify_and_enable_two_factor(user_id.to_string(), code.clone())
        .await
    {
        Ok(backup_codes) => Ok(HttpResponse::Ok().json(ApiResponse::success(json!({
            "backup_codes": backup_codes
        })))),
        Err(e) => {
            log::error!("确认双因素认证失败: {}", e);
            Ok(HttpResponse::BadRequest().json(ApiResponse::<()>::error(
                ErrorCode::ValidationError,
                &e.to_string(),
            )))
        }
    }
}

pub async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse::success(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))))
}

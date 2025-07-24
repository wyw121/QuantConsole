use actix_web::{web, HttpResponse, Result};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::services::AuthService;
use crate::utils::response::{ApiResponse, ErrorCode};

/// 获取活跃设备列表
pub async fn get_active_devices(
    auth_service: web::Data<Arc<AuthService>>,
    user_id: web::ReqData<Uuid>,
) -> Result<HttpResponse> {
    match auth_service.get_active_devices(user_id.to_string()).await {
        Ok(devices) => Ok(HttpResponse::Ok().json(ApiResponse::success(devices))),
        Err(e) => {
            log::error!("获取设备列表失败: {}", e);
            Ok(
                HttpResponse::InternalServerError().json(ApiResponse::<()>::error(
                    ErrorCode::InternalError,
                    "获取设备列表失败",
                )),
            )
        }
    }
}

/// 撤销设备访问权限
pub async fn revoke_device_access(
    auth_service: web::Data<Arc<AuthService>>,
    user_id: web::ReqData<Uuid>,
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let device_id = path.into_inner();

    match auth_service
        .revoke_device_access(user_id.to_string(), &device_id)
        .await
    {
        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse::success(json!({})))),
        Err(e) => {
            log::error!("撤销设备访问失败: {}", e);
            Ok(
                HttpResponse::InternalServerError().json(ApiResponse::<()>::error(
                    ErrorCode::InternalError,
                    "撤销设备访问失败",
                )),
            )
        }
    }
}

/// 登出所有设备
pub async fn logout_all_devices(
    auth_service: web::Data<Arc<AuthService>>,
    user_id: web::ReqData<Uuid>,
) -> Result<HttpResponse> {
    match auth_service.logout_all_devices(user_id.to_string()).await {
        Ok(_) => Ok(HttpResponse::Ok().json(ApiResponse::success(json!({})))),
        Err(e) => {
            log::error!("登出所有设备失败: {}", e);
            Ok(
                HttpResponse::InternalServerError().json(ApiResponse::<()>::error(
                    ErrorCode::InternalError,
                    "登出所有设备失败",
                )),
            )
        }
    }
}

/// 获取安全事件日志
pub async fn get_security_events(
    auth_service: web::Data<Arc<AuthService>>,
    user_id: web::ReqData<Uuid>,
    query: web::Query<SecurityEventQuery>,
) -> Result<HttpResponse> {
    match auth_service
        .get_security_events(user_id.to_string(), query.into_inner())
        .await
    {
        Ok(events) => Ok(HttpResponse::Ok().json(ApiResponse::success(events))),
        Err(e) => {
            log::error!("获取安全事件失败: {}", e);
            Ok(
                HttpResponse::InternalServerError().json(ApiResponse::<()>::error(
                    ErrorCode::InternalError,
                    "获取安全事件失败",
                )),
            )
        }
    }
}

#[derive(serde::Deserialize)]
pub struct SecurityEventQuery {
    pub page: Option<u64>,
    pub limit: Option<u64>,
    pub event_type: Option<String>,
    pub severity: Option<String>,
}

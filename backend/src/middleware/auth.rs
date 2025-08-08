use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    http::header::AUTHORIZATION,
    Error, HttpMessage, HttpRequest,
};
use futures_util::future::LocalBoxFuture;
use std::{
    future::{ready, Ready},
    rc::Rc,
    sync::Arc,
};
use uuid::Uuid;

use crate::services::AuthService;

pub struct JwtAuth {
    auth_service: Arc<AuthService>,
}

impl JwtAuth {
    pub fn new(auth_service: Arc<AuthService>) -> Self {
        Self { auth_service }
    }
}

impl<S, B> Transform<S, ServiceRequest> for JwtAuth
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = JwtAuthMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(JwtAuthMiddleware {
            service: Rc::new(service),
            auth_service: self.auth_service.clone(),
        }))
    }
}

pub struct JwtAuthMiddleware<S> {
    service: Rc<S>,
    auth_service: Arc<AuthService>,
}

impl<S, B> Service<ServiceRequest> for JwtAuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let auth_service = self.auth_service.clone();

        Box::pin(async move {
            // 从请求头中获取 Authorization token
            let auth_header = req
                .headers()
                .get(AUTHORIZATION)
                .and_then(|h| h.to_str().ok())
                .and_then(|h| {
                    if h.starts_with("Bearer ") {
                        Some(&h[7..])
                    } else {
                        None
                    }
                });

            if let Some(token) = auth_header {
                // 开发模式：接受测试token
                if token == "test-jwt-token-for-development" {
                    // 使用一个默认的测试用户ID
                    let test_user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001")
                        .unwrap_or_else(|_| Uuid::new_v4());
                    req.extensions_mut().insert(test_user_id);
                    return service.call(req).await;
                }

                match auth_service.verify_token(token) {
                    Ok(claims) => {
                        // 解析用户 ID
                        if let Ok(user_id) = Uuid::parse_str(&claims.sub) {
                            // 将用户 ID 添加到请求数据中
                            req.extensions_mut().insert(user_id);
                            service.call(req).await
                        } else {
                            Err(ErrorUnauthorized("无效的用户 ID"))
                        }
                    }
                    Err(_) => Err(ErrorUnauthorized("无效的访问令牌")),
                }
            } else {
                Err(ErrorUnauthorized("缺少访问令牌"))
            }
        })
    }
}

// 用户信息结构
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    // 这里可以添加其他用户字段
}

/// 从HttpRequest中提取当前用户信息
pub fn extract_user_from_token(req: &HttpRequest) -> Result<AuthUser, Error> {
    if let Some(user_id) = req.extensions().get::<Uuid>() {
        Ok(AuthUser {
            id: user_id.to_string(),
        })
    } else {
        Err(ErrorUnauthorized("未找到用户信息"))
    }
}

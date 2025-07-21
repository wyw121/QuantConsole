use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    http::header::AUTHORIZATION,
    Error, HttpMessage,
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

mod handlers;
mod middleware;
mod models;
mod services;
mod utils;

use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use dotenvy::dotenv;
use sea_orm::{Database, DatabaseConnection};
use sea_orm_migration::prelude::*;
use std::{env, sync::Arc};

use handlers::*;
use middleware::JwtAuth;
use services::AuthService;

pub struct AppState {
    pub db: DatabaseConnection,
    pub auth_service: Arc<AuthService>,
}

async fn create_database_connection() -> Result<DatabaseConnection, Box<dyn std::error::Error>> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL 必须在环境变量中设置");

    let db = Database::connect(&database_url).await?;

    // 运行数据库迁移
    log::info!("正在运行数据库迁移...");
    migration::Migrator::up(&db, None).await?;
    log::info!("数据库迁移完成");

    Ok(db)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 加载环境变量
    dotenv().ok();

    // 初始化日志
    env_logger::init();

    log::info!("正在启动 QuantConsole 后端服务...");

    // 创建数据库连接
    let db = create_database_connection()
        .await
        .expect("无法连接到数据库");

    log::info!("数据库连接成功");

    // 创建服务
    let jwt_secret =
        env::var("JWT_SECRET").unwrap_or_else(|_| "your-super-secret-jwt-key".to_string());

    let auth_service = Arc::new(AuthService::new(db.clone(), jwt_secret));

    // 获取服务器配置
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .expect("PORT 必须是有效的数字");

    log::info!("服务器将在 {}:{} 上启动", host, port);

    // 启动 HTTP 服务器
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec!["authorization", "accept", "content-type"])
            .supports_credentials();

        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(auth_service.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api")
                    // 健康检查
                    .route("/health", web::get().to(health_check))
                    // 认证路由 (无需身份验证)
                    .service(
                        web::scope("/auth")
                            .route("/register", web::post().to(register))
                            .route("/login", web::post().to(login))
                            .route("/refresh", web::post().to(refresh_token))
                            // 需要身份验证的认证路由
                            .service(
                                web::scope("")
                                    .wrap(JwtAuth::new(auth_service.clone()))
                                    .route("/logout", web::post().to(logout))
                                    .route("/2fa/setup", web::post().to(setup_two_factor))
                                    .route("/2fa/confirm", web::post().to(confirm_two_factor)),
                            ),
                    )
                    // 用户路由 (需要身份验证)
                    .service(
                        web::scope("/user")
                            .wrap(JwtAuth::new(auth_service.clone()))
                            .route("/devices", web::get().to(get_active_devices))
                            .route("/devices/{device_id}/revoke", web::post().to(revoke_device_access))
                            .route("/logout-all", web::post().to(logout_all_devices))
                            .route("/security-events", web::get().to(get_security_events)),
                    ),
            )
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}

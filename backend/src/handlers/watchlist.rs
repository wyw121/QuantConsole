use actix_web::{web, HttpRequest, HttpResponse, Result};
use chrono::Utc;
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait,
    QueryFilter, QueryOrder, Set,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;

use crate::middleware::auth::extract_user_from_token;
use crate::models::price_alert::{
    CreatePriceAlertRequest, PriceAlertResponse, UpdatePriceAlertRequest,
};
use crate::models::watchlist_token::{
    CreateWatchlistTokenRequest, UpdateWatchlistTokenRequest, WatchlistTokenResponse,
};
use crate::models::{PriceAlert, WatchlistToken};

// ============ 关注列表管理 ============

/// 获取用户的关注代币列表
pub async fn get_watchlist_tokens(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
    query: web::Query<GetWatchlistQuery>,
) -> Result<HttpResponse> {
    // 身份验证
    let user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(_) => return Ok(HttpResponse::Unauthorized().json("未授权访问")),
    };

    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100); // 限制最大每页数量
    let is_active = query.is_active.unwrap_or(true);

    // 查询关注代币
    let mut query_builder = WatchlistToken::find()
        .filter(crate::models::watchlist_token::Column::UserId.eq(user.id.clone()));

    if let Some(active) = Some(is_active) {
        query_builder = query_builder.filter(
            crate::models::watchlist_token::Column::IsActive.eq(active),
        );
    }

    let paginator = query_builder
        .order_by_asc(crate::models::watchlist_token::Column::SortOrder)
        .paginate(&**db, per_page);

    let total = paginator.num_items().await.map_err(|e| {
        eprintln!("查询关注列表总数失败: {}", e);
        actix_web::error::ErrorInternalServerError("查询失败")
    })?;

    let tokens = paginator.fetch_page(page - 1).await.map_err(|e| {
        eprintln!("查询关注列表失败: {}", e);
        actix_web::error::ErrorInternalServerError("查询失败")
    })?;

    // 获取实时价格数据（模拟数据，实际应从市场数据服务获取）
    let mut token_responses = Vec::new();
    for token in tokens {
        let price_data = get_mock_price_data(&token.symbol, &token.exchange).await;
        token_responses.push(WatchlistTokenResponse {
            id: token.id,
            symbol: token.symbol,
            exchange: token.exchange,
            display_name: token.display_name,
            is_active: token.is_active,
            sort_order: token.sort_order,
            current_price: price_data.get("price").copied(),
            price_change_24h: price_data.get("change_24h").copied(),
            price_change_percentage_24h: price_data.get("change_percent_24h").copied(),
            volume_24h: price_data.get("volume_24h").copied(),
            market_cap: price_data.get("market_cap").copied(),
            created_at: token.created_at,
            updated_at: token.updated_at,
        });
    }

    Ok(HttpResponse::Ok().json(WatchlistResponse {
        success: true,
        data: token_responses,
        pagination: PaginationInfo {
            page,
            per_page,
            total,
            total_pages: (total as f64 / per_page as f64).ceil() as u64,
        },
    }))
}

/// 添加代币到关注列表
pub async fn create_watchlist_token(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
    json: web::Json<CreateWatchlistTokenRequest>,
) -> Result<HttpResponse> {
    let user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(_) => return Ok(HttpResponse::Unauthorized().json("未授权访问")),
    };

    let req_data = json.into_inner();

    // 检查是否已存在
    let existing = WatchlistToken::find()
        .filter(crate::models::watchlist_token::Column::UserId.eq(user.id.clone()))
        .filter(crate::models::watchlist_token::Column::Symbol.eq(&req_data.symbol))
        .filter(crate::models::watchlist_token::Column::Exchange.eq(&req_data.exchange))
        .one(&**db)
        .await
        .map_err(|e| {
            eprintln!("检查重复关注代币失败: {}", e);
            actix_web::error::ErrorInternalServerError("检查失败")
        })?;

    if existing.is_some() {
        return Ok(HttpResponse::Conflict().json(ApiResponse::<()> {
            success: false,
            message: Some("该代币已在关注列表中".to_string()),
            data: None,
        }));
    }

    // 获取下一个排序号
    let max_sort_order = WatchlistToken::find()
        .filter(crate::models::watchlist_token::Column::UserId.eq(user.id.clone()))
        .order_by_desc(crate::models::watchlist_token::Column::SortOrder)
        .one(&**db)
        .await
        .map_err(|e| {
            eprintln!("获取最大排序号失败: {}", e);
            actix_web::error::ErrorInternalServerError("查询失败")
        })?
        .map(|t| t.sort_order)
        .unwrap_or(0);

    // 创建新的关注代币
    let new_token = crate::models::watchlist_token::ActiveModel {
        user_id: Set(user.id.clone()),
        symbol: Set(req_data.symbol.to_uppercase()),
        exchange: Set(req_data.exchange.to_lowercase()),
        display_name: Set(req_data.display_name),
        is_active: Set(true),
        sort_order: Set(max_sort_order + 1),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let token = new_token.insert(&**db).await.map_err(|e| {
        eprintln!("创建关注代币失败: {}", e);
        actix_web::error::ErrorInternalServerError("创建失败")
    })?;

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        message: Some("添加关注代币成功".to_string()),
        data: Some(WatchlistTokenResponse {
            id: token.id,
            symbol: token.symbol,
            exchange: token.exchange,
            display_name: token.display_name,
            is_active: token.is_active,
            sort_order: token.sort_order,
            current_price: None,
            price_change_24h: None,
            price_change_percentage_24h: None,
            volume_24h: None,
            market_cap: None,
            created_at: token.created_at,
            updated_at: token.updated_at,
        }),
    }))
}

/// 更新关注代币
pub async fn update_watchlist_token(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
    path: web::Path<i64>,
    json: web::Json<UpdateWatchlistTokenRequest>,
) -> Result<HttpResponse> {
    let user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(_) => return Ok(HttpResponse::Unauthorized().json("未授权访问")),
    };

    let token_id = path.into_inner();
    let req_data = json.into_inner();

    // 查找代币
    let token = WatchlistToken::find_by_id(token_id)
        .filter(crate::models::watchlist_token::Column::UserId.eq(user.id.clone()))
        .one(&**db)
        .await
        .map_err(|e| {
            eprintln!("查找关注代币失败: {}", e);
            actix_web::error::ErrorInternalServerError("查询失败")
        })?;

    let token = match token {
        Some(token) => token,
        None => return Ok(HttpResponse::NotFound().json("关注代币不存在")),
    };

    // 更新代币
    let mut token_active: crate::models::watchlist_token::ActiveModel = token.into();

    if let Some(display_name) = req_data.display_name {
        token_active.display_name = Set(Some(display_name));
    }
    if let Some(is_active) = req_data.is_active {
        token_active.is_active = Set(is_active);
    }
    if let Some(sort_order) = req_data.sort_order {
        token_active.sort_order = Set(sort_order);
    }
    token_active.updated_at = Set(Utc::now().into());

    let updated_token = token_active.update(&**db).await.map_err(|e| {
        eprintln!("更新关注代币失败: {}", e);
        actix_web::error::ErrorInternalServerError("更新失败")
    })?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        message: Some("更新关注代币成功".to_string()),
        data: Some(WatchlistTokenResponse {
            id: updated_token.id,
            symbol: updated_token.symbol,
            exchange: updated_token.exchange,
            display_name: updated_token.display_name,
            is_active: updated_token.is_active,
            sort_order: updated_token.sort_order,
            current_price: None,
            price_change_24h: None,
            price_change_percentage_24h: None,
            volume_24h: None,
            market_cap: None,
            created_at: updated_token.created_at,
            updated_at: updated_token.updated_at,
        }),
    }))
}

/// 删除关注代币
pub async fn delete_watchlist_token(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
    path: web::Path<i64>,
) -> Result<HttpResponse> {
    let user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(_) => return Ok(HttpResponse::Unauthorized().json("未授权访问")),
    };

    let token_id = path.into_inner();

    // 查找并删除代币
    let delete_result = WatchlistToken::delete_by_id(token_id)
        .filter(crate::models::watchlist_token::Column::UserId.eq(user.id.clone()))
        .exec(&**db)
        .await
        .map_err(|e| {
            eprintln!("删除关注代币失败: {}", e);
            actix_web::error::ErrorInternalServerError("删除失败")
        })?;

    if delete_result.rows_affected == 0 {
        return Ok(HttpResponse::NotFound().json("关注代币不存在"));
    }

    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        message: Some("删除关注代币成功".to_string()),
        data: None,
    }))
}

// ============ 价格提醒管理 ============

/// 获取用户的价格提醒列表
pub async fn get_price_alerts(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
    query: web::Query<GetAlertsQuery>,
) -> Result<HttpResponse> {
    let user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(_) => return Ok(HttpResponse::Unauthorized().json("未授权访问")),
    };

    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);

    let mut query_builder = PriceAlert::find()
        .filter(crate::models::price_alert::Column::UserId.eq(user.id.clone()));

    if let Some(is_active) = query.is_active {
        query_builder = query_builder.filter(
            crate::models::price_alert::Column::IsActive.eq(is_active),
        );
    }

    if let Some(symbol) = &query.symbol {
        query_builder = query_builder.filter(
            crate::models::price_alert::Column::Symbol.eq(symbol.to_uppercase()),
        );
    }

    let paginator = query_builder
        .order_by_desc(crate::models::price_alert::Column::CreatedAt)
        .paginate(&**db, per_page);

    let total = paginator.num_items().await.map_err(|e| {
        eprintln!("查询价格提醒总数失败: {}", e);
        actix_web::error::ErrorInternalServerError("查询失败")
    })?;

    let alerts = paginator.fetch_page(page - 1).await.map_err(|e| {
        eprintln!("查询价格提醒失败: {}", e);
        actix_web::error::ErrorInternalServerError("查询失败")
    })?;

        let alert_responses: Vec<PriceAlertResponse> = alerts
        .into_iter()
        .map(|alert| PriceAlertResponse {
            id: alert.id,
            symbol: alert.symbol,
            exchange: alert.exchange,
            alert_type: alert.alert_type,
            target_value: alert.target_value.to_string().parse().unwrap_or(0.0),
            comparison_value: alert
                .comparison_value
                .map(|v| v.to_string().parse().unwrap_or(0.0)),
            condition: alert
                .condition
                .and_then(|v| serde_json::from_value(v.into()).ok()),
            is_active: alert.is_active,
            is_triggered: alert.is_triggered,
            triggered_at: alert.triggered_at,
            notification_channels: alert.notification_channels.and_then(|v| {
                serde_json::from_value(v.into()).ok()
            }),
            created_at: alert.created_at,
            updated_at: alert.updated_at,
        })
        .collect();

    Ok(HttpResponse::Ok().json(AlertsResponse {
        success: true,
        data: alert_responses,
        pagination: PaginationInfo {
            page,
            per_page,
            total,
            total_pages: (total as f64 / per_page as f64).ceil() as u64,
        },
    }))
}

/// 创建价格提醒
pub async fn create_price_alert(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
    json: web::Json<CreatePriceAlertRequest>,
) -> Result<HttpResponse> {
    let user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(_) => return Ok(HttpResponse::Unauthorized().json("未授权访问")),
    };

    let req_data = json.into_inner();

    // 创建新的价格提醒
    let new_alert = crate::models::price_alert::ActiveModel {
        user_id: Set(user.id.clone()),
        symbol: Set(req_data.symbol.to_uppercase()),
        exchange: Set(req_data.exchange.to_lowercase()),
        alert_type: Set(req_data.alert_type),
        target_value: Set(Decimal::from_str(&req_data.target_value.to_string())
            .unwrap_or_default()),
        comparison_value: Set(req_data.comparison_value.map(|v| {
            Decimal::from_str(&v.to_string()).unwrap_or_default()
        })),
        condition: Set(req_data.condition.map(serde_json::to_value).transpose().unwrap_or_default().map(|v| sea_orm::JsonValue::from(v))),
        is_active: Set(true),
        is_triggered: Set(false),
        triggered_at: Set(None),
        notification_channels: Set(req_data.notification_channels.map(|channels| {
            serde_json::to_value(channels).ok().map(|v| sea_orm::JsonValue::from(v))
        }).flatten()),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    let alert = new_alert.insert(&**db).await.map_err(|e| {
        eprintln!("创建价格提醒失败: {}", e);
        actix_web::error::ErrorInternalServerError("创建失败")
    })?;

    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        message: Some("创建价格提醒成功".to_string()),
        data: Some(PriceAlertResponse {
            id: alert.id,
            symbol: alert.symbol,
            exchange: alert.exchange,
            alert_type: alert.alert_type,
            target_value: alert.target_value.to_string().parse().unwrap_or(0.0),
            comparison_value: alert
                .comparison_value
                .map(|v| v.to_string().parse().unwrap_or(0.0)),
            condition: alert
                .condition
                .and_then(|v| serde_json::from_value(v.into()).ok()),
            is_active: alert.is_active,
            is_triggered: alert.is_triggered,
            triggered_at: alert.triggered_at,
            notification_channels: alert.notification_channels.and_then(|v| {
                serde_json::from_value(v.into()).ok()
            }),
            created_at: alert.created_at,
            updated_at: alert.updated_at,
        }),
    }))
}

/// 更新价格提醒
pub async fn update_price_alert(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
    path: web::Path<i64>,
    json: web::Json<UpdatePriceAlertRequest>,
) -> Result<HttpResponse> {
    let user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(_) => return Ok(HttpResponse::Unauthorized().json("未授权访问")),
    };

    let alert_id = path.into_inner();
    let req_data = json.into_inner();

    // 查找提醒
    let alert = PriceAlert::find_by_id(alert_id)
        .filter(crate::models::price_alert::Column::UserId.eq(user.id.clone()))
        .one(&**db)
        .await
        .map_err(|e| {
            eprintln!("查找价格提醒失败: {}", e);
            actix_web::error::ErrorInternalServerError("查询失败")
        })?;

    let alert = match alert {
        Some(alert) => alert,
        None => return Ok(HttpResponse::NotFound().json("价格提醒不存在")),
    };

    // 更新提醒
    let mut alert_active: crate::models::price_alert::ActiveModel = alert.into();

    if let Some(target_value) = req_data.target_value {
        alert_active.target_value = Set(Decimal::from_str(&target_value.to_string())
            .unwrap_or_default());
    }
    if let Some(comparison_value) = req_data.comparison_value {
        alert_active.comparison_value = Set(Some(
            Decimal::from_str(&comparison_value.to_string()).unwrap_or_default(),
        ));
    }
    if let Some(condition) = req_data.condition {
        alert_active.condition = Set(Some(serde_json::to_value(condition)
            .unwrap_or_default().into()));
    }
    if let Some(is_active) = req_data.is_active {
        alert_active.is_active = Set(is_active);
    }
    if let Some(notification_channels) = req_data.notification_channels {
        alert_active.notification_channels = Set(Some(
            serde_json::to_value(notification_channels).unwrap_or_default().into()
        ));
    }
    alert_active.updated_at = Set(Utc::now().into());

    let updated_alert = alert_active.update(&**db).await.map_err(|e| {
        eprintln!("更新价格提醒失败: {}", e);
        actix_web::error::ErrorInternalServerError("更新失败")
    })?;

    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        message: Some("更新价格提醒成功".to_string()),
        data: Some(PriceAlertResponse {
            id: updated_alert.id,
            symbol: updated_alert.symbol,
            exchange: updated_alert.exchange,
            alert_type: updated_alert.alert_type,
            target_value: updated_alert.target_value.to_string().parse().unwrap_or(0.0),
            comparison_value: updated_alert
                .comparison_value
                .map(|v| v.to_string().parse().unwrap_or(0.0)),
            condition: updated_alert
                .condition
                .and_then(|v| serde_json::from_value(v.into()).ok()),
            is_active: updated_alert.is_active,
            is_triggered: updated_alert.is_triggered,
            triggered_at: updated_alert.triggered_at,
            notification_channels: updated_alert.notification_channels.and_then(|v| {
                serde_json::from_value(v.into()).ok()
            }),
            created_at: updated_alert.created_at,
            updated_at: updated_alert.updated_at,
        }),
    }))
}

/// 删除价格提醒
pub async fn delete_price_alert(
    req: HttpRequest,
    db: web::Data<DatabaseConnection>,
    path: web::Path<i64>,
) -> Result<HttpResponse> {
    let user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(_) => return Ok(HttpResponse::Unauthorized().json("未授权访问")),
    };

    let alert_id = path.into_inner();

    let delete_result = PriceAlert::delete_by_id(alert_id)
        .filter(crate::models::price_alert::Column::UserId.eq(user.id.clone()))
        .exec(&**db)
        .await
        .map_err(|e| {
            eprintln!("删除价格提醒失败: {}", e);
            actix_web::error::ErrorInternalServerError("删除失败")
        })?;

    if delete_result.rows_affected == 0 {
        return Ok(HttpResponse::NotFound().json("价格提醒不存在"));
    }

    Ok(HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        message: Some("删除价格提醒成功".to_string()),
        data: None,
    }))
}

// ============ 辅助函数 ============

/// 获取模拟价格数据（实际应从市场数据服务获取）
async fn get_mock_price_data(
    _symbol: &str,
    _exchange: &str,
) -> HashMap<&'static str, f64> {
    // TODO: 从实际的市场数据服务获取价格
    let mut data = HashMap::new();
    data.insert("price", 50000.0);
    data.insert("change_24h", 1250.0);
    data.insert("change_percent_24h", 2.56);
    data.insert("volume_24h", 28500000.0);
    data.insert("market_cap", 950000000000.0);
    data
}

// ============ 请求/响应结构 ============

#[derive(Debug, Deserialize)]
pub struct GetWatchlistQuery {
    pub page: Option<u64>,
    pub per_page: Option<u64>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct GetAlertsQuery {
    pub page: Option<u64>,
    pub per_page: Option<u64>,
    pub is_active: Option<bool>,
    pub symbol: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WatchlistResponse {
    pub success: bool,
    pub data: Vec<WatchlistTokenResponse>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Serialize)]
pub struct AlertsResponse {
    pub success: bool,
    pub data: Vec<PriceAlertResponse>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Serialize)]
pub struct PaginationInfo {
    pub page: u64,
    pub per_page: u64,
    pub total: u64,
    pub total_pages: u64,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: Option<String>,
    pub data: Option<T>,
}

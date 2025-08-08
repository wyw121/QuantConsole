use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "price_alerts")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub user_id: String,
    pub symbol: String,
    pub exchange: String,
    pub alert_type: PriceAlertType,
    #[sea_orm(column_type = "Decimal(Some((20, 8)))")]
    pub target_value: Decimal,
    #[sea_orm(column_type = "Decimal(Some((20, 8)))")]
    pub comparison_value: Option<Decimal>,
    pub condition: Option<Json>,
    pub is_active: bool,
    pub is_triggered: bool,
    pub triggered_at: Option<DateTimeWithTimeZone>,
    pub notification_channels: Option<Json>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Debug, Clone, PartialEq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "price_alert_type")]
pub enum PriceAlertType {
    #[sea_orm(string_value = "price_above")]
    PriceAbove,
    #[sea_orm(string_value = "price_below")]
    PriceBelow,
    #[sea_orm(string_value = "percentage_change")]
    PercentageChange,
    #[sea_orm(string_value = "volume_spike")]
    VolumeSpike,
    #[sea_orm(string_value = "technical_indicator")]
    TechnicalIndicator,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "crate::models::user::Entity",
        from = "Column::UserId",
        to = "crate::models::user::Column::Id"
    )]
    User,
}

impl Related<crate::models::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

// 请求和响应结构
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePriceAlertRequest {
    pub symbol: String,
    pub exchange: String,
    pub alert_type: PriceAlertType,
    pub target_value: f64,
    pub comparison_value: Option<f64>,
    pub condition: Option<serde_json::Value>,
    pub notification_channels: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePriceAlertRequest {
    pub target_value: Option<f64>,
    pub comparison_value: Option<f64>,
    pub condition: Option<serde_json::Value>,
    pub is_active: Option<bool>,
    pub notification_channels: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriceAlertResponse {
    pub id: i64,
    pub symbol: String,
    pub exchange: String,
    pub alert_type: PriceAlertType,
    pub target_value: f64,
    pub comparison_value: Option<f64>,
    pub condition: Option<serde_json::Value>,
    pub is_active: bool,
    pub is_triggered: bool,
    pub triggered_at: Option<DateTimeWithTimeZone>,
    pub notification_channels: Option<Vec<String>>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

// 通知渠道枚举
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum NotificationChannel {
    Email,
    InApp,
    WebPush,
    Webhook,
}

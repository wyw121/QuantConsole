use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "price_history")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub symbol: String,
    pub exchange: String,
    #[sea_orm(column_type = "Decimal(Some((20, 8)))")]
    pub price: Decimal,
    #[sea_orm(column_type = "Decimal(Some((20, 8)))")]
    pub volume: Option<Decimal>,
    #[sea_orm(column_type = "Decimal(Some((30, 2)))")]
    pub market_cap: Option<Decimal>,
    pub timestamp: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

// 响应结构
#[derive(Debug, Serialize, Deserialize)]
pub struct PriceHistoryResponse {
    pub id: i64,
    pub symbol: String,
    pub exchange: String,
    pub price: f64,
    pub volume: Option<f64>,
    pub market_cap: Option<f64>,
    pub timestamp: DateTimeWithTimeZone,
}

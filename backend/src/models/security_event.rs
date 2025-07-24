use sea_orm::entity::prelude::*;
use sea_orm::{ActiveModelTrait, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "security_events")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Char(Some(36))")]
    #[serde(skip_deserializing)]
    pub id: String,

    #[sea_orm(column_type = "Char(Some(36))")]
    pub user_id: String,

    pub event_type: String, // login, logout, password_change, 2fa_setup, suspicious_activity
    pub description: String,
    pub ip_address: String,
    pub user_agent: String,
    pub location: Option<String>,

    pub severity: String,         // low, medium, high
    pub metadata: Option<String>, // JSON string for additional data

    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {
    fn new() -> Self {
        Self {
            id: Set(Uuid::new_v4().to_string()),
            created_at: Set(
                chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap())
            ),
            ..ActiveModelTrait::default()
        }
    }
}

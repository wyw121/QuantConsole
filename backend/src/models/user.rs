use sea_orm::entity::prelude::*;
use sea_orm::{ActiveModelTrait, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Char(Some(36))")]
    #[serde(skip_deserializing)]
    pub id: String,

    #[sea_orm(unique)]
    pub email: String,

    #[sea_orm(unique)]
    pub username: String,

    #[serde(skip_serializing)]
    pub password_hash: String,

    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar: Option<String>,

    #[sea_orm(default_value = false)]
    pub is_email_verified: bool,

    #[sea_orm(default_value = false)]
    pub is_two_factor_enabled: bool,

    pub two_factor_secret: Option<String>,

    #[sea_orm(default_value = "user")]
    pub role: String,

    #[sea_orm(default_value = true)]
    pub is_active: bool,

    pub email_verification_token: Option<String>,
    pub email_verification_expires_at: Option<DateTimeWithTimeZone>,
    pub password_reset_token: Option<String>,
    pub password_reset_expires_at: Option<DateTimeWithTimeZone>,

    pub last_login_at: Option<DateTimeWithTimeZone>,
    pub last_login_ip: Option<String>,

    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::user_session::Entity")]
    UserSessions,
    #[sea_orm(has_many = "super::security_event::Entity")]
    SecurityEvents,
}

impl Related<super::user_session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::UserSessions.def()
    }
}

impl Related<super::security_event::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::SecurityEvents.def()
    }
}

impl ActiveModelBehavior for ActiveModel {
    fn new() -> Self {
        Self {
            id: Set(Uuid::new_v4().to_string()),
            created_at: Set(
                chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap())
            ),
            updated_at: Set(
                chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap())
            ),
            ..ActiveModelTrait::default()
        }
    }
}

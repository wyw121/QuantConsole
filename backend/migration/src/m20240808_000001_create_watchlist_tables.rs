use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 创建关注代币表
        manager
            .create_table(
                Table::create()
                    .table(WatchlistToken::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(WatchlistToken::Id)
                            .big_integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(WatchlistToken::UserId)
                            .char_len(36)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(WatchlistToken::Symbol)
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(WatchlistToken::Exchange)
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(WatchlistToken::DisplayName)
                            .string_len(50)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(WatchlistToken::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(WatchlistToken::SortOrder)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(WatchlistToken::CreatedAt)
                            .timestamp()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(WatchlistToken::UpdatedAt)
                            .timestamp()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_watchlist_user")
                            .from(WatchlistToken::Table, WatchlistToken::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .index(
                        Index::create()
                            .name("idx_watchlist_user_symbol")
                            .col(WatchlistToken::UserId)
                            .col(WatchlistToken::Symbol)
                            .unique(),
                    )
                    .to_owned(),
            )
            .await?;

        // 创建价格提醒表
        manager
            .create_table(
                Table::create()
                    .table(PriceAlert::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(PriceAlert::Id)
                            .big_integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::UserId)
                            .char_len(36)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::Symbol)
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::Exchange)
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::AlertType)
                            .enumeration(
                                PriceAlertType::Type,
                                [
                                    PriceAlertType::PriceAbove,
                                    PriceAlertType::PriceBelow,
                                    PriceAlertType::PercentageChange,
                                    PriceAlertType::VolumeSpike,
                                    PriceAlertType::TechnicalIndicator,
                                ]
                            )
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::TargetValue)
                            .decimal_len(20, 8)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::ComparisonValue)
                            .decimal_len(20, 8)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::Condition)
                            .json()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::IsTriggered)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::TriggeredAt)
                            .timestamp()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::NotificationChannels)
                            .json()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::CreatedAt)
                            .timestamp()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(PriceAlert::UpdatedAt)
                            .timestamp()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_price_alert_user")
                            .from(PriceAlert::Table, PriceAlert::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .index(
                        Index::create()
                            .name("idx_price_alert_user_symbol")
                            .col(PriceAlert::UserId)
                            .col(PriceAlert::Symbol)
                    )
                    .index(
                        Index::create()
                            .name("idx_price_alert_active")
                            .col(PriceAlert::IsActive)
                            .col(PriceAlert::IsTriggered)
                    )
                    .to_owned(),
            )
            .await?;

        // 创建价格历史表（用于存储价格快照）
        manager
            .create_table(
                Table::create()
                    .table(PriceHistory::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(PriceHistory::Id)
                            .big_integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(PriceHistory::Symbol)
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PriceHistory::Exchange)
                            .string_len(20)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PriceHistory::Price)
                            .decimal_len(20, 8)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PriceHistory::Volume)
                            .decimal_len(20, 8)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(PriceHistory::MarketCap)
                            .decimal_len(30, 2)
                            .null(),
                    )
                    .col(
                        ColumnDef::new(PriceHistory::Timestamp)
                            .timestamp()
                            .not_null(),
                    )
                    .index(
                        Index::create()
                            .name("idx_price_history_symbol_time")
                            .col(PriceHistory::Symbol)
                            .col(PriceHistory::Exchange)
                            .col(PriceHistory::Timestamp)
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(PriceHistory::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(PriceAlert::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(WatchlistToken::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum WatchlistToken {
    Table,
    Id,
    UserId,
    Symbol,
    Exchange,
    DisplayName,
    IsActive,
    SortOrder,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum PriceAlert {
    Table,
    Id,
    UserId,
    Symbol,
    Exchange,
    AlertType,
    TargetValue,
    ComparisonValue,
    Condition,
    IsActive,
    IsTriggered,
    TriggeredAt,
    NotificationChannels,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum PriceAlertType {
    Type,
    PriceAbove,
    PriceBelow,
    PercentageChange,
    VolumeSpike,
    TechnicalIndicator,
}

#[derive(DeriveIden)]
enum PriceHistory {
    Table,
    Id,
    Symbol,
    Exchange,
    Price,
    Volume,
    MarketCap,
    Timestamp,
}

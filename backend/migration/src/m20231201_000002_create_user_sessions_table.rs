use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(UserSessions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(UserSessions::Id)
                            .char_len(36)
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(UserSessions::UserId)
                            .char_len(36)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(UserSessions::RefreshToken)
                            .string_len(512)
                            .not_null(),
                    )
                    .col(ColumnDef::new(UserSessions::DeviceInfo).string_len(255))
                    .col(
                        ColumnDef::new(UserSessions::IpAddress)
                            .string_len(45)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(UserSessions::UserAgent)
                            .string_len(512)
                            .not_null(),
                    )
                    .col(ColumnDef::new(UserSessions::Location).string_len(255))
                    .col(
                        ColumnDef::new(UserSessions::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(UserSessions::ExpiresAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(UserSessions::LastAccessedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(UserSessions::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(UserSessions::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_user_sessions_user_id")
                            .from(UserSessions::Table, UserSessions::UserId)
                            .to(super::m20231201_000001_create_users_table::Users::Table, super::m20231201_000001_create_users_table::Users::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 创建索引
        manager
            .create_index(
                Index::create()
                    .name("idx_user_sessions_user_id")
                    .table(UserSessions::Table)
                    .col(UserSessions::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_user_sessions_refresh_token")
                    .table(UserSessions::Table)
                    .col(UserSessions::RefreshToken)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UserSessions::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum UserSessions {
    Table,
    Id,
    UserId,
    RefreshToken,
    DeviceInfo,
    IpAddress,
    UserAgent,
    Location,
    IsActive,
    ExpiresAt,
    LastAccessedAt,
    CreatedAt,
    UpdatedAt,
}

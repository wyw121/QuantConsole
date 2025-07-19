use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(SecurityEvents::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(SecurityEvents::Id)
                            .char_len(36)
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(SecurityEvents::UserId)
                            .char_len(36)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SecurityEvents::EventType)
                            .string_len(50)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SecurityEvents::Description)
                            .string_len(512)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SecurityEvents::IpAddress)
                            .string_len(45)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(SecurityEvents::UserAgent)
                            .string_len(512)
                            .not_null(),
                    )
                    .col(ColumnDef::new(SecurityEvents::Location).string_len(255))
                    .col(
                        ColumnDef::new(SecurityEvents::Severity)
                            .string_len(20)
                            .not_null(),
                    )
                    .col(ColumnDef::new(SecurityEvents::Metadata).text())
                    .col(
                        ColumnDef::new(SecurityEvents::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_security_events_user_id")
                            .from(SecurityEvents::Table, SecurityEvents::UserId)
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
                    .name("idx_security_events_user_id")
                    .table(SecurityEvents::Table)
                    .col(SecurityEvents::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_security_events_event_type")
                    .table(SecurityEvents::Table)
                    .col(SecurityEvents::EventType)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_security_events_created_at")
                    .table(SecurityEvents::Table)
                    .col(SecurityEvents::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(SecurityEvents::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum SecurityEvents {
    Table,
    Id,
    UserId,
    EventType,
    Description,
    IpAddress,
    UserAgent,
    Location,
    Severity,
    Metadata,
    CreatedAt,
}

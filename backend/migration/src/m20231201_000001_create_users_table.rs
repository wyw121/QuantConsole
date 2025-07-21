use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Users::Id)
                            .char_len(36)
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Users::Email)
                            .string_len(255)
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Users::Username)
                            .string_len(50)
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Users::PasswordHash)
                            .string_len(255)
                            .not_null(),
                    )
                    .col(ColumnDef::new(Users::FirstName).string_len(100))
                    .col(ColumnDef::new(Users::LastName).string_len(100))
                    .col(ColumnDef::new(Users::Avatar).string_len(255))
                    .col(
                        ColumnDef::new(Users::IsEmailVerified)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(
                        ColumnDef::new(Users::IsTwoFactorEnabled)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(ColumnDef::new(Users::TwoFactorSecret).string_len(255))
                    .col(
                        ColumnDef::new(Users::Role)
                            .string_len(20)
                            .not_null()
                            .default("user"),
                    )
                    .col(
                        ColumnDef::new(Users::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(ColumnDef::new(Users::EmailVerificationToken).string_len(255))
                    .col(
                        ColumnDef::new(Users::EmailVerificationExpiresAt)
                            .timestamp_with_time_zone(),
                    )
                    .col(ColumnDef::new(Users::PasswordResetToken).string_len(255))
                    .col(ColumnDef::new(Users::PasswordResetExpiresAt).timestamp_with_time_zone())
                    .col(ColumnDef::new(Users::LastLoginAt).timestamp_with_time_zone())
                    .col(ColumnDef::new(Users::LastLoginIp).string_len(45))
                    .col(
                        ColumnDef::new(Users::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Users::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;

        // 创建索引
        manager
            .create_index(
                Index::create()
                    .name("idx_users_email")
                    .table(Users::Table)
                    .col(Users::Email)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_users_username")
                    .table(Users::Table)
                    .col(Users::Username)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Users {
    Table,
    Id,
    Email,
    Username,
    PasswordHash,
    FirstName,
    LastName,
    Avatar,
    IsEmailVerified,
    IsTwoFactorEnabled,
    TwoFactorSecret,
    Role,
    IsActive,
    EmailVerificationToken,
    EmailVerificationExpiresAt,
    PasswordResetToken,
    PasswordResetExpiresAt,
    LastLoginAt,
    LastLoginIp,
    CreatedAt,
    UpdatedAt,
}

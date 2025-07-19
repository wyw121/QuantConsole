use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub errors: Option<Vec<ApiError>>,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub field: Option<String>,
    pub code: String,
    pub message: String,
}

#[derive(Debug)]
pub enum ErrorCode {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    InternalError,
}

impl ErrorCode {
    pub fn as_str(&self) -> &'static str {
        match self {
            ErrorCode::ValidationError => "VALIDATION_ERROR",
            ErrorCode::AuthenticationError => "AUTHENTICATION_ERROR",
            ErrorCode::AuthorizationError => "AUTHORIZATION_ERROR",
            ErrorCode::NotFoundError => "NOT_FOUND_ERROR",
            ErrorCode::ConflictError => "CONFLICT_ERROR",
            ErrorCode::InternalError => "INTERNAL_ERROR",
        }
    }
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
            errors: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    pub fn error(code: ErrorCode, message: &str) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            message: Some(message.to_string()),
            errors: Some(vec![ApiError {
                field: None,
                code: code.as_str().to_string(),
                message: message.to_string(),
            }]),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    pub fn validation_error(errors: Vec<ApiError>) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            message: Some("验证失败".to_string()),
            errors: Some(errors),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
}

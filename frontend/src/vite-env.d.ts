// Vite 类型声明
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production'
  readonly VITE_ENABLE_2FA: string
  readonly VITE_ENABLE_SOCIAL_LOGIN: string
  readonly VITE_ENABLE_EMAIL_VERIFICATION: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_API_TIMEOUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

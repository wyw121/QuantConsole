// 用户相关类型定义
export * from "./trading";

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  security: SecuritySettings;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "zh-CN" | "en-US";
  timezone: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  trading: boolean;
  security: boolean;
  marketing: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  ipWhitelist: string[];
  sessionTimeout: number;
}

// 认证相关类型定义

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  firstName?: string;
  lastName?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TwoFactorSetupResponse {
  qrCodeUrl: string;
  secretKey: string;
  backupCodes: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// API 响应类型定义

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  timestamp: string;
}

export interface ApiError {
  field?: string;
  code: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 表单验证类型定义

export interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

export interface LoginForm {
  email: FormField;
  password: FormField;
  rememberMe: boolean;
  twoFactorCode?: FormField;
}

export interface RegisterForm {
  email: FormField;
  password: FormField;
  confirmPassword: FormField;
  username: FormField;
  firstName: FormField;
  lastName: FormField;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

// 验证规则类型定义

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean | string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

// 加载状态类型定义

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

export interface AsyncState<T = any> extends LoadingState {
  data?: T;
}

// 会话相关类型定义

export interface Session {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  lastAccessAt: string;
}

export interface DeviceInfo {
  type: "desktop" | "mobile" | "tablet";
  os: string;
  browser: string;
  location?: string;
}

// 安全事件类型定义

export interface SecurityEvent {
  id: string;
  type:
    | "login"
    | "logout"
    | "password_change"
    | "two_factor_setup"
    | "suspicious_activity";
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
}

// 通知类型定义

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  isRead?: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  style?: "primary" | "secondary" | "danger";
}

// 主题相关类型定义

export interface Theme {
  mode: "light" | "dark";
  primary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

// 环境配置类型定义

export interface AppConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  appName: string;
  version: string;
  environment: "development" | "staging" | "production";
  features: {
    twoFactorAuth: boolean;
    socialLogin: boolean;
    emailVerification: boolean;
  };
}

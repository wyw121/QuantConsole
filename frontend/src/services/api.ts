import type {
  ApiResponse,
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  PasswordResetConfirm,
  PasswordResetRequest,
  RegisterRequest,
  TwoFactorSetupResponse,
  User,
} from "@/types";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

// 创建 Axios 实例
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => response,
    async (error: AxiosError<ApiResponse>) => {
      const { response } = error;

      // 处理 401 错误（未授权）
      if (response?.status === 401) {
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken && !error.config?.url?.includes("/auth/refresh")) {
          try {
            const refreshResponse = await client.post("/auth/refresh", {
              refreshToken,
            });

            const { accessToken } = refreshResponse.data.data;
            localStorage.setItem("accessToken", accessToken);

            // 重试原请求
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${accessToken}`;
              return client(error.config);
            }
          } catch (refreshError) {
            // 刷新失败，清除令牌并跳转到登录页
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/auth/login";
          }
        } else {
          // 没有刷新令牌或刷新失败
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/auth/login";
        }
      }

      // 处理其他HTTP错误，提取后端返回的具体错误信息
      if (response?.data?.message) {
        const apiError = new Error(response.data.message);
        apiError.name = "ApiError";
        return Promise.reject(apiError);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// API 响应处理器
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data as T;
  } else {
    throw new Error(response.data.message || "请求失败");
  }
};

// 认证 API
export const authApi = {
  // 登录
  async login(data: LoginRequest): Promise<AuthResponse> {
    // 转换字段名以匹配后端
    const loginData = {
      email: data.email,
      password: data.password,
      remember_me: data.rememberMe,
      two_factor_code: data.twoFactorCode,
    };
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/login",
      loginData
    );
    const result = handleApiResponse(response);

    // 转换响应字段名以匹配前端
    return {
      user: {
        ...result.user,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        isEmailVerified: result.user.is_email_verified,
        isTwoFactorEnabled: result.user.is_two_factor_enabled,
        createdAt: result.user.created_at,
        lastLoginAt: result.user.last_login_at,
      },
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresIn: result.expires_in,
    };
  },

  // 注册
  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log("🔍 [Frontend] 开始注册流程");
    console.log("📝 [Frontend] 原始表单数据:", data);

    // 过滤掉后端不需要的字段
    const registerData = {
      email: data.email,
      password: data.password,
      username: data.username,
      first_name: data.firstName,
      last_name: data.lastName,
    };

    console.log("📤 [Frontend] 发送到后端的数据:", registerData);
    console.log(
      "🌐 [Frontend] API 请求 URL:",
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
      }/auth/register`
    );

    try {
      const response = await apiClient.post<ApiResponse<any>>(
        "/auth/register",
        registerData
      );

      console.log("📥 [Frontend] 收到后端响应:", response);
      console.log("📄 [Frontend] 响应状态:", response.status);
      console.log("🎯 [Frontend] 响应数据:", response.data);

      const result = handleApiResponse(response);
      console.log("✅ [Frontend] 处理后的响应数据:", result);

      // 转换响应字段名以匹配前端
      return {
        user: {
          ...result.user,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          isEmailVerified: result.user.is_email_verified,
          isTwoFactorEnabled: result.user.is_two_factor_enabled,
          createdAt: result.user.created_at,
          lastLoginAt: result.user.last_login_at,
        },
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expiresIn: result.expires_in,
      };
    } catch (error) {
      console.error("❌ [Frontend] 注册请求失败:", error);
      if (error instanceof Error) {
        console.error("💥 [Frontend] 错误信息:", error.message);
      }
      throw error;
    }
  },

  // 登出
  async logout(): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>("/auth/logout");
    return handleApiResponse(response);
  },

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>(
      "/auth/refresh",
      {
        refreshToken,
      }
    );
    return handleApiResponse(response);
  },

  // 验证邮箱
  async verifyEmail(token: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/verify-email",
      { token }
    );
    return handleApiResponse(response);
  },

  // 重新发送验证邮件
  async resendVerificationEmail(): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/resend-verification"
    );
    return handleApiResponse(response);
  },

  // 忘记密码
  async forgotPassword(data: PasswordResetRequest): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/forgot-password",
      data
    );
    return handleApiResponse(response);
  },

  // 重置密码
  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/reset-password",
      data
    );
    return handleApiResponse(response);
  },

  // 修改密码
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/change-password",
      data
    );
    return handleApiResponse(response);
  },

  // 启用双因素认证
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const response = await apiClient.post<ApiResponse<TwoFactorSetupResponse>>(
      "/auth/2fa/setup"
    );
    return handleApiResponse(response);
  },

  // 确认双因素认证
  async confirmTwoFactor(code: string): Promise<{ backupCodes: string[] }> {
    const response = await apiClient.post<
      ApiResponse<{ backupCodes: string[] }>
    >("/auth/2fa/confirm", {
      code,
    });
    return handleApiResponse(response);
  },

  // 禁用双因素认证
  async disableTwoFactor(password: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/2fa/disable",
      { password }
    );
    return handleApiResponse(response);
  },

  // 生成新的备份码
  async generateBackupCodes(): Promise<{ backupCodes: string[] }> {
    const response = await apiClient.post<
      ApiResponse<{ backupCodes: string[] }>
    >("/auth/2fa/backup-codes");
    return handleApiResponse(response);
  },
};

// 用户 API
export const userApi = {
  // 获取当前用户信息
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>("/user/me");
    return handleApiResponse(response);
  },

  // 更新用户信息
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      "/user/profile",
      data
    );
    return handleApiResponse(response);
  },

  // 上传头像
  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await apiClient.post<ApiResponse<{ avatar: string }>>(
      "/user/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return handleApiResponse(response);
  },

  // 删除账户
  async deleteAccount(password: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      "/user/account",
      {
        data: { password },
      }
    );
    return handleApiResponse(response);
  },
};

// 健康检查 API
export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string }> {
    const response = await apiClient.get<
      ApiResponse<{ status: string; timestamp: string }>
    >("/health");
    return handleApiResponse(response);
  },
};

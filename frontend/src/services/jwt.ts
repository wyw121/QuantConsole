// JWT Token 增强认证功能
export interface JWTTokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  scope: string[];
}

export interface TokenClaims {
  sub: string; // 用户ID
  email: string;
  username: string;
  role: string;
  sessionId: string;
  deviceId?: string;
  ipAddress?: string;
  iat: number; // 签发时间
  exp: number; // 过期时间
  iss: string; // 签发者
  aud: string; // 受众
}

export class JWTService {
  private readonly accessTokenTTL = 15 * 60; // 15分钟
  private readonly refreshTokenTTL = 7 * 24 * 60 * 60; // 7天
  private readonly issuer = "QuantConsole";
  private readonly audience = "QuantConsole-Client";

  constructor(private secret: string) {}

  /**
   * 生成访问令牌和刷新令牌
   */
  generateTokenPair(
    payload: Omit<TokenClaims, "iat" | "exp" | "iss" | "aud">
  ): JWTTokenInfo {
    const now = Math.floor(Date.now() / 1000);

    const accessClaims: TokenClaims = {
      ...payload,
      iat: now,
      exp: now + this.accessTokenTTL,
      iss: this.issuer,
      aud: this.audience,
    };

    const refreshClaims: TokenClaims = {
      ...payload,
      iat: now,
      exp: now + this.refreshTokenTTL,
      iss: this.issuer,
      aud: this.audience,
    };

    return {
      accessToken: this.signToken(accessClaims),
      refreshToken: this.signToken(refreshClaims),
      expiresIn: this.accessTokenTTL,
      tokenType: "Bearer",
      scope: ["read", "write"],
    };
  }

  /**
   * 验证并解析令牌
   */
  verifyToken(token: string): TokenClaims | null {
    try {
      // 这里应该使用实际的JWT库来验证和解析
      // 现在只是示例实现
      const decoded = this.decodeToken(token);

      if (!decoded || decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  /**
   * 刷新访问令牌
   */
  refreshAccessToken(refreshToken: string): JWTTokenInfo | null {
    const claims = this.verifyToken(refreshToken);

    if (!claims) {
      return null;
    }

    // 生成新的令牌对
    return this.generateTokenPair({
      sub: claims.sub,
      email: claims.email,
      username: claims.username,
      role: claims.role,
      sessionId: claims.sessionId,
      deviceId: claims.deviceId,
      ipAddress: claims.ipAddress,
    });
  }

  /**
   * 检查令牌是否即将过期（在5分钟内）
   */
  isTokenExpiringSoon(token: string): boolean {
    const claims = this.verifyToken(token);
    if (!claims) return true;

    const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 5 * 60;
    return claims.exp < fiveMinutesFromNow;
  }

  /**
   * 获取令牌剩余有效时间（秒）
   */
  getTokenRemainingTime(token: string): number {
    const claims = this.verifyToken(token);
    if (!claims) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, claims.exp - now);
  }

  private signToken(payload: TokenClaims): string {
    // 这里应该使用实际的JWT库来签名
    // 现在只是示例实现
    const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));
    const body = btoa(JSON.stringify(payload));
    const signature = btoa(`${header}.${body}.${this.secret}`);

    return `${header}.${body}.${signature}`;
  }

  private decodeToken(token: string): TokenClaims | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload as TokenClaims;
    } catch {
      return null;
    }
  }
}

// 创建默认JWT服务实例
export const jwtService = new JWTService(
  import.meta.env.VITE_JWT_SECRET || "default-secret-key"
);

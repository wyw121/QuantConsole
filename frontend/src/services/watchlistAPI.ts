import {
  WatchlistToken,
  CreateWatchlistTokenRequest,
  UpdateWatchlistTokenRequest,
  PriceAlert,
  CreatePriceAlertRequest,
  UpdatePriceAlertRequest,
  WatchlistResponse,
  AlertsResponse,
  ApiResponse,
  WatchlistQuery,
  AlertsQuery,
} from "@/types/watchlist";

const API_BASE = "http://127.0.0.1:8080/api/watchlist";

/**
 * 关注代币管理API
 */
export class WatchlistAPI {
  /**
   * 获取用户的关注代币列表
   */
  static async getWatchlistTokens(
    query: WatchlistQuery = {}
  ): Promise<WatchlistResponse> {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.append("page", query.page.toString());
    if (query.perPage !== undefined)
      params.append("per_page", query.perPage.toString());
    if (query.isActive !== undefined)
      params.append("is_active", query.isActive.toString());

    const response = await fetch(
      `${API_BASE}/tokens?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`获取关注列表失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 添加代币到关注列表
   */
  static async createWatchlistToken(
    request: CreateWatchlistTokenRequest
  ): Promise<ApiResponse<WatchlistToken>> {
    const response = await fetch(`${API_BASE}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `添加关注代币失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 更新关注代币
   */
  static async updateWatchlistToken(
    tokenId: number,
    request: UpdateWatchlistTokenRequest
  ): Promise<ApiResponse<WatchlistToken>> {
    const response = await fetch(`${API_BASE}/tokens/${tokenId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `更新关注代币失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 删除关注代币
   */
  static async deleteWatchlistToken(
    tokenId: number
  ): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/tokens/${tokenId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `删除关注代币失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取用户的价格提醒列表
   */
  static async getPriceAlerts(
    query: AlertsQuery = {}
  ): Promise<AlertsResponse> {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.append("page", query.page.toString());
    if (query.perPage !== undefined)
      params.append("per_page", query.perPage.toString());
    if (query.isActive !== undefined)
      params.append("is_active", query.isActive.toString());
    if (query.symbol) params.append("symbol", query.symbol);

    const response = await fetch(
      `${API_BASE}/alerts?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`获取价格提醒失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 创建价格提醒
   */
  static async createPriceAlert(
    request: CreatePriceAlertRequest
  ): Promise<ApiResponse<PriceAlert>> {
    const response = await fetch(`${API_BASE}/alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `创建价格提醒失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 更新价格提醒
   */
  static async updatePriceAlert(
    alertId: number,
    request: UpdatePriceAlertRequest
  ): Promise<ApiResponse<PriceAlert>> {
    const response = await fetch(`${API_BASE}/alerts/${alertId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `更新价格提醒失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 删除价格提醒
   */
  static async deletePriceAlert(alertId: number): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/alerts/${alertId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `删除价格提醒失败: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取认证token
   */
  private static getAuthToken(): string {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) {
      // 临时解决方案：生成一个测试token
      console.warn("⚠️ 未找到认证token，使用测试token");
      return "test-jwt-token-for-development";
    }
    return token;
  }

  /**
   * 批量更新关注代币排序
   */
  static async updateTokensOrder(
    tokenIds: number[]
  ): Promise<ApiResponse<void>> {
    const requests = tokenIds.map((tokenId, index) =>
      this.updateWatchlistToken(tokenId, { sortOrder: index })
    );

    try {
      await Promise.all(requests);
      return { success: true };
    } catch (error) {
      throw new Error(`更新排序失败: ${error}`);
    }
  }

  /**
   * 批量启用/禁用关注代币
   */
  static async toggleTokensStatus(
    tokenIds: number[],
    isActive: boolean
  ): Promise<ApiResponse<void>> {
    const requests = tokenIds.map((tokenId) =>
      this.updateWatchlistToken(tokenId, { isActive })
    );

    try {
      await Promise.all(requests);
      return { success: true };
    } catch (error) {
      throw new Error(`批量更新状态失败: ${error}`);
    }
  }

  /**
   * 批量删除关注代币
   */
  static async deleteTokensBatch(
    tokenIds: number[]
  ): Promise<ApiResponse<void>> {
    const requests = tokenIds.map((tokenId) =>
      this.deleteWatchlistToken(tokenId)
    );

    try {
      await Promise.all(requests);
      return { success: true };
    } catch (error) {
      throw new Error(`批量删除失败: ${error}`);
    }
  }

  /**
   * 批量启用/禁用价格提醒
   */
  static async toggleAlertsStatus(
    alertIds: number[],
    isActive: boolean
  ): Promise<ApiResponse<void>> {
    const requests = alertIds.map((alertId) =>
      this.updatePriceAlert(alertId, { isActive })
    );

    try {
      await Promise.all(requests);
      return { success: true };
    } catch (error) {
      throw new Error(`批量更新提醒状态失败: ${error}`);
    }
  }

  /**
   * 批量删除价格提醒
   */
  static async deleteAlertsBatch(
    alertIds: number[]
  ): Promise<ApiResponse<void>> {
    const requests = alertIds.map((alertId) =>
      this.deletePriceAlert(alertId)
    );

    try {
      await Promise.all(requests);
      return { success: true };
    } catch (error) {
      throw new Error(`批量删除提醒失败: ${error}`);
    }
  }
}

/**
 * WebSocket连接管理
 */
export class WatchlistWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  constructor(private baseUrl: string = "ws://localhost:8080") {}

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem("token");
        const wsUrl = `${this.baseUrl}/ws/watchlist?token=${token}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("📡 Watchlist WebSocket 连接成功");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("解析WebSocket消息失败:", error);
          }
        };

        this.ws.onclose = (event) => {
          console.log("📡 Watchlist WebSocket 连接关闭", event.code);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("📡 Watchlist WebSocket 错误:", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 订阅消息
   */
  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    // 返回取消订阅函数
    return () => {
      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        channelSubscribers.delete(callback);
        if (channelSubscribers.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  /**
   * 发送消息
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(data: any): void {
    const { type } = data;

    // 通知所有相关订阅者
    const channelSubscribers = this.subscribers.get(type);
    if (channelSubscribers) {
      channelSubscribers.forEach((callback) => callback(data));
    }

    // 通知全局订阅者
    const globalSubscribers = this.subscribers.get("*");
    if (globalSubscribers) {
      globalSubscribers.forEach((callback) => callback(data));
    }
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(
          `📡 尝试重连 Watchlist WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        this.connect().catch(() => {
          // 重连失败，继续尝试
        });
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    } else {
      console.error("📡 Watchlist WebSocket 重连失败，已达到最大重试次数");
    }
  }

  /**
   * 获取连接状态
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 是否已连接
   */
  get isConnected(): boolean {
    return this.readyState === WebSocket.OPEN;
  }
}

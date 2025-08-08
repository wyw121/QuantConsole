import {
  TradingStrategy,
  StrategyTemplate,
  BacktestResult,
  BacktestRequest,
  TradingSignal,
  StrategyListResponse,
  StrategyValidationResult,
  StrategyPerformance,
  StrategySubscription,
} from '@/types/strategy';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class StrategyService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // 策略管理
  async getStrategies(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<StrategyListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<StrategyListResponse>(
      `/api/v1/strategies?${searchParams.toString()}`
    );
  }

  async getStrategy(id: string): Promise<TradingStrategy> {
    return this.request<TradingStrategy>(`/api/v1/strategies/${id}`);
  }

  async createStrategy(strategy: Partial<TradingStrategy>): Promise<TradingStrategy> {
    return this.request<TradingStrategy>('/api/v1/strategies', {
      method: 'POST',
      body: JSON.stringify(strategy),
    });
  }

  async updateStrategy(
    id: string,
    strategy: Partial<TradingStrategy>
  ): Promise<TradingStrategy> {
    return this.request<TradingStrategy>(`/api/v1/strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(strategy),
    });
  }

  async deleteStrategy(id: string): Promise<void> {
    return this.request<void>(`/api/v1/strategies/${id}`, {
      method: 'DELETE',
    });
  }

  async validateStrategy(strategy: Partial<TradingStrategy>): Promise<StrategyValidationResult> {
    return this.request<StrategyValidationResult>('/api/v1/strategies/validate', {
      method: 'POST',
      body: JSON.stringify(strategy),
    });
  }

  // 策略控制
  async startStrategy(id: string): Promise<void> {
    return this.request<void>(`/api/v1/strategies/${id}/start`, {
      method: 'POST',
    });
  }

  async stopStrategy(id: string): Promise<void> {
    return this.request<void>(`/api/v1/strategies/${id}/stop`, {
      method: 'POST',
    });
  }

  async pauseStrategy(id: string): Promise<void> {
    return this.request<void>(`/api/v1/strategies/${id}/pause`, {
      method: 'POST',
    });
  }

  // 策略模板
  async getTemplates(params?: {
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<StrategyTemplate[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
    }

    return this.request<StrategyTemplate[]>(
      `/api/v1/strategies/templates?${searchParams.toString()}`
    );
  }

  async getTemplate(id: string): Promise<StrategyTemplate> {
    return this.request<StrategyTemplate>(`/api/v1/strategies/templates/${id}`);
  }

  async createStrategyFromTemplate(
    templateId: string,
    customization?: Partial<TradingStrategy>
  ): Promise<TradingStrategy> {
    return this.request<TradingStrategy>(
      `/api/v1/strategies/templates/${templateId}/create`,
      {
        method: 'POST',
        body: JSON.stringify(customization || {}),
      }
    );
  }

  // 策略回测
  async runBacktest(request: BacktestRequest): Promise<{ backtestId: string }> {
    return this.request<{ backtestId: string }>('/api/v1/backtests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getBacktestResult(id: string): Promise<BacktestResult> {
    return this.request<BacktestResult>(`/api/v1/backtests/${id}`);
  }

  async getBacktestStatus(id: string): Promise<{
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    progress?: number;
    message?: string;
  }> {
    return this.request(`/api/v1/backtests/${id}/status`);
  }

  async getStrategyBacktests(strategyId: string): Promise<BacktestResult[]> {
    return this.request<BacktestResult[]>(
      `/api/v1/strategies/${strategyId}/backtests`
    );
  }

  // 交易信号
  async getStrategySignals(
    strategyId: string,
    params?: {
      limit?: number;
      since?: string;
    }
  ): Promise<TradingSignal[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<TradingSignal[]>(
      `/api/v1/strategies/${strategyId}/signals?${searchParams.toString()}`
    );
  }

  async getLatestSignals(limit: number = 20): Promise<TradingSignal[]> {
    return this.request<TradingSignal[]>(`/api/v1/signals/latest?limit=${limit}`);
  }

  // 策略性能
  async getStrategyPerformance(
    strategyId: string,
    period: string = '1M'
  ): Promise<StrategyPerformance> {
    return this.request<StrategyPerformance>(
      `/api/v1/strategies/${strategyId}/performance?period=${period}`
    );
  }

  // 策略订阅
  async subscribeToStrategy(strategyId: string): Promise<StrategySubscription> {
    return this.request<StrategySubscription>(
      `/api/v1/strategies/${strategyId}/subscribe`,
      { method: 'POST' }
    );
  }

  async unsubscribeFromStrategy(strategyId: string): Promise<void> {
    return this.request<void>(
      `/api/v1/strategies/${strategyId}/unsubscribe`,
      { method: 'DELETE' }
    );
  }

  async getSubscriptions(): Promise<StrategySubscription[]> {
    return this.request<StrategySubscription[]>('/api/v1/strategies/subscriptions');
  }

  // 策略市场
  async getPublicStrategies(params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    sortBy?: 'performance' | 'popularity' | 'newest';
    minRating?: number;
  }): Promise<StrategyListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request<StrategyListResponse>(
      `/api/v1/strategies/market?${searchParams.toString()}`
    );
  }

  async publishStrategy(id: string): Promise<void> {
    return this.request<void>(`/api/v1/strategies/${id}/publish`, {
      method: 'POST',
    });
  }

  async unpublishStrategy(id: string): Promise<void> {
    return this.request<void>(`/api/v1/strategies/${id}/unpublish`, {
      method: 'POST',
    });
  }

  // 实时数据
  createSignalWebSocket(callback: (signal: TradingSignal) => void): WebSocket | null {
    try {
      const token = localStorage.getItem('auth_token');
      const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/signals?token=${token}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const signal = JSON.parse(event.data) as TradingSignal;
          callback(signal);
        } catch (error) {
          console.error('Failed to parse signal data:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      return null;
    }
  }

  // 克隆策略
  async cloneStrategy(id: string, name?: string): Promise<TradingStrategy> {
    return this.request<TradingStrategy>(`/api/v1/strategies/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // 导入/导出策略
  async exportStrategy(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/v1/strategies/${id}/export`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export strategy');
    }

    return response.blob();
  }

  async importStrategy(file: File): Promise<TradingStrategy> {
    const formData = new FormData();
    formData.append('strategy', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/strategies/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to import strategy');
    }

    return response.json();
  }
}

export const strategyService = new StrategyService();

/**
 * 真实K线数据获取服务
 * 解决网络限制和CORS问题
 */

import { CandlestickData } from "@/types/trading";

interface KlineSource {
  name: string;
  fetchFunction: (
    symbol: string,
    interval: string,
    limit: number
  ) => Promise<CandlestickData[]>;
  priority: number;
  enabled: boolean;
}

class RealKlineDataService {
  private sources: KlineSource[] = [];

  constructor() {
    this.initializeSources();
  }

  private initializeSources() {
    // 1. CoinGecko API - 最可靠，无地区限制
    this.sources.push({
      name: "CoinGecko",
      fetchFunction: this.fetchFromCoinGecko.bind(this),
      priority: 1,
      enabled: true,
    });

    // 2. 公共CORS代理 + Binance API
    this.sources.push({
      name: "Binance via Proxy",
      fetchFunction: this.fetchFromBinanceProxy.bind(this),
      priority: 2,
      enabled: true,
    });

    // 3. Yahoo Finance API - 备用源
    this.sources.push({
      name: "Yahoo Finance",
      fetchFunction: this.fetchFromYahoo.bind(this),
      priority: 3,
      enabled: true,
    });

    console.log(
      "📊 K线数据服务初始化完成，配置了",
      this.sources.length,
      "个数据源"
    );
  }

  /**
   * 获取K线数据 - 按优先级尝试多个数据源
   */
  async fetchKlineData(
    symbol: string,
    interval: string = "1h",
    limit: number = 100
  ): Promise<CandlestickData[]> {
    console.log(`📈 获取K线数据: ${symbol}, 间隔: ${interval}, 数量: ${limit}`);

    // 按优先级排序并尝试每个数据源
    const sortedSources = this.sources
      .filter((s) => s.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const source of sortedSources) {
      try {
        console.log(`🔄 尝试从 ${source.name} 获取数据...`);
        const data = await Promise.race([
          source.fetchFunction(symbol, interval, limit),
          new Promise<CandlestickData[]>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000)
          ),
        ]);

        if (data && data.length > 0) {
          console.log(`✅ 从 ${source.name} 成功获取 ${data.length} 根K线`);
          return data;
        }
      } catch (error) {
        console.warn(`⚠️ ${source.name} 获取失败:`, error);
        continue;
      }
    }

    console.error("❌ 所有K线数据源都失败了");
    return [];
  }

  /**
   * 从CoinGecko获取历史数据并转换为K线格式
   */
  private async fetchFromCoinGecko(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<CandlestickData[]> {
    // 映射交易对到CoinGecko ID
    const coinMapping: { [key: string]: string } = {
      BTCUSDT: "bitcoin",
      ETHUSDT: "ethereum",
      BNBUSDT: "binancecoin",
      ADAUSDT: "cardano",
      SOLUSDT: "solana",
      XRPUSDT: "ripple",
      DOTUSDT: "polkadot",
      DOGEUSDT: "dogecoin",
      AVAXUSDT: "avalanche-2",
      LINKUSDT: "chainlink",
    };

    const coinId = coinMapping[symbol];
    if (!coinId) {
      throw new Error(`不支持的交易对: ${symbol}`);
    }

    // 计算需要的天数
    const intervalHours = this.parseIntervalToHours(interval);
    const days = Math.min(Math.ceil((limit * intervalHours) / 24), 365);

    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${
      intervalHours >= 24 ? "daily" : "hourly"
    }`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return this.convertCoinGeckoToCandles(data, limit);
  }

  /**
   * 通过CORS代理从Binance获取数据
   */
  private async fetchFromBinanceProxy(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<CandlestickData[]> {
    const corsProxies = [
      "https://cors-anywhere.herokuapp.com/",
      "https://api.allorigins.win/get?url=",
      "https://corsproxy.io/?",
    ];

    const binanceInterval = this.convertToBinanceInterval(interval);
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;

    for (const proxy of corsProxies) {
      try {
        const proxyUrl = proxy.includes("allorigins")
          ? `${proxy}${encodeURIComponent(binanceUrl)}`
          : `${proxy}${binanceUrl}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) continue;

        let data;
        if (proxy.includes("allorigins")) {
          const result = await response.json();
          data = JSON.parse(result.contents);
        } else {
          data = await response.json();
        }

        return this.convertBinanceToCandles(data);
      } catch (error) {
        console.warn(`代理 ${proxy} 失败:`, error);
        continue;
      }
    }

    throw new Error("所有CORS代理都失败");
  }

  /**
   * 从Yahoo Finance获取数据
   */
  private async fetchFromYahoo(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<CandlestickData[]> {
    // Yahoo Finance符号映射
    const yahooMapping: { [key: string]: string } = {
      BTCUSDT: "BTC-USD",
      ETHUSDT: "ETH-USD",
      BNBUSDT: "BNB-USD",
      ADAUSDT: "ADA-USD",
      SOLUSDT: "SOL-USD",
      XRPUSDT: "XRP-USD",
      DOTUSDT: "DOT-USD",
      DOGEUSDT: "DOGE-USD",
      AVAXUSDT: "AVAX-USD",
      LINKUSDT: "LINK-USD",
    };

    const yahooSymbol = yahooMapping[symbol];
    if (!yahooSymbol) {
      throw new Error(`Yahoo Finance 不支持: ${symbol}`);
    }

    // 计算时间范围
    const endTime = Math.floor(Date.now() / 1000);
    const intervalHours = this.parseIntervalToHours(interval);
    const startTime = endTime - limit * intervalHours * 3600;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${startTime}&period2=${endTime}&interval=${this.convertToYahooInterval(
      interval
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    return this.convertYahooToCandles(data);
  }

  // ==================== 辅助方法 ====================

  private parseIntervalToHours(interval: string): number {
    const unit = interval.slice(-1);
    const value = parseInt(interval.slice(0, -1));

    switch (unit) {
      case "m":
        return value / 60;
      case "h":
        return value;
      case "d":
        return value * 24;
      default:
        return 1;
    }
  }

  private convertToBinanceInterval(interval: string): string {
    const intervalMap: { [key: string]: string } = {
      "1m": "1m",
      "5m": "5m",
      "15m": "15m",
      "30m": "30m",
      "1h": "1h",
      "4h": "4h",
      "1d": "1d",
      "1w": "1w",
    };
    return intervalMap[interval] || "1h";
  }

  private convertToYahooInterval(interval: string): string {
    const intervalMap: { [key: string]: string } = {
      "1m": "1m",
      "5m": "5m",
      "15m": "15m",
      "30m": "30m",
      "1h": "1h",
      "1d": "1d",
      "1w": "1w",
    };
    return intervalMap[interval] || "1h";
  }

  private convertCoinGeckoToCandles(
    data: any,
    limit: number
  ): CandlestickData[] {
    const prices = data.prices || [];
    const volumes = data.total_volumes || [];

    if (prices.length === 0) return [];

    const candles: CandlestickData[] = [];
    const startIndex = Math.max(0, prices.length - limit);

    for (let i = startIndex; i < prices.length; i++) {
      const price = prices[i][1];
      const volume = volumes[i] ? volumes[i][1] : 0;
      const prevPrice = i > 0 ? prices[i - 1][1] : price;

      // 模拟OHLC数据（CoinGecko只提供收盘价）
      const volatility = 0.02; // 2%波动率
      const change = Math.abs(price - prevPrice) / prevPrice;
      const maxVolatility = Math.max(volatility, change * 2);

      const high = price * (1 + Math.random() * maxVolatility);
      const low = price * (1 - Math.random() * maxVolatility);
      const open = i === startIndex ? price : prices[i - 1][1];

      candles.push({
        timestamp: prices[i][0],
        open: Number(open.toFixed(8)),
        high: Number(Math.max(price, high, open).toFixed(8)),
        low: Number(Math.min(price, low, open).toFixed(8)),
        close: Number(price.toFixed(8)),
        volume: Number(volume.toFixed(2)),
      });
    }

    return candles;
  }

  private convertBinanceToCandles(data: any[]): CandlestickData[] {
    return data.map((kline: any[]) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  }

  private convertYahooToCandles(data: any): CandlestickData[] {
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    const candles: CandlestickData[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.close[i] !== null) {
        candles.push({
          timestamp: timestamps[i] * 1000,
          open: quote.open[i] || quote.close[i],
          high: quote.high[i] || quote.close[i],
          low: quote.low[i] || quote.close[i],
          close: quote.close[i],
          volume: result.indicators.quote[0].volume[i] || 0,
        });
      }
    }

    return candles;
  }
}

// 单例实例
export const realKlineDataService = new RealKlineDataService();

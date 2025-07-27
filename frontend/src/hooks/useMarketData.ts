import { marketDataService } from "@/services/unifiedMarketData";
import { CandlestickData, OrderBook, PriceData } from "@/types/trading";
import { useCallback, useEffect, useState } from "react";

export const useMarketData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [candlestickData, setCandlestickData] = useState<
    Map<string, CandlestickData[]>
  >(new Map());
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentDataSource, setCurrentDataSource] = useState<string>("");

  // 重置所有数据状态
  const resetAllData = useCallback(() => {
    console.log("🔄 重置市场数据状态...");
    setPriceData([]);
    setCandlestickData(new Map());
    setOrderBook(null);
    setConnectionError(null);
  }, []);

  // 连接到市场数据服务
  const connect = useCallback(async () => {
    try {
      setConnectionError(null);

      // 检查数据源是否发生变化
      const newDataSource = marketDataService.getCurrentDataSource();
      if (newDataSource !== currentDataSource) {
        console.log(`📊 数据源变化: ${currentDataSource} → ${newDataSource}`);
        setCurrentDataSource(newDataSource);
        // 数据源变化时重置所有数据
        resetAllData();
      }

      const connected = await marketDataService.connect();
      setIsConnected(connected);

      if (connected) {
        // 获取初始数据
        const initialPrices = marketDataService.getPriceData();
        setPriceData(initialPrices);

        // 为每个交易对生成历史K线数据
        const pairs = marketDataService.getTradingPairs();
        const candleMap = new Map();

        // 使用Promise.all来并行获取所有历史数据
        const candlePromises = pairs.map(async (pair) => {
          try {
            const candles = await marketDataService.generateHistoricalCandles(
              pair.symbol
            );
            return { symbol: pair.symbol, candles };
          } catch (error) {
            console.error(`获取 ${pair.symbol} 历史数据失败:`, error);
            return { symbol: pair.symbol, candles: [] };
          }
        });

        const candleResults = await Promise.all(candlePromises);
        candleResults.forEach(({ symbol, candles }) => {
          candleMap.set(symbol, candles);
        });

        setCandlestickData(candleMap);
      }
    } catch (error) {
      console.error("连接市场数据失败:", error);
      setConnectionError("连接市场数据失败");
      setIsConnected(false);
    }
  }, [currentDataSource, resetAllData]);

  // 断开连接
  const disconnect = useCallback(() => {
    console.log("🔌 断开市场数据连接...");
    marketDataService.disconnect();
    setIsConnected(false);
    setConnectionError(null);
    // 断开连接时清理数据
    resetAllData();
  }, [resetAllData]);

  // 订阅价格数据
  useEffect(() => {
    if (!isConnected) return;

    console.log("📊 订阅价格数据更新...");

    const handlePriceUpdate = (data: PriceData) => {
      setPriceData((prev) => {
        const index = prev.findIndex((p) => p.symbol === data.symbol);
        if (index >= 0) {
          const newData = [...prev];
          newData[index] = data;
          return newData;
        }
        return [...prev, data];
      });
    };

    marketDataService.subscribe("price", handlePriceUpdate);

    return () => {
      console.log("📊 取消订阅价格数据更新...");
      marketDataService.unsubscribe("price", handlePriceUpdate);
    };
  }, [isConnected, currentDataSource]); // 添加 currentDataSource 依赖

  // 订阅K线数据
  useEffect(() => {
    if (!isConnected) return;

    console.log("📈 订阅K线数据更新...");

    const handleCandleUpdate = (data: {
      symbol: string;
      data: CandlestickData;
    }) => {
      setCandlestickData((prev) => {
        const symbolCandles = prev.get(data.symbol) || [];
        const newCandles = [...symbolCandles, data.data].slice(-100); // 保持最近100根K线
        const newMap = new Map(prev);
        newMap.set(data.symbol, newCandles);
        return newMap;
      });
    };

    marketDataService.subscribe("candle", handleCandleUpdate);

    return () => {
      console.log("📈 取消订阅K线数据更新...");
      marketDataService.unsubscribe("candle", handleCandleUpdate);
    };
  }, [isConnected, currentDataSource]); // 添加 currentDataSource 依赖

  // 订阅订单簿数据
  useEffect(() => {
    if (!isConnected || !selectedSymbol) return;

    console.log(`📋 订阅 ${selectedSymbol} 订单簿数据更新...`);

    const handleOrderBookUpdate = (data: OrderBook) => {
      if (data.symbol === selectedSymbol) {
        setOrderBook(data);
      }
    };

    marketDataService.subscribe("orderbook", handleOrderBookUpdate);

    return () => {
      console.log(`📋 取消订阅 ${selectedSymbol} 订单簿数据更新...`);
      marketDataService.unsubscribe("orderbook", handleOrderBookUpdate);
    };
  }, [isConnected, selectedSymbol, currentDataSource]); // 添加 currentDataSource 依赖

  // 获取指定交易对的价格数据
  const getPriceBySymbol = useCallback(
    (symbol: string) => {
      return priceData.find((p) => p.symbol === symbol);
    },
    [priceData]
  );

  // 获取指定交易对的K线数据
  const getCandlesBySymbol = useCallback(
    (symbol: string) => {
      return candlestickData.get(symbol) || [];
    },
    [candlestickData]
  );

  // 选择交易对
  const selectSymbol = useCallback(async (symbol: string) => {
    setSelectedSymbol(symbol);
    // 清除之前的订单簿数据
    setOrderBook(null);

    // 尝试获取选中交易对的订单簿数据
    try {
      const orderBookData = await marketDataService.fetchOrderBook(symbol);
      if (orderBookData) {
        setOrderBook(orderBookData);
      }
    } catch (error) {
      console.error(`获取 ${symbol} 订单簿失败:`, error);
    }
  }, []);

  return {
    // 状态
    isConnected,
    connectionError,
    priceData,
    selectedSymbol,
    orderBook,

    // 数据获取方法
    getPriceBySymbol,
    getCandlesBySymbol,

    // 控制方法
    connect,
    disconnect,
    selectSymbol,

    // 辅助数据
    tradingPairs: marketDataService.getTradingPairs(),
  };
};

// 用于管理交易对选择的 Hook
export const useTradingPairs = () => {
  const [favorites, setFavorites] = useState<string[]>([
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"volume" | "change" | "name">("volume");

  const addToFavorites = useCallback((symbol: string) => {
    setFavorites((prev) => {
      if (!prev.includes(symbol)) {
        return [...prev, symbol];
      }
      return prev;
    });
  }, []);

  const removeFromFavorites = useCallback((symbol: string) => {
    setFavorites((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const isFavorite = useCallback(
    (symbol: string) => {
      return favorites.includes(symbol);
    },
    [favorites]
  );

  const filterAndSortPairs = useCallback(
    (pairs: PriceData[]) => {
      let filtered = pairs;

      // 搜索过滤
      if (searchTerm) {
        filtered = pairs.filter((p) =>
          p.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // 排序
      return filtered.sort((a, b) => {
        switch (sortBy) {
          case "volume":
            return b.volume24h - a.volume24h;
          case "change":
            return (
              Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent)
            );
          case "name":
            return a.symbol.localeCompare(b.symbol);
          default:
            return 0;
        }
      });
    },
    [searchTerm, sortBy]
  );

  return {
    favorites,
    searchTerm,
    sortBy,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    setSearchTerm,
    setSortBy,
    filterAndSortPairs,
  };
};

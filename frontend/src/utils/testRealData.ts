/**
 * 测试真实市场数据连接
 * 可以在浏览器控制台中运行这段代码来测试连接
 */

async function testRealMarketData() {
  console.log("🧪 开始测试真实市场数据连接...");

  try {
    // 测试 Binance 24h Ticker API
    console.log("📊 测试 24h Ticker API...");
    const tickerResponse = await fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
    );

    if (tickerResponse.ok) {
      const tickerData = await tickerResponse.json();
      console.log("✅ 24h Ticker API 测试成功:");
      console.log(
        `  BTC/USDT 价格: $${parseFloat(tickerData.lastPrice).toFixed(2)}`
      );
      console.log(
        `  24h 涨跌: ${parseFloat(tickerData.priceChangePercent).toFixed(2)}%`
      );
      console.log(
        `  24h 成交量: ${(parseFloat(tickerData.volume) / 1000).toFixed(
          1
        )}K BTC`
      );
    } else {
      console.error("❌ 24h Ticker API 测试失败:", tickerResponse.status);
    }

    // 测试 K线数据 API
    console.log("\n📈 测试 K线数据 API...");
    const klineResponse = await fetch(
      "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=5"
    );

    if (klineResponse.ok) {
      const klineData = await klineResponse.json();
      console.log("✅ K线数据 API 测试成功:");
      console.log(`  获取到 ${klineData.length} 根K线`);

      const latestKline = klineData[klineData.length - 1];
      console.log(
        `  最新K线: 开盘=${parseFloat(latestKline[1]).toFixed(
          2
        )}, 收盘=${parseFloat(latestKline[4]).toFixed(2)}`
      );
    } else {
      console.error("❌ K线数据 API 测试失败:", klineResponse.status);
    }

    // 测试订单簿 API
    console.log("\n📚 测试订单簿 API...");
    const depthResponse = await fetch(
      "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=5"
    );

    if (depthResponse.ok) {
      const depthData = await depthResponse.json();
      console.log("✅ 订单簿 API 测试成功:");
      console.log(`  买盘深度: ${depthData.bids.length} 档`);
      console.log(`  卖盘深度: ${depthData.asks.length} 档`);

      if (depthData.bids.length > 0 && depthData.asks.length > 0) {
        const bestBid = parseFloat(depthData.bids[0][0]);
        const bestAsk = parseFloat(depthData.asks[0][0]);
        const spread = bestAsk - bestBid;
        console.log(`  最优买价: $${bestBid.toFixed(2)}`);
        console.log(`  最优卖价: $${bestAsk.toFixed(2)}`);
        console.log(`  价差: $${spread.toFixed(2)}`);
      }
    } else {
      console.error("❌ 订单簿 API 测试失败:", depthResponse.status);
    }

    // 测试 WebSocket 连接
    console.log("\n🔌 测试 WebSocket 连接...");
    return new Promise((resolve) => {
      const ws = new WebSocket(
        "wss://stream.binance.com:9443/ws/btcusdt@ticker"
      );

      let messageCount = 0;
      const maxMessages = 3;

      ws.onopen = () => {
        console.log("✅ WebSocket 连接成功");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        messageCount++;

        console.log(`📨 收到第 ${messageCount} 条实时数据:`);
        console.log(`  交易对: ${data.s}`);
        console.log(`  当前价格: $${parseFloat(data.c).toFixed(2)}`);
        console.log(`  24h涨跌: ${parseFloat(data.P).toFixed(2)}%`);

        if (messageCount >= maxMessages) {
          ws.close();
          console.log("✅ WebSocket 测试完成");
          resolve(true);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket 连接错误:", error);
        resolve(false);
      };

      ws.onclose = () => {
        console.log("📴 WebSocket 连接已关闭");
      };

      // 10秒后超时
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        console.log("⏰ WebSocket 测试超时");
        resolve(false);
      }, 10000);
    });
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
    return false;
  }
}

// 如果在浏览器环境中，自动运行测试
if (typeof window !== "undefined") {
  console.log("🌐 检测到浏览器环境，可以运行 testRealMarketData() 来测试连接");
}

// 导出测试函数
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testRealMarketData };
}

// 示例使用:
// testRealMarketData().then(success => {
//   if (success) {
//     console.log("🎉 所有测试通过！真实数据连接正常");
//   } else {
//     console.log("⚠️  部分测试失败，请检查网络连接");
//   }
// });

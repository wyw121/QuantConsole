// 测试永续合约数据源切换
// 这个脚本可以用来验证 OKX 和 Binance 期货 API 是否正常工作

console.log("🔍 测试永续合约数据源...");

// 测试 OKX 永续合约 API
async function testOKXPerpetual() {
  try {
    console.log("\n📊 测试 OKX 永续合约数据...");
    const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SWAP');
    const data = await response.json();

    if (data.code === '0' && data.data) {
      console.log(`✅ OKX 成功获取 ${data.data.length} 个永续合约数据`);
      console.log('📋 前5个合约:');
      data.data.slice(0, 5).forEach(item => {
        console.log(`   ${item.instId}: $${item.last} (24h: ${item.sodUtc0}%)`);
      });
    }
  } catch (error) {
    console.error("❌ OKX 测试失败:", error.message);
  }
}

// 测试 Binance 期货合约 API
async function testBinanceFutures() {
  try {
    console.log("\n📊 测试 Binance 期货合约数据...");
    const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
    const data = await response.json();

    if (Array.isArray(data)) {
      console.log(`✅ Binance 期货成功获取 ${data.length} 个合约数据`);
      console.log('📋 前5个合约:');
      data.slice(0, 5).forEach(item => {
        console.log(`   ${item.symbol}: $${item.lastPrice} (24h: ${item.priceChangePercent}%)`);
      });
    }
  } catch (error) {
    console.error("❌ Binance 期货测试失败:", error.message);
  }
}

// 运行测试
async function runTests() {
  await testOKXPerpetual();
  await testBinanceFutures();
  console.log("\n✅ 永续合约数据源测试完成");
}

runTests();

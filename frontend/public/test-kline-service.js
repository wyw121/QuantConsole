// 简化的K线数据获取测试函数
async function testKlineDataService() {
    console.log('🚀 测试K线数据服务...');

    // 模拟realKlineDataService.ts的逻辑
    const fetchKlineData = async (symbol, interval, limit) => {
        const sources = [
            {
                name: 'CoinGecko',
                fetch: fetchFromCoinGecko,
            },
            {
                name: 'Yahoo Finance',
                fetch: fetchFromYahoo,
            },
            {
                name: 'Binance (Proxy)',
                fetch: fetchFromBinanceProxy,
            }
        ];

        for (const source of sources) {
            try {
                console.log(`🔄 尝试数据源: ${source.name}`);
                const data = await source.fetch(symbol, interval, limit);
                console.log(`✅ 成功从 ${source.name} 获取数据:`, data.slice(0, 2));
                return { success: true, data, source: source.name };
            } catch (error) {
                console.warn(`❌ ${source.name} 失败:`, error.message);
            }
        }

        throw new Error('所有数据源都失败了');
    };

    // CoinGecko 数据获取
    async function fetchFromCoinGecko(symbol, interval, limit) {
        const coinId = symbol.toLowerCase().includes('btc') ? 'bitcoin' : 'ethereum';
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const prices = data.prices || [];

        return prices.map(([timestamp, price]) => ({
            timestamp,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: 0,
            source: 'coingecko'
        })).slice(-limit);
    }

    // Yahoo Finance 数据获取
    async function fetchFromYahoo(symbol, interval, limit) {
        const yahooSymbol = symbol.toUpperCase().includes('BTC') ? 'BTC-USD' : 'ETH-USD';
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 86400;

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${startTime}&period2=${endTime}&interval=1h`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
            throw new Error('Invalid Yahoo Finance response format');
        }

        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];

        return timestamps.map((ts, i) => ({
            timestamp: ts * 1000,
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i],
            source: 'yahoo'
        })).slice(-limit);
    }

    // Binance 代理数据获取
    async function fetchFromBinanceProxy(symbol, interval, limit) {
        const corsProxies = [
            'https://api.allorigins.win/get?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://corsproxy.io/?'
        ];

        const binanceSymbol = symbol.toUpperCase().replace('-', '');
        const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1h&limit=${limit}`;

        for (const proxy of corsProxies) {
            try {
                const proxyUrl = proxy.includes('allorigins')
                    ? `${proxy}${encodeURIComponent(binanceUrl)}`
                    : `${proxy}${binanceUrl}`;

                const response = await Promise.race([
                    fetch(proxyUrl),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 5000)
                    )
                ]);

                if (!response.ok) continue;

                let rawData;
                if (proxy.includes('allorigins')) {
                    const result = await response.json();
                    rawData = JSON.parse(result.contents);
                } else {
                    rawData = await response.json();
                }

                return rawData.map(kline => ({
                    timestamp: kline[0],
                    open: parseFloat(kline[1]),
                    high: parseFloat(kline[2]),
                    low: parseFloat(kline[3]),
                    close: parseFloat(kline[4]),
                    volume: parseFloat(kline[5]),
                    source: 'binance'
                }));

            } catch (error) {
                console.warn(`代理失败: ${proxy}`, error.message);
            }
        }

        throw new Error('所有Binance代理都失败了');
    }

    // 执行测试
    try {
        const result = await fetchKlineData('BTCUSDT', '1h', 5);
        console.log('🎉 K线数据服务测试成功!');
        console.log('📊 结果:', result);
        return result;
    } catch (error) {
        console.error('❌ K线数据服务测试失败:', error);
        throw error;
    }
}

// 在浏览器控制台中运行测试
if (typeof window !== 'undefined') {
    window.testKlineDataService = testKlineDataService;
    console.log('💡 在浏览器控制台中运行: testKlineDataService()');
}

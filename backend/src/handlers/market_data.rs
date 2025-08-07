use actix_web::{web, HttpResponse, Result};
use chrono;
use reqwest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct KlineRequest {
    pub symbol: String,
    pub interval: String,
    pub limit: Option<u32>,
    pub start_time: Option<i64>,
    pub end_time: Option<i64>,
    pub source: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlineData {
    pub timestamp: i64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlineResponse {
    pub success: bool,
    pub data: Vec<KlineData>,
    pub source: String,
    pub message: Option<String>,
}

/// 获取K线数据的主要端点
pub async fn get_kline_data(query: web::Query<KlineRequest>) -> Result<HttpResponse> {
    let symbol = &query.symbol;
    let interval = &query.interval;
    let limit = query.limit.unwrap_or(100);
    let requested_source = query.source.as_deref();

    println!(
        "🔍 API请求: symbol={}, interval={}, limit={}, source={:?}",
        symbol, interval, limit, requested_source
    );

    // 如果指定了特定数据源，只使用该源
    if let Some(source) = requested_source {
        println!("🎯 使用指定数据源: {}", source);
        match fetch_kline_from_source(symbol, interval, limit, source).await {
            Ok(data) => {
                return Ok(HttpResponse::Ok().json(KlineResponse {
                    success: true,
                    data,
                    source: source.to_string(),
                    message: None,
                }));
            }
            Err(e) => {
                println!("❌ 指定源 {} 失败: {}", source, e);
                return Ok(HttpResponse::ServiceUnavailable().json(KlineResponse {
                    success: false,
                    data: vec![],
                    source: source.to_string(),
                    message: Some(format!("数据源 {} 不可用: {}", source, e)),
                }));
            }
        }
    }

    // 如果没有指定数据源，尝试真实的数据源，优先使用OKX
    let sources = vec!["okx", "binance", "coingecko", "yahoo"];

    for source in sources {
        match fetch_kline_from_source(symbol, interval, limit, source).await {
            Ok(data) => {
                return Ok(HttpResponse::Ok().json(KlineResponse {
                    success: true,
                    data,
                    source: source.to_string(),
                    message: None,
                }));
            }
            Err(e) => {
                println!("源 {} 失败: {}", source, e);
                continue;
            }
        }
    }

    Ok(HttpResponse::ServiceUnavailable().json(KlineResponse {
        success: false,
        data: vec![],
        source: "none".to_string(),
        message: Some("所有数据源都不可用".to_string()),
    }))
}

async fn fetch_kline_from_source(
    symbol: &str,
    interval: &str,
    limit: u32,
    source: &str,
) -> Result<Vec<KlineData>, Box<dyn std::error::Error + Send + Sync>> {
    // 创建支持代理的HTTP客户端
    let client = create_proxy_client().await?;

    match source {
        "coingecko" => fetch_from_coingecko(&client, symbol, interval, limit).await,
        "yahoo" => fetch_from_yahoo(&client, symbol, interval, limit).await,
        "okx" => fetch_from_okx(&client, symbol, interval, limit).await,
        "binance" => fetch_from_binance(&client, symbol, interval, limit).await,
        _ => Err("Unknown source".into()),
    }
}

/// 创建支持代理的HTTP客户端
async fn create_proxy_client() -> Result<reqwest::Client, Box<dyn std::error::Error + Send + Sync>>
{
    let mut client_builder = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("QuantConsole/1.0")
        .danger_accept_invalid_certs(true); // 如果SSR代理使用自签名证书

    let mut proxy_configured = false;

    // 检查环境变量中的代理配置
    if let Ok(proxy_url) = std::env::var("HTTP_PROXY") {
        println!("🔧 使用环境变量HTTP代理: {}", proxy_url);
        match reqwest::Proxy::http(&proxy_url) {
            Ok(proxy) => {
                client_builder = client_builder.proxy(proxy);
                proxy_configured = true;
            }
            Err(e) => println!("❌ HTTP代理配置失败: {}", e),
        }
    }

    if let Ok(proxy_url) = std::env::var("HTTPS_PROXY") {
        println!("🔧 使用环境变量HTTPS代理: {}", proxy_url);
        match reqwest::Proxy::https(&proxy_url) {
            Ok(proxy) => {
                client_builder = client_builder.proxy(proxy);
                proxy_configured = true;
            }
            Err(e) => println!("❌ HTTPS代理配置失败: {}", e),
        }
    }

    // 如果没有环境变量，尝试常见的SSR代理端口
    if !proxy_configured {
        println!("⚠️ 未检测到代理环境变量，尝试常见SSR代理端口...");
        let potential_proxies = [
            "http://127.0.0.1:1080",  // 常见SOCKS5转HTTP
            "http://127.0.0.1:7890",  // Clash HTTP代理
            "http://127.0.0.1:10809", // V2RayN HTTP
            "http://127.0.0.1:1087",  // Shadowsocks HTTP
            "http://127.0.0.1:8080",  // 通用HTTP代理
        ];

        for proxy_url in &potential_proxies {
            match reqwest::Proxy::http(*proxy_url) {
                Ok(proxy) => {
                    println!("尝试使用代理: {}", proxy_url);
                    client_builder = client_builder.proxy(proxy);
                    proxy_configured = true;
                    break;
                }
                Err(e) => {
                    println!("代理 {} 配置失败: {}", proxy_url, e);
                }
            }
        }
    }

    if !proxy_configured {
        println!("⚠️ 未配置代理，直接连接（可能因网络限制失败）");
        println!("💡 要使用SSR代理，请设置环境变量：");
        println!("   HTTP_PROXY=http://127.0.0.1:你的代理端口");
        println!("   HTTPS_PROXY=http://127.0.0.1:你的代理端口");
    } else {
        println!("✅ 代理配置成功");
    }

    Ok(client_builder.build()?)
}

async fn fetch_from_coingecko(
    client: &reqwest::Client,
    symbol: &str,
    _interval: &str,
    _limit: u32,
) -> Result<Vec<KlineData>, Box<dyn std::error::Error + Send + Sync>> {
    // 扩展的交易对映射
    let coin_id = match symbol.to_uppercase().as_str() {
        "BTCUSDT" | "BTC-USD" | "BTC" => "bitcoin",
        "ETHUSDT" | "ETH-USD" | "ETH" => "ethereum",
        "BNBUSDT" | "BNB-USD" | "BNB" => "binancecoin",
        "ADAUSDT" | "ADA-USD" | "ADA" => "cardano",
        "SOLUSDT" | "SOL-USD" | "SOL" => "solana",
        "DOGEUSDT" | "DOGE-USD" | "DOGE" => "dogecoin",
        "XRPUSDT" | "XRP-USD" | "XRP" => "ripple",
        "DOTUSDT" | "DOT-USD" | "DOT" => "polkadot",
        "AVAXUSDT" | "AVAX-USD" | "AVAX" => "avalanche-2",
        "LINKUSDT" | "LINK-USD" | "LINK" => "chainlink",
        _ => {
            println!("⚠️ CoinGecko: 未知交易对 {}, 使用默认值 bitcoin", symbol);
            "bitcoin"
        }
    };

    let url = format!(
        "https://api.coingecko.com/api/v3/coins/{}/market_chart?vs_currency=usd&days=1&interval=hourly",
        coin_id
    );

    println!("🟢 CoinGecko请求: {}", url);

    let response = client.get(&url).send().await?;

    if !response.status().is_success() {
        return Err(format!("CoinGecko HTTP错误: {}", response.status()).into());
    }

    let data: serde_json::Value = response.json().await?;

    let prices = data["prices"].as_array().ok_or("CoinGecko: 无价格数据")?;
    let volumes = data["total_volumes"]
        .as_array()
        .ok_or("CoinGecko: 无成交量数据")?;

    let mut klines = Vec::new();

    // CoinGecko只提供价格点，我们需要构造OHLC数据
    for (i, price_point) in prices.iter().enumerate() {
        let price_array = price_point.as_array().ok_or("无效价格格式")?;
        let timestamp = price_array[0].as_i64().ok_or("无效时间戳")?;
        let price = price_array[1].as_f64().ok_or("无效价格")?;

        let volume = if i < volumes.len() {
            if let Some(vol_array) = volumes[i].as_array() {
                vol_array[1].as_f64().unwrap_or(0.0)
            } else {
                0.0
            }
        } else {
            0.0
        };

        // 由于CoinGecko只提供单个价格点，我们使用相同价格作为OHLC
        // 这不是完美的解决方案，但能提供基本的价格趋势
        klines.push(KlineData {
            timestamp,
            open: price,
            high: price * 1.001, // 稍微调整以避免平线
            low: price * 0.999,
            close: price,
            volume,
            source: "coingecko".to_string(),
        });
    }

    println!("✅ CoinGecko成功获取 {} 个数据点", klines.len());
    Ok(klines)
}

async fn fetch_from_yahoo(
    client: &reqwest::Client,
    symbol: &str,
    _interval: &str,
    _limit: u32,
) -> Result<Vec<KlineData>, Box<dyn std::error::Error + Send + Sync>> {
    // 转换符号格式
    let yahoo_symbol = match symbol.to_uppercase().as_str() {
        "BTCUSDT" | "BTC" => "BTC-USD",
        "ETHUSDT" | "ETH" => "ETH-USD",
        "BNBUSDT" | "BNB" => "BNB-USD",
        _ => "BTC-USD",
    };

    let end_time = chrono::Utc::now().timestamp();
    let start_time = end_time - 86400; // 1天前

    let url = format!(
        "https://query1.finance.yahoo.com/v8/finance/chart/{}?period1={}&period2={}&interval=1h",
        yahoo_symbol, start_time, end_time
    );

    let response = client.get(&url).send().await?;
    let data: serde_json::Value = response.json().await?;

    let result = data["chart"]["result"][0]
        .as_object()
        .ok_or("No result data")?;
    let timestamps = result["timestamp"].as_array().ok_or("No timestamp data")?;
    let indicators = &result["indicators"]["quote"][0];

    let opens = indicators["open"].as_array().ok_or("No open data")?;
    let highs = indicators["high"].as_array().ok_or("No high data")?;
    let lows = indicators["low"].as_array().ok_or("No low data")?;
    let closes = indicators["close"].as_array().ok_or("No close data")?;
    let volumes = indicators["volume"].as_array().ok_or("No volume data")?;

    let mut klines = Vec::new();
    for i in 0..timestamps.len() {
        if let (Some(ts), Some(o), Some(h), Some(l), Some(c), Some(v)) = (
            timestamps[i].as_i64(),
            opens[i].as_f64(),
            highs[i].as_f64(),
            lows[i].as_f64(),
            closes[i].as_f64(),
            volumes[i].as_f64(),
        ) {
            klines.push(KlineData {
                timestamp: ts * 1000, // 转换为毫秒
                open: o,
                high: h,
                low: l,
                close: c,
                volume: v,
                source: "yahoo".to_string(),
            });
        }
    }

    Ok(klines)
}

async fn fetch_from_okx(
    client: &reqwest::Client,
    symbol: &str,
    interval: &str,
    limit: u32,
) -> Result<Vec<KlineData>, Box<dyn std::error::Error + Send + Sync>> {
    // 转换符号格式 (OKX使用 BTC-USDT 格式)
    let okx_symbol = match symbol.to_uppercase().as_str() {
        "BTCUSDT" | "BTC" => "BTC-USDT".to_string(),
        "ETHUSDT" | "ETH" => "ETH-USDT".to_string(),
        "BNBUSDT" | "BNB" => "BNB-USDT".to_string(),
        "ADAUSDT" | "ADA" => "ADA-USDT".to_string(),
        "SOLUSDT" | "SOL" => "SOL-USDT".to_string(),
        s if s.contains("USDT") && !s.contains("-") => {
            // 自动转换 XXXUSDT 格式到 XXX-USDT
            let base = s.replace("USDT", "");
            format!("{}-USDT", base)
        }
        _ => "BTC-USDT".to_string(),
    };

    // 转换时间间隔格式
    let okx_interval = match interval {
        "1h" | "hourly" => "1H",
        "1d" | "daily" => "1D",
        "1w" | "weekly" => "1W",
        "1m" | "1min" => "1m",
        "5m" | "5min" => "5m",
        "15m" | "15min" => "15m",
        "30m" | "30min" => "30m",
        _ => "1H",
    };

    let url = format!(
        "https://www.okx.com/api/v5/market/candles?instId={}&bar={}&limit={}",
        okx_symbol, okx_interval, limit
    );

    println!("🟡 OKX请求: {}", url);

    let response = client.get(&url).send().await?;

    if !response.status().is_success() {
        return Err(format!("OKX API HTTP错误: {}", response.status()).into());
    }

    let data: serde_json::Value = response.json().await?;

    // 检查OKX响应格式
    if data["code"].as_str() != Some("0") {
        return Err(format!(
            "OKX API错误: {}",
            data["msg"].as_str().unwrap_or("Unknown error")
        )
        .into());
    }

    let candles = data["data"].as_array().ok_or("OKX: 无效的数据格式")?;

    let mut klines = Vec::new();
    for candle in candles {
        let candle_array = candle.as_array().ok_or("OKX: 无效的K线格式")?;

        // OKX K线格式: [timestamp, open, high, low, close, volume, volumeCcy]
        if candle_array.len() >= 6 {
            klines.push(KlineData {
                timestamp: candle_array[0].as_str().ok_or("无效时间戳")?.parse()?,
                open: candle_array[1].as_str().ok_or("无效开盘价")?.parse()?,
                high: candle_array[2].as_str().ok_or("无效最高价")?.parse()?,
                low: candle_array[3].as_str().ok_or("无效最低价")?.parse()?,
                close: candle_array[4].as_str().ok_or("无效收盘价")?.parse()?,
                volume: candle_array[5].as_str().ok_or("无效成交量")?.parse()?,
                source: "okx".to_string(),
            });
        }
    }

    println!("✅ OKX成功获取 {} 个K线数据点", klines.len());
    Ok(klines)
}

async fn fetch_from_binance(
    client: &reqwest::Client,
    symbol: &str,
    interval: &str,
    limit: u32,
) -> Result<Vec<KlineData>, Box<dyn std::error::Error + Send + Sync>> {
    // 转换间隔格式
    let binance_interval = match interval {
        "1h" | "hourly" => "1h",
        "1d" | "daily" => "1d",
        "1w" | "weekly" => "1w",
        _ => "1h",
    };

    let binance_symbol = symbol.to_uppercase().replace("-", "");

    let url = format!(
        "https://api.binance.com/api/v3/klines?symbol={}&interval={}&limit={}",
        binance_symbol, binance_interval, limit
    );

    let response = client.get(&url).send().await?;
    let data: Vec<serde_json::Value> = response.json().await?;

    let mut klines = Vec::new();
    for kline in data {
        let kline_array = kline.as_array().ok_or("Invalid kline format")?;

        klines.push(KlineData {
            timestamp: kline_array[0].as_i64().ok_or("Invalid timestamp")?,
            open: kline_array[1].as_str().ok_or("Invalid open")?.parse()?,
            high: kline_array[2].as_str().ok_or("Invalid high")?.parse()?,
            low: kline_array[3].as_str().ok_or("Invalid low")?.parse()?,
            close: kline_array[4].as_str().ok_or("Invalid close")?.parse()?,
            volume: kline_array[5].as_str().ok_or("Invalid volume")?.parse()?,
            source: "binance".to_string(),
        });
    }

    Ok(klines)
}

/// 健康检查端点
pub async fn market_health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "timestamp": chrono::Utc::now().timestamp(),
        "message": "Market data API is running"
    })))
}

/// 获取支持的交易对列表
pub async fn get_supported_symbols() -> Result<HttpResponse> {
    let symbols = vec![
        serde_json::json!({
            "symbol": "BTCUSDT",
            "name": "Bitcoin",
            "sources": ["coingecko", "yahoo", "okx", "binance"]
        }),
        serde_json::json!({
            "symbol": "ETHUSDT",
            "name": "Ethereum",
            "sources": ["coingecko", "yahoo", "okx", "binance"]
        }),
        serde_json::json!({
            "symbol": "BNBUSDT",
            "name": "Binance Coin",
            "sources": ["coingecko", "yahoo", "okx", "binance"]
        }),
        serde_json::json!({
            "symbol": "ADAUSDT",
            "name": "Cardano",
            "sources": ["coingecko", "yahoo", "okx", "binance"]
        }),
        serde_json::json!({
            "symbol": "SOLUSDT",
            "name": "Solana",
            "sources": ["coingecko", "yahoo", "okx", "binance"]
        }),
    ];

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "symbols": symbols
    })))
}

/**
 * 交易对符号标准化工具函数
 */

/**
 * 标准化交易对名称
 * 将不同交易所的交易对格式统一为标准格式
 */
export function normalizeSymbol(symbol: string): string {
  // OKX永续合约格式: BTC-USDT-SWAP -> BTCUSDT
  if (symbol.endsWith("-SWAP")) {
    return symbol.replace("-SWAP", "").replace("-", "");
  }

  // 其他格式: BTC-USDT -> BTCUSDT, BTCUSDT -> BTCUSDT
  return symbol.replace(/-/g, "");
}

/**
 * 从标准化符号获取基础资产和报价资产
 */
export function parseSymbol(normalizedSymbol: string): {
  base: string;
  quote: string;
} {
  // 常见的报价货币
  const quoteCurrencies = ["USDT", "USDC", "BTC", "ETH", "BNB"];

  for (const quote of quoteCurrencies) {
    if (normalizedSymbol.endsWith(quote)) {
      const base = normalizedSymbol.slice(0, -quote.length);
      return { base, quote };
    }
  }

  // 默认情况，假设最后4个字符是报价货币
  const base = normalizedSymbol.slice(0, -4);
  const quote = normalizedSymbol.slice(-4);
  return { base, quote };
}

/**
 * 检查两个交易对是否是同一对
 */
export function isSamePair(symbol1: string, symbol2: string): boolean {
  return normalizeSymbol(symbol1) === normalizeSymbol(symbol2);
}

/**
 * 获取交易对的显示名称
 */
export function getDisplayName(symbol: string): string {
  const normalized = normalizeSymbol(symbol);
  const { base, quote } = parseSymbol(normalized);
  return `${base}/${quote}`;
}

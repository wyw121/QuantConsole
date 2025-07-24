import {
  AlertTriangle,
  Calculator,
  DollarSign,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "./Button";

interface QuickTradePanelProps {
  selectedSymbol: string;
  currentPrice: number;
}

type OrderType = "MARKET" | "LIMIT" | "STOP_LOSS" | "TAKE_PROFIT";
type OrderSide = "BUY" | "SELL";

export const QuickTradePanel: React.FC<QuickTradePanelProps> = ({
  selectedSymbol,
  currentPrice,
}) => {
  const [orderSide, setOrderSide] = useState<OrderSide>("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [percentage, setPercentage] = useState(25);

  // 模拟用户余额数据
  const userBalance = {
    USDT: 10000,
    BTC: 0.5,
    ETH: 2.0,
  };

  const baseAsset = selectedSymbol.replace("USDT", "");
  const availableBalance =
    orderSide === "BUY"
      ? userBalance.USDT
      : userBalance[baseAsset as keyof typeof userBalance] || 0;

  // 计算预估总金额
  const estimatedTotal = useMemo(() => {
    if (!quantity || !currentPrice) return 0;
    const qty = parseFloat(quantity);
    const prc =
      orderType === "MARKET" ? currentPrice : parseFloat(price) || currentPrice;
    return qty * prc;
  }, [quantity, price, currentPrice, orderType]);

  // 百分比快捷按钮
  const percentageButtons = [25, 50, 75, 100];

  const handlePercentageClick = (percent: number) => {
    setPercentage(percent);
    if (orderSide === "BUY" && currentPrice) {
      const totalAmount = (availableBalance * percent) / 100;
      const calculatedQuantity = totalAmount / currentPrice;
      setQuantity(calculatedQuantity.toFixed(6));
    } else if (orderSide === "SELL") {
      const calculatedQuantity = (availableBalance * percent) / 100;
      setQuantity(calculatedQuantity.toFixed(6));
    }
  };

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === "MARKET") {
      setPrice("");
    } else if (type === "LIMIT" && !price) {
      setPrice(currentPrice.toString());
    }
  };

  const handlePlaceOrder = () => {
    // 基本验证
    if (!quantity || parseFloat(quantity) <= 0) {
      alert("请输入有效的交易数量");
      return;
    }

    if (
      (orderType === "LIMIT" ||
        orderType === "STOP_LOSS" ||
        orderType === "TAKE_PROFIT") &&
      (!price || parseFloat(price) <= 0)
    ) {
      alert("请输入有效的价格");
      return;
    }

    if (
      (orderType === "STOP_LOSS" || orderType === "TAKE_PROFIT") &&
      (!stopPrice || parseFloat(stopPrice) <= 0)
    ) {
      alert("请输入有效的触发价格");
      return;
    }

    // 余额检查
    if (orderSide === "BUY" && estimatedTotal > availableBalance) {
      alert("余额不足");
      return;
    }

    if (orderSide === "SELL" && parseFloat(quantity) > availableBalance) {
      alert("持仓不足");
      return;
    }

    // 模拟下单
    const order = {
      symbol: selectedSymbol,
      side: orderSide,
      type: orderType,
      quantity: parseFloat(quantity),
      price: price ? parseFloat(price) : null,
      stopPrice: stopPrice ? parseFloat(stopPrice) : null,
      estimatedTotal,
    };

    console.log("下单请求:", order);
    alert(
      `${
        orderSide === "BUY" ? "买入" : "卖出"
      }订单已提交！\n数量: ${quantity}\n${
        orderType !== "MARKET" ? `价格: ${price}\n` : ""
      }预估金额: $${estimatedTotal.toFixed(2)}`
    );

    // 重置表单
    setQuantity("");
    setPrice(orderType === "LIMIT" ? currentPrice.toString() : "");
    setStopPrice("");
  };

  return (
    <div className="space-y-4">
      {/* 标题和设置 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">快速交易</h3>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* 交易对信息 */}
      <div className="bg-dark-700 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">当前价格</span>
          <div className="text-right">
            <div className="text-white font-mono text-lg">
              ${currentPrice.toFixed(2)}
            </div>
            <div className="text-green-400 text-xs">{selectedSymbol}</div>
          </div>
        </div>
      </div>

      {/* 买卖方向选择 */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={orderSide === "BUY" ? "primary" : "ghost"}
          className={`w-full ${
            orderSide === "BUY"
              ? "bg-green-600 hover:bg-green-700"
              : "border-green-600 text-green-400 hover:bg-green-600/20"
          }`}
          onClick={() => setOrderSide("BUY")}
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          买入
        </Button>
        <Button
          variant={orderSide === "SELL" ? "secondary" : "ghost"}
          className={`w-full ${
            orderSide === "SELL"
              ? "bg-red-600 hover:bg-red-700"
              : "border-red-600 text-red-400 hover:bg-red-600/20"
          }`}
          onClick={() => setOrderSide("SELL")}
        >
          <TrendingDown className="w-4 h-4 mr-1" />
          卖出
        </Button>
      </div>

      {/* 订单类型选择 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">订单类型</label>
        <select
          value={orderType}
          onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-400"
        >
          <option value="MARKET">市价单</option>
          <option value="LIMIT">限价单</option>
          <option value="STOP_LOSS">止损单</option>
          <option value="TAKE_PROFIT">止盈单</option>
        </select>
      </div>

      {/* 价格输入 (限价单、止损单、止盈单) */}
      {(orderType === "LIMIT" ||
        orderType === "STOP_LOSS" ||
        orderType === "TAKE_PROFIT") && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            {orderType === "LIMIT" ? "限价" : "价格"}
          </label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="输入价格"
              step="0.01"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
            />
            <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      {/* 触发价格 (止损单、止盈单) */}
      {(orderType === "STOP_LOSS" || orderType === "TAKE_PROFIT") && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">触发价格</label>
          <div className="relative">
            <input
              type="number"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder="输入触发价格"
              step="0.01"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
            />
            <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      {/* 数量输入 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">数量</label>
        <div className="relative">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={`输入${baseAsset}数量`}
            step="0.000001"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 pr-16 text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
            {baseAsset}
          </span>
        </div>
      </div>

      {/* 百分比快捷按钮 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">快速选择</label>
        <div className="grid grid-cols-4 gap-2">
          {percentageButtons.map((percent) => (
            <Button
              key={percent}
              variant="ghost"
              size="sm"
              className={`text-xs ${
                percentage === percent
                  ? "bg-green-600/20 border-green-400 text-green-400"
                  : "border-dark-600 text-gray-400"
              }`}
              onClick={() => handlePercentageClick(percent)}
            >
              {percent}%
            </Button>
          ))}
        </div>
      </div>

      {/* 余额信息 */}
      <div className="bg-dark-700 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">可用余额:</span>
          <span className="text-white font-mono">
            {orderSide === "BUY"
              ? `$${availableBalance.toFixed(2)} USDT`
              : `${availableBalance.toFixed(6)} ${baseAsset}`}
          </span>
        </div>
        {quantity && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">预估总额:</span>
            <span className="text-white font-mono">
              ${estimatedTotal.toFixed(2)} USDT
            </span>
          </div>
        )}
        {quantity &&
          orderSide === "BUY" &&
          estimatedTotal > availableBalance && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="w-3 h-3 mr-1" />
              余额不足
            </div>
          )}
      </div>

      {/* 下单按钮 */}
      <Button
        variant={orderSide === "BUY" ? "primary" : "secondary"}
        className={`w-full ${
          orderSide === "BUY"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
        onClick={handlePlaceOrder}
        disabled={!quantity || parseFloat(quantity) <= 0}
      >
        <Calculator className="w-4 h-4 mr-2" />
        {orderSide === "BUY" ? "买入" : "卖出"} {baseAsset}
      </Button>
    </div>
  );
};

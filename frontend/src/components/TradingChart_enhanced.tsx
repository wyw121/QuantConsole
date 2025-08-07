import { CandlestickData } from "@/types/trading";
import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import React, { useState } from "react";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TradingChartProps {
  symbol: string;
  data: CandlestickData[];
  height?: number;
  showVolume?: boolean;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  data,
  height = 400,
  showVolume = true,
}) => {
  const [chartType, setChartType] = useState<"line" | "candle">("line");

  // 处理图表数据
  const processedData = React.useMemo(() => {
    if (data.length === 0) return { prices: [], volumes: [], labels: [] };

    const labels = data.map((candle) =>
      new Date(candle.timestamp).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    );

    const prices = data.map((candle) => candle.close);
    const volumes = data.map((candle) => candle.volume);

    return { prices, volumes, labels };
  }, [data]);

  // 价格图表配置
  const priceChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${symbol.replace("USDT", "/USDT")} 价格走势`,
        color: "#fff",
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(30, 30, 30, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#4ade80",
        borderWidth: 1,
        bodyFont: {
          size: 12,
        },
        titleFont: {
          size: 14,
          weight: "bold",
        },
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const candle = data[index];
            if (!candle) return "";
            return new Date(candle.timestamp).toLocaleString("zh-CN");
          },
          label: (context) => {
            const index = context.dataIndex;
            const candle = data[index];
            if (!candle) return "";

            return [
              `收盘价: $${candle.close.toFixed(6)}`,
              `开盘价: $${candle.open.toFixed(6)}`,
              `最高价: $${candle.high.toFixed(6)}`,
              `最低价: $${candle.low.toFixed(6)}`,
              `成交量: ${candle.volume.toLocaleString()}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#9ca3af",
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        position: "right",
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#9ca3af",
          callback: function (value) {
            return `$${Number(value).toFixed(2)}`;
          },
        },
      },
    },
  };

  // 成交量图表配置
  const volumeChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "成交量",
        color: "#fff",
        font: {
          size: 14,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 30, 30, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#6366f1",
        borderWidth: 1,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const candle = data[index];
            if (!candle) return "";
            return new Date(candle.timestamp).toLocaleString("zh-CN");
          },
          label: (context) => {
            return `成交量: ${Number(context.raw).toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#9ca3af",
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        position: "right",
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#9ca3af",
          callback: function (value) {
            return Number(value).toLocaleString();
          },
        },
      },
    },
  };

  // 价格数据集
  const priceChartData: ChartData<"line"> = {
    labels: processedData.labels,
    datasets: [
      {
        label: "价格",
        data: processedData.prices,
        borderColor: "#4ade80",
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#4ade80",
        pointHoverBorderColor: "#fff",
      },
    ],
  };

  // 成交量数据集
  const volumeChartData: ChartData<"bar"> = {
    labels: processedData.labels,
    datasets: [
      {
        label: "成交量",
        data: processedData.volumes,
        backgroundColor: processedData.prices.map((price, index) => {
          if (index === 0) return "rgba(99, 102, 241, 0.7)";
          return price >= processedData.prices[index - 1]
            ? "rgba(74, 222, 128, 0.7)"
            : "rgba(239, 68, 68, 0.7)";
        }),
        borderColor: processedData.prices.map((price, index) => {
          if (index === 0) return "#6366f1";
          return price >= processedData.prices[index - 1]
            ? "#4ade80"
            : "#ef4444";
        }),
        borderWidth: 1,
      },
    ],
  };

  // 数据状态显示
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-dark-900 rounded-lg border border-dark-600"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            📈 正在加载 {symbol.replace("USDT", "/USDT")} K线数据...
          </div>
          <div className="text-sm text-gray-500">
            请等待真实市场数据获取完成
          </div>
        </div>
      </div>
    );
  }

  const latestCandle = data[data.length - 1];
  const priceChange = latestCandle.close - latestCandle.open;
  const priceChangePercent = (priceChange / latestCandle.open) * 100;

  return (
    <div className="space-y-4">
      {/* 图表控制和状态 */}
      <div className="flex items-center justify-between bg-dark-800 px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-white font-medium">
            {symbol.replace("USDT", "/USDT")}
          </span>
          <span className="text-2xl font-bold text-white">
            ${latestCandle.close.toFixed(6)}
          </span>
          <span
            className={`text-sm font-medium ${
              priceChange >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {priceChange >= 0 ? "+" : ""}
            {priceChangePercent.toFixed(2)}%
          </span>
          <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded border border-green-500/30">
            实时数据 • {data.length} 根K线
          </span>
        </div>

        {/* 图表类型切换 */}
        <div className="flex bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              chartType === "line"
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            线图
          </button>
          <button
            onClick={() => setChartType("candle")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              chartType === "candle"
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            蜡烛图
          </button>
        </div>
      </div>

      {/* 价格图表 */}
      <div
        className="bg-dark-900 p-4 rounded-lg border border-dark-600"
        style={{ height: showVolume ? height * 0.7 : height }}
      >
        <Line data={priceChartData} options={priceChartOptions} />
      </div>

      {/* 成交量图表 */}
      {showVolume && (
        <div
          className="bg-dark-900 p-4 rounded-lg border border-dark-600"
          style={{ height: height * 0.3 }}
        >
          <Bar data={volumeChartData} options={volumeChartOptions} />
        </div>
      )}
    </div>
  );
};

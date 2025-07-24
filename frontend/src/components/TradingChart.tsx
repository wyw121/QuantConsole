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
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(30, 30, 30, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#4ade80",
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const candle = data[index];
            if (!candle) return "";

            return [
              `价格: $${candle.close.toFixed(2)}`,
              `开盘: $${candle.open.toFixed(2)}`,
              `最高: $${candle.high.toFixed(2)}`,
              `最低: $${candle.low.toFixed(2)}`,
              `成交量: ${candle.volume.toFixed(2)}`,
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
            return "$" + Number(value).toFixed(2);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
      },
      line: {
        tension: 0.1,
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
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        position: "right",
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#9ca3af",
          maxTicksLimit: 3,
        },
      },
    },
  };

  const priceChartData: ChartData<"line"> = {
    labels: processedData.labels,
    datasets: [
      {
        label: symbol,
        data: processedData.prices,
        borderColor: "#4ade80",
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  const volumeChartData: ChartData<"bar"> = {
    labels: processedData.labels,
    datasets: [
      {
        label: "成交量",
        data: processedData.volumes,
        backgroundColor: "rgba(99, 102, 241, 0.3)",
        borderColor: "rgba(99, 102, 241, 0.8)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-dark-800 rounded-lg p-4">
      {/* 图表头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-white">{symbol}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "line"
                  ? "bg-green-600 text-white"
                  : "bg-dark-700 text-gray-400 hover:text-white"
              }`}
            >
              线图
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "candle"
                  ? "bg-green-600 text-white"
                  : "bg-dark-700 text-gray-400 hover:text-white"
              }`}
            >
              K线
            </button>
          </div>
        </div>

        {/* 当前价格信息 */}
        {data.length > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              ${data[data.length - 1]?.close.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">
              {new Date(data[data.length - 1]?.timestamp).toLocaleString(
                "zh-CN"
              )}
            </div>
          </div>
        )}
      </div>

      {/* 主要价格图表 */}
      <div
        className="relative mb-4"
        style={{ height: showVolume ? height * 0.7 : height }}
      >
        <Line data={priceChartData} options={priceChartOptions} />
      </div>

      {/* 成交量图表 */}
      {showVolume && (
        <div className="relative" style={{ height: height * 0.3 }}>
          <Bar data={volumeChartData} options={volumeChartOptions} />
        </div>
      )}
    </div>
  );
};

// 简化的价格图表组件
interface SimplePriceChartProps {
  data: number[];
  labels: string[];
  positive?: boolean;
  height?: number;
}

export const SimplePriceChart: React.FC<SimplePriceChartProps> = ({
  data,
  labels,
  positive = true,
  height = 60,
}) => {
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.4 },
    },
  };

  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        data,
        borderColor: positive ? "#10b981" : "#ef4444",
        backgroundColor: positive
          ? "rgba(16, 185, 129, 0.1)"
          : "rgba(239, 68, 68, 0.1)",
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

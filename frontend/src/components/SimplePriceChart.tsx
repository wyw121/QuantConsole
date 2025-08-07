import {
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  LineElement,
  LinearScale,
  PointElement,
} from "chart.js";
import React from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

interface SimplePriceChartProps {
  data: number[];
  labels: string[];
  positive: boolean;
  height?: number;
}

export const SimplePriceChart: React.FC<SimplePriceChartProps> = ({
  data,
  labels,
  positive,
  height = 40,
}) => {
  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        data,
        borderColor: positive ? "#4ade80" : "#ef4444",
        backgroundColor: positive
          ? "rgba(74, 222, 128, 0.1)"
          : "rgba(239, 68, 68, 0.1)",
        borderWidth: 1.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
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
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
    interaction: {
      intersect: false,
    },
  };

  return (
    <div style={{ height, width: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

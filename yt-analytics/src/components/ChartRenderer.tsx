"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie, Scatter, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartRendererProps {
  type: "line" | "bar" | "pie" | "scatter" | "doughnut";
  data: any[];
  xAxisLabel: string;
  yAxisLabel: string;
}

export default function ChartRenderer({
  type,
  data,
  xAxisLabel,
  yAxisLabel,
}: ChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No data to display
      </div>
    );
  }

  // Find the actual keys safely, in case the AI generated aliases.
  const keys = Object.keys(data[0]);

  let primaryKey = xAxisLabel;
  let valueKey = yAxisLabel;

  // Fallback if AI-provided keys strictly don't match SQL returned keys
  if (!keys.includes(primaryKey)) primaryKey = keys[0];
  if (!keys.includes(valueKey)) valueKey = keys[1] || keys[0];

  const labels = data.map((d) => String(d[primaryKey]));
  const values = data.map((d) => Number(d[valueKey]));

  const chartData = {
    labels,
    datasets: [
      {
        label: valueKey,
        data: values,
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(16, 185, 129, 0.6)",
          "rgba(245, 158, 11, 0.6)",
          "rgba(239, 68, 68, 0.6)",
          "rgba(139, 92, 246, 0.6)",
          "rgba(236, 72, 153, 0.6)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(236, 72, 153, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const scatterData = {
    datasets: [
      {
        label: `${primaryKey} vs ${valueKey}`,
        data: data.map((d) => ({
          x: Number(d[primaryKey]),
          y: Number(d[valueKey]),
        })),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Query Result: ${valueKey} by ${primaryKey}`,
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      {type === "bar" && <Bar options={options} data={chartData} />}
      {type === "line" && <Line options={options} data={chartData} />}
      {type === "pie" && <Pie options={options} data={chartData} />}
      {type === "doughnut" && <Doughnut options={options} data={chartData} />}
      {type === "scatter" && <Scatter options={options} data={scatterData} />}
    </div>
  );
}

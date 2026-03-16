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
  theme?: 'dark' | 'light';
  disableAnimation?: boolean;
}

export default function ChartRenderer({
  type,
  data,
  xAxisLabel,
  yAxisLabel,
  theme = 'dark',
  disableAnimation = false,
}: ChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No data to display
      </div>
    );
  }

  const isDark = theme === 'dark';
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "#ffffff05" : "#00000008";
  const tooltipBg = isDark ? "#1a162b" : "#ffffff";
  const tooltipText = isDark ? "#ffffff" : "#1e293b";

  const keys = Object.keys(data[0]);

  let primaryKey = xAxisLabel;
  let valueKey = yAxisLabel;

  const isPredictive = keys.includes('Predicted') && keys.includes('Actual') && type === 'line';

  // Fallback if AI-provided keys strictly don't match SQL returned keys
  if (!keys.includes(primaryKey)) primaryKey = keys[0];
  if (!keys.includes(valueKey) && !isPredictive) valueKey = keys[1] || keys[0];

  const labels = data.map((d) => String(d[primaryKey]));

  let datasets = [];

  if (isPredictive) {
    datasets = [
      {
        label: 'Actual Data',
        data: data.map((d) => d.Actual),
        borderColor: '#00d2ff',
        backgroundColor: '#00d2ff22',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#00d2ff',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      },
      {
        label: 'Predicted Data',
        data: data.map((d) => d.Predicted),
        borderColor: '#ff2d95',
        borderDash: [5, 5],
        backgroundColor: '#ff2d9522',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ff2d95',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      }
    ];
  } else {
    const values = data.map((d) => Number(d[valueKey] ?? d['Actual'] ?? d[keys[1]]));
    datasets = [
      {
        label: valueKey,
        data: values,
        backgroundColor: [
          "#ff2d95", // Neon Pink
          "#00d2ff", // Neon Blue
          "#9d50bb", // Neon Purple
          "#33ffcc", // Neon Teal
          "#ffbd39", // Neon Orange
          "#77ff33", // Neon Green
        ].map(color => type === 'bar' ? `${color}dd` : `${color}66`),
        borderColor: type === 'line' ? '#00d2ff' : isDark ? '#ffffff22' : '#00000011',
        borderWidth: type === 'line' ? 3 : 1,
        tension: 0.4,
        fill: type === 'line',
        pointBackgroundColor: '#00d2ff',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      },
    ];
  }

  const chartData = {
    labels,
    datasets,
  };

  const scatterData = {
    datasets: [
      {
        label: `${primaryKey} vs ${valueKey}`,
        data: data.map((d) => ({
          x: Number(d[primaryKey]),
          y: Number(d[valueKey] ?? d['Actual'] ?? d[keys[1]]),
        })),
        backgroundColor: "#ff2d95",
        borderColor: isDark ? "#ffffff44" : "#00000022",
        pointRadius: 6,
      },
    ],
  };

  const options: any = {
    animation: disableAnimation ? false : undefined,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
          font: { weight: 'bold', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: "#00d2ff",
        bodyColor: tooltipText,
        borderColor: isDark ? "#9d50bb33" : "#00000011",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor }
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      {type === "bar" && <Bar options={options} data={chartData} />}
      {type === "line" && <Line options={options} data={chartData} />}
      {type === "pie" && <Pie options={options} data={chartData} />}
      {type === "doughnut" && <Doughnut options={options} data={chartData} />}
      {type === "scatter" && <Scatter options={options} data={scatterData} />}
    </div>
  );
}

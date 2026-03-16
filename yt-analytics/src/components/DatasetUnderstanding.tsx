"use client";

import React from "react";
import { Table, Database, Info, Lightbulb, ArrowRight, CheckCircle2 } from "lucide-react";

interface DatasetSummary {
  rowCount: number;
  columnCount: number;
  columnNames: string[];
}

interface ColumnType {
  name: string;
  type: string;
}

interface DatasetUnderstandingProps {
  summary: DatasetSummary;
  columnTypes: ColumnType[];
  suggestions: string[];
  onFinish: () => void;
  onSelectSuggestion: (q: string) => void;
}

export default function DatasetUnderstanding({
  summary,
  columnTypes,
  suggestions,
  onFinish,
  onSelectSuggestion,
}: DatasetUnderstandingProps) {
  return (
    <div className="max-w-4xl mx-auto h-full overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            Dataset Uploaded Successfully
          </h2>
          <p className="text-slate-400 mt-2">Let&apos;s explore the structure of your data.</p>
        </div>
        <button
          onClick={onFinish}
          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 border border-indigo-500/20">
            <Table className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Rows</h3>
          <p className="text-3xl font-bold text-white">{summary.rowCount.toLocaleString()}</p>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 border border-cyan-500/20">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Columns</h3>
          <p className="text-3xl font-bold text-white">{summary.columnCount}</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/20">
            <Info className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Status</h3>
          <p className="text-xl font-bold text-emerald-400">Ready for Analysis</p>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          Detected Column Types
        </h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Column Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-300">Detected Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {columnTypes.map((col, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-200 font-mono italic">{col.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      col.type === "date" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                      col.type === "numeric" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
                      col.type === "categorical" ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" :
                      col.type === "boolean" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                      "bg-slate-500/10 border-slate-500/30 text-slate-400"
                    }`}>
                      {col.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Suggested Analytics Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(suggestion)}
              className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group flex items-start gap-3"
            >
              <div className="mt-1 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-colors">
                <span className="text-[10px] font-bold text-white opacity-40 group-hover:opacity-100">?</span>
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Table, Database, Info, Lightbulb, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface DatasetSummary {
  rowCount: number;
  columnCount: number;
  columnNames: string[];
}

interface ColumnType {
  name: string;
  type: string;
}

interface DataQuality {
  score: number;
  status: 'good' | 'moderate' | 'critical';
  warnings: { type: string; column?: string; message: string; severity: 'warning' | 'info' | 'critical' }[];
}

interface DatasetUnderstandingProps {
  summary: DatasetSummary;
  columnTypes: ColumnType[];
  suggestions: string[];
  quality?: DataQuality;
  onFinish: () => void;
  onSelectSuggestion: (q: string) => void;
}

export default function DatasetUnderstanding({
  summary,
  columnTypes,
  suggestions,
  quality,
  onFinish,
  onSelectSuggestion,
}: DatasetUnderstandingProps) {
  return (
    <div className="max-w-4xl mx-auto h-full overflow-y-auto p-8 scrollbar-hide">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black text-white flex items-center gap-4 tracking-tight">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#33ffcc] to-[#00d2ff] flex items-center justify-center shadow-lg shadow-teal-500/20">
               <ShieldCheck className="w-7 h-7 text-[#0d0a1a]" />
            </div>
            DATA SOURCE SYNCED
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Neural mapping & quality assessment complete.</p>
        </div>
        <button
          onClick={onFinish}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 group"
        >
          Initialize Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {quality && (
        <div className="mb-12">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#33ffcc] rounded-full" />
            DATA QUALITY REPORT
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Health Score Gauge */}
            <div className="lg:col-span-1 bg-[#1c1a2e]/50 border border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle 
                      cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={364} 
                      strokeDashoffset={364 - (364 * quality.score) / 100}
                      className={`${quality.score > 85 ? 'text-emerald-500' : quality.score > 60 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{quality.score}%</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health</span>
                  </div>
               </div>
               <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                  quality.status === 'good' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                  quality.status === 'moderate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                  'bg-red-500/10 border-red-500/20 text-red-500'
               }`}>
                  {quality.status} Condition
               </div>
            </div>

            {/* Warnings List */}
            <div className="lg:col-span-3 bg-[#1c1a2e]/50 border border-white/5 p-8 rounded-[2rem] overflow-hidden">
               <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Detected Integrity Issues
               </div>
               <div className="space-y-4 max-h-[160px] overflow-y-auto pr-4 scrollbar-hide">
                  {quality.warnings.length > 0 ? quality.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 ${
                          w.severity === 'critical' ? 'text-red-500' : w.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                        }`}>
                          {w.type === 'missing' ? <Zap className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{w.message}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{w.column ? `Column: ${w.column}` : 'Cross-Table Issue'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase ${
                        w.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                        w.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                        'bg-blue-500/10 border-blue-500/20 text-blue-500'
                      }`}>
                         {w.severity}
                      </span>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-emerald-500/30">
                       <CheckCircle2 className="w-12 h-12" />
                       <p className="text-sm font-black uppercase tracking-widest">No structural issues detected</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
          
          {/* Fix Suggestions Bar */}
          {quality.warnings.length > 0 && (
            <div className="mt-6 p-6 bg-indigo-600/5 border border-indigo-600/10 rounded-[1.5rem] flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">AI Data Engineer Recommendations</h4>
                    <p className="text-xs text-indigo-400/70 font-medium">Auto-generated healing suggestions for dataset integrity.</p>
                  </div>
               </div>
               <div className="text-xs font-mono text-slate-500 flex gap-4">
                  {quality.warnings.some(w => w.type === 'missing') && <span>• Impute missing values</span>}
                  {quality.warnings.some(w => w.type === 'duplicate') && <span>• Clean duplicate rows</span>}
                  {quality.warnings.some(w => w.type === 'outlier') && <span>• Sanitize extreme outliers</span>}
               </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#1c1a2e]/50 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Table className="w-16 h-16" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Records</h3>
          <p className="text-4xl font-black text-white">{summary.rowCount.toLocaleString()}</p>
        </div>
        
        <div className="bg-[#1c1a2e]/50 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Database className="w-16 h-16" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Data Points</h3>
          <p className="text-4xl font-black text-[#00d2ff]">{summary.columnCount}</p>
        </div>

        <div className="bg-[#1c1a2e]/50 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Info className="w-16 h-16" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Engine Status</h3>
          <p className="text-2xl font-black text-[#33ffcc]">OPTIMIZED</p>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#9d50bb] rounded-full" />
          ARCHITECTURAL SCHEMA
        </h3>
        <div className="bg-[#1c1a2e]/30 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Property</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Type Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {columnTypes.map((col, idx) => (
                <tr key={idx} className="hover:bg-white/2 transition-colors group">
                  <td className="px-8 py-5 text-sm text-slate-300 font-mono tracking-tight group-hover:text-white">{col.name}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                      col.type === "date" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                      col.type === "numeric" ? "bg-[#00d2ff1a] border-[#00d2ff33] text-[#00d2ff]" :
                      col.type === "categorical" ? "bg-[#9d50bb1a] border-[#9d50bb33] text-[#9d50bb]" :
                      col.type === "boolean" ? "bg-[#33ffcc1a] border-[#33ffcc33] text-[#33ffcc]" :
                      "bg-slate-500/10 border-slate-500/20 text-slate-500"
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
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
           <div className="w-1.5 h-6 bg-[#ff2d95] rounded-full" />
           PREDICTIVE ANALYTICS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(suggestion)}
              className="text-left p-5 rounded-[1.5rem] bg-[#1c1a2e]/40 border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all group flex items-start gap-4"
            >
              <div className="mt-1 w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
                <Lightbulb className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

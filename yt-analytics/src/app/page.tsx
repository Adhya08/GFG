"use client";

import { useState, useRef } from "react";
import { Send, BarChart2, MessageSquare, Database, ArrowRight, Upload, AlertCircle, FileDown } from "lucide-react";
import ChartRenderer from "@/components/ChartRenderer";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(data.message || "File uploaded successfully!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const exportPDF = async () => {
    if (!activeChart || !chartContainerRef.current) {
        alert("Please generate a chart first!");
        return;
    }
    try {
        const canvas = await html2canvas(chartContainerRef.current, { scale: 2, backgroundColor: "#0f1115" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("landscape", "mm", "a4");
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("Analytics_Dashboard_Export.pdf");
    } catch (err) {
        console.error("Failed to export PDF", err);
        alert("Failed to export PDF.");
    }
  };

  const predefinedQueries = [
    "Show total views by category",
    "Average sentiment score by language",
    "Compare likes vs duration in a scatter plot",
    "Ads enabled vs disabled average views"
  ];

  const handleQuery = async (q: string) => {
    if (!q) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }

      const insight = {
        question: q,
        data: data.data,
        sql: data.sql,
        chartType: data.chartType,
        xAxisLabel: data.xAxisLabel,
        yAxisLabel: data.yAxisLabel,
        insights: data.insights || [],
      };

      setHistory([...history, insight]);
      setActiveChart(insight);
    } catch (e: any) {
       setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white selection:bg-indigo-500/30 font-sans">
      <div className="absolute top-0 right-0 left-0 bg-gradient-to-b from-indigo-900/20 to-transparent h-64 pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex gap-8">
        
        {/* Left Panel: Conversation & Input */}
        <div className="w-[450px] flex flex-col h-[calc(100vh-4rem)] border border-white/10 bg-white/5 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden shadow-indigo-500/10">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
             <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-2">
                  <BarChart2 className="w-6 h-6 text-indigo-400" />
                  InsightAI
                </h1>
                <p className="text-sm text-slate-400 mt-1">Chat to generate analytics</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {history.length === 0 ? (
              <div className="text-center mt-10">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <Database className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-200">Start Analyzing</h3>
                <p className="text-sm text-slate-400 mt-2 mb-6 max-w-[250px] mx-auto">
                  Ask a question about your YouTube performance directly in plain English.
                </p>
                
                <div className="space-y-2">
                  {predefinedQueries.map((pq, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(pq); handleQuery(pq); }}
                      className="w-full text-left text-sm px-4 py-2.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 border border-white/5 hover:border-indigo-500/30 transition-all text-slate-300 group flex items-center justify-between"
                    >
                      {pq}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
               <div className="space-y-6">
                 {history.map((h, i) => (
                   <div key={i} className="flex flex-col gap-3">
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-slate-200">
                          {h.question}
                        </div>
                     </div>
                     <div className="flex gap-3 justify-end">
                        <div className="bg-indigo-600/20 border border-indigo-500/30 px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-indigo-200 cursor-pointer hover:bg-indigo-600/30 transition-colors"
                             onClick={() => setActiveChart(h)}>
                          <p className="font-medium text-indigo-400 flex items-center gap-2 mb-2">
                            <BarChart2 className="w-4 h-4" /> 
                            Generated Chart
                          </p>
                          <div className="p-2 bg-black/40 rounded font-mono text-xs text-indigo-300/80 overflow-x-auto max-w-[280px]">
                            {h.sql}
                          </div>
                        </div>
                     </div>
                   </div>
                 ))}
                 
                 {loading && (
                   <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 animate-pulse" />
                     <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-slate-400 flex items-center gap-2">
                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                     </div>
                   </div>
                 )}
               </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-black/20">
             {errorMsg && (
               <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex gap-2 items-start">
                 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                 <p>{errorMsg}</p>
               </div>
             )}
             <form onSubmit={(e) => { e.preventDefault(); handleQuery(query); }} className="relative flex items-center gap-2">
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything about your data..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 cursor-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder:text-slate-500 pr-12 transition-all"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !query}
                  className="absolute right-2 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
             </form>
          </div>
        </div>

        {/* Right Panel: Data Visualization */}
        <div className="flex-1 border border-white/10 bg-white/5 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
           <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h2 className="font-semibold text-slate-200">Interactive Dashboard</h2>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors text-slate-300">
                  <Upload className="w-3.5 h-3.5" /> Upload CSV
                </button>
                <button 
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20">
                  <FileDown className="w-3.5 h-3.5" /> Export PDF
                </button>
              </div>
           </div>
           
           <div className="flex-1 p-6 relative">
              {activeChart ? (
                <div ref={chartContainerRef} className="h-full w-full bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-white">{activeChart.question}</h3>
                      <p className="text-sm text-slate-400 mt-1 capitalize">{activeChart.chartType} Chart &middot; {activeChart.data.length} records</p>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <ChartRenderer 
                      type={activeChart.chartType} 
                      data={activeChart.data} 
                      xAxisLabel={activeChart.xAxisLabel} 
                      yAxisLabel={activeChart.yAxisLabel} 
                    />
                  </div>
                  
                  {activeChart.insights && activeChart.insights.length > 0 && (
                    <div className="mt-6 p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl max-h-56 overflow-y-auto">
                        <h4 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Analyst Insights
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                           {activeChart.insights.map((insightText: string, idx: number) => (
                             <li key={idx} className="flex items-start gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                               <span className="leading-relaxed">{insightText}</span>
                             </li>
                           ))}
                        </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                   <BarChart2 className="w-16 h-16 opacity-20 mb-4" />
                   <p>Your dashboard visualization will appear here.</p>
                </div>
              )}
           </div>
        </div>

      </main>
    </div>
  );
}

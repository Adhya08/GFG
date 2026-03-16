"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, BarChart2, MessageSquare, Database, ArrowRight, 
  Upload, AlertCircle, FileDown, Home as HomeIcon, 
  Settings, User, Bell, Search, LayoutGrid, PieChart, 
  TrendingUp, Layers, HelpCircle, LogOut, Sun, Moon, Lock
} from "lucide-react";
import ChartRenderer from "@/components/ChartRenderer";
import DatasetUnderstanding from "@/components/DatasetUnderstanding";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUnderstanding, setShowUnderstanding] = useState(false);
  const [datasetDetails, setDatasetDetails] = useState<any>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeNav, setActiveNav] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  
  const [exportingReport, setExportingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = localStorage.getItem("neuro_auth");
    if (auth === "true") setIsAuthenticated(true);

    const savedHistory = localStorage.getItem("neuro_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    if (authLoaded) {
      localStorage.setItem("neuro_history", JSON.stringify(history));
    }
  }, [history, authLoaded]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleNavClick = (index: number) => {
    setActiveNav(index);
    if (index === 0) { // Home
      setActiveChart(null);
      setShowUnderstanding(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Clear all conversation history?")) {
      setHistory([]);
      setActiveChart(null);
      localStorage.removeItem("neuro_history");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("neuro_auth");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    localStorage.setItem("neuro_auth", "true");
  };

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
      
      setDatasetDetails({
        summary: data.summary,
        columnTypes: data.columnTypes,
        suggestions: data.suggestions,
        quality: data.dataQuality
      });
      setShowUnderstanding(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSelectSuggestion = (q: string) => {
    setQuery(q);
    setShowUnderstanding(false);
    handleQuery(q);
  };

  const exportPDF = async () => {
    if (history.length === 0) {
        alert("Please run at least one query to export an analytics report.");
        return;
    }
    
    setExportingReport(true);
    setLoading(true);

    try {
        // Fetch AI Report Summary
        const rRes = await fetch("/api/report", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ history: history })
        });
        const rData = await rRes.json();
        if (!rRes.ok) throw new Error(rData.error || "Failed to generate report summary");
        
        setReportData(rData);

        // Wait to ensure React mounts the Hidden Div and Charts are mapped
        await new Promise(r => setTimeout(r, 2000));

        if (!reportRef.current) throw new Error("Report rendering failed");

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = 210;
        const pdfHeight = 297;

        const pages = reportRef.current.querySelectorAll('.report-page');

        for (let i = 0; i < pages.length; i++) {
           const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 2, backgroundColor: "#0f1115", useCORS: true });
           const imgData = canvas.toDataURL("image/png");

           if (i > 0) pdf.addPage();
           pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save("DashTalk_Analytics_Report.pdf");
    } catch (err) {
        console.error("Failed to export PDF", err);
        alert("Failed to export complete report PDF.");
    } finally {
        setExportingReport(false);
        setReportData(null);
        setLoading(false);
    }
  };

  const predefinedQueries = [
    "Predict views for the next 7 days",
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
        isPredictive: data.isPredictive,
        forecastError: data.forecastError,
      };

      setHistory([...history, insight]);
      setActiveChart(insight);
    } catch (e: any) {
       setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authLoaded) {
    return <div className="h-screen bg-brand-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div data-theme={theme} className="flex h-screen bg-brand-bg text-brand-text font-sans overflow-hidden items-center justify-center relative theme-transition">
         <div className="absolute inset-0 bg-brand-bg z-0" />
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
         
         <div className="w-full max-w-md z-10 glass rounded-[2.5rem] border border-brand-border p-10 shadow-2xl relative">
            <div className="flex flex-col items-center mb-8">
               <div className="w-16 h-16 bg-gradient-to-tr from-[#ff2d95] to-[#9d50bb] rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 mb-6">
                 <BarChart2 className="w-8 h-8 text-white" />
               </div>
               <h1 className="text-3xl font-black text-center tracking-tight mb-2">DashTalk</h1>
               <p className="text-slate-500 text-sm text-center">Sign in to access secure dashboard streams</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Agent ID</label>
                  <input required type="text" placeholder="adhya08" className="w-full mt-2 bg-brand-bg border border-brand-border rounded-xl px-5 py-4 focus:outline-none focus:border-indigo-500/50 shadow-inner text-sm placeholder:text-slate-600" />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Passcode</label>
                  <input required type="password" placeholder="••••••••" className="w-full mt-2 bg-brand-bg border border-brand-border rounded-xl px-5 py-4 focus:outline-none focus:border-indigo-500/50 shadow-inner text-sm placeholder:text-slate-600" />
               </div>
               <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-4 mt-8 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group">
                 Authenticate <Lock className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </form>
         </div>
         <button onClick={toggleTheme} className="absolute top-8 right-8 w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-indigo-400 border border-brand-border transition-all z-20">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
         </button>
      </div>
    );
  }

  return (
    <div data-theme={theme} className="flex h-screen bg-brand-bg text-brand-text font-sans overflow-hidden theme-transition">
      {/* 1. Left Sidebar (Thin Icon Bar) */}
      <aside className="w-20 bg-brand-sidebar border-r border-brand-border flex flex-col items-center py-8 gap-10 shrink-0 z-30 shadow-2xl">
        <div className="w-12 h-12 bg-gradient-to-tr from-[#ff2d95] to-[#9d50bb] rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
          <BarChart2 className="w-7 h-7 text-white" />
        </div>
        
        <nav className="flex-1 flex flex-col gap-8">
          {[HomeIcon, LayoutGrid, PieChart, TrendingUp, Layers, HelpCircle].map((Icon, i) => (
            <button 
              key={i} 
              onClick={() => handleNavClick(i)}
              className={`p-3 rounded-xl transition-all group relative ${activeNav === i ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-indigo-400 hover:bg-white/5'}`}
            >
              <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
              {activeNav === i && <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-lg shadow-indigo-500/50" />}
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all group"
        >
          <LogOut className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </aside>

      {/* 2. Main Body Container */}
      <section className="flex-1 flex flex-col min-w-0 relative">
        {/* Background Gradients (Only in dark mode for depth) */}
        {theme === 'dark' && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
          </>
        )}

        {/* Header */}
        <header className="h-20 bg-brand-sidebar/50 backdrop-blur-md border-b border-brand-border flex items-center justify-between px-8 shrink-0 z-20">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold tracking-tight">Analytics Dashboard</h2>
              <div className="flex items-center bg-white/5 border border-brand-border rounded-full px-4 py-1.5 ml-4">
                <Search className="w-4 h-4 text-slate-500 mr-2" />
                <input placeholder="Search metrics..." className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-slate-600" />
              </div>
           </div>

           <div className="flex items-center gap-6">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-indigo-400 hover:text-indigo-300 transition-all shadow-lg hover:scale-105 active:scale-95 border-brand-border"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button className="relative text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-[#ff2d95] rounded-full ring-2 ring-brand-sidebar" />
              </button>

              <div className="flex items-center gap-3 pl-6 border-l border-brand-border">
                <div className="text-right">
                  <p className="text-sm font-semibold">Adhya08</p>
                  <p className="text-xs text-slate-500">Premium Analyst</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
                  <div className="w-full h-full rounded-full bg-brand-sidebar flex items-center justify-center p-1 overflow-hidden">
                    <User className="w-6 h-6 text-slate-300" />
                  </div>
                </div>
              </div>
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex gap-6 p-6 min-h-0 z-10 overflow-hidden">
          
          {activeNav === 0 && (
             <div className="flex-1 glass rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden border-brand-border">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
               <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#ff2d95] to-[#9d50bb] flex items-center justify-center shadow-lg shadow-pink-500/20 mb-8 z-10">
                  <BarChart2 className="w-12 h-12 text-white" />
               </div>
               <h1 className="text-5xl font-black mb-4 z-10 tracking-tight">Welcome to DashTalk</h1>
               <p className="text-xl text-slate-400 max-w-2xl mb-10 z-10">
                  Initialize your data streams, run advanced AI models, and visualize your organizational metrics in real-time.
               </p>
               <button 
                 onClick={() => handleNavClick(1)}
                 className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 z-10 group"
               >
                 Launch Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
          )}

          {activeNav === 1 && (
            <>
              {/* Chat Side Panel */}
              <div className="w-[380px] flex flex-col glass rounded-3xl overflow-hidden shadow-2xl shrink-0 border-brand-border">
                 <div className="p-5 border-b border-brand-border bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-sm font-semibold text-slate-300 tracking-wide uppercase">AI Assistant</span>
                    </div>
                    <Settings className="w-4 h-4 text-slate-500 cursor-pointer hover:text-indigo-400 transition-colors" />
                 </div>

                 <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                         <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                            <MessageSquare className="w-10 h-10 text-indigo-400" />
                         </div>
                         <h4 className="text-lg font-bold mb-2">Ready to explore?</h4>
                         <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                            Input your queries or pick a suggested start below.
                         </p>
                         <div className="w-full space-y-2">
                            {predefinedQueries.map((pq, i) => (
                               <button 
                                 key={i} 
                                 onClick={() => { setQuery(pq); handleQuery(pq); }}
                                 className="w-full text-left p-3 text-xs bg-white/5 border border-brand-border rounded-xl hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all text-slate-400 font-medium flex items-center justify-between group"
                               >
                                 {pq}
                                 <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                               </button>
                            ))}
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {history.map((h, i) => (
                          <div key={i} className="space-y-3">
                            <div className="flex items-start gap-3">
                               <div className="w-8 h-8 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-indigo-400" />
                               </div>
                               <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-200 leading-relaxed max-w-[85%] border border-brand-border">
                                 {h.question}
                               </div>
                            </div>
                            <div className="flex items-start gap-3 flex-row-reverse">
                               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9d50bb] to-[#ff2d95] flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                                  <BarChart2 className="w-4 h-4 text-white" />
                               </div>
                               <div 
                                 onClick={() => setActiveChart(h)}
                                 className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-indigo-300 cursor-pointer hover:bg-indigo-500/20 transition-all group max-w-[85%]"
                               >
                                  <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-widest text-indigo-400 font-sans">
                                    Visualization Ready
                                  </div>
                                  <code className="text-[10px] block p-2 bg-black/40 rounded-lg text-slate-400 font-mono overflow-x-auto whitespace-pre truncate">
                                    {h.sql}
                                  </code>
                               </div>
                            </div>
                          </div>
                        ))}
                        {loading && (
                          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-brand-border">
                             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                             <span className="text-xs text-slate-500">Processing Analyst Engine...</span>
                          </div>
                        )}
                      </div>
                    )}
                 </div>

                 <div className="p-4 bg-black/20 border-t border-brand-border">
                    {errorMsg && (
                       <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <p>{errorMsg}</p>
                       </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleQuery(query); }} className="relative">
                       <input 
                         value={query} 
                         onChange={(e) => setQuery(e.target.value)} 
                         placeholder="Ask something..." 
                         className="w-full bg-brand-bg border border-brand-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 pr-14 placeholder:text-slate-600 shadow-inner"
                       />
                       <button className="absolute right-2 top-2 p-2.5 bg-indigo-600 rounded-xl hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                          <Send className="w-4 h-4" />
                       </button>
                    </form>
                 </div>
              </div>


              {/* Main Visualization Panel */}
              <div className="flex-1 flex flex-col min-w-0">
                 <div className="h-full flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                       <div>
                          <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                             Interactive Insights
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]" />
                          </h3>
                       </div>
                       
                       <div className="flex gap-3">
                          <input 
                            type="file" 
                            accept=".csv" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                          />
                           <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-sidebar border border-brand-border rounded-xl hover:bg-white/5 transition-all text-sm font-semibold text-slate-300 shadow-lg"
                          >
                            <Upload className="w-4 h-4 text-indigo-400" /> New Source
                          </button>
                          <button 
                             onClick={exportPDF}
                             className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all text-sm font-semibold text-white shadow-xl shadow-indigo-500/20"
                          >
                             <FileDown className="w-4 h-4" /> Download PDF
                          </button>
                       </div>
                    </div>

                    <div className="flex-1 min-h-0 relative z-10">
                       <div className="h-full flex flex-col">
                          {showUnderstanding && datasetDetails ? (
                            <div className="flex-1 overflow-hidden glass rounded-[2.5rem] border-brand-border relative">
                              <DatasetUnderstanding 
                                summary={datasetDetails.summary}
                                columnTypes={datasetDetails.columnTypes}
                                suggestions={datasetDetails.suggestions}
                                quality={datasetDetails.quality}
                                onFinish={() => setShowUnderstanding(false)}
                                onSelectSuggestion={onSelectSuggestion}
                              />
                            </div>
                          ) : activeChart ? (
                            <div className="h-full flex flex-col gap-6 overflow-y-auto scrollbar-hide">
                               <div ref={chartContainerRef} className="bg-brand-sidebar/40 backdrop-blur-xl border border-brand-border rounded-[2.5rem] p-8 flex flex-col shadow-2xl shrink-0 h-[520px]">
                                  <div className="flex justify-between items-start mb-10">
                                    <div>
                                      <div className="flex gap-2 items-center mb-2">
                                         <span className="text-[10px] font-bold px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-md tracking-widest uppercase">
                                            Metric Result
                                         </span>
                                      </div>
                                      <h3 className="text-2xl font-bold leading-tight">{activeChart.question}</h3>
                                      <p className="text-sm text-slate-500 mt-2 flex items-center gap-2 capitalize">
                                         <div className={`w-2 h-2 rounded-full ${activeChart.chartType === 'line' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.5)]'}`} />
                                         {activeChart.chartType} rendering active 
                                         {activeChart.isPredictive && " (Forecast Enabled)"}
                                      </p>
                                      {activeChart.forecastError && (
                                         <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-xl flex items-center gap-2 w-fit">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <p>{activeChart.forecastError}</p>
                                         </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 relative min-h-[300px]">
                                    <ChartRenderer 
                                      type={activeChart.chartType} 
                                      data={activeChart.data} 
                                      xAxisLabel={activeChart.xAxisLabel} 
                                      yAxisLabel={activeChart.yAxisLabel} 
                                      theme={theme}
                                    />
                                  </div>
                               </div>

                               {activeChart.insights && activeChart.insights.length > 0 && (
                                  <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-brand-border rounded-[2rem] p-8 shadow-2xl shrink-0">
                                     <h4 className="text-lg font-bold text-indigo-400 mb-6 flex items-center gap-3 italic">
                                        <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                                        Strategic Analysis Insigths
                                     </h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {activeChart.insights.map((insightText: string, idx: number) => (
                                          <div key={idx} className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-brand-border hover:border-brand-neon-purple/30 transition-all hover:bg-brand-neon-purple/5 group">
                                             <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                {idx + 1}
                                             </div>
                                             <p className="text-sm text-slate-400 leading-relaxed font-medium group-hover:text-slate-200 transition-colors">{insightText}</p>
                                          </div>
                                        ))}
                                     </div>
                                  </div>
                               )}
                            </div>
                          ) : (
                            <div className="flex-1 rounded-[2.5rem] border-2 border-dashed border-brand-border flex flex-col items-center justify-center text-slate-600 bg-white/2 relative">
                               <div className="w-24 h-24 rounded-full bg-indigo-500/5 flex items-center justify-center mb-8 border border-brand-border">
                                  <BarChart2 className="w-10 h-10 opacity-20 text-indigo-400" />
                               </div>
                               <p className="font-bold text-lg tracking-wide uppercase opacity-30">Awaiting Analytics Parameters</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            </>
          )}

          {/* Reports Module */}
          {activeNav === 2 && (
             <div className="flex-1 glass rounded-[2.5rem] p-8 flex flex-col border-brand-border overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                      <PieChart className="w-6 h-6 text-indigo-400" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold">Reports Archive</h2>
                      <p className="text-sm text-slate-500">Access your saved and auto-generated analytical reports.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                   {['Q3 Revenue Trajectory', 'Global Audience Geo-map', 'Video Engagement Deep-dive'].map((r, i) => (
                      <div key={i} className="bg-white/5 border border-brand-border rounded-2xl p-6 hover:border-indigo-500/50 transition-all cursor-pointer group">
                         <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center border border-brand-border group-hover:bg-indigo-500/20 transition-colors">
                               <FileDown className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">Ready</span>
                         </div>
                         <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-300 transition-colors">{r}</h3>
                         <p className="text-sm text-slate-400 mb-4">Auto-generated synthesis based on core metrics.</p>
                         <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-brand-border">
                            <span>Author: System</span>
                            <span>{new Date().toLocaleDateString()}</span>
                         </div>
                      </div>
                   ))}
                </div>

                <h3 className="text-xl font-bold mb-4">Execution History</h3>
                <div className="bg-black/20 border border-brand-border rounded-2xl overflow-hidden shadow-inner">
                   <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-brand-border text-sm">
                         <tr>
                            <th className="p-5 font-bold text-slate-300 uppercase tracking-widest text-xs">Query Executed</th>
                            <th className="p-5 font-bold text-slate-300 uppercase tracking-widest text-xs">Type</th>
                            <th className="p-5 font-bold text-slate-300 uppercase tracking-widest text-xs">Status</th>
                         </tr>
                      </thead>
                      <tbody>
                         {history.length > 0 ? history.map((h, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                               <td className="p-5 text-sm text-slate-300 truncate max-w-xs font-medium">{h.question}</td>
                               <td className="p-5 text-sm text-indigo-400 font-bold capitalize">{h.chartType || 'Data'}</td>
                               <td className="p-5"><span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg font-bold">Completed</span></td>
                            </tr>
                         )) : (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-medium tracking-wide">No report history found. Run an AI query first!</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* Market Trends */}
          {activeNav === 3 && (
             <div className="flex-1 glass rounded-[2.5rem] p-8 flex flex-col border-brand-border overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center border border-pink-500/30">
                      <TrendingUp className="w-6 h-6 text-pink-400" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold">Market Trends Pulse</h2>
                      <p className="text-sm text-slate-500">Live macro-level insights across all tracked sectors.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                   <div className="bg-gradient-to-br from-[#1c1a2e] to-brand-sidebar border border-brand-border rounded-[2rem] p-8 relative overflow-hidden shadow-xl shadow-blue-500/5">
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-[50px]"></div>
                      <h3 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest relative z-10">Global Watch Time</h3>
                      <div className="flex items-end gap-3 mb-6 relative z-10">
                         <span className="text-5xl font-black text-white">42.8M</span>
                         <span className="text-emerald-400 font-bold mb-1 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded text-sm"><TrendingUp className="w-3 h-3 mr-1"/> +14.2%</span>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden relative z-10">
                         <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[70%] rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                      </div>
                   </div>

                   <div className="bg-gradient-to-br from-[#1c1a2e] to-brand-sidebar border border-brand-border rounded-[2rem] p-8 relative overflow-hidden shadow-xl shadow-pink-500/5">
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-500/20 rounded-full blur-[50px]"></div>
                      <h3 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest relative z-10">Avg Engagement Rate</h3>
                      <div className="flex items-end gap-3 mb-6 relative z-10">
                         <span className="text-5xl font-black text-white">8.4%</span>
                         <span className="text-emerald-400 font-bold mb-1 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded text-sm"><TrendingUp className="w-3 h-3 mr-1"/> +2.1%</span>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden relative z-10">
                         <div className="h-full bg-gradient-to-r from-pink-600 to-pink-400 w-[45%] rounded-full shadow-[0_0_10px_rgba(244,114,182,0.8)]"></div>
                      </div>
                   </div>
                </div>

                <div className="bg-brand-bg/50 border border-brand-border border-dashed rounded-[2rem] p-8 flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 bg-brand-sidebar shadow-inner rounded-2xl border border-brand-border flex items-center justify-center mb-4">
                      <BarChart2 className="w-8 h-8 text-slate-500" />
                   </div>
                   <h3 className="font-bold text-lg mb-2">Live Telemetry Disconnected</h3>
                   <p className="text-slate-500 text-sm max-w-sm">Connect a live streaming API in system settings to populate detailed real-time market visualizations here.</p>
                </div>
             </div>
          )}

          {/* Data Models */}
          {activeNav === 4 && (
             <div className="flex-1 glass rounded-[2.5rem] p-8 flex flex-col border-brand-border overflow-y-auto scrollbar-hide">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center border border-teal-500/30">
                         <Layers className="w-6 h-6 text-teal-400" />
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold">Data Models & Schemas</h2>
                         <p className="text-sm text-slate-500">Currently active neuro-schemas and dataset structures.</p>
                      </div>
                   </div>
                   {datasetDetails && (
                      <span className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-500/10 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Node
                      </span>
                   )}
                </div>

                {datasetDetails ? (
                   <>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                         <div className="bg-white/5 p-6 rounded-2xl border border-brand-border shadow-inner relative overflow-hidden">
                            <Database className="w-20 h-20 text-indigo-500/5 absolute -right-4 -bottom-4" />
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-black block mb-2 relative z-10">Total Columns</span>
                            <span className="text-4xl font-black text-white relative z-10">{datasetDetails.summary.columnCount}</span>
                         </div>
                         <div className="bg-white/5 p-6 rounded-2xl border border-brand-border shadow-inner relative overflow-hidden">
                            <Layers className="w-20 h-20 text-indigo-500/5 absolute -right-4 -bottom-4" />
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-black block mb-2 relative z-10">Total Rows</span>
                            <span className="text-4xl font-black text-[#00d2ff] relative z-10">{datasetDetails.summary.rowCount.toLocaleString()}</span>
                         </div>
                         <div className="bg-white/5 p-6 rounded-2xl border border-brand-border shadow-inner">
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-black block mb-2">Engine Status</span>
                            <span className="text-xl font-black text-emerald-400 uppercase tracking-wider mt-2 block">Optimized</span>
                         </div>
                         <div className="bg-white/5 p-6 rounded-2xl border border-brand-border shadow-inner">
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-black block mb-2">Table Store</span>
                            <span className="text-xl font-black text-indigo-400 uppercase tracking-wider mt-2 block">In-Memory SQLite</span>
                         </div>
                      </div>

                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1.5 h-5 bg-[#33ffcc] rounded-full" /> Architectural Mapping</h3>
                      <div className="bg-brand-bg/50 border border-brand-border rounded-[1.5rem] overflow-hidden shadow-inner">
                         <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-brand-border">
                               <tr>
                                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Field Identifier</th>
                                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Data Type Classification</th>
                                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Index Priority</th>
                               </tr>
                            </thead>
                            <tbody>
                               {datasetDetails.columnTypes.map((col: any, idx: number) => (
                                  <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                     <td className="p-5 font-mono text-sm text-slate-300 group-hover:text-white font-medium">{col.name}</td>
                                     <td className="p-5">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                                          col.type === "numeric" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                                          col.type === "categorical" ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                                          col.type === "date" ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                                          col.type === "boolean" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                          "bg-slate-500/10 border-slate-500/30 text-slate-400"
                                        }`}>
                                           {col.type}
                                        </span>
                                     </td>
                                     <td className="p-5 text-sm text-slate-500 font-medium">{idx === 0 ? 'Primary Key (Assumed)' : 'Standard Auto'}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </>
                ) : (
                   <div className="flex-1 border-2 border-dashed border-brand-border rounded-[2rem] flex flex-col justify-center items-center text-center p-10 bg-brand-bg/50">
                      <div className="w-20 h-20 bg-brand-sidebar rounded-full shadow-inner flex items-center justify-center border border-brand-border mb-6">
                         <Database className="w-10 h-10 text-slate-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">No Active Models</h3>
                      <p className="text-slate-500 max-w-sm">Return to the Interactive Insights panel and upload a dataset to immediately parse its structural schema.</p>
                   </div>
                )}
             </div>
          )}

          {/* Help & Support */}
          {activeNav === 5 && (
             <div className="flex-1 glass rounded-[2.5rem] p-8 flex flex-col border-brand-border overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
                      <HelpCircle className="w-6 h-6 text-amber-400" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold">Analyst Support Center</h2>
                      <p className="text-sm text-slate-500">Documentation and operational guidelines.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[
                      { icon: <Upload className="w-5 h-5"/>, q: "How do I upload custom data?", a: "Navigate to the Interactive Insights (second icon) and use the 'New Source' button to upload any valid CSV file. The system automatically maps the schema and spins up an accelerated in-memory SQL database for direct querying." },
                      { icon: <FileDown className="w-5 h-5"/>, q: "Can I export my charts?", a: "Yes. Once a high-fidelity chart is rendered in the visualization panel, click the 'Download PDF' button at the top right. It captures a vector-grade screenshot of the current canvas elements." },
                      { icon: <MessageSquare className="w-5 h-5"/>, q: "How does the AI Assistant work?", a: "The neural agent maintains full context of your dataset's columns and data types. Ask a plain-text question (e.g., 'Show me views by language'), and it writes SQL to extract the answer, dynamically selecting robust chart types (bar, line, scatter) automatically." },
                      { icon: <Sun className="w-5 h-5"/>, q: "Does this support dynamic themes?", a: "The DashTalk engine sports fully reactive CSS variable theming. Use the toggle in the global header to switch instantly between 'Cyberpunk Night' and high-contrast 'Solar Light'." }
                   ].map((faq, i) => (
                      <div key={i} className="bg-white/5 border border-brand-border p-8 rounded-[2rem] hover:bg-white/10 transition-colors shadow-inner flex flex-col items-start">
                         <div className="w-10 h-10 bg-brand-sidebar rounded-xl flex items-center justify-center border border-brand-border mb-6 text-indigo-400">
                            {faq.icon}
                         </div>
                         <h4 className="font-bold text-lg text-white mb-3">{faq.q}</h4>
                         <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                   ))}
                </div>
                
                <div className="mt-8 bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-[2rem] text-center">
                    <h4 className="font-bold text-indigo-400 text-lg mb-2">Need further assistance?</h4>
                    <p className="text-slate-400 text-sm mb-6">Our dedicated data engineers are on standby.</p>
                    <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                      Contact Administrator
                    </button>
                </div>
             </div>
          )}
         </div>

         {/* Hidden PDF Report Container */}
         {exportingReport && reportData && (
            <div className="fixed top-[-9999px] left-[-9999px] z-[-1] w-[794px] bg-[#0f1115] text-slate-200" ref={reportRef}>
                {/* PAGE 1: Intro & Summary */}
                <div className="report-page h-[1123px] p-12 flex flex-col justify-between border-b border-white/10">
                   <div>
                      <h1 className="text-4xl font-black text-indigo-400 mb-2">DashTalk Analytics Report</h1>
                      <p className="text-sm text-slate-400 mb-8 font-mono">Generated On: {new Date().toLocaleDateString()} | Dataset: Analyzed Telemetry</p>
                      <p className="text-lg text-slate-300 italic mb-10 border-l-4 border-indigo-500 pl-4 font-serif">"AI-generated insights and visual analytics from uploaded dataset."</p>

                      {/* Dataset Overview & Stats */}
                      <div className="grid grid-cols-2 gap-8 mb-10">
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
                             <h3 className="font-bold text-lg mb-4 text-emerald-400 border-b border-emerald-500/20 pb-2">Dataset Overview</h3>
                             <ul className="space-y-3 text-sm text-slate-300">
                                <li className="flex justify-between"><strong>Rows Analyzed:</strong> <span>{datasetDetails?.summary.rowCount || 0}</span></li>
                                <li className="flex justify-between"><strong>Total Columns:</strong> <span>{datasetDetails?.summary.columnCount || 0}</span></li>
                             </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
                             <h3 className="font-bold text-lg mb-4 text-pink-400 border-b border-pink-500/20 pb-2">Key Statistics</h3>
                             <ul className="space-y-3 text-sm text-slate-300">
                                <li className="flex justify-between"><strong>Total Videos:</strong> <span>{reportData.stats.totalVideos}</span></li>
                                <li className="flex justify-between"><strong>Avg Likes:</strong> <span>{reportData.stats.avgLikes.toLocaleString()}</span></li>
                                <li className="flex justify-between"><strong>Avg Views:</strong> <span>{reportData.stats.avgViews.toLocaleString()}</span></li>
                                <li className="flex justify-between"><strong>Top Video:</strong> <span className="font-mono text-indigo-300">{reportData.stats.topVideo}</span></li>
                                <li className="flex justify-between"><strong>Peak Date:</strong> <span>{reportData.stats.peakDate}</span></li>
                             </ul>
                          </div>
                      </div>

                      {/* Summary */}
                      <div className="mb-10 bg-indigo-500/5 p-8 rounded-3xl border border-indigo-500/20 shadow-inner">
                        <h3 className="text-2xl font-bold mb-6 text-indigo-400 flex items-center gap-3">
                           <div className="w-2 h-8 bg-indigo-500 rounded-full" /> AI Report Summary
                        </h3>
                        <ul className="space-y-4 text-slate-300">
                           {reportData.summary.map((point: string, i: number) => (
                              <li key={i} className="flex gap-4">
                                 <span className="text-indigo-400 font-bold opacity-50 block mt-0.5">0{i + 1}</span>
                                 <p className="leading-relaxed">{point}</p>
                              </li>
                           ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/20 shadow-inner">
                        <h3 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center gap-3">
                           <div className="w-2 h-8 bg-emerald-500 rounded-full" /> Strategic Recommendations
                        </h3>
                        <ul className="space-y-4 text-slate-300">
                           {reportData.recommendations.map((point: string, i: number) => (
                              <li key={i} className="flex gap-4">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                                 <p className="leading-relaxed font-medium">{point}</p>
                              </li>
                           ))}
                        </ul>
                      </div>
                   </div>
                   <div className="text-center text-xs text-slate-600 font-mono tracking-widest pt-8 border-t border-white/10 mt-8">PAGE 1 • DASHTALK AUTOMATED INTELLIGENCE</div>
                </div>

                {/* PAGE 2+: Charts & Insights */}
                {history.map((h: any, i: number) => (
                  <div key={i + 1} className="report-page h-[1123px] p-12 flex flex-col justify-between border-b border-white/10 page-break-after">
                     <div>
                       <div className="mb-8 border-b border-white/10 pb-6">
                           <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                               <BarChart2 className="w-4 h-4 text-indigo-500" /> Analytical Query Result
                           </p>
                           <h3 className="text-3xl font-black text-white leading-tight">{h.question}</h3>
                           <p className="text-sm text-indigo-400 mt-2 font-medium capitalize">
                              Generated {h.chartType} Chart {h.isPredictive && "• Includes Predictive Forecasting"}
                           </p>
                       </div>
                       
                       <div className="h-[450px] bg-brand-bg rounded-3xl p-8 mb-8 border border-white/10 shadow-2xl relative">
                           {h.isPredictive && (
                               <div className="absolute top-4 right-4 bg-pink-500/20 text-pink-400 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border border-pink-500/30">
                                   Predictive Horizon Active
                               </div>
                           )}
                           <ChartRenderer 
                              type={h.chartType} 
                              data={h.data} 
                              xAxisLabel={h.xAxisLabel} 
                              yAxisLabel={h.yAxisLabel} 
                              theme="dark"
                              disableAnimation={true}
                           />
                       </div>
                       
                       {h.insights && h.insights.length > 0 && (
                         <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-8 rounded-3xl shadow-inner">
                            <h4 className="font-bold text-xl text-indigo-300 mb-6 flex items-center gap-3">
                               <div className="w-2 h-6 bg-indigo-400 rounded-full" /> AI Analyst Insights
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               {h.insights.map((insight: string, idx: number) => (
                                 <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black mb-3">{idx + 1}</div>
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{insight}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                     </div>
                     <div className="text-center text-xs text-slate-600 font-mono tracking-widest pt-8 border-t border-white/10">PAGE {i + 2} • DASHTALK AUTOMATED INTELLIGENCE</div>
                  </div>
                ))}
            </div>
         )}
      </section>
    </div>
  );
}


import React, { useState, useMemo } from 'react';
import { SearchSession, AppStatus } from '../types';

interface ResultsDisplayProps {
  session: SearchSession;
  status: AppStatus;
  onExport: (format: 'txt' | 'csv') => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ session, status, onExport }) => {
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredResults = useMemo(() => {
    return session.results.filter(r => 
      r.title.toLowerCase().includes(filter.toLowerCase()) || 
      r.uri.toLowerCase().includes(filter.toLowerCase()) ||
      r.domain?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [session.results, filter]);

  const handleCopyAll = () => {
    const links = filteredResults.map(r => r.uri).join('\n');
    navigator.clipboard.writeText(links);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Harvester Header */}
      <div className="bg-[#080808] p-8 rounded-2xl border border-slate-900 shadow-2xl flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-blue-900/40">Active Harvest</span>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{session.id}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter break-all">"{session.query}"</h1>
          <div className="flex flex-wrap gap-6 pt-2">
            <Metric icon="fa-link" value={session.results.length} label="URLs Found" />
            <Metric icon="fa-globe" value={session.domainStats.length} label="Distinct Domains" />
            <Metric icon="fa-clock" value={new Date(session.timestamp).toLocaleTimeString()} label="Timestamp" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleCopyAll}
            className={`px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 transition-all border ${
              copied 
              ? 'bg-green-500/10 border-green-500/50 text-green-400' 
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-blue-500/30'
            }`}
          >
            <i className={`fas ${copied ? 'fa-check-double' : 'fa-copy'}`}></i>
            {copied ? 'Copied' : 'Copy All URLs'}
          </button>
          
          <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-1">
            <button 
              onClick={() => onExport('txt')}
              className="px-5 py-3 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              TXT
            </button>
            <div className="w-px h-6 bg-slate-800 self-center"></div>
            <button 
              onClick={() => onExport('csv')}
              className="px-5 py-3 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main List */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-[#050505] rounded-2xl border border-slate-900 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-900 flex items-center justify-between bg-black">
              <div className="flex items-center gap-4 flex-1">
                <i className="fas fa-search text-slate-700 text-xs"></i>
                <input 
                  type="text"
                  placeholder="FILTER HARVESTED DATA..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none placeholder:text-slate-800 w-full font-mono uppercase tracking-widest font-bold"
                />
              </div>
              <div className="hidden sm:block text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
                {filteredResults.length} / {session.results.length} RECORDS
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[700px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-slate-900">
                  <tr className="text-[10px] text-slate-600 uppercase tracking-widest font-black">
                    <th className="px-6 py-5">Rank</th>
                    <th className="px-6 py-5">Resource Descriptor</th>
                    <th className="px-6 py-5">Raw URL Pointer</th>
                    <th className="px-6 py-5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/30">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-40 text-center">
                        <i className="fas fa-satellite-dish text-6xl text-slate-900 mb-6 animate-pulse"></i>
                        <p className="font-black text-slate-700 uppercase text-xs tracking-[0.3em]">No data matching parameters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((res, idx) => (
                      <tr key={idx} className="hover:bg-blue-600/[0.02] transition-colors group">
                        <td className="px-6 py-5 text-[10px] font-mono text-slate-800 group-hover:text-blue-900">{String(idx + 1).padStart(3, '0')}</td>
                        <td className="px-6 py-5 max-w-xs">
                          <div className="text-[11px] font-black text-slate-400 truncate group-hover:text-blue-500 transition-colors uppercase tracking-tight">{res.title}</div>
                          <div className="text-[9px] text-slate-700 font-bold mt-1 group-hover:text-slate-600">{res.domain}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-[11px] font-mono text-slate-600 truncate max-w-lg group-hover:text-slate-300 transition-all">{res.uri}</div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <a 
                            href={res.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 border border-slate-900 text-slate-700 hover:text-white hover:border-blue-600 transition-all shadow-inner"
                          >
                            <i className="fas fa-external-link-alt text-[10px]"></i>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#080808] rounded-2xl border border-slate-900 p-6 space-y-6 shadow-2xl">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <i className="fas fa-project-diagram text-blue-600"></i> Domain Scope
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {session.domainStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black border border-slate-900 rounded-xl group hover:border-blue-900/50 transition-all">
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px] group-hover:text-slate-300">{stat.domain}</span>
                  <span className="px-2 py-0.5 bg-slate-900 text-blue-500 rounded text-[9px] font-black">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#080808] rounded-2xl border border-slate-900 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <i className="fas fa-brain text-blue-600"></i> AI Insights
              </h3>
              {status === AppStatus.ANALYZING && <i className="fas fa-atom fa-spin text-blue-500 text-xs"></i>}
            </div>
            
            {session.analysis ? (
              <div className="text-[11px] text-slate-500 leading-relaxed font-medium italic border-l-2 border-blue-900/30 pl-4 py-2">
                {session.analysis}
              </div>
            ) : status === AppStatus.ANALYZING ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-2 w-full bg-slate-900 rounded"></div>
                <div className="h-2 w-3/4 bg-slate-900 rounded"></div>
                <div className="h-2 w-5/6 bg-slate-900 rounded"></div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest text-center py-4 opacity-30">Awaiting processing</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Metric = ({ icon, value, label }: { icon: string, value: any, label: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-blue-600 text-[10px]">
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="flex flex-col">
      <span className="text-white font-black text-sm tracking-tight leading-none">{value}</span>
      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">{label}</span>
    </div>
  </div>
);

export default ResultsDisplay;


import React, { useState, useCallback, useEffect } from 'react';
import { SearchSession, AppStatus, AppLog, SearchResult, DomainStat } from './types';
import { geminiService } from './services/geminiService';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import ResultsDisplay from './components/ResultsDisplay';
import Header from './components/Header';
import Console from './components/Console';

// Reduced from 5 to 3 for better stability on standard API quotas
const CONCURRENCY_LIMIT = 3; 

const App: React.FC = () => {
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<{message: string, isQuota: boolean} | null>(null);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [hasSelectedKey, setHasSelectedKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasSelectedKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasSelectedKey(true);
      addLog("ENGINE: API Key updated. Stability improved.", "success");
    }
  };

  const addLog = useCallback((message: string, type: AppLog['type'] = 'info') => {
    const newLog: AppLog = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 40));
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const executeSearchTask = async (query: string): Promise<SearchSession> => {
    addLog(`SEARCHING: ${query}`, 'process');
    const { results, stats } = await geminiService.performSearch(query);
    
    const newSession: SearchSession = {
      id: `QP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      query,
      timestamp: Date.now(),
      results,
      domainStats: stats
    };

    setSessions(prev => [newSession, ...prev]);
    addLog(`SUCCESS: ${results.length} links for [${query}]`, 'success');

    if (results.length > 0) {
      geminiService.analyzeResults(query, results).then(analysis => {
        if (analysis) {
          setSessions(prev => prev.map(s => 
            s.id === newSession.id ? { ...s, analysis } : s
          ));
        }
      }).catch(() => {});
    }

    return newSession;
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setStatus(AppStatus.SEARCHING);
    setError(null);
    try {
      const session = await executeSearchTask(query);
      setCurrentSessionId(session.id);
      setStatus(AppStatus.IDLE);
    } catch (err: any) {
      const isQuota = err?.message?.includes('429');
      setError({ message: isQuota ? "Rate limit reached. Cooling down..." : "Execution error.", isQuota });
      setStatus(AppStatus.ERROR);
      addLog(`FAILED: ${query} (API Limit)`, 'error');
    }
  };

  const handleBatchSearch = async (queries: string[]) => {
    if (queries.length === 0) return;
    setError(null);
    setStatus(AppStatus.SEARCHING);
    setBatchProgress({ current: 0, total: queries.length });
    addLog(`BATCH STARTED: Processing ${queries.length} queries...`, 'info');
    
    let completedCount = 0;
    const pool = [...queries];
    
    const worker = async () => {
      while (pool.length > 0) {
        const query = pool.shift();
        if (!query) break;
        
        try {
          await executeSearchTask(query);
          // Add a tiny buffer between requests in the same worker to stay under the radar
          await new Promise(r => setTimeout(r, 500)); 
        } catch (err: any) {
          const isQuota = err?.message?.includes('429');
          if (isQuota) {
            addLog(`LIMIT HIT: Retrying query in 2s...`, 'warning');
            await new Promise(r => setTimeout(r, 2000));
            // One single retry for the batch item
            try {
              await executeSearchTask(query);
            } catch {
              addLog(`FAILED PERMANENTLY: ${query.substring(0, 15)}...`, 'error');
            }
          } else {
            addLog(`ERROR: ${query.substring(0, 15)}... skipped.`, 'error');
          }
        } finally {
          completedCount++;
          setBatchProgress(prev => prev ? { ...prev, current: completedCount } : null);
        }
      }
    };

    await Promise.all(Array(Math.min(CONCURRENCY_LIMIT, queries.length)).fill(null).map(worker));
    
    setBatchProgress(null);
    setStatus(AppStatus.IDLE);
    addLog(`BATCH FINISHED: Handled ${completedCount} queries.`, 'success');
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const exportData = (format: 'txt' | 'csv') => {
    if (!currentSession) return;
    let content = "";
    let mimeType = format === 'csv' ? 'text/csv' : 'text/plain';
    let filename = `qparser-${currentSession.id}.${format}`;
    content = currentSession.results.map(r => r.uri).join("\n");
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-black text-slate-300">
      <Sidebar 
        sessions={sessions} 
        currentId={currentSessionId} 
        onSelect={setCurrentSessionId} 
        onDelete={deleteSession}
      />

      <main className="flex-1 flex flex-col bg-[#050505] relative">
        <Header onSelectKey={handleSelectKey} isKeySelected={hasSelectedKey} />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar pb-32">
          <div className="max-w-7xl mx-auto w-full">
            <SearchBar 
              onSearch={handleSearch} 
              onBatchSearch={handleBatchSearch}
              isLoading={status === AppStatus.SEARCHING || batchProgress !== null} 
            />
            
            {batchProgress && (
              <div className="mt-6 bg-blue-600/5 p-4 rounded-xl border border-blue-500/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Bulk Harvester Active</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{batchProgress.current}/{batchProgress.total}</span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.6)]" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}></div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-xl border bg-orange-500/5 border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-tight flex items-center justify-between">
                <span>{error.message}</span>
                {error.isQuota && <button onClick={handleSelectKey} className="px-3 py-1 bg-orange-500 text-black rounded text-[9px] font-black">UPGRADE API KEY</button>}
              </div>
            )}

            <div className="mt-8">
              {currentSession ? (
                <ResultsDisplay session={currentSession} status={status} onExport={exportData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-600/10 blur-[100px] animate-pulse"></div>
                    <div className="relative w-24 h-24 rounded-3xl bg-slate-950 border border-slate-900 flex items-center justify-center shadow-2xl">
                      <i className="fas fa-microchip text-4xl text-blue-500"></i>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">QPARSER <span className="text-blue-600">ENGINE</span></h2>
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">Scrape • Extract • Analyze</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Console logs={logs} />
      </main>
    </div>
  );
};

export default App;

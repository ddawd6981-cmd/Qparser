
import React, { useState, useCallback, useEffect } from 'react';
import { SearchSession, AppStatus, AppLog, SearchResult, DomainStat } from './types';
import { geminiService } from './services/geminiService';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import ResultsDisplay from './components/ResultsDisplay';
import Header from './components/Header';
import Console from './components/Console';

// Optimized concurrency for balanced performance on Vercel
const CONCURRENCY_LIMIT = 4; 

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
      addLog("VERCEL_DEPLOY: API Key configured successfully.", "success");
    }
  };

  const addLog = useCallback((message: string, type: AppLog['type'] = 'info') => {
    const newLog: AppLog = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 25)); // Keep logs light for Vercel
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const executeSearchTask = async (query: string): Promise<SearchSession> => {
    addLog(`INIT: ${query.substring(0, 30)}...`, 'process');
    const { results, stats } = await geminiService.performSearch(query);
    
    const newSession: SearchSession = {
      id: `QP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      query,
      timestamp: Date.now(),
      results,
      domainStats: stats
    };

    setSessions(prev => [newSession, ...prev]);
    addLog(`SUCCESS: ${results.length} nodes for [${query.substring(0, 15)}]`, 'success');

    if (results.length > 0) {
      geminiService.analyzeResults(query, results).then(analysis => {
        if (analysis) {
          setSessions(prev => prev.map(s => s.id === newSession.id ? { ...s, analysis } : s));
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
    } catch (err: any) {
      const isQuota = err?.message?.includes('429');
      setError({ message: isQuota ? "API Limit Hit. Please wait." : "Engine Error.", isQuota });
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleBatchSearch = async (queries: string[]) => {
    if (queries.length === 0) return;
    setError(null);
    setStatus(AppStatus.SEARCHING);
    setBatchProgress({ current: 0, total: queries.length });
    addLog(`VERCEL_TURBO: Harvesting ${queries.length} dorks...`, 'info');
    
    let completedCount = 0;
    const pool = [...queries];
    
    const worker = async () => {
      while (pool.length > 0) {
        const query = pool.shift();
        if (!query) break;
        
        try {
          await executeSearchTask(query);
        } catch (err: any) {
          const isQuota = err?.message?.includes('429');
          if (isQuota) {
            addLog(`LIMIT: Retrying in 3s...`, 'warning');
            await new Promise(r => setTimeout(r, 3000));
            try { await executeSearchTask(query); } catch { addLog(`FAILED: ${query.substring(0, 15)}`, 'error'); }
          } else {
            addLog(`ERROR: Skipping bad query.`, 'error');
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
    addLog(`COMPLETED: All tasks processed.`, 'success');
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const exportData = (format: 'txt' | 'csv') => {
    if (!currentSession) return;
    const content = currentSession.results.map(r => r.uri).join("\n");
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qparser-export-${Date.now()}.${format}`;
    a.click();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-black text-slate-300">
      <Sidebar sessions={sessions} currentId={currentSessionId} onSelect={setCurrentSessionId} onDelete={deleteSession} />
      <main className="flex-1 flex flex-col bg-[#050505] relative">
        <Header onSelectKey={handleSelectKey} isKeySelected={hasSelectedKey} />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar pb-32">
          <div className="max-w-7xl mx-auto w-full">
            <SearchBar onSearch={handleSearch} onBatchSearch={handleBatchSearch} isLoading={status === AppStatus.SEARCHING || batchProgress !== null} />
            {batchProgress && (
              <div className="mt-6 bg-blue-600/5 p-4 rounded-xl border border-blue-500/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-blue-400">
                  <span>Vercel Deploy Mode: Active</span>
                  <span>{batchProgress.current}/{batchProgress.total}</span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.6)]" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}></div>
                </div>
              </div>
            )}
            <div className="mt-8">
              {currentSession ? <ResultsDisplay session={currentSession} status={status} onExport={exportData} /> : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8">
                  <div className="relative w-24 h-24 rounded-3xl bg-slate-950 border border-slate-900 flex items-center justify-center shadow-2xl">
                    <i className="fas fa-cloud-upload-alt text-4xl text-blue-500"></i>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">QPARSER <span className="text-blue-600">VERCEL</span></h2>
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

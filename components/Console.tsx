
import React, { useEffect, useRef } from 'react';
import { AppLog } from '../types';

interface ConsoleProps {
  logs: AppLog[];
}

const Console: React.FC<ConsoleProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  const getTypeStyles = (type: AppLog['type']) => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500 font-bold';
      case 'warning': return 'text-yellow-500';
      case 'process': return 'text-blue-400 italic';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-black border-t border-slate-900 z-50 overflow-hidden flex flex-col font-mono text-[10px]">
      <div className="px-4 py-1.5 border-b border-slate-900 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-slate-500 uppercase tracking-widest font-bold">System Console v2.0</span>
        </div>
        <div className="text-slate-700">QPARSER_OSINT_ACTIVE</div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col-reverse gap-1"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 group">
            <span className="text-slate-800 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span className={getTypeStyles(log.type)}>
              {log.type === 'process' && <i className="fas fa-circle-notch fa-spin mr-2"></i>}
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Console;

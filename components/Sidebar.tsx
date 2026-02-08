
import React from 'react';
import { SearchSession } from '../types';

interface SidebarProps {
  sessions: SearchSession[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, currentId, onSelect, onDelete }) => {
  const totalResults = sessions.reduce((acc, s) => acc + s.results.length, 0);

  return (
    <aside className="w-80 bg-black border-r border-slate-900 flex flex-col hidden lg:flex shrink-0">
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center font-black text-white text-2xl shadow-2xl shadow-blue-900/20 italic">Q</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">QPARSER <span className="text-blue-700">PRO</span></h1>
            <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Build 2.5.0-F</p>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest border border-slate-900 hover:border-blue-900/50 shadow-inner"
        >
          <i className="fas fa-plus text-blue-600"></i> New Session
        </button>
      </div>

      <div className="px-8 pb-8 grid grid-cols-2 gap-4 border-b border-slate-900">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-2">Links</p>
          <p className="text-2xl font-black text-white leading-none">{totalResults}</p>
        </div>
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-2">History</p>
          <p className="text-2xl font-black text-white leading-none">{sessions.length}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <div className="px-4 py-4 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Archives</span>
        </div>
        
        {sessions.length === 0 ? (
          <div className="px-4 py-12 text-center space-y-4 opacity-20">
            <i className="fas fa-box text-3xl"></i>
            <p className="text-[10px] font-black uppercase tracking-widest">No previous data</p>
          </div>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id}
              className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                currentId === session.id 
                ? 'bg-blue-700/5 border-blue-800 text-white' 
                : 'text-slate-500 hover:bg-slate-950 border-transparent hover:border-slate-900'
              }`}
              onClick={() => onSelect(session.id)}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`w-1.5 h-1.5 rounded-full ${currentId === session.id ? 'bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`}></div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] truncate font-bold leading-tight">{session.query}</span>
                  <span className="text-[9px] uppercase tracking-tighter opacity-40 font-black mt-1">
                    {session.results.length} nodes extracted
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-600 transition-all"
              >
                <i className="fas fa-trash-alt text-[10px]"></i>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-8 bg-black">
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-900 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-blue-700/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-700 transition-all group-hover:text-white">
            <i className="fas fa-shield-alt"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-white tracking-widest uppercase">Secured</p>
            <p className="text-[9px] text-slate-700 font-bold uppercase">Encryption Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

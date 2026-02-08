
import React from 'react';

interface HeaderProps {
  onSelectKey: () => void;
  isKeySelected: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSelectKey, isKeySelected }) => {
  return (
    <header className="h-20 border-b border-slate-900 bg-black/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10">
      <div className="flex items-center gap-4 lg:hidden">
        <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center font-black text-white italic text-xl shadow-2xl">Q</div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 border rounded-full flex items-center gap-2 ${
          isKeySelected 
          ? 'bg-blue-500/10 border-blue-500/20' 
          : 'bg-green-500/10 border-green-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isKeySelected ? 'bg-blue-500' : 'bg-green-500'}`}></span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isKeySelected ? 'text-blue-500' : 'text-green-500'}`}>
            {isKeySelected ? 'Premium Key Active' : 'Mainframe Connected'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 text-slate-500">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest">
          <i className="fas fa-microchip text-blue-600"></i> {isKeySelected ? 'CUSTOM_API' : 'SHARED_QUOTA'}
        </div>
        
        <button 
          onClick={onSelectKey}
          title="Switch API Key"
          className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border ${
            isKeySelected 
            ? 'bg-blue-900/20 text-blue-400 border-blue-800/50' 
            : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-white hover:border-slate-800'
          }`}
        >
          <i className="fas fa-key"></i>
        </button>
        
        <button className="w-10 h-10 rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center border border-transparent hover:border-slate-800">
          <i className="fas fa-shield-alt"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;

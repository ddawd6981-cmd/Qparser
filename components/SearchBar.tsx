
import React, { useState, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onBatchSearch: (queries: string[]) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onBatchSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (bulkMode) {
      const queries = query.split(/\n/).map(q => q.trim()).filter(q => q.length > 0);
      onBatchSearch(queries);
    } else {
      onSearch(query);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length > 0) {
        onBatchSearch(lines);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const dorkGroups = [
    { label: 'Admin Logs', dork: 'intitle:"index of" "admin.log"' },
    { label: 'Cloud Storage', dork: 'site:s3.amazonaws.com inurl:config' },
    { label: 'DB Backups', dork: 'filetype:sql "dump" password' },
    { label: 'Web Panels', dork: 'intitle:"control panel" inurl:cp' }
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setBulkMode(false)}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${!bulkMode ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}
          >
            Single Query
          </button>
          <div className="w-px h-3 bg-slate-900"></div>
          <button 
            onClick={() => setBulkMode(true)}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${bulkMode ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}
          >
            Bulk Harvesting
          </button>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] font-black text-slate-600 hover:text-blue-400 uppercase tracking-widest flex items-center gap-2 transition-all"
        >
          <i className="fas fa-file-upload"></i> Upload .txt
        </button>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-0 bg-blue-600/[0.03] blur-3xl -z-10 group-focus-within:bg-blue-600/[0.07] transition-all"></div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".txt" 
          className="hidden" 
        />
        
        <div className="relative">
          {bulkMode ? (
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              rows={4}
              placeholder="PASTE MULTIPLE DORKS (ONE PER LINE)..."
              className="w-full bg-black border border-slate-900 text-white p-6 pr-40 rounded-2xl focus:ring-1 focus:ring-blue-600/40 focus:border-blue-600/60 outline-none transition-all placeholder:text-slate-800 shadow-2xl font-mono text-sm leading-relaxed custom-scrollbar"
            />
          ) : (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              placeholder="ENTER DORK OR KEYWORD..."
              className="w-full bg-black border border-slate-900 text-white pl-10 pr-40 py-6 rounded-2xl focus:ring-1 focus:ring-blue-600/40 focus:border-blue-600/60 outline-none transition-all placeholder:text-slate-800 shadow-2xl font-mono text-sm uppercase tracking-wider font-bold"
            />
          )}

          <div className={`absolute right-3 ${bulkMode ? 'bottom-3' : 'top-3 bottom-3'} flex gap-2`}>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-10 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-950 disabled:text-slate-800 text-white font-black rounded-xl transition-all flex items-center gap-3 shadow-2xl shadow-blue-900/10 uppercase tracking-widest text-[11px]"
            >
              {isLoading ? (
                <i className="fas fa-satellite fa-spin"></i>
              ) : (
                <>
                  <span>START SCAN</span>
                  <i className="fas fa-bolt opacity-50"></i>
                </>
              )}
            </button>
          </div>

          {!bulkMode && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="fas fa-terminal text-slate-800 text-xs"></i>
            </div>
          )}
        </div>
      </form>
      
      <div className="flex flex-wrap items-center gap-3 px-2">
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Library:</span>
        {dorkGroups.map((d, i) => (
          <button 
            key={i}
            type="button" 
            onClick={() => { setBulkMode(false); setQuery(d.dork); }}
            className="px-4 py-2 bg-slate-950 hover:bg-blue-950/20 text-slate-600 hover:text-blue-500 text-[10px] font-bold rounded-lg transition-all border border-slate-900 hover:border-blue-900/40 uppercase tracking-tight"
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;

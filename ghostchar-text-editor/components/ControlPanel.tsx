
import React from 'react';
import { GhostCharacter, CheckMode } from '../types.ts';

interface ControlPanelProps {
  checkMode: CheckMode;
  setCheckMode: (mode: CheckMode) => void;
  ghostChars: GhostCharacter[];
  onFix: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  checkMode,
  setCheckMode,
  ghostChars,
  onFix
}) => {
  const uniqueChars = Array.from(new Set(ghostChars.map(c => c.hex)));

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 p-6 space-y-6 w-full lg:w-96 overflow-y-auto shrink-0">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-100">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Settings
        </h2>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-400 uppercase tracking-wider">Detection Mode</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setCheckMode(CheckMode.STRICT_ASCII)}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                checkMode === CheckMode.STRICT_ASCII 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Strict ASCII
            </button>
            <button
              onClick={() => setCheckMode(CheckMode.EXTENDED_ASCII)}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                checkMode === CheckMode.EXTENDED_ASCII 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Ext. ASCII
            </button>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            {checkMode === CheckMode.STRICT_ASCII 
              ? "Highlights characters > 127 and hidden control codes." 
              : "Highlights characters > 255 and hidden control codes."}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-100">
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Findings
        </h2>

        {ghostChars.length === 0 ? (
          <div className="bg-emerald-900/20 border border-emerald-800/50 p-6 rounded-xl text-center">
            <p className="text-emerald-400 text-sm font-medium">✨ Your text is clean!</p>
            <p className="text-[10px] text-emerald-500/60 mt-2">All characters are within standard range.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Total Issues</p>
                <p className="text-2xl font-black text-amber-500">{ghostChars.length}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Unique Types</p>
                <p className="text-2xl font-black text-indigo-400">{uniqueChars.length}</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest px-1">Detailed Breakdown</p>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {uniqueChars.slice(0, 30).map(hex => {
                const sample = ghostChars.find(c => c.hex === hex);
                const count = ghostChars.filter(c => c.hex === hex).length;
                const isControl = sample && (sample.code < 32 || sample.code === 127);
                
                return (
                  <div key={hex} className="flex items-center justify-between bg-slate-800/80 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-md font-mono text-lg font-bold border ${isControl ? 'bg-amber-900/40 text-amber-400 border-amber-500/20' : 'bg-indigo-900/40 text-indigo-400 border-indigo-500/20'}`}>
                        {sample?.char === ' ' || sample?.code === 8203 || sample?.code === 160 || isControl ? '·' : sample?.char}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-200">U+{hex}</p>
                        <p className="text-[10px] text-slate-400 truncate w-32 leading-tight">{sample?.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px] font-bold">×{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
               <button
                onClick={onFix}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Auto-Fix Characters
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">
                Fix will replace common problematic characters (like smart quotes) with standard ASCII equivalents.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-800 shrink-0">
         <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
            GhostChar Debugger v1.1
         </p>
      </div>
    </div>
  );
};

export default ControlPanel;

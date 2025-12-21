
import React, { useState } from 'react';
import { GhostCharacter, CheckMode, CharacterMapping } from '../types.ts';

interface ControlPanelProps {
  checkMode: CheckMode;
  setCheckMode: (mode: CheckMode) => void;
  ghostChars: GhostCharacter[];
  mappings: CharacterMapping[];
  onFix: () => void;
  onAddMapping: (code: number, replacement: string) => void;
  onRemoveMapping: (code: number) => void;
  onResetMappings: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  checkMode,
  setCheckMode,
  ghostChars,
  mappings,
  onFix,
  onAddMapping,
  onRemoveMapping,
  onResetMappings
}) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'mappings'>('findings');
  const [newChar, setNewChar] = useState('');
  const [newReplacement, setNewReplacement] = useState('');

  const uniqueChars = Array.from(new Set(ghostChars.map(c => c.hex)));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChar) return;
    
    const normalized = newChar.normalize('NFC');
    let code: number;
    if (normalized.startsWith('U+') || normalized.startsWith('u+')) {
      code = parseInt(normalized.substring(2), 16);
    } else {
      code = Array.from(normalized)[0].codePointAt(0) || 0;
    }

    if (!isNaN(code)) {
      onAddMapping(code, newReplacement);
      setNewChar('');
      setNewReplacement('');
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 w-full lg:w-96 shrink-0 relative lg:h-full">
      <div className="flex border-b border-slate-800 bg-slate-900/50 shrink-0">
        <button 
          onClick={() => setActiveTab('findings')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'findings' ? 'border-indigo-500 text-indigo-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Findings {ghostChars.length > 0 && `(${ghostChars.length})`}
        </button>
        <button 
          onClick={() => setActiveTab('mappings')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'mappings' ? 'border-indigo-500 text-indigo-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Mappings ({mappings.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32">
        {activeTab === 'findings' ? (
          <>
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-indigo-100">Settings</h2>
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detection Mode</label>
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
                <p className="text-[11px] text-indigo-300/60 leading-relaxed italic bg-indigo-500/5 p-2 rounded-md border border-indigo-500/10">
                  {checkMode === CheckMode.STRICT_ASCII 
                    ? "Flags all characters outside the standard 0-127 range (basic Latin characters)." 
                    : "Flags only characters outside the extended 0-255 range (standard symbols and accents)."}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-indigo-100">Findings</h2>
              {ghostChars.length === 0 ? (
                <div className="bg-emerald-900/20 border border-emerald-800/50 p-6 rounded-xl text-center">
                  <p className="text-emerald-400 text-sm font-medium">✨ Text is clean!</p>
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
                  <div className="space-y-2">
                    {uniqueChars.map(hex => {
                      const sample = ghostChars.find(c => c.hex === hex);
                      const count = ghostChars.filter(c => c.hex === hex).length;
                      const isControl = sample && (sample.code < 32 || sample.code === 127);
                      const isMapped = mappings.some(m => m.code === sample?.code);
                      return (
                        <div key={hex} className="group flex items-center justify-between bg-slate-800/80 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`w-10 h-10 flex items-center justify-center rounded-md font-mono text-lg font-bold border ${isControl ? 'bg-amber-900/40 text-amber-400 border-amber-500/20' : 'bg-indigo-900/40 text-indigo-400 border-indigo-500/20'}`}>
                              {sample?.char === ' ' || sample?.code === 8203 || sample?.code === 160 || isControl ? '·' : sample?.char}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200">U+{hex}</p>
                              <p className="text-[10px] text-slate-400 truncate">{sample?.name}</p>
                              {!isMapped && (
                                <button 
                                  onClick={() => { setActiveTab('mappings'); setNewChar(sample?.char || `U+${hex}`); }}
                                  className="text-[9px] text-amber-500/70 hover:text-amber-500 font-bold uppercase"
                                >
                                  + Create Mapping
                                </button>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-700 text-indigo-300 rounded text-[10px] font-black border border-indigo-500/30">×{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-indigo-100">Custom Mappings</h2>
                <button 
                  onClick={onResetMappings}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1 rounded border border-slate-700 font-bold transition-colors uppercase"
                >
                  RESET
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3 mb-6">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Add New Rule</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Target Char</label>
                    <input 
                      type="text" 
                      value={newChar}
                      onChange={(e) => setNewChar(e.target.value)}
                      placeholder="e.g. à"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Replacement</label>
                    <input 
                      type="text" 
                      value={newReplacement}
                      onChange={(e) => setNewReplacement(e.target.value)}
                      placeholder="e.g. a or ..."
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded uppercase tracking-widest transition-all"
                >
                  Add Mapping Rule
                </button>
              </form>

              <div className="space-y-2">
                {mappings.length === 0 ? (
                  <p className="text-center text-slate-600 text-[10px] py-8 font-bold italic">No mappings defined.</p>
                ) : (
                  mappings.map(mapping => {
                    const char = String.fromCodePoint(mapping.code);
                    const hex = mapping.code.toString(16).toUpperCase().padStart(4, '0');
                    const isRemoval = mapping.replacement === '';
                    
                    // Count actual visible characters for length check
                    const replacementChars = Array.from(mapping.replacement);
                    const isMultiChar = replacementChars.length > 1;
                    
                    const replacementCodes = (isRemoval || isMultiChar)
                      ? [] 
                      : replacementChars.map(c => c.charCodeAt(0));

                    return (
                      <div key={mapping.code} className="flex flex-col gap-2 bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between overflow-hidden">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="w-8 h-8 flex items-center justify-center bg-slate-900 rounded border border-slate-700 text-xs font-mono text-indigo-300">
                                {mapping.code < 32 || mapping.code === 127 || mapping.code === 8203 ? '·' : char}
                              </span>
                              <p className="text-[10px] font-bold text-slate-400">U+{hex}</p>
                            </div>
                            
                            <span className="text-slate-600 text-sm font-bold shrink-0">&rarr;</span>

                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`px-2 h-8 flex items-center justify-center rounded border font-mono text-xs font-bold whitespace-nowrap overflow-hidden ${
                                  isRemoval 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                {isRemoval ? 'REMOVE' : mapping.replacement}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {isRemoval ? (
                                  <span className="text-[9px] text-red-500 font-black uppercase"></span>
                                ) : (
                                  !isMultiChar && replacementCodes.map((code, idx) => (
                                    <span key={idx} className="text-[9px] font-bold text-slate-500 bg-slate-900 px-1 rounded">
                                      {code}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => onRemoveMapping(mapping.code)}
                            className="p-1.5 text-slate-600 hover:text-red-500 transition-all shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {ghostChars.length > 0 && activeTab === 'findings' && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20">
          <button
            onClick={onFix}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-xl active:scale-[0.98]"
          >
            Auto-Fix All Issues
          </button>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;

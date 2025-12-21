
import React, { useState, useCallback, useMemo } from 'react';
import Editor from './components/Editor.tsx';
import ControlPanel from './components/ControlPanel.tsx';
import { GhostCharacter, CheckMode, CharacterMapping } from './types.ts';

const DEFAULT_MAPPINGS: CharacterMapping[] = [
  { code: 8220, replacement: '"' }, // “
  { code: 8221, replacement: '"' }, // ”
  { code: 8216, replacement: "'" }, // ‘
  { code: 8217, replacement: "'" }, // ’
  { code: 8211, replacement: '-' }, // – (en dash)
  { code: 8212, replacement: '-' }, // — (em dash)
  { code: 8203, replacement: '.' },  // zero-width space
  { code: 160,  replacement: ' ' }, // non-breaking space
  { code: 8230, replacement: '...' }, // …
];

const App: React.FC = () => {
  const [code, setCode] = useState<string>(`Hi there! This is a general text example.
Sometimes when you copy-paste from Word or Google Docs, you get “smart quotes” instead of "straight quotes".
You might also find long dashes — like this em-dash — instead of a simple hyphen -.

Even invisible characters like a zero-width space​ (right there!) can cause issues when you paste this into other systems.
Non-breaking spaces are also common characters that look like regular spaces but aren't.

Enjoy using the debugger!`);
  
  const [checkMode, setCheckMode] = useState<CheckMode>(CheckMode.STRICT_ASCII);
  const [ghostChars, setGhostChars] = useState<GhostCharacter[]>([]);
  const [mappings, setMappings] = useState<CharacterMapping[]>(DEFAULT_MAPPINGS);

  const handleGhostCharsDetected = useCallback((chars: GhostCharacter[]) => {
    setGhostChars(chars);
  }, []);

  const handleCodeChange = (newVal: string) => {
    setCode(newVal.normalize('NFC'));
  };

  const mappingLookup = useMemo(() => {
    const lookup = new Map<number, string>();
    mappings.forEach(m => {
      lookup.set(m.code, m.replacement);
    });
    return lookup;
  }, [mappings]);

  const handleAutoFix = () => {
    let fixedCode = '';
    const limit = checkMode === CheckMode.STRICT_ASCII ? 127 : 255;
    
    // Robust iteration over characters (handles surrogate pairs correctly)
    for (const char of code) {
      const charCode = char.codePointAt(0);
      if (charCode === undefined) continue;

      const replacement = mappingLookup.get(charCode);
      
      // Priority 1: Check for explicit mapping (including mapping to empty string for removal)
      if (replacement !== undefined) {
        fixedCode += replacement;
      } else {
        // Priority 2: Check for problematic characters to remove/flag
        const isHiddenControl = (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) || charCode === 127;
        const isOutsideRange = charCode > limit;

        if (isOutsideRange || isHiddenControl) {
          // Unmapped problematic character: remove it
          fixedCode += '';
        } else {
          // Safe character: keep it
          fixedCode += char;
        }
      }
    }
    setCode(fixedCode);
  };

  const handleResetMappings = () => {
    setMappings(DEFAULT_MAPPINGS);
  };

  const handleAddMapping = (code: number, replacement: string) => {
    setMappings(prev => {
      const filtered = prev.filter(m => m.code !== code);
      return [...filtered, { code, replacement }];
    });
  };

  const handleRemoveMapping = (code: number) => {
    setMappings(prev => prev.filter(m => m.code !== code));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              GHOST<span className="text-indigo-400">CHAR</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${ghostChars.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">
              {ghostChars.length > 0 ? `${ghostChars.length} ISSUES` : 'CLEAN'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        <div className="flex-[2] lg:flex-1 p-4 sm:p-8 flex flex-col gap-4 min-h-[400px] lg:min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Text Input</h2>
            <button 
              onClick={() => setCode('')}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors uppercase font-bold"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 relative">
            <Editor 
              value={code} 
              onChange={handleCodeChange} 
              checkMode={checkMode} 
              onGhostCharsDetected={handleGhostCharsDetected}
            />
          </div>
        </div>

        <ControlPanel 
          checkMode={checkMode} 
          setCheckMode={setCheckMode}
          ghostChars={ghostChars}
          mappings={mappings}
          onFix={handleAutoFix}
          onAddMapping={handleAddMapping}
          onRemoveMapping={handleRemoveMapping}
          onResetMappings={handleResetMappings}
        />
      </main>
    </div>
  );
};

export default App;

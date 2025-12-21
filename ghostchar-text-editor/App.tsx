
import React, { useState, useCallback } from 'react';
import Editor from './components/Editor.tsx';
import ControlPanel from './components/ControlPanel.tsx';
import { GhostCharacter, CheckMode } from './types.ts';

const App: React.FC = () => {
  const [code, setCode] = useState<string>(`Hi there! This is a general text example.
Sometimes when you copy-paste from Word or Google Docs, you get “smart quotes” instead of "straight quotes".
You might also find long dashes — like this em-dash — instead of a simple hyphen -.

Even invisible characters like a zero-width space​ (right there!) can cause issues when you paste this into other systems.
Non-breaking spaces are also common characters that look like regular spaces but aren't.

Enjoy using the debugger!`);
  const [checkMode, setCheckMode] = useState<CheckMode>(CheckMode.STRICT_ASCII);
  const [ghostChars, setGhostChars] = useState<GhostCharacter[]>([]);

  const handleGhostCharsDetected = useCallback((chars: GhostCharacter[]) => {
    setGhostChars(chars);
  }, []);

  const handleAutoFix = () => {
    const mapping: Record<number, string> = {
      8220: '"', // “
      8221: '"', // ”
      8216: "'", // ‘
      8217: "'", // ’
      8211: '-', // – (en dash)
      8212: '-', // — (em dash)
      8203: '',  // zero-width space
      160: ' ',  // non-breaking space
      8230: '...', // …
    };

    let fixedCode = '';
    const limit = checkMode === CheckMode.STRICT_ASCII ? 127 : 255;
    
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      if (charCode > limit) {
        fixedCode += mapping[charCode] !== undefined ? mapping[charCode] : '';
      } else {
        fixedCode += code[i];
      }
    }
    
    setCode(fixedCode);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              GHOST<span className="text-indigo-400">CHAR</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-none">Text encoding debugger</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${ghostChars.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {ghostChars.length > 0 ? `${ghostChars.length} NON-STANDARD CHARS` : 'TEXT IS CLEAN'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 p-4 sm:p-8 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Text Input</h2>
            <button 
              onClick={() => setCode('')}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors uppercase font-bold"
            >
              Clear Editor
            </button>
          </div>
          <div className="flex-1 relative min-h-0">
            <Editor 
              value={code} 
              onChange={setCode} 
              checkMode={checkMode} 
              onGhostCharsDetected={handleGhostCharsDetected}
            />
          </div>
        </div>

        <ControlPanel 
          checkMode={checkMode} 
          setCheckMode={setCheckMode}
          ghostChars={ghostChars}
          onFix={handleAutoFix}
        />
      </main>
    </div>
  );
};

export default App;

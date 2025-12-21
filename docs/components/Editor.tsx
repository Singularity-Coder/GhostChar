
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GhostCharacter, CheckMode } from '../types.ts';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  checkMode: CheckMode;
  onGhostCharsDetected: (chars: GhostCharacter[]) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, checkMode, onGhostCharsDetected }) => {
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const getCharName = (code: number): string => {
    if (code === 8203) return 'Zero-Width Space';
    if (code === 160) return 'Non-Breaking Space';
    if (code >= 8211 && code <= 8212) return 'Special Dash';
    if (code >= 8220 && code <= 8223) return 'Smart Quote';
    if (code === 8230) return 'Ellipsis';
    if (code < 32) return 'Control Character';
    if (code === 127) return 'Delete Character';
    if (code > 0xFFFF) return 'Extended Unicode';
    return 'Unicode Character';
  };

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const processContent = useCallback(() => {
    const chars: GhostCharacter[] = [];
    const limit = checkMode === CheckMode.STRICT_ASCII ? 127 : 255;
    
    let html = '';
    let idx = 0;
    
    // Using for...of ensures we process full Unicode characters (surrogate pairs)
    for (const char of value) {
      const code = char.codePointAt(0)!;
      
      const isHiddenControl = (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
      const isOutsideRange = code > limit;
      const isZeroWidth = code === 8203;

      if (isOutsideRange || isHiddenControl) {
        chars.push({
          char,
          code,
          hex: code.toString(16).toUpperCase().padStart(4, '0'),
          index: idx,
          name: getCharName(code)
        });
        
        const name = getCharName(code);
        const hexStr = code.toString(16).toUpperCase();
        const tooltip = `${name} (U+${hexStr})`;
        const bgColor = isHiddenControl ? 'bg-amber-500/40 border-amber-500' : 'bg-red-500/40 border-red-500';
        
        if (isZeroWidth) {
          html += `<span class="ghost-marker-zero" title="${tooltip}"></span>`;
        } else {
          html += `<span class="ghost-marker ${bgColor}" title="${tooltip}">${escapeHtml(char)}</span>`;
        }
      } else {
        if (char === '\n') {
          html += '\n';
        } else {
          html += escapeHtml(char);
        }
      }
      idx += char.length; // surrogate pairs have length 2
    }

    setHighlightedHtml(html);
    onGhostCharsDetected(chars);
  }, [value, checkMode, onGhostCharsDetected]);

  useEffect(() => {
    processContent();
  }, [processContent]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  useEffect(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [highlightedHtml]);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      <div 
        ref={backdropRef}
        className="absolute inset-0 p-6 pointer-events-none whitespace-pre-wrap break-words overflow-y-scroll text-transparent z-0 select-none hide-scrollbar"
        style={{ 
          fontVariantLigatures: 'none',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          boxSizing: 'border-box',
          textRendering: 'optimizeSpeed'
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml + (value.endsWith('\n') ? '\n' : '') }}
        aria-hidden="true"
      />
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className="absolute inset-0 w-full h-full p-6 bg-transparent text-slate-300 resize-none outline-none z-10 whitespace-pre-wrap break-words overflow-y-scroll custom-caret appearance-none m-0 border-none"
        style={{ 
          fontVariantLigatures: 'none',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          boxSizing: 'border-box',
          textRendering: 'optimizeSpeed'
        }}
        placeholder="Paste your code or text here..."
      />

      <style>{`
        .custom-caret {
          caret-color: #818cf8;
        }
        
        textarea, .absolute {
          font-family: 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace !important;
          line-height: 1.6 !important;
          font-size: 14px !important;
          letter-spacing: normal !important;
          word-spacing: normal !important;
          tab-size: 4;
          font-feature-settings: "liga" 0;
        }

        .ghost-marker {
          border-bottom: 2px solid currentColor;
          border-radius: 1px;
          display: inline;
        }

        .ghost-marker-zero {
          display: inline-block;
          width: 0;
          position: relative;
          vertical-align: middle;
        }

        .ghost-marker-zero::after {
          content: '·';
          position: absolute;
          left: -6px;
          top: -0.8em;
          width: 12px;
          height: 1.6em;
          background: rgba(239, 68, 68, 0.45);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.2em;
          pointer-events: auto;
          border-radius: 3px;
          border: 1px solid rgba(239, 68, 68, 0.6);
          animation: ghost-pulse 2s infinite ease-in-out;
        }

        @keyframes ghost-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        textarea::-webkit-scrollbar, .absolute::-webkit-scrollbar {
          width: 12px;
        }
        textarea::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
      `}</style>
    </div>
  );
};

export default Editor;

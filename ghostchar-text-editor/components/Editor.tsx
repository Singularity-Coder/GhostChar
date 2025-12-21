
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
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      const code = value.charCodeAt(i);
      
      // Detection Logic: 
      // 1. Outside defined ASCII range (127 or 255)
      // 2. Control characters (0-31) except common formatting: Tab (9), LF (10), CR (13)
      const isHiddenControl = (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
      const isOutsideRange = code > limit;

      if (isOutsideRange || isHiddenControl) {
        chars.push({
          char,
          code,
          hex: code.toString(16).toUpperCase().padStart(4, '0'),
          index: i,
          name: getCharName(code)
        });
        
        // Visual replacement for invisible/non-rendering chars in the highlight layer
        const isInvisible = isHiddenControl || code === 8203 || code === 160;
        const displayChar = isInvisible ? '·' : char;
        const escaped = escapeHtml(displayChar);
        
        const bgColor = isHiddenControl ? 'bg-amber-500/50 border-amber-500' : 'bg-red-500/50 border-red-500';
        
        // Wrap highlighted char in a span. 
        // Use inline-block or similar to ensure background and border-bottom show clearly.
        html += `<span class="${bgColor} border-b-2 rounded-sm" title="${getCharName(code)} (U+${code.toString(16).toUpperCase()})">${escaped === ' ' ? '&nbsp;' : escaped}</span>`;
      } else {
        if (char === '\n') {
          html += '\n';
        } else if (char === ' ') {
          // Use a normal space but ensure it's wrapped or handled by pre-wrap
          html += ' ';
        } else {
          html += escapeHtml(char);
        }
      }
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

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden font-mono text-sm leading-[1.6]">
      {/* 
          BACKDROP LAYER: 
          Must perfectly mirror the textarea's layout properties.
      */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 p-5 pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-transparent z-0 box-border border-none m-0"
        style={{ 
          fontVariantLigatures: 'none',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml + (value.endsWith('\n') ? '\n' : '') }}
        aria-hidden="true"
      />
      
      {/* 
          INPUT LAYER:
          Transparent background so the highlights from the backdrop show through.
      */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className="absolute inset-0 w-full h-full p-5 bg-transparent text-slate-300 resize-none outline-none z-10 whitespace-pre-wrap break-words overflow-auto custom-caret box-border border-none appearance-none m-0"
        style={{ 
          fontVariantLigatures: 'none',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
        placeholder="Paste your text here to scan for non-standard characters..."
      />

      <style>{`
        .custom-caret {
          caret-color: #818cf8;
        }
        /* Strict font consistency is key for layout alignment */
        textarea, .absolute {
          font-family: 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace !important;
          line-height: 1.6 !important;
          font-size: 14px !important;
          letter-spacing: normal !important;
        }
        /* Avoid browser scrollbar offsets in hidden layer */
        .pointer-events-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Editor;

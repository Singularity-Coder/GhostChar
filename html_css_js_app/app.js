const CheckMode = {
  STRICT_ASCII: 'STRICT_ASCII',
  EXTENDED_ASCII: 'EXTENDED_ASCII',
};

const defaultText = `Hi there! This is a general text example.
Sometimes when you copy-paste from Word or Google Docs, you get “smart quotes” instead of "straight quotes".
You might also find long dashes — like this em-dash — instead of a simple hyphen -.

Even invisible characters like a zero-width space​ (right there!) can cause issues when you paste this into other systems.
Non-breaking spaces are also common characters that look like regular spaces but aren't.

Enjoy using the debugger!`;

const init = () => {
  const state = {
    code: defaultText,
    checkMode: CheckMode.STRICT_ASCII,
    ghostChars: [],
  };

  const codeInput = document.getElementById('codeInput');
  const highlightLayer = document.getElementById('highlightLayer');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const modeDescription = document.getElementById('modeDescription');
  const modeButtons = Array.from(document.querySelectorAll('[data-mode]'));
  const cleanState = document.getElementById('cleanState');
  const findingsContent = document.getElementById('findingsContent');
  const breakdownList = document.getElementById('breakdownList');
  const totalIssues = document.getElementById('totalIssues');
  const uniqueTypes = document.getElementById('uniqueTypes');
  const autoFixBtn = document.getElementById('autoFixBtn');
  const clearEditorBtn = document.getElementById('clearEditor');

  const baseModeClasses = 'mode-button';

  const requiredElements = [
    codeInput,
    highlightLayer,
    statusDot,
    statusText,
    modeDescription,
    cleanState,
    findingsContent,
    breakdownList,
    totalIssues,
    uniqueTypes,
    autoFixBtn,
    clearEditorBtn,
  ];

  if (requiredElements.some((el) => !el)) {
    console.error('GhostChar: required DOM elements are missing.');
    return;
  }
  if (modeButtons.length === 0) {
    console.error('GhostChar: mode buttons are missing.');
    return;
  }

  codeInput.value = state.code;

  const escapeHtml = (unsafe) =>
    unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const getCharName = (code) => {
    if (code === 8203) return 'Zero-Width Space';
    if (code === 160) return 'Non-Breaking Space';
    if (code >= 8211 && code <= 8212) return 'Special Dash';
    if (code >= 8220 && code <= 8223) return 'Smart Quote';
    if (code === 8230) return 'Ellipsis';
    if (code < 32) return 'Control Character';
    if (code === 127) return 'Delete Character';
    return 'Unicode Character';
  };

  const syncScroll = () => {
    highlightLayer.scrollTop = codeInput.scrollTop;
    highlightLayer.scrollLeft = codeInput.scrollLeft;
  };

  const updateStatus = () => {
    const hasIssues = state.ghostChars.length > 0;
    statusDot.className = `status-dot ${hasIssues ? 'status-dot-issue status-pulse' : 'status-dot-clean'}`;
    statusText.textContent = hasIssues
      ? `${state.ghostChars.length} NON-STANDARD CHARS`
      : 'TEXT IS CLEAN';
  };

  const renderFindings = () => {
    const issueCount = state.ghostChars.length;
    const counts = new Map();
    state.ghostChars.forEach((char) => {
      counts.set(char.hex, (counts.get(char.hex) || 0) + 1);
    });
    const uniqueHexes = Array.from(counts.keys());

    if (issueCount === 0) {
      cleanState.classList.remove('hidden');
      findingsContent.classList.add('hidden');
      autoFixBtn.disabled = false;
      breakdownList.innerHTML = '';
      updateStatus();
      return;
    }

    cleanState.classList.add('hidden');
    findingsContent.classList.remove('hidden');

    totalIssues.textContent = issueCount;
    uniqueTypes.textContent = uniqueHexes.length;

    autoFixBtn.disabled = false;
    breakdownList.innerHTML = '';

    uniqueHexes.slice(0, 30).forEach((hex) => {
      const sample = state.ghostChars.find((c) => c.hex === hex);
      const count = counts.get(hex);
      const isControl = sample && (sample.code < 32 || sample.code === 127);
      const displayChar =
        sample && (sample.char === ' ' || sample.code === 8203 || sample.code === 160 || isControl)
          ? '·'
          : sample?.char || '';

      const wrapper = document.createElement('div');
      wrapper.className = 'ghost-card';

      const left = document.createElement('div');
      left.className = 'ghost-card-left';

      const bubble = document.createElement('span');
      bubble.className = isControl ? 'ghost-bubble ghost-bubble-control' : 'ghost-bubble';
      bubble.textContent = displayChar;

      const textWrap = document.createElement('div');
      const codeLabel = document.createElement('p');
      codeLabel.className = 'ghost-code';
      codeLabel.textContent = `U+${hex}`;

      const nameLabel = document.createElement('p');
      nameLabel.className = 'ghost-name';
      nameLabel.textContent = sample?.name || 'Unicode Character';

      textWrap.appendChild(codeLabel);
      textWrap.appendChild(nameLabel);

      left.appendChild(bubble);
      left.appendChild(textWrap);

      const right = document.createElement('div');
      right.className = 'ghost-card-right';

      const countBadge = document.createElement('span');
      countBadge.className = 'ghost-count';
      countBadge.textContent = `×${count}`;

      right.appendChild(countBadge);

      wrapper.appendChild(left);
      wrapper.appendChild(right);

      breakdownList.appendChild(wrapper);
    });

    updateStatus();
  };

  const processContent = () => {
    const value = codeInput.value;
    state.code = value;
    const limit = state.checkMode === CheckMode.STRICT_ASCII ? 127 : 255;

    const chars = [];
    let html = '';

    for (let i = 0; i < value.length; i += 1) {
      const char = value[i];
      const code = value.charCodeAt(i);

      const isHiddenControl = (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
      const isOutsideRange = code > limit;

      if (isOutsideRange || isHiddenControl) {
        const hex = code.toString(16).toUpperCase().padStart(4, '0');
        chars.push({
          char,
          code,
          hex,
          index: i,
          name: getCharName(code),
        });

        const isInvisible = isHiddenControl || code === 8203 || code === 160;
        const displayChar = isInvisible ? '·' : char;
        const escaped = escapeHtml(displayChar);
        const bgColor = isHiddenControl ? 'ghost-highlight ghost-highlight-control' : 'ghost-highlight';
        const content = escaped === ' ' ? '&nbsp;' : escaped;

        html += `<span class="${bgColor}" title="${getCharName(code)} (U+${hex})">${content}</span>`;
      } else {
        if (char === '\n') {
          html += '\n';
        } else if (char === ' ') {
          html += ' ';
        } else {
          html += escapeHtml(char);
        }
      }
    }

    state.ghostChars = chars;
    highlightLayer.innerHTML = html + (value.endsWith('\n') ? '\n' : '');
    syncScroll();
    renderFindings();
  };

  const setCheckMode = (mode, skipProcess = false) => {
    state.checkMode = mode;
    modeButtons.forEach((button) => {
      const isActive = button.dataset.mode === mode;
      button.className = `${baseModeClasses}${isActive ? ' active' : ''}`;
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    modeDescription.textContent =
      mode === CheckMode.STRICT_ASCII
        ? 'Highlights characters > 127 and hidden control codes.'
        : 'Highlights characters > 255 and hidden control codes.';

    if (!skipProcess) {
      processContent();
    }
  };

  const handleAutoFix = () => {
    const mapping = {
      8220: '"',
      8221: '"',
      8216: "'",
      8217: "'",
      8211: '-',
      8212: '-',
      8203: '',
      160: ' ',
      8230: '...',
    };

    let fixedCode = '';
    const limit = state.checkMode === CheckMode.STRICT_ASCII ? 127 : 255;

    for (let i = 0; i < state.code.length; i += 1) {
      const charCode = state.code.charCodeAt(i);
      if (charCode > limit) {
        fixedCode += mapping[charCode] !== undefined ? mapping[charCode] : '';
      } else {
        fixedCode += state.code[i];
      }
    }

    state.code = fixedCode;
    codeInput.value = fixedCode;
    processContent();
  };

  const clearEditor = () => {
    state.code = '';
    codeInput.value = '';
    processContent();
  };

  codeInput.addEventListener('input', processContent);
  codeInput.addEventListener('scroll', syncScroll);
  autoFixBtn.addEventListener('click', handleAutoFix);
  clearEditorBtn.addEventListener('click', clearEditor);
  modeButtons.forEach((button) =>
    button.addEventListener('click', () => setCheckMode(button.dataset.mode))
  );

  setCheckMode(state.checkMode, true);
  processContent();
  syncScroll();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

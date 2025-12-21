
import { CharacterMapping, CheckMode } from '../types.ts';

export interface TestResult {
  name: string;
  passed: boolean;
  actual: string;
  expected: string;
}

export function runLogicTests(mappings: CharacterMapping[], checkMode: CheckMode): TestResult[] {
  const mappingLookup = new Map<number, string>();
  mappings.forEach(m => mappingLookup.set(m.code, m.replacement));

  const fixLogic = (input: string) => {
    let output = '';
    const limit = checkMode === CheckMode.STRICT_ASCII ? 127 : 255;
    const chars = Array.from(input);
    for (const char of chars) {
      const charCode = char.codePointAt(0);
      if (charCode === undefined) continue;
      const replacement = mappingLookup.get(charCode);
      if (replacement !== undefined) {
        output += replacement;
      } else {
        const isHiddenControl = (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) || charCode === 127;
        const isOutsideRange = charCode > limit;
        if (isOutsideRange || isHiddenControl) {
          output += '';
        } else {
          output += char;
        }
      }
    }
    return output;
  };

  const cases = [
    { name: "Smart Quotes", input: "“Hello”", expected: '"Hello"' },
    { name: "Multi-Char Ellipsis", input: "Finish…", expected: "Finish..." },
    { name: "Zero-Width Space", input: "ZWS\u200Bfixed", expected: "ZWS.fixed" },
    { name: "Removal Logic", input: "Invisible\u0007control", expected: "Invisiblecontrol" },
    { name: "Mixed String", input: "‘Dash—’", expected: "'-'" },
  ];

  return cases.map(c => ({
    name: c.name,
    actual: fixLogic(c.input),
    expected: c.expected,
    passed: fixLogic(c.input) === c.expected
  }));
}
